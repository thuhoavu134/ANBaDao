import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
export function patchTieuPhongBattle(input,runtime,meta){
 if(input.includes('/* HV_TIEU_PHONG_V1 */'))return input;let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Tieu Phong anchor '+from.slice(0,80));s=s.replace(from,()=>to);};
 once('async function performSplusAction(actor, action, target) {','/* HV_TIEU_PHONG_V1 */\nconst TIEU_PHONG_META='+JSON.stringify(meta)+';\n'+runtime+'\nasync function performSplusAction(actor, action, target) {');
 once('  let fallbackPresentation=null;',`  const fanAction=isTieuPhong(actor)?await beginTieuPhongAction(actor,action,target,battleId):null;
  if(isTieuPhong(actor)&&!fanAction){if(state.battleId===battleId){state.locked=false;state.currentId=null;void advanceTurn();}return;}
  let fallbackPresentation=null;`);
 once("  if(kyAction){\n    if(!await waitKyVanMarker(kyAction,'release',battleId))return;", "  if(fanAction){\n    if(!await waitTieuPhongMarker(fanAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitTieuPhongMarker(fanAction,'impact',battleId))return;\n  }else if(kyAction){\n    if(!await waitKyVanMarker(kyAction,'release',battleId))return;");
 once('result=e.act(actor.id,action,target?.id);','result=fanAction?await resolveTieuPhongCast(e,fanAction,actor,action,target,battleId):e.act(actor.id,action,target?.id);');
 once('if(!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation','if(!fanAction&&!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation');
 once("  if(kyAction){\n    if(!await waitKyVanMarker(kyAction,'recovery:end',battleId))return;", "  if(fanAction){\n    if(!await waitTieuPhongMarker(fanAction,'recovery:end',battleId))return;\n    finishTieuPhongAction(fanAction);\n  }else if(kyAction){\n    if(!await waitKyVanMarker(kyAction,'recovery:end',battleId))return;");
 once('function drawSplusToken(context, unit, time) {','function drawSplusToken(context, unit, time) {\n  if(isTieuPhong(unit))return drawTieuPhongHero(context,unit,time);');
 once('drawKyVanFx(ctx,time);','drawKyVanFx(ctx,time);drawTieuPhongFx(ctx,time);');
 once('function splusReset(){','function splusReset(){cancelTieuPhongActions();');
 once('  async function performAction(actor, action, target) {',"  async function performAction(actor, action, target) {\n    if(typeof isTieuPhong==='function'&&isTieuPhong(actor)&&action==='skill')action='basic';");
 once('const slots=isKyVan(actor)||','const slots=isTieuPhong(actor)||isKyVan(actor)||');
 once('  const h=normalizeConfiguredHero(raw,index),kit=',"  if(raw&&/^(?:tieu_phong|tieu-phong)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_tieu_phong'};\n  const h=normalizeConfiguredHero(raw,index),kit=");
 once('const authoredFallMs=typeof isKyVan', 'const authoredFallMs=typeof isTieuPhong==="function"&&isTieuPhong(unit)?tieuPhongFallDuration():typeof isKyVan');
 once('unit.defeatHideDuration = typeof isKyVan', 'unit.defeatHideDuration = typeof isTieuPhong==="function"&&isTieuPhong(unit)?authoredFallMs+120/Math.max(1,state.speed):typeof isKyVan');
 once('function splusEvent(event) {',`function splusEvent(event) {
  if(event.type==='damage'){const u=getUnit(event.targetId);if(isTieuPhong(u)&&u.hp>0&&!u._tieuPhongAction){setUnitState(u,'hurt',TIEU_PHONG_META.clips.hit.durationMs);tieuPhongImage('hit');}}
  if(event.type==='death'){const u=getUnit(event.targetId);if(isTieuPhong(u))tieuPhongImage('fall-die');}`);
 return s;
}
export async function buildTieuPhongCampaignAssets(root){
 const {default:sharp}=await import('sharp');
 const base=join(root,'dist/assets/characters/tieu-phong'),out=join(base,'campaign');mkdirSync(out,{recursive:true});
 for(const key of ['idle-0','idle-1','idle-2','idle-3','idle-4','idle-5','run','basic']){
  const source=sharp(join(base,key+'.webp')),info=await source.metadata();
  await source.resize(info.width/2,info.height/2).webp({quality:90,alphaQuality:100}).toFile(join(out,key+'.webp'));
 }
 await sharp(join(base,'idle-0.webp')).extract({left:0,top:0,width:480,height:440}).resize(240,220).webp({quality:90,alphaQuality:100}).toFile(join(out,'idle-poster.webp'));
}
export async function installTieuPhong(root){await buildTieuPhongCampaignAssets(root);const out=join(root,'dist'),p=join(out,'battle.html');writeFileSync(p,patchTieuPhongBattle(readFileSync(p,'utf8'),readFileSync(join(root,'src/runtime/tieu-phong.js'),'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/tieu-phong/runtime-meta.json'),'utf8'))));const host=join(out,'index.html');writeFileSync(host,patchTieuPhongHost(readFileSync(host,'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/tieu-phong/runtime-meta.json'),'utf8')),readFileSync(join(root,'src/ui/tieu-phong-detail.js'),'utf8')));copyFileSync(join(root,'tieu-phong-test.html'),join(out,'tieu-phong-test.html'));}

