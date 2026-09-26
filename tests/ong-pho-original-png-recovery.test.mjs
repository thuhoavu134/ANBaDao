import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { ONG_PHO_PNG_RECOVERY, recoverOngPhoPng, verifyPng } from '../scripts/ong-pho-original-png-recovery.mjs';
for(const entry of ONG_PHO_PNG_RECOVERY)test('original Ông Phở '+entry.file+' recovers without changing authored pixels/timing',async()=>{
  const original=readFileSync('assets/battle-runtime/'+entry.file);
  assert.throws(()=>verifyPng(original,entry.rawBytes),/CRC/);
  const fixed=recoverOngPhoPng(original,entry);
  const changed=[];for(let i=0;i<original.length;i++)if(original[i]!==fixed[i])changed.push(i);
  assert.deepEqual(changed,[entry.offset]);
  verifyPng(fixed,entry.rawBytes);
  const decoded=await sharp(fixed).raw().toBuffer({resolveWithObject:true});
  assert.ok(decoded.data.length>0);
  assert.deepEqual(recoverOngPhoPng(fixed,entry),fixed);
  const unrelated=Buffer.from(original);unrelated[0]^=1;
  assert.throws(()=>recoverOngPhoPng(unrelated,entry),/Unknown original/);
});
