import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveBattleAiIntent } from '../src/combat-domain/ai-intent.mjs';

export function patchBattleAiProgress(input) {
  let html = input;
  const once = (from, to) => {
    if (html.split(from).length !== 2) throw new Error('AI progress anchor: ' + from.slice(0, 100));
    html = html.replace(from, () => to);
  };
  once('if(actor.energy>=60 && (actor.energy>=ultThreshold || emergencyHeal || executeWindow)){',
    'if(Core.canUseAction(actor,"ultimate") && actor.energy>=60 && (actor.energy>=ultThreshold || emergencyHeal || executeWindow)){');
  once('  function decideAi(actor){', `  /* HV_BATTLE_AI_PROGRESS_V1 */
  const __hvResolveAiIntent=(${resolveBattleAiIntent.toString()});
  async function __hvRunAiTurn(actor,battleId){
    if(state.battleId!==battleId||state.mode!=='battle'||state.currentId!==actor.id)return;
    const intent=__hvResolveAiIntent(actor,decideAi(actor),{
      canUse:(unit,action)=>Core.canUseAction(unit,action),
      targets:legalTargetsFor,preferred:preferredTargetFor
    });
    if(intent){if(intent.action!=='skill')actor._talentSkillActive=false;state.locked=false;await performAction(actor,intent.action,intent.target);return;}
    // No legal action/target: consume this turn through the existing scheduler.
    // Never retry a partially executed action or create another combat timer.
    actor._talentSkillActive=false;
    state.currentId=null;state.selectedAction=null;state.locked=true;
    updateTurnOrder();updateActorHud(null);
    addLog(actor.name+' không có hành động hợp lệ, chuyển lượt.');
    if(checkBattleEnd())return;
    if(await sleep(TIMING.turnRest,battleId))void advanceTurn();
  }
  function decideAi(actor){`);
  once('    const intent = decideAi(actor);\n    if (!intent || !intent.target) return;\n    state.locked = false;\n    await performAction(actor, intent.action, intent.target);',
    '    await __hvRunAiTurn(actor,battleId);');
  once('          const intent = decideAi(actor);\n          state.locked = false;\n          if (intent && intent.target) await performAction(actor, intent.action, intent.target);',
    '          await __hvRunAiTurn(actor,state.battleId);');
  return html;
}

export function installBattleAiProgress(root) {
  const file = join(root, 'dist', 'battle.html');
  writeFileSync(file, patchBattleAiProgress(readFileSync(file, 'utf8')));
}
