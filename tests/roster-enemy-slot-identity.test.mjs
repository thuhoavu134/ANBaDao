import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
const host=readFileSync('dist/index.html','utf8');
function bridge(html){const a=html.indexOf('  function prepareTeam('),b=html.indexOf('  function poolHeroToBattle(',a);assert.ok(a>=0&&b>a);return vm.runInNewContext(html.slice(a,b)+';prepareTeam',{safeText:(v,f)=>String(v??f),clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),normalizeCombatant:(u,team,slot)=>({...u,team,slot})});}
const wave=()=>Array.from({length:6},(_,slot)=>({id:'mob'+slot,sourceHeroId:'thay_mo',rosterEnemy:true,slot,hp:500+slot*100,atk:90+slot}));
test('battle bridge retains six enemy instances sharing one roster identity',()=>{const units=wave(),result=bridge(host)(units,'enemy');assert.equal(result.length,6);assert.deepEqual(Array.from(result,u=>u.slot),[0,1,2,3,4,5]);assert.deepEqual(Array.from(result,u=>u.hp),units.map(u=>u.hp));});
test('player roster still rejects duplicate heroes; enemy duplicate slot is rejected',()=>{const prepare=bridge(host);assert.equal(prepare(wave(),'player').length,1);assert.equal(prepare([{...wave()[0]},{...wave()[1],sourceHeroId:"lac_yen",slot:0}],'enemy').length,1);});
test('enemy source order supplies distinct slots when explicit slots are absent',()=>{const units=wave().map(({slot,...u})=>u);assert.equal(bridge(host)(units,'enemy').length,6);});

test("slot patch is idempotent and rejects missing build anchors",async()=>{const{patchRosterEnemySlots}=await import("../scripts/roster-enemies-size-v1.mjs");assert.equal(patchRosterEnemySlots(host),host);assert.throws(()=>patchRosterEnemySlots("<html></html>"));});
