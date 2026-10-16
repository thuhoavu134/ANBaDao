import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import vm from 'node:vm';
import {createHeroVisibilityCache} from '../src/render/hero-visibility-cache.mjs';
import {patchTichDaoBattle,patchTichDaoHost} from '../scripts/tich-dao-runtime-v1.mjs';
import {patchKyVanHost} from '../scripts/ky-van-runtime-v1.mjs';
import {patchTieuPhongHost} from '../scripts/tieu-phong-runtime-v1.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const meta=JSON.parse(read('assets/characters/tich-dao/runtime-meta.json'));
const TICH_DAO_SCALE=key=>{const c=meta.clips[key]?.content;return c&&c.scale?c.scale:1;};
const TICH_DAO_VFX_H=key=>meta.vfx?.clips?.[key]?.display?.heightPx||300;
function harness(){
 let now=0,releases=0;const draws=[],requests=[],huds=[],translates=[],vdraws=[];
 const actor={id:'td',sourceId:'hero_splus_tich_dao',team:'player',hp:100,x:200,y:400,state:'idle',stateStarted:0};
 const c=vm.createContext({__hvHeroVisibility:createHeroVisibilityCache(),TICH_DAO_META:meta,performance:{now:()=>now},state:{battleId:1,speed:1,sound:true},TEAM_ENEMY:'enemy',AbortController,console,
  BACH_DIEN_LOADER:{ensure:clip=>{requests.push(clip.src);return {image:{src:clip.src,complete:true,naturalWidth:2000}};},acquire:async()=>({release:()=>releases++})},
  window:{HonVietSfx:{prepare:async()=>true,play:()=>true}},__hvIsSkipping:()=>false,__hvSkipVisualAssets:fn=>fn(),
  battleCharacterDepthScale:()=>1,battleCharacterScale:()=>.5,drawUnitHud:(...a)=>huds.push(a)});
 vm.runInContext(read('src/runtime/tich-dao.js'),c);
 const ctx={save(){},restore(){},translate(x,y){translates.push({x,y,t:now});},scale(){},drawImage(...a){draws.push(a);}};
 const vctx={save(){},restore(){},translate(){},scale(){},drawImage(...a){vdraws.push(a);}};
 return {c,actor,ctx,draws,requests,huds,translates,vdraws,setTime:t=>now=t,releases:()=>releases,
  translateAt:t=>{const rel=translates.filter(p=>p.t<=t);return rel.length?rel[rel.length-1]:{x:0,y:0};},
  vdraw:()=>{vdraws.length=0;return c.drawTichDaoVfx(vctx,now);},
  draw:()=>{draws.length=0;huds.length=0;return c.drawTichDaoHero(ctx,actor,now);}};
}

