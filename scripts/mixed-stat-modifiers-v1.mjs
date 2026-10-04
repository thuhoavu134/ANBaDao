import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';import{mixedStatView}from'../src/domain/combat/mixed-stat-view.mjs';
export function patchMixedStatModifiers(html){if(html.includes('/* HV_MIXED_STAT_VIEW_V1 */'))return html;
 const a='  const LegacyCore=globalThis.HonVietCore;',b='  const Core={...LegacyCore,';
 if(html.split(a).length!==2||html.split(b).length!==2)throw new Error('Mixed stat owner anchor missing');
 return html.replace(a,'/* HV_MIXED_STAT_VIEW_V1 */\n'+mixedStatView.toString()+'\n'+a).replace(b,b+`
    calculateDamageDetailed:(actor,target,multiplier,rolls)=>{
      const combat=splusCombat();
      return LegacyCore.calculateDamageDetailed(mixedStatView(actor,combat),mixedStatView(target,combat),multiplier,rolls);
    },
    effectiveStat:(unit,name)=>splusCombat()&&['atk','def','speed'].includes(name)?splusCombat().stat(unit,name):LegacyCore.effectiveStat(unit,name),`);
}
export function installMixedStatModifiers(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchMixedStatModifiers(readFileSync(p,'utf8')));}
