import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');

// There is an older capture bridge from the result-v2 patch as well. It runs on
// click before v4 and used to route the embedded confirm action to the hub. Give
// that bridge the same label-aware semantics so pointerdown and click cannot
// disagree about the result action.
const v2Marker = 'window.__qaResultActionsV2';
const v2MarkerAt = battle.indexOf(v2Marker);
if (v2MarkerAt < 0) throw new Error('qa-result-actions-v2 bridge not found');
const v2Open = battle.lastIndexOf('<script', v2MarkerAt);
const v2CodeStart = battle.indexOf('>', v2Open) + 1;
const v2End = battle.indexOf('</script>', v2MarkerAt);
if (v2Open < 0 || v2CodeStart <= 0 || v2End < 0) throw new Error('qa-result-actions-v2 script boundary not found');
const v2Bridge = `
(()=>{if(window.__qaResultActionsV2)return;window.__qaResultActionsV2=true;const handle=(ev)=>{const b=ev.target?.closest?.('#integratedResultV6 [data-result-action]');if(!b)return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();const a=b.dataset.resultAction,label=String(b.textContent||'').trim(),isNext=a==='next'||label==='Ải sau';if(a==='confirm'){if(typeof EMBEDDED!=='undefined'&&EMBEDDED){try{publishBattleResult();}catch(_e){}}else try{continueFromBattleResult();}catch(_e){}return;}if(isNext){try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED){publishBattleResult();window.__hideIntegratedResultV6?.();}else continueFromBattleResult();}catch(_e){try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');}catch(_e2){}}return;}if(a==='back'){try{if(typeof EMBEDDED!=='undefined'&&EMBEDDED)parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:EMBED_CONFIG?.sessionId||'',target:'campaign'}},'*');else nav('campaign');}catch(_e){}}};document.addEventListener('click',handle,true);document.addEventListener('touchend',handle,{capture:true,passive:false});})();
`;
battle = battle.slice(0, v2CodeStart) + v2Bridge + battle.slice(v2End);

// The v4 bridge was already the capture-phase owner of the result buttons. Patch
// that bridge in the generated HTML so its semantics cannot be shadowed by the
// older inline handlers or by Safari's synthetic click sequence.
const marker = 'id="qa-result-actions-v4"';
const start = battle.indexOf(marker);
if (start < 0) throw new Error('qa-result-actions-v4 bridge not found');
const end = battle.indexOf('</script>', start);
if (end < 0) throw new Error('qa-result-actions-v4 closing tag not found');

let bridge = battle.slice(start, end);
const actionLine = "const a=b.dataset.resultAction;";
if (!bridge.includes(actionLine)) throw new Error('result action line not found');
bridge = bridge.replace(
  actionLine,
  "const a=b.dataset.resultAction;const label=String(b.textContent||'').trim();const isVictoryNext=a==='next'||label==='Ải sau';const isBack=a==='back'&&!isVictoryNext;"
);

const embeddedConfirm = "try{if(embeddedByUrl){parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:sessionIdByUrl,target:'campaign'}},'*');return;}}catch(_e){}";
if (!bridge.includes(embeddedConfirm)) throw new Error('embedded confirm handler not found');
bridge = bridge.replace(
  embeddedConfirm,
  "try{if(embeddedByUrl){if(typeof publishBattleResult==='function'){state.resultPublished=false;publishBattleResult();return;}}}catch(_e){}"
);

if (!bridge.includes("if(a==='next'){")) throw new Error('next handler not found');
if (!bridge.includes("if(a==='back'){")) throw new Error('back handler not found');
bridge = bridge.replace("if(a==='next'){", 'if(isVictoryNext){');
bridge = bridge.replace("if(a==='back'){", 'if(isBack){');

battle = battle.slice(0, start) + bridge + battle.slice(end);
writeFileSync(battlePath, battle);
console.log('Result actions v5 applied: embedded confirm publishes the result and the visible Ải sau label always follows the next-stage path');
