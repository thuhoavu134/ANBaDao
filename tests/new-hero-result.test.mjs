import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const root=resolve('.');
function generated(){
 const dir=mkdtempSync(join(tmpdir(),'hero-result-'));
 try{
  mkdirSync(join(dir,'dist'));
  writeFileSync(join(dir,'dist/battle.html'),'<head></head><body>root.querySelectorAll(\'canvas.irv-hero\').forEach(c=>paintHero(c,m));</body>');
  const p=spawnSync(process.execPath,[join(root,'scripts/result-character-motion-v1.mjs')],{cwd:dir,encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  return readFileSync(join(dir,'dist/battle.html'),'utf8');
 }finally{rmSync(dir,{recursive:true,force:true});}
}
const html=generated(),source=html.match(/<script id="hv-result-character-motion-v1">([\s\S]*?)<\/script>/)[1];
const c=vm.createContext({window:{},document:{},console});
// Evaluate only the real manifest and identity resolver, before DOM installation.
vm.runInContext(source.slice(source.indexOf('const MANIFEST='),source.indexOf('const mvp='))+';globalThis.resolveHero=keyFor;globalThis.manifest=MANIFEST;',c);
for(const [slug,name] of [['ky-van','Kỷ Vân'],['tieu-phong','Tiêu Phong'],['tich-dao','Tích Đạo']]){
 test(slug+' result uses authored identity, run, every idle page and fall',()=>{
  const id=slug.replaceAll('-','_'),meta=JSON.parse(readFileSync(join(root,'assets/characters',slug,'runtime-meta.json')));
  for(const hero of [{sourceId:'hero_splus_'+id,name,archetype:'mystic'},{id, name},{sourceHeroId:'hero_splus_'+id,id:'battle-unit',name}]){
   assert.equal(c.resolveHero(hero),id);
  }
  const entry=c.manifest[id];assert.ok(entry);
  assert.ok(entry.run.src.endsWith('/'+slug+'/run.webp'));
  assert.ok(entry.fall.src.endsWith('/'+slug+'/fall-die.webp'));
  assert.equal(entry.idle.frames,meta.idle.frames);
  assert.deepEqual(Array.from(entry.idle.durations),meta.idle.frameDurationsMs);
  // Repaginated packs page their authored idle through idleVisual; legacy
  // packs keep the 16-frame idle-N pages.
  const pf=meta.clips['idle-0']?16:meta.idleVisual.pageFrames;
  const pageFile=i=>meta.clips['idle-0']?'idle-'+i+'.webp':'idle-authored-'+i+'.webp';
  assert.equal(entry.idle.pageFrames,pf);
  assert.equal(entry.idle.pages.length,Math.ceil(meta.idle.frames/pf));
  for(const [i,page] of entry.idle.pages.entries())assert.ok(page.src.endsWith('/'+slug+'/'+pageFile(i)));
 });
 test(slug+' maps every global idle frame into the correct page cell',()=>{
  const entry=c.manifest[slug.replaceAll('-','_')],draws=[],pf=entry.idle.pageFrames;
  const painter=source.slice(source.indexOf('function drawFrame('),source.indexOf('function drawGenericPose('));
  const ctx={clearRect(){},drawImage:(...a)=>draws.push(a)};
  const paintContext=vm.createContext({imageFor:src=>({ready:true,image:{src,naturalWidth:4000}})});
  vm.runInContext(painter,paintContext);
  for(let f=0;f<entry.idle.frames;f++){
   const page=entry.idle.pages[Math.floor(f/pf)],local=f%pf;
   assert.equal(paintContext.drawFrame({width:480,height:440,getContext:()=>ctx},entry.idle,f),true);
   const d=draws.at(-1);
   assert.equal(d[0].src,page.src);
   assert.equal(d[1],(local%page.cols)*page.cellW);
   assert.equal(d[2],Math.floor(local/page.cols)*page.cellH);
  }
 });
}
