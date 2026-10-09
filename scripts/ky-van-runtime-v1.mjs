import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
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
 once('    drawBachDienFx(ctx,time);','    drawBachDienFx(ctx,time);\n    drawKyVanFx(ctx,time);');
 once('function splusReset(){','function splusReset(){\n  cancelKyVanActions();');
 once('  async function performAction(actor, action, target) {',"  async function performAction(actor, action, target) {\n    if(typeof isKyVan==='function'&&isKyVan(actor)&&action==='skill')action='basic';");
 once("const slots=typeof isLinhDong==='function'&&isLinhDong(actor)?", "const slots=isKyVan(actor)||typeof isLinhDong==='function'&&isLinhDong(actor)?");
 once('  const h=normalizeConfiguredHero(raw,index),kit=',"  if(raw&&/^(?:ky_van|ky-van)$/i.test(raw.sourceId||raw.id||''))raw={...raw,sourceId:'hero_splus_ky_van'};\n  const h=normalizeConfiguredHero(raw,index),kit=");
 once('    const authoredFallMs=isOngPho(unit)?', "    const authoredFallMs=typeof isKyVan==='function'&&isKyVan(unit)?KY_VAN_META.clips['fall-die'].durationMs:isOngPho(unit)?");
 once('function splusEvent(event) {', "function splusEvent(event) {\n  if(event.type==='damage'){const u=getUnit(event.targetId);if(isKyVan(u)&&u.hp>0){setUnitState(u,'hurt',KY_VAN_META.clips.hit.durationMs);kyVanImage('hit');}}\n  if(event.type==='death'){const u=getUnit(event.targetId);if(isKyVan(u))kyVanImage('fall-die');}");
 return s;
}
export function installKyVan(root){const out=join(root,'dist'),p=join(out,'battle.html');writeFileSync(p,patchKyVanBattle(readFileSync(p,'utf8'),readFileSync(join(root,'src/runtime/ky-van.js'),'utf8'),JSON.parse(readFileSync(join(root,'assets/characters/ky-van/runtime-meta.json'),'utf8'))));const host=join(out,'index.html');writeFileSync(host,patchKyVanHost(readFileSync(host,'utf8')));copyFileSync(join(root,'ky-van-test.html'),join(out,'ky-van-test.html'));}

export function patchKyVanHost(input){
 if(input.includes('ky_van:{slug:'))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Ky Van host anchor: '+from);s=s.replace(from,()=>to);};
 once('const CHARACTER_MANIFEST={','const CHARACTER_MANIFEST={\n'+"  ky_van:{slug:'ky-van',displayName:'Kỷ Vân',identityVersion:'partial-authored-review',reference:{master:'assets/characters/ky-van/standing.webp',runtime:true},assets:Object.fromEntries(['master','avatar','dialogue','card','icon','idle'].map(k=>[k,'assets/characters/ky-van/standing.webp'])),surfaces:['roster','formation','hero-detail','battle'],mechanics:{ultimate:'thien-loi-cham-tran'}},");
 once(" bach_dien:{he:'soul'"," ky_van:{he:'kim',faction:'hoi_lang',archetype:'mystic',rarity:'ssr',name:'Kỷ Vân',role:'Lôi Châm Sư / Khống chế',col:'#b6d8e8',stats:{hp:900,mp:60,atk:122,def:52,spd:112},passive:{name:'Lôi Châm',desc:'Điều khiển phi châm dẫn sét.'},skill:{name:'Phi Châm',cost:0,vfx:'lightning',desc:'Phóng một phi châm dẫn sét.',fx:{kind:'damage',target:'enemy',power:1}},ultimate:{name:'Thiên Lôi Châm Trận',cost:60,vfx:'lightning',desc:'Sát thương toàn địch. 30% tỷ lệ mỗi địch bị choáng và cấm hồi máu trong một lượt. Thông số thử cân bằng.',fx:{kind:'damage',target:'aoe_enemy',power:1.2}}},"+"\n bach_dien:{he:'soul'");
 const roster='"linh_dong","bach_dien"]';
 if(s.split(roster).length!==4)throw Error('Ky Van roster owners changed');
 return s.split(roster).join('"linh_dong","bach_dien","ky_van"]');
}
