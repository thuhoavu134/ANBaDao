import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROSTER_PORTRAIT_LANDMARKS,rosterPortraitSource,rosterPortraitStyle} from '../src/domain/hero/roster-portrait.mjs';

test('every reviewed source maps its face centre and width to the common target at mobile and desktop sizes',()=>{
  for(const [src,[x,y,face]] of Object.entries(ROSTER_PORTRAIT_LANDMARKS)){
    assert.ok(x>0&&x<100&&y>0&&y<100&&face>0&&face<100,src);
    const scale=Number(rosterPortraitStyle(src).match(/width:([\d.]+)%/)[1])/100;
    for(const width of [78,150,240]){
      assert.ok(Math.abs(width*scale*face/100-width*.38)<1e-8,src);
      assert.equal(width*.5-width*scale*x/100+width*scale*x/100,width*.5);
    }
  }
});
test('Tich Dao card uses an explicit reviewed open-eye cell; unrelated surfaces keep their asset',()=>{
  assert.equal(rosterPortraitSource('tich_dao','old'), 'assets/characters/tich-dao/roster-open-eyes.webp');
  assert.equal(rosterPortraitSource('linh_dong','original'),'original');
  assert.equal(rosterPortraitStyle('unreviewed'),'');
  const converter=readFileSync(new URL('../scripts/tich-dao-convert-v1.mjs',import.meta.url),'utf8');
  assert.match(converter,/const avatarFrame=0;/);
  assert.doesNotMatch(converter,/stat.channels\[3\].mean>best/);
});
test('real roster installer includes the shared owner and preserves parseable runtime',()=>{
  const root=mkdtempSync(join(tmpdir(),'roster-portrait-'));
  try{
    mkdirSync(join(root,'dist'));mkdirSync(join(root,'src'),{recursive:true});
    cpSync(resolve('src/domain'),join(root,'src/domain'),{recursive:true});
    cpSync(resolve('src/ui'),join(root,'src/ui'),{recursive:true});
    writeFileSync(join(root,'dist/index.html'),'<html><head></head><body></body></html>');
    execFileSync(process.execPath,[resolve('scripts/hero-roster-phase-a-v4.mjs')],{cwd:root});
    const html=readFileSync(join(root,'dist/index.html'),'utf8');
    const js=html.match(/<script id="hero-roster-state-v1-js">([\s\S]*?)<\/script>/)[1];
    assert.doesNotThrow(()=>new Function(js));
    assert.match(js,/portraitFor: id => rosterPortraitSource/);
    assert.match(js,/data-portrait-reviewed/);
    assert.doesNotMatch(html,/width:168%/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
