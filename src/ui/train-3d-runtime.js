(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (document.getElementById('hvTrainRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvTrainRoot';
  root.hidden = true;
  root.setAttribute('aria-label', 'Giáo Trường');
  root.innerHTML = `<header class="hv-train-top">
    <button type="button" class="hv-train-back" data-train-back aria-label="Về Thành Chính">‹</button>
    <b>Giáo Trường</b>
    <span></span>
  </header>
  <div class="hv-train-stage">
    <p class="hv-train-copy">Sân đình luyện tâm. Trừ Độ Tỉnh Táo rồi vào trận Bóng Hắc Liên.</p>
    <p class="hv-train-cost" data-train-cost></p>
    <button type="button" class="hv-train-fight" data-train-fight>Luyện</button>
  </div>`;
  document.body.append(root);

  const costLabel = root.querySelector('[data-train-cost]');
  const trainCost = () => (typeof DATA === 'object' && DATA.daily && DATA.daily.costTrain) || 4;

  const openHall = () => {
    root.hidden = false;
    root.classList.add('is-open');
    document.body.classList.add('train-3d-active');
    if (costLabel) costLabel.textContent = '⚡ ' + trainCost();
  };
  const closeHall = () => {
    root.hidden = true;
    root.classList.remove('is-open');
    document.body.classList.remove('train-3d-active');
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithTrain3d(name) {
    baseShowScreen(name);
    if (name === 'train' || (typeof ST === 'object' && ST.screen === 'train')) openHall();
    else if (name === 'hub') closeHall();
  };

  if (typeof startTraining === 'function') {
    startTraining = function honVietStartTraining() {
      openHall();
    };
  }

  root.querySelector('[data-train-back]').addEventListener('click', () => {
    closeHall();
    navTo('hub');
  });
  root.querySelector('[data-train-fight]').addEventListener('click', () => {
    if (typeof refreshStamina === 'function') refreshStamina();
    if (typeof spendStamina === 'function' && !spendStamina(trainCost())) {
      if (typeof toast === 'function') toast('Không đủ Độ Tỉnh Táo ⚡');
      return;
    }
    if (typeof refreshResbar === 'function') refreshResbar();
    ST.mode = 'train';
    runBattle('luyen_tap', () => {
      ST.mode = null;
      openHall();
    });
  });
})();
