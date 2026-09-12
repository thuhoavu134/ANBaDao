(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const stage = document.querySelector('#storyScreen .vnstage');
  if (!stage || document.getElementById('hvStoryRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvStoryRoot';
  root.setAttribute('aria-label', 'Cốt truyện');
  root.innerHTML = `<header class="hv-story-top">
    <button type="button" class="hv-story-back" data-story-close aria-label="Về Thành Chính">‹</button>
    <b>Cốt truyện</b>
    <span></span>
  </header>
  <div class="hv-story-stage"></div>`;
  root.querySelector('.hv-story-stage').append(stage);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'story';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('story-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithStory3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-story-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
