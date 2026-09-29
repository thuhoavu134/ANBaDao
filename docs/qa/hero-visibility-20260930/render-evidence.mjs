import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHeroVisibilityCache} from '../../../src/render/hero-visibility-cache.mjs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');const require=createRequire(root+'/package.json');
const {createCanvas,loadImage}=require('@napi-rs/canvas');const sharp=require('sharp');
const out=root+'/docs/qa/hero-visibility-20260930';mkdirSync(out,{recursive:true});
function extractFunction(s,name){const a=s.indexOf('function '+name+'(');if(a<0)throw Error('Missing function '+name);let p=a;while((p=s.indexOf('}',p+1))>=0){const part=s.slice(a,p+1);try{new vm.Script('('+part+')');return part;}catch{}}throw Error(name);}
function expression(s,name){const m=new RegExp('\\b'+name+'\\s*=\\s*').exec(s);if(!m)throw Error('Missing value '+name);const a=m.index+m[0].length;for(let p=a;p<s.length;p++){if(![',',';'].includes(s[p]))continue;const part=s.slice(a,p);try{new vm.Script('('+part+')');return part;}catch{}}throw Error(name);}
async function runtime(s,width,height,label){
 const c={console,WORLD:{width:1600,height:870},POSITIONS:{},view:{width,height},innerWidth:width,innerHeight:height,TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',REDUCED_MOTION:true,performance:{now:()=>0},state:{speed:1,currentId:null,mode:'battle',ultimateFocus:null},Core:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))},window:{},units:[],isCombatFocusUnitVisible:()=>true,isThayMoHitQa:()=>false,drawUnitHud:()=>{},__HV_BATTLE_LOW_MEMORY:false,__HV_LOW_MEMORY_IOS:false,__HV_LUC_ANH_MOBILE_ATLASES:{},__hvBattleAssets:{painted:()=>{}},motionDuration:v=>v};
 c.__hvHeroVisibility=label==='after'?createHeroVisibilityCache({makeCanvas:()=>createCanvas(1,1)}):{finish:(_ctx,_hero,_unit,_time,drawn)=>!!drawn};
 vm.createContext(c);c.POSITIONS=vm.runInContext('('+expression(s,'POSITIONS')+')',c);const a=s.indexOf('const PORTRAIT_FORMATION='),b=s.indexOf('/* hv-battle-scale-helpers-end */',a);vm.runInContext(s.slice(a,b),c);
 const names=['LINH_DONG_CLIPS','LINH_DONG_REGISTRATION','BACH_DIEN_CLIPS','LUC_ANH_META','__HV_READY_ATLASES','DINH_LOI_COLS','DINH_LOI_CELL_W','DINH_LOI_CELL_H','DINH_LOI_FRAME_MS','DINH_LOI_FRAMES','DINH_LOI_ACTION_MS','THAY_MO_IDLE_COLS','THAY_MO_IDLE_CELL_W','THAY_MO_IDLE_CELL_H','THAY_MO_IDLE_STRIDE_W','THAY_MO_IDLE_STRIDE_H','THAY_MO_IDLE_PAD','THAY_MO_IDLE_DURATIONS','THAY_MO_IDLE_TOTAL_MS','ONG_PHO_IDLE_FRAMES','ONG_PHO_IDLE_FRAME_MS','__HV_ONG_PHO_CELL_SCALE'];
 for(const name of names)c[name]=vm.runInContext('('+expression(s,name)+')',c);
 Object.assign(c,{LINH_DONG_ASSET_BASE:'assets/characters/linh-dong/',BACH_DIEN_ASSET_BASE:'assets/characters/bach-dien/',LUC_ANH_ASSET_BASE:'assets/characters/luc-anh/',LUC_ANH_COLS:8,LUC_ANH_ID:'luc_anh',DINH_LOI_ID:'dinh_loi',LUC_ANH_SPATIAL:{displayHeight:330,assetTrimScale:{idle:1},assetBaseline:{idle:48}},LINH_DONG_CANONICAL_ID:'hero_splus_linh_dong',BACH_DIEN_CANONICAL_ID:'hero_splus_bach_dien'});
 for(const name of ['drawUnit','drawSplusToken','isLinhDong','normalizeLinhDongHeroId','isBachDien','normalizeBachDienHeroId','clipFor','__hvOriginalClipFor','clipForBachDien','__hvOriginalClipForBachDien','__hvReadyClip','sourceRectForFrame','drawCanvasSprite','frameAt','frameDurationMs','linhDongFrame','bachDienFrame','drawLinhDongAtlas','drawBachDienAtlas','drawLinhDongHero','drawBachDienHero','isLucAnh','lucAnhDisplaySize','lucAnhDisplayBaseline','lucAnhPlaybackRate','lucAnhFrame','__hvLucAnhAsset','drawLucAnhAtlas','drawLucAnhHero','isDinhLoi','dinhLoiFrame','drawDinhLoiAtlasFrame','drawDinhLoiHero','drawOngPhoGifHero','thayMoIdleFrameAt','drawThayMoAuthoredCell','drawThayMoAuthoredHero'])vm.runInContext(extractFunction(s,name),c);
 const images={};async function get(src){if(!images[src]){const img=await loadImage(root+'/dist/'+src);images[src]=img;}return images[src];}
 for(const hero of ['linh','bach']){const map={};for(const key of ['idle','attack','ultimate']){const clip=hero==='linh'?c.clipFor(key):c.clipForBachDien(key);map[key]=await get(clip.src);}c[hero==='linh'?'linhDongImage':'bachDienImage']=key=>map[key]||map.idle;}
 c.LUC_ANH_IMAGES={idle:await get('assets/characters/luc-anh/idle-rgba-v1-battle-atlas.webp')};c.DINH_LOI_IMAGES={idle:await get('assets/characters/dinh-loi/idle-atlas.png')};const ong=await get('assets/battle-runtime/embedded-12.png'),thay=await get('assets/characters/thay-mo/idle-v3193-atlas.png');c.ONG_PHO_IDLE_IMAGE=()=>ong;c.THAY_MO_IDLE_IMAGE=()=>thay;
 c.isOngPho=u=>u.sourceHeroId==='ong_pho';c.isThayMoAuthored=u=>u.sourceHeroId==='thay_mo';
 // Production identity resolvers use sourceId first for the legacy heroes.
 c.isLucAnh=u=>u.sourceHeroId==='luc_anh';c.isDinhLoi=u=>u.sourceHeroId==='dinh_loi';
 const linhImage=c.linhDongImage, lucImages=c.LUC_ANH_IMAGES;
 c.setMissing=value=>{c.linhDongImage=value?()=>null:linhImage;c.LUC_ANH_IMAGES=value?{}:lucImages;};
 return c;
}
const report={method:'Forced loss of Linh Dong/Luc Anh atlas handles after an initial paint; actual generated drawUnit and hero renderers with RGBA assets, offline Skia. Not a live Safari/browser test.',runs:[]};
const built=readFileSync(root+'/dist/battle.html','utf8');
assert.ok(built.includes('HV_HERO_VISIBILITY_CACHE_V1'));
for(const label of ['before','after'])for(const [name,w,h] of [['mobile',390,739],['desktop',1280,800]]){
 const c=await runtime(built,w,h,label), forms=c.battleFormationForViewport(w,h), crop=c.battleWorldCropForViewport(w,h);
 const ids=['bach_dien','linh_dong','luc_anh','thay_mo','dinh_loi','ong_pho'];
 for(const team of ['player','enemy'])for(let slot=0;slot<6;slot++){
  const id=ids[slot],p=forms[team][slot],unit={id:team+'-'+slot,sourceHeroId:id,sourceId:id,team,slot,hp:100,maxHp:100,state:'idle',stateStarted:0,stateDuration:1000,baseX:p.x,baseY:p.y,x:p.x,y:p.y,phase:0,flashUntil:0};
  if(['linh_dong','bach_dien'].includes(id))unit.kitVersion='splus42-v2';c.units.push(unit);
 }
 const row={label,name,units:[]};
 const bodyPixels=(unit,time)=>{const tile=createCanvas(700,700),ctx=tile.getContext('2d');ctx.translate(350-unit.x,500-unit.y);c.drawUnit(ctx,unit,time);const pixels=ctx.getImageData(0,0,700,465).data;let n=0;for(let p=3;p<pixels.length;p+=4)if(pixels[p]>100)n++;return n;};
 // Warm the exact same roster first, then remove the large decoded handles.
 for(const unit of c.units)bodyPixels(unit,0);
 c.setMissing(true);
 for(const unit of c.units){const pixels=bodyPixels(unit,0);row.units.push({hero:unit.sourceHeroId,team:unit.team,pixelsWhileMissing:pixels});if(['linh_dong','luc_anh'].includes(unit.sourceHeroId))assert.equal(pixels>500,label==='after');}
 const dpr=name==='mobile'?2:1,cv=createCanvas(w*dpr,h*dpr),ctx=cv.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle='#ddd6bc';ctx.fillRect(0,0,w,h);ctx.translate(crop.offsetX,crop.offsetY);ctx.scale(crop.scale,crop.scale);
 for(const unit of c.units.slice().sort((a,b)=>a.y-b.y)){c.drawUnit(ctx,unit,0);ctx.fillStyle=unit.team==='player'?'#278b75':'#b6574f';ctx.fillRect(unit.x-33,unit.y-140,66,7);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#263730';ctx.font='14px sans-serif';ctx.fillText(label.toUpperCase()+' / simulated atlas eviction',12,23);
 await sharp(cv.toBuffer('image/png')).webp({quality:90}).toFile(out+'/'+label+'-'+name+'.webp');
 c.setMissing(false);for(const unit of c.units)assert.ok(bodyPixels(unit,160)>500,'decoded animation resumes');
 row.recovery='all 12 bodies visible after decode';report.runs.push(row);
}
report.ok=true;writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
