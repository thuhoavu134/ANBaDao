// Core selects reactions; each status owner applies its own lifetime/removal rules.
export function legacyReactionEffects(combat,grantLegacyStatus){
 const aliases={armorBreak:'armorDown',atkDown:'attackDown'};
 return{
  matchesPrimer:(s,type)=>s?.type===type||Boolean(s?.splus&&s.type===aliases[type]),
  isActive:(target,s,reaction)=>!s.splus||Boolean(combat&&(s.expiresRound==null||s.expiresRound>combat.round)&&(s.charges==null||s.charges>0)&&(reaction.mode!=='consume-burst'||s.ticksLeft>0)&&(!reaction.mode.startsWith('extend')||s.polarity!=='buff'||!combat.hasStatus(target,'buffBan'))),
  storedDamage:(target,s)=>s.splus?combat.storedDotDamage(target,s):Math.max(0,Number(s.power)||0)*Math.max(1,Number(s.turns)||1),
  removeStatus:(target,s)=>{if(s.splus)return Boolean(combat?.cleanse(target,1,x=>x===s).length);const idx=target.statuses.indexOf(s);if(idx<0)return false;target.statuses.splice(idx,1);return true;},
  extendStatus:(target,s,maxTurns)=>{if(s.splus)return combat?.extendStatus(target,s,maxTurns)||false;s.turns=Math.min(maxTurns,Math.max(1,Number(s.turns)||1)+1);return true;},
  grantStatus:grantLegacyStatus
 };
}
