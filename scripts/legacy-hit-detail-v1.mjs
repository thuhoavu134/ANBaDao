import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';import{resolveLegacyHitDetail}from'../src/domain/combat/legacy-hit-detail.mjs';
export function patchLegacyHitDetail(html){
 if(html.includes('/* HV_LEGACY_HIT_DETAIL_V1 */'))return html;
 const owner='  function __hvApplyDamage3qAdapter(actor, target, multiplier, options = {}) {',start=html.indexOf(owner),a=html.indexOf('    const hitRoll = options.forceMiss',start),b=html.indexOf('    if(detail.missed)',a);
 if(start<0||a<0||b<0||!html.includes('/* HV_MIXED_HIT_ATTEMPT_V1 */')||!html.includes('function mixedStatView('))throw new Error('Legacy hit-detail owner/dependency anchor missing');
 const calculation='    const detail=resolveLegacyHitDetail(actor,target,multiplier,options,{Core:LegacyCore,combat:typeof splusCombat===\'function\'?splusCombat():null,rng:__hvRuleRandom3qAdapter});\n';
 return html.slice(0,start)+'/* HV_LEGACY_HIT_DETAIL_V1 */\n'+resolveLegacyHitDetail.toString()+'\n'+html.slice(start,a)+calculation+html.slice(b);
}
export function installLegacyHitDetail(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchLegacyHitDetail(readFileSync(p,'utf8')));}
