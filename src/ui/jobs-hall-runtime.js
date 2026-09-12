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

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithJobsHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-jobs-close]').addEventListener('click', () => navTo('hub'));
  street.addEventListener('click', ev => {
    if (!ev.target.closest('[data-jobs-street-claim]')) return;
    if (typeof socialClaimDaily === 'function' && socialClaimDaily()) paintStreet();
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
