import {readFileSync,writeFileSync} from 'node:fs';import{join}from'node:path';import{tickMixedStatuses}from'../src/domain/combat/mixed-status-tick.mjs';
export function patchMixedStatusTick(html){if(html.includes('/* HV_MIXED_STATUS_TICK_V1 */'))return html;
 const anchor='  const LegacyCore=globalThis.HonVietCore;';const old="tickStatuses:u=>splusCombat()?(['basic','skill','ultimate'].some(a=>splusCombat().canUse(u,a))?[]:[{type:'control'}]):LegacyCore.tickStatuses(u),";
 if(html.split(anchor).length!==2||html.split(old).length!==2)throw new Error('Mixed status tick owner anchor missing');
 return html.replace(anchor,'/* HV_MIXED_STATUS_TICK_V1 */\n'+tickMixedStatuses.toString()+'\n'+anchor).replace(old,'tickStatuses:u=>tickMixedStatuses(u,LegacyCore,splusCombat()),');}
export function installMixedStatusTick(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchMixedStatusTick(readFileSync(p,'utf8')));}
