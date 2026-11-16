import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as layout from '../scripts/battle-formation-scale-v1.mjs';
test('portrait separates allied columns while keeping a reference-proportion center lane',()=>{
 for(const [w,h] of [[390,684],[390,739],[393,747],[430,827]]){
  const f=layout.battleFormationForViewport(w,h),columns=f.player[0].x-f.player[3].x,center=f.enemy[0].x-f.player[0].x;
  assert.ok(columns>=90,'allied columns need room for the 72px HP bar');
  assert.ok(center/columns>=1.3&&center/columns<=1.8,'central gap should not dwarf the allied columns');
  assert.equal(f.player[3].x,640,'keep outer edge anchor');
  assert.equal(layout.BATTLE_CHARACTER_SCALE.portrait,.34);
 }
});
test('compact HUD lane fits within allied columns',()=>{
 assert.equal(typeof layout.patchCompactBattleHud,'function');
 const source=readFileSync(new URL('../battle.html',import.meta.url),'utf8');
 const patched=layout.patchCompactBattleHud(source);
 assert.match(patched,/iconSize=compact\?16:23/);
 assert.match(patched,/gap=compact\?18:28/);
 // HUD height now follows the projected body top (single presentation owner), 18px above it.
 assert.match(patched,/const y = battleCharacterBody\(unit\)\.topY - 18;/);
 assert.equal(layout.patchCompactBattleHud(patched),patched);
});
test('spirit mark and stealth have explicit semantic artwork instead of letter badges',()=>{
 const source=readFileSync(new URL('../scripts/splus-runtime-v1.mjs',import.meta.url),'utf8');
 assert.match(source,/spiritMark:.*spirit-mark\.svg/);
 assert.match(source,/stealth:.*stealth\.svg/);
 for(const name of ['spirit-mark','stealth']){
  const svg=readFileSync(new URL('../assets/ui/status/'+name+'.svg',import.meta.url),'utf8');
  assert.match(svg,/<title>/);assert.doesNotMatch(svg,/<text/);
 }
});
