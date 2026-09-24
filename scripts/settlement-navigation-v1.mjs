import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');
const messageMarker = 'parent.postMessage({';
const protocolPrefix = 'parent.postMessage({schema:"hon-viet-battle/v1",schemaVersion:1,sequence:(window.__HV_MESSAGE_SEQUENCE=(window.__HV_MESSAGE_SEQUENCE||0)+1),origin:location.origin,';
const messageCount = (battle.match(/parent\.postMessage\(\{/g) || []).length;
if (messageCount < 8) throw new Error('Battle message bridge markers not found');
if (battle.includes('schema:"hon-viet-battle/v1"')) {
  throw new Error('Battle protocol already installed');
}
battle = battle.split(messageMarker).join(protocolPrefix);
const hostMessageMarker = 'const message = { source: "hon-viet-battle", type, payload };';
if (battle.split(hostMessageMarker).length !== 2) throw new Error('Canonical battle message helper not found/ambiguous');
battle = battle.replace(hostMessageMarker, 'const message = {schema:"hon-viet-battle/v1",schemaVersion:1,sequence:(window.__HV_MESSAGE_SEQUENCE=(window.__HV_MESSAGE_SEQUENCE||0)+1),origin:location.origin,source:"hon-viet-battle",type,payload};');
writeFileSync(battlePath, battle);

const indexPath = join(process.cwd(), 'dist', 'index.html');
let index = readFileSync(indexPath, 'utf8');

const hookPattern = /function applyLegacyMetaWinHooks\(payload\) \{[\s\S]*?\n  \}\n\n  function closeOverlay/;
if (!hookPattern.test(index)) throw new Error('Battle settlement hook marker not found');
const newHooks = [
'function applyLegacyMetaWinHooks(payload) {',
'    const playerUnits=Array.isArray(payload.units)?payload.units.filter(u=>u&&u.team==="player"):[];',
'    const survivors=playerUnits.filter(u=>Number(u.hp)>0).length;',
'    const petBond=typeof petBondActivity==="function"?petBondActivity("battle",{win:Boolean(payload.win),alive:survivors,mode:ST.mode||null}):null;',
'    if (!payload.win) return;',
'    const payloadGold = Array.isArray(payload.rewards) ? payload.rewards.find(r=>r&&r.id==="gold") : null;',
'    const gold = Math.max(0, Math.round(Number(payloadGold?.value) || (ST.mode === "train" ? 140 : 180)));',
'    const battleSession=safeText(payload.sessionId,safeText(payload.battleId,"battle"));',
'    const commandId="battle.settlement:"+battleSession+":"+safeText(payload.battleId,"battle");',
'    const transaction=window.HonVietTransaction?.commit?.({',
'      commandId,',
'      transactionId:commandId,',
'      reward:{gold},',
'      source:"battle.settlement",',
'      mutate:()=>({ok:true,battleId:safeText(payload.battleId,"battle"),win:true})',
'    });',
'    if (!transaction?.ok) {',
'      if (typeof toast==="function") toast("Kết quả trận chưa được lưu; chưa phát phần thưởng.");',
'      return;',
'    }',
'    if (!transaction.duplicate && typeof questProgress === "function") {',
'      questProgress("win", 1);',
'      const signatureCount = Math.max(0, Math.round(payload.playerSignatureActions || 0));',
'      if (signatureCount) questProgress("skill", signatureCount);',
'      if (ST.mode === "train") questProgress("train", 1);',
'    }',
'    if (typeof refreshResbar === "function") refreshResbar();',
'    if (typeof toast === "function") toast("Thắng trận bằng engine Hồn Việt · +🪙 "+gold+(typeof petBondSuffix==="function"?petBondSuffix(petBond):""));',
'  }',
'',
'  function closeOverlay'
].join("\n");
index = index.replace(hookPattern, newHooks);

if (index.includes('id="samkok-r08-settlement-navigation"')) {
  throw new Error('Settlement navigation controller already installed');
}
const controller = [
'<script id="samkok-r08-settlement-navigation">',
'(()=>{',
'  "use strict";',
'  const SCHEMA="hon-viet-battle/v1";',
'  const TYPES=new Set(["battle-ready","battle-result","battle-nav","battle-abort","battle-preset-save","battle-preset-apply","battle-tactics-change","battle-build-change","battle-roster-change"]);',
'  const sequenceBySession=new Map();',
'  const status={phase:"idle",activeSessionId:null,lastSequence:0,lastType:null,blocked:0,settlementKey:null};',
'  const frameFor=()=>document.getElementById("hvBattleFrame");',
'  const sameFrame=event=>{const frame=frameFor();return Boolean(frame&&event.source===frame.contentWindow);};',
'  const blocked=(event,code)=>{event.stopImmediatePropagation();status.blocked+=1;status.lastType=code;};',
'  window.addEventListener("message",(event)=>{',
'    const message=event.data;',
'    if(!message||message.source!=="hon-viet-battle"||!sameFrame(event))return;',
'    if(event.origin!==location.origin||message.origin!==location.origin||message.schema!==SCHEMA||message.schemaVersion!==1){blocked(event,"invalid-protocol");return;}',
'    if(!TYPES.has(message.type)){blocked(event,"invalid-type");return;}',
'    const sessionId=String(message.payload?.sessionId||"");',
'    const sequence=Number(message.sequence);',
'    if(!sessionId||!Number.isInteger(sequence)||sequence<1){blocked(event,"invalid-sequence");return;}',
'    const last=sequenceBySession.get(sessionId)||0;',
'    if(sequence<=last){blocked(event,"duplicate-sequence");return;}',
'    if(message.type!=="battle-ready"&&status.activeSessionId&&sessionId!==status.activeSessionId){blocked(event,"stale-session");return;}',
'    if(message.type==="battle-result"&&typeof window.HonVietMetaBridge?.isActive==="function"&&!window.HonVietMetaBridge.isActive()){blocked(event,"inactive-session");return;}',
'    sequenceBySession.set(sessionId,sequence);',
'    if(sequenceBySession.size>20) sequenceBySession.delete(sequenceBySession.keys().next().value);',
'    if(message.type==="battle-ready"){status.phase="running";status.activeSessionId=sessionId;status.lastSequence=sequence;status.lastType=message.type;return;}',
'    if(message.type==="battle-result"){',
'      if(status.activeSessionId!==sessionId||status.phase==="settling"||status.phase==="settled"){blocked(event,"duplicate-result");return;}',
'      status.phase="settling";status.settlementKey=sessionId+":"+sequence;status.lastSequence=sequence;status.lastType=message.type;return;',
'    }',
'    status.lastSequence=sequence;status.lastType=message.type;',
'  },true);',
'  window.addEventListener("message",(event)=>{',
'    const message=event.data;',
'    if(message?.source!=="hon-viet-battle"||message.type!=="battle-result"||!sameFrame(event))return;',
'    if(status.settlementKey===String(message.payload?.sessionId||"")+":"+Number(message.sequence)){',
'      status.phase="settled";status.lastType=message.type;status.settledAt=Date.now();',
'    }',
'  });',
'  window.HonVietSettlementController=Object.freeze({state:()=>({...status})});',
'})();',
'</script>'
].join("\n");
if (!index.includes('</body>')) throw new Error('Document body marker not found');
index = index.replace('</body>', controller + '\n</body>');
writeFileSync(indexPath, index);
console.log('R08 settlement/navigation installed: protocol guard, one-result controller and reward commit');