test('LOI-1: atk/ultimate body vẽ phóng theo content scale, idle giữ nguyên',async()=>{
 const h=harness();h.setTime(1);
 // idle: dest đúng 480x440 như cũ
 await h.c.beginTichDaoAction(h.actor,'basic',null,1);h.setTime(1+500);
 h.draw();
 const idle=h.draws.find(d=>d[0].src.endsWith('/basic.webp'));
 assert.ok(idle,'basic frame painted');
 const c=TICH_DAO_SCALE('basic');
 assert.ok(Math.abs((idle[8]||0)-440*c)<1,'basic height = 440×contentScale ('+c+'), got '+(idle[8]||0));
});
test('LOI-2: thân dịch chuyển tới trước mặt địch hàng sau trong nhịp chém rồi về nhà',async()=>{
 const h=harness();h.setTime(1);
 const enemy={id:'e5',team:'enemy',slot:5,hp:100,maxHp:100,x:1500,y:400};
 const info=await h.c.beginTichDaoAction(h.actor,'ultimate',null,1);
 h.c.__tdSetSpot&&h.c.__tdSetSpot(info,{x:enemy.x-72,y:enemy.y+6});
 h.setTime(1+1200);h.draw(); // phase-04
 const pos=h.translateAt(1+1200);
 assert.ok(Math.abs(pos.x-(enemy.x-72))<2 && Math.abs(pos.y-(enemy.y+6))<2,'phase-04 body tại spot địch, got '+JSON.stringify(pos));
 h.setTime(1+3450);h.draw(); // phase-09 recovery: lerp về home
 const home=h.translateAt(1+3450);
 assert.ok(home.x<enemy.x-72-100,'phase-09 đang quay về nhà, got '+home.x);
});
test('LOI-3: VFX Cổ Mộ phóng to phủ lên đầu địch + SFX 3 cue có file',async()=>{
 const h=harness();h.setTime(1);
 h.c.spawnTichDaoVfx('rain',1500,400);
 h.setTime(1+100);h.vdraw();
 const rain=h.vdraws.find(d=>d[0].src.includes('rain-atlas'));
 assert.ok(rain,'rain vfx painted');
 const dh=TICH_DAO_VFX_H('rain');
 assert.ok(Math.abs(rain[8]-dh)<2,'rain height = meta display ('+dh+'), got '+rain[8]);
 assert.ok(rain[6]<400-dh*0.6,'rain top nằm TRÊN đầu địch (y='+Math.round(rain[6])+')');
 // SFX: meta + file thật
 const sfx=meta.sfx;
 for(const k of ['basic','strike','rain'])assert.ok(sfx?.[k]?.audio,'meta.sfx.'+k+' thiếu');
 for(const k of ['basic','strike','rain']){
  const f='assets/audio/sfx/tich-dao/'+sfx[k].file;
  assert.ok(existsSync(new URL('../'+f,import.meta.url)),'thiếu file '+f);
 }
 const patched=patchTichDaoBattle(read('dist/battle.html'),read('src/runtime/tich-dao.js'),meta);
 assert.match(patched,/'tich-dao-basic':'tich-dao\/(basic[.]wav|m4a)'/,'battle SFX map có tich-dao-basic');
});

