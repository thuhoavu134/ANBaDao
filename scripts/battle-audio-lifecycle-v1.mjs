import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const path = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(path, 'utf8');
const marker = '  function closeOverlay() {\n';
if (html.split(marker).length !== 2) throw new Error('Battle audio cleanup needs exactly one closeOverlay owner');
html = html.replace(marker, marker + `    // Stop combat SFX/voice; preserve the current BGM until the next screen crossfades to its track.
    window.HonVietSfx?.endBattle();
    window.HonVietAudio?.stopCombat?.();
    window.__HV_RESULT_AUDIO?.stop({keepCurrent:true});
    try { frame.contentWindow?.HonVietAudio?.stopCombat?.(); frame.contentWindow?.HonVietSfx?.dispose(); } catch (_) {}
`);
writeFileSync(path, html);
console.log('Battle close now cancels parent SFX, voices, pending result audio and stale iframe channels');
