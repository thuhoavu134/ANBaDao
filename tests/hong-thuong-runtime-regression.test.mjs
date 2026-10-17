import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {createAssetLoader} from '../src/assets/asset-loader.mjs';
const source=readFileSync(new URL('../src/runtime/hong-thuong.js',import.meta.url),'utf8');
const meta=JSON.parse(readFileSync(new URL('../assets/characters/hong-thuong/runtime-meta.json',import.meta.url),'utf8'));
function harness(){
 let now=0;const draws=[],errors=[];
 const loader=createAssetLoader({maxLoading:1,log:m=>errors.push(m),makeImage(){return {complete:false,set src(value){if(!value)return;const f=value.split('/').pop();let w,h;if(f.startsWith('idle-authored-')){const page=Number(f.match(/-(\d+)\.webp/)[1]);w=1968;h=page===5?474:948;}else if(f==='impact.webp'){w=640;h=384;}else{const c=Object.values(meta.clips).find(x=>x.file===f);w=c.cols*c.cellW;h=c.rows*c.cellH;}queueMicrotask(()=>{this.naturalWidth=w;this.naturalHeight=h;this.complete=true;this.onload?.();});}};}});
 const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...a){draws.push(a);}};
 const state={battleId:1,speed:1,sound:false};const actor={id:'h',sourceId:'hero_splus_hong_thuong',team:'player',x:300,y:500,hp:100,state:'idle'};
 const s={HONG_THUONG_META:meta,BACH_DIEN_LOADER:loader,performance:{now:()=>now},state,TEAM_ENEMY:'enemy',AbortController,console:{error(){}},window:{},battleCharacterScale:()=>1,battleCharacterDepthScale:()=>1,drawUnitHud(){},__hvHeroVisibility:{finish(c,h,u,t,drawn){return drawn;}},__hvIsSkipping:()=>false,__hvSkipVisualAssets:f=>f(),sleepVisualMilliseconds:async ms=>{now+=ms;return true;}};
 vm.createContext(s);vm.runInContext(source,s);return {s,ctx,actor,draws,errors,loader,setNow:n=>{now=n;}};
}
test('standing alias acquires actual two-row idle atlas on a cold cache',async()=>{const h=harness();await h.loader.acquire([h.s.hongThuongClip('standing')]);assert.deepEqual(h.errors,[]);});
test('last idle page loads four actual cells',async()=>{const h=harness();await h.loader.acquire([h.s.hongThuongClip('idle-authored-5')]);assert.deepEqual(h.errors,[]);});
test('idle body and foot registration do not subtract centre twice',async()=>{const h=harness();await h.loader.acquire([h.s.hongThuongClip('idle-authored-0')]);h.s.drawHongThuongHero(h.ctx,h.actor,0);const d=h.draws.at(-1),iv=meta.idleVisual,k=iv.contentScale;assert.ok(Math.abs(d[5]+iv.content.bodyCx*k)<.001);assert.ok(Math.abs(d[6]+iv.content.footCellY*k)<.001);});
test('idle source cells progress across pages',async()=>{const h=harness();await h.loader.acquire(['idle-authored-0','idle-authored-1'].map(h.s.hongThuongClip));for(const t of [0,48,384])h.s.drawHongThuongHero(h.ctx,h.actor,t);assert.equal(h.draws[0][1],0);assert.equal(h.draws[1][1],492);assert.notEqual(h.draws[1][0],h.draws[2][0]);});
test('cold basic action does not skip turn due to atlas mismatch',async()=>{const h=harness();const a=await h.s.beginHongThuongAction(h.actor,'basic',{id:'e',x:600,y:500},1,{});assert.ok(a);h.s.finishHongThuongAction(a);assert.deepEqual(h.errors,[]);});
test('ultimate travel, impacts, finale selection and return share a nonoverlapping timeline',async()=>{
 const h=harness(),victims=[{id:'e1',x:600,y:400,hp:100},{id:'e2',x:650,y:550,hp:100}],hits=[];
 Object.assign(h.s,{getUnit:id=>victims.find(v=>v.id===id),splusPresentation:new Map(),updateTeamCounters(){},splusStateView(){}});
 const engine={act:()=>({ok:true,castId:'cast'}),targets:()=>victims,
 resolveHongThuongHit(a,c,id,i){hits.push({id,i,at:h.s.hongThuongElapsed(info)});if(id==='e1'&&i===2)victims[0].hp=0;},
 nextHongThuongFinale(){assert.equal(hits.length,6);return victims.find(v=>v.hp>0);},
 resolveHongThuongFinale(){assert.equal(hits.length,6);},finishHongThuongCast(){}};
 const info=await h.s.beginHongThuongAction(h.actor,'ultimate',victims[0],1,engine);
 assert.ok(info);
 await h.s.resolveHongThuongCast(engine,info,h.actor,'ultimate',victims[0],1);
 const segs=info.segments,clusters=segs.filter(s=>s.clip==='ult-cluster');
 for(let i=1;i<segs.length;i++)assert.equal(segs[i].start,segs[i-1].start+segs[i-1].dur);
 hits.forEach((hit,i)=>assert.equal(hit.at,clusters[Math.floor(i/3)].start+meta.ultimateTimeline.clusterHitsAt[i%3]));
 const finale=segs.find(s=>s.clip==='ult-finisher');assert.equal(finale.to.x,victims[1].x+70);
 const ret=segs.at(-1),mid=h.s.hongThuongBodyPos(h.actor,ret.start+ret.dur/2,'ultimate');
 assert.equal(mid.x,(ret.from.x+info.home.x)/2);
 assert.equal(info.actionTotalMs,ret.start+ret.dur);
 h.s.finishHongThuongAction(info);assert.deepEqual(h.errors,[]);
});
