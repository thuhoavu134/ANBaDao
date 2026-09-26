import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { createSplusMechanics } from '../src/domain/combat/splus-mechanics.mjs';
import { SPLUS_HEROES, SPLUS_EXTRA_HEROES, SPLUS_REVIEW_DEFAULTS } from '../src/domain/hero/splus-catalog.mjs';
import { SPLUS_STATUS_LABELS, SPLUS_ICON_MANIFEST } from '../src/domain/hero/splus-status.mjs';
import { splusProfilePayload } from '../src/domain/hero/splus-profiles.mjs';

export function createSplusFixture(catalog, selectedId) {
  const selected=catalog.find(h=>h.id===selectedId)||catalog.find(h=>h.element===selectedId)||catalog[0];
  function team(element,side,chosen) {
    const pool=catalog.filter(h=>h.element===element),preferred=chosen||pool[0];
    const picked=[preferred,...pool.filter(h=>h!==preferred)].slice(0,6),used=new Set(),slots=new Map();
    const placement=[preferred,...picked.filter(h=>h!==preferred).sort((a,b)=>(a.role==='guardian'?0:a.recommendedSlots.some(s=>s<3)?1:2)-(b.role==='guardian'?0:b.recommendedSlots.some(s=>s<3)?1:2))];
    for(const h of placement){const slot=h.recommendedSlots.find(s=>!used.has(s))??[0,1,2,3,4,5].find(s=>!used.has(s));used.add(slot);slots.set(h.id,slot);}
    return picked.map((h,i)=>{
      const slot=slots.get(h.id);
      return {id:`${side}:${h.id}`,sourceId:h.id,name:h.name,team:side,slot,archetype:h.role,color:({metal:'#edc66d',soul:'#a8baff',water:'#71daf5',fire:'#ffa176',wood:'#96e1ac',dream:'#cdacff'})[h.element],hp:24000,atk:1700,def:400,speed:100-i,energy:35,accuracy:100,evasion:0,crit:10,critRes:0,critDamage:1.5,level:1,stars:1};
    });
  }
  const elements=['metal','soul','water','fire','wood','dream'],opponent=elements[(elements.indexOf(selected.element)+1)%6];
  // Fixture-only stats; this config never grants ownership or emits campaign rewards.
  return {splusReview:true,referenceSimple:true,timingScale:0.35,combatSeed:'splus42-review-v1',playerTeamName:selected.elementName,enemyTeamName:catalog.find(h=>h.element===opponent).elementName,heroes:[...team(selected.element,'player',selected),...team(opponent,'enemy')]};
}

