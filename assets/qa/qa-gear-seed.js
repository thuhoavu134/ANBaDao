// Owner 2026-10-25: "cho a full đồ và nguyên liệu để cường hoá đến +15 để a test".
// Runs ONLY with ?qa=gear. Normal players never see it.
//
// The app loads the save AFTER the page load event, so a single early write is thrown away (the owner's device still
// showed 500 gold). This keeps re-applying until the state actually holds, then saves it.
(() => {
  const flag = () => { try { return new URLSearchParams(location.search).get('qa') === 'gear'; } catch (_) { return false; } };
  if (!flag()) return;

  const TARGET_GOLD = 5000000;

  function apply() {
    try {
      if (typeof P === 'undefined' || typeof ST === 'undefined' || typeof renderForge !== 'function') return false;
      const slots = ['weapon', 'armor', 'charm', 'boots'];
      P.inventory = P.inventory || [];
      P.itemSeq = Number(P.itemSeq) || 0;
      const have = new Set(P.inventory.map(i => i.slot + ':' + i.rar + '@' + i.lvl));
      for (const slot of slots) {
        for (const rar of ['ssr', 'ss', 's', 'a', 'b']) {
          if (have.has(slot + ':' + rar + '@0')) continue;
          P.inventory.push({ uid: ++P.itemSeq, slot, rar, lvl: 0, mold: 'strike' });
        }
      }
      // Owner 2026-10-25: trần cường hoá theo phẩm + màu cường hoá không đè màu sẵn.
      // Mỗi phẩm một món đã cường hoá để nhìn thấy đúng luật:
      //   b +10 (tím, chạm trần) · a +9 (tím) · s +12 (vàng kim, chạm trần)
      //   ss +9 (vẫn kính vàng, không lửa tím) · ss +14 (lửa đỏ) · ssr +12 (vẫn kính đỏ) · ssr +15 (lửa đỏ, chạm trần)
      for (const [slot, rar, lvl] of [['weapon', 'b', 10], ['armor', 'a', 9], ['charm', 's', 12],
        ['boots', 'ss', 9], ['weapon', 'ss', 14], ['armor', 'ssr', 12], ['boots', 'ssr', 15]]) {
        if (P.inventory.some(i => i.slot === slot && i.rar === rar && i.lvl === lvl)) continue;
        P.inventory.push({ uid: ++P.itemSeq, slot, rar, lvl, mold: 'strike' });
      }
      P.clearedChapters = Array.from(new Set([...(P.clearedChapters || []), 1, 2, 3, 4]));
      P.maxChapter = Math.max(Number(P.maxChapter) || 0, 4);
      P.gold = Math.max(Number(P.gold) || 0, TARGET_GOLD);
      P.hoat = Math.max(Number(P.hoat) || 0, 5000);
      P.tinh = Math.max(Number(P.tinh) || 0, 5000);
      if (typeof refreshResbar === 'function') refreshResbar();

      // The router hides/shows screens with inline display (SCREENS map -> showScreen), so go straight through it.
      const forgeEl = document.getElementById('forgeScreen');
      const visible = forgeEl && forgeEl.style.display !== 'none';
      if (!visible) {
        if (typeof showScreen === 'function') showScreen('forge');
        else {
          ST.screen = 'forge';
          if (typeof SCREENS === 'object') for (const k in SCREENS) {
            const el = document.getElementById(SCREENS[k]);
            if (el) el.style.display = (k === 'forge' ? 'block' : 'none');
          }
        }
      }
      if (!document.querySelector('.econ-item')) renderForge();

      try { if (typeof persist === 'function') persist(); } catch (_) {}
      const fe = document.getElementById('forgeScreen');
      return Number(P.gold) >= TARGET_GOLD && !!fe && fe.style.display !== 'none' && !!document.querySelector('.econ-item');
    } catch (e) {
      window.__QA_GEAR_ERR = String((e && e.message) || e);
      return false;
    }
  }

  let ticks = 0, stable = 0;
  const tick = () => {
    const ok = apply();
    stable = ok ? stable + 1 : 0;
    window.__QA_GEAR_DONE = { ok, stable, ticks, at: Date.now() };
    if (stable >= 3 || ++ticks > 80) {
      if (stable >= 3 && typeof toast === 'function') toast('🧪 Bộ đồ test: 20 món +0, cộng 7 món đã cường hoá theo từng phẩm · 5.000.000 vàng');
      return;
    }
    setTimeout(tick, 400);
  };
  if (document.readyState === 'complete') setTimeout(tick, 400);
  else window.addEventListener('load', () => setTimeout(tick, 400));
})();
