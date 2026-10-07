import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../scripts/linh-dong-timing-main-v1.mjs',import.meta.url),'utf8');
const start=source.indexOf('export function patchLinhDongIndex'),end=source.indexOf('\nexport ',start+10);
const fn=source.slice(start,end).replace('export ','');
const patch=new Function('const indexMarker="/* TKT-0145 canonical Linh Dong roster bridge */";const replaceIfPresent=(s,a,b)=>s.includes(a)?s.replace(a,b):s;'+fn+';return patchLinhDongIndex;')();
test('roster bridge keeps its marker out of visible document text',()=>{
 const output=patch('<html><head></head><body></body></html>');
 const visible=output.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,'').trim();
 assert.equal(visible,'');
 assert.equal(patch(output),output,'build remains idempotent');
});
