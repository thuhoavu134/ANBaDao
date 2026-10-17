import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Auto-battle skill cadence (2026-09-28 owner report: "icon hiệu ứng trên đầu
// tướng bị biến mất trong trận").
//
// Investigation (scripts/qa-status-icons-probe.mjs, headless A/B old-vs-new):
// icon rendering is healthy (the ?qa=status-icons fixtures draw all buff /
// debuff / Nêm Vì icons), and no regression in 231–238 strips statuses — the
// old build behaves identically. Statuses are rare in real battles because
// decideAi never auto-casts the regular Skill: it holds basics until the
// 70-rage Ultimate, so a fresh guest squad throws basic attacks for entire
// fights and no burn/bleed/buff ever lands (no head icons, no skill SFX).
//
// This patch adds one target-aware branch to decideAi: cast the regular Skill
// when its rage cost is met and canUseAction allows it (S+ units go through
// the engine's own cooldown checks via the canUseAction override). Ông Phở's
// golden-carry pacing is preserved: while he is 40–69 rage he still banks the
// basic for the authored Ultimate cadence.

const p = join(process.cwd(), 'dist', 'battle.html');
let html = readFileSync(p, 'utf8');

if (html.includes('HV_AUTO_SKILL_CADENCE_V1')) throw new Error('Auto skill cadence patch already installed');

const anchor = '    const talent=talentSkillIntent(actor);if(talent)return armTalentSkill(actor,talent);';
if (html.split(anchor).length !== 2) throw new Error('Auto skill cadence anchor missing or ambiguous: decideAi talent line');
const branch = [
  '    /* HV_AUTO_SKILL_CADENCE_V1: regular Skill joins the auto rotation once rage allows. */',
  '    const skillCost=Core.actionCost("skill");',
  // Thay Mo's authored non-Ultimate cast is also his Basic presentation.
  // Do not auto-buy the legacy 25-rage Skill behind that same animation.
  // His Basic keeps the existing +15 rage; free talent intent remains below.
  '    if(!isDinhLoi(actor)&&!(typeof isThayMoAuthored==="function"&&isThayMoAuthored(actor))&&!actor._autoSkillSinceUltimate&&Number.isFinite(skillCost)&&actor.energy>=skillCost&&Core.canUseAction(actor,"skill")&&!(isOngPhoCarry(actor)&&actor.energy<70)){',
  '      const skillTarget=adaptiveTarget(actor,"skill",preferredTargetFor(actor,"skill"));',
  '      if(skillTarget)return {action:"skill",target:skillTarget};',
  '    }'
].join('\n');
html = html.replace(anchor, branch + '\n' + anchor);

// Record only committed, paid actions, after readiness and the existing debit.
// Deciding an intent or retrying a failed asset load must not spend this allowance.
// One regular skill per ultimate cycle prevents repeated 25-rage spending from
// starving the existing ultimate threshold; free talents retain their own rules.
const adapterDebit = '    __hvDebitActionEnergy3qAdapter(actor, cost, talentActivation);';
const debit = html.includes(adapterDebit) ? adapterDebit : '    actor.energy = Math.max(0, actor.energy - cost);';
if (html.split(debit).length !== 2) throw new Error('Auto cadence debit anchor missing or ambiguous');
html = html.replace(debit, debit + '\n    if(action==="ultimate")actor._autoSkillSinceUltimate=false;\n    else if(action==="skill"&&cost>0)actor._autoSkillSinceUltimate=true;');

writeFileSync(p, html);
console.log('Auto skill cadence installed: decideAi casts the regular Skill when rage allows (target-aware, carry pacing preserved)');


