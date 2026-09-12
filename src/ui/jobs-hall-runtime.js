(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('jobsBody');
  if (!body || document.getElementById('hvJobsRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvJobsRoot';
  root.setAttribute('aria-label', 'Giao việc');
  root.innerHTML = `<header class="hv-jobs-top">
    <button type="button" class="hv-jobs-back" data-jobs-close aria-label="Đóng">‹</button>
    <b>Giao việc</b>
    <span></span>
  </header>
  <div class="hv-jobs-stage"></div>`;
  root.querySelector('.hv-jobs-stage').append(body);
  const street = document.createElement('div');
  street.className = 'hv-jobs-street';
  street.setAttribute('data-jobs-street', '');
  root.querySelector('.hv-jobs-stage').prepend(street);

  function paintStreet() {
    if (typeof P !== 'object') return;
    const posts = Math.min(3, (P.social && P.social.posts) || 0);
    const claimed = !!(P.social && P.social.claimed);
    const ok = posts >= 3 && !claimed;
    street.innerHTML = `<b>Giao Lưu Phố</b> · việc vặt ${posts}/3
      <small>Gửi 3 tin bất kỳ kênh. Thưởng 🪙120.</small>
      <button type="button" data-jobs-street-claim ${ok ? '' : 'disabled'}>${claimed ? 'Đã nhận ✓' : 'Nhận 🪙120'}</button>`;
  }
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'jobs';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('jobs-hall-active', open);
    if (open) paintStreet();
  };

  if (typeof renderJobs === 'function') {
    const baseJobs = renderJobs;
    renderJobs = function renderJobsWithSlots() {
      baseJobs.apply(this, arguments);
      restyleJobs();
    };
  }

  function face(id) {
    if (typeof heroThumbInline === 'function') return heroThumbInline(id, 'avatar');
    return '';
  }

  function restyleJobs() {
    body.querySelectorAll('.jobcard').forEach(card => {
      const pick = card.querySelector('.jpick');
      const go = card.querySelector('[data-jgo]');
      if (!pick || !go) return;
      const jid = go.getAttribute('data-jgo');
      const picks = (typeof _jobsPick === 'object' && _jobsPick[jid]) || [];
      let slots = card.querySelector('.hv-job-slots');
      if (!slots) {
        slots = document.createElement('div');
        slots.className = 'hv-job-slots';
        pick.before(slots);
      }
      slots.innerHTML = [0, 1].map(i => {
        const id = picks[i];
        if (!id) return `<button type="button" class="hv-job-slot is-empty" aria-label="Chọn tướng"></button>`;
        return `<button type="button" class="hv-job-slot is-on" data-jh="${jid}:${id}" style="${face(id)}" aria-label="Bỏ tướng"></button>`;
      }).join('');
      pick.querySelectorAll('.jchip').forEach(b => {
        const id = (b.getAttribute('data-jh') || '').split(':')[1];
        if (!id) return;
        b.textContent = '';
        b.setAttribute('style', (b.getAttribute('style') || '') + face(id));
        b.classList.add('hv-job-face');
      });
    });
  }

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithJobsHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-jobs-close]').addEventListener('click', () => navTo('hub'));
  root.addEventListener('click', ev => {
    const slot = ev.target.closest('.hv-job-slot[data-jh]');
    if (!slot || !root.contains(slot)) return;
    const chip = body.querySelector('.jchip[data-jh="' + slot.getAttribute('data-jh') + '"]');
    if (chip) chip.click();
  });
  street.addEventListener('click', ev => {
    if (!ev.target.closest('[data-jobs-street-claim]')) return;
    if (typeof socialClaimDaily === 'function' && socialClaimDaily()) paintStreet();
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
