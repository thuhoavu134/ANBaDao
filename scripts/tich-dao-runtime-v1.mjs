import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
export function patchTichDaoBattle(input,runtime,meta){
 if(input.includes('/* HV_TICH_DAO_V1 */'))return input;let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Tich Dao anchor '+from.slice(0,80));s=s.replace(from,()=>to);};
 once('async function performSplusAction(actor, action, target) {','/* HV_TICH_DAO_V1 */\nconst TICH_DAO_META='+JSON.stringify(meta)+';\n'+runtime+'\nasync function performSplusAction(actor, action, target) {');
 once('  const fanAction=isTieuPhong(actor)?await beginTieuPhongAction(actor,action,target,battleId):null;',`  const shadowAction=isTichDao(actor)?await beginTichDaoAction(actor,action,target,battleId):null;
  if(isTichDao(actor)&&!shadowAction){if(state.battleId===battleId){state.locked=false;state.currentId=null;void advanceTurn();}return;}
  const fanAction=isTieuPhong(actor)?await beginTieuPhongAction(actor,action,target,battleId):null;`);
 once("  if(fanAction){\n    if(!await waitTieuPhongMarker(fanAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitTieuPhongMarker(fanAction,'impact',battleId))return;\n  }else if(kyAction){", "  if(shadowAction){\n    if(!await waitTichDaoMarker(shadowAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitTichDaoMarker(shadowAction,'impact',battleId))return;\n  }else if(fanAction){\n    if(!await waitTieuPhongMarker(fanAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitTieuPhongMarker(fanAction,'impact',battleId))return;\n  }else if(kyAction){");
 once('result=fanAction?await resolveTieuPhongCast(e,fanAction,actor,action,target,battleId):e.act(actor.id,action,target?.id);','result=shadowAction?await resolveTichDaoCast(e,shadowAction,actor,action,target,battleId):fanAction?await resolveTieuPhongCast(e,fanAction,actor,action,target,battleId):e.act(actor.id,action,target?.id);');
 once('if(!fanAction&&!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation','if(!shadowAction&&!fanAction&&!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation');
 once("  if(fanAction){\n    if(!await waitTieuPhongMarker(fanAction,'recovery:end',battleId))return;\n    finishTieuPhongAction(fanAction);\n  }else if(kyAction){", "  if(shadowAction){\n    if(!await waitTichDaoMarker(shadowAction,'recovery:end',battleId))return;\n    finishTichDaoAction(shadowAction);\n  }else if(fanAction){\n    if(!await waitTieuPhongMarker(fanAction,'recovery:end',battleId))return;\n    finishTieuPhongAction(fanAction);\n  }else if(kyAction){");
 once('  if(isTieuPhong(unit))return drawTieuPhongHero(context,unit,time);','  if(isTichDao(unit))return drawTichDaoHero(context,unit,time);\n  if(isTieuPhong(unit))return drawTieuPhongHero(context,unit,time);');
 once('(isKyVan(unit)||isTieuPhong(unit))?battleCharacterScale(unit)*419','(isKyVan(unit)||isTieuPhong(unit)||isTichDao(unit))?battleCharacterScale(unit)*419');
 once('function splusReset(){cancelTieuPhongActions();','function splusReset(){cancelTichDaoActions();cancelTieuPhongActions();');
 once("  async function performAction(actor, action, target) {\n    if(typeof isTieuPhong==='function'&&isTieuPhong(actor)&&action==='skill')action='basic';","  async function performAction(actor, action, target) {\n    if(typeof isTichDao==='function'&&isTichDao(actor)&&action==='skill')action='basic';\n    if(typeof isTieuPhong==='function'&&isTieuPhong(actor)&&action==='skill')action='basic';");
 once('const slots=isTieuPhong(actor)||isKyVan(actor)||','const slots=isTichDao(actor)||isTieuPhong(actor)||isKyVan(actor)||');
 once("  if(raw&&/^(?:tieu_phong|tieu-phong)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_tieu_phong'};","  if(raw&&/^(?:tieu_phong|tieu-phong)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_tieu_phong'};\n  if(raw&&/^(?:tich_dao|tich-dao)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_tich_dao'};");
 once('const authoredFallMs=typeof isTieuPhong','const authoredFallMs=typeof isTichDao==="function"&&isTichDao(unit)?tichDaoFallDuration():typeof isTieuPhong');
 once('unit.defeatHideDuration = typeof isTieuPhong','unit.defeatHideDuration = typeof isTichDao==="function"&&isTichDao(unit)?authoredFallMs+120/Math.max(1,state.speed):typeof isTieuPhong');
 once(`function splusEvent(event) {`,`function splusEvent(event) {
  if(event.type==='damage'){const u=getUnit(event.targetId);if(isTichDao(u)&&u.hp>0&&!u._tichDaoAction){setUnitState(u,'hurt',TICH_DAO_META.clips.hit.durationMs);tichDaoImage('hit');}}
  if(event.type==='death'){const u=getUnit(event.targetId);if(isTichDao(u))tichDaoImage('fall-die');}`);
 // VFX Cổ Mộ overlays render in the shared effects pass (drawn after units).
 once('    drawEffects(ctx, time);','    drawEffects(ctx, time);\n    drawTichDaoVfx(ctx, time);');
 // SFX Cổ Mộ (mượn tiếng theo bảng missile JX1 gốc của phái): 3 cue vào bus chung.
 const NL=String.fromCharCode(10);
 once("'tieu-phong-basic-x1':'tieu-phong/basic-x1.m4a',","'tich-dao-basic':'tich-dao/basic.wav','tich-dao-strike-launch':'tich-dao/strike-launch.wav','tich-dao-strike':'tich-dao/strike.wav','tich-dao-rain':'tich-dao/rain.wav',"+NL+"    'tieu-phong-basic-x1':'tieu-phong/basic-x1.m4a',");
 return s;
}
export async function buildTichDaoCampaignAssets(root){
 const {default:sharp}=await import('sharp');
 const base=join(root,'dist/assets/characters/tich-dao'),out=join(base,'campaign');mkdirSync(out,{recursive:true});
 for(const key of ['idle-authored-0','idle-authored-1','idle-authored-2','idle-authored-3','idle-authored-4','idle-authored-5','idle-authored-6','idle-authored-7','idle-authored-8','run','basic']){
  const source=sharp(join(base,key+'.webp')),info=await source.metadata();
  await source.resize(Math.round(info.width/2),Math.round(info.height/2)).webp({quality:90,alphaQuality:100}).toFile(join(out,key+'.webp'));
 }
 await sharp(join(base,'idle-authored-0.webp')).extract({left:0,top:0,width:480,height:440}).resize(240,220).webp({quality:90,alphaQuality:100}).toFile(join(out,'idle-poster.webp'));
}
export async function installTichDao(root){await buildTichDaoCampaignAssets(root);const out=join(root,'dist'),p=join(out,'battle.html');writeFileSync(p,patchTichDaoBattle(readFileSync(p,'utf8'),readFileSync(join(root,'src/runtime/tich-dao.js'),'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/tich-dao/runtime-meta.json'),'utf8'))));const host=join(out,'index.html');writeFileSync(host,patchTichDaoHost(readFileSync(host,'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/tich-dao/runtime-meta.json'),'utf8')),readFileSync(join(root,'src/ui/tich-dao-detail.js'),'utf8')));copyFileSync(join(root,'tich-dao-test.html'),join(out,'tich-dao-test.html'));}

