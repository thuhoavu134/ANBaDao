import {patchActionDamageTotal,actionDamageTotalSources} from './action-damage-total-v1.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

export function patchBattleHitFeedback(html,runtime){
  if(html.includes('/* HV_BATTLE_HIT_FEEDBACK_V1 */'))return html;
  const once=(from,to)=>{
    if(html.split(from).length!==2)throw Error('Hit feedback anchor missing/ambiguous: '+from.slice(0,100));
    html=html.replace(from,()=>to);
  };
  const start=html.indexOf('  function addFloater(unit, text, color, large = false) {');
  const end=html.indexOf('\n\n  function burst(',start);
  if(start<0||end<0)throw Error('Hit feedback floater owner missing');
  html=html.slice(0,start)+'/* HV_BATTLE_HIT_FEEDBACK_V1 */\n'+runtime+'\n  function addFloater(unit, text, color, large = false) {\n    addBattleHitFloater(unit,text,color,large);\n  }'+html.slice(end);
  once('floater.life -= delta * (floater.isDamage?0.58:0.82);\n      floater.y -= delta * (floater.isDamage?27:42);\n      floater.x += floater.drift * delta;',
    'updateBattleHitFloater(floater,delta);');
  // Install before all per-hero early returns, but after the defeat visibility guard.
  const guard='    if (!unit || (unit.hp <= 0 && !defeatState(unit, time).visible)) return;';
  once(guard,guard+'\n    drawBattleFootShadow(context,unit,time);');
  once('    context.fillStyle = alive ? "rgba(0,0,0,.35)" : "rgba(0,0,0,.18)";\n    context.beginPath();\n    context.ellipse(unit.x, unit.y + 4, 37 * depthScale, 12 * depthScale, 0, 0, Math.PI * 2);\n    context.fill();',
    '    // Ground shadow is painted once by drawBattleFootShadow before hero dispatch.');
  return html;
}
export function installBattleHitFeedback(root){
  const path=join(root,'dist/battle.html');
  const feedback=patchBattleHitFeedback(readFileSync(path,'utf8'),readFileSync(join(root,'src/runtime/battle-hit-feedback.js'),'utf8'));
  writeFileSync(path,patchActionDamageTotal(feedback,...actionDamageTotalSources(root))); 
}
