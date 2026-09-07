import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const path = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(path, 'utf8');
const marker = '  function closeOverlay() {\n';
if (html.split(marker).length !== 2) throw new Error('Battle audio cleanup needs exactly one closeOverlay owner');
html = html.replace(marker, marker + `    // Stop shared parent audio synchronously, before iframe navigation/pagehide.
    window.HonVietSfx?.endBattle();
    window.__HV_RESULT_AUDIO?.stop();
    try { frame.contentWindow?.HonVietSfx?.dispose(); } catch (_) {}
`);
writeFileSync(path, html);
console.log('Battle close now cancels parent SFX, voices, result audio and stale iframe channels');
