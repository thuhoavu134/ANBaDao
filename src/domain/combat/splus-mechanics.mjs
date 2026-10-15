import { SPLUS_HEROES, SPLUS_EXTRA_HEROES, SPLUS_REVIEW_DEFAULTS } from '../hero/splus-catalog.mjs';

export function createSplusCombat(options={}) {
  return createSplusMechanics({...options,catalog:options.catalog||[...SPLUS_HEROES,...SPLUS_EXTRA_HEROES],defaults:SPLUS_REVIEW_DEFAULTS});
}

/** S+ effect owner. No DOM, storage, timers, audio or action scheduler.
 * Browser and tests execute this same factory. Randomness is injected by the
 * existing session RNG; the host owns animation and when a round/action runs.
 */
export function createSplusMechanics(options={}) {
  const catalog=new Map((options.catalog||[]).map(h=>[h.id,h]));
  const defaults={skillCooldown:2,skillCost:25,ultimateCost:60,basicRage:15,duration:2,markDuration:3,skillMultiplier:1.4,singleUltimateMultiplier:2.4,aoeUltimateMultiplier:1.2,...options.defaults};
  const copy=v=>JSON.parse(JSON.stringify(v));
  const units=options.mutate===true?options.units:copy(options.units||[]);
  const events=[],zones=[];let round=1,started=false,eventDepth=0,actionSerial=0,currentAction=null,preparedTurn=null;
  const rng=options.rng||(()=>{throw new Error('SPLUS_SEEDED_RNG_REQUIRED');});
  const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const key=u=>String(u?.sourceId||u?.id||'').replace(/^hero_splus_/,'');
  const unit=id=>typeof id==='object'?id:units.find(u=>u.id===id)||null;
  const def=u=>catalog.get(u?.sourceId||u?.id);
  const rules=(u,slot='passive')=>(slot==='passive'?def(u)?.passive:def(u)?.actions?.[slot])?.rules||{};
  const melee=u=>['guardian','striker','duelist'].includes(def(u)?.role);
  const alive=u=>Boolean(u&&u.hp>0&&!u.dead);
  const bySlot=(a,b)=>a.slot-b.slot||String(a.id).localeCompare(String(b.id),'en');
  const ratio=u=>u.hp/Math.max(1,u.maxHp);
  const friends=u=>units.filter(v=>alive(v)&&v.team===u.team).sort(bySlot);
  const foes=u=>units.filter(v=>alive(v)&&v.team!==u.team).sort(bySlot);
  const front=list=>list.filter(u=>u.slot<3);
  const back=list=>list.filter(u=>u.slot>=3);
  const weakest=list=>list.slice().sort((a,b)=>ratio(a)-ratio(b)||bySlot(a,b));
  const strongest=list=>list.slice().sort((a,b)=>stat(b,'atk')-stat(a,'atk')||bySlot(a,b));
  const tankiest=list=>list.slice().sort((a,b)=>b.maxHp-a.maxHp||bySlot(a,b));
  const near=(a,b)=>Math.abs(a.slot%3-b.slot%3)+Math.abs(Math.floor(a.slot/3)-Math.floor(b.slot/3));
  const adjacent=(target,list)=>list.filter(v=>v!==target&&near(target,v)===1).sort(bySlot);
  const opposite=(actor,list)=>{const first=front(list),column=(first.length?first:list).slice().sort(bySlot);return column.find(v=>v.slot%3===actor.slot%3)||column[0];};
  const weakestBack=list=>weakest(back(list).length?back(list):list)[0];
  const strongestBack=list=>strongest(back(list).length?back(list):list)[0];
  const enraged=list=>list.slice().sort((a,b)=>b.energy-a.energy||bySlot(a,b));
  const enragedBack=list=>enraged(back(list).length?back(list):list)[0];
  const random=list=>{const result=list.slice();for(let i=result.length-1;i>0;i--){const j=Math.min(i,Math.floor(clamp(rng('splus.targets'),0,0.999999999)*(i+1)));[result[i],result[j]]=[result[j],result[i]];}return result;};
  const hardCC=new Set(['stun','sleep','paralysis','timeFreeze','stasis']);
  const control=new Set([...hardCC,'root','disarm','silence','hardSilence','confusion','entangle']);
  const harmful=new Set([...control,'healDown','antiHeal','armorDown','magicArmorDown','attackDown','speedDown','moveSlow','blind','rageSlow','rageBan','shieldBan','buffBan','stealthBan','noExtraTurn','coldSteel','bloodDebt','resinBleed','resinPoison','viperPoison','parasite','ink','burn','poison','bleed','brimstone','thornsDot','wound','damageDown','critDown','resistDown','cooldownDelay','actionSlow']);
  const dots=new Set(['burn','poison','bleed','brimstone','thornsDot','parasite','resinBleed','viperPoison','wound']);
  const isBurn=s=>s.type==='burn'||s.type==='brimstone';
  const active=s=>s.splus===true&&(s.expiresRound==null||s.expiresRound>round)&&(s.charges==null||s.charges>0);
  const statuses=u=>(u?.statuses||[]).filter(active);
  const has=(u,type)=>statuses(u).some(s=>s.type===type);
  const status=(u,type)=>statuses(u).find(s=>s.type===type);
  const power=(u,type)=>Math.max(0,...statuses(u).filter(s=>s.type===type).map(s=>n(s.power)*n(s.stacks,1)));
  const legacyEffects=u=>(u?.statuses||[]).filter(s=>!s.splus);
  const legacyControl=u=>legacyEffects(u).some(s=>['stun','fear','freeze','sleep','paralysis','timeFreeze','stasis'].includes(s.type));
  const legacyStat=(u,name,base)=>base*Math.max(.2,1+legacyEffects(u).reduce((sum,s)=>sum+(s.type===name+'Up'?n(s.power):s.type===name+'Down'?-n(s.power):0),0));
  const passive=u=>alive(u)&&!has(u,'timeFreeze');
  const holders=(u,name,enemy=false)=>(enemy?foes(u):friends(u)).filter(v=>key(v)===name&&passive(v));
  const emit=(type,source,target,extra={})=>{
    const entry={sequence:events.length+1,type,round,actionId:currentAction?.id||null,sourceId:source?.id||null,targetId:target?.id||null,...extra};
    events.push(entry);options.onEvent?.(entry);return entry;
  };
  for(const u of units){
    u.statuses=Array.isArray(u.statuses)?u.statuses:[];u.maxHp=Math.max(1,n(u.maxHp,u.hp||1));
    u.hp=clamp(n(u.hp,u.maxHp),0,u.maxHp);u.energy=clamp(n(u.energy),0,100);u.shield=Math.max(0,n(u.shield));
    u.splus={memory:{},cooldowns:{},lastActRound:0,...u.splus};
  }
  function addStatus(sourceId,targetId,effect={}) {
    const source=unit(sourceId),target=unit(targetId);if(!alive(target))return null;
    const type=String(effect.type||'');if(!type)throw new Error('STATUS_TYPE_REQUIRED');
    if(!harmful.has(type)&&effect.polarity!=='debuff'&&has(target,'buffBan')){emit('buffBlocked',source,target,{effect:type});return null;}
    if(type==='stealth'&&has(target,'stealthBan')){emit('immune',source,target,{effect:type});return null;}
    if(['bleed','resinBleed','thornsDot','wound'].includes(type)&&has(target,'bubble')){emit('immune',source,target,{effect:type});return null;}
    if(control.has(type)){
      if(has(target,'controlImmune')||(hardCC.has(type)&&has(target,'hardControlImmune'))){emit('immune',source,target,{effect:type});return null;}
      const ward=status(target,'ccReflect');
      if(ward&&!effect.reflected&&source&&source.team!==target.team){
        ward.charges--;
        if(rng('splus.control-reflect')<n(ward.chance,.35)){emit('controlReflect',target,source,{effect:type,iconId:ward.iconId});
          return addStatus(target,source,{...effect,reflected:true,sourceHeroId:ward.sourceHeroId,iconId:ward.iconId});}
      }
      const resistance=clamp(n(target.effectResist)+modifiers(target).resist+(type==='stun'&&key(target)==='giang_quan'&&target.slot<3&&passive(target)?0.2:0));
      if(resistance>0&&rng('splus.resistance')<resistance){emit('resist',source,target,{effect:type});return null;}
    }
    const same=statuses(target).find(s=>s.type===type&&s.sourceId===(source?.id||null));
    const turns=effect.turns===null?null:Math.max(1,n(effect.turns,defaults.duration));
    const expiresRound=turns==null?null:round+turns+(target.splus.lastActRound===round?1:0);
    const entry={...effect,type,splus:true,polarity:effect.polarity||(harmful.has(type)?'debuff':'buff'),sourceId:source?.id||null,sourceHeroId:effect.sourceHeroId||source?.sourceId||null,iconId:effect.iconId||def(source)?.iconId||null,stacks:Math.min(n(effect.maxStacks,1),n(effect.stacks,1)+(effect.stack?same?.stacks||0:0)),maxStacks:n(effect.maxStacks,1),turns,expiresRound,appliedRound:round,ticksLeft:turns};
    if(same)Object.assign(same,entry);else target.statuses.push(entry);
    if(key(target)==='cuu_trieu'&&['silence','hardSilence','stun'].includes(type))target.splus.memory.cadence=Math.floor(n(target.splus.memory.cadence)/2);
    if(type==='stealthBan')remove(target,s=>s.type==='stealth','revealed');
    emit('status',source,target,{effect:type,stacks:entry.stacks,iconId:entry.iconId});return same||entry;
  }
  function remove(targetId,predicate,reason='dispel') {
    const target=unit(targetId);if(!target)return [];
    const removed=target.statuses.filter(s=>s.splus&&predicate(s));
    target.statuses=target.statuses.filter(s=>!removed.includes(s));
    for(const s of removed){if(s.shieldRemaining>0)target.shield=Math.max(0,target.shield-s.shieldRemaining);emit('statusRemove',unit(s.sourceId),target,{effect:s.type,reason,iconId:s.iconId});}
    return removed;
  }
  function cleanse(targetId,count=Infinity,filter=s=>s.polarity==='debuff') {
    let used=0;return remove(targetId,s=>filter(s)&&used++<count,'cleanse');
  }
  // Recovery restores a removed native effect, not a fresh duration or DOT budget.
  function restoreStatus(targetId,snapshot,{force=false}={}) {
    const target=unit(targetId);
    if(!alive(target)||!snapshot?.splus||!snapshot.type)return null;
    if(snapshot.expiresRound!=null&&snapshot.expiresRound<=round)return null;
    if(snapshot.charges!=null&&snapshot.charges<=0)return null;
    const existing=statuses(target).find(s=>s.type===snapshot.type&&s.sourceId===snapshot.sourceId);
    if(existing)return existing;
    const effect={...snapshot};
    if(force){effect.turns=1;effect.power=Math.max(1,Math.round((n(snapshot.power)||1)*.5));}
    const restored=addStatus(unit(snapshot.sourceId),target,effect);
    if(!restored)return null;
    restored.expiresRound=force?Math.min(snapshot.expiresRound??Infinity,round+1):snapshot.expiresRound;
    restored.appliedRound=snapshot.appliedRound;
    restored.ticksLeft=force?Math.min(n(snapshot.ticksLeft,1),1):snapshot.ticksLeft;
    return restored;
  }
  function extendStatus(targetId,entry,maxTurns=3){
    const target=unit(targetId);
    if(!alive(target)||!target.statuses.includes(entry)||!active(entry))return false;
    if(entry.polarity==='buff'&&has(target,'buffBan')){emit('buffBlocked',unit(entry.sourceId),target,{effect:entry.type});return false;}
    if(entry.expiresRound==null)return true;
    const remaining=entry.expiresRound-round,added=Math.max(0,Math.min(1,n(maxTurns,3)-remaining));
    if(added>0){entry.expiresRound+=added;entry.turns=n(entry.turns)+added;if(entry.ticksLeft!=null)entry.ticksLeft=n(entry.ticksLeft)+added;emit('statusExtend',unit(entry.sourceId),target,{effect:entry.type,added,expiresRound:entry.expiresRound});}
    return true;
  }
  function storedDotDamage(targetId,entry){
    const target=unit(targetId);
    return alive(target)&&target.statuses.includes(entry)&&active(entry)&&dots.has(entry.type)?dotAmount(target,entry,Math.max(0,n(entry.ticksLeft))):0;
  }
  const buff=(a,t,type,powerValue=0,turns=defaults.duration,extra={})=>addStatus(a,t,{type,power:powerValue,turns,...extra});
  const mark=(a,t,type,powerValue,extra={})=>buff(a,t,type,powerValue,defaults.markDuration,extra);
  function modifiers(targetId) {
    const u=unit(targetId);const m={attack:0,defense:0,magicDefense:0,speed:0,crit:0,critDamage:0,resist:0,lifesteal:0,mitigation:0};
    if(!u)return m;
    m.attack=power(u,'attackUp')-power(u,'attackDown');m.defense=power(u,'armorUp')-power(u,'armorDown');
    // Legacy effects keep their actor-turn lifetime but share stat semantics.
    const legacy=(u.statuses||[]).filter(s=>!s.splus);
    const legacyPower=type=>legacy.filter(s=>s.type===type).reduce((sum,s)=>sum+n(s.power),0);
    m.attack+=legacyPower('atkUp')-legacyPower('atkDown');
    const legacyArmor=legacyPower('defUp')-legacyPower('defDown')-(legacy.some(s=>s.type==='armorBreak') ? 0.32 : 0);
    m.defense+=legacyArmor;

    m.speed=power(u,'speedUp')-power(u,'speedDown')-power(u,'actionSlow');m.crit=power(u,'critUp')-power(u,'critDown');m.resist=power(u,'resistUp')-power(u,'resistDown');
    m.lifesteal=power(u,'lifesteal');m.mitigation=power(u,'mitigation');
    m.speed+=legacyPower('speedUp')-legacyPower('speedDown');
    m.magicDefense=power(u,'magicArmorUp')-power(u,'magicArmorDown');m.magicDefense+=legacyArmor;m.speed-=power(u,'coldSteel');m.crit-=statuses(u).filter(s=>s.type==='coldSteel').reduce((v,s)=>v+s.stacks*.04,0);
    m.critDamage+=power(u,'critDamage');
    if(has(u,'joyMask'))m.crit+=n(status(u,'joyMask').power,.25);
    if(has(u,'rageMask')){const rage=status(u,'rageMask');m.critDamage+=n(rage.power,.3);m.lifesteal+=n(rage.lifesteal,.15);}
    if(has(u,'resinPoison'))m.defense-=0.3;
    if(has(u,'ink'))m.resist-=0.2;
    for(const source of holders(u,'co_trong'))m.defense+=Math.min(10,n(source.splus.memory.gears))*rules(source).armorPerStack;
    if(passive(u)){
      if(key(u)==='lac_an'){const stacks=Math.min(8,n(u.splus.memory.focus));m.crit+=stacks*rules(u).crit;m.critDamage+=stacks*rules(u).critDamage;}
      if(key(u)==='hac_pha'&&ratio(u)<0.5){m.speed+=rules(u).speed;m.lifesteal+=rules(u).lifesteal;}
      if(key(u)==='cuu_trieu'){const stacks=n(u.splus.memory.cadence);m.attack+=stacks*rules(u).attack;m.crit+=stacks*rules(u).crit;}
      if(key(u)==='thach_mong')m.mitigation=Math.max(m.mitigation,0.35);
      if(key(u)==='tram_chau')m.defense+=Math.min(5,n(u.splus.memory.pearlArmor))*rules(u).armor;
      if(key(u)==='thach_kinh')m.magicDefense+=n(u.splus.memory.resentment)*rules(u).magicArmor;
    }
    return m;
  }
  function stat(targetId,name) {const u=unit(targetId),m=modifiers(u);if(name==='accuracy')return Math.max(0,legacyStat(u,name,n(u?.accuracy,100))-power(u,'blind')*100);if(name==='evasion')return Math.max(0,legacyStat(u,name,n(u?.evasion))); return Math.max(0,n(u?.[name])*(1+(name==='atk'?m.attack:name==='def'?m.defense:name==='speed'?m.speed:0)));}
  function energy(sourceId,targetId,amount,reason='gain') {
    const source=unit(sourceId),target=unit(targetId);if(!alive(target))return 0;
    if(amount>0&&(has(target,'rageBan')||has(target,'timeFreeze'))){emit('energyBlocked',source,target,{reason});return 0;}
    const before=target.energy,delta=amount>0?amount*Math.max(0,1-power(target,'rageSlow')+power(target,'rageRate')):amount;
    target.energy=clamp(before+delta,0,100);emit('energy',source,target,{amount:target.energy-before,reason});return target.energy-before;
  }
  function siphon(source,target,amount) {const removed=-energy(source,target,-Math.min(target?.energy||0,amount),'siphon');energy(source,source,removed,'siphon');return removed;}
  function shield(sourceId,targetId,amount,extra={}) {
    const source=unit(sourceId),target=unit(targetId);if(!alive(target))return 0;
    if(has(target,'shieldBan')){emit('shieldBlocked',source,target);return 0;}
    const value=Math.max(0,Math.round(amount));
    // Reserve protection raises the unlayered shield floor, retaining its
    // original non-stacking, non-expiring semantics under engine bans.
    if(extra.floor){
      if(has(target,'buffBan')){emit('buffBlocked',source,target,{effect:'shieldLayer'});return 0;}
      const added=Math.max(0,value-target.shield);target.shield+=added;
      if(added>0)emit('shield',source,target,{amount:added,iconId:def(source)?.iconId||null});
      return added;
    }
    const type=extra.explodes?'waterShield':extra.bubble?'bubble':'shieldLayer';
    const previous=statuses(target).find(s=>s.type===type&&s.sourceId===source?.id);
    const layer=buff(source,target,type,extra.explosionPower||0.5,extra.turns??defaults.duration,{shieldRemaining:value+n(previous?.shieldRemaining)});
    if(!layer)return 0;target.shield+=value;
    emit('shield',source,target,{amount:value,iconId:def(source)?.iconId||null});return value;
  }
  function breakShield(source,target) {
    if(!target)return;const lost=target.shield;const layers=statuses(target).filter(s=>s.shieldRemaining!=null);target.shield=0;emit('shieldBreak',source,target,{amount:lost});
    for(const layer of layers){layer.shieldRemaining=0;remove(target,s=>s===layer,'shield-broken');if(layer.type==='waterShield')waterExplosion(layer,source,target);}
  }
  function waterExplosion(layer,attacker,target){const caster=unit(layer.sourceId)||target;const list=alive(attacker)?[attacker,...adjacent(attacker,foes(caster))]:foes(caster);for(const t of list.slice(0,2))damage(caster,t,{multiplier:layer.power,secondary:true,noTriggers:true});}
  function absorbShield(source,target,amount){const value=Math.min(target.shield,amount),layers=statuses(target).filter(s=>s.shieldRemaining!=null);let left=Math.max(0,value-Math.max(0,target.shield-layers.reduce((v,s)=>v+s.shieldRemaining,0)));target.shield-=value;
    for(const layer of layers){const used=Math.min(left,layer.shieldRemaining);layer.shieldRemaining-=used;left-=used;if(layer.shieldRemaining<=0){remove(target,s=>s===layer,'shield-broken');if(layer.type==='waterShield')waterExplosion(layer,source,target);}}
    emit('shieldAbsorb',source,target,{amount:value});return value;
  }
  function heal(sourceId,targetId,amount,extra={}) {
    const source=unit(sourceId),target=unit(targetId);if(!alive(target)||!(amount>0))return 0;
    const anti=Math.max(power(target,'antiHeal'),power(target,'healDown'),has(target,'wound')?0.8:0,zones.some(z=>z.team===target.team&&z.slot===target.slot&&z.expiresRound>round)?0.25:0);
    const permitted=Math.max(0,Math.round(amount*(1-clamp(anti))));
    const converted=source!==target&&has(target,'wound')?Math.round(permitted*0.5):0;
    const actual=Math.min(target.maxHp-target.hp,permitted-converted);target.hp+=actual;
    emit('heal',source,target,{amount:actual,requested:amount,blocked:Math.round(amount-permitted),iconId:def(source)?.iconId||null,...(extra.legacyImpact?{legacyImpact:true}:{})});
    if(source&&key(source)==='thiem_ngan'&&passive(source)){
      buff(source,target,'armorUp',0.1);const over=permitted-converted-actual;if(over>0)shield(source,target,over);
    }
    if(source&&key(source)==='tue_y'&&passive(source)&&actual>0)cleanse(target,1,s=>dots.has(s.type)&&s.type!=='parasite');
    if(converted>0)damage(unit(status(target,'wound')?.sourceId)||source,target,{raw:converted,type:'true',secondary:true,noTriggers:true,bypassShield:true});
    return actual;
  }
  function preventDeath(target,source) {
    if(has(target,'immortal')){target.hp=1;emit('deathPrevented',unit(status(target,'immortal').sourceId),target);return true;}
    const silver=status(target,'deathWard');
    if(silver){silver.charges=0;target.hp=1;heal(unit(silver.sourceId),target,target.maxHp*0.2);emit('deathPrevented',unit(silver.sourceId),target,{iconId:silver.iconId});return true;}
    const guardian=holders(target,'muc_chieu').find(u=>!u.splus.memory.rescueUsed);
    if(guardian){guardian.splus.memory.rescueUsed=true;target.hp=1;buff(guardian,target,'immortal',0,1);heal(guardian,target,target.maxHp*0.15);emit('deathPrevented',guardian,target,{iconId:def(guardian)?.iconId});return true;}
    if(key(target)==='cuu_trieu'&&!has(target,'hardSilence')&&!target.splus.memory.rescueUsed&&!has(target,'silence')&&!statuses(target).some(s=>hardCC.has(s.type))){
      target.splus.memory.rescueUsed=true;target.hp=1;buff(target,target,'damageImmune',0,1);heal(target,target,target.maxHp*0.35);emit('deathPrevented',target,target,{iconId:def(target)?.iconId});return true;
    }
    return false;
  }
  function rescueLow(target) {
    if(!alive(target)||ratio(target)>=0.3)return;
    for(const healer of holders(target,'tue_y')){
      if(n(healer.splus.memory.rescueReady)>round)continue;
      healer.splus.memory.rescueReady=round+2;heal(healer,target,target.maxHp*0.25);buff(healer,target,'controlImmune',0,1);break;
    }
  }
  function consumeHitAttempt(sourceId) {
    const blind=status(unit(sourceId),'blind');
    if(blind?.charges!=null)blind.charges=Math.max(0,blind.charges-1);
  }
  function damage(sourceId,targetId,options={}) {
    const source=unit(sourceId),target=unit(targetId);if(!source||!alive(target)||eventDepth>20)return 0;
    if(has(target,'damageImmune')){emit('immune',source,target,{effect:'damage'});return 0;}
    const previousAction=currentAction;eventDepth++;
    try {
      const action=options.action||currentAction?.action||'basic',sm=modifiers(source),tm=modifiers(target);
      const targetRatio=ratio(target);const specifiedRaw=options.raw!=null;let critical=Boolean(options.critical||options.forceCrit);
      let type=options.type||(['ranger','striker','duelist','guardian'].includes(def(source)?.role)?'physical':'elemental');
      if(key(source)==='cuu_trieu'&&passive(source)&&source.splus.memory.cadence>=8)type='true';
      let amount=Math.max(0,n(options.raw));
      if(!specifiedRaw){
        const accuracy=clamp(stat(source,'accuracy')/100-stat(target,'evasion')/100,0,1);
        consumeHitAttempt(source);
        if(!options.forceHit&&rng('splus.hit')>=accuracy){emit('miss',source,target,{action});if(key(target)==='bach_dien')swapBachDienMask(target);return 0;}
        let critChance=legacyStat(source,'crit',n(source.crit))/100+sm.crit-legacyStat(target,'critRes',n(target.critRes))/100;
        let critBonus=sm.critDamage+power(target,'bloodDebt');
        if(key(source)==='tieu_hon'&&source.splus.memory.rageCritReady){critBonus+=.3;source.splus.memory.rageCritReady=false;}
        const focusTarget=key(source)==='lac_an'&&passive(source)&&statuses(target).some(s=>control.has(s.type));
        if(focusTarget)critical=true;
        if(key(source)==='da_xoa'&&passive(source)&&targetRatio<0.5){critChance+=0.35;critBonus+=0.5;}
        if(holders(source,'hoa_khieu').length&&statuses(target).some(isBurn))critChance+=0.15;
        critChance+=n(options.critBonus)+(has(target,'resinPoison')?0.2:0);
        critical=critical||rng('splus.crit')<clamp(options.critChanceOverride??critChance);
        if(has(target,'bubble'))critical=false;
        const armor=type==='true'?0:Math.max(0,n(target.def)*(1+(type==='elemental'?tm.magicDefense:tm.defense)))*(1-clamp(Math.max(n(options.armorPierce),focusTarget ? rules(source).controlPierce : 0)));
        amount=Math.max(12,stat(source,'atk')*n(options.multiplier,1)*(100/(100+armor*0.82))*(0.94+clamp(rng('splus.variance'))*0.12)*1.22);
        if(critical)amount*=Math.max(1,options.critMultiplierOverride??(n(source.critDamage,1.5)+critBonus));
      }
      if(has(target,'bubble'))critical=false;
      if(critical&&!options.dot&&!options.secondary&&!options.reflection&&tryWorldSubstitute(target,source))return 0;
      if(action==='ultimate'&&key(source)==='cuu_trieu'&&targetRatio<.4)amount*=1.4;
      // A successful mirror proc replaces the incoming hit entirely. Reflections
      // carry provenance and never re-enter on-hit/reflect dispatch.
      if(action==='basic'&&!options.secondary&&!options.dot&&key(target)==='kinh_nuong'&&passive(target)&&rng('splus.reflect')<.25){
        emit('basicReflected',target,source,{amount:Math.round(amount)});damage(target,source,{raw:amount,type,reflection:true,secondary:true,noTriggers:true});return 0;
      }
      amount*=1-clamp(power(source,'damageDown'));
      const suppression=action!=='basic'&&!options.secondary&&!options.dot&&holders(source,'minh_toa',true).find(h=>strongest(foes(h))[0]===source);
      if(suppression)amount*=0.75;
      amount*=1-clamp(tm.mitigation);
      const incomingMelee=options.melee??melee(source);
      if(passive(target)&&!options.dot&&!options.secondary){if(key(target)==='cuong_dong'&&!incomingMelee)amount*=.75;if(key(target)==='thiet_lanh')amount*=.8;}
      if(type==='elemental')amount*=1-clamp(power(target,'magicResist'));
      if(key(target)==='giang_quan'&&passive(target)&&incomingMelee)amount*=0.8;
      if(critical){
        const pearl=holders(target,'tram_chau').find(h=>h===target||back(friends(h)).sort((a,b)=>near(h,a)-near(h,b)||bySlot(a,b)).slice(0,2).includes(target));
        if(pearl){amount*=0.5;pearl.splus.memory.pearlArmor=Math.min(5,n(pearl.splus.memory.pearlArmor)+1);}
      }
      if(critical&&key(target)==='hai_phong'&&passive(target)&&amount>target.maxHp*0.2){amount=target.maxHp*0.2;buff(target,target,'attackUp',0.25);buff(target,target,'lifesteal',0.2);}
      if(amount<=0)return 0;
      const cocoon=status(target,'cocoon');
      if(cocoon&&options.dot!==true){cocoon.charges--;emit('blockedHit',unit(cocoon.sourceId),target,{charges:cocoon.charges,iconId:cocoon.iconId});return 0;}
      if(!options.bypassGuard&&!options.secondary){
        const guard=holders(target,'thach_mong').find(h=>h!==target);
        if(guard){const shared=Math.round(amount*0.3);amount-=shared;guard.splus.memory.intercepted=n(guard.splus.memory.intercepted)+shared;guard.splus.memory.interceptMeter=n(guard.splus.memory.interceptMeter)+shared;damage(source,guard,{raw:shared,type,critical:false,secondary:true,noTriggers:true,bypassGuard:true});emit('intercept',guard,target,{amount:shared,iconId:def(guard)?.iconId});
          if(alive(guard)&&guard.splus.memory.interceptMeter>=guard.maxHp*0.2){guard.splus.memory.interceptMeter%=guard.maxHp*.2;for(const t of front(foes(guard)))displace(guard,t,'push');}
        }
        if(key(target)==='khaos'&&passive(target)&&target.splus.memory.cloneHp>0){const absorbed=Math.min(target.splus.memory.cloneHp,amount*0.5);target.splus.memory.cloneHp-=absorbed;amount-=absorbed;emit('cloneAbsorb',target,target,{amount:absorbed,remaining:target.splus.memory.cloneHp});
          if(target.splus.memory.cloneHp<=0){target.splus.memory.cloneReady=round+3;emit('cloneDestroyed',target,source);for(const t of [source,...adjacent(source,foes(target))].filter(alive).slice(0,2))damage(target,t,{multiplier:.5,type:'elemental',secondary:true,noTriggers:true});}
        }
      }
      amount=Math.round(amount);
      if(options.reflection&&key(target)==='co_nuong'&&passive(target)){heal(target,target,amount);emit('reflectionConverted',target,target,{amount});return 0;}
      if(has(target,'damageToRage')){const converted=Math.round(amount*.5);amount-=converted;energy(target,target,converted/target.maxHp*100,'pearl-conversion');emit('damageConverted',target,target,{amount:converted});}
      if(!options.bypassShield&&target.shield>0)amount-=absorbShield(source,target,amount);
      const before=target.hp;const dealt=Math.min(before,Math.max(0,amount));target.hp-=dealt;
      emit('damage',source,target,{amount:dealt,critical,damageType:type,action,dot:options.dot||false,reflection:options.reflection||false,secondary:options.secondary||false,...(options.legacyImpact?{legacyImpact:true}:{})});
      if(dealt>0&&!options.dot&&has(target,'sleep'))remove(target,s=>s.type==='sleep','awaken');
      if(target.hp<=0&&!preventDeath(target,source)){
        target.hp=0;target.dead=true;target.splus.memory.deathSequence=events.length;source.kills=n(source.kills)+1;
        emit('death',source,target,options.legacyImpact?{legacyImpact:true}:{});energy(source,source,12,'kill');
      } else rescueLow(target);
      // Ảnh Bộ passive: the first time Tích Đạo drops below the authored
      // threshold each battle she vanishes for one recipient turn.
      if(key(target)==='tich_dao'&&passive(target)&&!target.splus.memory.vanishUsed&&ratio(target)<clamp(n(rules(target).vanishBelow,.4))){
        target.splus.memory.vanishUsed=true;
        if(buff(target,target,'stealth',0,null,{remainingTurns:n(rules(target).vanishTurns,1)}))emit('shadowVanish',target,target);
      }
      if(options.dot&&options.burning&&dealt>0)for(const healer of holders(source,'hoa_duc')){
        const recipient=weakest(friends(healer))[0];if(recipient)heal(healer,recipient,dealt*0.5);
      }
      if(!options.noTriggers&&!options.secondary&&!options.dot){
        if(dealt>0&&sm.lifesteal>0)heal(source,source,dealt*sm.lifesteal);
        if(dealt>0&&key(source)==='hac_pha'&&passive(source)&&ratio(source)<.5)shield(source,source,dealt*.15);
        onHit(source,target,{dealt,rawDamage:amount,action,critical,targetRatio});
        onReceive(target,source,dealt,incomingMelee);
        if(alive(source)&&dealt>0){
          let reflect=power(target,'reflectAll');
          if(type==='physical')reflect=Math.max(reflect,power(target,'reflectPhysical'));
          if(action!=='basic')reflect=Math.max(reflect,power(target,'reflectSkills'));
          if(key(target)==='cuong_dong'&&passive(target))reflect=Math.max(reflect,0.3);
          if(reflect>0)damage(target,source,{raw:Math.round(dealt*reflect),type:action!=='basic'&&has(target,'reflectSkills')?'true':'elemental',reflection:true,secondary:true,noTriggers:true});
          if(suppression&&alive(suppression)&&alive(source))damage(suppression,source,{raw:Math.round(dealt*0.2),reflection:true,secondary:true,noTriggers:true});
        }
      }
      return dealt;
    } finally {eventDepth--;currentAction=previousAction;}
  }

  function onHit(source,target,hit) {
    if(!passive(source))return;
    if(key(source)==='lac_an')source.splus.memory.focus=Math.min(8,n(source.splus.memory.focus)+1);
    if(key(source)==='ha_lang'||(hit.action==='basic'&&key(source)==='hoa_tieu')){
      const count=key(source)==='ha_lang'?1:2;
      for(const next of adjacent(target,foes(source)).slice(0,count))damage(source,next,{raw:hit.rawDamage*0.3,secondary:true});
    }
    if(holders(source,'hoa_khieu').length&&statuses(target).some(isBurn))for(const h of holders(source,'hoa_khieu'))buff(h,source,'speedUp',.2);
    if(key(source)==='co_nuong'){const t=tankiest(foes(source))[0];if(t)mark(source,t,'parasite',.06,{percentMaxHp:.06,stack:true,maxStacks:5});}
    if(!alive(target))return;
    switch(key(source)){
      case 'linh_dong':if(hit.action==='basic'){mark(source,target,'healDown',.2);const s=mark(source,target,'spiritMark',0,{stack:true,maxStacks:3,polarity:'debuff'});if(s?.stacks===3){remove(target,x=>x===s,'detonate');energy(source,target,-15,'spirit-mark');}}break;
      case 'tieu_hon':if(hit.action==='basic'){siphon(source,target,15);if(source.energy>=100)source.splus.memory.rageCritReady=true;}break;
      case 'han_nuong':mark(source,target,'speedDown',.15,{stack:true,maxStacks:3});mark(source,target,'moveSlow',.15,{stack:true,maxStacks:3});break;
      case 'hoa_bai':{let z=zones.find(z=>z.team===target.team&&z.slot===target.slot&&z.sourceId===source.id);if(!z){z={team:target.team,slot:target.slot,sourceId:source.id};zones.push(z);}z.expiresRound=round+defaults.markDuration;syncZones();break;}
      case 'hac_dao':mark(source,target,'wound',.05,{rawPerTick:stat(source,'atk')*.05});break;
      case 'hac_hoa':if(hit.action==='basic'){mark(source,target,'thornsDot',.04,{percentMaxHp:.04});mark(source,target,'healDown',.2);}break;
      case 'cuu_tinh':{
        const previous=status(target,'bloodDebt')?.stacks||0;
        const s=mark(source,target,'bloodDebt',0.04,{stack:true,maxStacks:5});
        if(s&&previous<5&&s.stacks===5){remove(target,x=>x===s,'detonate');buff(source,target,'stun',0,1);}break;
      }
      case 'son_cuong':{
        const s=mark(source,target,'resinBleed',0.06,{percentMaxHp:0.06,stack:true,maxStacks:4});
        if(s?.stacks===4){remove(target,x=>x===s,'convert');mark(source,target,'resinPoison',0.3);}break;
      }
      case 'mang_xa':{
        const s=mark(source,target,'viperPoison',0.05,{percentMaxHp:0.05,stack:true,maxStacks:5});
        if(s?.stacks===5)buff(source,target,'speedDown',0.3);break;
      }
      case 'to_linh':{
        const s=mark(source,target,'ink',0.2,{stack:true,maxStacks:3});
        if(s?.stacks===3){remove(target,x=>x===s,'convert');buff(source,target,'stasis',0,1);}break;
      }
    }
  }
  function onReceive(target,source,dealt,incomingMelee) {
    if(!passive(target))return;
    switch(key(target)){
      case 'thiet_lanh':buff(target,source,'coldSteel',.06,2,{stack:true,maxStacks:4});break;
      case 'nung':if(incomingMelee)buff(target,source,'burn',.03,2,{rawPerTick:target.maxHp*.03,stack:true,maxStacks:3});break;
      case 'tram_tue':buff(target,source,'attackDown',.15,2,{stack:true,maxStacks:2});buff(target,source,'speedDown',.1,2,{stack:true,maxStacks:2});break;
      case 'thach_kinh':{
        const m=target.splus.memory;m.resentmentMeter=n(m.resentmentMeter)+dealt;
        const earned=Math.floor(m.resentmentMeter/(target.maxHp*.1));m.resentmentMeter%=target.maxHp*.1;
        m.resentment=n(m.resentment)+earned;
        if(m.resentment>=5){m.resentment%=5;heal(target,target,(target.maxHp-target.hp)*.15);buff(target,source,'attackDown',.15);}break;
      }
    }
  }
  function actionCost(u,action) {
    if(action==='basic')return 0;
    if(action==='skill')return n(def(u)?.actions?.skill?.cost,defaults.skillCost);
    return n(def(u)?.actions?.ultimate?.cost,defaults.ultimateCost);
  }
  function swapBachDienMask(actor) {
    if(key(actor)!=='bach_dien'||!passive(actor))return;
    const mem=actor.splus.memory;if(n(mem.masks,0)<=0)return;
    const next=mem.maskFace==='joy'?'rage':'joy';mem.maskFace=next;
    remove(actor,s=>s.type==='joyMask'||s.type==='rageMask','mask-swap');
    const r=rules(actor,'passive');
    if(next==='joy')buff(actor,actor,'joyMask',n(r.joyCrit,.25),n(r.maskTurns,2));
    else buff(actor,actor,'rageMask',n(r.rageCritDamage,.3),n(r.maskTurns,2),{lifesteal:n(r.rageLifesteal,.15)});
    emit('maskSwap',actor,actor,{face:next,masks:mem.masks});
  }
  function tryWorldSubstitute(target,source) {
    if(key(target)!=='bach_dien'||!passive(target))return false;
    const mem=target.splus.memory;if(n(mem.masks,0)<=0&&!mem.maskFace)return false;
    mem.masks=0;mem.maskFace=null;
    remove(target,s=>s.type==='joyMask'||s.type==='rageMask','world-substitute');
    buff(target,target,'stealth',0,n(rules(target,'passive').vanishTurns,1));
    emit('worldSubstitute',target,source,{attackerId:source?.id||null});
    emit('immune',source,target,{effect:'critical'});
    return true;
  }
  function canMove(targetId) {const u=unit(targetId);return alive(u)&&!legacyControl(u)&&!statuses(u).some(s=>hardCC.has(s.type)||s.type==='root'||s.type==='entangle');}
  function canUse(targetId,action) {
    const u=unit(targetId);if(!alive(u)||!['basic','skill','ultimate'].includes(action))return false;
    if(legacyControl(u)||statuses(u).some(s=>hardCC.has(s.type)))return false;
    if(action==='basic'&&(has(u,'disarm')||has(u,'entangle')))return false;
    if(action!=='basic'&&['guardian','striker','duelist','ranger'].includes(def(u)?.role)&&statuses(u).some(s=>s.type==='disarm'&&s.weaponSkills))return false;
    if(melee(u)&&statuses(u).some(s=>s.type==='root'&&s.blocksMelee))return false;
    if(action!=='basic'&&(has(u,'silence')||has(u,'hardSilence')||legacyEffects(u).some(s=>s.type==='silence'||s.type==='hardSilence')))return false;
    if(['ky_van','tieu_phong','tich_dao'].includes(key(u))&&action==='skill')return false;
    const cost=actionCost(u,action);
    return u.energy>=cost&&n(u.splus.cooldowns[action])<=round;
  }
  function displace(source,target,mode='push') {
    if(!alive(target))return;
    if(!canMove(target)){emit('moveBlocked',source,target);return;}
    if(mode!=='pull'&&mode!=='random'&&key(target)==='giang_quan'&&target.slot<3&&passive(target)&&rng('splus.push-resist')<.2){emit('resist',target,target,{effect:'push'});return;}
    const old=target.slot;
    if(mode==='half'){emit('displacement',source,target,{from:old,to:old,distance:0.5,presentationOnly:true});return;}
    const desired=mode==='random'?random([0,1,2,3,4,5].filter(s=>s!==old))[0]:mode==='pull'?source.slot%3:old%3+3;
    if(desired===old){emit('displacement',source,target,{from:old,to:old,presentationOnly:true});return;}
    const other=friends(target).find(u=>u.slot===desired);
    if(other&&!canMove(other)){emit('moveBlocked',source,target);return;}
    target.slot=desired;if(other)other.slot=old;
    syncZones();
    emit('displacement',source,target,{from:old,to:desired,swappedId:other?.id||null});
  }

  // Skill handlers are deliberately separated from common damage/status rules.
  // Added below; tests use the very same dispatch as the browser adapter.
  function resolveSkill(actor,action,target) { return skillHandlers(actor,action,target); }
  function afterAction(actor,action) {
    actor.splus.lastActRound=round;
    for(const support of holders(actor,'co_trong')){
      const before=n(support.splus.memory.gears);support.splus.memory.gears=Math.min(10,before+1);
      if(before<10&&support.splus.memory.gears===10)for(const t of friends(support))shield(support,t,support.maxHp*.15,{turns:2});
    }
    for(const h of units.filter(u=>key(u)==='cuu_trieu'&&passive(u)))h.splus.memory.cadence=Math.min(15,n(h.splus.memory.cadence)+1);
    for(const h of holders(actor,'van_phap'))buff(h,actor,'ccReflect',0,2,{charges:1,chance:.35});
    for(const s of statuses(actor).filter(s=>s.type==='viperPoison'&&s.stacks===5)){
      const next=adjacent(actor,friends(actor))[0],source=unit(s.sourceId);if(next&&source)mark(source,next,'viperPoison',.05,{percentMaxHp:.05,stack:true,maxStacks:5});
    }
    if(!passive(actor))return;
    if(key(actor)==='thuy_co')for(const ally of friends(actor).filter(t=>t!==actor&&Math.floor(t.slot/3)===Math.floor(actor.slot/3))){buff(actor,ally,'speedUp',.12);buff(actor,ally,'moveSpeedUp',.1);}
    if(key(actor)==='thuy_ngoc'&&action!=='basic'){const ally=strongest(friends(actor).filter(u=>u!==actor))[0]||actor;energy(actor,ally,15,'pearl-passive');}
    if(key(actor)==='cuu_trieu'){
      if(actor.splus.memory.cadence>=8){const amount=Math.min(actor.hp-1,Math.round(actor.hp*.06));actor.hp-=Math.max(0,amount);emit('selfCost',actor,actor,{amount:Math.max(0,amount)});}
    }
    if(key(actor)==='bach_dien'&&action!=='basic')swapBachDienMask(actor);
  }
  function act(actorId,action,targetId,settings={}) {
    start();const actor=unit(actorId);if(!canUse(actor,action)&&!settings.alreadyPaid)return {ok:false,reason:'ACTION_UNAVAILABLE',events:[]};
    if(!alive(actor))return {ok:false,reason:'ACTOR_DEAD',events:[]};
    if(preparedTurn!==actor.id)beginTurn(actor);preparedTurn=null;
    if(!alive(actor))return {ok:false,reason:'ACTOR_DEAD',events:[]};
    const startIndex=events.length,legal=targets(actor,action);
    // Resolve again at impact: a stale/manual basic target cannot skip a living front row.
    let target=legal.find(u=>u.id===unit(targetId)?.id)||legal[0];
    if(!target)return {ok:false,reason:'TARGET_UNAVAILABLE',events:[]};
    const confusion=status(actor,'confusion');
    if(confusion&&rng('splus.confusion')<n(confusion.chance,.5)){target=random(friends(actor).filter(u=>u!==actor))[0]||target;action='basic';}
    const previous=currentAction;currentAction={id:`splus:r${round}:a${++actionSerial}`,actorId:actor.id,action};
    try{
      if(!settings.alreadyPaid)energy(actor,actor,-(action==='basic'?0:actionCost(actor,action)),'cost');
      emit('action',actor,target,{action});
      const killsBefore=n(actor.kills);
      if(action==='basic'){damage(actor,target,{multiplier:1,action});energy(actor,actor,defaults.basicRage,'basic');}
      else if(key(actor)==='tieu_phong'&&action==='ultimate'){
        const cast={id:currentAction.id,action:currentAction,targets:legal.filter(t=>t.slot%3===target.slot%3).map(t=>t.id),resolved:[]};
        actor.splus.memory.fanCast=cast;
        if(settings.deferTieuPhong)return {ok:true,castId:cast.id,events:events.slice(startIndex)};
        for(let wave=0;wave<3;wave++)for(const id of cast.targets)resolveTieuPhongImpact(actor,cast.id,wave,id);
        delete actor.splus.memory.fanCast;
      }else if(key(actor)==='tich_dao'&&action==='ultimate'){
        const cast={id:currentAction.id,action:currentAction,targets:legal.map(t=>t.id),resolved:[],killed:false,stealthGranted:false};
        actor.splus.memory.shadowCast=cast;
        if(settings.deferTichDao)return {ok:true,castId:cast.id,events:events.slice(startIndex)};
        for(let strike=0;strike<3;strike++)resolveTichDaoImpact(actor,cast.id,strike);
        settleTichDaoStealth(actor,cast);
        delete actor.splus.memory.shadowCast;
      }else resolveSkill(actor,action,target);
      if(action!=='basic')actor.splus.cooldowns[action]=round+(action==='skill'?defaults.skillCooldown:0)+(has(actor,'cooldownDelay')?1:0);
      if(action==='ultimate'&&key(actor)==='cuu_trieu'&&n(actor.kills)>killsBefore&&actor.splus.memory.extraRound!==round&&!has(actor,'noExtraTurn')&&alive(actor)){actor.splus.memory.extraRound=round;emit('extraTurn',actor,actor);}
      afterAction(actor,action);return {ok:true,events:events.slice(startIndex),extraTurn:events.slice(startIndex).some(e=>e.type==='extraTurn')};
    }finally{currentAction=previous;}
  }
  function resolveTieuPhongImpact(actorId,castId,wave,targetId){
    const actor=unit(actorId),cast=actor?.splus?.memory?.fanCast,target=unit(targetId),token=wave+':'+targetId;
    if(!cast||cast.id!==castId||!Number.isInteger(wave)||wave<0||wave>2||!cast.targets.includes(targetId)||cast.resolved.includes(token))return {ok:false};
    cast.resolved.push(token);if(!alive(actor)||!alive(target))return {ok:true,events:[]};
    const previous=currentAction,startIndex=events.length;currentAction=cast.action;
    try{
      const r=rules(actor,'ultimate');
      const critical=wave===2&&rng('splus.tieu-phong-crit')<n(r.criticalChance,.3);
      damage(actor,target,{action:'ultimate',multiplier:n(r.waveMultiplier,1),forceCrit:critical,critChanceOverride:0,critMultiplierOverride:n(r.criticalMultiplier,2)});
      if(alive(target)&&wave===0&&rng('splus.tieu-phong-stun')<n(r.stunChance,.5))buff(actor,target,'stun',0,null,{remainingTurns:1});
      if(alive(target)&&wave===1&&rng('splus.tieu-phong-antiheal')<n(r.antiHealChance,.4))buff(actor,target,'antiHeal',1,null,{remainingTurns:2});
      emit('tornadoImpact',actor,target,{wave:wave+1,critical});
      return {ok:true,events:events.slice(startIndex)};
    }finally{currentAction=previous;}
  }
  function finishTieuPhongCast(actorId,castId){
    const actor=unit(actorId),cast=actor?.splus?.memory?.fanCast;
    if(!cast||cast.id!==castId||cast.resolved.length!==cast.targets.length*3)return false;
    const previous=currentAction;currentAction=cast.action;
    try{delete actor.splus.memory.fanCast;actor.splus.cooldowns.ultimate=round;afterAction(actor,'ultimate');return true;}finally{currentAction=previous;}
  }
  // Ảnh Nhận Khách resolves each authored ultimate strike at its own visual
  // phase: back-line hunter, then the lowest-HP foe, then a finishing blow.
  function settleTichDaoStealth(actor,cast){
    if(!cast.killed||cast.stealthGranted)return;
    cast.stealthGranted=true;
    if(!alive(actor))return;
    if(!buff(actor,actor,'stealth',0,null,{remainingTurns:n(rules(actor,'passive').vanishTurns,1)}))return;
    emit('shadowVeil',actor,actor);
  }
  function resolveTichDaoImpact(actorId,castId,strike){
    const actor=unit(actorId),cast=actor?.splus?.memory?.shadowCast,token=String(strike);
    if(!cast||cast.id!==castId||!Number.isInteger(strike)||strike<0||strike>2||cast.resolved.includes(token))return {ok:false};
    cast.resolved.push(token);
    const living=cast.targets.map(unit).filter(u=>alive(u)&&u.hp>0);
    if(!alive(actor)||!living.length)return {ok:true,events:[]};
    const previous=currentAction,startIndex=events.length;currentAction=cast.action;
    try{
      const r=rules(actor,'ultimate'),multipliers=r.strikeMultipliers||[.7,.9,1];
      let target;
      if(strike===0){target=weakestBack(living);cast.primaryTarget=target?.id||null;}
      else{
        // Strike 2 skips the first victim's target when another foe remains;
        // the final strike always chases the lowest-HP survivor.
        const pool=strike===1&&living.length>1?living.filter(u=>u.id!==cast.primaryTarget):living;
        target=weakest(pool)[0];
      }
      const critical=strike===2&&rng('splus.tich-dao-crit')<n(r.criticalChance,.35);
      const dealt=damage(actor,target,{action:'ultimate',multiplier:n(multipliers[strike],1),forceCrit:critical,critChanceOverride:0,critMultiplierOverride:n(r.criticalMultiplier,1.8)});
      if(target&&!alive(target))cast.killed=true;
      if(strike===2)settleTichDaoStealth(actor,cast);
      emit('shadowStrike',actor,target,{strike:strike+1,dealt,critical});
      return {ok:true,events:events.slice(startIndex)};
    }finally{currentAction=previous;}
  }
  function finishTichDaoCast(actorId,castId){
    const actor=unit(actorId),cast=actor?.splus?.memory?.shadowCast;
    if(!cast||cast.id!==castId||cast.resolved.length!==3)return false;
    const previous=currentAction;currentAction=cast.action;
    try{settleTichDaoStealth(actor,cast);delete actor.splus.memory.shadowCast;actor.splus.cooldowns.ultimate=round;afterAction(actor,'ultimate');return true;}finally{currentAction=previous;}
  }
  function start() {
    if(started)return;started=true;
    for(const actor of units.filter(passive)){
      if(key(actor)==='khaos')actor.splus.memory.cloneHp=actor.maxHp*0.5;
      if(key(actor)==='tam_nuong'){
        const other=weakest(friends(actor).filter(u=>u!==actor))[0];
        for(const t of [actor,other].filter(Boolean)){buff(actor,t,'cocoon',0,2,{charges:2});buff(actor,t,'armorUp',0.3,2);}
      }
      if(key(actor)==='vong_co'){const t=strongest(foes(actor))[0];if(t)buff(actor,t,'cooldownDelay',1,1);}
      if(key(actor)==='bach_dien'){actor.splus.memory.masks=n(rules(actor).masks,3);actor.splus.memory.maskFace=null;}
    }
    emit('battleStart',null,null);
  }
  let lastFinished=0;
  function dotAmount(target,s,ticks=1){return Math.max(0,n(s.rawPerTick,target.maxHp*n(s.percentMaxHp,s.power))*n(s.stacks,1)*ticks);}
  function tickDot(target,s,ticks=1,bonus=1){const source=unit(s.sourceId)||target;const dealt=damage(source,target,{raw:dotAmount(target,s,ticks)*bonus,type:'true',dot:true,burning:isBurn(s),secondary:true,noTriggers:true});if(s.type==='parasite'&&alive(source))heal(source,source,dealt);return dealt;}
  function detonate(target,filter,bonus=1){let dealt=0;for(const s of statuses(target).filter(filter)){const ticks=Math.max(0,n(s.ticksLeft));if(s.zone)for(let i=zones.length-1;i>=0;i--)if(zones[i].sourceId===s.sourceId&&zones[i].team===target.team&&zones[i].slot===target.slot)zones.splice(i,1);remove(target,x=>x===s,'detonate');dealt+=tickDot(target,s,ticks,bonus);}return dealt;}
  function syncZones(){
    for(const target of units){remove(target,s=>s.type==='brimstone'&&s.zone&&!zones.some(z=>z.sourceId===s.sourceId&&z.team===target.team&&z.slot===target.slot&&z.expiresRound>round),'left-zone');
      if(!alive(target))continue;for(const z of zones.filter(z=>z.team===target.team&&z.slot===target.slot&&z.expiresRound>round))if(!statuses(target).some(s=>s.type==='brimstone'&&s.sourceId===z.sourceId)){
        const s=buff(unit(z.sourceId),target,'brimstone',.04,z.expiresRound-round,{zone:true,percentMaxHp:.04});if(s)s.expiresRound=z.expiresRound;
      }
    }
  }
  function beginTurn(actorId){start();const actor=unit(actorId);if(!alive(actor))return;preparedTurn=actor.id;
    syncZones();emit('turnStart',actor,actor);
    for(const h of holders(actor,'mien_nuong')){const t=weakest(friends(h))[0];if(t)heal(h,t,h.maxHp*.05);}
    for(const s of statuses(actor).filter(s=>s.type==='brimstone'&&s.zone))tickDot(actor,s);
  }
  function consumeTurnStatuses(targetId){
    const target=unit(targetId);if(!target)return;
    remove(target,s=>s.remainingTurns!=null&&--s.remainingTurns<=0,'turn-complete');
  }
  function finishRound() {
    start();if(lastFinished===round)return;lastFinished=round;
    for(const source of units.filter(passive)){
      if(key(source)==='hoi_anh'&&round%2===0){const fs=random(front(foes(source))),bs=random(back(foes(source)));if(fs[0]&&bs[0]&&canMove(fs[0])&&canMove(bs[0])){const a=fs[0].slot,b=bs[0].slot;fs[0].slot=b;bs[0].slot=a;emit('swap',source,fs[0],{otherId:bs[0].id,from:a,to:b});}}
    }
    for(const target of units.filter(alive))for(const s of statuses(target).slice()){
      if(!alive(target))break;
      const source=unit(s.sourceId)||target;
      if(dots.has(s.type)&&!s.zone&&s.ticksLeft>0){tickDot(target,s);s.ticksLeft--;}
      if(s.type==='regen'&&!s.beginRound&&s.ticksLeft>0){heal(source,target,target.maxHp*s.power);s.ticksLeft--;}
      if((dots.has(s.type)||s.type==='regen')&&!s.zone&&s.ticksLeft<=0)remove(target,x=>x===s,'ticks-complete');
    }
    emit('roundEnd',null,null);
  }
  function beginRound(next) {
    start();if(!Number.isInteger(next)||next<round||next>15)throw new Error('ROUND_OUT_OF_RANGE');
    if(next===round)return;
    while(round<next){finishRound();round++;
      // Begin-round HoT receives both authored ticks before its expiry boundary.
      for(const t of units.filter(alive))for(const s of t.statuses.filter(s=>s.splus&&s.type==='regen'&&s.beginRound&&s.ticksLeft>0&&s.expiresRound>=round)){heal(unit(s.sourceId),t,t.maxHp*s.power);s.ticksLeft--;}
      for(const u of units)remove(u,s=>s.expiresRound!=null&&s.expiresRound<=round,'expired');
      for(let i=zones.length-1;i>=0;i--)if(zones[i].expiresRound<=round)zones.splice(i,1);syncZones();
      for(const actor of units.filter(passive)){
        if(key(actor)==='vong_co'){const t=strongest(foes(actor))[0];for(const u of foes(actor))remove(u,s=>s.type==='cooldownDelay'&&s.sourceId===actor.id,'retarget');if(t)buff(actor,t,'cooldownDelay',1,1);}
        if(key(actor)==='tam_nuong'&&(round-1)%2===0){const other=weakest(friends(actor).filter(t=>t!==actor))[0];for(const t of [actor,other].filter(Boolean)){buff(actor,t,'cocoon',0,2,{charges:2});buff(actor,t,'armorUp',.3,2);}}
        if(key(actor)==='khaos'&&actor.splus.memory.cloneReady&&actor.splus.memory.cloneReady<=round){actor.splus.memory.cloneReady=null;actor.splus.memory.cloneHp=actor.maxHp*.5;emit('cloneCreated',actor,actor);}
      }
      emit('roundStart',null,null);
    }
  }
  const frontOrAll=list=>{const row=front(list);return row.length?row:list;};
  const backOrAll=list=>{const row=back(list);return row.length?row:list;};
  const unique=list=>list.filter((item,index,array)=>item&&array.findIndex(other=>other.id===item.id)===index);
  function authoredTargets(actor,action,enemies,allies) {
    const k=key(actor),r=rules(actor,action),enemyFront=frontOrAll(enemies),enemyBack=backOrAll(enemies),allyFront=frontOrAll(allies),allyBack=backOrAll(allies);
    const oppositeTarget=opposite(actor,enemies),strongestEnemy=strongest(enemies)[0],weakestEnemyBack=weakestBack(enemies),strongestEnemyBack=strongestBack(enemies);
    const one=value=>value?[value]:[];
    // Ảnh Trảm is an assassin Basic: it hunts the weakest back-line unit
    // instead of the common opposite-column fallback.
    if(action==='basic')return k==='tich_dao'?one(weakestEnemyBack):null;
    if(action==='skill')switch(k){
      case 'co_trong':return allyFront.slice(0,r.count||2);
      case 'cuong_dong':case 'thiet_lanh':case 'minh_toa':case 'linh_dong':case 'ha_lang':case 'giang_quan':case 'hac_dao':case 'hac_hoa':case 'nung':return one(oppositeTarget);
      case 'lac_an':case 'da_xoa':return one(weakestEnemyBack);
      case 'bach_dien':return one(weakest(enemies)[0]);
      case 'hac_pha':case 'thach_kinh':case 'co_nuong':case 'hoa_bai':case 'thach_mong':case 'to_linh':return enemyFront;
      case 'tieu_hon':return one(enragedBack(enemies));
      case 'han_nuong':return enemyFront.slice(0,r.count||2);
      case 'vong_co':case 'tram_tue':case 'kinh_nuong':return one(strongestEnemy);
      case 'muc_chieu':return weakest(allies).slice(0,r.count||3);
      case 'thuy_co':return one(weakest(allyFront)[0]);
      case 'thuy_ngoc':return one(strongest(allyBack)[0]);
      case 'hai_phong':case 'hoa_tieu':case 'cuu_tinh':return one(strongestEnemyBack);
      case 'tram_chau':return one(weakest(allies)[0]);
      case 'hoa_khieu':return strongest(allies.filter(u=>u!==actor&&Math.floor(u.slot/3)===Math.floor(actor.slot/3))).slice(0,r.count||2);
      case 'mien_nuong':return weakest(allyFront).slice(0,r.count||2);
      case 'tam_nuong':case 'van_phap':return enemyFront.slice(0,r.count||2);
      case 'son_cuong':return enemies.filter(u=>u.slot%3===actor.slot%3);
      case 'tue_y':return weakest(allies).slice(0,r.count||3);
      case 'mang_xa':return enemies;
      case 'khaos':return unique([front(enemies)[0],back(enemies)[0]]);
      case 'hoi_anh':return one(oppositeTarget);
      case 'cuu_trieu':return unique([...enemyFront,...back(enemies).filter(u=>u.slot%3===actor.slot%3).slice(0,1)]);
      default:return null;
    }
    switch(k){
      case 'co_trong':case 'thiem_ngan':case 'muc_chieu':case 'thuy_co':case 'tram_chau':case 'hoa_duc':case 'mien_nuong':case 'kinh_nuong':case 'thach_mong':return allies;
      case 'thuy_ngoc':return allyBack;
      case 'lac_an':return enemies;
      case 'minh_toa':return one(enragedBack(enemies));
      case 'tieu_hon':return one(strongestEnemy);
      case 'bach_dien':return one(strongestEnemy);
      case 'da_xoa':return one(weakestEnemyBack);
      case 'hac_pha':case 'thiet_lanh':case 'thach_kinh':case 'giang_quan':case 'hac_hoa':return enemyFront;
      case 'nung':return enemyFront;
      case 'hoa_khieu':return one(strongestEnemy);
      case 'hac_dao':{const target=tankiest(enemies)[0];return target?unique([target,...adjacent(target,enemies).slice(0,4)]):[];}
      case 'tieu_phong':{const lane=oppositeTarget?.slot%3;return enemies.filter(t=>t.slot%3===lane);}
      case 'tich_dao':return enemies;
      case 'ky_van':case 'to_linh':case 'linh_dong':case 'cuong_dong':case 'han_nuong':case 'vong_co':case 'co_nuong':case 'ha_lang':case 'hai_phong':case 'hoa_tieu':case 'tram_tue':case 'hoi_anh':case 'cuu_trieu':case 'khaos':return enemies;
      default:return null;
    }
  }
  function targets(actorId,action='basic') {
    const actor=unit(actorId);if(!actor)return [];
    let enemies=foes(actor);const visible=enemies.filter(u=>!has(u,'stealth'));if(visible.length)enemies=visible;
    const allies=friends(actor);
    const taunt=status(actor,'taunted');const taunter=unit(taunt?.sourceId);if(alive(taunter)&&taunter.team!==actor.team)return [taunter];
    const scoped=authoredTargets(actor,action,enemies,allies);if(scoped)return scoped.filter(alive);
    return [opposite(actor,enemies)].filter(Boolean);
  }
  function chooseAction(actorId) {return ['ultimate','skill','basic'].find(a=>canUse(actorId,a))||null;}
  function hud(targetId) {
    const target=unit(targetId);if(!alive(target))return [];
    const entries=statuses(target).map(s=>({id:`${s.type}:${s.sourceId}`,type:s.type,iconId:s.iconId,sourceId:s.sourceId,sourceHeroId:s.sourceHeroId,polarity:s.polarity,stacks:s.stacks,maxStacks:s.maxStacks,charges:s.charges??null,remainingRounds:s.expiresRound==null?null:Math.max(0,s.expiresRound-round),name:def(unit(s.sourceId))?.passiveName||s.type}));
    function aura(source,type,stacks=1,extra={}) {if(source&&stacks>0)entries.push({id:`aura:${type}:${source.id}`,type,iconId:def(source)?.iconId||null,sourceId:source.id,sourceHeroId:source.sourceId,polarity:'buff',stacks,maxStacks:null,charges:null,remainingRounds:null,name:def(source)?.passiveName||type,...extra});}
    for(const s of holders(target,'co_trong'))aura(s,'gears',n(s.splus.memory.gears));
    if(passive(target)){
      if(['cuong_dong','giang_quan','thiet_lanh','kinh_nuong'].includes(key(target)))aura(target,'passive');
      if(key(target)==='lac_an')aura(target,'focus',n(target.splus.memory.focus));
      if(key(target)==='hac_pha'&&ratio(target)<0.5)aura(target,'berserk');
      if(key(target)==='thach_kinh')aura(target,'resentment',n(target.splus.memory.resentment));
      if(key(target)==='cuu_trieu')aura(target,'cadence',n(target.splus.memory.cadence));
      if(key(target)==='khaos'&&target.splus.memory.cloneHp>0)aura(target,'clone',1,{amount:target.splus.memory.cloneHp});
    }
    for(const s of holders(target,'thach_mong'))aura(s,'interception');
    for(const s of holders(target,'tram_chau'))if(s===target||back(friends(s)).sort((a,b)=>near(s,a)-near(s,b)||bySlot(a,b)).slice(0,2).includes(target))aura(s,'antiCrit');
    for(const s of holders(target,'minh_toa',true))if(strongest(foes(s))[0]===target)aura(s,'suppression',1,{polarity:'debuff'});
    return entries;
  }

  function skillHandlers(actor,action,target) {
    const all=foes(actor),ours=friends(actor),ff=front(all).length?front(all):all,of=front(ours),ob=back(ours);
    const taunter=unit(status(actor,'taunted')?.sourceId),forced=alive(taunter)&&taunter.team!==actor.team?taunter:null;
    const strongestEnemy=forced||strongest(all)[0],backCarry=forced||strongestBack(all),weakBack=forced||weakestBack(all),opp=forced||opposite(actor,all);
    const skill=action==='skill',base=skill?defaults.skillMultiplier:defaults.aoeUltimateMultiplier;
    const D=(targets,multiplier=base,extra={})=>(Array.isArray(targets)?targets:[targets]).filter(Boolean).reduce((sum,t)=>sum+damage(actor,t,{multiplier,action,...extra}),0);
    const H=(targets,pct)=>(Array.isArray(targets)?targets:[targets]).filter(Boolean).reduce((sum,t)=>sum+heal(actor,t,(rules(actor,action).hpBasis==='source'?actor.maxHp:t.maxHp)*pct),0);
    const B=(targets,type,powerValue=0,turns=defaults.duration,extra={})=>{for(const t of (Array.isArray(targets)?targets:[targets]).filter(Boolean))buff(actor,t,type,powerValue,turns,extra);};
    const S=(targets,pct)=>{for(const t of targets)shield(actor,t,actor.maxHp*pct);};
    const airborne=targets=>{for(const t of targets)emit('airborne',actor,t,{seconds:1,presentationOnly:true});};
    const strip=(targets,count=Infinity)=>{for(const t of targets)cleanse(t,count,s=>s.polarity==='buff');};
    const hits=(targets,count,total,extra={})=>{let totalDamage=0;for(let i=0;i<count&&alive(actor);i++)totalDamage+=D(targets,total/count,{...extra,hitIndex:i,hitCount:count});return totalDamage;};
    const k=key(actor);
    if(skill){
      switch(k){
        case 'co_trong':{const r=rules(actor,action),list=of.slice(0,r.count);S(list,r.shield);B(list,'resistUp',r.resist,r.turns);return;}
        case 'cuong_dong':{const r=rules(actor,action);D(opp,0,{raw:actor.maxHp*r.sourceHpDamage,type:'physical'});B(opp,'stun',0,r.stun);B(opp,'armorDown',r.armorDown,2);return;}
        case 'lac_an':{const r=rules(actor,action);D(weakBack,base,{armorPierce:r.armorPierce,type:'elemental'});B(weakBack,'stealthBan',0,r.turns);return;}
        case 'hac_pha':D(ff);B(ff,'armorDown',0.25);return;
        case 'thiet_lanh':D(opp);B(opp,'disarm',0,1,{weaponSkills:true});return;
        case 'minh_toa':breakShield(actor,opp);D(opp);B(opp,'shieldBan',0,rules(actor,action).turns);return;
        case 'thiem_ngan':{const r=rules(actor,action),list=weakest(of).slice(0,r.count);H(list,r.heal);B(list,'armorUp',r.armor,r.turns);return;}
        case 'linh_dong':D(opp);B(opp,'confusion',0,1,{chance:rules(actor,action).confusionChance});return;
        case 'tieu_hon':{const t=forced||enragedBack(all);D(t);B(t,'rageBan',0,rules(actor,action).turns);return;}
        case 'thach_kinh':D(ff);B(ff,'attackDown',0.3);return;
        case 'han_nuong':{const r=rules(actor,action),list=ff.slice(0,r.count);D(list);for(const t of list){const selected=random(statuses(t).filter(s=>s.polarity==='buff'))[0];if(selected)remove(t,s=>s===selected,'dispel');}B(list,'buffBan',0,r.turns);return;}
        case 'vong_co':D(target);B(target,'silence',0,1);energy(actor,target,-rules(actor,action).rageDrain,'amnesia');return;
        case 'co_nuong':{const r=rules(actor,action);for(const t of ff)D(t,0,{raw:t.hp*r.currentHpDamage,type:'elemental'});B(ff,'armorDown',r.armorDown,r.turns);return;}
        case 'muc_chieu':{const list=weakest(ours).slice(0,3);H(list,rules(actor,action).heal);for(const t of list)cleanse(t,Infinity,s=>['healDown','wound','antiHeal','bloodDebt','parasite','cooldownDelay'].includes(s.type));return;}
        case 'thuy_co':{const t=weakest(of)[0]||weakest(ours)[0];H(t,rules(actor,action).heal);if(t)cleanse(t,1,s=>['burn','poison'].includes(s.type));return;}
        case 'ha_lang':D(opp);displace(actor,opp,'push');return;
        case 'giang_quan':D(opp);airborne([opp].filter(Boolean));return;
        case 'thuy_ngoc':{const t=strongest(ob)[0]||strongest(ours)[0];shield(actor,t,actor.maxHp*rules(actor,action).shield,{explodes:true});return;}
        case 'hai_phong':D(backCarry);displace(actor,backCarry,'pull');B(backCarry,'stun',0,1);return;
        case 'tram_chau':{const r=rules(actor,action);shield(actor,weakest(ours)[0],actor.maxHp*r.shield,{bubble:true,turns:r.turns});return;}
        case 'da_xoa':hits([weakBack],2,base);B(weakBack,'rageSlow',0.3);return;
        case 'nung':{const primary=opp;D(primary);D(adjacent(primary,all),base*.5);B(primary,'stun',0,1);return;}
        case 'hoa_tieu':{const t=strongestBack(all)||strongestEnemy;D(t);B(t,'blind',0.35,2);return;}
        case 'hoa_khieu':{const row=Math.floor(actor.slot/3);const list=strongest(ours.filter(u=>u!==actor&&Math.floor(u.slot/3)===row)).slice(0,2);B(list,'attackUp',0.2);B(list,'lifesteal',0.15,2);return;}
        case 'cuu_tinh':D(backCarry,base,{type:'true'});B(backCarry,'shieldBan');return;
        case 'hoa_bai':D(ff);B(ff,'blind',0.3,2);return;
        case 'hac_dao':D(target);B(target,'armorDown',0.4);B(target,'shieldBan');return;
        case 'hoa_duc':{const list=strongest(ob).slice(0,2);B(list,'attackUp',0.2);for(const t of list)energy(actor,t,20,'elixir');return;}
        case 'mien_nuong':{const list=weakest(of).slice(0,2);for(const t of list){cleanse(t,1);H(t,0.15);}return;}
        case 'tram_tue':B(target,'sleep',0,1);return;
        case 'hac_hoa':D(opp);B(opp,'disarm',0,1,{weaponSkills:false});return;
        case 'tam_nuong':{const list=ff.slice(0,2);D(list);B(list,'entangle',0,2);B(list,'attackDown',0.2,2);return;}
        case 'son_cuong':{const list=all.filter(t=>t.slot%3===actor.slot%3);D(list,base,{critBonus:0.4});B(list,'bleed',0.04,2,{percentMaxHp:0.04});return;}
        case 'tue_y':{const list=weakest(ours).slice(0,3);H(list,0.2);B(list,'regen',0.06,2);return;}
        case 'mang_xa':{const list=random(all).slice(0,3);for(const t of list)breakShield(actor,t);D(list);B(list,'armorDown',0.25,2);return;}
        case 'khaos':{const a=random(front(all))[0],b=random(back(all))[0];if(a&&b&&canMove(a)&&canMove(b)){const from=a.slot;a.slot=b.slot;b.slot=from;syncZones();emit('swap',actor,a,{otherId:b.id,from,to:a.slot});}return;}
        case 'kinh_nuong':D(strongestEnemy);B(strongestEnemy,'blind',1,2,{charges:1});return;
        case 'hoi_anh':{const victim=opp,friend=victim&&adjacent(victim,friends(victim))[0];if(victim&&friend){emit('forcedBasic',actor,victim,{victimId:friend.id});damage(victim,friend,{multiplier:1,action:'basic'});}return;}
        case 'van_phap':{
          const donors=ff.slice(0,2),recipients=random(ours).slice(0,2);D(ff);
          donors.forEach((t,i)=>{const removed=cleanse(t,Infinity,s=>['attackUp','armorUp'].includes(s.type));for(const s of removed)B(recipients[i%recipients.length],s.type,s.power,2);});return;
        }
        case 'cuu_trieu':{const list=[...ff,...back(all).filter(t=>t.slot%3===actor.slot%3).slice(0,1)];D(list,base,{type:'true'});strip(list,1);energy(actor,actor,25,'drum');return;}
        case 'thach_mong':D(ff);B(ff,'taunted',0,2,{polarity:'debuff'});for(const t of ff)siphon(actor,t,15);return;
        case 'to_linh':D(ff);for(const t of ff)displace(actor,t,'half');B(ff,'speedDown',0.3);return;
        case 'bach_dien':{const t=target||weakest(all)[0],r=rules(actor,action);const execute=t&&ratio(t)<n(r.executeRatio,.4);D(t,n(r.multiplier,2.4),{type:'elemental',forceCrit:execute,critical:execute});if(execute)B(t,'magicArmorDown',n(r.magicArmorDown,.5),n(r.turns,2));return;}
        default:D(target);return; // Legacy test opponent; no invented S+ kit.
      }
    }
    switch(k){
      case 'co_trong':{const r=rules(actor,action);for(const t of ours)energy(actor,t,r.rage,'ancient-machine');B(ours,'reflectPhysical',r.reflect,r.turns);return;}
      case 'cuong_dong':B(all,'taunted',0,2,{polarity:'debuff'});B(actor,'armorUp',0.6,2);B(actor,'hardControlImmune',0,2);return;
      case 'lac_an':{const r=rules(actor,action);let t=forced||target||weakBack;for(let i=0;i<r.hits&&alive(actor);i++){if(!alive(t))t=strongest(foes(actor))[0];if(!t)break;D(t,defaults.singleUltimateMultiplier/r.hits*Math.pow(1+r.growth,i),{hitIndex:i,hitCount:r.hits});}return;}
      case 'hac_pha':for(const t of ff)breakShield(actor,t);D(ff,2);B(ff.find(t=>t.slot===1)||opp,'stun',0,rules(actor,action).stun);return;
      case 'thiet_lanh':for(const t of ff)breakShield(actor,t);D(ff);B(ff,'stun',0,1);return;
      case 'minh_toa':{const t=forced||enragedBack(all),r=rules(actor,action);D(t,defaults.singleUltimateMultiplier);B(t,'hardSilence',0,r.turns);B(t,'noExtraTurn',0,r.turns);energy(actor,t,-r.rageDrain,'iron-lock');return;}
      case 'thiem_ngan':H(ours,0.35);B(ours,'resistUp',0.3,2);B(ours,'deathWard',0,2,{charges:1});return;
      case 'linh_dong':D(all);B(all,'silence',0,1);return;
      case 'tieu_hon':D(strongestEnemy,defaults.singleUltimateMultiplier);energy(actor,strongestEnemy,-n(strongestEnemy?.energy),'soul-empty');B(strongestEnemy,'silence',0,1);return;
      case 'thach_kinh':{const r=rules(actor,action);B(ours,'magicResist',r.magicResist,r.turns);S(of,r.shield);return;}
      case 'han_nuong':hits(all,3,base);B(all,'armorDown',0.4);B(all,'magicArmorDown',0.4);return;
      case 'vong_co':D(all);for(const t of enraged(all).slice(0,2))energy(actor,t,-t.energy,'forgetting');B(all,'damageDown',0.3,2);return;
      case 'co_nuong':{let dealt=D(all);for(const t of all)dealt+=detonate(t,s=>s.type==='parasite');const recipients=ours.filter(t=>t!==actor);for(const t of recipients)heal(actor,t,dealt*rules(actor,action).teamDrain/recipients.length);return;}
      case 'muc_chieu':{
        H(ours,0.35);for(const t of ours)cleanse(t,Infinity,s=>s.type==='silence'||s.type==='hardSilence');const recipients=ours.filter(t=>t!==actor),mean=recipients.reduce((sum,t)=>sum+ratio(t),0)/Math.max(1,recipients.length);
        // Incoming equalization is healing and obeys anti-heal/conversion.
        // Donating health never kills the donor or invokes damage reflection.
        for(const t of recipients){const before=t.hp,desired=Math.max(1,Math.round(t.maxHp*mean));if(desired>before)heal(actor,t,desired-before);else t.hp=desired;emit('healthEqualize',actor,t,{amount:t.hp-before});cleanse(t,Infinity,s=>s.type==='silence'||s.type==='hardSilence');}return;
      }
      case 'thuy_co':H(ours,rules(actor,action).heal);for(const t of ours)cleanse(t);B(ours,'speedUp',0.25,2);return;
      case 'ha_lang':D(all);B(all,'attackDown',0.3);return;
      case 'giang_quan':D(ff);B(ff,'root',0,2,{blocksMelee:true});return;
      case 'thuy_ngoc':H(ob,0.2);for(const t of ob)energy(actor,t,30,'pearl-ultimate');B(ob,'rageRate',.2,2);return;
      case 'hai_phong':D(all);B(all,'armorDown',0.4);return;
      case 'tram_chau':S(ours,0.3);B(ours,'damageToRage',0.5,1);B(all,'critDown',0.35,2);return;
      case 'da_xoa':{const t=weakBack;D(t,defaults.singleUltimateMultiplier,{type:'true',bypassGuard:true});if(t&&!alive(t))B(actor,'stealth',0,1);return;}
      case 'nung':B(actor,'armorUp',0.4,2);B(ff,'burn',0.03,2,{percentMaxHp:0.03,rawPerTick:actor.maxHp*0.03});return;
      case 'hoa_tieu':{hits(all,3,1.8);for(const t of all)detonate(t,isBurn,1.2);return;}
      case 'hoa_khieu':{
        for(const helper of strongest(ours.filter(u=>u!==actor)).slice(0,2)){
          if(!canUse(helper,'basic')){emit('assistBlocked',actor,helper);continue;}
          const t=alive(strongestEnemy)?strongestEnemy:strongest(foes(helper))[0];if(!t)break;
          emit('assist',actor,helper,{targetId:t.id});damage(helper,t,{multiplier:1,action:'basic'});energy(helper,helper,defaults.basicRage,'assist-basic');
        }return;
      }
      case 'cuu_tinh':{
        let dealt=D(all);for(const t of all){const s=status(t,'bloodDebt');if(s){const stacks=s.stacks;remove(t,x=>x===s,'detonate');dealt+=D(t,stacks*0.2,{secondary:true});}}
        heal(actor,actor,dealt*0.2);return;
      }
      case 'hoa_bai':{const burning=all.filter(t=>statuses(t).some(isBurn));hits(all,3,1.5);for(const t of all)detonate(t,s=>s.type==='brimstone'&&s.zone);B(burning,'stun',0,1);return;}
      case 'hac_dao':{const t=tankiest(all)[0],list=t?[t,...adjacent(t,all).slice(0,4)]:[];D(list,defaults.singleUltimateMultiplier);B(list,'antiHeal',1,2);return;}
      case 'hoa_duc':{
        H(ours,0.3);B(ours,'critUp',0.25);let pool=0;
        for(const t of all)for(const s of statuses(t).filter(isBurn)){pool+=n(s.rawPerTick,t.maxHp*n(s.percentMaxHp,s.power))*s.stacks*Math.max(0,n(s.ticksLeft));if(s.zone)for(let i=zones.length-1;i>=0;i--)if(zones[i].sourceId===s.sourceId&&zones[i].team===t.team&&zones[i].slot===t.slot)zones.splice(i,1);remove(t,x=>x===s,'healing-detonation');}
        for(const t of ours)heal(actor,t,pool/Math.max(1,ours.length));return;
      }
      case 'mien_nuong':H(ours,0.25);B(ours,'resistUp',0.2,2);B(ours,'regen',0.06,2,{beginRound:true,ticksLeft:2});return;
      case 'tram_tue':D(all);B(all,'attackDown',0.3,2);B(all,'actionSlow',0.4,2);for(const t of all)emit('actionDelay',actor,t,{fraction:.4});return;
      case 'hac_hoa':D(ff);B(ff,'antiHeal',1,2);B(ff,'root',0,1);return;
      case 'tam_nuong':D(all);B(ff,'paralysis',0,1);H(ours,0.25);return;
      case 'son_cuong':{
        const col=all.filter(t=>t.slot%3===actor.slot%3),killsBefore=n(actor.kills);D(col,2.1,{forceCrit:true});for(const t of col)detonate(t,s=>s.type==='bleed'||s.type==='resinBleed');
        if(n(actor.kills)>killsBefore&&alive(actor)){emit('recast',actor,actor);const remaining=foes(actor).filter(t=>t.slot%3===actor.slot%3);D(remaining.length?remaining:[opposite(actor,foes(actor))],2.1,{forceCrit:true});}return;
      }
      case 'tue_y':{
        H(ours,0.4);for(const t of ours)cleanse(t);
        const fallen=units.filter(t=>t.team===actor.team&&!alive(t)).sort((a,b)=>n(b.splus.memory.deathSequence)-n(a.splus.memory.deathSequence)||bySlot(a,b))[0];
        if(fallen&&!actor.splus.memory.reviveUsed){actor.splus.memory.reviveUsed=true;fallen.dead=false;fallen.hp=Math.round(fallen.maxHp*0.5);fallen.energy=50;fallen.statuses=[];fallen.defeatedAt=0;emit('resurrect',actor,fallen,{hp:fallen.hp,energy:50});}return;
      }
      case 'mang_xa':{
        D(all);for(const t of all)for(const s of statuses(t).filter(s=>s.type==='viperPoison'||s.type==='poison')){const raw=n(s.rawPerTick,t.maxHp*n(s.percentMaxHp,s.power))*s.stacks*Math.max(0,n(s.ticksLeft));remove(t,x=>x===s,'detonate');D(t,0,{raw,type:'true',secondary:true,noTriggers:true});}
        B(all,'blind',0.4,2,{charges:1});return;
      }
      case 'khaos':hits(all,3,base,{type:'true',bypassShield:true});B(all,'moveSlow',.3,2);return;
      case 'kinh_nuong':B(ours,'reflectSkills',0.35,1);return;
      case 'hoi_anh':{
        D(all);const movable=all.filter(canMove),slots=random(movable.map(t=>t.slot));for(let i=0;i<movable.length;i++){const t=movable[i],old=t.slot;t.slot=slots[i];emit('displacement',actor,t,{from:old,to:t.slot});}
        syncZones();B(random(all).slice(0,2),'stun',0,1);return;
      }
      case 'van_phap':for(const t of ours){const removed=cleanse(t);H(t,removed.length*0.05);}airborne(all);return;
      case 'cuu_trieu':hits(all,9,1.8);return;
      case 'thach_mong':{S(ours,0.35);const stored=n(actor.splus.memory.intercepted);for(const t of all)D(t,0,{raw:stored*0.3,type:'true',secondary:true});actor.splus.memory.intercepted=0;return;}
      case 'to_linh':B(all,'timeFreeze',0,1);return;
      case 'ky_van':{
        const r=rules(actor,action);
        for(const t of all){
          D(t,n(r.multiplier,1.2),{type:'elemental'});
          // One proc per target per cast: the 3 visual bolts do not roll again.
          if(!alive(t)||rng('splus.ky-van-stun')>=clamp(n(r.stunChance,.3)))continue;
          const stun=buff(actor,t,'stun',0,null,{remainingTurns:1});
          // Preserve native resistance, immunity and reflection ownership.
          if(stun&&(t.statuses||[]).includes(stun))buff(actor,t,'antiHeal',1,null,{remainingTurns:1});
        }
        return;
      }
      case 'bach_dien':{const t=target||strongestEnemy,r=rules(actor,action);D(t,n(r.multiplier,4.2),{type:'elemental'});if(t&&alive(t)){const stolen=n(t.atk)*n(r.stealAtk,.25);B(t,'attackDown',n(r.stealAtk,.25),n(r.turns,2));B(actor,'attackUp',stolen/Math.max(1,n(actor.atk)),n(r.turns,2));B(t,'stun',0,n(r.lockTurns,1));B(t,'antiHeal',1,n(r.lockTurns,1));B(t,'buffBan',0,n(r.lockTurns,1));}return;}
      default:D(target,defaults.singleUltimateMultiplier);return;
    }
  }
  return {schema:'luc-than-splus-combat/v2',profileVersion:'splus-profile/2026-09-08-v2',units,events,unit,start,beginTurn,beginRound,finishRound,consumeTurnStatuses,act,resolveTieuPhongImpact,finishTieuPhongCast,resolveTichDaoImpact,finishTichDaoCast,damage,consumeHitAttempt,heal,shield,gainRage:energy,addStatus,restoreStatus,extendStatus,storedDotDamage,cleanse,hasStatus:(targetId,type)=>has(unit(targetId),type),modifiers,stat,canUse,canMove,targets,chooseAction,hud,get round(){return round;}};
}


