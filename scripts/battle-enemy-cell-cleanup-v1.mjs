import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE='assets/battle-runtime/embedded-04.webp';
const OUTPUT='assets/battle-runtime/embedded-04-isolated-v1.webp';
const SOURCE_BLOB='d58c9c694924c61b9e0f4ec248a227607db22ebf';
// Authored sheet is 1536×1024, six 512×512 cells. The upper middle
// archer cell includes pieces of its left/below neighbours. These two fixed
// empty-body regions were inspected in the source and the owner's recording.
export const ENEMY_ARCHER_BLEED = Object.freeze([
  {x:512,y:0,w:40,h:512}, {x:512+172,y:488,w:60,h:24}
]);
export async function installBattleEnemyCellCleanup(root) {
  const bytes=readFileSync(join(root,'dist',SOURCE));
  const sha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  if(sha!==SOURCE_BLOB)throw new Error('Enemy sheet changed; review the fixed bleed regions before rebuilding');
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==1536||info.height!==1024)throw new Error('Enemy sheet grid changed');
  for(const r of ENEMY_ARCHER_BLEED)for(let y=r.y;y<r.y+r.h;y++)
    for(let x=r.x;x<r.x+r.w;x++)data.fill(0,(y*info.width+x)*4,(y*info.width+x)*4+4);
  await sharp(data,{raw:{width:info.width,height:info.height,channels:4}})
    .webp({lossless:true,effort:2}).toFile(join(root,'dist',OUTPUT));
  for(const file of ['battle.html','index.html']){
    const path=join(root,'dist',file),html=readFileSync(path,'utf8');
    writeFileSync(path,html.replaceAll(SOURCE,OUTPUT));
  }
}
