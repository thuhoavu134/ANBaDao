import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSkillCastMovement } from '../src/combat-domain/skill-cast-movement.mjs';

const START = '/* HV_SKILL_MOVEMENT_RUNTIME_START */';
const END = '/* HV_SKILL_MOVEMENT_RUNTIME_END */';
const runtime = `${START}
const __hvSkillMovement = (${createSkillCastMovement.toString()})({
  teamPlayer: TEAM_PLAYER,
  getUnits: () => units,
  getWorld: () => WORLD,
  getState: () => state,
  actionSequenceFor: actor => actor._hvAssetLease?.taskId ?? state.actionCount,
  heroKeyFor: actor => isLucAnh(actor) ? 'luc-anh' : isLinhDong(actor) ? 'linh-dong' : isBachDien(actor) ? 'bach-dien' : isThayMoBasicQa(actor) ? 'thay-mo' : '',
  approachMs: () => TIMING.approach,
  returnMs: () => TIMING.return,
  setUnitState: (...args) => setUnitState(...args),
  tweenUnit: (...args) => tweenUnit(...args),
  setStatus: text => setStatus(text),
  setPhase: text => { dom.phaseLabel.textContent = text; },
  traceEnabled: new URLSearchParams(location.search).has('qaPhase01')
});
if(new URLSearchParams(location.search).has('qaPhase01')){
  window.__HV_SKILL_MOVEMENT_QA = {
    schema: 'luc-than-skill-movement/v1',
    events: () => __hvSkillMovement.events(),
    snapshot: () => units.map(unit => ({id:unit.id,team:unit.team,slot:unit.slot,state:unit.state,hp:unit.hp,x:unit.x,y:unit.y,baseX:unit.baseX,baseY:unit.baseY})),
    plan: (actorId,action,targetId) => __hvSkillMovement.plan(units.find(unit=>unit.id===actorId),action,units.find(unit=>unit.id===targetId)),
    setTravel: (actorId,action,travel) => {
      const actor=units.find(unit=>unit.id===actorId);
      const key=['atk','normal'].includes(action)?'basic':action==='skill1'?'skill':action==='ult'?'ultimate':action;
      if(!actor||!['basic','skill','ultimate'].includes(key)||!['snap','dash','run','stationary'].includes(travel))return false;
      actor.skillMovement={...(actor.skillMovement||{}),[key]:{...(actor.skillMovement?.[key]||{}),travel}};
      return __hvSkillMovement.policyFor(actor,key)?.travel===travel;
    }
  };
}
${END}
`;

function replaceRequired(source, from, to, label) {
  const count = typeof from === 'string' ? source.split(from).length - 1 : [...source.matchAll(new RegExp(from.source, 'g'))].length;
  if (count !== 1) throw new Error('Skill movement patch: expected one ' + label + ', found ' + count);
  return source.replace(from, (...args) => typeof to === 'function' ? to(...args) : to);
}

export function patchBattleSkillMovement(input) {
  let html = input.replace(/\r\n/g, '\n');
  if (html.includes(START)) {
    if (html.split(START).length !== 2 || html.split(END).length !== 2) throw new Error('Duplicate skill movement owner');
    return html;
  }
  const actionOwner = '  async function __hvPerformAction3qAdapter(actor, action, target) {';
  html = replaceRequired(html, actionOwner, runtime + '\n' + actionOwner, 'canonical action owner');
  for (const flag of ['usesLucAnh', 'usesLinhDong', 'usesBachDien', 'usesThayMoBasicQa']) {
    const entry = new RegExp('((?:if|else if)\\s*\\(' + flag + '\\)\\s*\\{)\\s*actor\\.x\\s*=\\s*actor\\.baseX;\\s*actor\\.y\\s*=\\s*actor\\.baseY;');
    html = replaceRequired(html, entry,
      (_match, opening) => opening + '\n      if(!await __hvSkillMovement.approach(actor,action,target,battleId))return;',
      flag + ' cast entry');
  }
  const genericStartText = '      const profileName=combatPresentationProfileFor(actor,action);';
  const genericEndText = '      const releaseDuration = weaponFlightDuration(actor);';
  const genericStart = html.indexOf(genericStartText);
  const genericEnd = html.indexOf(genericEndText, genericStart);
  if (genericStart < 0 || genericEnd <= genericStart) throw new Error('Skill movement patch: generic presentation boundary missing');
  const legacyMovement = html.slice(genericStart, genericEnd);
  const replacement = [
    '      /* HV_SKILL_MOVEMENT_GENERIC */',
    '      if(__hvSkillMovement.policyFor(actor,action)){',
    '        if(!await __hvSkillMovement.approach(actor,action,target,battleId))return;',
    '      } else {', legacyMovement, '      }', ''
  ].join('\n');
  html = html.slice(0, genericStart) + replacement + html.slice(genericEnd);
  html = replaceRequired(html,
    'thayMoRangedFx=null; actor.x=origin.x; actor.y=origin.y; setUnitState(actor,"idle",800);',
    'thayMoRangedFx=null; // Movement owner returns only after impact recovery.',
    'Thay Mo premature home reset');
  const recovery = html.indexOf("    phase1Trace?.marker('recovery',");
  const returnStart = html.lastIndexOf('    if (actor.hp > 0) {', recovery);
  if (recovery < 0 || returnStart < 0) throw new Error('Skill movement patch: shared return boundary missing');
  let returnBlock = html.slice(returnStart, recovery);
  returnBlock = replaceRequired(returnBlock,
    /if\s*\(usesLinhDong\)\s*\{[\s\S]*?\}\s*else if\s*\(usesBachDien\)\s*\{[\s\S]*?\}\s*else if\s*\(usesDinhLoi\)/,
    'if (usesLucAnh || usesLinhDong || usesBachDien || usesThayMoBasicQa || (!usesOngPhoGif && !usesDinhLoi && __hvSkillMovement.policyFor(actor,action))) {\n        if(!await __hvSkillMovement.returnHome(actor,battleId))return;\n      } else if (usesDinhLoi)',
    'canonical ranged return branches');
  returnBlock = replaceRequired(returnBlock,
    '} else if (usesThayMoBasicQa) {\n        actor.x=origin.x; actor.y=origin.y; setUnitState(actor,"idle",800);\n      } else if (usesOngPhoGif) {',
    '} else if (usesOngPhoGif) {', 'obsolete Thay Mo return branch');
  html = html.slice(0, returnStart) + returnBlock + html.slice(recovery);
  html = html.replace('giữ vị trí phóng ảnh đăng', 'phóng ảnh đăng tại điểm thi triển');
  html = html.replace('moveType:{basic:0,skill1:0,ultimate:0},', 'movementPolicyOwner:"skill-cast-movement/v1",');
  return html;
}

const target = join(process.cwd(), 'dist', 'battle.html');
if (process.env.HV_SKIP_SKILL_MOVEMENT_BUILD_PATCH !== '1' && existsSync(target)) {
  const patched = patchBattleSkillMovement(readFileSync(target, 'utf8'));
  writeFileSync(target, patched);
  console.log('Per-skill cast approach and return installed in final battle payload');
}
