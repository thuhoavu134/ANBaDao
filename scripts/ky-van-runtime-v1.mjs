import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
export function patchKyVanBattle(input,runtime,meta){
 if(input.includes('/* HV_KY_VAN_V1 */'))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Ky Van anchor missing/ambiguous: '+from.slice(0,90));s=s.replace(from,()=>to);};
 once('async function performSplusAction(actor, action, target) {','/* HV_KY_VAN_V1 */\nconst KY_VAN_META='+JSON.stringify(meta)+';\n'+runtime+'\nasync function performSplusAction(actor, action, target) {');
 once('  let fallbackPresentation=null;',`  const kyAction=isKyVan(actor)?await beginKyVanAction(actor,action,target,battleId):null;
  if(isKyVan(actor)&&!kyAction){if(state.battleId===battleId){state.locked=false;state.currentId=null;setStatus('Không tải được animation Kỷ Vân');void advanceTurn();}return;}
  let fallbackPresentation=null;`);
 once("  let fallbackPresentation=null;\n  if(linhAction){\n    if(!await waitLinhDongMarker", "  let fallbackPresentation=null;\n  if(kyAction){\n    if(!await waitKyVanMarker(kyAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitKyVanMarker(kyAction,'impact',battleId))return;\n  } else if(linhAction){\n    if(!await waitLinhDongMarker");
 once('  if(!linhAction&&!bachAction)triggerImpactPresentation(actor,target,action);','  if(!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation(actor,target,action);');
 once("  if(linhAction){\n    if(!await waitLinhDongMarker(linhAction,'recovery:end',battleId))return;", "  if(kyAction){\n    if(!await waitKyVanMarker(kyAction,'recovery:end',battleId))return;\n    finishKyVanAction(kyAction);\n  } else if(linhAction){\n    if(!await waitLinhDongMarker(linhAction,'recovery:end',battleId))return;");
 once('function drawSplusToken(context, unit, time) {','function drawSplusToken(context, unit, time) {\n  if(isKyVan(unit))return drawKyVanHero(context,unit,time);');
 once('const y = unit.y - (compact ? battleCharacterScale(unit)*310*battleCharacterDepthScale(unit)+18 : 164);', 'const y = unit.y - (isKyVan(unit)?battleCharacterScale(unit)*419*battleCharacterDepthScale(unit)+18:(compact ? battleCharacterScale(unit)*310*battleCharacterDepthScale(unit)+18 : 164));');
 once('    drawBachDienFx(ctx,time);' ,'    drawBachDienFx(ctx,time);\n    drawKyVanFx(ctx,time);');
 once('function splusReset(){','function splusReset(){\n  cancelKyVanActions();');
 once('  async function performAction(actor, action, target) {',"  async function performAction(actor, action, target) {\n    if(typeof isKyVan==='function'&&isKyVan(actor)&&action==='skill')action='basic';");
 once("const slots=typeof isLinhDong==='function'&&isLinhDong(actor)?", "const slots=isKyVan(actor)||typeof isLinhDong==='function'&&isLinhDong(actor)?");
 once('  const h=normalizeConfiguredHero(raw,index),kit=',"  if(raw&&/^(?:ky_van|ky-van)$/i.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_ky_van'};\n  const h=normalizeConfiguredHero(raw,index),kit=");
 once('    const authoredFallMs=isOngPho(unit)?', "    const authoredFallMs=typeof isKyVan==='function'&&isKyVan(unit)?kyVanFallDuration():isOngPho(unit)?");
 once('unit.defeatHideDuration = defeatDuration(', "unit.defeatHideDuration = typeof isKyVan==='function'&&isKyVan(unit)?authoredFallMs+120/Math.max(1,state.speed):defeatDuration(");
 once('function splusEvent(event) {', "function splusEvent(event) {\n  if(event.type==='damage'){const u=getUnit(event.targetId);if(isKyVan(u)&&u.hp>0){setUnitState(u,'hurt',KY_VAN_META.clips.hit.durationMs);kyVanImage('hit');}}\n  if(event.type==='death'){const u=getUnit(event.targetId);if(isKyVan(u))kyVanImage('fall-die');}");
 return s;
}
export async function buildKyVanCampaignAssets(root){
 const {default:sharp}=await import('sharp');
 const base=join(root,'dist/assets/characters/ky-van'),out=join(base,'campaign');mkdirSync(out,{recursive:true});
 for(const key of ['idle-0','idle-1','idle-2','idle-3','idle-4','idle-5','run','basic']){
  const source=sharp(join(base,key+'.webp')),info=await source.metadata();
  await source.resize(info.width/2,info.height/2).webp({quality:90,alphaQuality:100}).toFile(join(out,key+'.webp'));
 }
 await sharp(join(base,'idle-0.webp')).extract({left:0,top:0,width:480,height:440}).resize(240,220).webp({quality:90,alphaQuality:100}).toFile(join(out,'idle-poster.webp'));
}
export async function installKyVan(root){await buildKyVanCampaignAssets(root);const out=join(root,'dist'),p=join(out,'battle.html');writeFileSync(p,patchKyVanBattle(readFileSync(p,'utf8'),readFileSync(join(root,'src/runtime/ky-van.js'),'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/ky-van/runtime-meta.json'),'utf8'))));const host=join(out,'index.html');writeFileSync(host,patchKyVanHost(readFileSync(host,'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/ky-van/runtime-meta.json'),'utf8')),readFileSync(join(root,'src/ui/ky-van-detail.js'),'utf8')));copyFileSync(join(root,'ky-van-test.html'),join(out,'ky-van-test.html'));}

