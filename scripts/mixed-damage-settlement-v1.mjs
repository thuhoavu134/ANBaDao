import{settleLegacyStatusRemoval}from'../src/domain/combat/legacy-status-settlement.mjs';
import{restoreLegacyPrimer}from'../src/domain/combat/legacy-primer-recovery.mjs';
import{settleLegacyShield,rollbackLegacyShieldGrant}from'../src/domain/combat/legacy-shield-settlement.mjs';
import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';import{settleLegacyDamage}from'../src/domain/combat/legacy-damage-settlement.mjs';
export function patchMixedDamageSettlement(html){
 if(html.includes('/* HV_MIXED_DAMAGE_SETTLEMENT_V1 */'))return html;
 const start=html.indexOf('  function __hvApplyDamage3qAdapter('),end=html.indexOf('  function applyHeal(',start);if(start<0||end<0)throw new Error('Mixed damage adapter owner missing');
 let adapter=html.slice(start,end);const a=adapter.indexOf('    if(target.shield>0){ const absorbed='),b=adapter.indexOf('    target.hp-=amount;',a);if(a<0||b<0)throw new Error('Legacy direct HP settlement anchor missing');
 adapter=adapter.slice(0,a)+`    const impact=settleLegacyDamage(actor,target,amount,{combat:typeof splusCombat==='function'?splusCombat():null,action:tacticalAction,critical});
    amount=impact.amount;
    if(impact.shieldAbsorbed>0)addFloater(target,\`⛊\${impact.shieldAbsorbed}\`,"#7de3d0");
    if(impact.blocked){addFloater(target,impact.blockReason==='immune'?'MIỄN':impact.blockReason==='basicReflected'?'PHẢN':'CHẶN',"#9fe8ff",true);return 0;}
`+adapter.slice(b+'    target.hp-=amount;'.length);
 const once=(from,to)=>{if(adapter.split(from).length!==2)throw new Error('Mixed kill-credit anchor missing: '+from);adapter=adapter.replace(from,to);};
 once('markDefeated(target); actor.kills=(actor.kills||0)+1;','markDefeated(target); if(!impact.engineOwned)actor.kills=(actor.kills||0)+1;');
 once('gainEnergy(actor,12);','if(!impact.engineOwned)gainEnergy(actor,12);');
 return html.slice(0,start)+'/* HV_MIXED_DAMAGE_SETTLEMENT_V1 */\n'+settleLegacyDamage.toString()+'\n'+adapter+html.slice(end);
}
export function patchLegacyCounterAndCritical(html){
 if(html.includes('/* HV_LEGACY_COUNTER_CRITICAL_V1 */'))return html;
 const critical='const critical=Boolean(options.forceCrit||detail.critical);';
 if(html.split(critical).length!==2)throw new Error('Legacy critical presentation anchor missing');
 html=html.replace(critical,'/* HV_LEGACY_COUNTER_CRITICAL_V1 */\n    const critical=Boolean(!detail.criticalBlocked&&(options.forceCrit||detail.critical));');
 const start=html.indexOf('      if(target.counterReady && actor.hp>0){'),end=html.indexOf('\n    }\n    if(!REFERENCE_SIMPLE',start);
 if(start<0||end<0)throw new Error('Legacy ready-counter owner missing');
 const original=html.slice(start,end);
 if(!original.includes('actor.hp-=counter;')||!original.includes('Core.calculateDamage(target,actor,counterMult,0.5)'))throw new Error('Legacy ready-counter contract drift');
 const patched=original.replace('const counter=Math.min(actor.hp,Math.max(10,Math.round(Core.calculateDamage(target,actor,counterMult,0.5)))); actor.hp-=counter;',`const counterCombat=typeof splusCombat==='function'?splusCombat():null;
        const counterRaw=Math.max(10,Math.round(counterCombat?LegacyCore.calculateDamage(mixedStatView(target,counterCombat),mixedStatView(actor,counterCombat),counterMult,0.5):Core.calculateDamage(target,actor,counterMult,0.5)));
        const counterImpact=counterCombat?settleLegacyDamage(target,actor,counterRaw,{combat:counterCombat,secondary:true,noTriggers:true}):null;
        const counter=counterImpact?counterImpact.amount:Math.min(actor.hp,counterRaw);
        if(!counterCombat)actor.hp-=counter;
        if(counterImpact?.shieldAbsorbed>0)addFloater(actor,\`⛊\${counterImpact.shieldAbsorbed}\`,"#7de3d0");`)
   .replace('addFloater(actor,`PHẢN ${counter}`,"#f8df90");','if(counter>0)addFloater(actor,`PHẢN ${counter}`,"#f8df90");');
 if(patched===original)throw new Error('Ready-counter patch not applied');
 return html.slice(0,start)+patched+html.slice(end);
}
export function patchTeamReactionSettlement(html){
 if(html.includes('/* HV_TEAM_REACTION_SETTLEMENT_V1 */'))return html;
 const start=html.indexOf('  function applyReactionDamage('),end=html.indexOf('  function combatPresentationProfileFor(',start);
 if(start<0||end<0)throw new Error('Team reaction owner missing');
 let owner=html.slice(start,end);
 const before="    if(!target||target.hp<=0||amount<=0)return 0; let remaining=Math.max(0,Math.round(amount));";
 const shield="    if(target.shield>0){const absorbed=Math.min(target.shield,remaining);target.shield-=absorbed;remaining-=absorbed;if(absorbed)addFloater(target,`⛊${absorbed}`,'#7de3d0');}";
 const once=(from,to)=>{if(owner.split(from).length!==2)throw new Error('Team reaction contract drift: '+from);owner=owner.replace(from,to);};
 once(before,"    if(!actor||actor.hp<=0||!target||target.hp<=0||amount<=0)return 0;");
 once(shield,`    const impact=settleLegacyDamage(actor,target,Math.max(0,Math.round(amount)),{combat:typeof splusCombat==='function'?splusCombat():null,action:'skill',secondary:true,noTriggers:true});
    if(impact.shieldAbsorbed>0)addFloater(target,\`⛊\${impact.shieldAbsorbed}\`,'#7de3d0');`);
 once('const dealt=Math.min(target.hp,remaining); target.hp-=dealt;', 'const dealt=impact.amount;');
 once('markDefeated(target);actor.kills=(actor.kills||0)+1;', 'markDefeated(target);if(!impact.engineOwned)actor.kills=(actor.kills||0)+1;');
 once('gainEnergy(actor,12);','if(!impact.engineOwned)gainEnergy(actor,12);');
 once('    for(const unit of reactionTargetsFor(actor,kind,target)){','    for(const unit of reactionTargetsFor(actor,kind,target)){\n      if(!actor||actor.hp<=0)break;');
 return html.slice(0,start)+'/* HV_TEAM_REACTION_SETTLEMENT_V1 */\n'+owner+html.slice(end);
}
export function patchSupportDamageSettlement(html){
 if(html.includes('/* HV_SUPPORT_DAMAGE_SETTLEMENT_V1 */'))return html;
 const start=html.indexOf('  function useSupportCall('),end=html.indexOf('\n',start);
 if(start<0||end<0)throw new Error('Support call owner missing');
 const owner=html.slice(start,end);
 const before='const before=target.hp;target.hp=Math.max(0,target.hp-raw);const dealt=Math.max(0,Math.round(before-target.hp));';
 if(owner.split(before).length!==2)throw new Error('Support damage settlement contract drift');
 const after="const supportActor={...hero,id:'__support_'+String(hero.sourceId||hero.id),team:TEAM_PLAYER,hp:0,maxHp:1,energy:0,shield:0,statuses:[]};const impact=settleLegacyDamage(supportActor,target,raw,{combat:typeof splusCombat==='function'?splusCombat():null,action:'skill',secondary:true,noTriggers:true});const dealt=impact.amount;if(impact.shieldAbsorbed>0)addFloater(target,`⛊${impact.shieldAbsorbed}`,'#7de3d0');target.hpTween=null;const rec=intelUnit(target);if(rec)rec.damageTaken+=dealt;";
 return html.slice(0,start)+'/* HV_SUPPORT_DAMAGE_SETTLEMENT_V1 */\n'+owner.replace(before,after)+html.slice(end);
}
export function patchSupportBenefitSettlement(html){
 if(html.includes('/* HV_SUPPORT_BENEFIT_SETTLEMENT_V1 */'))return html;
 const start=html.indexOf('  function useSupportCall('),end=html.indexOf('\n',start);
 if(start<0||end<0)throw new Error('Support benefit owner missing');
 let owner=html.slice(start,end);
 const once=(from,to)=>{if(owner.split(from).length!==2)throw new Error('Support benefit contract drift: '+from);owner=owner.replace(from,to);};
 once('if(!hero)return false;const role=',"if(!hero)return false;const benefitCombat=typeof splusCombat==='function'?splusCombat():null;const benefitSource={...hero,id:'__support_'+String(hero.sourceId||hero.id),team:TEAM_PLAYER,hp:0,maxHp:1,energy:0,shield:0,statuses:[]};const role=");
 once('const shield=Math.max(1,Math.round(target.maxHp*.14));target.shield=Math.max(Number(target.shield)||0,shield);',"const requestedShield=Math.max(1,Math.round(target.maxHp*.14));const shield=benefitCombat?benefitCombat.shield(benefitSource,target,requestedShield,{floor:true}):Math.max(0,requestedShield-(Number(target.shield)||0));if(!benefitCombat)target.shield=Math.max(Number(target.shield)||0,requestedShield);");
 once("e.energy=Math.max(0,(e.energy||0)-12);addFloater(e,'NỘ −12','#9bc5ff',true);", "const drained=benefitCombat?-benefitCombat.gainRage(benefitSource,e,-12,'support-drain'):Math.min(12,e.energy||0);if(!benefitCombat)e.energy=Math.max(0,(e.energy||0)-12);addFloater(e,`NỘ −${drained}`,'#9bc5ff',true);");
 once('const heal=Math.max(1,Math.round(target.maxHp*.08));target.hp=Math.min(target.maxHp,target.hp+heal);target.energy=Math.min(100,(target.energy||0)+10);',"const legacyReduction=(target.statuses||[]).filter(s=>!s.splus&&s.type==='healDown').reduce((sum,s)=>sum+(Number(s.power)||.35),0);const requestedHeal=Math.round(Math.max(1,Math.round(target.maxHp*.08))*Math.max(.2,1-legacyReduction));const heal=benefitCombat?benefitCombat.heal(benefitSource,target,requestedHeal,{legacyImpact:true}):Math.min(target.maxHp-target.hp,requestedHeal);if(!benefitCombat)target.hp+=heal;const rage=benefitCombat?benefitCombat.gainRage(benefitSource,target,10,'support-gain'):Math.min(10,100-(target.energy||0));if(!benefitCombat)target.energy=Math.min(100,(target.energy||0)+10);target.hpTween=null;");
 once('`HỒI +${heal} · NỘ +10`','`HỒI +${heal} · NỘ +${rage}`');
 once('effect=`hỗ trợ ${target.name}`;', 'effect=`hỗ trợ ${target.name}: +${heal} HP · +${rage} Nộ`;');
 once('effect=`${enemies.length} địch mất 12 Nộ`;','effect=`${enemies.length} địch bị giảm tối đa 12 Nộ`;');
 html=html.slice(0,start)+'/* HV_SUPPORT_BENEFIT_SETTLEMENT_V1 */\n'+owner+html.slice(end);
 const copy='Làm toàn bộ địch mất 12 Nộ và khóa nhịp 1 lần.';
 if(html.split(copy).length!==2)throw new Error('Support controller copy drift');
 return html.replace(copy,'Giảm tối đa 12 Nộ của mỗi địch còn sống.');
}
export function patchSkillShieldSettlement(html){
 if(html.includes('/* HV_SKILL_SHIELD_SETTLEMENT_V1 */'))return html;
 const start=html.indexOf('  function __hvResolveAction3qAdapter('),end=html.indexOf('  function combatPresentationProfileFor(',start);
 if(start<0||end<0)throw new Error('Legacy skill shield owner missing');
 let owner=html.slice(start,end);
 const once=(from,to)=>{if(owner.split(from).length!==2)throw new Error('Legacy skill shield contract drift: '+from);owner=owner.replace(from,to);};
 const options="{combat:typeof splusCombat==='function'?splusCombat():null}";
 for(const pct of ['.20','.28'])once('const shield=Math.max(1,Math.round(friend.maxHp*'+pct+'));friend.shield=Math.max(friend.shield,shield);','const shield=settleLegacyShield(actor,friend,Math.max(1,Math.round(friend.maxHp*'+pct+')),'+options+');');
 once('friend.shield=Math.max(friend.shield,Math.round(friend.maxHp*0.16));','settleLegacyShield(actor,friend,Math.round(friend.maxHp*0.16),'+options+');');
 once('friend.shield=Math.max(friend.shield,Math.round(friend.maxHp*(kind==="guardAll"?0.18:0.12)*sustainShield));','settleLegacyShield(actor,friend,Math.round(friend.maxHp*(kind==="guardAll"?0.18:0.12)*sustainShield),'+options+');');
 once("if(r.shield){unit.shield=Math.max(Number(unit.shield)||0,r.shield);addFloater(unit,`⚗ ${r.name} +KHIÊN`,'#9ff5dd',true);}","if(r.shield){r.shield=settleLegacyShield(actor,unit,r.shield,"+options+");if(r.shield>0)addFloater(unit,`⚗ ${r.name} +KHIÊN ${r.shield}`,'#9ff5dd',true);}");
 return html.slice(0,start)+'/* HV_SKILL_SHIELD_SETTLEMENT_V1 */\n'+settleLegacyShield.toString()+'\n'+owner+html.slice(end);
}
export function patchTacticalShieldSettlement(html){
 if(html.includes('/* HV_TACTICAL_SHIELD_SETTLEMENT_V1 */'))return html;
 const options="{combat:typeof splusCombat==='function'?splusCombat():null}";
 const owner=(name,edit)=>{const start=html.indexOf('  function '+name+'('),end=html.indexOf('\n  function ',start+3);if(start<0||end<0)throw new Error('Tactical shield owner missing: '+name);let part=html.slice(start,end);const once=(from,to)=>{if(part.split(from).length!==2)throw new Error('Tactical shield contract drift: '+name+' '+from);part=part.replace(from,to);};edit(once);html=html.slice(0,start)+part+html.slice(end);};
 owner('rewardTacticalOpportunity',once=>once('const shield=Math.max(1,Math.round(weak.maxHp*.08));weak.shield=Math.max(Number(weak.shield)||0,shield);','const shield=settleLegacyShield(weak,weak,Math.max(1,Math.round(weak.maxHp*.08)),'+options+');'));
 owner('useCombatResource',once=>{once("actor?.team!==TEAM_PLAYER||","actor?.team!==TEAM_PLAYER||actor.hp<=0||");once('const shield=Math.max(1,Math.round((Number(ally.maxHp)||1)*.12));ally.shield=Math.max(Number(ally.shield)||0,shield);','const shield=settleLegacyShield(actor,ally,Math.max(1,Math.round((Number(ally.maxHp)||1)*.12)),'+options+');');});
 owner('useBattlefieldInteractable',once=>{once('!actor||actor.team!==TEAM_PLAYER||','!actor||actor.hp<=0||actor.team!==TEAM_PLAYER||');once('const shield=Math.max(1,Math.round((Number(actor.maxHp)||1)*.10));actor.shield=Math.max(Number(actor.shield)||0,shield);','const shield=settleLegacyShield(actor,actor,Math.max(1,Math.round((Number(actor.maxHp)||1)*.10)),'+options+');');});
 owner('useBattleOrder',once=>{once('!actor||actor.team!==TEAM_PLAYER||','!actor||actor.hp<=0||actor.team!==TEAM_PLAYER||');once('const r=Core.applyBattleOrder(orderId,allies,state.battleOrders);',"const orderCombat=typeof splusCombat==='function'?splusCombat():null;const r=Core.applyBattleOrder(orderId,allies,state.battleOrders,{grantShield:(u,minimum)=>settleLegacyShield(actor,u,minimum,{combat:orderCombat}),canBuff:u=>!orderCombat?.hasStatus(u,'buffBan')});");});
 owner('resolvePlanDisruption',once=>{once('addStatus(target,{type:"guard",turns:1,power:0});const added=Math.round(target.maxHp*.08);target.shield=Math.max(beforeShield,added);',"const fortifyCombat=typeof splusCombat==='function'?splusCombat():null;if(!fortifyCombat?.hasStatus(target,'buffBan'))addStatus(target,{type:'guard',turns:1,power:0});settleLegacyShield(target,target,Math.round(target.maxHp*.08),{combat:fortifyCombat});");once('nhận Guard và khiên 8% HP trước nhịp kết liễu.','nhận thêm ${snapshot.shieldAdded} khiên trước nhịp kết liễu.');});
 owner('activateAdaptivePending',once=>once('addStatus(target,{type:"guard",turns:weakened?1:2});target.shield=Math.max(target.shield||0,Math.round(target.maxHp*(weakened?0.06:0.12)));',"const adaptiveCombat=typeof splusCombat==='function'?splusCombat():null;if(!adaptiveCombat?.hasStatus(target,'buffBan'))addStatus(target,{type:'guard',turns:weakened?1:2});settleLegacyShield(target,target,Math.round(target.maxHp*(weakened?0.06:0.12)),{combat:adaptiveCombat});"));
 return html.replace('  function rewardTacticalOpportunity(', '/* HV_TACTICAL_SHIELD_SETTLEMENT_V1 */\n  function rewardTacticalOpportunity(');
}
export function patchLegacyStatusOwnership(html){
 if(html.includes('/* HV_LEGACY_STATUS_OWNERSHIP_V1 */'))return html;
 const once=(from,to)=>{if(html.split(from).length!==2)throw new Error('Legacy status ownership contract drift: '+from);html=html.replace(from,to);};
 once('    const existing = unit.statuses.find((candidate) => candidate.type === status.type);',"    const statusCombat=typeof splusCombat==='function'?splusCombat():null;\n    if((beneficialTypes.includes(status.type)||['beneficial','buff'].includes(status.polarity))&&statusCombat?.hasStatus(unit,'buffBan'))return;\n    const existing = unit.statuses.find((candidate) => !candidate.splus && candidate.type === status.type);");
 once('  function __hvAddStatus3qAdapter(unit, status) {','/* HV_LEGACY_STATUS_OWNERSHIP_V1 */\n'+settleLegacyStatusRemoval.toString()+'\n  function __hvAddStatus3qAdapter(unit, status) {');
 once('friend.statuses=friend.statuses.filter(s=>!["stun","fear","silence","atkDown","defDown","armorBreak","burn","bleed","poison"].includes(s.type));',"settleLegacyStatusRemoval(friend,['stun','fear','silence','atkDown','defDown','armorBreak','burn','bleed','poison'],{combat:typeof splusCombat==='function'?splusCombat():null});");
 once('target.statuses=(target.statuses||[]).filter(s=>!["guard","atkUp","speedUp","regen","evasionUp"].includes(s.type)); target.shield=0;',"settleLegacyStatusRemoval(target,['guard','atkUp','speedUp','regen','evasionUp'],{combat:typeof splusCombat==='function'?splusCombat():null,managedPolarity:'buff'}); target.shield=0;");
 once("canBuff:u=>!orderCombat?.hasStatus(u,'buffBan')}","canBuff:u=>!orderCombat?.hasStatus(u,'buffBan'),grantStatus:(u,s)=>{u.statuses=u.statuses.filter(x=>x.splus||x.type!==s.type);return addStatus(u,s);},cleanse:(u,types,count)=>settleLegacyStatusRemoval(u,types,{combat:orderCombat,count})}");
 return html;
}
export function patchPlanRecoverySettlement(html){
 if(html.includes('/* HV_PLAN_RECOVERY_SETTLEMENT_V1 */'))return html;
 const start=html.indexOf('  function usePlanRecovery('),end=html.indexOf('\n  function ',start+3);if(start<0||end<0)throw new Error('Plan recovery owner missing');let owner=html.slice(start,end);
 const once=(from,to)=>{if(owner.split(from).length!==2)throw new Error('Plan recovery contract drift: '+from);owner=owner.replace(from,to);};
 once('function usePlanRecovery(id,auto=false){',"function usePlanRecovery(id,auto=false){const actor=getUnit(state.currentId);if(state.mode!=='battle'||!actor||actor.hp<=0||actor.team!==TEAM_PLAYER||(!auto&&(state.locked||state.auto)))return false;");
 once(" let effect='none';", " if(!seq||(id!=='pivot'&&['unweave','fortify'].includes(pr.sourceDisruption)&&!(target?.hp>0)))return false;let effect='none';");
 once('target.shield=Math.max(Number(snap.shieldBefore)||0,(Number(target.shield)||0)-added);','rollbackLegacyShieldGrant(target,added,{minimum:snap.shieldBefore});');
 once("target.statuses=(target.statuses||[]).filter(s=>s.type!=='guard');", "settleLegacyStatusRemoval(target,['guard'],{combat:typeof splusCombat==='function'?splusCombat():null});");
 html=html.slice(0,start)+'/* HV_PLAN_RECOVERY_SETTLEMENT_V1 */\n'+rollbackLegacyShieldGrant.toString()+'\n'+owner+html.slice(end);
 const manual="const manual=state.mode==='battle'&&actor?.team===TEAM_PLAYER&&!state.locked&&!state.auto&&pr.available";
 if(html.split(manual).length!==2)throw new Error('Plan recovery manual eligibility drift');
 html=html.replace(manual,"const manual=state.mode==='battle'&&actor?.team===TEAM_PLAYER&&actor.hp>0&&!state.locked&&!state.auto&&pr.available");
 const eligibility="btn.disabled=!manual||!Core.canPlanRecover(pr,id,{orderPoints:state.battleOrders?.points,momentum:state.momentum?.value});";
 if(html.split(eligibility).length!==2)throw new Error('Plan recovery button eligibility drift');
 return html.replace(eligibility,"btn.disabled=!manual||(id!=='pivot'&&['unweave','fortify'].includes(pr.sourceDisruption)&&!(getUnit(pr.targetId)?.hp>0))||!Core.canPlanRecover(pr,id,{orderPoints:state.battleOrders?.points,momentum:state.momentum?.value});");
}
export function patchPrimerRecoveryOwnership(html){
 if(html.includes('/* HV_PRIMER_RECOVERY_OWNERSHIP_V1 */'))return html;
 const once=(from,to)=>{if(html.split(from).length!==2)throw new Error('Primer recovery contract drift: '+from);html=html.replace(from,to);};
 once('const removed=target.statuses.splice(idx,1)[0];',"const removed=settleLegacyStatusRemoval(target,[target.statuses[idx].type],{combat:typeof splusCombat==='function'?splusCombat():null,count:1})[0];");
 once("let effect='none';\n    if(id==='rebuild')", "const restored=pr.sourceDisruption==='unweave'&&id!=='pivot'?restoreLegacyPrimer(target,snap.removedStatus,{combat:typeof splusCombat==='function'?splusCombat():null,force:id==='force',addLegacyStatus:addStatus}):null;if(pr.sourceDisruption==='unweave'&&id!=='pivot'&&!restored)return false;let effect='none';\n    if(id==='rebuild')");
 once('upsertReactionStatus(target,{...snap.removedStatus,turns:Math.max(1,Number(snap.removedStatus.turns)||1)});','');
 once('upsertReactionStatus(target,{...snap.removedStatus,turns:1,power:Math.max(1,Math.round((Number(snap.removedStatus.power)||1)*.5))});','');
 once('  function resolvePlanDisruption(', '/* HV_PRIMER_RECOVERY_OWNERSHIP_V1 */\n'+restoreLegacyPrimer.toString()+'\n  function resolvePlanDisruption(');
 return html;
}
export function installMixedDamageSettlement(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchPrimerRecoveryOwnership(patchPlanRecoverySettlement(patchLegacyStatusOwnership(patchTacticalShieldSettlement(patchSkillShieldSettlement(patchSupportBenefitSettlement(patchSupportDamageSettlement(patchTeamReactionSettlement(patchLegacyCounterAndCritical(patchMixedDamageSettlement(readFileSync(p,'utf8'))))))))))));}
