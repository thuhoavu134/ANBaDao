import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {buildLoadingLossless,patchLoadingImages} from '../scripts/loading-lossless-v1.mjs';

test('static and templated menu references switch together, unrelated art is untouched',()=>{
 const html='assets/ui/menu-v3233/icons/${icon}.png assets/ui/menu-v3233/icons/heroes.png assets/characters/hero.png';
 const out=patchLoadingImages(html);
 assert.match(out,/icons\/lossless-v1\/\$\{icon\}\.webp/);
 assert.match(out,/icons\/lossless-v1\/heroes\.webp/);
 assert.match(out,/assets\/characters\/hero\.png/);
 assert.equal(patchLoadingImages(out),out);
 assert.equal(patchLoadingImages("friends:'friends'"),"friends:'friends-v2'");
 assert.match(patchLoadingImages('assets/ui/menu-v3233/icons/friends.png'),/friends-v2.webp/);
});
test('build preserves dimensions and all visible RGBA pixels without touching original',async()=>{
 const root=mkdtempSync(join(tmpdir(),'hv-lossless-'));
 try{
 const dir=join(root,'dist/assets/ui/menu-v3233/icons');mkdirSync(dir,{recursive:true});
 const pixels=Buffer.alloc(64*64*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=i%251;pixels[i+1]=80;pixels[i+2]=170;pixels[i+3]=(i/4)%256;}
 const file=join(dir,'heroes.png');await sharp(pixels,{raw:{width:64,height:64,channels:4}}).png().toFile(file);
 const before=readFileSync(file);writeFileSync(join(root,'dist/index.html'),'assets/ui/menu-v3233/icons/${icon}.png');writeFileSync(join(root,'dist/battle.html'),'assets/ui/menu-v3233/icons/heroes.png');
 const report=await buildLoadingLossless(root,{backgrounds:[]});assert.equal(report.images.length,1);
 const out=await sharp(join(dir,'lossless-v1/heroes.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(out.info.width,64);assert.equal(out.info.height,64);
 for(let i=0;i<pixels.length;i+=4){assert.equal(out.data[i+3],pixels[i+3]);if(pixels[i+3])assert.deepEqual(out.data.subarray(i,i+3),pixels.subarray(i,i+3));}
 assert.deepEqual(readFileSync(file),before);assert.match(readFileSync(join(root,'dist/battle.html'),'utf8'),/heroes.webp/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
