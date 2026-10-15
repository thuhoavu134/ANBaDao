import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHeroVisibilityCache} from '../src/render/hero-visibility-cache.mjs';
const meta=JSON.parse(readFileSync(new URL('../assets/characters/ky-van/runtime-meta.json',import.meta.url)));
const runtime=readFileSync(new URL('../src/runtime/ky-van.js',import.meta.url),'utf8');
function harness(){let now=0,releases=0;const draws=[],sounds=[],requested=[],rotations=[];const actor={id:'ky',sourceId:'hero_splus_ky_van',team:'player',hp:100,x:200,y:400,state:'idle',stateStarted:0};const target={id:'enemy',team:'enemy',hp:100,x:600,y:400,slot:0};const c=vm.createContext({__hvHeroVisibility:createHeroVisibilityCache(),KY_VAN_META:meta,performance:{now:()=>now},state:{battleId:1,speed:1,sound:true},units:[actor,target],innerWidth:900,TEAM_ENEMY:'enemy',AbortController,console,BACH_DIEN_LOADER:{ensure:clip=>{requested.push(clip.src);return {image:{src:clip.src,complete:true,naturalWidth:2000}};},acquire:async()=>({release:()=>releases++})},window:{HonVietSfx:{prepare:async()=>true,play:(...a)=>sounds.push(a)}},__hvIsSkipping:()=>false,__hvSkipVisualAssets:fn=>fn(),battleCharacterDepthScale:()=>1,battleCharacterScale:()=>.34*310/419,drawUnitHud:()=>{}});vm.runInContext(runtime,c);const ctx={save(){},restore(){},translate(){},scale(){},rotate(a){rotations.push(a);},drawImage(...args){draws.push(args)}};return {c,actor,target,ctx,draws,sounds,requested,rotations,setTime:t=>now=t,releases:()=>releases};}
test('supplied 30-pose idle preserves authored timing and mobile atlas page limits',()=>{const h=harness(),idle=meta.idleVisual;assert.equal(idle.frames,30);assert.ok(Math.abs(idle.durationMs-2416.667)<.02);let elapsed=0;for(let f=0;f<30;f++){assert.equal(h.c.kyVanFrame(idle.frameDurationsMs,elapsed+.001,true),f);elapsed+=idle.frameDurationsMs[f];}assert.equal(h.c.kyVanFrame(idle.frameDurationsMs,elapsed+.001,true),0);for(const [key,c]of Object.entries(meta.clips))if(key.startsWith('idle-authored-'))assert.ok(c.cols*c.cellW*c.rows*c.cellH*4<14*1024*1024);});
test('battle idle uses the tall authored sheet and prefetches the next nine-frame page',()=>{const h=harness();h.c.drawKyVanHero(h.ctx,h.actor,0);const body=h.draws[0];assert.ok(body[0].src.endsWith('idle-authored-0.webp'));assert.equal(body[1],0);assert.equal(body[2],0);assert.deepEqual(body.slice(5),[-159,-492.5,318,492.5]);assert.ok(h.requested.some(src=>src.endsWith('idle-authored-1.webp')));});
test('hit, run and death choose supplied sheets; death clamps to the last frame',()=>{const h=harness();for(const [state,key]of [['run','run'],['hurt','hit']]){h.actor.state=state;h.c.drawKyVanHero(h.ctx,h.actor,500);assert.ok(h.draws.at(-1)[0].src.endsWith(key+'.webp'));}h.actor.hp=0;h.actor.defeatedAt=0;h.c.drawKyVanHero(h.ctx,h.actor,10000);const d=h.draws.at(-1);assert.ok(d[0].src.endsWith('fall-die.webp'));assert.equal(d[1],5*480);assert.equal(d[2],2*440);});
test('ultimate draws twenty upright branch bolts and an enlarged impact; cancel still releases its lease/audio',async()=>{const h=harness();h.setTime(1);const info=await h.c.beginKyVanAction(h.actor,'ultimate',h.target,1);h.setTime(1901);h.c.drawKyVanFx(h.ctx);assert.equal(h.draws.filter(x=>x[0].src.endsWith('bolt.webp')).length,20);assert.equal(h.draws.filter(x=>x[0].src.endsWith('impact.webp')).length,1);assert.ok(h.rotations.length>0&&h.rotations.every(a=>Math.abs(a)<=.27),'lightning should remain upright with only a small fan angle');h.c.cancelKyVanActions();assert.equal(h.releases(),1);assert.equal(info.abort.signal.aborted,true);assert.equal(h.actor._kyVanAction,undefined);assert.equal(h.sounds.length,1);});

test('basic sends a larger five-branch lightning burst and enlarged impact without changing clocks',async()=>{
 const h=harness();h.setTime(1);const info=await h.c.beginKyVanAction(h.actor,'basic',h.target,1);
 assert.equal(info.actor.stateDuration,meta.clips.basic.durationMs);
 h.setTime(851);h.c.drawKyVanFx(h.ctx);
 const bolts=h.draws.filter(x=>x[0].src.endsWith('bolt.webp'));
 assert.equal(bolts.length,5);assert.ok(Math.max(...bolts.map(x=>x[8]))>=280);
 assert.ok(h.rotations.length>0&&h.rotations.every(a=>Math.abs(a)<=.27),'basic lightning should remain upright');
 h.setTime(1151);h.draws.length=0;h.c.drawKyVanFx(h.ctx);
 const hit=h.draws.find(x=>x[0].src.endsWith('impact.webp'));assert.ok(hit);assert.ok(hit[7]>=200&&hit[8]>=200);
 h.c.cancelKyVanActions();
});

test('ultimate fans five enlarged lightning branches at every authored strike',async()=>{
 const h=harness();h.setTime(1);const info=await h.c.beginKyVanAction(h.actor,'ultimate',h.target,1);h.setTime(1901);h.c.drawKyVanFx(h.ctx);
 const bolts=h.draws.filter(x=>x[0].src.endsWith('bolt.webp')),impact=h.draws.filter(x=>x[0].src.endsWith('impact.webp'));
 assert.equal(info.actor.stateDuration,meta.clips.ultimate.durationMs);assert.equal(bolts.length,20);assert.equal(impact.length,1);
 assert.ok(Math.max(...bolts.map(x=>x[8]))>=280);assert.ok(impact[0][7]>=200&&impact[0][8]>=200);assert.ok(h.rotations.length>0&&h.rotations.every(a=>Math.abs(a)<=.27));
 h.c.cancelKyVanActions();
});

test('death finishes in 900/450/300ms at x1/x2/x3 and holds its last pose',()=>{for(const speed of [1,2,3]){const h=harness();h.c.state.speed=speed;assert.equal(h.c.kyVanFallDuration(),900/speed);h.actor.hp=0;h.actor.defeatedAt=0;h.actor.defeatFallDuration=900/speed;h.c.drawKyVanHero(h.ctx,h.actor,900/speed);assert.equal(h.draws.at(-1)[1],5*480);assert.equal(h.draws.at(-1)[2],2*440);}});
test('battle body uses shared viewport and formation depth owners',()=>{const h=harness();const calls=[];h.c.battleCharacterDepthScale=u=>{assert.equal(u,h.actor);return .9;};h.c.battleCharacterScale=u=>{assert.equal(u,h.actor);return .25;};h.ctx.scale=(...v)=>calls.push(v);h.c.drawKyVanHero(h.ctx,h.actor,10);assert.deepEqual(calls[0],[.225,.225]);});

