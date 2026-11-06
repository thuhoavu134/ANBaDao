/* Mộng Lộ: nút quay về vuông, chống nhân bản khung, bỏ emoji trong chữ (owner 06/11). */
(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2500}-\u{25FF}]/gu;

  function stripEmoji(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.nodeValue && EMOJI.test(n.nodeValue)) hits.push(n);
      EMOJI.lastIndex = 0;
    }
    hits.forEach(n => {
      const next = n.nodeValue.replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim();
      if (!next) {
        const host = n.parentElement;
        if (host && host.children.length === 0) host.style.display = 'none';
        else n.nodeValue = '';
      } else n.nodeValue = next;
    });
  }

  function dedupe() {
    const roots = [...document.querySelectorAll('#hvExpeditionRoot')];
    if (roots.length < 2) return;
    const fresh = roots.find(r => r.parentElement && r.parentElement.id === 'expeditionBody') || roots[roots.length - 1];
    roots.forEach(r => { if (r !== fresh) r.remove(); });
  }

  function mark() {
    const screen = document.getElementById('expeditionScreen');
    if (!screen) return;
    screen.classList.add('hve-concept');
    const root = document.getElementById('hvExpeditionRoot');
    if (root) stripEmoji(root);
    dedupe();
    if (!document.querySelector('.hve-back')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hve-back';
      btn.setAttribute('aria-label', 'Về Thành Chính');
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof navTo === 'function') navTo('hub');
      });
      document.body.append(btn);
    }
  }

  const observer = new MutationObserver(mark);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  mark();
})();
