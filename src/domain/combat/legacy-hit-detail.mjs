import{mixedStatView}from'./mixed-stat-view.mjs';
// Shared calculation at impact: previews use Core directly and never consume.
export function resolveLegacyHitDetail(actor,target,multiplier,options={},dependencies){
 const{Core,combat,rng}=dependencies;
 if(!target||target.hp<=0)return{amount:0,missed:false,critical:false,skipped:true};
 const hit=options.forceMiss?1:(options.forceHit||actor?._demoForceHit?0:rng('applyDamage.hit'));
 const detail=Core.calculateDamageDetailed(mixedStatView(actor,combat),mixedStatView(target,combat),multiplier,{hit,variance:rng('applyDamage.variance'),crit:options.forceCrit?0:rng('applyDamage.crit')});
 combat?.consumeHitAttempt(actor);
 return detail;
}
