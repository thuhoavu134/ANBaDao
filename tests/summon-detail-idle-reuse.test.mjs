import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
test('showcase delegates to detail renderers, without guessed atlas or breathing',()=>{
 const s=read('src/ui/summon-reveal.js');
 assert.match(s,/startAuthoredDetailIdle\(id,cv\)/);
 assert.match(s,/playLucAnhVoice\(src,.92\)/);
 assert.doesNotMatch(s,/ATLAS_IDLE|IDLE_MS|setInterval|idle-\$\{|is-breathe/);
});
test('Ky Van optional target uses identical authored cells and stops independently',()=>{
 const run=external=>{
  let cb,draws=[],cancelled=[];
  const ctx={setTransform(){},clearRect(){},drawImage(...a){draws.push(a.slice(1));}};
  const cv={isConnected:true,getContext:()=>ctx};
  const env={window:{devicePixelRatio:1},document:{getElementById:()=>cv},performance:{now:()=>100},
   _lucDetailRaf:999,KY_VAN_DETAIL_META:{durationMs:1000,frameDurationsMs:Array(36).fill(1000/36)},
   Image:class{complete=true;naturalWidth=1296;},requestAnimationFrame:f=>(cb=f,123),cancelAnimationFrame:n=>cancelled.push(n)};
  vm.createContext(env);vm.runInContext(read('src/ui/ky-van-detail.js'),env);
  const stop=env.startKyVanDetailIdle(external?cv:undefined);
  env.performance.now=()=>350;cb();
  if(external)assert.equal(env._lucDetailRaf,999,'must not steal detail RAF');
  stop();const n=draws.length;cb();assert.equal(draws.length,n);
  return draws;
 };
 assert.deepEqual(run(true),run(false));
});
