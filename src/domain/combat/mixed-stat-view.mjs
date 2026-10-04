// Read-only projection for the legacy damage formula in mixed battles.
export function mixedStatView(unit,combat){
 if(!combat||!unit)return unit;
 const modifiers=combat.modifiers(unit);
 const statTypes=new Set(['atkUp','atkDown','defUp','defDown','armorBreak','speedUp','speedDown','accuracyUp','accuracyDown','evasionUp','evasionDown']);
 return {...unit,accuracy:combat.stat(unit,'accuracy'),evasion:combat.stat(unit,'evasion'),crit:Math.max(0,Number(unit.crit||0)+modifiers.crit*100),critDamage:Math.max(1,Number(unit.critDamage||1.55)+modifiers.critDamage),atk:combat.stat(unit,'atk'),def:combat.stat(unit,'def'),speed:combat.stat(unit,'speed'),
   statuses:(unit.statuses||[]).filter(s=>!statTypes.has(s.type)&&!(s.splus&&['critUp','critDown'].includes(s.type)))};
}
