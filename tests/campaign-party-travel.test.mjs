import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const s=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
function api(){const start=s.indexOf('const CAMPAIGN_TRAVEL_PATH');assert.ok(start>=0,'party travel sampler exists');return runInNewContext(s.slice(start,s.indexOf('function drawCampaignFarm(',start))+'\n({sampleCampaignFarm});');}
const squad=Array.from({length:6},(_,slot)=>Object.freeze({id:'hero'+slot,slot}));
test('AC01 party travels continuously, pauses to fight, and reverses without teleporting',()=>{
 const {sampleCampaignFarm:f}=api();
 assert.notEqual(f(1000,squad).center.y,f(4000,squad).center.y);
 assert.deepEqual(f(7000,squad).center,f(18000,squad).center);
 for(let i=1;i<18;i++){const a=f(i*24000-1,squad).center,b=f(i*24000,squad).center;assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001);}
 assert.equal(f(500,squad,true),null);assert.equal(f(500,[]),null);
});
test('AC02-04 all squad attack multiple monsters, hits kill before loot drops and flies',()=>{
 const {sampleCampaignFarm:f}=api(); const seen=new Set(),targets=new Set();let crit=false,drop=false,fly=false;
 for(let t=0;t<24000;t+=50){const a=f(t,squad);assert.equal(a.actors.length,6);assert.ok(a.mobs.length>=3);
  for(const hit of a.hits){seen.add(hit.actorId);targets.add(hit.target);crit ||= hit.crit;assert.ok(hit.damage>0);}
  for(const m of a.mobs)assert.ok(m.hp>=0&&m.hp<=1&&m.alpha>=0&&m.alpha<=1);
  for(const l of a.loot){assert.ok(t>a.mobs[l.target].deadAt);drop ||= l.phase==='drop';fly ||= l.phase==='fly';}
 }
 assert.equal(seen.size,6);assert.ok(targets.size>=3);assert.ok(crit&&drop&&fly);
});
test('AC05 cosmetic sampler cannot access state or create clocks',()=>{
 const {sampleCampaignFarm:f}=api();const before=JSON.stringify(squad);f(12500,Object.freeze(squad));assert.equal(JSON.stringify(squad),before);
 const chunk=s.slice(s.indexOf('const CAMPAIGN_TRAVEL_PATH'),s.indexOf('function drawCampaignFarm('));
 assert.doesNotMatch(chunk,/\b(?:P|DATA|persist|claimAfkChest|setTimeout|setInterval|Date)\b/);
});
test('AC01 moving camera keeps squad and encounters inside mobile viewport and minimap projection',()=>{
 const a=runInNewContext(s.slice(s.indexOf('const HOME_SLOT'),s.indexOf('function drawScene('))+'\n({sampleCampaignFarm,homePartyPose,campaignMapView});');
 for(const [w,h] of [[390,696],[375,520],[620,850]])for(let t=0;t<288000;t+=2000){
  const f=a.sampleCampaignFarm(t,squad),v=a.campaignMapView(w,h,f.center);
  assert.ok(v.viewport.x>=0&&v.viewport.y>=0&&v.viewport.x+v.viewport.width<=1.00001&&v.viewport.y+v.viewport.height<=1.00001);
  for(const pick of f.actors){const p=a.homePartyPose(pick,w,h,f);assert.ok(p.x>25&&p.x<w-25&&p.y-p.bodyH>90&&p.y<h-100);assert.ok(Math.abs(p.x-(v.left+p.worldX*v.width))<.001);}
  if(f.phase!=='march')for(const m of f.mobs){const x=v.left+m.worldX*v.width,y=v.top+m.worldY*v.height;assert.ok(x>20&&x<w-20&&y>100&&y<h-90);}
 }
});
