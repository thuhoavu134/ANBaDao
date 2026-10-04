// Read-only projection for the legacy damage formula in mixed battles.
export function mixedStatView(unit,combat){
 if(!combat||!unit)return unit;
 const statTypes=new Set(['atkUp','atkDown','defUp','defDown','armorBreak','speedUp','speedDown']);
 return {...unit,atk:combat.stat(unit,'atk'),def:combat.stat(unit,'def'),speed:combat.stat(unit,'speed'),
   statuses:(unit.statuses||[]).filter(s=>!statTypes.has(s.type))};
}
