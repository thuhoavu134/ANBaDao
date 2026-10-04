// Legacy formula owns outgoing raw damage. The active S+ engine owns received
// damage, shields, prevention and reactions; legacy adapter presents primary hit.
export function settleLegacyDamage(actor,target,raw,{combat,action='basic',critical=false}={}){
 if(!target||target.hp<=0)return{amount:0,shieldAbsorbed:0,engineOwned:!!combat,blocked:false};
 if(combat){
  const start=combat.events.length,melee=['guardian','striker','duelist'].includes(actor?.archetype),type=['guardian','striker','duelist','ranger'].includes(actor?.archetype)?'physical':'elemental';
  const amount=combat.damage(actor,target,{raw,action,critical,melee,type,legacyImpact:true});
  const events=combat.events.slice(start),shieldAbsorbed=events.filter(e=>e.type==='shieldAbsorb'&&e.sourceId===actor.id&&e.targetId===target.id).reduce((sum,e)=>sum+e.amount,0);
  const block=events.find(e=>(['immune','blockedHit'].includes(e.type)&&e.targetId===target.id)||(e.type==='basicReflected'&&e.sourceId===target.id&&e.targetId===actor.id));
  return{amount,shieldAbsorbed,engineOwned:true,blocked:!!block,blockReason:block?.type};
 }
 let amount=Math.max(0,raw),shieldAbsorbed=0;
 if(target.shield>0){shieldAbsorbed=Math.min(target.shield,amount);target.shield-=shieldAbsorbed;amount-=shieldAbsorbed;}
 amount=Math.min(target.hp,amount);target.hp-=amount;
 return{amount,shieldAbsorbed,engineOwned:false,blocked:false};
}
