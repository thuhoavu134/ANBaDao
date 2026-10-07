import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');
test('AFK VFX fits hero-relative width and height without distorting wide projectiles',()=>{
 for(const [cellW,cellH] of [[480,90],[480,270],[440,248],[320,220]])for(const width of [375,390,430,1280]){
  const bodyH=Math.min(80,width*.145),calls=[],spec={src:'fx',frames:24,cols:6,cellW,cellH,pivot:cellW/2,foot:cellH/2,body:cellH,ms:60};
  const box={campaignActorArtId:x=>x,farmBasicVfxSpecs:{hero:spec},farmVfxPacks:{},campaignPagedSprite:()=>({spec}),campaignMapView:()=>({left:0,top:0,width,height:800}),campaignFarmActorPose:()=>({x:100,y:200,bodyH,facing:1}),imageForScene:()=>({complete:true,naturalWidth:2880})};
  vm.runInNewContext(source.slice(source.indexOf('function drawCampaignBasicVfx('),source.indexOf('function drawCampaignFarm(')),box);
  const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
  box.drawCampaignBasicVfx(ctx,{id:'hero',attackTime:600,approachMs:0,castDuration:1000,target:0},{center:{},mobs:[{worldX:.5,worldY:.5}]},width,800,40);
  assert.equal(calls.length,1);const dw=calls[0][7],dh=calls[0][8];
  assert.ok(dw<=Math.min(bodyH*1.6,width*.22)+1e-6,`VFX width ${dw} too large`);assert.ok(dh<=bodyH*.8+1e-6);assert.ok(Math.abs(dw/dh-cellW/cellH)<1e-6);
 }
});
