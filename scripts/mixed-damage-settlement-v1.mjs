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
export function installMixedDamageSettlement(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchLegacyCounterAndCritical(patchMixedDamageSettlement(readFileSync(p,'utf8'))));}
