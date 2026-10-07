import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const runtime=readFileSync(new URL('../src/runtime/battle-instant-skip.js',import.meta.url),'utf8');
function harness(){const events=[],timers=new Map();let serial=0;const button={setAttribute(){},disabled:false};const box={state:{mode:'battle',battleId:7,locked:true,sound:true,auto:false},window:{},AbortController,Promise,setTimeout:(fn)=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id),document:{body:{classList:{add(){},remove(){}},append(){}},getElementById:id=>id==='embeddedSkipButton'?button:null,createElement:()=>({setAttribute(){},style:{}})},getUnit:()=>null,decideAi:()=>null,performAction:()=>events.push('action'),addLog:()=>{},EMBEDDED:true};vm.createContext(box);vm.runInContext(runtime,box);return {box,timers,events};}
test('the real skip button requests irreversible finish, not speed or an animation toggle',()=>{
 const battle=readFileSync(process.env.SKIP_TEST_BATTLE||new URL('../dist/battle.html',import.meta.url),'utf8');
 const anchor='document.getElementById("embeddedSkipButton")?.addEventListener("click", () => {';
 const start=battle.indexOf(anchor);assert.ok(start>=0);const end=battle.indexOf('\n  });',start);
 const {box}=harness();vm.runInContext(battle.slice(start+anchor.length,end),box);
 assert.equal(box.state.instantSkip,7);assert.equal(box.state.auto,true);
});
test('skip wakes an existing wait, is idempotent and retains battle ID',async()=>{
 const {box,timers}=harness();const pending=box.__hvSkipWait(9000,7);assert.equal(timers.size,1);
 assert.equal(box.__hvRequestBattleSkip(),true);assert.equal(await pending,true);assert.equal(timers.size,0);
 assert.equal(box.__hvRequestBattleSkip(),false);assert.equal(box.state.battleId,7);
 box.state.mode='result';box.__hvFinishSkip();assert.equal(box.state.sound,true);assert.equal(box.__hvRequestBattleSkip(),false);
});
test('skip releases a late visual lease and does not start subsequent image loads',async()=>{
 const {box}=harness();let complete,released=0,loads=0;
 const pending=box.__hvSkipVisualAssets(()=>new Promise(r=>{complete=r;}),7);await Promise.resolve();
 box.__hvRequestBattleSkip();const lease=await pending;assert.equal(typeof lease.release,'function');complete({release:()=>released++});await Promise.resolve();await Promise.resolve();assert.equal(released,1);
 await box.__hvSkipVisualAssets(()=>{loads++;},7);assert.equal(loads,0);
});
test('skip resumes a paused manual turn through the existing AI owner exactly once',()=>{
 const {box}=harness();const actor={id:'ally',hp:100};let resumed=0;
 box.state.locked=false;box.state.currentId=actor.id;box.getUnit=()=>actor;
 box.__hvRunAiTurn=(unit,id)=>{assert.equal(unit,actor);assert.equal(id,7);assert.equal(box.state.locked,true);resumed++;};
 box.__hvRequestBattleSkip();box.__hvRequestBattleSkip();assert.equal(resumed,1);
});
