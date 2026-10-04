import{mixedStatView}from'./mixed-stat-view.mjs';
// Shared calculation at impact: previews use Core directly and never consume.
export function resolveLegacyHitDetail(actor,target,multiplier,options={},dependencies){
 const{Core,combat,rng}=dependencies;
 if(!target||target.hp<=0)return{amount:0,missed:false,critical:false,skipped:true};
 const hit=options.forceMiss?1:(options.forceHit||actor?._demoForceHit?0:rng('applyDamage.hit'));
 const variance=rng('applyDamage.variance');
 const criticalBlocked=combat?.hasStatus?.(target,'bubble')===true;
 const critRoll=options.forceCrit?0:rng('applyDamage.crit');
 const detail=Core.calculateDamageDetailed(mixedStatView(actor,combat),mixedStatView(target,combat),multiplier,{hit,variance,crit:criticalBlocked?1:critRoll});
 combat?.consumeHitAttempt(actor);
 return criticalBlocked?{...detail,criticalBlocked:true}:detail;
}
