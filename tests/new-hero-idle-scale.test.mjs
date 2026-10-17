import {installHeroPresentation} from './helpers/hero-presentation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Alpha >32 measurements of shipped assets, across all 30 idle poses.
// Standing/Basic body = 413px; action-cell foot = 428/440, i.e. y=-12.
const fixtures=[['ky-van','KyVan','KY_VAN',645,657],['tieu-phong','TieuPhong','TIEU_PHONG',648.5,658]];
for(const [slug,name,prefix,body,foot] of fixtures){
 test(`${slug}: idle body and ground match action scale on both teams and all pages`,()=>{
  const meta=JSON.parse(readFileSync(new URL(`../assets/characters/${slug}/runtime-meta.json`,import.meta.url)));
  const source=readFileSync(new URL(`../src/runtime/${slug}.js`,import.meta.url),'utf8');
  let now=0,draws=[];
  const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...args){draws.push(args.slice(-4));}};
  const sandbox={state:{battleId:1},TEAM_ENEMY:'enemy',getUnit:()=>null,performance:{now:()=>now},battleCharacterDepthScale:()=>.8,battleCharacterScale:()=>.5,drawUnitHud(){},BACH_DIEN_LOADER:{ensure:()=>({image:{complete:true,naturalWidth:1296}})},__hvHeroVisibility:{finish:(c,s,u,t,drawn)=>drawn},[prefix+'_META']:meta};
  vm.createContext(sandbox);installHeroPresentation(sandbox);vm.runInContext(source+`;globalThis.render=draw${name}Hero;`,sandbox);
  for(const team of ['ally','enemy']){
   const u={sourceId:slug.replaceAll('-','_'),team,hp:100,x:200,y:300,state:'idle'};
   let time=0;
   for(const duration of meta.idleVisual.frameDurationsMs){
    draws=[];now=time;sandbox.render(ctx,u,time);
    const [x,y,w,h]=draws[0],s=h/668;
    assert.ok(Math.abs(s*body-413)<.1,`idle body ${s*body} vs action 413`);
    assert.ok(Math.abs(y+foot*s+12)<.1,'idle feet retain action ground');
    assert.ok(Math.abs(w/h-432/668)<1e-9,'no aspect distortion');
    assert.ok(Math.abs(x+w/2)<.001,'shared bottom-center pivot');
    time+=duration;
   }
   for(const action of ['basic','ultimate']){
    u['_'+(slug==='ky-van'?'kyVan':'tieuPhong')+'Action']={actor:u,battleId:1,action,startedAt:0,speed:1,targets:[],groundY:300};
    draws=[];now=0;sandbox.render(ctx,u,0);
    assert.deepEqual(draws[0],[-240,-440,480,440],action+' keeps original geometry');
   }
  }
 });
}
