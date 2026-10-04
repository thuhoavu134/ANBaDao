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
export function patchMixedHitAttempts(html){
 if(html.includes('/* HV_MIXED_HIT_ATTEMPT_V1 */'))return html;
 const anchor='    if(detail.missed){ target._lastDamageMissed=true;';
 if(html.split(anchor).length!==2)throw new Error('Mixed hit-attempt owner anchor missing');
 return html.replace(anchor,`    /* HV_MIXED_HIT_ATTEMPT_V1 */
    // Consume at impact after the current hit reads its modifiers. Previews
    // and rejected dead-target attempts never reach this boundary.
    if(typeof splusCombat==='function')splusCombat()?.consumeHitAttempt(actor);
`+anchor);
}
export function installMixedStatModifiers(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchMixedHitAttempts(patchMixedStatModifiers(readFileSync(p,'utf8'))));}
