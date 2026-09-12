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
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'jobs';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('jobs-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithJobsHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-jobs-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
