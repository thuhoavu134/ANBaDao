import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');

function replaceOnce(html, from, to, label) {
  if (!html.includes(from)) throw new Error('TKT-0158 missing ' + label);
  return html.replace(from, to);
}

const indexPath = join(out, 'index.html');
let index = readFileSync(indexPath, 'utf8');

index = replaceOnce(
  index,
  '    overlay.classList.add("is-open", "is-loading");\n',
  `    overlay.classList.add("is-open", "is-loading");
    try { window.HonVietSfx?.unlock?.(); window.HonVietAudio?.unlock?.(); window.HonVietSfx?.setCombatEnabled?.(true); } catch (_) {}
    try { if (typeof playBgm === 'function') playBgm('combat'); } catch (_) {}
`,
  'openIntegratedBattle overlay open'
);

index = replaceOnce(
  index,
  `      activeBattle.enterFallback = setTimeout(() => {
        if (!activeBattle || activeBattle.sessionId !== sessionId || loading.hidden) return;
        window.name = \`hvBattleConfig:\${encodeURIComponent(serializedBattleConfig)}\`;
        location.assign(url);
      }, 1800);`,
  `      activeBattle.enterFallback = setTimeout(() => {
        if (!activeBattle || activeBattle.sessionId !== sessionId || loading.hidden) return;
        loading.firstChild.textContent = "Chiến trường đang khởi tạo — loa trận giữ trên màn hình này.";
      }, 1800);`,
  'enterFallback location.assign'
);

// Audio cleanup belongs to battle-audio-lifecycle-v1.mjs. It preserves shared
// BGM through the result/route handoff; there is no separate host BGM to hush.
// Older index variants may still contain this legacy helper, so adapt it only
// when present instead of failing the production build when it has been removed.
const legacyHush = `  function hushParentBgm() {
    try {
      if (typeof bgmPlayer !== 'undefined' && bgmPlayer) bgmPlayer.pause();
    } catch {}
    try { window.HonVietAudio?.stopCombat?.(); } catch {}
  }`;
if (index.includes(legacyHush)) {
  index = index.replace(legacyHush, `  function hushParentBgm() {
    // TKT-0158: shared audio bus owns music during overlay battle.
  }`);
}

writeFileSync(indexPath, index);

const battlePath = join(out, 'battle.html');
let battle = readFileSync(battlePath, 'utf8');
battle = replaceOnce(
  battle,
  `    if (EMBEDDED) {
      const bgm = window.__HV_BATTLE_BGM || new Audio("assets/audio/bgm-combat-new.mp3");
      bgm.loop = true;
      bgm.volume = 0.42;
      bgm.setAttribute("playsinline", "");
      bgm.onerror = () => {
        if (!bgm.dataset.fallback) {
          bgm.dataset.fallback = "1";
          bgm.src = "assets/audio/bgm-combat.mp3";
          bgm.play().catch(() => {});
        }
      };
      window.__HV_BATTLE_BGM = bgm;
      bgm.play().catch(() => {});
    }`,
  `    if (EMBEDDED) {
      const parentBgm = window.parent !== window && typeof window.parent.playBgm === 'function' ? window.parent.playBgm : null;
      if (parentBgm) {
        try { parentBgm('combat'); } catch (_) {}
      } else {
        const bgm = window.__HV_BATTLE_BGM || new Audio("assets/audio/bgm-combat-new.mp3");
        bgm.loop = true;
        bgm.volume = 0.42;
        bgm.setAttribute("playsinline", "");
        bgm.onerror = () => {
          if (!bgm.dataset.fallback) {
            bgm.dataset.fallback = "1";
            bgm.src = "assets/audio/bgm-combat.mp3";
            bgm.play().catch(() => {});
          }
        };
        window.__HV_BATTLE_BGM = bgm;
        bgm.play().catch(() => {});
      }
    }`,
  'beginBattle embedded BGM'
);
writeFileSync(battlePath, battle);

console.log('TKT-0158: host combat BGM on Xuất chiến; iframe skips HTMLAudio when parent owns it');