export function patchSplusBattleHtml(input) {
  let html=input.replace(/\r\n/g,'\n');
  const once=(from,to)=>{const count=html.split(from).length-1;if(count!==1)throw new Error(`SPLUS_BUILD_ANCHOR:${from.slice(0,80)}:${count}`);html=html.replace(from,to);};
  if(html.includes('id="splus42-runtime-v1"'))throw new Error('SPLUS_ALREADY_PATCHED');
  const bridge=readFileSync(new URL('../src/runtime/splus-battle-bridge.js',import.meta.url),'utf8');
  const json=x=>JSON.stringify(x).replaceAll('<','\\u003c');
  const payload=`(()=>{const catalog=${json([...SPLUS_HEROES,...SPLUS_EXTRA_HEROES])},defaults=${json(SPLUS_REVIEW_DEFAULTS)};globalThis.SPLUS42=Object.freeze({catalog,profiles:${json(splusProfilePayload())},icons:${json(SPLUS_ICON_MANIFEST)},labels:${json(SPLUS_STATUS_LABELS)},create:options=>(${createSplusMechanics.toString()})({...options,catalog,defaults}),fixture:id=>(${createSplusFixture.toString()})(catalog,id)});})();`;
  once('</head>',`<script id="splus42-runtime-v1">${payload}</script><style id="splus42-style">body:has(#splus-status-panel){overflow:auto!important;height:auto!important;min-height:100vh}#splus-status-panel{position:relative;z-index:5;max-width:1200px;margin:24px auto;padding:20px;background:#111f29;color:#e9e6d8;font:14px/1.5 sans-serif;border:1px solid #687778;border-radius:16px}#splus-status-panel h2{font-size:20px}.splus-status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.splus-status-grid article{padding:12px;background:#1c2c36;border-radius:10px}.splus-status-grid p{color:#d8c793}.splus-status-grid ul{padding-left:18px;margin:8px 0}.splus-status-grid li[data-polarity=debuff]{color:#ffb4a7}.splus-status-grid li[data-polarity=buff]{color:#a5e0bd}.splus-battle #battleOrders{display:none!important}.splus-battle .action-zone{width:min(900px,calc(100vw - 20px))!important}.splus-battle .action-button strong{font-size:13px!important}.splus-battle .action-button small{font-size:10px!important}#splus-evidence{max-height:320px;overflow:auto;font:11px monospace}</style></head>`);
  once('  const Core = globalThis.HonVietCore;',`  const LegacyCore=globalThis.HonVietCore;
  const Core={...LegacyCore,
    canUseAction:(u,a)=>splusCombat()?splusCombat().canUse(u,a):LegacyCore.canUseAction(u,a),
    tickStatuses:u=>splusCombat()?(['basic','skill','ultimate'].some(a=>splusCombat().canUse(u,a))?[]:[{type:'control'}]):LegacyCore.tickStatuses(u),
    buildTurnOrder:list=>splusCombat()?list.filter(u=>u.hp>0).sort((a,b)=>splusCombat().stat(b,'speed')-splusCombat().stat(a,'speed')||String(a.id).localeCompare(String(b.id))).map(u=>u.id):LegacyCore.buildTurnOrder(list)
  };`);
  once('    const sessionId = params.get("session") || "";',`    if(params.has('qaSplus42'))return globalThis.SPLUS42.fixture(params.get('qaSplus42'));
    const sessionId = params.get("session") || "";`);
  once('  const REFERENCE_SIMPLE = Boolean(EMBED_CONFIG.referenceSimple);','  const REFERENCE_SIMPLE = Boolean(EMBED_CONFIG.referenceSimple || EMBED_CONFIG.heroes?.some(h=>String(h.sourceId).startsWith("hero_splus_")));');
  once('? EMBED_CONFIG.heroes.map(normalizeConfiguredHero)','? EMBED_CONFIG.heroes.map(splusHeroConfig)');
  once('  let units = [];',`  let units = [];\n${bridge}`);
  once('const hero=Core.applyProgression(synergized);','const hero=rawHero.kitVersion===\'splus42-v2\'?rawHero:Core.applyProgression(synergized);');
  once('    units = createUnits();','    splusReset();\n    units = createUnits();\n    splusStateView();');
  once('  dom.exitBattleButton?.addEventListener("click", () => {','  dom.exitBattleButton?.addEventListener("click", () => {\n    splusReset();');
  once('  function legalTargetsFor(actor, action){','  function legalTargetsFor(actor, action){\n    if(splusCombat())return splusCombat().targets(actor,action);');
  once('  function preferredTargetFor(actor, action){','  function preferredTargetFor(actor, action){\n    if(splusCombat())return splusCombat().targets(actor,action)[0];');
  once('    showTargets(candidates, targetsAllies ? actor.team : (actor.team === TEAM_PLAYER ? TEAM_ENEMY : TEAM_PLAYER));','    showTargets(candidates, splusTargetTeam(actor,candidates,targetsAllies ? actor.team : (actor.team === TEAM_PLAYER ? TEAM_ENEMY : TEAM_PLAYER)));');
  once('  function decideAi(actor){',`  function decideAi(actor){
    if(splusCombat()){const action=splusCombat().chooseAction(actor);return {action,target:splusCombat().targets(actor,action)[0]};}`);
  once("    if(action==='skill')return;","    if(action==='skill'&&!splusCombat())return;");
  once("    if(action==='basic'){\n      const talent=talentSkillIntent(actor);","    if(action==='basic'&&!splusCombat()){\n      const talent=talentSkillIntent(actor);");
  once('  async function performAction(actor, action, target) {',`  async function performAction(actor, action, target) {
    if(actor?.kitVersion==='splus42-v2'&&splusCombat()){
      if(state.locked||state.mode!=='battle'||actor.id!==state.currentId||!splusCombat().canUse(actor,action))return;
      return performSplusAction(actor,action,target);
    }`);
  once('        state.round += 1;',`        state.round += 1;
        if(splusCombat()){if(state.round<=15)splusCombat().beginRound(state.round);else splusCombat().finishRound();splusStateView();}`);
  once('  function updateActorHud(actor) {',`  function updateActorHud(actor) {
    if(splusCombat()){const button=document.querySelector('[data-action="skill"]');button.hidden=false;button.removeAttribute('aria-hidden');document.querySelector('[data-action="ultimate"] .action-key').textContent='3';splusStateView();}`);
  once('  function drawUnit(context, unit, time) {','  function drawUnit(context, unit, time) {\n    if(unit.kitVersion===\'splus42-v2\')return drawSplusToken(context,unit,time);');
  once('  function gainEnergy(unit, amount){','  function gainEnergy(unit, amount){\n    if(splusCombat())return splusCombat().gainRage(unit,unit,amount);');
  once('    const visibleStatuses=[];','    const visibleStatuses=splusCombat()?splusCombat().hud(unit).slice(0,4):[];');
  once('      visibleStatuses.push(status);','      if(!splusCombat())visibleStatuses.push(status);');
  once('const beneficial=[',"const beneficial=status.polarity==='buff'||[");
  once('icon=statusIconImage(status.type);','icon=status.iconId?null:statusIconImage(status.type);');
  once('      if(isNemVi){\n        context.shadowBlur=0;',`      if(status.iconId){context.shadowBlur=0;context.fillStyle='#fff';context.font='bold 11px sans-serif';context.textAlign='center';const number=globalThis.SPLUS42.catalog.find(h=>h.iconId===status.iconId)?.number;context.fillText(String(number||'')+(status.stacks>1?'×'+status.stacks:''),sx,sy+4);}
      if(isNemVi){
        context.shadowBlur=0;`);
  once('</head>','<link rel="stylesheet" href="/splus-skill-details.css"><script src="/splus-skill-details.js"></script><style>.splus-battle .action-buttons{grid-template-columns:1fr!important}.splus-battle .action-button[data-action="skill"],.splus-battle .action-button[data-action="ultimate"]{display:none!important}#splus-battle-skills{margin:0!important}#splus-battle-skills .splus-skill-visual{width:64px}#splus-battle-skills .splus-skill-name{font-size:11px}#splus-battle-skills .splus-skill-kind{margin:1px}.splus-battle .action-zone{max-width:510px!important;background:#10202cec;border:1px solid #8e784955;border-radius:14px}.splus-battle .action-button small{display:none!important}@media(max-width:600px){#splus-battle-skills .splus-skill-visual{width:48px}#splus-battle-skills .splus-skill-name{font-size:10px}}</style></head>');
  once('dom.actionButtons.forEach((button) => button.addEventListener("click", () => chooseAction(button.dataset.action)));','dom.actionButtons.forEach((button) => button.addEventListener("click", () => splusInspectAction(button.dataset.action,button)));');
  once('      chooseAction(actionByKey[event.key]);','      if(!document.getElementById("splus-skill-dialog")?.open)splusInspectAction(actionByKey[event.key]);');
  once('    state.currentId = actor.id;','    state.currentId = actor.id;\n    if(splusCombat())splusCombat().beginTurn(actor);');
  return html;
}

export function buildSplusRuntime(root=process.cwd()) {
  const path=join(root,'dist','battle.html');writeFileSync(path,patchSplusBattleHtml(readFileSync(path,'utf8')));
  writeFileSync(join(root,'dist','splus42-catalog.json'),JSON.stringify({heroes:SPLUS_HEROES,extras:SPLUS_EXTRA_HEROES,icons:SPLUS_ICON_MANIFEST,...splusProfilePayload()}));
  for(const file of ['splus-skill-details.js','splus-skill-details.css','splus-encyclopedia.js'])writeFileSync(join(root,'dist',file),readFileSync(join(root,'src','ui',file)));
  console.log('SPLUS42: source factory, existing scheduler bridge, 42 HUD identities');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))buildSplusRuntime();
