import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { patchBattleDefeatExit } from '../scripts/battle-defeat-exit-v1.mjs';

const html = patchBattleDefeatExit(readFileSync('dist/battle.html', 'utf8'));
const between = (a,b) => { const i=html.indexOf(a),j=html.indexOf(b,i); assert.ok(i>=0&&j>i,a); return html.slice(i,j); };
function runtime(kind, speed=1) {
  const c={ window:{}, state:{mode:'battle'}, performance:{now:()=>100}, DEFEAT_HIDE_MS:1000, DEFEAT_FALL_MS:320,
    REFERENCE_SIMPLE:true, ONG_PHO_FALL_MS:1600, DINH_LOI_FALL_MS:4000,
    LUC_ANH_META:{defeated:{frames:64,ms:34}}, lucAnhPlaybackRate:()=>speed,
    Core:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),defeatAnimation:(elapsed,hide,fall)=>({visible:elapsed<hide,fallProgress:Math.min(1,elapsed/fall),alpha:1})},
    linhDongActionMs:()=>4032, bachDienActionMs:()=>3000,
    isOngPho:u=>u.kind==='pho',isDinhLoi:u=>u.kind==='dinh',isLucAnh:u=>u.kind==='luc',
    isLinhDong:u=>u.kind==='linh',isBachDien:u=>u.kind==='bach',
    setUnitState:(u,s)=>{u.state=s;u.stateStarted=100;} };
  vm.createContext(c);
  vm.runInContext(between('  function defeatDuration(', '  function markDefeated('),c);
  vm.runInContext(between('  function __hvMarkDefeated3qAdapter(', '  function battleHasWinner('),c);
  const unit={hp:0,kind};c.__hvMarkDefeated3qAdapter(unit);return {c,unit};
}

test('all hero kinds play their fall then disappear, with no held corpse',()=>{
  for(const [kind,duration] of [['generic',320],['pho',1600],['dinh',4000],['luc',2176],['linh',4032],['bach',3000]]){
    const {c,unit}=runtime(kind);
    assert.equal(unit.defeatFallDuration,duration,kind);
    assert.equal(c.defeatState(unit,100+duration-1).visible,true,kind+' full fall');
    assert.equal(c.defeatState(unit,100+duration-1).alpha,1,kind+' no early fade');
    assert.equal(c.defeatState(unit,100+duration).visible,false,kind+' no hold');
    assert.equal(c.defeatState({...unit,hp:1},99999).visible,true,'revived hero is visible');
  }
});

test('dead S+ bodies and hunt forms cannot bypass the common draw exit',()=>{
  const prefix=between('  function drawUnit(context, unit, time) {','    const alive = unit.hp > 0;');
  let draws=0;
  const c={state:{},isCombatFocusUnitVisible:()=>true,defeatState:()=>({visible:false}),
    drawUnitHud(){},REDUCED_MOTION:false,
    drawSplusToken:()=>{draws++;},honVietDrawHuntUnit:()=>{draws++;},honVietInferHuntForm:()=>null};
  vm.createContext(c);vm.runInContext(prefix+'\n}',c);
  for(const team of ['player','enemy']){
    c.drawUnit({}, {id:'s',team,hp:0,kitVersion:'splus42-v2'},10000);
    c.drawUnit({}, {id:'h',team,hp:0,huntForm:'boss'},10000);
  }
  assert.equal(draws,0);
  c.drawUnit({}, {id:'s',hp:1,kitVersion:'splus42-v2'},10000);
  assert.equal(draws,1,'a living or revived S+ hero still draws');
});

test('battle result waits for the fall, then exits without a corpse hold',async()=>{
  const {c,unit}=runtime('linh');c.units=[unit];c.state.battleId=7;
  vm.runInContext(between('  function remainingDefeatTime(', '  function waitRealTime('),c);
  vm.runInContext(between('  async function waitForDefeatExit(', '  function resetBattleState('),c);
  let waited=0;c.waitRealTime=async ms=>{waited+=ms;return true;};
  assert.equal(await c.waitForDefeatExit(7),true);assert.equal(waited,4032);
  c.performance.now=()=>4132;waited=0;
  assert.equal(await c.waitForDefeatExit(7),true);assert.equal(waited,0);
  c.state.battleId=8;assert.equal(await c.waitForDefeatExit(7),false);
  assert.equal(patchBattleDefeatExit(html),html);
});

test('Luc Anh fall duration matches its playback rate and repeated death does not restart',()=>{
  for(const speed of [1,2,3]){
    const {c,unit}=runtime('luc',speed);
    assert.equal(unit.defeatFallDuration,2176/speed);
    const before=JSON.stringify(unit);c.__hvMarkDefeated3qAdapter(unit);assert.equal(JSON.stringify(unit),before);
  }
});
