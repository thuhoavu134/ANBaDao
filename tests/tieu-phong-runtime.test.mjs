import {installHeroPresentation} from './helpers/hero-presentation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {patchTieuPhongHost} from '../scripts/tieu-phong-runtime-v1.mjs';import {patchKyVanHost} from '../scripts/ky-van-runtime-v1.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),meta=JSON.parse(read('assets/characters/tieu-phong/runtime-meta.json'));
test('host composes after Ky Van and registers paged idle, ATK, run and detail',()=>{const ky=patchKyVanHost(read('index.html')+'\n'+read('src/ui/campaign-scene.js'),JSON.parse(read('assets/characters/ky-van/runtime-meta.json')),read('src/ui/ky-van-detail.js'));const result=patchTieuPhongHost(ky,meta,read('src/ui/tieu-phong-detail.js'));assert.match(result,/tieu_phong:\{slug:'tieu-phong'/);assert.match(result,/startTieuPhongDetailIdle\(\)/);assert.match(result,/Object.assign\(farmAttackSpecs,\{tieu_phong:/);assert.equal(patchTieuPhongHost(result,meta,''),result);});
test('authored timing, pages and six states stay bounded',()=>{assert.equal(meta.idle.frames,87);assert.ok(Math.abs(meta.clips.basic.durationMs-900)<.01);assert.ok(Math.abs(meta.clips.ultimate.durationMs-2700)<.01);for(const c of Object.values(meta.clips)){assert.equal(c.frames,c.frameDurationsMs.length);assert.ok(c.cols*c.cellW*Math.ceil(c.frames/c.cols)*c.cellH*4<16*1024*1024);}});
test('supplied idle uses 30 poses, preserves 24 fps holds and fits mobile decode budget',()=>{const idle=meta.idleVisual;assert.equal(idle.frames,30);assert.equal(idle.pageFrames,9);assert.equal(idle.pages,4);assert.ok(Math.abs(idle.durationMs-2416.667)<.02);for(const [key,c] of Object.entries(meta.clips))if(key.startsWith('idle-authored-'))assert.ok(c.cols*c.cellW*c.rows*c.cellH*4<14*1024*1024);});
test('three ground paths and per-target timestamps match at x1/x2/x3; reset cancels leases and audio',async()=>{for(const speed of [1,2,3]){let now=1,releases=0;const actor={id:'a',sourceId:'hero_splus_tieu_phong',team:'player',hp:100,x:200,y:600},targets=[{id:'b',slot:1,x:600,y:600,hp:100},{id:'c',slot:4,x:800,y:600,hp:100}];const draws=[];const c=vm.createContext({TIEU_PHONG_META:meta,performance:{now:()=>now},state:{battleId:1,speed,sound:true},TEAM_ENEMY:'enemy',AbortController,console,BACH_DIEN_LOADER:{ensure:c=>({image:{src:c.src,naturalWidth:2000}}),acquire:async()=>({release:()=>releases++})},window:{HonVietSfx:{prepare:async()=>true,play:()=>true}},__hvIsSkipping:()=>false,__hvSkipVisualAssets:fn=>fn(),splusCombat:()=>({targets:()=>targets}),getUnit:id=>[actor,...targets].find(u=>u.id===id),battleCharacterDepthScale:()=>1,battleCharacterScale:()=>.5});installHeroPresentation(c);vm.runInContext(read('src/runtime/tieu-phong.js'),c);const info=await c.beginTieuPhongAction(actor,'ultimate',targets[0],1);assert.equal(info.impacts.length,6);assert.ok(info.impacts.at(-1).at<2200);const ctx={globalAlpha:1,save(){},restore(){},drawImage(...a){draws.push(a)}};for(const at of [850,1350,1850]){now=1+at/speed;draws.length=0;c.drawTieuPhongFx(ctx);const wind=draws.find(a=>a[0].src.endsWith('wind-ultimate.webp'));assert.ok(wind);assert.equal(wind[6]+wind[8],600);}c.cancelTieuPhongActions();assert.equal(releases,1);assert.equal(info.abort.signal.aborted,true);assert.equal(actor._tieuPhongAction,undefined);}});

test('basic and ultimate tornado passes are larger, broader triplets anchored at ground',async()=>{
 for(const action of ['basic','ultimate']){
  let now=1;const actor={id:'actor',sourceId:'hero_splus_tieu_phong',team:'player',hp:100,x:200,y:600};
  const targets=[{id:'enemy',slot:1,x:600,y:600,hp:100}],draws=[];
  const c=vm.createContext({TIEU_PHONG_META:meta,performance:{now:()=>now},state:{battleId:1,speed:1,sound:false},TEAM_ENEMY:'enemy',AbortController,console,window:{HonVietSfx:{prepare:async()=>true,play:()=>true}},
   BACH_DIEN_LOADER:{ensure:clip=>({image:{src:clip.src,complete:true,naturalWidth:2000}}),acquire:async()=>({release(){}})},
   __hvIsSkipping:()=>false,__hvSkipVisualAssets:fn=>fn(),splusCombat:()=>({targets:()=>targets}),getUnit:id=>[actor,...targets].find(u=>u.id===id),
   battleCharacterDepthScale:()=>1,battleCharacterScale:()=>.5});
  installHeroPresentation(c);vm.runInContext(read('src/runtime/tieu-phong.js'),c);const info=await c.beginTieuPhongAction(actor,action,targets[0],1);
  const start=action==='basic'?216.667:800;now=1+start+80;
  const ctx={globalAlpha:1,save(){},restore(){},drawImage(...args){draws.push(args);}};
  c.drawTieuPhongFx(ctx);const winds=draws.filter(a=>a[0].src.endsWith('wind-'+action+'.webp'));
  assert.equal(winds.length,3);// drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh): height is a[8]; size now follows the projected body (same floor as new-vfx-presentation).
  assert.ok(Math.max(...winds.map(a=>a[8]))>=224);
  assert.ok(new Set(winds.map(a=>a[5])).size>1,'parallel gusts expand the ground line');
  const ground=info.groundY;assert.ok(winds.every(a=>Math.abs((a[6]+a[8])-ground)<1));
  assert.equal(actor.stateDuration,meta.clips[action].durationMs);c.cancelTieuPhongActions();
 }
});

