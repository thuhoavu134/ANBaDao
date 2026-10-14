import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCampaignResourcePackCache} from '../src/assets/campaign-resource-pack-cache.mjs';
import {patchCampaignResourceLifecycle} from '../scripts/campaign-resource-lifecycle-v1.mjs';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
test('generated image owner forwards poster priority without changing decoded reservation',()=>{
 const patched=patchCampaignResourceLifecycle(source),start=patched.indexOf('function campaignPackFor('),end=patched.indexOf('function campaignBattleOpen(',start);
 const c=vm.createContext({});vm.runInContext(patched.slice(start,end),c);
 const p=c.campaignPackFor('assets/body.webp',{cols:1,frames:1,cellW:240,cellH:220,loadPriority:1});
 assert.equal(p.priority,1);assert.equal(p.decodedBytes,240*220*4);
});
function extract(name){const start=source.indexOf('function '+name+'(');let end=start;while((end=source.indexOf('}',end+1))>=0){const s=source.slice(start,end+1);try{new vm.Script('('+s+')');return s;}catch{}}throw Error(name);}
function fixture(){
 const ids=['thay_mo','ky_van','hero_splus_linh_dong','tieu_phong','luc_anh','hero_splus_bach_dien'];
 const specs={},packs={},ready=new Set(),requests=[],drawn=[];
 for(const raw of ids){const id=raw.replace('hero_splus_','');specs[id]={src:id+'/atlas',frames:16,cols:8,cellW:240,cellH:220,pivot:120,foot:215,body:200,ms:40};packs[id]={pageFrames:8,poster:{src:id+'/poster',frames:1,cols:1},pages:[{src:id+'/page-0'},{src:id+'/page-1'}]};}
 const ctx=new Proxy({drawImage:(image)=>drawn.push(image.src)},{get:(o,k)=>o[k]||(()=>{})});
 const c=vm.createContext({spriteSpecs:specs,preparationIdlePacks:packs,sceneState:{active:true,width:390,height:400,canvas:{width:390,getContext:()=>ctx},draft:ids.map((id,slot)=>({id,slot,row:slot<3?'front':'back'}))},sceneImages:new Map(),campaignBattleOpen:()=>false,preparationEnemies:()=>[],preparationDrag:null,farmAttackSpecs:{},drawCampaignFarm(){},reducedMotion:{matches:false},portraitSrc:()=>{throw Error('No portrait substitution');},imageForScene:(src)=>{requests.push(src);return {src,complete:ready.has(src),naturalWidth:ready.has(src)?240:0};}});
 for(const n of ['campaignActorArtId','frameAt','preparationSpriteFor','drawScene'])vm.runInContext(extract(n),c);
 return {c,ids,ready,requests,drawn};
}
test('cold six-hero preparation requests every body before animation and does not chase pages while bodies load',()=>{
 const f=fixture();f.c.drawScene(0);
 assert.equal(f.requests.slice(0,6).filter(x=>x.endsWith('/poster')).length,6);
 assert.ok(f.requests.every(x=>x.endsWith('/poster')));
 f.requests.length=0;f.c.drawScene(9000);
 assert.ok(f.requests.every(x=>x.endsWith('/poster')));
});
test('all six canonical bodies draw while animation is delayed, then actual pages replace them',()=>{
 const f=fixture();for(const id of f.ids)f.ready.add(id.replace('hero_splus_','')+'/poster');
 f.c.drawScene(0);assert.equal(f.drawn.length,6);assert.ok(f.drawn.every(x=>x.endsWith('/poster')));
 for(const id of f.ids)f.ready.add(id.replace('hero_splus_','')+'/page-0');
 f.drawn.length=0;f.c.drawScene(0);assert.equal(f.drawn.length,6);assert.ok(f.drawn.every(x=>x.endsWith('/page-0')));
});
test('queued formation body overtakes old animation requests without exceeding decoder limit',async()=>{
 const started=[],pending=[];const cache=createCampaignResourcePackCache({maxDecodedBytes:100,maxLoading:2,makeImage:()=>({}),load:(pack,image)=>new Promise(resolve=>{started.push(pack.src);pending.push(()=>resolve({image,decodedBytes:1}));})});
 const pack=(src,priority=0)=>({src,heroId:src,decodedBytes:1,priority});
 cache.ensure(pack('active-a'));cache.ensure(pack('active-b'));cache.ensure(pack('old-page'));cache.ensure(pack('body',1));
 for(let i=0;i<5;i++)await Promise.resolve();assert.equal(started.length,2);
 pending.shift()();for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(started[2],'body');assert.equal(cache.inspect().loading,2);cache.purge();
});
