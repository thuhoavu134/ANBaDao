(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('chatBody');
  if (!body || document.getElementById('hvChatRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvChatRoot';
  root.setAttribute('aria-label', 'Trò chuyện');
  root.innerHTML = `<div class="hv-chat-panel">
    <header class="hv-chat-top">
      <button type="button" class="hv-chat-back" data-chat-close aria-label="Đóng">‹</button>
      <b>Trò chuyện</b>
      <span></span>
    </header>
    <div class="hv-chat-stage"></div>
  </div>`;
  root.querySelector('.hv-chat-stage').append(body);
  document.body.append(root);

  const syncOpen = name => {
    const open = name === 'chat';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('chat-hall-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithChatHall(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  root.querySelector('[data-chat-close]').addEventListener('click', () => navTo('hub'));
  root.addEventListener('click', ev => {
    if (ev.target === root) navTo('hub');
  });
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
