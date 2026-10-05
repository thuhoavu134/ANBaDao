// Keep legacy actor-turn effects separate from managed round-based effects.
export function settleLegacyStatusRemoval(target,types,{combat,count=Infinity,managedPolarity,selectedStatus}={}){
 if(!target||target.hp<=0)return [];
 const aliases={atkDown:'attackDown',defDown:'armorDown',armorBreak:'armorDown',atkUp:'attackUp',defUp:'armorUp'};
 const wanted=new Set(types),managedTypes=new Set(types.map(type=>aliases[type]||type));
 const selected=(target.statuses||[]).filter(s=>selectedStatus?s===selectedStatus:s.splus?(managedPolarity?s.polarity===managedPolarity:wanted.has(s.type)||managedTypes.has(s.type)):wanted.has(s.type)).slice(0,Math.max(0,Math.floor(count)));
 const removed=combat?combat.cleanse(target,Infinity,s=>selected.includes(s)):selected.filter(s=>s.splus);
 const legacy=selected.filter(s=>!s.splus);
 target.statuses=(target.statuses||[]).filter(s=>!legacy.includes(s)&&(combat||!removed.includes(s)));
 return selected.filter(s=>legacy.includes(s)||removed.includes(s));
}