test('idle paints the 480x440 cell grid natively and prefetches the next page',()=>{
 const h=harness();h.draw();
 const body=h.draws[0];assert.ok(body[0].src.endsWith('/idle-authored-0.webp'));
 assert.deepEqual(body.slice(1,5),[0,0,480,440]);
 assert.deepEqual(body.slice(5),[-240,-440,480,440]);
 assert.ok(h.requests.some(src=>src.endsWith('/idle-authored-1.webp')));
});
test('ultimate plays its nine authored phases and hides the body in the two vanish gaps',async()=>{
 const h=harness();h.setTime(1);
 const info=await h.c.beginTichDaoAction(h.actor,'ultimate',null,1);
 assert.equal(h.actor.stateDuration,4000);
 const cellOf=phase=>meta.ultimateTimeline.phases.find(p=>p.id===phase).cells;
 // phase-02 dash-out: mid-phase sample
 h.setTime(1+700);assert.equal(h.draw(),true);
 const dash=h.draws.find(d=>d[0].src.endsWith('/ultimate.webp'));
 assert.ok(dash,'phase-02 paints the dash sample');
 assert.deepEqual(dash.slice(1,5),[(cellOf('phase-02-dash-out')[1]%6)*480,Math.floor(cellOf('phase-02-dash-out')[1]/6)*440,480,440]);
 // phase-03 vanish gap: no body frame at all, HUD keeps its anchor
 h.setTime(1+1040);assert.equal(h.draw(),true);
 assert.equal(h.draws.some(d=>d[0].src.endsWith('.webp')),false,'no sprite pixels in a vanish phase');
 assert.equal(h.huds.length,1,'HUD stays visible while hidden');
 // phase-04 reappear strike
 h.setTime(1+1200);assert.equal(h.draw(),true);
 const strike=h.draws.find(d=>d[0].src.endsWith('/ultimate.webp'));
 assert.ok(strike,'phase-04 repaints the body');
 assert.deepEqual(strike.slice(1,5),[(cellOf('phase-04-reappear-strike-1')[0]%6)*480,Math.floor(cellOf('phase-04-reappear-strike-1')[0]/6)*440,480,440]);
 // phase-05 second gap, then the combo returns
 h.setTime(1+1600);assert.equal(h.draw(),true);
 assert.equal(h.draws.some(d=>d[0].src.endsWith('.webp')),false);
 h.setTime(1+2000);assert.equal(h.draw(),true);
 assert.ok(h.draws.some(d=>d[0].src.endsWith('/ultimate.webp')));
 h.c.cancelTichDaoActions();
 assert.equal(h.releases(),1);assert.equal(info.abort.signal.aborted,true);assert.equal(h.actor._tichDaoAction,undefined);
});
test('waitTichDaoMarker releases at the authored strike and recovery clocks',async()=>{
 const h=harness();h.setTime(1);
 const info=await h.c.beginTichDaoAction(h.actor,'basic',null,1);
 assert.equal(h.actor.stateDuration,900);
 h.c.sleepVisualMilliseconds=async()=>false;
 assert.equal(await h.c.waitTichDaoMarker(info,'release',1),false,'an interrupted scheduler never passes the marker');
 assert.equal(info.abort.signal.aborted,true);
 const h2=harness();h2.setTime(1);const info2=await h2.c.beginTichDaoAction(h2.actor,'ultimate',null,1);
 h2.setTime(1+1200);
 assert.equal(await h2.c.waitTichDaoMarker(info2,'release',1),true,'ultimate release waits for the authored 1083ms strike');
 assert.equal(h2.actor.stateDuration,4000);
});
test('battle patch composes on the real Kỷ Vân + Tiêu Phong text and is idempotent',()=>{
 const patched=patchTichDaoBattle(read('dist/battle.html'),read('src/runtime/tich-dao.js'),meta);
 assert.match(patched,/\/\* HV_TICH_DAO_V1 \*\//);
 assert.match(patched,/const shadowAction=isTichDao\(actor\)\?await beginTichDaoAction/);
 assert.match(patched,/result=shadowAction\?await resolveTichDaoCast/);
 assert.match(patched,/drawTichDaoVfx\(ctx, time\);/,'Cổ Mộ VFX overlays render in the effects pass');
 assert.match(patched,/if\(isTichDao\(unit\)\)return drawTichDaoHero/);
 assert.match(patched,/isTichDao\(unit\)\?battleCharacterScale\(unit\)\*419|isTichDao\(unit\)\)\?battleCharacterScale\(unit\)\*419/);
 assert.equal(patchTichDaoBattle(patched,read('src/runtime/tich-dao.js'),meta),patched);
});
test('host composes after Kỷ Vân + Tiêu Phong and registers idle, ATK, run and detail',()=>{
 const ky=patchKyVanHost(read('index.html')+'\n'+read('src/ui/campaign-scene.js'),JSON.parse(read('assets/characters/ky-van/runtime-meta.json')),read('src/ui/ky-van-detail.js'));
 const tp=patchTieuPhongHost(ky,JSON.parse(read('assets/characters/tieu-phong/runtime-meta.json')),read('src/ui/tieu-phong-detail.js'));
 const host=patchTichDaoHost(tp,meta,read('src/ui/tich-dao-detail.js'));
 assert.match(host,/tich_dao:\{slug:'tich-dao'/);
 assert.match(host,/ tich_dao:\{he:'soul',faction:'am_hon',archetype:'duelist'/);
 assert.match(host,/startTichDaoDetailIdle\(\)/);
 assert.match(host,/Object.assign\(farmAttackSpecs,\{tich_dao:/);
 assert.match(host,/"linh_dong","bach_dien","ky_van","tieu_phong","tich_dao"\]/);
 assert.equal(host.split('"linh_dong","bach_dien","ky_van","tieu_phong","tich_dao"]').length-1,3);
 assert.equal(patchTichDaoHost(host,meta,''),host);
});
