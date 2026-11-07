/* Owner 06/11: Mong Lo theo concept nguyen man duoc duyet (monglo-full.webp).
   Nen la anh concept; chu/so la du lieu that lay tu DOM goc; bam vao the la bam nut that cua game. */
(() => {
  if (typeof document === 'undefined') return;
  const ART = 'assets/ui/expedition/monglo-full.webp';
  const txt = (el) => el ? (el.innerText || '').replace(/\s+/g, ' ').trim() : '';

  function mount() {
    const body = document.getElementById('hvExpeditionRoot');
    if (!body) return;
    const stage = body.querySelector('[data-expedition-path]');
    const offer = body.querySelector('[data-expedition-offer]');
    const routes = body.querySelector('[data-expedition-route]');
    if (!stage && !offer && !routes) return;
    if (document.getElementById('hvm3')) return;

    const nodes = [...body.querySelectorAll('[data-expedition-node]')];
    const routesEls = [...body.querySelectorAll('[data-expedition-route]')];
    const blessEls = [...body.querySelectorAll('[data-expedition-bless]')];
    const floor = txt(body.querySelector('[data-expedition-floor]'));
    const gold = txt(body.querySelector('[data-expedition-gold]'));
    const sigil = txt(body.querySelector('[data-expedition-sigil]'));
    const best = txt(body.querySelector('.hv-exp-best'));
    const wornEl = body.querySelector('[data-expedition-worn]');
    const wornText = wornEl && !/Chưa có/i.test(wornEl.innerText) ? txt(wornEl).replace(/^PHÚC ĐANG MANG\s*/i, '').slice(0, 80) : '';
    const startBtn = body.querySelector('[data-expedition-start]');
    const fightBtn = body.querySelector('[data-expedition-fight]');
    const abortBtn = body.querySelector('[data-expedition-abort]');
    const rerollBtn = body.querySelector('[data-expedition-reroll]');
    const pending = blessEls.length > 0;
    const pick = pending ? blessEls : routesEls;

    const root = document.createElement('div');
    root.id = 'hvm3';
    root.innerHTML = `
      <div class="hvm3-stage">
        <div class="hvm3-floors">${nodes.map((n, i) => `<i class="hvm3-fl ${n.className.replace(/hv-exp-node/g, '').trim()}">${(n.textContent || '').trim() || (i + 1)}</i>`).join('')}</div>
        <div class="hvm3-floor">${floor}</div>
        <div class="hvm3-cards ${pending ? 'is-bless' : ''}">
          ${pick.map((el, i) => `<button type="button" class="hvm3-card${el.classList.contains('is-on') ? ' is-on' : ''}" data-i="${i}">
            <b>${txt(el.querySelector('b')) || txt(el).split(' ')[0]}</b>
            <small>${txt(el.querySelector('small'))}</small></button>`).join('')}
        </div>
        ${rerollBtn ? `<button type="button" class="hvm3-reroll" data-k="reroll" ${rerollBtn.disabled ? 'disabled' : ''}>Đổi bộ Phúc</button>` : ''}
        <div class="hvm3-acts">
          ${startBtn ? '<button type="button" class="hvm3-btn is-main" data-k="start">Bắt đầu Mộng Lộ</button>' : ''}
          ${fightBtn ? `<button type="button" class="hvm3-btn is-main" data-k="fight">${txt(fightBtn)}</button>` : ''}
          ${abortBtn ? '<button type="button" class="hvm3-btn is-sub" data-k="abort">Kết thúc run</button>' : ''}
        </div>
        <div class="hvm3-foot"><span>${gold}</span><span>${sigil}</span><span>${best}</span>${wornText ? `<span>${wornText}</span>` : ''}</div>
      </div>`;
    document.body.append(root);
    body.classList.add('hvm3-under');
    document.body.classList.add('hvm3-on');

    const fire = (el) => { if (!el) return; el.click(); };
    root.addEventListener('click', (ev) => {
      const card = ev.target.closest('.hvm3-card');
      if (card) { fire(pick[Number(card.dataset.i)]); return; }
      const btn = ev.target.closest('.hvm3-btn');
      if (btn) {
        fire({ start: startBtn, fight: fightBtn, abort: abortBtn, reroll: rerollBtn }[btn.dataset.k]);
      }
    });
  }

  function remount() {
    const old = document.getElementById('hvm3');
    if (old) old.remove();
    document.getElementById('hvExpeditionRoot')?.classList.remove('hvm3-under');
    document.body.classList.remove('hvm3-on');
    mount();
  }

  let queued = false;
  const schedule = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; remount(); }, 60); };
  const obs = new MutationObserver(schedule);
  const boot = () => {
    obs.observe(document.body, { childList: true, subtree: true });
    schedule();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.HVM3 = { mount, remount };
})();
