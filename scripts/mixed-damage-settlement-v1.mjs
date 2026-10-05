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
export function installMixedDamageSettlement(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchSupportDamageSettlement(patchTeamReactionSettlement(patchLegacyCounterAndCritical(patchMixedDamageSettlement(readFileSync(p,'utf8'))))));}
