import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const indexTarget = join(root, 'dist/index.html');
const battleTarget = join(root, 'dist/battle.html');
const domain = readFileSync(join(root, 'src/domain/hunt/hunt-run.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(root, 'src/ui/hunt-runtime.js'), 'utf8');
const css = readFileSync(join(root, 'src/ui/hunt-screen.css'), 'utf8');
const battleVisual = readFileSync(join(root, 'src/ui/hunt-battle-visual.js'), 'utf8');
new Function(domain);
new Function(runtime);
new Function(battleVisual);

function replaceOnce(src, from, to, label) {
  if (src.includes(to)) return src;
  if (!src.includes(from)) {
    console.warn('Hunt inject skip:', label);
    return src;
  }
  return src.replace(from, to);
}

let html = readFileSync(indexTarget, 'utf8');
html = html.replace(/<style id="hv-hunt-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-hunt-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-hunt-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Hunt shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-hunt-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);

const huntObjectiveFrom = "if(/^ch\\d+_boss/.test(battleId)||battleId==='__hunt'||battleId==='__guildboss')return {type:'priority',targetId:enemyLead,maxRounds:6};";
const huntObjectiveTo = "if(battleId==='__hunt')return {type:'eliminate',maxRounds:60};\n    if(/^ch\\d+_boss/.test(battleId)||battleId==='__guildboss')return {type:'priority',targetId:enemyLead,maxRounds:6};";
html = replaceOnce(html, huntObjectiveFrom, huntObjectiveTo, 'index-objective');

const huntHeroFrom = "      rarity: combatRarityValue(definition.rarity),\n      progression: heroBattleProgression(sourceId),\n      ...mapSkill({...combatant,skill:combatant.skill||definition.skill||null,ultimate:combatant.ultimate||definition.ultimate||null})";
const huntHeroTo = "      rarity: combatRarityValue(definition.rarity),\n      progression: heroBattleProgression(sourceId),\n      huntForm: combatant.huntForm || null,\n      huntScale: Number(combatant.huntScale) || 1,\n      ...mapSkill({...combatant,skill:combatant.skill||definition.skill||null,ultimate:combatant.ultimate||definition.ultimate||null})";
html = replaceOnce(html, huntHeroFrom, huntHeroTo, 'index-huntForm');

html = replaceOnce(
  html,
  '      enemyTeamName: "Tà Phái",',
  "      enemyTeamName: battleId==='__hunt' ? ((typeof todayBoss==='function'?todayBoss(typeof today==='function'?today():0).name:null)||'Săn Boss') : \"Tà Phái\",",
  'index-enemy-name'
);
html = replaceOnce(
  html,
  "      enemyTeamName: battleId==='__hunt' ? ((typeof todayBoss==='function'?todayBoss().name:null)||'Săn Boss') : \"Tà Phái\",",
  "      enemyTeamName: battleId==='__hunt' ? ((typeof todayBoss==='function'?todayBoss(typeof today==='function'?today():0).name:null)||'Săn Boss') : \"Tà Phái\",",
  'index-enemy-name-day'
);

html = replaceOnce(
  html,
  'const url = `battle.html?embedded=1&session=${encodeURIComponent(sessionId)}&autostart=1&v=3175${qaSuffix}${fixtureSuffix}`;',
  'const url = `battle.html?embedded=1&session=${encodeURIComponent(sessionId)}&autostart=1&v=3175${qaSuffix}${fixtureSuffix}${battleId===\'__hunt\'?\'&battleId=__hunt&vHunt=2\':\'\'}`;',
  'index-hunt-url'
);

html = replaceOnce(
  html,
  '    try { sessionStorage.setItem(`hvBattleConfig:${sessionId}`, serializedBattleConfig); } catch (error) {\n      console.warn("Không lưu được cấu hình trận dự phòng vào sessionStorage.", error);\n    }',
  '    try { sessionStorage.setItem(`hvBattleConfig:${sessionId}`, serializedBattleConfig); } catch (error) {\n      console.warn("Không lưu được cấu hình trận dự phòng vào sessionStorage.", error);\n    }\n    if (battleId === "__hunt") {\n      try { sessionStorage.setItem("hvHuntBattleConfig", serializedBattleConfig); } catch (_) {}\n    }',
  'index-hunt-storage'
);

writeFileSync(indexTarget, html);
console.log('Hunt lacquer screen installed');

if (existsSync(battleTarget)) {
  let battle = readFileSync(battleTarget, 'utf8');
  battle = battle.replace(/<script id="hv-hunt-battle-js">[\s\S]*?<\/script>\n?/, '');

  battle = replaceOnce(
    battle,
    '    console.warn("Không tìm thấy cấu hình trận tích hợp; dùng đội hình mặc định.");\n    return {};',
    '    try {\n      const huntCfg = sessionStorage.getItem("hvHuntBattleConfig");\n      if (huntCfg && (sessionId || params.get("battleId") === "__hunt")) {\n        const parsed = JSON.parse(huntCfg);\n        if (parsed && parsed.battleId === "__hunt") return parsed;\n      }\n    } catch (error) {\n      console.warn("Không đọc được cấu hình săn boss.", error);\n    }\n    console.warn("Không tìm thấy cấu hình trận tích hợp; dùng đội hình mặc định.");\n    return {};',
    'battle-embed-fallback'
  );

  // TKT-0161: the battle round-cap (60 for hunt/tower) now lives in the core
  // module (src/domain/combat/hon-viet-core.mjs) and arrives pre-applied in
  // battle.html. Guard instead of patching — an inline edit would trip the
  // combat-core drift guard.
  if (!battle.includes('const roundCap=Number(raw.maxRounds)>=60?60:STANDARD_ROUND_LIMIT;')) {
    throw new Error('hunt-runtime: round-cap missing from the core module build');
  }
  if (!battle.includes('const roundCap=Math.max(STANDARD_ROUND_LIMIT,Math.min(60,Number(obj.maxRounds)||STANDARD_ROUND_LIMIT));')) {
    throw new Error('hunt-runtime: eval round-cap missing from the core module build');
  }

  battle = replaceOnce(
    battle,
    '  function updateRoundDisplay(round=state.round){\n    const shown=Math.max(1,Math.min(15,Number(round)||1));\n    if(dom.roundLabel)dom.roundLabel.textContent=`HIỆP ${String(shown).padStart(2,"0")}/15`;\n    const display=document.getElementById("roundDisplay");\n    if(display)display.dataset.danger=shown>=13?"true":"false";\n  }',
    '  function updateRoundDisplay(round=state.round){\n    const hunt=String(EMBED_CONFIG.battleId||"")==="__hunt"||(Array.isArray(units)&&units.some(u=>u&&(u.huntForm||u.sourceId==="huntboss")));\n    const cap=hunt?60:15;\n    const shown=Math.max(1,Math.min(cap,Number(round)||1));\n    if(dom.roundLabel)dom.roundLabel.textContent=`HIỆP ${String(shown).padStart(2,"0")}/${String(cap).padStart(2,"0")}`;\n    const display=document.getElementById("roundDisplay");\n    if(display)display.dataset.danger=shown>=cap-8?"true":"false";\n  }',
    'battle-round-hud'
  );

  battle = replaceOnce(
    battle,
    '  function drawUnit(context, unit, time) {\n    if(unit.kitVersion===\'splus42-v2\')return drawSplusToken(context,unit,time);',
    '  function drawUnit(context, unit, time) {\n    /*hv-hunt-draw*/\n    if (unit && typeof honVietDrawHuntUnit === "function") {\n      const huntForm = unit.huntForm || (typeof honVietInferHuntForm === "function" ? honVietInferHuntForm(unit) : null);\n      if (huntForm) {\n        unit.huntForm = huntForm;\n        honVietDrawHuntUnit(context, unit, time, { drawHud: drawUnitHud, reducedMotion: REDUCED_MOTION, target: unit.actionTarget || null, aoe: !!unit.actionAoe });\n        return;\n      }\n    }\n    if(unit.kitVersion===\'splus42-v2\')return drawSplusToken(context,unit,time);',
    'battle-drawUnit'
  );

  // hv-hunt-units: owner 10/11 - noc phun toi 6 vi tri, can vi tri doi hinh.
  {
    const hookOld = '{ drawHud: drawUnitHud, reducedMotion: REDUCED_MOTION, target: unit.actionTarget || null, aoe: !!unit.actionAoe }';
    if (!battle.includes(hookOld)) throw new Error('hunt-runtime: hunt draw hook missing');
    battle = battle.split(hookOld).join('{ drawHud: drawUnitHud, reducedMotion: REDUCED_MOTION, target: unit.actionTarget || null, aoe: !!unit.actionAoe, units }');
    // Boss co VFX clip (Flow) thi khong ve hieu ung bang code cua engine.
    const guards = [
      [/function launchWeaponEffect\(actor, target, action, battleId\) \{/, 'function launchWeaponEffect(actor, target, action, battleId) { if (typeof honVietHuntSkipFx === "function" && honVietHuntSkipFx(actor)) { playReleaseSound(actor); return sleep(TIMING.meleeRelease, battleId); }'],
      [/function queueWeaponAnticipation\(actor, action\) \{/, 'function queueWeaponAnticipation(actor, action) { if (typeof honVietHuntSkipFx === "function" && honVietHuntSkipFx(actor)) return;'],
      [/function queueChargeEffect\(actor, action\) \{/, 'function queueChargeEffect(actor, action) { if (typeof honVietHuntSkipFx === "function" && honVietHuntSkipFx(actor)) return;'],
      // owner 11/11: boss co clip phai vao state "ultimate" khi tung tuyet ky (engine cu luon dat "attack") -> 4 lop clip moi chay.
      // QA qaUlti=1: boss co clip luon tung tuyet ky (decideAi bi patch auto-skill chen truoc nen ep tai day).
      // owner 11/11: chi rung, khong chop, khong vong tron ve bang code cho boss co clip.
    ];
    for (const [re, to] of guards) {
      if (!re.test(battle)) throw new Error('hunt-runtime: fx guard anchor missing ' + re);
      battle = battle.replace(re, to);
    }
  }

  const headEnd = battle.indexOf('</head>');
  if (headEnd < 0) throw new Error('Hunt battle head end missing');
  battle = battle.slice(0, headEnd)
    + `<script id="hv-hunt-battle-js">${battleVisual}</script>\n`
    + battle.slice(headEnd);
  writeFileSync(battleTarget, battle);
  console.log('Hunt battle beast visual installed');
}
