import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const battle = fs.readFileSync(new URL('../battle.html', import.meta.url), 'utf8');

test('every runtime unit receives a stable team-and-slot home anchor', () => {
  assert.match(battle, /homeAnchorId: `\$\{hero\.team\}:slot-\$\{hero\.slot\}`/);
  assert.match(battle, /homeAnchor: \{ x: position\.x, y: position\.y \}/);
});

test('movement profiles distinguish contact actions from stationary ranged actions', () => {
  for (const profile of ['contact','contactCombo','stationaryProjectile','stationaryCast','battlefieldCinematic']) {
    assert.ok(battle.includes(`${profile}: Object.freeze(`), profile);
  }
  assert.match(battle, /if \(!profile\.movesToTarget\) return \{ x: actor\.baseX, y: actor\.baseY \}/);
  assert.match(battle, /\['bow','staff','fan'\]\.includes\(actor\?\.weapon\)/);
});

test('damage, critical, healing and HP presentation follow impact-readable rules', () => {
  assert.match(battle, /BẠO KÍCH −\$\{amount\}/);
  assert.match(battle, /colors: Object\.freeze\(\{ damage: "#fff7e8", critical: "#ffc94f", heal: "#70efae"/);
  assert.match(battle, /displayHp: hero\.hp/);
  assert.match(battle, /hpTweenMs: 220/);
  assert.match(battle, /unit\.displayHp=unit\.hp;unit\.hpTween=null/);
});

test('future hero tooling exposes resolved profiles and home anchor', () => {
  assert.match(battle, /getCombatPresentationStandard: \(\) => COMBAT_PRESENTATION_STANDARD/);
  assert.match(battle, /presentationProfiles: \{ basic: combatPresentationProfileFor/);
});
