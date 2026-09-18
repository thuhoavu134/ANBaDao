import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root=process.cwd();const target=join(root,'dist','battle.html');let html=readFileSync(target,'utf8');
const source=readFileSync(join(root,'src/domain/combat/battle-presentation-trace.mjs'),'utf8').replace(/^export\s+/gm,'');
const runtime=`\n<script>\n${source}\n(function(){\n const enabled=new URLSearchParams(location.search).has('qaPhase01');\n if(!enabled)return;\n window.__HV_BATTLE_PHASE1_TRACE=createBattlePresentationTrace({enabled,maxEvents:500});\n})();\n</script>`;
if(!html.includes('__HV_BATTLE_PHASE1_TRACE')) html=html.replace('</body>',runtime+'\n</body>');
writeFileSync(target,html,'utf8');console.log('Battle Phase 1 opt-in trace injected');