export function patchTieuPhongHost(input,meta,detailRuntime){
 if(input.includes('tieu_phong:{slug:'))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Tieu Phong host anchor: '+from);s=s.replace(from,()=>to);};
 once('const CHARACTER_MANIFEST={','const CHARACTER_MANIFEST={\n'+"  tieu_phong:{slug:'tieu-phong',displayName:'Tiêu Phong',identityVersion:'authored-idle-v1',reference:{master:'assets/characters/tieu-phong/avatar.webp',runtime:true},assets:Object.fromEntries(['master','avatar','dialogue','card','icon'].map(k=>[k,'assets/characters/tieu-phong/avatar.webp']).concat([['idle','assets/characters/tieu-phong/idle-authored-0.webp']])),surfaces:['roster','formation','hero-detail','battle'],mechanics:{ultimate:'tam-diep-phong-bao'}},");
 once(" bach_dien:{he:'soul'"," tieu_phong:{he:'kim',faction:'hoi_lang',archetype:'mystic',rarity:'ssr',name:'Tiêu Phong',role:'Ngự Phong Công Tử / Khống chế',col:'#b6d8e8',stats:{hp:900,mp:60,atk:122,def:52,spd:112},passive:{name:'Thiết Phiến',desc:'Điều khiển phong bạo bằng thiết phiến.'},skill:{name:'Hô Phong',cost:0,vfx:'wind',desc:'Lốc nhỏ chạy sát đất đến mục tiêu.',fx:{kind:'damage',target:'enemy',power:1}},ultimate:{name:'Tam Điệp Phong Bạo',cost:60,vfx:'wind',desc:'Ba lốc xuyên hàng: 50% choáng 1 lượt; 40% cấm hồi máu 2 lượt; 30% chí mạng 200% ATK cơ bản.',fx:{kind:'damage',target:'aoe_enemy',power:1.2}}},"+"\n bach_dien:{he:'soul'");
 const roster='"linh_dong","bach_dien","ky_van"]';
 if(s.split(roster).length!==4)throw Error('Tieu Phong roster owners changed');
 if(meta&&detailRuntime){
  const base={src:'assets/characters/tieu-phong/campaign/idle-0.webp',frames:meta.idle.frames,cols:4,cellW:240,cellH:220,pivot:120,foot:215.5,body:209.5,durations:meta.idle.frameDurationsMs};
  const descriptor=key=>{const c=meta.clips[key];return {src:'assets/characters/tieu-phong/campaign/'+c.file,frames:c.frames,cols:c.cols,cellW:240,cellH:220,pivot:120,foot:215.5,body:209.5,ms:c.durationMs/c.frames};};
  const pages=Array.from({length:6},(_,i)=>({...descriptor('idle-'+i),rows:Math.ceil(meta.clips['idle-'+i].frames/4)}));
  const pack={pageFrames:16,pages,poster:{...pages[0],src:'assets/characters/tieu-phong/campaign/idle-poster.webp',cols:1,rows:1,frames:1,frameIndex:0}};
  once('function preparationSpriteFor(pick, time) {','Object.assign(spriteSpecs,{tieu_phong:'+JSON.stringify(base)+'});\nObject.assign(preparationIdlePacks,{tieu_phong:'+JSON.stringify(pack)+'});\nfunction preparationSpriteFor(pick, time) {');
  once('function frameAt(spec, time) {','Object.assign(runSpecs,{tieu_phong:'+JSON.stringify(descriptor('run'))+'});\nObject.assign(farmAttackSpecs,{tieu_phong:'+JSON.stringify(descriptor('basic'))+'});\nfunction frameAt(spec, time) {');
  once("const id=String(value||'').replace(/-/g,'_');", "const id=String(value||'').replace(/-/g,'_');if(id==='hero_splus_tieu_phong')return 'tieu_phong';");
  once("if(id==='bach_dien'){ startBachDienDetailIdle(); }", "if(id==='bach_dien'){ startBachDienDetailIdle(); }\n  if(id==='tieu_phong'){startTieuPhongDetailIdle();}");
  once("id==='bach_dien'?'<canvas id=", "id==='tieu_phong'?'<canvas id=\"tieuPhongDetailIdle\" width=\"540\" height=\"496\" aria-label=\"Tiêu Phong idle\"></canvas>':id==='bach_dien'?'<canvas id=");
  once('function startBachDienDetailIdle(){','const TIEU_PHONG_DETAIL_META='+JSON.stringify(meta.idleVisual)+';\n'+detailRuntime+'\nfunction startBachDienDetailIdle(){');
  // The hall moves hdBody outside hero-detail-art-screen: scope to the actual stage.
  once('</head>',`<style id="tieu-phong-detail-layout">
  #hdBody .hstage[data-hero-id="tieu_phong"]{position:relative!important;overflow:hidden!important;padding-top:420px!important;box-sizing:border-box!important;}
  #hdBody .hstage[data-hero-id="tieu_phong"]>.hsava{display:none!important;}
  #tieuPhongDetailIdle{position:absolute!important;top:10px!important;left:50%!important;transform:translateX(-50%)!important;width:260px!important;height:402px!important;max-width:100%;pointer-events:none;}
  </style></head>`);
 }
 return s.split(roster).join('"linh_dong","bach_dien","ky_van","tieu_phong"]');
}

