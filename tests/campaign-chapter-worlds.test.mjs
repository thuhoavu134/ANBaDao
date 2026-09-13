import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
function api(){assert.ok(source.includes('function campaignWorldForChapter('),'world resolver exists');return runInNewContext(source.slice(source.indexOf('const HOME_SLOT'),source.indexOf('function drawScene('))+'\n({campaignWorldForChapter,sampleCampaignFarm,homePartyPose,campaignMapView});');}
test('AC01-03 six chapters have distinct real maps, routes and monster silhouettes',()=>{
 const a=api(),maps=new Set(),monsters=new Set(),paths=new Set();
 for(let ch=0;ch<6;ch++){const w=a.campaignWorldForChapter(ch);maps.add(w.map);monsters.add(w.monster.src);paths.add(JSON.stringify(w.path));assert.ok(w.path.length>=6);assert.ok(existsSync(new URL('../'+w.map,import.meta.url)));assert.ok(existsSync(new URL('../'+w.monster.src,import.meta.url)));assert.ok(w.monster.body>0&&w.monster.foot<=w.monster.height);}
 assert.equal(maps.size,6);assert.equal(monsters.size,6);assert.equal(paths.size,6);
 assert.equal(a.campaignWorldForChapter(999).id,a.campaignWorldForChapter(0).id);
});
test('AC02 all chapter paths loop continuously, keep presentation and preserve squad',()=>{
 const a=api(),squad=Array.from({length:6},(_,slot)=>Object.freeze({id:'hero'+slot,slot}));
 for(let ch=0;ch<6;ch++){const world=a.campaignWorldForChapter(ch);
  for(let t=0;t<288000;t+=2000){const f=a.sampleCampaignFarm(t,squad,false,{},world);assert.equal(f.world.id,world.id);assert.equal(f.actors.length,6);assert.equal(f.mobs.length,4);
   const v=a.campaignMapView(390,696,f.center);for(const hero of squad){const p=a.homePartyPose(hero,390,696,f);assert.ok(p.x>20&&p.x<370&&p.y<596&&p.y-p.bodyH>90);assert.ok(Math.abs(p.x-(v.left+p.worldX*v.width))<.001);}}
  const before=a.sampleCampaignFarm(23999,squad,false,{},world),after=a.sampleCampaignFarm(24000,squad,false,{},world);assert.ok(Math.hypot(before.center.x-after.center.x,before.center.y-after.center.y)<.001);
 }
});
test('AC02 changing chapter updates both maps and resets travel; same chapter preserves travel',()=>{
 const a=api(),images=[0,1].map(()=>({src:'',getAttribute(){return this.src;},setAttribute(k,v){this[k]=v;}}));
 const values={},state={farmTime:5678,root:{querySelector:()=>({style:{setProperty:(k,v)=>values[k]=v}}),querySelectorAll:()=>images}};
 const fn=source.slice(source.indexOf('function setCampaignWorld('),source.indexOf('function renderScene('));
 const set=runInNewContext(fn+'\nsetCampaignWorld;',{sceneState:state,campaignWorldForChapter:a.campaignWorldForChapter});
 set(1);assert.equal(state.farmTime,0);assert.equal(images[0].src,a.campaignWorldForChapter(1).map);assert.equal(images[0].src,images[1].src);assert.ok(values['--cs-world-map'].includes(images[0].src));
 state.farmTime=6789;set(1);assert.equal(state.farmTime,6789);
 set(2);assert.equal(state.farmTime,0);assert.equal(images[0].src,a.campaignWorldForChapter(2).map);
});
