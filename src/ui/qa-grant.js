/* Owner 2026-11-04: chi o che do QA (?qa=unlock-all) - nap thu ngoc/vang de kiem man quay */
(() => {
  if (typeof document === 'undefined') return;
  if (!/[?&]qa=unlock-all/.test(location.search)) return;
  const add = () => {
    if (document.getElementById('hvQaGrant')) return;
    const b = document.createElement('button');
    b.id = 'hvQaGrant';
    b.type = 'button';
    b.textContent = 'QA +9999';
    Object.assign(b.style, {
      position: 'fixed', right: '10px', bottom: 'calc(96px + env(safe-area-inset-bottom))',
      zIndex: 999, background: '#2f8a64', color: '#fff', border: '1px solid #9fe0c0',
      borderRadius: '999px', padding: '8px 14px', fontWeight: '800', fontSize: '13px'
    });
    b.onclick = () => {
      try { P.gems = (Number(P.gems) || 0) + 9999; P.gold = (Number(P.gold) || 0) + 99999; } catch (_) {}
      // Owner 2026-11-12: cấp đủ nguyên liệu Rèn (Tinh/Hoạt) để test chế đồ + cường hoá.
      try { P.tinh = (Number(P.tinh) || 0) + 9999; P.hoat = (Number(P.hoat) || 0) + 9999; } catch (_) {}
      try { if (typeof renderForge === 'function' && document.querySelector('.fa-root')) renderForge(); } catch (_) {}
      try { if (typeof persist === 'function') persist(); } catch (_) {}
      try { if (typeof refreshResbar === 'function') refreshResbar(); } catch (_) {}
      try { if (typeof renderSummon === 'function') renderSummon(); } catch (_) {}
      b.textContent = 'QA +9999 ✓';
      setTimeout(() => { b.textContent = 'QA +9999'; }, 1200);
    };
    document.body.append(b);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
  setInterval(add, 2000);
})();
