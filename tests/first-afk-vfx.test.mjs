import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
const block=(name,next)=>src.slice(src.indexOf('function '+name+'('),src.indexOf('function '+next+'('));
test('missing first VFX page holds the farm presentation clock until it can paint',()=>{
 let ready=false,draws=0;const sceneState={farmReady:true};
 const ctx={save(){},restore(){},translate(){},scale(){},drawImage(){draws++;}};
 const scope={sceneState,campaignActorArtId:id=>id,farmBasicVfxSpecs:{hero:{src:'vfx.webp',frames:24,cols:6,cellW:100,cellH:100,ms:30,pivot:50,foot:50}},farmVfxPacks:{},campaignMapView:()=>({left:0,top:0,width:100,height:100}),campaignFarmActorPose:()=>({x:0,y:0,bodyH:50,facing:1}),imageForScene:()=>({complete:ready,naturalWidth:ready?100:0}),Math};
 vm.createContext(scope);vm.runInContext(block('campaignPagedSprite','currentCheckpoint').split('const runSpecs =')[0]+block('drawCampaignBasicVfx','drawCampaignFarm'),scope);
 const actor={id:'hero',target:0,attackTime:550,castDuration:1000},farm={center:{},mobs:[{worldX:1,worldY:1}]};
 scope.drawCampaignBasicVfx(ctx,actor,farm,390,600,50);
 assert.equal(sceneState.farmReady,false,'unready authored VFX must stop visual time, not silently consume its window');
 assert.equal(draws,0);ready=true;sceneState.farmReady=true;
 scope.drawCampaignBasicVfx(ctx,actor,farm,390,600,50);assert.equal(draws,1);assert.equal(sceneState.farmReady,true);
});
test('scene tick retries the same presentation time while waiting and resumes when ready',()=>{
 const sceneState={active:true,raf:0,lastFrame:100,farmTime:7000,farmReady:false},times=[];
 const scope={sceneState,document:{hidden:false},campaignBattleOpen:()=>false,reducedMotion:{matches:false},drawScene:()=>times.push(sceneState.farmTime),scheduleSceneFrame:()=>1,Math};
 vm.createContext(scope);vm.runInContext(block('sceneTick','resizeScene'),scope);
 scope.sceneTick(140);assert.equal(sceneState.farmTime,7000);
 sceneState.farmReady=true;scope.sceneTick(180);assert.equal(sceneState.farmTime,7040);assert.deepEqual(times,[7000,7040]);
});
