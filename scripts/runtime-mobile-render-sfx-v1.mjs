import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const runtime = readFileSync(new URL('../src/ui/audio-sfx-runtime.js', import.meta.url), 'utf8');
for (const name of ['index.html', 'battle.html']) {
  const path = join(out, name);
  let html = readFileSync(path, 'utf8');
  if (html.includes('id="hon-viet-supplied-sfx"')) throw new Error('SFX patch applied twice');
  html = html.replace('</head>', `<script id="hon-viet-supplied-sfx">${runtime}</script>\n</head>`);
  if (name === 'battle.html') {
    function replace(from, to, label) {
      if (!html.includes(from)) throw new Error(`Runtime repair missing ${label}`);
      html = html.replace(from, to);
    }
    function replaceFunction(name, nextName, replacement) {
      const start = html.indexOf(`  function ${name}(`);
      const end = html.indexOf(`  ${nextName}`, start + 12 + name.length);
      if (start < 0 || end < start) throw new Error(`SFX function boundary missing ${name}`);
      html = html.slice(0, start) + replacement + '\n\n' + html.slice(end);
    }
    replaceFunction('playActionSound', 'function ', `  function playActionSound(actor, action) {
    if (state.sound) window.HonVietSfx?.play(action === 'ultimate' ? 'ultimate' : action === 'skill' ? 'skill' : 'basic');
  }`);
    replaceFunction('playReleaseSound', 'async function launchWeaponEffect', `  function playReleaseSound(actor) {
    // Cast SFX is dispatched exactly once by playActionSound, not again on projectile release.
  }`);
    if (!html.includes('AUTHORED_COMBAT_AUDIO_SYNC_V1')) {
      replace('window.__playLucAnhUltimateVoiceGuaranteed?.();', 'window.__playLucAnhUltimateVoiceGuaranteed?.();playActionSound(actor,"ultimate");', 'Luc Anh ultimate SFX');
    }
    replace('tone(critical ? 105 : 135, critical ? 0.16 : 0.09, "square", 0.035);',
      '/* No shared forge impact audio in combat; authored hit VFX stays in applyDamage. */', 'impact SFX');
    replace('tone(520, 0.16, "sine", 0.028);', 'if (state.sound) window.HonVietSfx?.play("heal");', 'heal SFX');
    replace('tone(150, 0.07, "triangle", 0.018);', '/* No synthetic approach beep; cast SFX remains owned by playActionSound. */', 'duplicate impact beep');
    replace('tone(146, 0.28, "sine", 0.05);\n    tone(219, 0.24, "triangle", 0.035, 0.12);',
      'window.HonVietSfx?.setCombatEnabled(state.sound);', 'battle-start audio');
    replace('tone(victory ? 392 : 110, 0.38, victory ? "triangle" : "sawtooth", 0.05);\n    if (victory) tone(523, 0.35, "sine", 0.035, 0.18);',
      'window.HonVietSfx?.stopCombat();\n    if (state.sound) window.HonVietSfx?.play(victory ? "victory" : "defeat", {group:"ui"});', 'result SFX');
    replace('if (state.sound) tone(440, 0.08, "sine", 0.025);',
      'window.HonVietSfx?.setCombatEnabled(state.sound);\n    if (state.sound) { window.HonVietSfx?.unlock(); window.HonVietSfx?.play("ui", {group:"ui"}); }', 'SFX mute');

    // iOS/iPadOS: keep the legacy/native atlas owner lazy, but bound its
    // residency and decode concurrency so Lục Ảnh/Đình Lôi cannot compete with
    // the S+ cache for two large decodes at once.
    replace(
      'const entries=new Map();let bytes=0,loading=0;const maxBytes=128*1024*1024,maxLoading=2,warmMs=96;',
      "const entries=new Map();let bytes=0,loading=0;const __hvNativeLowMemoryIOS=/iPad|iPhone|iPod/i.test(String(navigator?.userAgent||''))||(navigator?.platform==='MacIntel'&&Number(navigator?.maxTouchPoints||0)>1),maxBytes=__hvNativeLowMemoryIOS?64*1024*1024:128*1024*1024,maxLoading=__hvNativeLowMemoryIOS?1:2,warmMs=96;",
      'iOS native atlas budget'
    );

    // Keep source animation motion; do not add a second bob/rotation to Lục Ảnh.
    replace('const idleBob = REDUCED_MOTION ? 0 :', 'const idleBob = REDUCED_MOTION || isLucAnh(unit) || isLinhDong(unit) ? 0 :', 'authored idle motion');
    replace('if (!isOngPho(unit)) context.rotate(lean', 'if (!isOngPho(unit) && !isLucAnh(unit) && !isLinhDong(unit)) context.rotate(lean', 'authored attack baseline');

    // Full-screen flash and random camera impulses read as flicker in the reference battle layout.
    // Retain local authored impact effects and damage feedback.
    replace('    updateEffects(delta);\n', `    updateEffects(delta);
    if (document.body.classList.contains('reference-simple')) {
      cameraFlash = 0; cameraShake = 0; cameraZoom = 0;
    }
`, 'stable reference camera');
    replace('    ctx.setTransform(sx, 0, 0, sy, tx, ty);', `    // Clear the entire backing store without exposing transparent/unpainted margins.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#081416';
    ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    ctx.setTransform(sx, 0, 0, sy, tx, ty);`, 'opaque backbuffer');
    replace('    ctx.clearRect(-100, -100, WORLD.width + 200, WORLD.height + 200);',
      '    // Background and actors are painted in the same animation frame.', 'transformed transparent clear');
    html = html.replace('</head>', `<style id="stable-battle-canvas">
      .game-viewport{position:relative}
      .game-viewport #gameCanvas{position:absolute!important;inset:0;display:block;width:100%!important;height:100%!important;background:#081416!important}
    </style></head>`);
  }
  writeFileSync(path, html);
}
console.log('Supplied audio SFX, stable canvas/camera and authored Luc Anh motion applied');
