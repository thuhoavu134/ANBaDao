(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (document.getElementById('hvChallengeRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvChallengeRoot';
  root.hidden = true;
  root.setAttribute('aria-label', 'Thử Thách');
  root.innerHTML = `<header class="hv-challenge-top">
    <button type="button" class="hv-challenge-back" data-challenge-back aria-label="Về Thành Chính">‹</button>
    <b>Thử Thách</b>
    <span></span>
  </header>
  <div class="hv-challenge-stage"></div>`;
  document.body.append(root);

  let baseStart = typeof startChallenge === 'function' ? startChallenge : null;

  const openHall = () => {
    root.hidden = false;
    root.classList.add('is-open');
    document.body.classList.add('challenge-3d-active');
    paint();
  };
  const closeHall = () => {
    root.hidden = true;
    root.classList.remove('is-open');
    document.body.classList.remove('challenge-3d-active');
  };

  function paint() {
    const stage = root.querySelector('.hv-challenge-stage');
    const defs = (typeof CHALLENGE_DEFS !== 'undefined' && Array.isArray(CHALLENGE_DEFS)) ? CHALLENGE_DEFS : [];
    const cs = (typeof challengeState === 'function') ? challengeState() : { stars: {} };
    stage.replaceChildren();
    defs.forEach(d => {
      const st = (cs.stars && cs.stars[d.id]) || 0;
      const card = document.createElement('article');
      card.className = 'hv-challenge-card';
      card.setAttribute('data-challenge-id', d.id);
      const title = document.createElement('b');
      title.textContent = d.name || '';
      const tag = document.createElement('small');
      tag.textContent = (d.tag || '') + ' · ' + '★'.repeat(st) + '☆'.repeat(Math.max(0, 3 - st));
      const desc = document.createElement('p');
      desc.textContent = d.desc || '';
      const fight = document.createElement('button');
      fight.type = 'button';
      fight.setAttribute('data-challenge-fight', d.id);
      fight.textContent = 'Xuất chiến';
      fight.addEventListener('click', () => {
        if (typeof baseStart === 'function') baseStart(d.id);
      });
      card.append(title, tag, desc, fight);
      stage.append(card);
    });
  }

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithChallenge3d(name) {
    baseShowScreen(name);
    if (name === 'challenge') openHall();
    else if (name === 'hub') closeHall();
  };

  if (baseStart) {
    startChallenge = function honVietStartChallenge(id) {
      openHall();
    };
  }

  root.querySelector('[data-challenge-back]').addEventListener('click', () => {
    closeHall();
    navTo('hub');
  });
})();