export function patchKyVanHost(input,meta,detailRuntime){
 if(input.includes('ky_van:{slug:'))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Ky Van host anchor: '+from);s=s.replace(from,()=>to);};
 once('const CHARACTER_MANIFEST={','const CHARACTER_MANIFEST={\n'+"  ky_van:{slug:'ky-van',displayName:'Kỷ Vân',identityVersion:'authored-idle-v1',reference:{master:'assets/characters/ky-van/avatar.webp',runtime:true},assets:Object.fromEntries(['master','avatar','dialogue','card','icon'].map(k=>[k,'assets/characters/ky-van/avatar.webp']).concat([['idle','assets/characters/ky-van/idle-authored-0.webp']])),surfaces:['roster','formation','hero-detail','battle'],mechanics:{ultimate:'thien-loi-cham-tran'}},");
 once(" bach_dien:{he:'soul'"," ky_van:{he:'kim',faction:'hoi_lang',archetype:'mystic',rarity:'ssr',name:'Kỷ Vân',role:'Lôi Châm Sư / Khống chế',col:'#b6d8e8',stats:{hp:900,mp:60,atk:122,def:52,spd:112},passive:{name:'Lôi Châm',desc:'Điều khiển phi châm dẫn sét.'},skill:{name:'Phi Châm',cost:0,vfx:'lightning',desc:'Phóng một phi châm dẫn sét.',fx:{kind:'damage',target:'enemy',power:1}},ultimate:{name:'Thiên Lôi Châm Trận',cost:60,vfx:'lightning',desc:'Sát thương toàn địch. 30% tỷ lệ mỗi địch bị choáng và cấm hồi máu trong một lượt. Thông số thử cân bằng.',fx:{kind:'damage',target:'aoe_enemy',power:1.2}}},"+"\n bach_dien:{he:'soul'");
 const roster='"linh_dong","bach_dien"]';
 if(s.split(roster).length!==4)throw Error('Ky Van roster owners changed');
 if(meta&&detailRuntime){
  const base={src:'assets/characters/ky-van/campaign/idle-0.webp',frames:meta.idle.frames,cols:4,cellW:240,cellH:220,pivot:120,foot:215.5,body:209.5,durations:meta.idle.frameDurationsMs};
  const descriptor=key=>{const c=meta.clips[key];return {src:'assets/characters/ky-van/campaign/'+c.file,frames:c.frames,cols:c.cols,cellW:240,cellH:220,pivot:120,foot:215.5,body:209.5,ms:c.durationMs/c.frames};};
  const pages=Array.from({length:6},(_,i)=>({...descriptor('idle-'+i),rows:Math.ceil(meta.clips['idle-'+i].frames/4)}));
  const pack={pageFrames:16,pages,poster:{...pages[0],src:'assets/characters/ky-van/campaign/idle-poster.webp',cols:1,rows:1,frames:1,frameIndex:0}};
  once('function preparationSpriteFor(pick, time) {','Object.assign(spriteSpecs,{ky_van:'+JSON.stringify(base)+'});\nObject.assign(preparationIdlePacks,{ky_van:'+JSON.stringify(pack)+'});\nfunction preparationSpriteFor(pick, time) {');
  once('function frameAt(spec, time) {','Object.assign(runSpecs,{ky_van:'+JSON.stringify(descriptor('run'))+'});\nObject.assign(farmAttackSpecs,{ky_van:'+JSON.stringify(descriptor('basic'))+'});\nfunction frameAt(spec, time) {');
  once("const id=String(value||'').replace(/-/g,'_');", "const id=String(value||'').replace(/-/g,'_');if(id==='hero_splus_ky_van')return 'ky_van';");
  once("if(id==='bach_dien'){ startBachDienDetailIdle(); }", "if(id==='bach_dien'){ startBachDienDetailIdle(); }\n  if(id==='ky_van'){startKyVanDetailIdle();}");
  once("id==='bach_dien'?'<canvas id=", "id==='ky_van'?'<canvas id=\"kyVanDetailIdle\" width=\"540\" height=\"496\" aria-label=\"Kỷ Vân idle\"></canvas>':id==='bach_dien'?'<canvas id=");
  once('function startBachDienDetailIdle(){','const KY_VAN_DETAIL_META='+JSON.stringify(meta.idleVisual)+';\n'+detailRuntime+'\nfunction startBachDienDetailIdle(){');
  // The hall moves hdBody outside hero-detail-art-screen: scope to the actual stage.
  once('</head>',`<style id="ky-van-detail-layout">
  #hdBody .hstage[data-hero-id="ky_van"]{position:relative!important;overflow:hidden!important;padding-top:420px!important;box-sizing:border-box!important;}
  #hdBody .hstage[data-hero-id="ky_van"]>.hsava{display:none!important;}
  #kyVanDetailIdle{position:absolute!important;top:10px!important;left:50%!important;transform:translateX(-50%)!important;width:260px!important;height:402px!important;max-width:100%;pointer-events:none;}
  </style></head>`);
 }
 return s.split(roster).join('"linh_dong","bach_dien","ky_van"]');
}

