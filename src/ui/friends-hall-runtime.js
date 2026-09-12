(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('friendsBody');
  if (!body || document.getElementById('hvFriendsRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvFriendsRoot';
  root.setAttribute('aria-label', 'Bạn bè');
  root.innerHTML = `<header class="hv-friends-top">
    <button type="button" class="hv-friends-back" data-friends-close aria-label="Đóng">‹</button>
    <b>Bạn bè</b>
    <span></span>
  </header>
  <div class="hv-friends-stage"></div>`;
  root.querySelector('.hv-friends-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'friends';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('friends-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithFriendsHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-friends-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
