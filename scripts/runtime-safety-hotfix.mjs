import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(p, 'utf8');

const dangerous = "},{capture:true,passive:true});\n  primeLucAnhUltimateVoice().catch(()=>{});";
if (s.includes(dangerous)) {
  s = s.replace(dangerous, "},{capture:true,passive:true});");
}

// Extra safety: embedded campaign battles should always autostart even if Safari
// temporarily fails to expose frameElement.dataset.config on first parse.
const oldEmbedFallback = 'const EMBEDDED = Boolean(EMBED_CONFIG.embedded);';
const safeEmbedFallback = "const EMBEDDED = Boolean(EMBED_CONFIG.embedded) || new URLSearchParams(location.search).get('embedded') === '1';";
if (s.includes(oldEmbedFallback)) s = s.replace(oldEmbedFallback, safeEmbedFallback);

const oldAutoStart = 'if (EMBED_CONFIG.autoStart) setTimeout(beginBattle, 250);';
const safeAutoStart = "if (EMBED_CONFIG.autoStart || EMBEDDED) setTimeout(beginBattle, 250);";
if (s.includes(oldAutoStart)) s = s.replace(oldAutoStart, safeAutoStart);

writeFileSync(p, s);
console.log('Runtime safety hotfix applied');
