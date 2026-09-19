import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const target = join(root, 'dist', 'battle.html');
let html = readFileSync(target, 'utf8');
const controller = readFileSync(join(root, 'src/domain/combat/presentation-action-controller.mjs'), 'utf8')
  .replace(/^export\s+/gm, '');
const trace = readFileSync(join(root, 'src/domain/combat/battle-presentation-trace.mjs'), 'utf8')
  .replace(/^import.*$/gm, '')
  .replace(/^export\s+/gm, '');
const source = controller + '\n' + trace;

// Battle action hooks also mention __HV_BATTLE_PHASE1_TRACE. Only this owned
// script identifies an installed initializer; a global-name search skips it.
const ownedScript = /<script id="hv-battle-phase1-trace">[\s\S]*?<\/script>\n?/g;
html = html.replace(ownedScript, '');
if (!/<\/head\s*>/i.test(html)) {
  throw new Error('Battle Phase 1 trace: missing closing </head> in dist/battle.html');
}

// Install before body battle code so even the first action is observed. Keep
// helpers scoped and allocate no trace state on normal production URLs.
const runtime = `<script id="hv-battle-phase1-trace">\n(function(){
 const enabled=new URLSearchParams(location.search).has('qaPhase01');
 if(!enabled)return;
${source}
 window.__HV_BATTLE_PHASE1_TRACE=createBattlePresentationTrace({enabled,maxEvents:500});
})();\n</script>\n`;
// A callback preserves any literal $ replacement sequences in module source.
html = html.replace(/<\/head\s*>/i, closing => runtime + closing);
writeFileSync(target, html, 'utf8');
console.log('Battle Phase 1 opt-in trace initializer injected');
