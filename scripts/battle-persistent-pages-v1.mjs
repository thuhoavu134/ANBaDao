import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { buildPreparationIdlePages } from './campaign-preparation-idle-v1.mjs';
import { createPersistentAtlasPages } from '../src/render/persistent-atlas-pages.mjs';
import { createDecodedAtlasCache, atlasDecodedBytes, atlasDecodeScale, clipSource, downsampleDecodedAtlas } from '../src/assets/decoded-atlas-cache.mjs';

// Use final runtime descriptors, including source/cell changes by earlier owners.
export function battlePersistentSourceSpecs(html) {
  const names = ['LUC_ANH_ID', 'LUC_ANH_ASSET_BASE', 'LUC_ANH_META',
    'DINH_LOI_ID', 'DINH_LOI_ASSET_BASE', 'DINH_LOI_ASSET_NAMES', 'DINH_LOI_CLIPS'];
  const declarations = names.map(name => {
    const match = new RegExp('\\bconst\\s+' + name + '\\s*=').exec(html);
    if (!match) throw new Error('Persistent atlas descriptor: ' + name);
    let end = match.index;
    while ((end = html.indexOf(';', end + 1)) >= 0) {
      const source = html.slice(match.index, end + 1);
      try { new vm.Script(source); return source; } catch {}
    }
    throw new Error('Unterminated persistent descriptor: ' + name);
  });
  return vm.runInNewContext(declarations.join('\n') + `
    ({
      'luc-idle':{src:LUC_ANH_ASSET_BASE+LUC_ANH_META.idle.file,frames:LUC_ANH_META.idle.frames,
        cols:LUC_ANH_COLS,cellW:LUC_ANH_META.idle.w,cellH:LUC_ANH_META.idle.h},
      'dinh-idle':{...DINH_LOI_CLIPS.idle,frames:DINH_LOI_FRAMES},
      'dinh-shield':{...DINH_LOI_CLIPS.skill1Shield,frames:DINH_LOI_FRAMES}
    })`, { __HV_BATTLE_LOW_MEMORY: false }, { timeout: 1000 });
}

export function persistentPageBudget(packs) {
  return Object.values(packs).reduce((sum, pack) => sum +
    Math.min(2, pack.pages.length) * Math.max(...pack.pages.map(page => page.atlasWidth * page.atlasHeight * 4)), 0);
}

export function patchBattlePersistentPages(input, packs) {
  let html = input;
  const once = (from, to) => {
    if (html.split(from).length !== 2) throw new Error('Persistent atlas anchor: ' + from.slice(0, 100));
    html = html.replace(from, () => to);
  };
  const budget = persistentPageBudget(packs);
  if (!(budget > 0) || budget > 32 * 1024 * 1024) throw new Error('Persistent atlas window exceeds 32 MiB');
  const helpers = [atlasDecodedBytes, atlasDecodeScale, clipSource, downsampleDecodedAtlas, createDecodedAtlasCache]
    .map(fn => fn.toString()).join('\n');
  once('  const BATTLE_NATIVE_ATLAS_CACHE=', `  /* HV_BATTLE_PERSISTENT_PAGES_V1 */
  const __hvPersistentPages=(()=>{
    ${helpers}
    const cache=createDecodedAtlasCache({maxBytes:${budget},maxLoading:1});
    return (${createPersistentAtlasPages.toString()})({cache,packs:${JSON.stringify(packs)}});
  })();
  window.__HV_PERSISTENT_ATLASES=()=>__hvPersistentPages.inspect();
  window.addEventListener('pagehide',()=>__hvPersistentPages.clear(),{once:true});
  /* HV_BATTLE_PERSISTENT_PAGES_END */
  const BATTLE_NATIVE_ATLAS_CACHE=`);
  // Partition the existing normal native budget, rather than add another full
  // atlas budget. Authored action leases retain their existing temporary peak.
  once('maxBytes=__hvNativeLowMemoryIOS?64*1024*1024:128*1024*1024,',
    `maxBytes=(__hvNativeLowMemoryIOS?64*1024*1024:128*1024*1024)-${budget},`);
  once('function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){',
    `function drawLucAnhAtlas(context,key,frame,x,y,width,height,options={}){
    if(key==='idle')return __hvPersistentPages.draw(context,'luc-idle',frame,x,y,width,height,{baseline:46,...options,round:true});`);
  once('drawDinhLoiAtlasFrame(context,DINH_LOI_IMAGES[key],frame,0,0,620,348,{baseline:42})',
    `(key==='idle'?__hvPersistentPages.draw(context,'dinh-idle',frame,0,0,620,348,{baseline:42}):drawDinhLoiAtlasFrame(context,DINH_LOI_IMAGES[key],frame,0,0,620,348,{baseline:42}))`);
  once('    if(!guarded.length)return;\n    const image=DINH_LOI_IMAGES.skill1Shield;if(!image?.complete||image.naturalWidth<2)return;const frame=dinhLoiFrame(time,true);\n    for(const unit of guarded)drawDinhLoiAtlasFrame(context,image,frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82});',
    `    if(!guarded.length){__hvPersistentPages.release('dinh-shield');return;}
    const frame=dinhLoiFrame(time,true);
    for(const unit of guarded)__hvPersistentPages.draw(context,'dinh-shield',frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82});`);
  return html;
}

export async function installBattlePersistentPages(root) {
  const file = join(root, 'dist', 'battle.html'), html = readFileSync(file, 'utf8');
  const specs = battlePersistentSourceSpecs(html);
  const packs = await buildPreparationIdlePages(root, specs, {
    pageFrames: 8, outputBase: 'assets/characters/battle-persistent-v1', includePoster: false
  });
  for (const [id, pack] of Object.entries(packs)) Object.assign(pack, {
    frames: specs[id].frames, cellW: specs[id].cellW, cellH: specs[id].cellH
  });
  writeFileSync(file, patchBattlePersistentPages(html, packs));
  writeFileSync(join(root, 'dist', 'battle-persistent-packs.json'), JSON.stringify(packs));
  console.log('Battle persistent pages: full pixels, current/next window ' + persistentPageBudget(packs) + ' bytes.');
  return packs;
}
