import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import { installHeroPresentation } from './helpers/hero-presentation.mjs';

const meta=JSON.parse(readFileSync(new URL('../assets/characters/tieu-phong/runtime-meta.json',import.meta.url)));
const runtime=readFileSync(new URL('../src/runtime/tieu-phong.js',import.meta.url),'utf8');
function harness(action){
 let now=1;const actor={id:'hero',sourceId:'hero_splus_tieu_phong',team:'player',hp:100,x:200,y:600};
 const target={id:'enemy',team:'enemy',slot:1,x:600,y:600,hp:100},draws=[];
 const context={globalAlpha:1,save(){},restore(){},drawImage(...args){draws.push(args);}};
 const c=vm.createContext({TIEU_PHONG_META:meta,performance:{now:()=>now},state:{battleId:1,speed:1,sound:false},TEAM_ENEMY:'enemy',AbortController,console,window:{HonVietSfx:{prepare:async()=>true,play:()=>true}},
  BACH_DIEN_LOADER:{ensure:clip=>({image:{src:clip.src,complete:true,naturalWidth:2000}}),acquire:async()=>({release(){}})},
  __hvIsSkipping:()=>false,__hvSkipVisualAssets:fn=>fn(),splusCombat:()=>({targets:()=>[target]}),getUnit:id=>id===actor.id?actor:target,
  battleCharacterDepthScale:()=>1,battleCharacterScale:()=>.5});
 installHeroPresentation(c);
 vm.runInContext(runtime,c);
 return {c,actor,target,draws,context,setTime:t=>now=t,start:async()=>c.beginTieuPhongAction(actor,action,target,1)};
}

for(const action of ['basic','ultimate'])test('Tiêu Phong '+action+' enlarges a three-vortex ground sweep without extending its cast',async()=>{
 const h=harness(action),info=await h.start(),start=action==='basic'?216.667:800;
 assert.equal(h.actor.stateDuration,meta.clips[action].durationMs);
 h.setTime(1+start+80);h.c.drawTieuPhongFx(h.context);
 const winds=h.draws.filter(a=>a[0].src.endsWith('wind-'+action+'.webp'));
 assert.equal(winds.length,3);
 const main=winds.at(-1),echoes=winds.slice(0,-1);
 assert.ok(main[8]>=224);
 assert.ok(echoes.every(a=>a[8]>=150&&a[8]<main[8]));
 assert.ok(new Set(winds.map(a=>a[5])).size>1);
 assert.ok(winds.every(a=>Math.abs(a[6]+a[8]-info.groundY)<1));
 h.c.cancelTieuPhongActions();
});

for(const action of ['basic','ultimate'])test('Tiêu Phong '+action+' impact grows with the authored hit time intact',async()=>{
 const h=harness(action),info=await h.start(),hit=info.impacts[0];
 assert.equal(h.actor.stateDuration,meta.clips[action].durationMs);
 h.setTime(1+hit.at+10);h.c.drawTieuPhongFx(h.context);
 const impact=h.draws.find(a=>a[0].src.endsWith('impact-'+action+'.webp'));
 assert.ok(impact);assert.ok(impact[7]>meta.clips['impact-'+action].cellW*.5);
 assert.ok(impact[8]>meta.clips['impact-'+action].cellH*.5);
 h.c.cancelTieuPhongActions();
});
