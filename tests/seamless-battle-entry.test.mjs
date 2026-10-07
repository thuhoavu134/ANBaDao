import test from 'node:test';
import assert from 'node:assert/strict';
import {primeBattleEntry} from '../scripts/seamless-battle-entry-v1.mjs';
function env(search='',config=null){
 const classes=new Set(),props={};
 return {classes,props,location:{search},name:config?'hvBattleConfig:'+encodeURIComponent(JSON.stringify(config)):'',document:{documentElement:{classList:{add:(...xs)=>xs.forEach(x=>classes.add(x))},style:{setProperty:(k,v)=>props[k]=v}}},sessionStorage:{getItem:()=>null}};
}
test('automatic top-level entry suppresses intro before body paint and retains battlefield backdrop',()=>{
 const e=env('?embedded=1&autostart=1',{entryBackdrop:'url("assets/bg.webp")'});
 assert.equal(primeBattleEntry(e),true);assert.ok(e.classes.has('hv-auto-entry'));assert.ok(e.classes.has('hv-entry-boot'));assert.equal(e.props['--hv-entry-backdrop'],'url("assets/bg.webp")');
});
test('manual battle and status QA retain their deliberate intro/fixture surface',()=>{
 for(const search of ['', '?autostart=1', '?qa=status-icons&embedded=1']){const e=env(search);assert.equal(primeBattleEntry(e),false);assert.equal(e.classes.size,0);}
});
test('iframe config transport and unavailable storage both fail open',()=>{
 const e=env();e.frameElement={dataset:{config:JSON.stringify({autoStart:true,embedded:true})}};assert.equal(primeBattleEntry(e),true);
 const denied=env('?embedded=1&session=abc');denied.sessionStorage.getItem=()=>{throw Error('denied')};assert.equal(primeBattleEntry(denied),true);
});
