// Legacy skills retain their shield floor and lifetime; the active engine owns
// shield/buff bans. Return actual added shield for presentation and reports.
export function settleLegacyShield(actor,target,minimum,{combat}={}){
 if(!actor||actor.hp<=0||!target||target.hp<=0)return 0;
 const requested=Math.max(0,Math.round(Number(minimum)||0));
 if(combat)return combat.shield(actor,target,requested,{floor:true});
 const before=Math.max(0,Number(target.shield)||0);
 target.shield=Math.max(before,requested);return target.shield-before;
}
// Recovery can remove only the currently remaining unlayered shield pool.
// Native layer balances must stay intact for absorption and expiry accounting.
export function rollbackLegacyShieldGrant(target,amount,{minimum=0}={}){
 if(!target||target.hp<=0)return 0;
 const current=Math.max(0,Number(target.shield)||0);
 const layered=(target.statuses||[]).filter(s=>s.splus).reduce((sum,s)=>sum+Math.max(0,Number(s.shieldRemaining)||0),0);
 const removed=Math.min(Math.max(0,Math.round(Number(amount)||0)),Math.max(0,current-layered),Math.max(0,current-(Number(minimum)||0)));
 target.shield=current-removed;return removed;
}
