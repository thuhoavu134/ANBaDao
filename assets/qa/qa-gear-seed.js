// Owner 2026-10-25: "cho a full đồ và nguyên liệu để cường hoá đến +15 để a test".
// Opens the forge with a test kit ONLY when the URL carries ?qa=gear - normal players never see it.
(() => {
  const on = () => { try { return new URLSearchParams(location.search).get('qa') === 'gear'; } catch (_) { return false; } };
  function seed() {
    if (!on() || typeof P === 'undefined' || typeof renderForge !== 'function') return;
    const slots = ['weapon', 'armor', 'charm', 'boots'];
    const names = { b: 'b', a: 'a', s: 's', ss: 'ss', ssr: 'ssr' };
    P.inventory = P.inventory || [];
    P.itemSeq = Number(P.itemSeq) || 0;
    for (const slot of slots) {
      // one of every rarity at +0 so each colour tier can be walked up by hand
      for (const rar of ['ssr', 'ss', 's', 'a', 'b']) {
        P.inventory.push({ uid: ++P.itemSeq, slot, rar, lvl: 0, mold: 'strike' });
      }
    }
    // The forge and the bag are locked behind chapter progress, so a test kit also has to open them.
    P.clearedChapters = Array.from(new Set([...(P.clearedChapters || []), 1, 2, 3, 4]));
    P.maxChapter = Math.max(Number(P.maxChapter) || 0, 4);
    P.gold = Math.max(Number(P.gold) || 0, 5000000);
    P.hoat = Math.max(Number(P.hoat) || 0, 5000);
    P.tinh = Math.max(Number(P.tinh) || 0, 5000);
    if (typeof persist === 'function') persist();
    if (typeof refreshResbar === 'function') refreshResbar();
    try { ST.screen = 'forge'; document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === 'forge')); } catch (_) {}
    renderForge();
    if (typeof toast === 'function') toast('🧪 Bộ đồ test: 20 món +0 · 5.000.000 vàng · 5.000 Hoạt Lực · 5.000 Tinh Lực');
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(seed, 900);
  else window.addEventListener('load', () => setTimeout(seed, 900));
})();
