import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHeroVisibilityCache } from '../src/render/hero-visibility-cache.mjs';

function harness(slug, title, team = 'player') {
  const draws = [], canvases = [], requests = [];
  let ready = true;
  const context = () => ({save(){}, restore(){}, translate(){}, scale(){},
    drawImage(...args){draws.push(args);}});
  const cache = createHeroVisibilityCache({maxEntries:6, makeCanvas:()=>{
    const canvas={width:0,height:0,getContext:context};canvases.push(canvas);return canvas;
  }});
  const meta=JSON.parse(readFileSync(new URL('../assets/characters/'+slug+'/runtime-meta.json',import.meta.url)));
  const c=vm.createContext({[slug.replaceAll('-','_').toUpperCase()+'_META']:meta,
    __hvHeroVisibility:cache, state:{battleId:1,speed:1}, TEAM_ENEMY:'enemy',
    BACH_DIEN_LOADER:{ensure:(clip,opts)=>{requests.push({src:clip.src,priority:opts.priority});return {image:{src:clip.src,complete:ready,naturalWidth:ready?2000:0}};}},
    battleCharacterDepthScale:()=>1,battleCharacterScale:()=>.5,drawUnitHud(){},
    performance:{now:()=>0},AbortController,console});
  vm.runInContext(readFileSync(new URL('../src/runtime/'+slug+'.js',import.meta.url),'utf8'),c);
  const unit={id:'unit',sourceId:'hero_splus_'+slug.replaceAll('-','_'),team,hp:100,x:200,y:300,state:'idle'};
  return {cache,canvases,draws,requests,unit,c,setReady:v=>ready=v,
    draw:()=>{draws.length=0;return c['draw'+title+'Hero'](context(),unit,100);}};
}
for(const [slug,title] of [['ky-van','KyVan'],['tieu-phong','TieuPhong']]) {
  test(slug+': visible page is requested before speculative next page',()=>{
    const h=harness(slug,title);h.draw();
    assert.ok(h.requests[0].src.endsWith('/idle-authored-0.webp'));
    assert.equal(h.requests[0].priority,'visible');
    const next=h.requests.find(r=>r.src.endsWith('/idle-authored-1.webp'));
    assert.equal(next?.priority,'prefetch');
  });
  for(const team of ['player','enemy']) test(slug+' '+team+': body survives atlas loss and resumes live frames',()=>{
    const h=harness(slug,title,team);h.draw();assert.equal(h.cache.inspect().count,1);
    h.setReady(false);assert.equal(h.draw(),true);assert.ok(h.draws.some(d=>h.canvases.includes(d[0])));
    h.setReady(true);h.draw();assert.ok(h.draws.some(d=>d[0].src?.includes('/idle-')));
  });
  test(slug+': cold missing body reports false; defeat never draws standing',()=>{
    const h=harness(slug,title);h.setReady(false);assert.equal(h.draw(),false);
    h.setReady(true);h.unit.hp=0;h.unit.defeatedAt=0;h.draw();
    assert.ok(h.draws.every(d=>!d[0].src?.endsWith('/standing.webp')));
    h.setReady(false);h.draw();assert.equal(h.draws.length,0);
  });
  test(slug+': next battle can retain body; page teardown releases and rebuilds backup',()=>{
    const h=harness(slug,title);h.draw();h.c.state.battleId=2;h.setReady(false);
    assert.equal(h.draw(),true);assert.ok(h.draws.some(d=>h.canvases.includes(d[0])));
    h.cache.clear();assert.equal(h.cache.inspect().bytes,0);assert.ok(h.canvases.every(c=>c.width===0));
    assert.equal(h.draw(),false);h.setReady(true);assert.equal(h.draw(),true);assert.equal(h.cache.inspect().count,1);
  });
  test(slug+': cached living body is never reused after death',()=>{
    const h=harness(slug,title);h.draw();assert.equal(h.cache.inspect().count,1);
    h.unit.hp=0;h.unit.defeatedAt=0;h.setReady(false);
    assert.equal(h.draw(),false);assert.equal(h.draws.length,0);
  });
}
