import {installHeroPresentation} from './helpers/hero-presentation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {createAssetLoader} from '../src/assets/asset-loader.mjs';
const source=readFileSync(new URL('../src/runtime/hong-thuong.js',import.meta.url),'utf8');
const meta=JSON.parse(readFileSync(new URL('../assets/characters/hong-thuong/runtime-meta.json',import.meta.url),'utf8'));
const dimensions=JSON.parse(readFileSync(new URL('../assets/characters/hong-thuong/v2-atlas-dimensions.json',import.meta.url),'utf8'));
function harness(){
 let now=0;const draws=[],errors=[];
 const loader=createAssetLoader({maxLoading:1,log:m=>errors.push(m),makeImage(){return {complete:false,set src(value){if(!value)return;const f=value.split('/').pop().split('?')[0];let w,h;if(f===meta.vfx.clips.impact.file){w=meta.vfx.clips.impact.cols*meta.vfx.clips.impact.cellW;h=Math.ceil(meta.vfx.clips.impact.frames/meta.vfx.clips.impact.cols)*meta.vfx.clips.impact.cellH;}else{[w,h]=dimensions[f];}queueMicrotask(()=>{this.naturalWidth=w;this.naturalHeight=h;this.complete=true;this.onload?.();});}};}});
 const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...a){draws.push(a);}};
 const state={battleId:1,speed:1,sound:false};const actor={id:'h',sourceId:'hero_splus_hong_thuong',team:'player',x:300,y:500,hp:100,state:'idle'};
 const s={HONG_THUONG_META:meta,BACH_DIEN_LOADER:loader,performance:{now:()=>now},state,TEAM_ENEMY:'enemy',AbortController,console:{error(){}},window:{},battleCharacterScale:()=>1,battleCharacterDepthScale:()=>1,drawUnitHud(){},__hvHeroVisibility:{finish(c,h,u,t,drawn){return drawn;}},__hvIsSkipping:()=>false,__hvSkipVisualAssets:f=>f(),sleepVisualMilliseconds:async ms=>{now+=ms;return true;}};
 vm.createContext(s);installHeroPresentation(s);vm.runInContext(source,s);return {s,ctx,actor,draws,errors,loader,setNow:n=>{now=n;}};
}
test('standing alias acquires actual two-row idle atlas on a cold cache',async()=>{const h=harness();await h.loader.acquire([h.s.hongThuongClip('standing')]);assert.deepEqual(h.errors,[]);});
test('last idle page loads its actual partial row',async()=>{const h=harness();await h.loader.acquire([h.s.hongThuongClip('idle-authored-'+(meta.idleVisual.pages-1))]);assert.deepEqual(h.errors,[]);});
test('idle body and foot registration do not subtract centre twice',async()=>{const h=harness();await h.loader.acquire([h.s.hongThuongClip('idle-authored-0')]);h.s.drawHongThuongHero(h.ctx,h.actor,0);const d=h.draws.at(-1),iv=meta.idleVisual,k=iv.contentScale;assert.ok(Math.abs(d[5]+iv.content.bodyCx*k)<.001);assert.ok(Math.abs(d[6]+iv.content.footCellY*k)<.001);});
test('idle source cells progress across pages',async()=>{const h=harness();await h.loader.acquire(['idle-authored-0','idle-authored-1'].map(h.s.hongThuongClip));for(const t of [0,meta.idleVisual.frameDurationsMs[0]+1,meta.idleVisual.frameDurationsMs.slice(0,8).reduce((a,b)=>a+b,0)+1])h.s.drawHongThuongHero(h.ctx,h.actor,t);assert.equal(h.draws[0][1],0);assert.equal(h.draws[1][1],meta.idleVisual.cellW);assert.notEqual(h.draws[1][0],h.draws[2][0]);});
test('cold basic action does not skip turn due to atlas mismatch',async()=>{const h=harness();const a=await h.s.beginHongThuongAction(h.actor,'basic',{id:'e',x:600,y:500},1,{});assert.ok(a);h.s.finishHongThuongAction(a);assert.deepEqual(h.errors,[]);});
// Owner 2026-10-26: ulti đổi sang 4 nhịp chọc xuống TOÀN BỘ địch (bay lên trên đội địch rồi chếch xuống),
// bỏ Hồi Mã Thương riêng. Timeline phải vẫn liền mạch, không chồng lấn, và mỗi nhịp đánh mọi địch còn sống.
// Owner 2026-10-26 (chốt): cô ấy KHÔNG nhảy sang từng người. Đứng yên MỘT chỗ trước vị trí số 2 của đội địch,
// mỗi nhịp bay lên cao, chếch người xuống đánh (VFX trên đầu toàn bộ địch), hạ xuống đúng chỗ đó — lặp 4 lần.
test('ultimate keeps one ground spot and leaps four times over the whole enemy team',async()=>{
 const h=harness(),victims=[{id:'e1',x:600,y:400,hp:100,slot:0},{id:'e2',x:650,y:550,hp:100,slot:1}],hits=[];
 Object.assign(h.s,{getUnit:id=>victims.find(v=>v.id===id),splusPresentation:new Map(),updateTeamCounters(){},splusStateView(){}});
 const engine={act:()=>({ok:true,castId:'cast'}),targets:()=>victims.filter(v=>v.hp>0),
 resolveHongThuongHit(a,c,id,i){hits.push({id,i,at:h.s.hongThuongElapsed(info)});},
 finishHongThuongCast(){}};
 const info=await h.s.beginHongThuongAction(h.actor,'ultimate',victims[0],1,engine);
 assert.ok(info);
 await h.s.resolveHongThuongCast(engine,info,h.actor,'ultimate',victims[0],1);
 const segs=info.segments,clusters=segs.filter(s=>s.clip==='ult-cluster');
 assert.equal(clusters.length,3,'ba đợt');
 assert.equal(segs.filter(s=>s.clip==='ult-finisher').length,0,'không còn Hồi Mã Thương riêng');
 for(let i=1;i<segs.length;i++)assert.equal(segs[i].start,segs[i-1].start+segs[i-1].dur,'timeline liền mạch');
 // mỗi nhịp: TOÀN BỘ địch còn sống đều ăn đòn, chỉ số nhịp 0..3
 assert.equal(hits.length,18,'3 đợt x 3 nhịp x 2 địch');
 for(const wave of [0,1,2,3,4,5,6,7,8])assert.deepEqual(hits.filter(x=>x.i===wave).map(x=>x.id).sort(),['e1','e2']);
 assert.ok(hits.every(x=>x.i>=0&&x.i<=8),'chỉ số nhịp nằm trong 0..8');
 // đứng yên một chỗ: cả 4 cụm đánh cùng một toạ độ, cao hơn MỌI địch
 const hoverY=clusters[0].to.y;
 for(const c of clusters){
  assert.equal(c.to.x,clusters[0].to.x,'cùng một điểm đứng');
  assert.equal(c.to.y,hoverY,'cùng một độ cao');
 }
 assert.ok(hoverY<Math.min(...victims.map(v=>v.y))-40,'bay lên cao hơn đội địch (không quá cao)');
 assert.ok(hoverY>Math.min(...victims.map(v=>v.y))-260,'không bay cao quá mức owner muốn');
 // giữa các cụm phải hạ xuống đúng điểm đứng dưới đất (không nhảy sang người khác)
 const groundX=segs.find(x=>x.clip==='run'&&x.to.y>Math.min(...victims.map(v=>v.y))).to.x;
 for(const c of clusters)assert.equal(c.to.x,groundX,'bay lên ngay trên điểm đứng của mình');
 const ret=segs.at(-1),mid=h.s.hongThuongBodyPos(h.actor,ret.start+ret.dur/2,'ultimate');
 assert.equal(Math.round(mid.x),Math.round((ret.from.x+info.home.x)/2));
 assert.equal(info.actionTotalMs,ret.start+ret.dur);
 h.s.finishHongThuongAction(info);assert.deepEqual(h.errors,[]);
});
test('a failed legacy atlas URL cannot poison the versioned basic cast',async()=>{
 const h=harness(),clip=h.s.hongThuongClip('basic');
 assert.match(clip.src,/\?v=/);
 await assert.rejects(h.loader.acquire([{...clip,src:clip.src.split('?')[0],rows:99}]));
 const action=await h.s.beginHongThuongAction(h.actor,'basic',{id:'e',x:600,y:500},1,{});
 assert.ok(action);h.setNow(0);h.s.drawHongThuongHero(h.ctx,h.actor,0);
 h.setNow(320);h.s.drawHongThuongHero(h.ctx,h.actor,320);
 assert.notEqual(h.draws.at(-2)[1],h.draws.at(-1)[1]);
 assert.equal(h.s.window.__HV_HONG_THUONG_ACTION.phase,'playing');h.s.finishHongThuongAction(action);
});
test('one impact event draws two synchronized VFX layers',async()=>{
 const h=harness();await h.loader.acquire([h.s.hongThuongVfxClip('impact')]);
 h.s.spawnHongThuongVfx(600,400,{speed:1});h.s.drawHongThuongVfx(h.ctx,60);
 assert.equal(h.draws.length,2);assert.deepEqual(h.draws[0].slice(0,5),h.draws[1].slice(0,5));
 assert.equal(h.draws[1][5]-h.draws[0][5],16);
});

test('impact layers are centered on the enemy body, not caller feet offset',async()=>{
 const h=harness();await h.loader.acquire([h.s.hongThuongVfxClip('impact')]);
 h.s.spawnHongThuongVfx(5,5,{speed:1},{x:600,y:500,hp:100});h.s.drawHongThuongVfx(h.ctx,0);
 const centers=h.draws.map(d=>[d[5]+d[7]/2,d[6]+d[8]/2]);
 assert.equal((centers[0][0]+centers[1][0])/2,600);
 assert.equal((centers[0][1]+centers[1][1])/2,345);
});
