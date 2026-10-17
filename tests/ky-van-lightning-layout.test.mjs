import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {battleCharacterBodyForViewport} from '../scripts/battle-formation-scale-v1.mjs';

const runtime=readFileSync(new URL('../src/runtime/ky-van.js',import.meta.url),'utf8');
const meta=JSON.parse(readFileSync(new URL('../assets/characters/ky-van/runtime-meta.json',import.meta.url)));
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);

function harness({team='player',speed=1,reverse=false,slots=[0,1,2,3,4,5],viewport=[1280,528]}={}){
 let now=1,released=0,skip=false;
 const actor={id:'ky',sourceId:'hero_splus_ky_van',team,hp:100,x:team==='player'?200:1400,y:520,baseY:520};
 const enemy=team==='player'?'enemy':'player';
 const targets=slots.map(slot=>({id:'target-'+slot,team:enemy,slot,hp:1000,x:team==='player'?(slot<3?1065:1235):(slot<3?535:365),y:[340,520,700][slot%3],baseY:[340,520,700][slot%3]}));
 const units=[actor,...(reverse?[...targets].reverse():targets)],draws=[],sounds=[];
 const body=u=>battleCharacterBodyForViewport(u,...viewport);
 const c=vm.createContext({KY_VAN_META:meta,performance:{now:()=>now},state:{battleId:1,speed,sound:true},units,TEAM_ENEMY:'enemy',AbortController,console,
  BACH_DIEN_LOADER:{ensure:clip=>({image:{src:clip.src,complete:true,naturalWidth:2000}}),acquire:async()=>({release:()=>released++})},
  window:{HonVietSfx:{prepare:async()=>true,play:(...a)=>sounds.push(a)}},__hvIsSkipping:()=>skip,__hvSkipVisualAssets:fn=>fn(),battleCharacterBody:body});
 vm.runInContext(runtime,c);
 let matrix={a:1,b:0,c:0,d:1,x:0,y:0};const stack=[];
 const ctx={save(){stack.push({...matrix});},restore(){matrix=stack.pop();},translate(x,y){matrix.x+=matrix.a*x+matrix.c*y;matrix.y+=matrix.b*x+matrix.d*y;},
  rotate(r){const {a,b,c,d}=matrix,co=Math.cos(r),si=Math.sin(r);Object.assign(matrix,{a:a*co+c*si,b:b*co+d*si,c:-a*si+c*co,d:-b*si+d*co});},
  drawImage(image,sx,sy,sw,sh,x,y,w,h){draws.push({image,sx,sy,sw,sh,x:matrix.x+matrix.a*x+matrix.c*y,y:matrix.y+matrix.b*x+matrix.d*y,w,h,matrix:{...matrix}});}};
 const render=age=>{now=1+age/speed;draws.length=0;c.drawKyVanFx(ctx);return [...draws];};
 return {c,actor,targets,body,ctx,draws,sounds,render,skip:()=>skip=true,released:()=>released};
}
const bolts=draws=>draws.filter(d=>d.image.src.endsWith('/bolt.webp'));
const impacts=draws=>draws.filter(d=>d.image.src.endsWith('/impact.webp'));
const frame=d=>(d.sy/meta.clips.bolt.cellH)*meta.clips.bolt.cols+d.sx/meta.clips.bolt.cellW;

test('basic reveals one contact pose downward above the target without early ground contact or stretching',async()=>{
 for(const team of ['player','enemy'])for(const viewport of [[390,739],[1280,528]]){
  const h=harness({team,viewport}),target=h.targets[1];await h.c.beginKyVanAction(h.actor,'basic',target,1);
  const reference=h.body(target),columns=[];
  for(const age of [651,850,1049,1050]){
   const drawn=bolts(h.render(age));assert.equal(drawn.length,1,'one legible vertical lightning column');
   const d=drawn[0];columns.push(d);
   close(d.x+d.w*.5,reference.centerX,'target-centered, independent of caster');
   close(d.y+d.w/260*540,reference.footY,'fixed strike contact at the target foot');
   close(d.h/d.sh,d.w/d.sw,'source crop preserves pixel scale, never stretches the bolt');
   if(age<1050)assert.ok(d.y+d.h<reference.footY,'no ground pixels before impact');
   close(d.matrix.b,0,'upright');close(d.matrix.c,0,'no diagonal fan');
   assert.ok(d.y<reference.topY,'origin above the body');
  }
  assert.deepEqual(columns.map(frame),[5,5,5,5],'one fixed pose grows before the original tail plays');
  for(const [i,expected]of [1.35,270,538.65,628].entries())close(columns[i].sh,expected,'monotonic source reveal');
  h.actor.x+=333;const moved=bolts(h.render(850))[0];
  close(moved.x,columns[1].x,'caster movement cannot drag the lightning');
  h.c.cancelKyVanActions();
 }
});

test('basic release, contact and tail follow the existing combat markers',async()=>{
 const h=harness();await h.c.beginKyVanAction(h.actor,'basic',h.targets[0],1);
 assert.equal(h.render(649).length,0);
 assert.equal(bolts(h.render(650)).length,0,'release starts the downward reveal at zero height');
 assert.equal(bolts(h.render(651)).length,1);
 assert.equal(impacts(h.render(1049)).length,0);
 assert.equal(impacts(h.render(1050)).length,1);
 assert.equal(frame(bolts(h.render(1050))[0]),5);
 assert.equal(frame(bolts(h.render(1649))[0]),14);
 assert.equal(h.render(1650).length,0);
});

