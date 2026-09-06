import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let html = readFileSync(battlePath, 'utf8');

function replaceOnce(from, to, label) {
  if (!html.includes(from)) throw new Error('Battle fix missing ' + label);
  html = html.replace(from, to);
}

/* iPad portrait was taking the desktop world coordinates, so the outer row was cropped. */
replaceOnce(
  'const position = (innerWidth < 600 ? MOBILE_POSITIONS : POSITIONS)[hero.team][hero.slot];',
  'const battleCompactViewport = innerWidth < 600 || (innerHeight > innerWidth && innerWidth <= 1180);\\n      const position = (battleCompactViewport ? MOBILE_POSITIONS : POSITIONS)[hero.team][hero.slot];',
  'portrait formation selector'
);

/* Lục Ảnh's final VFX is drawn with a baseline-centered cell; its previous +150 anchor
   moved the whole effect below the enemy formation. */
replaceOnce(
  'drawLucAnhAtlas(context,key,frame,anchorX,anchorY+255,960,660,{baseline:330,screen:false,alpha:1});',
  'drawLucAnhAtlas(context,key,frame,anchorX,anchorY,960,660,{baseline:330,screen:false,alpha:1});',
  'Lục Ảnh ultimate formation anchor'
);

/* Keep this ultimate local: no full-screen camera kick/flash, while the authored local
   effect and damage presentation continue to render. */
replaceOnce(
  '    cameraFocus = { x: fx, y: fy - 42 };\\n    cameraZoom = Math.max(cameraZoom, REDUCED_MOTION ? 0 : 0.035 + level * 0.055);\\n    cameraShake = Math.max(cameraShake, REDUCED_MOTION ? 0 : 3 + level * 8);\\n    cameraFlash = Math.max(cameraFlash, REDUCED_MOTION ? 0 : 0.08 + level * 0.18);',
  '    const stableLucAnhUltimate = action === "ultimate" && isLucAnh(actor);\\n    cameraFocus = stableLucAnhUltimate ? { x: WORLD.width / 2, y: WORLD.height / 2 } : { x: fx, y: fy - 42 };\\n    cameraZoom = stableLucAnhUltimate ? 0 : Math.max(cameraZoom, REDUCED_MOTION ? 0 : 0.035 + level * 0.055);\\n    cameraShake = stableLucAnhUltimate ? 0 : Math.max(cameraShake, REDUCED_MOTION ? 0 : 3 + level * 8);\\n    cameraFlash = stableLucAnhUltimate ? 0 : Math.max(cameraFlash, REDUCED_MOTION ? 0 : 0.08 + level * 0.18);',
  'Lục Ảnh stable impact presentation'
);

/* Lục Ảnh's dedicated voice path did not dispatch the shared ultimate SFX. */
replaceOnce(
  'dom.phaseLabel.textContent="Tuyệt kỹ • Đèn xoay cực đại";playLucAnhUltimateVoice();',
  'dom.phaseLabel.textContent="Tuyệt kỹ • Đèn xoay cực đại";playLucAnhUltimateVoice();playActionSound(actor,"ultimate");',
  'Lục Ảnh ultimate SFX dispatch'
);

/* The supplied buffer SFX own campaign audio. Silence any legacy oscillator beep in
   the simple embedded battle so one event cannot produce a crackling double-hit. */
replaceOnce(
  '  function tone(frequency, duration = 0.08, type = "sine", volume = 0.035, delay = 0) {\\n    if (!state.sound) return;',
  '  function tone(frequency, duration = 0.08, type = "sine", volume = 0.035, delay = 0) {\\n    if (REFERENCE_SIMPLE || !state.sound) return;',
  'legacy combat oscillator guard'
);

if (!html.includes('battleCompactViewport') ||
    !html.includes('anchorY,960,660') ||
    !html.includes('stableLucAnhUltimate') ||
    !html.includes('playActionSound(actor,"ultimate")') ||
    !html.includes('REFERENCE_SIMPLE || !state.sound')) {
  throw new Error('Battle responsive/Lục Ảnh/audio fixes did not apply');
}

writeFileSync(battlePath, html);
console.log('iPad formation, Lục Ảnh anchor/camera and combat audio fixes applied');
