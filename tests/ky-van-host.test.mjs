import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {patchKyVanHost} from '../scripts/ky-van-runtime-v1.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const meta=JSON.parse(read('assets/characters/ky-van/runtime-meta.json'));
const scene=read('src/ui/campaign-scene.js');
const patched=()=>patchKyVanHost(read('index.html')+'\n'+scene,meta,read('src/ui/ky-van-detail.js'));
test('campaign registration plays all supplied idle frames through the existing page clock',()=>{
 const output=patched(),ctx=vm.createContext({spriteSpecs:{},preparationIdlePacks:{},runSpecs:{},farmAttackSpecs:{},reducedMotion:{matches:false},campaignActorArtId:id=>id});
 for(const statement of output.match(/^Object.assign\((?:spriteSpecs|preparationIdlePacks|runSpecs|farmAttackSpecs),\{ky_van:.*$/gm)||[])vm.runInContext(statement,ctx);
 for(const name of ['frameAt','preparationSpriteFor'])vm.runInContext(scene.match(new RegExp('function '+name+'\\([^]*?\\n}'))[0],ctx);
 let time=0;
 for(let f=0;f<83;f++){
  const pose=ctx.preparationSpriteFor({id:'ky_van'},time+.001);
  assert.ok(pose.spec.src.endsWith('idle-'+Math.floor(f/16)+'.webp'));
  assert.equal(pose.spec.frameIndex,f%16);assert.equal(pose.spec.cellW,240);
  assert.ok(pose.spec.cols*pose.spec.rows*240*220*4<4*1024*1024);
  time+=meta.idle.frameDurationsMs[f];
 }
 assert.ok(ctx.runSpecs.ky_van.src.endsWith('campaign/run.webp'));
 assert.ok(ctx.farmAttackSpecs.ky_van.src.endsWith('campaign/basic.webp'));
 assert.equal(ctx.preparationSpriteFor({id:'not-in-roster'},0).spec,undefined);
});
test('detail selects its canvas and bounds the portrait in the actual relocated hall',()=>{
 const output=patched();assert.match(output,/id==='ky_van'\?'<canvas id="kyVanDetailIdle"/);
 assert.match(output,/if\(id==='ky_van'\)\{startKyVanDetailIdle\(\);\}/);
 assert.match(output,/#hdBody \.hstage\[data-hero-id="ky_van"\]>\.hsava\{display:none!important;/);
 assert.match(output,/#kyVanDetailIdle\{[^}]*width:270px!important;height:248px!important/);
 new vm.Script(read('src/ui/ky-van-detail.js'));
});
test('refreshing hero upgrades preserves the existing Ky Van idle canvas and clock',()=>{
 const source=read('src/ui/hero-roster-runtime.js'),start=source.indexOf('  const baseDetail = renderHeroDetail;'),end=source.indexOf('  // Make the authored back',start);
 let starts=0,replacements=0;
 const oldCanvas={id:'kyVanDetailIdle'},nextCanvas={replaceWith(value){assert.equal(value,oldCanvas);replacements++;}};
 let refreshed=false;
 const ctx=vm.createContext({ST:{screen:'heroDetail',_heroDetailId:'ky_van'},_lucDetailRaf:42,
  document:{getElementById:id=>id==='kyVanDetailIdle'?(refreshed?nextCanvas:oldCanvas):null},
  startLucAnhDetailIdle(){},startLinhDongDetailIdle(){},startBachDienDetailIdle(){},startKyVanDetailIdle(){starts++;}});
 vm.runInContext('function renderHeroDetail(){startKyVanDetailIdle();onRefresh();}',Object.assign(ctx,{onRefresh:()=>{refreshed=true;}}));
 vm.runInContext(source.slice(start,end),ctx);ctx.renderHeroDetail('ky_van');
 assert.equal(starts,0);assert.equal(replacements,1);assert.equal(ctx._lucDetailRaf,42);
 ctx.startKyVanDetailIdle();assert.equal(starts,1,'original starter is restored for a different hero entry');
});
