import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

// Both original PNGs have damaged IDAT bytes in the first repository commit.
// The unique one-byte correction restores the STORED PNG CRC and zlib Adler32.
// No resampling, drawing, timing changes, or replacement image content.
export const ONG_PHO_PNG_RECOVERY = [
  {file:'embedded-14.png',offset:359966,xor:1,rawBytes:5184675,
    before:'a5525eefe82e7385887ea0bffbc4d897223ccf61e4dc05d61ba7941abc4a3c62',
    after:'089126dd6c01b5dc75f49863627412cec3928c09b1a980833f4ed1f56bd314ef'},
  {file:'embedded-15.png',offset:857050,xor:112,rawBytes:10369350,
    before:'ac2e9c970993f5b98cf4fb494da8fa32eef081aab420a41afe7e7ba1d136bf8b',
    after:'a843bae6a43884a9e60e645172353c908b97a1cbaf365e79ada78a737d5f4025'}
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
function crc32(b){let c=0xffffffff;for(const n of b)c=(c>>>8)^table[(c^n)&255];return (c^0xffffffff)>>>0;}
export function verifyPng(bytes,rawBytes){
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('PNG signature');
  const data=[];let offset=8,ended=false;
  while(offset+12<=bytes.length){
    const size=bytes.readUInt32BE(offset),end=offset+size+12;
    if(end>bytes.length)throw new Error('PNG truncated');
    if(crc32(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))throw new Error('PNG CRC mismatch at '+offset);
    const type=bytes.toString('ascii',offset+4,offset+8);
    if(type==='IDAT')data.push(bytes.subarray(offset+8,end-4));
    if(type==='IEND')ended=true;
    offset=end;
  }
  if(!ended||offset!==bytes.length)throw new Error('PNG incomplete');
  // inflateSync validates the unchanged zlib Adler32, independently of PNG CRC.
  if(inflateSync(Buffer.concat(data)).length!==rawBytes)throw new Error('PNG decoded size');
}
export function recoverOngPhoPng(source,entry){
  const bytes=Buffer.from(source),hash=sha(bytes);
  if(hash===entry.after){verifyPng(bytes,entry.rawBytes);return bytes;}
  if(hash!==entry.before)throw new Error('Unknown original Ông Phở PNG: '+entry.file);
  bytes[entry.offset]^=entry.xor;
  if(sha(bytes)!==entry.after)throw new Error('Unexpected recovered PNG fingerprint');
  verifyPng(bytes,entry.rawBytes);return bytes;
}
export function buildOngPhoPngRecovery(out){
  for(const entry of ONG_PHO_PNG_RECOVERY){
    const path=join(out,'assets/battle-runtime',entry.file);
    writeFileSync(path,recoverOngPhoPng(readFileSync(path),entry));
  }
  console.log('Ông Phở original fall/skill1 PNGs recovered: two known bytes; original CRC + Adler32 verified.');
}
