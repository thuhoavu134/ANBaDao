import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(p, 'utf8');
const from = 'document.getElementById("embeddedSkipButton")?.addEventListener("click", () => {\n    if (!EMBEDDED) return;';
const to = 'document.getElementById("embeddedSkipButton")?.addEventListener("click", () => {\n    /* TKT-0088 skip works in iframe and in-page */';
if (!s.includes(from) && !s.includes('TKT-0088 skip works')) {
  throw new Error('battle skip patch: listener not found');
}
if (s.includes(from)) s = s.replace(from, to);
writeFileSync(p, s);
