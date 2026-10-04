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
export function installMixedDamageSettlement(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchMixedDamageSettlement(readFileSync(p,'utf8')));}
