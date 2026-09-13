import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
function api(){const start=source.indexOf('const CAMPAIGN_TRAVEL_PATH');assert.ok(start>=0);return runInNewContext(source.slice(start,source.indexOf('function drawCampaignFarm(',start))+'\nsampleCampaignFarm;');}
// TKT-0115 supersedes TKT-0114's single-hero rotating loop with whole-squad farming.
test('farm keeps sparse squad identities and authored fractional frame durations',()=>{
 const sample=api(), squad=Object.freeze([Object.freeze({id:'a',slot:4}),Object.freeze({id:'b',slot:0})]);
 const specs={a:{frames:3,ms:62.5,durations:[60,70,62.5]}};
 const frame=sample(6260,squad,false,specs);
 assert.equal(frame.actors[0].slot,4);assert.equal(frame.actors[1].slot,0);
 assert.equal(frame.actors[0].duration,192.5);assert.equal(frame.actors[0].attackTime,60);
 assert.equal(sample(6260,squad,true,specs),null);assert.equal(sample(6260,[]),null);
});
test('farm remains presentation-only and shares scene lifetime, no reward or combat owner',()=>{
 const start=source.indexOf('const CAMPAIGN_TRAVEL_PATH');assert.ok(start>=0);
 const chunk=source.slice(start,source.indexOf('function drawScene(',start));
 assert.doesNotMatch(chunk,/\b(?:P|DATA|claimAfkChest|startChapter|setInterval|setTimeout|requestAnimationFrame)\b/);
 assert.match(source,/preparing \? null : sampleCampaignFarm/);
 assert.match(source,/drawCampaignFarm\(ctx, farm/);
});
