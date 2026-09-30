import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { ENEMY_ARCHER_BLEED } from '../scripts/battle-enemy-cell-cleanup-v1.mjs';

test('enemy archer loses only the two neighbour fragments, retaining the complete original grid/pivot',async()=>{
  const pixels=src=>sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const before=await pixels('dist/assets/battle-runtime/embedded-04.webp');
  const after=await pixels('dist/assets/battle-runtime/embedded-04-isolated-v1.webp');
  assert.equal(after.info.width,before.info.width);assert.equal(after.info.height,before.info.height);
  let removed=0,retained=0;
  for(let y=0;y<before.info.height;y++)for(let x=0;x<before.info.width;x++){
    const offset=(y*before.info.width+x)*4,masked=ENEMY_ARCHER_BLEED.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
    if(masked){assert.equal(after.data[offset+3],0);if(before.data[offset+3])removed++;}
    else if(before.data[offset+3]){assert.ok(before.data.subarray(offset,offset+4).equals(after.data.subarray(offset,offset+4)));retained++;}
  }
  assert.ok(removed>0);assert.ok(retained>500000);
  for(const file of ['battle.html','index.html'])assert.ok(readFileSync('dist/'+file,'utf8').includes('embedded-04-isolated-v1.webp'));
});
