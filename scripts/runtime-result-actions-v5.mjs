import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');

// The combat engine is wrapped in its own IIFE, so the result functions and
// state are not visible to the older result-overlay scripts. Expose a narrow
// closure-backed API from inside that engine before patching the outer bridges.
const engineHook = "  if(dom.supportCallButton)dom.supportCallButton.addEventListener('click',useSupportCall);";
if (!battle.includes(engineHook)) throw new Error('battle result engine hook not found');
const engineApi = `  window.__HV_BATTLE_RESULT_API=Object.freeze({embedded:()=>EMBEDDED,sessionId:()=>EMBED_CONFIG.sessionId||'',publish:()=>{try{return publishBattleResult();}catch(error){console.error('Không thể gửi kết quả trận Hồn Việt.',error);return false;}},continue:()=>{try{return continueFromBattleResult();}catch(error){console.error('Không thể tiếp tục sau kết quả trận Hồn Việt.',error);return false;}}});\n${engineHook}`;
battle = battle.replace(engineHook, engineApi);

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
(()=>{if(window.__qaResultActionsV2)return;window.__qaResultActionsV2=true;const handle=(ev)=>{const b=ev.target?.closest?.('#integratedResultV6 [data-result-action]');if(!b)return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();const a=b.dataset.resultAction,label=String(b.textContent||'').trim(),isNext=a==='next'||label==='Ải sau',api=window.__HV_BATTLE_RESULT_API,embedded=!!api?.embedded?.();if(a==='confirm'){if(embedded)api?.publish?.();else api?.continue?.();return;}if(isNext){try{if(embedded){api?.publish?.();window.__hideIntegratedResultV6?.();}else api?.continue?.();}catch(error){console.error('Không thể xử lý nút Ải sau.',error);}return;}if(a==='back'){try{if(embedded)parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:api?.sessionId?.()||'',target:'campaign'}},'*');else nav('campaign');}catch(_e){}}};document.addEventListener('click',handle,true);document.addEventListener('touchend',handle,{capture:true,passive:false});})();
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
  "const a=b.dataset.resultAction;const label=String(b.textContent||'').trim();const isVictoryNext=a==='next'||label==='Ải sau';const isBack=a==='back'&&!isVictoryNext;const api=window.__HV_BATTLE_RESULT_API;"
);

const embeddedConfirm = "try{if(embeddedByUrl){parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:sessionIdByUrl,target:'campaign'}},'*');return;}}catch(_e){}";
if (!bridge.includes(embeddedConfirm)) throw new Error('embedded confirm handler not found');
bridge = bridge.replace(
  embeddedConfirm,
  "try{if(embeddedByUrl){api?.publish?.();return;}}catch(error){console.error('Không thể gửi kết quả trận Hồn Việt.',error);return;}"
);

if (!bridge.includes("if(a==='next'){")) throw new Error('next handler not found');
if (!bridge.includes("if(a==='back'){")) throw new Error('back handler not found');
bridge = bridge.replace("if(a==='next'){", 'if(isVictoryNext){');
bridge = bridge.replace("if(a==='back'){", 'if(isBack){');
bridge = bridge.replace(
  "if(embeddedByUrl){state.resultPublished=false;publishBattleResult();return;}",
  "if(embeddedByUrl){api?.publish?.();return;}"
);
bridge = bridge.replace(
  "continueFromBattleResult();",
  "api?.continue?.();"
);
bridge = bridge.replace(
  "try{parent.postMessage({source:'hon-viet-battle',type:'battle-nav',payload:{sessionId:sessionIdByUrl,target:'campaign'}},'*');}catch(_e2){}",
  "try{console.error('Không thể gửi kết quả trận Hồn Việt.');}catch(_e2){}"
);

battle = battle.slice(0, start) + bridge + battle.slice(end);
writeFileSync(battlePath, battle);
console.log('Result actions v5 applied: embedded confirm publishes the result and the visible Ải sau label always follows the next-stage path');
