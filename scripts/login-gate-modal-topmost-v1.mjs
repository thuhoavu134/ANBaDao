import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Bug 2026-09-27 (iPhone, luc-than-chi.vercel.app): after a full-page battle
// return (defeat-result tip "Tăng cấp tướng" -> index.html?hvBattleReturn=1)
// the hub booted with the V4 roster open and the login gate mounted above it
// in DOM order but BELOW it visually (gate z=200 vs roster z=99999). Every
// dock tap hit the roster, but navToWithLoginGate swallowed the navigation
// (entered === false) and just re-called showLogin() — the player saw the
// hero screen and nothing responded.
//
// Two-part fix:
// 1. The gate is a modal: when open it renders above every feature overlay.
// 2. enterGame keeps the destination screen that consumeBattleReturn routed
//    to before the gate mounted; only default to the hub when no destination
//    screen is active.

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

if (html.includes('hv-login-modal-topmost-v1')) throw new Error('Login gate modal topmost patch already installed');

const css = `<style id="hv-login-modal-topmost-v1">
/* The login gate is a modal and must stack above feature overlays:
   V4 roster 99999, integrated battle overlay 1000000. */
#hvLoginRoot.is-open{z-index:1100000!important}
</style>`;
if (!html.includes('</head>')) throw new Error('Document head marker not found');
html = html.replace('</head>', css + '\n</head>');

const from = `    playLoginMusic();
    if (typeof navTo === 'function') navTo('hub');`;
const to = `    playLoginMusic();
    // hv-login-modal-topmost-v1: a battle return (index.html?hvBattleReturn=1)
    // routes to its target screen before this gate mounts. Keep that route —
    // only default to the hub when no destination screen is active.
    if (typeof navTo === 'function' && typeof ST === 'object' && (!ST.screen || ST.screen === 'hub')) navTo('hub');`;
if (html.split(from).length !== 2) throw new Error('enterGame navTo anchor missing or ambiguous');
html = html.replace(from, to);

writeFileSync(p, html);
console.log('Login gate is topmost when open; battle-return route survives gate entry');
