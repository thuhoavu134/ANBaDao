import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { patchAuthoredBattleSpeed } from '../scripts/authored-battle-speed-v1.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sources=read('scripts/linh-dong-timing-main-v1.mjs')+'\n'+read('scripts/bach-dien-canvas-runtime-v1.mjs');
// The test executes the real marker wait bodies emitted by the build owners.
for(const hero of ['LinhDong','BachDien'])for(const speed of [1,2,3])test(`${hero} release/impact/recovery respect ${speed}x`,async()=>{
  const patched=patchAuthoredBattleSpeed(sources);
  const start=patched.indexOf(`async function wait${hero}Marker(`);
  const end=patched.indexOf(`function emit${hero}Release(`,start);
  let now=0;
  const timeline={atk:{releaseMs:600,impactMs:1200,recoveryEndMs:1800}};
  const context={state:{battleId:1},performance:{now:()=>now},sleepVisualMilliseconds:async ms=>{now+=ms;return true;}};
  context[hero==='LinhDong'?'LINH_DONG_TIMELINE':'BACH_DIEN_TIMELINE']=timeline;
  vm.createContext(context);vm.runInContext(patched.slice(start,end)+`\nthis.wait=wait${hero}Marker;`,context);
  const info={action:'atk',startedAt:0,playbackRate:speed,clock:{advance:x=>x}};
  for(const [marker,expected] of [['release',600],['impact',1200],['recovery:end',1800]]){
    assert.equal(await context.wait(info,marker,1),true);
    assert.ok(Math.abs(now-expected/speed)<1,`${marker}: ${now} ms, expected ${expected/speed}`);
  }
});
