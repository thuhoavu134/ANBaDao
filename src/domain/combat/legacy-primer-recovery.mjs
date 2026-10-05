// Each owner keeps its own duration, source and refresh semantics.
export function restoreLegacyPrimer(target,snapshot,{combat,force=false,addLegacyStatus}={}){
 if(!target||target.hp<=0||!snapshot?.type)return null;
 if(snapshot.splus)return combat?.restoreStatus(target,snapshot,{force})||null;
 const effect={...snapshot,turns:force?1:Math.max(1,Number(snapshot.turns)||1)};
 if(force)effect.power=Math.max(1,Math.round((Number(snapshot.power)||1)*.5));
 if(effect.type==='regen'&&combat?.hasStatus(target,'buffBan'))return null;
 addLegacyStatus(target,effect);
 return (target.statuses||[]).find(s=>!s.splus&&s.type===effect.type)||null;
}