export function patchTichDaoHost(input,meta,detailRuntime){
 if(input.includes("tich_dao:{slug:'tich-dao'"))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Tich Dao host anchor: '+from);s=s.replace(from,()=>to);};
 once('const CHARACTER_MANIFEST={','const CHARACTER_MANIFEST={\n'+"  tich_dao:{slug:'tich-dao',displayName:'Tịch Dao',identityVersion:'authored-idle-v1',reference:{master:'assets/characters/tich-dao/avatar.webp',runtime:true},assets:Object.fromEntries(['master','avatar','dialogue','card','icon'].map(k=>[k,'assets/characters/tich-dao/avatar.webp']).concat([['idle','assets/characters/tich-dao/idle-authored-0.webp']])),surfaces:['roster','formation','hero-detail','battle'],mechanics:{ultimate:'tam-anh-doat-menh'}},");
 once(" bach_dien:{he:'soul'"," tich_dao:{he:'soul',faction:'am_hon',archetype:'duelist',rarity:'ssr',name:'Tịch Dao',role:'Ảnh Sát Song Kiếm',col:'#c9b6e8',stats:{hp:920,mp:60,atk:138,def:50,spd:122},passive:{name:'Hoa Ấn',desc:'Đòn chém đặt 1 dấu Hoa Ấn (tối đa 3); dấu cộng sát thương chiêu thức và bị ultimate tiêu thụ.'},ultimate:{name:'Tam Ảnh Đoạt Mệnh',cost:60,vfx:'slash',desc:'Ba nhịp thoắt hiện chém 3 mục tiêu hàng sau (mỗi dấu +35% sát thương nhịp đó rồi bị tiêu hao). Sau chuỗi: mưa kiếm xét cả hai hàng, kết liễu địch dưới 30% máu, tối đa 2 mục tiêu.',fx:{kind:'damage',target:'enemy',power:1}}},"+"\n bach_dien:{he:'soul'");
 const roster='"linh_dong","bach_dien","ky_van","tieu_phong"]';
 if(s.split(roster).length!==4)throw Error('Tich Dao roster owners changed');
 if(meta&&detailRuntime){
  const base={src:'assets/characters/tich-dao/campaign/idle-authored-0.webp',frames:meta.idle.frames,cols:3,cellW:240,cellH:220,pivot:120,foot:220,body:220,durations:meta.idle.frameDurationsMs};
  const descriptor=key=>{const c=meta.clips[key];return {src:'assets/characters/tich-dao/campaign/'+c.file,frames:c.frames,cols:c.cols,cellW:240,cellH:220,pivot:120,foot:220,body:220,ms:c.durationMs/c.frames};};
  const pages=Array.from({length:meta.idleVisual.pages},(_,i)=>({...descriptor('idle-authored-'+i),rows:Math.ceil(meta.clips['idle-authored-'+i].frames/3)}));
  const pack={pageFrames:meta.idleVisual.pageFrames,pages,poster:{...pages[0],src:'assets/characters/tich-dao/campaign/idle-poster.webp',cols:1,rows:1,frames:1,frameIndex:0}};
  once('function preparationSpriteFor(pick, time) {','Object.assign(spriteSpecs,{tich_dao:'+JSON.stringify(base)+'});\nObject.assign(preparationIdlePacks,{tich_dao:'+JSON.stringify(pack)+'});\nfunction preparationSpriteFor(pick, time) {');
  once('function frameAt(spec, time) {','Object.assign(runSpecs,{tich_dao:'+JSON.stringify(descriptor('run'))+'});\nObject.assign(farmAttackSpecs,{tich_dao:'+JSON.stringify(descriptor('basic'))+'});\nfunction frameAt(spec, time) {');
  once("const id=String(value||'').replace(/-/g,'_');", "const id=String(value||'').replace(/-/g,'_');if(id==='hero_splus_tich_dao')return 'tich_dao';");
  once("if(id==='bach_dien'){ startBachDienDetailIdle(); }", "if(id==='bach_dien'){ startBachDienDetailIdle(); }\n  if(id==='tich_dao'){startTichDaoDetailIdle();}");
  once("id==='bach_dien'?'<canvas id=", "id==='tich_dao'?'<canvas id=\"tichDaoDetailIdle\" width=\"540\" height=\"496\" aria-label=\"Tịch Dao idle\"></canvas>':id==='bach_dien'?'<canvas id=");
  once('function startBachDienDetailIdle(){','const TICH_DAO_DETAIL_META='+JSON.stringify(meta.idleVisual)+';\n'+detailRuntime+'\nfunction startBachDienDetailIdle(){');
  // The hall moves hdBody outside hero-detail-art-screen: scope to the actual stage.
  once('</head>',`<style id="tich-dao-detail-layout">
  #hdBody .hstage[data-hero-id="tich_dao"]{position:relative!important;overflow:hidden!important;padding-top:420px!important;box-sizing:border-box!important;}
  #hdBody .hstage[data-hero-id="tich_dao"]>.hsava{display:none!important;}
  #tichDaoDetailIdle{position:absolute!important;top:10px!important;left:50%!important;transform:translateX(-50%)!important;width:260px!important;height:402px!important;max-width:100%;pointer-events:none;}
  </style></head>`);
 }
 return s.split(roster).join('"linh_dong","bach_dien","ky_van","tieu_phong","tich_dao"]');
}