test('ultimate uses a deterministic front, row-sweep and back sequence regardless of unit array order',async()=>{
 for(const team of ['player','enemy']){
  const a=harness({team}),b=harness({team,reverse:true});
  const one=await a.c.beginKyVanAction(a.actor,'ultimate',a.targets[0],1),two=await b.c.beginKyVanAction(b.actor,'ultimate',b.targets[0],1);
  const plan=info=>Array.from(info.lightningStrikes,s=>[s.target.slot,s.at]);
  assert.deepEqual(plan(one),plan(two));
  assert.deepEqual(plan(one),[[0,1730],[1,1805],[2,1880],[0,2180],[3,2235],[1,2290],[4,2345],[2,2400],[5,2455],[3,2860],[4,2935],[5,3010]]);
  const visible=bolts(a.render(1900));
  assert.equal(visible.length,9,'three columns for each of the three front targets');
  assert.deepEqual(visible.filter((_,i)=>i%3===1).map(d=>[Math.round(d.x+d.w/2),Math.round(d.y+d.w/260*540)]),a.targets.slice(0,3).map(t=>[hround(a.body(t).centerX),hround(a.body(t).footY)]));
 }
});
const hround=Math.round;

test('each ultimate strike reveals from the sky before opening its ground-contact pose',async()=>{
 const h=harness();await h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);
 for(const age of [1731,1745,1760,1789,1790]){
  const ds=bolts(h.render(age)),body=h.body(h.targets[0]);
  assert.equal(ds.length,3,'all three bolts share the same downward reveal');
  for(const d of ds){
   assert.equal(frame(d),5);
   close(d.sh,age<1790?540*(age-1730)/60:628,'ultimate source reveal');
   close(d.h/d.sh,d.w/d.sw,'ultimate crop preserves aspect ratio');
   if(age<1790)assert.ok(d.y+d.h<body.footY);
  }
  assert.equal(impacts(h.render(age)).length,age<1790?0:1,'one impact per target group');
 }
});

test('ultimate staggers three bolt heads and horizontal gaps while anchoring every target on both teams and viewports',async()=>{
 for(const team of ['player','enemy'])for(const viewport of [[390,739],[1280,528]]){
  const h=harness({team,viewport});await h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);
  const ds=bolts(h.render(2520));assert.equal(ds.length,18);
  assert.equal(impacts(h.render(2520)).length,6,'impact intensity is per target, not per bolt');
  for(const target of h.targets){
   const b=h.body(target),group=ds.filter(d=>Math.abs(d.y+d.w/260*540-b.footY)<1e-7&&Math.abs(d.x+d.w/2-b.centerX)<=36.001);
   assert.equal(group.length,3,'exactly three bolts belong to this target');
   const xs=group.map(d=>d.x+d.w/2).sort((a,b)=>a-b);
   const gaps=[xs[1]-xs[0],xs[2]-xs[1]];
   assert.ok(Math.min(...gaps)>=13,'three visible, distinct paths');
   assert.ok(Math.abs(gaps[0]-gaps[1])>=4,'unequal horizontal spacing avoids a rigid parallel cluster');
   close(xs[1],b.centerX,'middle strike stays anchored to the hero');
   assert.ok(Math.abs(xs.reduce((a,b)=>a+b,0)/3-b.centerX)<4,'asymmetric group stays close to the target center');
   const heads=group.map(d=>d.y).sort((a,b)=>a-b);
   assert.ok(heads[1]-heads[0]>b.height*.15&&heads[2]-heads[1]>b.height*.15,'all three origins have visibly different heights');
   for(const d of group){close(d.matrix.b,0,'upright');close(d.matrix.c,0,'upright');close(d.h/d.sh,d.w/d.sw,'undistorted bolt');assert.ok(d.y<b.topY,'origin above the head');}
  }
 }
});

test('ultimate keeps one triple group per occupied target, bounded atlas frames and no tail beyond recovery',async()=>{
 const h=harness({slots:[0,2,3,5]});await h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);
 for(let age=0;age<=meta.clips.ultimate.durationMs+100;age+=25){
  const ds=bolts(h.render(age)),keys=ds.map(d=>Math.round(d.x+d.w/2)+':'+Math.round(d.y+d.w/260*540));
  assert.equal(new Set(keys).size,keys.length,'old and new waves cannot stack at the same target');
  assert.equal(ds.length%3,0,'a target always receives a complete group');
  assert.ok(ds.length<=h.targets.length*3,'no duplicate groups from overlapping waves');
  for(const d of ds)assert.ok(frame(d)>=0&&frame(d)<15);
 }
 assert.equal(h.render(meta.clips.ultimate.durationMs).length,0);
 assert.equal(h.render(4000).length,0);
});

test('canonical lightning geometry matches at x1/x2/x3 and reset/skip release the existing owner',async()=>{
 const states=[];
 for(const speed of [1,2,3]){
  const h=harness({speed});const info=await h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);
  states.push(h.render(2300).map(d=>[d.image.src,d.sx,d.sy,d.x,d.y,d.w,d.h]));
  assert.equal(h.sounds.length,1);
  assert.equal(h.sounds[0][0],'ky-van-ultimate-x'+speed);
  h.skip();assert.equal(h.render(2400).length,0);
  h.c.cancelKyVanActions();h.c.cancelKyVanActions();
  assert.equal(h.released(),1);assert.equal(info.abort.signal.aborted,true);assert.equal(h.actor._kyVanAction,undefined);
 }
 assert.deepEqual(states[0],states[1]);assert.deepEqual(states[0],states[2]);
});
