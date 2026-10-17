// Hồng Thương (temp name) battle + host installer. Runs AFTER installTichDao
// in scripts/build-static.mjs; every anchor below reflects the post-Tịch Dao
// generated source. Idempotent via the HV_HONG_THUONG_V1 marker.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
export function patchHongThuongBattle(input,runtime,meta){
 if(input.includes('/* HV_HONG_THUONG_V1 */'))return input;let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Hong Thuong anchor '+from.slice(0,90));s=s.replace(from,()=>to);};
 once('async function performSplusAction(actor, action, target) {','/* HV_HONG_THUONG_V1 */\nconst HONG_THUONG_META='+JSON.stringify(meta)+';\n'+runtime+'\nasync function performSplusAction(actor, action, target) {');
 once('  const shadowAction=isTichDao(actor)?await beginTichDaoAction(actor,action,target,battleId,e):null;',`  const spearAction=isHongThuong(actor)?await beginHongThuongAction(actor,action,target,battleId,e):null;
  if(isHongThuong(actor)&&!spearAction){if(state.battleId===battleId){state.locked=false;state.currentId=null;void advanceTurn();}return;}
  const shadowAction=isTichDao(actor)?await beginTichDaoAction(actor,action,target,battleId,e):null;`);
 once("  if(shadowAction){\n    if(!await waitTichDaoMarker(shadowAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitTichDaoMarker(shadowAction,'impact',battleId))return;\n  }else if(fanAction){", "  if(spearAction){\n    if(!await waitHongThuongMarker(spearAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n  }else if(shadowAction){\n    if(!await waitTichDaoMarker(shadowAction,'release',battleId))return;\n    presentationTrace?.marker('release',{actionId:presentationId});\n    if(!await waitTichDaoMarker(shadowAction,'impact',battleId))return;\n  }else if(fanAction){");
 once('result=shadowAction?await resolveTichDaoCast(e,shadowAction,actor,action,target,battleId):fanAction?await resolveTieuPhongCast(e,fanAction,actor,action,target,battleId):e.act(actor.id,action,target?.id);','result=spearAction?await resolveHongThuongCast(e,spearAction,actor,action,target,battleId):shadowAction?await resolveTichDaoCast(e,shadowAction,actor,action,target,battleId):fanAction?await resolveTieuPhongCast(e,fanAction,actor,action,target,battleId):e.act(actor.id,action,target?.id);');
 once('if(!shadowAction&&!fanAction&&!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation','if(!spearAction&&!shadowAction&&!fanAction&&!kyAction&&!linhAction&&!bachAction)triggerImpactPresentation');
 once("  if(shadowAction){\n    if(!await waitTichDaoMarker(shadowAction,'recovery:end',battleId))return;\n    finishTichDaoAction(shadowAction);\n  }else if(fanAction){", "  if(spearAction){\n    if(!await waitHongThuongMarker(spearAction,'recovery:end',battleId))return;\n    finishHongThuongAction(spearAction);\n  }else if(shadowAction){\n    if(!await waitTichDaoMarker(shadowAction,'recovery:end',battleId))return;\n    finishTichDaoAction(shadowAction);\n  }else if(fanAction){");
 once('  if(isTichDao(unit))return drawTichDaoHero(context,unit,time);','  if(isHongThuong(unit))return drawHongThuongHero(context,unit,time);\n  if(isTichDao(unit))return drawTichDaoHero(context,unit,time);');
 once('(isKyVan(unit)||isTieuPhong(unit)||isTichDao(unit))?battleCharacterScale(unit)*419','(isKyVan(unit)||isTieuPhong(unit)||isTichDao(unit)||isHongThuong(unit))?battleCharacterScale(unit)*419');
 once('function splusReset(){cancelTichDaoActions();cancelTieuPhongActions();','function splusReset(){cancelHongThuongActions();cancelTichDaoActions();cancelTieuPhongActions();');
 once("  async function performAction(actor, action, target) {\n    if(typeof isTichDao==='function'&&isTichDao(actor)&&action==='skill')action='basic';","  async function performAction(actor, action, target) {\n    if(typeof isHongThuong==='function'&&isHongThuong(actor)&&action==='skill')action='basic';\n    if(typeof isTichDao==='function'&&isTichDao(actor)&&action==='skill')action='basic';");
 once('const slots=isTichDao(actor)||isTieuPhong(actor)||isKyVan(actor)||','const slots=isHongThuong(actor)||isTichDao(actor)||isTieuPhong(actor)||isKyVan(actor)||');
 once("  if(raw&&/^(?:tich_dao|tich-dao)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_tich_dao'};","  if(raw&&/^(?:tich_dao|tich-dao)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_tich_dao'};\n  if(raw&&/^(?:hong_thuong|hong-thuong)$/.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_hong_thuong'};");
 once('const authoredFallMs=typeof isTichDao==="function"&&isTichDao(unit)?tichDaoFallDuration():typeof isTieuPhong','const authoredFallMs=typeof isHongThuong==="function"&&isHongThuong(unit)?hongThuongFallDuration():typeof isTichDao==="function"&&isTichDao(unit)?tichDaoFallDuration():typeof isTieuPhong');
 once('unit.defeatHideDuration = typeof isTichDao==="function"&&isTichDao(unit)?authoredFallMs+120/Math.max(1,state.speed):typeof isTieuPhong','unit.defeatHideDuration = typeof isHongThuong==="function"&&isHongThuong(unit)?authoredFallMs+120/Math.max(1,state.speed):typeof isTichDao==="function"&&isTichDao(unit)?authoredFallMs+120/Math.max(1,state.speed):typeof isTieuPhong');
 once("if(event.type==='death'){const u=getUnit(event.targetId);if(isTichDao(u))tichDaoImage('fall-die');}",`if(event.type==='death'){const u=getUnit(event.targetId);if(isTichDao(u))tichDaoImage('fall-die');}
  if(event.type==='damage'){const u=getUnit(event.targetId);if(isHongThuong(u)&&u.hp>0&&!u._hongThuongAction){setUnitState(u,'hurt',HONG_THUONG_META.clips.hit.durationMs);hongThuongImage('hit');}}
  if(event.type==='death'){const u=getUnit(event.targetId);if(isHongThuong(u))hongThuongImage('fall-die');}`);
 // Sơ Hở HUD: same status lane as Hoa Ấn — icon + stack count, Lộ Điểm Yếu
 // badge flips red at 3 stacks. No second HUD renderer.
 once('hoaAn: "assets/ui/status/hoa-an.svg",','hoaAn: "assets/ui/status/hoa-an.svg",\n    soHo: "assets/ui/status/so-ho.svg",loDiemYeu: "assets/ui/status/so-ho.svg",');
 once('      if(isNemVi){',`      if(status.type==='soHo'||status.type==='loDiemYeu'){
        context.shadowBlur=0;context.font='bold 11px sans-serif';context.textAlign='center';context.textBaseline='middle';
        context.fillStyle=status.type==='loDiemYeu'?'#5c1420':'#2a1512';context.beginPath();context.arc(sx+size*.34,sy+size*.30,7,0,Math.PI*2);context.fill();
        context.fillStyle=status.type==='loDiemYeu'?'#ffd2d8':'#ffe3c4';context.fillText(String(status.stacks||1),sx+size*.34,sy+size*.30);
      }
      if(isNemVi){`);
 once('    drawEffects(ctx, time);\n    drawTichDaoVfx(ctx, time);','    drawEffects(ctx, time);\n    drawTichDaoVfx(ctx, time);\n    drawHongThuongVfx(ctx, time);');
 return s;
}
export async function buildHongThuongCampaignAssets(root){
 const {default:sharp}=await import('sharp');
 const base=join(root,'assets/characters/hong-thuong'),out=join(root,'dist/assets/characters/hong-thuong/campaign');mkdirSync(out,{recursive:true});
 const meta=JSON.parse(readFileSync(join(base,'runtime-meta.json'),'utf8'));
 for(const key of [...Array.from({length:meta.idleVisual.pages},(_,i)=>'idle-authored-'+i),'run','basic']){
  const source=sharp(join(base,key+'.webp')),info=await source.metadata();
  await source.resize(Math.round(info.width/2),Math.round(info.height/2)).webp({quality:90,alphaQuality:100}).toFile(join(out,key+'.webp'));
 }
 const idleMeta=sharp(join(base,'idle-authored-0.webp'));
 const info=await idleMeta.metadata(),cellW=Math.round(info.width/4);
 await sharp(join(base,'idle-authored-0.webp')).extract({left:0,top:0,width:cellW,height:474}).resize(cellW/2,237).webp({quality:90,alphaQuality:100}).toFile(join(out,'idle-poster.webp'));
}
export async function installHongThuong(root){
 await buildHongThuongCampaignAssets(root);
 const out=join(root,'dist'),p=join(out,'battle.html');
 writeFileSync(p,patchHongThuongBattle(readFileSync(p,'utf8'),readFileSync(join(root,'src/runtime/hong-thuong.js'),'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/hong-thuong/runtime-meta.json'),'utf8'))));
 const host=join(out,'index.html');
 writeFileSync(host,patchHongThuongHost(readFileSync(host,'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/hong-thuong/runtime-meta.json'),'utf8')),readFileSync(join(root,'src/ui/hong-thuong-detail.js'),'utf8')));
 copyFileSync(join(root,'hong-thuong-test.html'),join(out,'hong-thuong-test.html'));
}
export function hongThuongCampaignDescriptor(meta,key){
 // Idle pages live under idleVisual, not clips — synthesize the same shape.
 const c=meta.clips[key]||(()=>{const iv=meta.idleVisual,idx=Number(key.slice('idle-authored-'.length));
  return {file:`idle-authored-${idx}.webp`,cols:iv.cols,frames:Math.min(iv.pageFrames,iv.frames-idx*iv.pageFrames),cellW:iv.cellW,content:{bodyCx:iv.content.bodyCx,footCellY:iv.content.footCellY,bodyHeightPx:iv.content.bodyHeightPx},durationMs:iv.pageFrames*(iv.durationMs/iv.frames)};})();
 // Battle registration: fixed cell box around the same body/foot anchor.
 return {src:'assets/characters/hong-thuong/campaign/'+c.file,frames:c.frames,cols:c.cols,cellW:Math.round(c.cellW/2),cellH:237,pivot:Math.round(((c.content&&c.content.bodyCx)||c.cellW/2)/2),foot:Math.round(((c.content&&c.content.footCellY)||474)/2),body:Math.round(((c.content&&c.content.bodyHeightPx)||423)/2),ms:c.durationMs/c.frames};
}
export function patchHongThuongHost(input,meta,detailRuntime){
 if(input.includes("hong_thuong:{slug:'hong-thuong'"))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Hong Thuong host anchor: '+String(from).slice(0,90));s=s.replace(from,()=>to);};
 once('const CHARACTER_MANIFEST={','const CHARACTER_MANIFEST={\n'+"  hong_thuong:{slug:'hong-thuong',displayName:'Hồng Thương (tên tạm)',identityVersion:'green-screen-key-v1',reference:{master:'assets/characters/hong-thuong/avatar.webp',runtime:true},assets:Object.fromEntries(['master','avatar','dialogue','card','icon'].map(k=>[k,'assets/characters/hong-thuong/avatar.webp']).concat([['idle','assets/characters/hong-thuong/idle-authored-0.webp']])),surfaces:['roster','formation','hero-detail','battle'],mechanics:{ultimate:'kinh-hoong-pha-tran'}},");
 once(" bach_dien:{he:'soul'"," hong_thuong:{he:'metal',faction:'kim_khi',archetype:'striker',rarity:'ssr',name:'Hồng Thương (tên tạm)',role:'Đấu sĩ thương cận chiến',col:'#e8a9a0',stats:{hp:940,mp:60,atk:142,def:48,spd:120},passive:{name:'Phá Trận',desc:'Mỗi nhát thương trúng đặt 1 Sơ Hở (tối đa 3). Đủ 3 tầng: nhát thương kế tiếp của nữ tướng bỏ qua một phần giáp và gây thêm sát thương lên khiên (thông số đề xuất, chờ chủ dự án chốt).'},ultimate:{name:'Kinh Hoồng Phá Trận',cost:60,vfx:'thrust',desc:'Áp sát toàn bộ địch còn sống ở cả hai hàng, mỗi địch một cụm 3 nhát; kết thúc bằng Hồi Mã Thương vào địch có tỷ lệ khiên cao nhất (hết khiên thì giáp cao nhất).',fx:{kind:'damage',target:'enemy',power:1}}},"+"\n bach_dien:{he:'soul'");
 const roster='"linh_dong","bach_dien","ky_van","tieu_phong","tich_dao"]';
 if(s.split(roster).length!==4)throw Error('Hong Thuong roster owners changed');
 if(meta&&detailRuntime){
  const idle=meta.idleVisual;
  const base={src:'assets/characters/hong-thuong/campaign/idle-authored-0.webp',frames:idle.frames,cols:idle.cols,cellW:Math.round(idle.cellW/2),cellH:237,pivot:Math.round(idle.content.bodyCx/2),foot:Math.round(idle.content.footCellY/2),body:Math.round(idle.content.bodyHeightPx/2),durations:idle.frameDurationsMs};
  const descriptor=key=>hongThuongCampaignDescriptor(meta,key);
  const pages=Array.from({length:idle.pages},(_,i)=>({...descriptor('idle-authored-'+i),rows:Math.ceil(Math.min(idle.pageFrames,idle.frames-i*idle.pageFrames)/idle.cols)}));
  const pack={pageFrames:idle.pageFrames,pages,poster:{...pages[0],src:'assets/characters/hong-thuong/campaign/idle-poster.webp',cols:1,rows:1,frames:1,frameIndex:0}};
  once('function preparationSpriteFor(pick, time) {','Object.assign(spriteSpecs,{hong_thuong:'+JSON.stringify(base)+'});\nObject.assign(preparationIdlePacks,{hong_thuong:'+JSON.stringify(pack)+'});\nfunction preparationSpriteFor(pick, time) {');
  once('function frameAt(spec, time) {','Object.assign(runSpecs,{hong_thuong:'+JSON.stringify(descriptor('run'))+'});\nObject.assign(farmAttackSpecs,{hong_thuong:'+JSON.stringify(descriptor('basic'))+'});\nfunction frameAt(spec, time) {');
  once("const id=String(value||'').replace(/-/g,'_');", "const id=String(value||'').replace(/-/g,'_');if(id==='hero_splus_hong_thuong')return 'hong_thuong';");
  once("if(id==='tich_dao'){startTichDaoDetailIdle();}", "if(id==='tich_dao'){startTichDaoDetailIdle();}\n  if(id==='hong_thuong'){startHongThuongDetailIdle();}");
  once("id==='tich_dao'?'<canvas id=\"tichDaoDetailIdle\"", "id==='hong_thuong'?'<canvas id=\"hongThuongDetailIdle\" width=\"540\" height=\"496\" aria-label=\"Hồng Thương idle\"></canvas>':id==='tich_dao'?'<canvas id=\"tichDaoDetailIdle\"");
  once('function startBachDienDetailIdle(){','const HONG_THUONG_DETAIL_META='+JSON.stringify({...idle,contentScale:idle.contentScale})+'\n'+detailRuntime+'\nfunction startBachDienDetailIdle(){');
  once('</head>',`<style id="hong-thuong-detail-layout">
  #hdBody .hstage[data-hero-id="hong_thuong"]{position:relative!important;overflow:hidden!important;padding-top:420px!important;box-sizing:border-box!important;}
  #hdBody .hstage[data-hero-id="hong_thuong"]>.hsava{display:none!important;}
  #hongThuongDetailIdle{position:absolute!important;top:10px!important;left:50%!important;transform:translateX(-50%)!important;width:280px!important;height:430px!important;max-width:100%;pointer-events:none;}
  </style></head>`);
 }
 return s.split(roster).join('"linh_dong","bach_dien","ky_van","tieu_phong","tich_dao","hong_thuong"]');
}

