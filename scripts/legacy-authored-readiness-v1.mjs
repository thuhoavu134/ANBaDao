import {readFileSync,writeFileSync} from 'node:fs';
import {createLegacyAuthoredReadiness} from '../src/combat-domain/legacy-authored-readiness.mjs';
const path='dist/battle.html';let html=readFileSync(path,'utf8');
const once=(from,to)=>{if(html.split(from).length!==2)throw new Error('LEGACY_READY_ANCHOR: '+from.slice(0,90));html=html.replace(from,()=>to);};
// Extend the current native atlas owner with action pins. Keep its normal
// memory cap. A native action working set may temporarily need more on iOS:
// Đình Lôi's three original 2x sheets total 94.92 MiB. No rescaling is added.
once('    const cost=clip=>',`    const pins=new Map(),leases=new Map();
    const budget=()=>Math.max(maxBytes,...leases.values());
    const retain=(keys,workingBytes)=>{
      const token=Symbol('authored-action');leases.set(token,workingBytes);
      for(const key of keys)pins.set(key,(pins.get(key)||0)+1);
      let released=false;return ()=>{if(released)return;released=true;leases.delete(token);for(const key of keys){const n=(pins.get(key)||1)-1;if(n)pins.set(key,n);else pins.delete(key);}evict(0);};
    };
    const cost=clip=>`);
once('while(bytes+need>maxBytes){const ready=[...entries.values()].filter(e=>!e.loading)',
  'while(bytes+need>budget()){const ready=[...entries.values()].filter(e=>!e.loading&&!pins.has(e.key))');
once('need>maxBytes||loading>=maxLoading','need>budget()||loading>=maxLoading');
once('return {ensure,release,clear,inspect};','return {ensure,release,clear,inspect,retain};');
once('return {bytes,maxBytes,loading,entries:','return {bytes,maxBytes:budget(),configuredMaxBytes:maxBytes,pinnedKeys:[...pins.keys()],loading,entries:');
const runtime=`
  // LEGACY_AUTHORED_READINESS_V1
  const __hvLegacyAuthored=(${createLegacyAuthoredReadiness.toString()})({
    cache:BATTLE_NATIVE_ATLAS_CACHE,sound:()=>window.HonVietSfx,enabled:()=>state.sound,
    describe:(actor,action)=>{
      if(isLucAnh(actor)){
        const keys=action==='ultimate'?['ultimate','ultimateVfx']:action==='skill'?['skill1','skill1Vfx']:['attack','basicProjectile','basicImpact'];
        return keys.map(key=>{const a=__hvLucAnhAsset(key),m=a.m,s=a.scale||1;return {key:'luc-anh:'+key,bytes:(a.mobile?.width||LUC_ANH_COLS*m.w*s)*(a.mobile?.height||Math.ceil(m.frames/LUC_ANH_COLS)*m.h*s)*4,image:()=>LUC_ANH_IMAGES[key]};});
      }
      if(isDinhLoi(actor)){
        const keys=action==='ultimate'?['ultimate','ultimateVfx','ultimateImpact']:action==='skill'?['skill1','skill1Wave','skill1Impact']:['attack','basicProjectile','basicImpact'];
        return keys.map(key=>({key:'dinh-loi:'+key,bytes:DINH_LOI_CLIPS[key].atlasWidth*DINH_LOI_CLIPS[key].atlasHeight*4,image:()=>DINH_LOI_IMAGES[key]}));
      }
      if(isOngPho(actor))return [{image:action==='ultimate'?ONG_PHO_ULTIMATE_IMAGE:action==='skill'?ONG_PHO_SKILL1_IMAGE:ONG_PHO_ATTACK_IMAGE}];
      return null;
    }
  });
`;
once('  async function __hvPerformAction3qAdapter(actor, action, target) {',runtime+'\n  async function __hvPerformAction3qAdapter(actor, action, target) {');
once('    let __hvActionAssets;','    let __hvActionAssets,__hvLegacyActionAssets;');
once('__hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);',`__hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);
      try{__hvLegacyActionAssets=await __hvLegacyAuthored.prepare(actor,action,__hvActionAssets.signal);}
      catch(error){__hvActionAssets.release();throw error;}`);
once('      if(isThayMoAuthored(actor))finishThayMoAuthoredAction(actor);','      __hvLegacyActionAssets?.release();\n      if(isThayMoAuthored(actor))finishThayMoAuthoredAction(actor);');
writeFileSync(path,html);
