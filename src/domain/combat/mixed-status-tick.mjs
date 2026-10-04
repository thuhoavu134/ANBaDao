// The scheduler calls this once per actor turn. S+ retains its round clock.
export function tickMixedStatuses(unit,legacyCore,combat){
 if(!combat)return legacyCore.tickStatuses(unit);
 const legacyControl=(unit.statuses||[]).some(s=>!s.splus&&['stun','fear','freeze','sleep','paralysis','timeFreeze','stasis'].includes(s.type));
 const periodic=new Set(['regen','burn','bleed','poison']);
 for(const status of (unit.statuses||[]).filter(s=>!s.splus&&periodic.has(s.type))){
  if(unit.hp<=0)break;
  if(!(unit.statuses||[]).includes(status))continue;
  if(status.type==='regen')combat.heal(unit,unit,status.power||45);
  else combat.damage(combat.unit(status.sourceId)||unit,unit,{raw:status.power||({burn:35,bleed:28,poison:24}[status.type]),type:'true',dot:true,secondary:true,noTriggers:true});
 }
 // Use the legacy owner for duration/control semantics, suppressing periodic
 // HP changes already handled by S+. Keep managed effects on their round clock.
 const current=unit.statuses||[],managed=current.filter(s=>s.splus);
 const shadow={...unit,statuses:current.filter(s=>!s.splus).map(s=>periodic.has(s.type)?{...s,type:'__hv_periodic',__hvOriginalType:s.type}:s)};
 const events=legacyCore.tickStatuses(shadow);
 unit.statuses=shadow.statuses.map(s=>{if(!s.__hvOriginalType)return s;const restored={...s,type:s.__hvOriginalType};delete restored.__hvOriginalType;return restored;}).concat(managed);
 if((legacyControl||!['basic','skill','ultimate'].some(a=>combat.canUse(unit,a)))&&!events.some(e=>e.type==='control'))events.push({type:'control'});
 return events;
}
