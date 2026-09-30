import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import { createDecodedAtlasCache } from '../src/assets/decoded-atlas-cache.mjs';
import { createPersistentAtlasPages } from '../src/render/persistent-atlas-pages.mjs';
import { battlePersistentSourceSpecs, persistentPageBudget } from '../scripts/battle-persistent-pages-v1.mjs';

const html = readFileSync('dist/battle.html', 'utf8');
const packs = JSON.parse(readFileSync('dist/battle-persistent-packs.json', 'utf8'));
const specs = battlePersistentSourceSpecs(html), budget = persistentPageBudget(packs);
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture() {
  const pending = [], loads = [];
  const metadata = new Map(Object.values(packs).flatMap(p => p.pages.map(page => [page.src, page])));
  class Image {
    complete=false;naturalWidth=0;naturalHeight=0;
    set src(value) { this.url=value;if(value){pending.push(this);loads.push(value);} }
    get src() { return this.url; }
    removeAttribute() { this.url='';this.complete=false; }
    ready() { const page=metadata.get(this.url);if(!page)return;this.complete=true;
      this.naturalWidth=page.atlasWidth;this.naturalHeight=page.atlasHeight;this.onload?.(); }
  }
  const cache=createDecodedAtlasCache({maxBytes:budget,maxLoading:1,makeImage:()=>new Image(),log(){}});
  const player=createPersistentAtlasPages({packs,cache});
  const pump=async()=>{while(pending.length){pending.shift().ready();await tick();}};
  return {player,cache,pending,loads,pump};
}

test('all 224 looping frames preserve visible RGBA pixels and full-cell registration', async () => {
  let frames=0;
  const pixels=async src=>{
    const {data,info}=await sharp('dist/'+src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    // Invisible RGB is not a painted pixel and WebP may canonicalize it.
    for(let i=0;i<data.length;i+=4)if(!data[i+3])data.fill(0,i,i+3);
    return {data,info};
  };
  for(const [id,pack] of Object.entries(packs)){
    const spec=specs[id],source=await pixels(spec.src);let start=0;
    for(const page of pack.pages){
      const decoded=await pixels(page.src);
      assert.equal(decoded.info.width,page.atlasWidth);assert.equal(decoded.info.height,page.atlasHeight);
      for(let f=0;f<page.frames;f++){
        for(let y=0;y<spec.cellH;y++){
          const old=(((Math.floor((start+f)/spec.cols)*spec.cellH+y)*source.info.width)+(start+f)%spec.cols*spec.cellW)*4;
          const next=(((Math.floor(f/page.cols)*spec.cellH+y)*decoded.info.width)+f%page.cols*spec.cellW)*4;
          assert.ok(source.data.subarray(old,old+spec.cellW*4).equals(decoded.data.subarray(next,next+spec.cellW*4)),id+' frame '+(start+f));
        }
        frames++;
      }
      start+=page.frames;
    }
    assert.equal(start,spec.frames);
  }
  assert.equal(frames,224);
});

test('iPhone native + persistent normal budgets still sum to 64 MiB; action pins do not evict idle pages', async () => {
  const start=html.indexOf('const BATTLE_NATIVE_ATLAS_CACHE='),end=html.indexOf('window.__HV_NATIVE_ATLAS_CACHE=',start);
  const box=vm.createContext({Image:class{},navigator:{userAgent:'iPhone'},performance:{now:()=>0}});
  const native=vm.runInContext(html.slice(start,end)+';BATTLE_NATIVE_ATLAS_CACHE',box);
  assert.equal(native.inspect().configuredMaxBytes+budget,64*1024*1024);
  assert.ok(budget<=32*1024*1024);
  const f=fixture();for(const id of Object.keys(packs))f.player.frame(id,0);await f.pump();
  const before=f.player.frame('dinh-idle',3);await f.pump();
  const release=native.retain(['cast','vfx','impact'],3*480*270*64*4);
  assert.equal(f.player.frame('dinh-idle',3).image,before.image);
  release();native.clear();f.player.clear();assert.equal(f.cache.inspect().bytes,0);
});

test('40 seconds of simultaneous bodies and shields keep requested frames across page boundaries', async () => {
  const f=fixture();
  for(const id of Object.keys(packs))f.player.frame(id,0);await f.pump();
  for(let paint=0;paint<1200;paint++){
    const time=paint*1000/30;
    for(const [id,pack] of Object.entries(packs)){
      const requested=Math.floor(time/(id==='luc-idle'?42:62.5))%pack.frames;
      const frame=f.player.frame(id,requested);
      assert.ok(frame,id+' remains visible');
      assert.equal(frame.sx/pack.cellW,requested%pack.pageFrames,id+' never resets to first idle snapshot');
      assert.ok(frame.image.complete);
    }
    await f.pump();assert.ok(f.cache.inspect().bytes<=budget);
    assert.ok(f.cache.inspect().entries.filter(e=>e.pins>0).length<=6);
  }
  f.player.clear();
});

test('a delayed/failed next page holds the last painted pose, then resumes; shield removal releases pins', async () => {
  const f=fixture(),id='dinh-shield',pack=packs[id];
  assert.equal(f.player.frame(id,0),null);await f.pump();
  const old=f.player.frame(id,7);
  const delayed=f.player.frame(id,8);assert.equal(delayed.image,old.image);assert.equal(delayed.sx,7*pack.cellW);
  f.pending.shift().onerror();await tick();
  assert.equal(f.player.frame(id,8).image,old.image,'load error cannot erase the current page');
  await f.pump();const next=f.player.frame(id,8);assert.notEqual(next.image,old.image);assert.equal(next.sx,0);
  f.player.release(id);assert.equal(f.cache.inspect().entries.filter(e=>e.pins).length,0);
  f.player.clear();
});

test('paged renderer preserves destination rectangle, mirroring and shield blending', async () => {
  const f=fixture(),calls=[];f.player.frame('dinh-shield',0);await f.pump();
  const context={save(){},restore(){},translate:(...a)=>calls.push(['translate',...a]),scale:(...a)=>calls.push(['scale',...a]),
    drawImage:(...a)=>calls.push(['draw',...a])};
  assert.equal(f.player.draw(context,'dinh-shield',0,123,456,330,186,{baseline:93,screen:true,alpha:.82,flip:true}),true);
  assert.deepEqual(calls[0],['translate',123,456]);assert.deepEqual(calls[1],['scale',-1,1]);
  assert.deepEqual(calls[2].slice(-4),[-165,-93,330,186]);assert.equal(context.globalAlpha,.82);
  assert.equal(context.globalCompositeOperation,'screen');f.player.clear();
});
