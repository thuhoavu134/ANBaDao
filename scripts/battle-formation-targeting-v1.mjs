import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function patchBattleFormationTargeting(input) {
  let html = input;
  const once = (from, to) => {
    if (html.split(from).length !== 2) throw new Error('Formation targeting anchor: ' + from.slice(0, 90));
    html = html.replace(from, () => to);
  };
  const replaceFunction = (name, next, source) => {
    const start = html.indexOf('  function ' + name + '(');
    const end = html.indexOf('  function ' + next + '(', start + 1);
    if (start < 0 || end <= start) throw new Error('Formation targeting function: ' + name);
    html = html.slice(0, start) + source + '\n\n' + html.slice(end);
  };
  replaceFunction('actionIgnoresFormation', 'legalTargetsFor', `  function actionIgnoresFormation(actor, action){
    return ["aoe","aoeBurn","aoeDebuff","heal","healAll","guardAll","cleanseGuard","buffAll","hasteAll"].includes(actionKind(actor,action));
  }
  function usesFacingTarget(actor, action){
    if(!actor)return false;
    if(action==="basic")return true;
    if(splusOwnsActor(actor))return false;
    return !["aoe","aoeBurn","aoeDebuff","heal","healAll","guard","shield","guardAll","taunt","cleanseGuard","buff","buffAll","hasteAll","regen"].includes(actionKind(actor,action));
  }`);
  replaceFunction('legalTargetsFor', 'preferredTargetFor', `  function legalTargetsFor(actor, action){
    if(splusOwnsActor(actor)&&splusCombat())return splusCombat().targets(actor,action);
    const kind=actionKind(actor,action);
    if(["heal","healAll","guardAll","cleanseGuard","buffAll","hasteAll"].includes(kind))return living(actor.team);
    const legal=Core.legalEnemyTargets(actor,enemiesOf(actor),{ignoreFormation:actionIgnoresFormation(actor,action)});
    const taunter=legal.find(unit=>Core.hasStatus(unit,"taunt"));
    if(taunter)return [taunter];
    return usesFacingTarget(actor,action)?[Core.preferredOppositeTarget(actor,legal)].filter(Boolean):legal;
  }`);
  replaceFunction('preferredTargetFor', 'sequenceTarget', `  function preferredTargetFor(actor, action){
    if(splusOwnsActor(actor)&&splusCombat())return splusCombat().targets(actor,action)[0];
    const kind=actionKind(actor,action);
    if(["heal","healAll","guardAll","cleanseGuard","buffAll","hasteAll"].includes(kind))return Core.lowestHealth(living(actor.team))||actor;
    const legal=legalTargetsFor(actor,action);
    return legal.find(unit=>Core.hasStatus(unit,"taunt"))||Core.preferredOppositeTarget(actor,legal);
  }`);
  once('  function adaptiveTarget(actor, action, fallback){', '  function adaptiveTarget(actor, action, fallback){\n    if(usesFacingTarget(actor,action))return preferredTargetFor(actor,action);');
  once('const planned=plannedAiIntent(actor); if(planned)return planned;', 'const planned=plannedAiIntent(actor); if(planned)return usesFacingTarget(actor,planned.action)?{...planned,target:preferredTargetFor(actor,planned.action)}:planned;');
  // This runs before both legacy and S+ animation owners: visual target = damage target.
  // Authored S+ aliases normalize Skill to Basic. Resolve its target only AFTER
  // normalization, otherwise the animation carries the old Skill target while
  // the mechanics owner damages the opposing Basic target.
  once('  async function performAction(actor, action, target) {\n    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;\n    if(isBachDien(actor)) action=bachDienLegacyAction(action)||action;',
    '  async function performAction(actor, action, target) {\n    if(isLinhDong(actor)) action=linhDongLegacyAction(action)||action;\n    if(isBachDien(actor)) action=bachDienLegacyAction(action)||action;\n    if(usesFacingTarget(actor,action))target=preferredTargetFor(actor,action);');
  // A dead contact target must not redirect a chain to a low-HP unit in another lane.
  once('return foes.slice().sort((a,b)=>Core.hpRatio(a)-Core.hpRatio(b)||nemViStacks(b)-nemViStacks(a))[0]||null;',
    'return preferredTargetFor(actor,actor._tacticalAction||"basic")||null;');
  return html;
}

export function installBattleFormationTargeting(root) {
  const file = join(root, 'dist', 'battle.html');
  writeFileSync(file, patchBattleFormationTargeting(readFileSync(file, 'utf8')));
}
