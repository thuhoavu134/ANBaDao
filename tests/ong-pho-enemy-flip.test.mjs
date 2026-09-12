import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const battle = readFileSync(join(root, 'battle.html'), 'utf8');
const drawUnit = (battle.match(/function drawUnit\([\s\S]*?function drawUnitHud/) || [''])[0];
const ongPho = (battle.match(/function drawOngPhoGifHero\([\s\S]*?function drawThayMoIdleQa/) || [''])[0];
const generated = (battle.match(/function drawGeneratedHero\([\s\S]*?function drawUnit\(/) || [''])[0];

test('L80-T1: drawUnit flips every enemy body toward the left', () => {
  assert.match(drawUnit, /function drawUnit/);
  assert.match(
    drawUnit,
    /if \(unit\.team === TEAM_ENEMY\) context\.scale\(-1, 1\);\s*if \(drawOngPhoGifHero/
  );
});

test('L80-T2: authored body drawers do not double-flip', () => {
  assert.doesNotMatch(ongPho, /context\.scale\(-1/);
  assert.match(battle, /drawDinhLoiAtlasFrame\(context,DINH_LOI_IMAGES\[key\],frame,0,0,620,348,\{baseline:42\}\)/);
  assert.match(battle, /drawLucAnhAtlas\(context,key,frame,0,0,330,330,\{baseline:48\}\)/);
  assert.doesNotMatch(generated, /usePoseAtlas && unit\.team === TEAM_ENEMY/);
});

test('L80-T3: isOngPho matches tower NPC sourceHeroId', () => {
  assert.match(battle, /function isOngPho\(unit\)\{[^}]*sourceHeroId === ONG_PHO_CANONICAL_HERO_ID/);
  assert.match(readFileSync(join(root, 'src/domain/tower/tower-npc-team.mjs'), 'utf8'), /'ong_hang_pho'/);
});
