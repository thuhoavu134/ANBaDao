// Legacy skills retain their shield floor and lifetime; the active engine owns
// shield/buff bans. Return actual added shield for presentation and reports.
export function settleLegacyShield(actor,target,minimum,{combat}={}){
 if(!actor||actor.hp<=0||!target||target.hp<=0)return 0;
 const requested=Math.max(0,Math.round(Number(minimum)||0));
 if(combat)return combat.shield(actor,target,requested,{floor:true});
 const before=Math.max(0,Number(target.shield)||0);
 target.shield=Math.max(before,requested);return target.shield-before;
}
