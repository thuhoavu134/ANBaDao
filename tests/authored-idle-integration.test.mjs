import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root=new URL('../',import.meta.url);
for(const hero of ['ky-van','tieu-phong']){
 const base=new URL(`../assets/characters/${hero}/`,import.meta.url);
 const meta=JSON.parse(readFileSync(new URL('runtime-meta.json',base),'utf8'));
 test(`${hero} authored idle and portrait assets are complete and mobile-safe`,()=>{
  const idle=meta.idleVisual;
  assert.equal(idle.frames,30);assert.equal(idle.pageFrames,9);assert.equal(idle.pages,4);
  assert.ok(Math.abs(idle.frameDurationsMs.reduce((a,b)=>a+b,0)-idle.durationMs)<.001);
  assert.equal(meta.clips['idle-authored-0'].cellW,432);assert.equal(meta.clips['idle-authored-0'].cellH,668);
  let frameTotal=0;
  for(let page=0;page<idle.pages;page++){
   const clip=meta.clips[`idle-authored-${page}`],file=join(base.pathname,clip.file);
   frameTotal+=clip.frames;
   assert.equal(clip.rows,3);assert.ok(clip.cols*clip.cellW*clip.rows*clip.cellH*4<14*1024*1024);
   const bytes=readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
  assert.equal(frameTotal,30);
  const avatar=readFileSync(new URL('avatar.webp',base));assert.equal(avatar.toString('ascii',8,12),'WEBP');
  const source=JSON.parse(readFileSync(new URL('idle-authored-source.json',base),'utf8'));
  assert.equal(source.avatarFrame,12);
  assert.deepEqual(source.runtimeContentSize,[Math.round(source.sourceFrameSize[0]*idle.cellH/source.sourceFrameSize[1]),idle.cellH]);
  assert.equal(source.fitPolicy,'contain, centered horizontally, bottom anchored');
 });
 test(`${hero} battle, hero detail, roster and portrait point to authored assets`,()=>{
  const runtime=readFileSync(new URL(`../src/runtime/${hero}.js`,import.meta.url),'utf8');
  const detail=readFileSync(new URL(`../src/ui/${hero}-detail.js`,import.meta.url),'utf8');
  const profile=readFileSync(new URL(`../src/domain/hero/${hero}.mjs`,import.meta.url),'utf8');
  const installer=readFileSync(new URL(`../scripts/${hero}-runtime-v1.mjs`,import.meta.url),'utf8');
  assert.match(runtime,/idleVisual\.frameDurationsMs/);assert.match(runtime,/idle-authored-/);
  assert.match(detail,/idle-authored-/);assert.match(detail,/frame\/9/);
  assert.match(profile,/portrait:'assets\/characters\/[a-z-]+\/avatar\.webp'/);
  assert.match(installer,/avatar\.webp/);assert.match(installer,/idleVisual/);
 });
}
