(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const screen = document.getElementById('endScreen');
  const card = screen?.querySelector('.card');
  if (!card || document.getElementById('hvEndRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvEndRoot';
  root.setAttribute('aria-label', 'Kết quả');
  root.append(card);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'end';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('end-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithEnd3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
