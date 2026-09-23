import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createBattleAssetReadiness } from '../src/combat-domain/battle-asset-readiness.mjs';

const MARKER = '/* HV_BATTLE_ASSET_READINESS_V1 */';
function replaceOne(text, from, to, label) {
  if (text.split(from).length !== 2) throw new Error('Readiness patch expected one ' + label);
  return text.replace(from, () => to);
}
function replaceFunction(text, startName, nextName, edit) {
  const start = text.indexOf('function ' + startName + '(');
  const end = text.indexOf('function ' + nextName + '(', start + 1);
  if (start < 0 || end <= start) throw new Error('Readiness function boundary: ' + startName);
  return text.slice(0, start) + edit(text.slice(start, end)) + '\n' + text.slice(end);
}
export function battleActionWorkingSetBytes(atlases) {
  const sets = [
    ['run-atlas.webp', 'basic-atlas.webp', 'skill1_vfx-atlas.webp'],
    ['run-atlas.webp', 'ultimate-atlas.webp', 'ultimate_vfx-atlas.webp']
  ];
  const bytes = file => {
    const atlas = atlases[file];
    if (!atlas) throw new Error('Missing battle working-set atlas: ' + file);
    return Number(atlas.width) * Number(atlas.height) * 4;
  };
  return Math.max(...sets.map(files => files.reduce((sum, file) => sum + bytes(file), 0)));
}
function runtimeSource(variants) {
  return `${MARKER}
const __HV_READY_ATLASES = ${JSON.stringify(variants)};
const __HV_LOW_MEMORY_IOS=(()=>{try{const n=navigator;return /iPad|iPhone|iPod/i.test(String(n?.userAgent||''))||(n?.platform==='MacIntel'&&Number(n?.maxTouchPoints||0)>1);}catch(_){return false;}})();
function __hvReadyClip(clip){
  const entry=clip&&__HV_READY_ATLASES[clip.src];
  if(!entry)return clip;
  const asset=__HV_LOW_MEMORY_IOS?(entry.mobile||entry.desktop):entry.desktop;
  if(!asset)return clip;
  const scale=asset.scale;
  return {...clip,src:asset.src,cellW:clip.cellW*scale,cellH:clip.cellH*scale,w:clip.w*scale,h:clip.h*scale,
    atlasWidth:asset.width,atlasHeight:asset.height,decodedBytes:asset.width*asset.height*4,
    pivot:clip.pivot?{x:clip.pivot.x*scale,y:clip.pivot.y*scale}:undefined};
}
function clipFor(key){return __hvReadyClip(__hvOriginalClipFor(key));}
function clipForBachDien(key){return __hvReadyClip(__hvOriginalClipForBachDien(key));}
const __hvBattleAssets=(${createBattleAssetReadiness.toString()})({
  getState:()=>state,getUnits:()=>units,sound:()=>window.HonVietSfx,
  describe:unit=>isLinhDong(unit)?{hero:'linh-dong',loader:LINH_DONG_LOADER,clip:clipFor,sfx:action=>action==='ultimate'?'linh-dong-ult':'linh-dong-atk'}:
    isBachDien(unit)?{hero:'bach-dien',loader:BACH_DIEN_LOADER,clip:clipForBachDien,sfx:action=>action==='ultimate'?'bach-dien-ult':'bach-dien-atk'}:null,
  onWaiting:actor=>{setStatus(actor.name+' \u0111ang chu\u1ea9n b\u1ecb h\u00ecnh v\u00e0 hi\u1ec7u \u1ee9ng');dom.phaseLabel.textContent='\u0110ang t\u1ea3i t\u00e0i nguy\u00ean';}
});
function __hvBattleAssetError(error,actor,action,target,battleId){
  if(state.battleId!==battleId||state.mode!=='battle'||state.currentId!==actor.id)return;
  const resumeAuto=state.auto;
  state.locked=false;state.auto=false;
  if(error?.name==='AbortError')return;
  setStatus('Ch\u01b0a t\u1ea3i \u0111\u1ee7 h\u00ecnh/hi\u1ec7u \u1ee9ng. L\u01b0\u1ee3t \u0111\u00e1nh ch\u01b0a b\u1eaft \u0111\u1ea7u.');
  let box=document.getElementById('hvBattleAssetError');
  if(!box){
    box=document.createElement('div');box.id='hvBattleAssetError';box.setAttribute('role','alert');
    box.style.cssText='position:absolute;z-index:90;left:8%;right:8%;top:42%;padding:16px;background:#162b2b;color:#fff;border:1px solid #c9aa69;border-radius:8px;text-align:center;font:14px sans-serif;';
    const message=document.createElement('p');message.textContent='Kh\u00f4ng t\u1ea3i \u0111\u1ee7 h\u00ecnh v\u00e0 hi\u1ec7u \u1ee9ng. L\u01b0\u1ee3t \u0111\u00e1nh ch\u01b0a tr\u1eeb n\u1ed9.';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Th\u1eed l\u1ea1i';retry.style.cssText='min-height:44px;padding:8px 24px;cursor:pointer;';
    box.append(message,retry);(document.querySelector('.game-viewport')||document.body).appendChild(box);
  }
  box.hidden=false;
  box.querySelector('button').onclick=()=>{
    if(state.battleId!==battleId||state.currentId!==actor.id||state.mode!=='battle'){box.hidden=true;return;}
    box.hidden=true;state.auto=resumeAuto;void performAction(actor,action,target);
  };
}
window.__HV_BATTLE_ASSET_QA={events:()=>__hvBattleAssets.events(),inspect:()=>LINH_DONG_LOADER.inspect(),paints:()=>__hvBattleAssets.paintCounts()};
window.addEventListener('pagehide',()=>__hvBattleAssets.dispose(),{once:true});
`;
}
function patchSplusReadiness(html) {
  const start=html.indexOf('async function performSplusAction(actor, action, target) {');
  const end=html.indexOf('\nfunction drawSplusToken(',start);
  if(start<0||end<start)throw new Error('S+ action owner boundary missing');
  let body=html.slice(start,end);
  body=replaceOne(body,'  state.locked=true;state.selectedAction=action;clearTargets();updateActorHud(actor);',`  state.locked=true;
  let __hvSplusAssets;
  try{__hvSplusAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);}
  catch(error){__hvBattleAssetError(error,actor,action,target,battleId);return;}
  actor._hvAssetLease=__hvSplusAssets;
  try{
  state.selectedAction=action;clearTargets();updateActorHud(actor);`, 'S+ pre-cast readiness');
  body=replaceOne(body,"  const linhAction=linh&&typeof beginLinhDongAction==='function'?beginLinhDongAction(actor,action,target,battleId):null;",`  if((linh||bach)&&!await __hvSkillMovement.approach(actor,action,target,battleId))return;
  const linhAction=linh&&typeof beginLinhDongAction==='function'?beginLinhDongAction(actor,action,target,battleId):null;`, 'S+ per-skill approach');
  body=replaceOne(body,"  setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;",`  if((linh||bach)&&actor.hp>0&&!await __hvSkillMovement.returnHome(actor,battleId))return;
  setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;`, 'S+ return after recovery');
  const close=body.lastIndexOf('}');
  body=body.slice(0,close)+`  }finally{
    if(actor._hvAssetLease===__hvSplusAssets)delete actor._hvAssetLease;
    __hvSplusAssets.release();
  }
`+body.slice(close);
  return html.slice(0,start)+body+html.slice(end);
}
export function patchBattleReadiness(input, variants = {}) {
  if (input.includes(MARKER)) return input;
  if (!input.includes('HV_SFX_READINESS_V1')) throw new Error('Updated shared SFX source must be built before readiness');
  let html = input;
  // QA replacements must not inherit a legacy first-match renderer identity.
  for(const hero of ['linh-dong','bach-dien']){
    const sourceId='hero_splus_'+hero.replace('-','_');
    const from="Object.assign(qaHero,{sourceId:'"+sourceId+"',";
    html=replaceOne(html,from,"Object.assign(qaHero,{id:'qa-"+hero+"',sourceId:'"+sourceId+"',",hero+' QA identity');
  }
  html = replaceOne(html, 'function clipFor(key){', 'function __hvOriginalClipFor(key){', 'Linh Dong clip mapper');
  html = replaceOne(html, 'function clipForBachDien(key){', 'function __hvOriginalClipForBachDien(key){', 'Bach Dien clip mapper');
  for (const [hero, cap, title] of [['linh-dong','LINH_DONG','LinhDong'],['bach-dien','BACH_DIEN','BachDien']]) {
    html = replaceOne(html, `return ${cap}_LOADER.ensure(clip,{priority:'visible',scope:'battle'}).image;`,
      `return __hvBattleAssets.image(${cap}_LOADER,clip,key);`, hero + ' visible image owner');
    html = replaceFunction(html, 'play' + title + 'Sfx', 'start' + title + 'Fx', () =>
      `function play${title}Sfx(action,info){
  const normalized=normalize${title}Action(action);
  if(!normalized)return Promise.resolve(false);
  return __hvBattleAssets.playSfx(info||{battleId:state.battleId},normalized==='ultimate'?'${hero}-ult':'${hero}-atk');
}`);
    html = replaceOne(html, `info.clock=create${title}TimelineController(normalized,`,
      `info.assetSignal=actor._hvAssetLease?.signal;\n  info.clock=create${title}TimelineController(normalized,`, hero + ' action cancellation signal');
    html = replaceOne(html,
      `  if(atk?.src)${cap}_LOADER.release(atk.src);\n  if(vfx?.src)${cap}_LOADER.release(vfx.src);`,
      `  // The action lease survives recovery and the return movement.\n  info.finished=true;`, hero + ' retain decoded action data');
    html = replaceFunction(html, 'draw' + title + 'Atlas', 'draw' + title + 'Hero', block => {
      block=replaceOne(block,'return drawCanvasSprite(context,','const painted=drawCanvasSprite(context,',hero+' paint result');
      const closing=block.lastIndexOf('}');
      return block.slice(0,closing)+`  if(painted)__hvBattleAssets.painted('${hero}',key);\n  return painted;\n`+block.slice(closing);
    });
  }
  const owner = '  async function __hvPerformAction3qAdapter(actor, action, target) {';
  html = replaceOne(html, owner, runtimeSource(variants) + '\n' + owner, 'existing action owner');
  const start = html.indexOf(owner), end = html.indexOf('\n  function statusLabel(', start);
  if(start<0||end<start)throw new Error('Canonical action body boundary missing');
  let body = html.slice(start, end);
  body = replaceOne(body, '    state.locked = true;', `    state.locked = true;
    let __hvActionAssets;
    try{
      __hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);
    }catch(error){__hvBattleAssetError(error,actor,action,target,battleId);return;}
    actor._hvAssetLease=__hvActionAssets;
    const __hvOldAssetError=document.getElementById('hvBattleAssetError');if(__hvOldAssetError)__hvOldAssetError.hidden=true;
    try{`, 'locked, pre-debit readiness gate');
  const close = body.lastIndexOf('  }');
  if(close<0)throw new Error('Canonical action closing brace missing');
  body = body.slice(0,close) + `    }finally{
      if(actor._hvAssetLease===__hvActionAssets)delete actor._hvAssetLease;
      __hvActionAssets.release();
    }
` + body.slice(close);
  return patchSplusReadiness(html.slice(0,start)+body+html.slice(end));
}
export async function buildBattleReadiness(root) {
  const out = join(root,'dist');
  const { atlasDecodeScale } = await import('../src/assets/decoded-atlas-cache.mjs');
  const { default: sharp } = await import('sharp');
  const variants = {}, report = [];
  const writeVariant = async ({source,relative,directory,file,meta,scale,profile,folder}) => {
    if(scale===1)return null;
    const width=Math.round(meta.width*scale),height=Math.round(meta.height*scale);
    const src=relative+folder+'/'+file,target=join(out,src);
    mkdirSync(join(directory,folder),{recursive:true});
    await sharp(source).resize(width,height,{fit:'fill'}).webp({lossless:true,effort:2}).toFile(target);
    report.push({profile,source:relative+file,src,width,height,scale,sourceBytes:statSync(source).size,bytes:statSync(target).size,
      decodedBefore:meta.width*meta.height*4,decodedAfter:width*height*4});
    return {src,width,height,scale};
  };
  for(const hero of ['linh-dong','bach-dien']){
    const relative='assets/characters/'+hero+'/',directory=join(out,relative);
    if(!existsSync(directory))throw new Error('Missing hero assets: '+relative);
    const files=readdirSync(directory).filter(file=>file.endsWith('-atlas.webp')).sort();
    const metas={};
    for(const file of files)metas[file]=await sharp(join(directory,file)).metadata();
    // The action lease pins movement + cast + VFX together. Size every atlas
    // against that peak so the complete working set fits the decoded cache.
    const workingSetBytes=battleActionWorkingSetBytes(metas);
    const desktopScale=atlasDecodeScale(workingSetBytes,128*1024*1024);
    const mobileScale=atlasDecodeScale(workingSetBytes,96*1024*1024);
    for(const file of files){
      const source=join(directory,file),meta=metas[file];
      const desktop=await writeVariant({source,relative,directory,file,meta,scale:desktopScale,profile:'desktop',folder:'ready-v1'});
      const mobile=await writeVariant({source,relative,directory,file,meta,scale:mobileScale,profile:'mobile',folder:'ready-mobile-v1'});
      if(desktop||mobile)variants[relative+file]={desktop,mobile};
    }
  }
  const battlePath=join(out,'battle.html');
  writeFileSync(battlePath,patchBattleReadiness(readFileSync(battlePath,'utf8'),variants));
  writeFileSync(join(out,'battle-readiness-assets.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Battle readiness: cast resources leased through recovery/return; shared SFX results checked.');
  console.log('BATTLE_READY_ASSET_REPORT '+JSON.stringify(report));
}
