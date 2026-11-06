/* Owner 2026-11-06c: ray leo tang + thay emoji bang icon that cua game (tranh loi icon tren may khac nhau).
   Chi doc du lieu that (P.tower) va bam lai nut that trong markup cu — khong tu xu ly logic. */
(() => {
  if (typeof document === 'undefined') return;
  const BOSS_EVERY = 5;
  const TRIAL_ART = { intact: 'assets/ui/tower/trial-intact.webp', swift: 'assets/ui/tower/trial-swift.webp', self: 'assets/ui/tower/trial-self.webp' };
  const ICONS = [
    { re: /\u{1F4B0}|\u{1FA99}/gu, src: 'assets/ui/menu-v3233/icons/resource-gold-imagen.png', alt: 'vàng' },
    { re: /\u26A1|\u{1F50B}/gu, src: 'assets/ui/menu-v3233/icons/resource-energy-imagen.png', alt: 'nộ' },
    { re: /\u{1F48E}/gu, src: 'assets/ui/menu-v3233/icons/resource-gem-imagen.png', alt: 'ngọc' }
  ];

  /** Replace emoji glyphs with the game's own resource icons, so rendering is identical on every device. */
  function iconize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !ICONS.some((i) => i.re.test(node.nodeValue))) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest('.hvt-rail')) return NodeFilter.FILTER_REJECT;
        ICONS.forEach((i) => (i.re.lastIndex = 0));
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    for (const node of targets) {
      const text = node.nodeValue || '';
      const frag = document.createDocumentFragment();
      let rest = text;
      ICONS.forEach((i) => (i.re.lastIndex = 0));
      let guard = 0;
      while (rest.length && guard++ < 40) {
        let hit = null;
        for (const icon of ICONS) {
          icon.re.lastIndex = 0;
          const m = icon.re.exec(rest);
          if (m && (!hit || m.index < hit.index)) hit = { index: m.index, len: m[0].length, icon };
        }
        if (!hit) { frag.append(document.createTextNode(rest)); break; }
        if (hit.index > 0) frag.append(document.createTextNode(rest.slice(0, hit.index)));
        const img = document.createElement('img');
        img.src = hit.icon.src;
        img.alt = hit.icon.alt;
        img.className = 'hvt-ico';
        img.loading = 'lazy';
        img.decoding = 'async';
        frag.append(img);
        rest = rest.slice(hit.index + hit.len);
      }
      node.replaceWith(frag);
    }
  }

  function mount() {
    const root = document.getElementById('hvTowerRoot');
    if (!root || !root.classList.contains('is-open')) return;
    if (typeof P !== 'object' || !P || !P.tower) return;

    const f = Number(P.tower.floor) || 1;
    const best = Math.max(Number(P.tower.best) || 0, f - 1);
    const floors = [f - 2, f - 1, f, f + 1, f + 2].filter((n) => n >= 1);
    const html = floors
      .map((n) => {
        const cls = n < f ? 'done' : n === f ? 'now' : 'next';
        const boss = n % BOSS_EVERY === 0 ? ' boss' : '';
        const aria = n === f ? ` role="button" tabindex="0" aria-label="Leo tầng ${n}"` : '';
        return `<div class="hvt-node ${cls}${boss}" data-floor="${n}"${aria}>${n}</div>`;
      })
      .join('');

    let rail = root.querySelector('.hvt-rail');
    if (!rail) { rail = document.createElement('div'); rail.className = 'hvt-rail'; root.append(rail); }
    rail.innerHTML = html;
    rail.title = `Tầng ${f} · kỷ lục ${best}`;

    const now = rail.querySelector('.hvt-node.now');
    if (now && now.dataset.wired !== '1') {
      now.dataset.wired = '1';
      const go = () => {
        const b = document.querySelector('#hvTowerRoot [data-tower-climb]');
        if (b && !b.disabled) b.click();
      };
      now.addEventListener('click', go);
      now.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    }

    // Owner 2026-11-06: icon thu thach moi (thay seal cu)
    root.querySelectorAll('[data-tower-trial]').forEach((btn) => {
      const id = btn.dataset.towerTrial;
      const img = btn.querySelector('img');
      const src = TRIAL_ART[id];
      if (img && src && !img.src.endsWith(src)) img.src = src;
    });
    iconize(root);
  }

  const start = () => {
    mount();
    const root = document.getElementById('hvTowerRoot');
    if (!root) { setTimeout(start, 400); return; }
    new MutationObserver(() => mount()).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    const body = document.getElementById('towerBody');
    if (body) new MutationObserver(() => mount()).observe(body, { childList: true, subtree: true });
    document.addEventListener('click', () => setTimeout(mount, 60), true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
