import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
function runtime(){const box={window:{},sceneState:{draft:null},LUC_ANH_IDLE_1080:{},AFK_THAY_MO_IDLE_DURATIONS:[],reducedMotion:{matches:false}};vm.createContext(box);vm.runInContext(source.slice(source.indexOf('function campaignActorArtId('),source.indexOf('const HOME_SLOT'))+';this.runs=runSpecs;',box);return box;}
test('authored travelling heroes resolve Run instead of Idle, including aliases',()=>{
 const b=runtime();for(const [id,path]of [['luc_anh','luc-anh/run-atlas'],['dinh_loi','dinh-loi/run-atlas'],['ong_hang_pho','embedded-11'],['hero_splus_linh_dong','linh-dong/campaign-lite/run'],['hero_splus_bach_dien','bach-dien/campaign-lite/run']])assert.ok(b.specForAfk({id}).src.includes(path),id);
 assert.equal(b.runs.ong_hang_pho.frames,9);assert.equal(b.runs.ong_hang_pho.startFrame,28);
 assert.equal(b.frameAt(b.runs.ong_hang_pho,0),28);assert.equal(b.frameAt(b.runs.ong_hang_pho,9*41),28);
 b.sceneState.draft={};assert.ok(b.specForAfk({id:'dinh_loi'}).src.includes('idle'));
 // Thay Mo now ships an authored Run atlas; it must point at a committed file, never an invented one.
 assert.equal(b.runs.thay_mo.src,'assets/owner-refresh-20261018/thay-run.webp');
 assert.ok(existsSync(new URL('../'+b.runs.thay_mo.src,import.meta.url)),'authored Run must exist on disk');
});
test('second pack travel uses Run, settled pauses use Idle, casts stay ATK',()=>{
 assert.match(source,/const running=pose\?\.moving\|\|farm\?\.phase==='march'/);
 assert.match(source,/preparation\?\.spec\|\|spriteSpecs\[artId\]/);
 const b=runtime(),f=vm.runInNewContext(source.slice(source.indexOf('const CAMPAIGN_TRAVEL_PATH'),source.indexOf('function drawCampaignFarm('))+';sampleCampaignFarm;');
 const squad=[{id:'dinh_loi',slot:0}],a=f(25000,squad),z=f(28000,squad);assert.equal(a.cycle,1);assert.equal(a.phase,'march');assert.notEqual(a.center.x,z.center.x);assert.ok(b.specForAfk(squad[0]).src.includes('/run-'));
});
