import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('roster to assist goes through the screen owner before opening the wheel',()=>{
 const source=read('src/ui/account-gear-runtime.js'),events=[];
 const start=source.indexOf('  const baseNav ='),end=source.indexOf("  if (typeof heroStats",start);
 const box={ST:{screen:'heroes'},navTo:n=>events.push('base:'+n),showScreen:n=>{box.ST.screen=n;events.push('screen:'+n);},openAssistWheel:()=>events.push('wheel'),openBoard:()=>events.push('board'),hide:()=>events.push('hide')};
 vm.runInNewContext(source.slice(start,end),box);box.navTo('team');
 assert.deepEqual(events,['screen:team','wheel']);assert.equal(box.ST.screen,'team');
 events.length=0;box.ST.hvOpenFormation=true;box.navTo('team');assert.deepEqual(events,['hide','base:team']);assert.equal(box.ST.hvOpenFormation,false);
});
test('AFK remains beside its mob between attacks until the whole pack is cleared',()=>{
 const source=read('src/ui/campaign-scene.js');
 const api=vm.runInNewContext(source.slice(source.indexOf('const HOME_SLOT'),source.indexOf('function drawCampaignFarm('))+'\n({sampleCampaignFarm,campaignFarmActorPose,homePartyPose});');
 const squad=[{id:'linh_dong',slot:0},{id:'bach_dien',slot:4}],before=JSON.stringify(squad),specs={linh_dong:{src:'linh',frames:20,ms:60},bach_dien:{src:'bach',frames:80,ms:60}};
 const at=t=>{const f=api.sampleCampaignFarm(t,squad,false,specs);return {f,p:api.campaignFarmActorPose(squad[0],390,696,f),home:api.homePartyPose(squad[0],390,696,f)};};
 const cast=at(7200),gap=at(10000),second=at(13200);
 assert.ok(gap.f.mobs.some(m=>m.hp>0));
 assert.ok(Math.hypot(gap.p.x-gap.home.x,gap.p.y-gap.home.y)>10,'must not reset to formation between casts');
 assert.ok(Math.hypot(gap.p.x-cast.p.x,gap.p.y-cast.p.y)<1,'hold engagement point');
 assert.equal(gap.p.castTime,-1);assert.ok(second.p.castTime>=0);
 assert.equal(JSON.stringify(squad),before);
});
test('all HUD statuses use artwork fallback without abbreviated letters',()=>{
 const source=read('scripts/splus-runtime-v1.mjs');
 for(const key of ['anhDan','joyMask','rageMask','buffBan'])assert.match(source,new RegExp(key+':.*assets/ui/status/'));
 assert.match(source,/status-generic\.svg/);assert.doesNotMatch(source,/label\.split/);
});
test('result run starts beyond left edge and exposes missing authored run truthfully',()=>{
 const source=read('scripts/result-character-motion-v1.mjs');
 assert.match(source,/--irv-run-start/);assert.match(source,/entryMotion:entry\?\.entryMotion/);
 assert.match(source,/later\(finishRunWhenVisible,1770\)/);
});
