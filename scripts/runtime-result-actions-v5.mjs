import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');

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
