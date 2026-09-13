import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
function api(){const start=source.indexOf('function sampleCampaignFarm(');assert.ok(start>=0,'farm presentation sampler exists');return runInNewContext(source.slice(start,source.indexOf('function drawCampaignFarm(',start))+'\nsampleCampaignFarm;');}
test('AC12 farm spawns, takes visual hits, dissolves, rests and rotates through actual squad',()=>{
 const sample=api(); const squad=Object.freeze([Object.freeze({id:'a',slot:4}),Object.freeze({id:'b',slot:0})]);
 assert.equal(sample(0,[]),null);
 assert.equal(sample(0,squad).phase,'spawn');
 assert.equal(sample(1900,squad).phase,'attack');
 assert.ok(sample(2600,squad).hp<1);
 assert.equal(sample(2800,squad).phase,'dissolve');
 assert.equal(sample(9500,squad).phase,'rest');
 assert.equal(sample(10000,squad).hero.id,'b');
 assert.equal(sample(20000,squad).hero.id,'a');
 assert.equal(sample(1000,squad,true),null);
 for(let t=0;t<60000;t+=137){const f=sample(t,squad);assert.ok(f.alpha>=0&&f.alpha<=1);assert.ok(f.hp>=0&&f.hp<=1);}
});
test('AC12 farm is presentation-only and shares scene lifetime, no reward or combat owner',()=>{
 const start=source.indexOf('function sampleCampaignFarm(');assert.ok(start>=0);
 const chunk=source.slice(start,source.indexOf('function drawScene(',start));
 assert.doesNotMatch(chunk,/\b(?:P|DATA|claimAfkChest|startChapter|setInterval|setTimeout|requestAnimationFrame)\b/);
 assert.match(source,/preparing \? null : sampleCampaignFarm/);
 assert.match(source,/drawCampaignFarm\(ctx, farm/);
});
