import test from 'node:test';
import assert from 'node:assert/strict';
import { createDecodedAtlasCache } from '../src/assets/decoded-atlas-cache.mjs';

test('a stalled image releases the sole mobile decoder slot and can be retried', async () => {
  const images=[];
  const cache=createDecodedAtlasCache({maxBytes:100,maxLoading:1,loadTimeoutMs:10,log:()=>{},makeImage:()=>{const image={src:'',naturalWidth:2,naturalHeight:2};images.push(image);return image;}});
  const clip=src=>({src,cols:1,frames:1,w:2,h:2});
  const stalled=cache.reserve(clip('stalled.webp'));
  const next=cache.reserve(clip('next.webp'));
  await new Promise(r=>setTimeout(r,15));
  assert.equal(stalled.state,'failed');
  assert.match(stalled.error,/network.*timeout/);
  assert.equal(next.state,'loading');
  images[1].complete=true;images[1].onload();await next.promise;
  cache.allowRetry('stalled.webp');
  const retry=cache.reserve(clip('stalled.webp'));
  images[2].complete=true;images[2].onload();await retry.promise;
  assert.equal(retry.state,'ready');cache.clear();
});
