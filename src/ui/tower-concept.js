/* Owner 2026-11-06: ray leo tang cho man Thap theo concept 9.
   Chi doc du lieu that (P.tower) va bam lai nut that trong markup cu — khong tu xu ly logic. */
(() => {
  if (typeof document === 'undefined') return;
  const BOSS_EVERY = 5;
  function mount() {
    const root = document.getElementById('hvTowerRoot');
    if (!root || !root.classList.contains('is-open')) return;
    if (typeof P !== 'object' || !P || !P.tower) return;
    const f = Number(P.tower.floor) || 1;
    const best = Math.max(Number(P.tower.best) || 0, f - 1);
    const climb = root.querySelector('[data-tower-climb]');
    const floors = [f - 2, f - 1, f, f + 1, f + 2].filter(n => n >= 1);
    const html = floors.map(n => {
      const cls = n < f ? 'done' : n === f ? 'now' : 'next';
      const boss = n % BOSS_EVERY === 0 ? ' boss' : '';
      return `<div class="hvt-node ${cls}${boss}" data-floor="${n}"${n === f ? ' role="button" tabindex="0" aria-label="Leo tầng ' + n + '"' : ''}>${n}</div>`;
    }).join('');
    let rail = root.querySelector('.hvt-rail');
    if (!rail) { rail = document.createElement('div'); rail.className = 'hvt-rail'; root.append(rail); }
    rail.innerHTML = html;
    const now = rail.querySelector('.hvt-node.now');
    if (now && now.dataset.wired !== '1') {
      now.dataset.wired = '1';
      const go = () => { const b = document.querySelector('#hvTowerRoot [data-tower-climb]'); if (b && !b.disabled) b.click(); };
      now.addEventListener('click', go);
      now.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    }
    rail.title = `Tầng ${f} · kỷ lục ${best}`;
  }
  const start = () => {
    mount();
    const root = document.getElementById('hvTowerRoot');
    if (!root) { setTimeout(start, 400); return; }
    new MutationObserver(() => mount()).observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden']});
    const body = document.getElementById('towerBody');
    if (body) new MutationObserver(() => mount()).observe(body, {childList: true, subtree: true});
    document.addEventListener('click', () => setTimeout(mount, 60), true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
