import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const resultSource=read('scripts/result-character-motion-v1.mjs');
const coMeta=JSON.parse(read('assets/characters/co-nuong/runtime-meta.json'));
test('result registration resolves Co Nuong aliases and actual run/idle/fall atlases',()=>{
 assert.match(resultSource,/co_nuong:newHeroMotion\('co-nuong'\)/);
 const c=vm.createContext({JSON,readFileSync:()=>JSON.stringify(coMeta),URL,clip:(src,frames,cols,cellW,cellH,ms,extra)=>({src,frames,cols,cellW,cellH,ms,...extra})});
 const fn=resultSource.slice(resultSource.indexOf('function newHeroMotion('),resultSource.indexOf('const manifest =')).replaceAll('import.meta.url',"'file:///repo/scripts/result-character-motion-v1.mjs'");
 vm.runInContext(fn,c);const motion=c.newHeroMotion('co-nuong');
 assert.deepEqual(Array.from(motion.aliases),['co_nuong','co-nuong','hero_splus_co_nuong']);
 for(const [key,file] of [['run','run'],['idle','idle'],['fall','fall-die']]){
  assert.match(motion[key].src,new RegExp('/co-nuong/'+file+'\\.webp'));assert.equal(motion[key].frames,coMeta.clips[file].frames);
 }
 assert.deepEqual(Array.from(motion.idle.durations),coMeta.clips.idle.frameDurationsMs);
 assert.equal(motion.run.playbackRate,1);
});
const source=read('src/runtime/hong-thuong.js');
const meta=JSON.parse(read('assets/characters/hong-thuong/runtime-meta.json'));
for(const team of ['player','enemy'])test('Hong Thuong finale faces victim behind enemy line: '+team,()=>{
 let now=0;const scales=[];const u={id:'h',sourceId:'hero_splus_hong_thuong',team,hp:100,x:team==='player'?100:900,y:400,state:'idle'};
 const c=vm.createContext({HONG_THUONG_META:meta,state:{battleId:1},TEAM_ENEMY:'enemy',performance:{now:()=>now},battleCharacterDepthScale:()=>1,battleCharacterScale:()=>1,drawUnitHud(){},__hvHeroVisibility:{finish:(ctx,id,u,t,drawn)=>drawn}});
 vm.runInContext(source,c);vm.runInContext('hongThuongPaint=()=>true;hongThuongImage=()=>null;',c);
 const ctx={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);}};
 const victim={x:500,y:400};const spot=c.hongThuongSpotFor(u,victim,'spear');
 u._hongThuongAction={battleId:1,action:'ultimate',startedAt:0,speed:1,home:{x:u.x,y:u.y},segments:[{start:0,dur:100,clip:'ult-finisher',from:spot,to:spot},{start:100,dur:100,clip:'run',from:spot,to:{x:u.x,y:u.y}}]};
 c.drawHongThuongHero(ctx,u,0);assert.equal(scales.at(-1)[0],Math.sign(victim.x-spot.x),'final thrust faces back toward victim');
 now=101;c.drawHongThuongHero(ctx,u,now);assert.equal(scales.at(-1)[0],team==='enemy'?-1:1,'normal facing restored outside finisher');
 delete u._hongThuongAction;c.drawHongThuongHero(ctx,u,102);assert.equal(scales.at(-1)[0],team==='enemy'?-1:1);
});
