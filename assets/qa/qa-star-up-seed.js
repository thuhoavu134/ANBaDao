// Preview-only star-up QA profile. Saves under its own key and stays offline.
(() => {
  if (typeof __HV_QA_STARUP__ === 'undefined' || !__HV_QA_STARUP__) return;

  const heroId = 'thay_mo';
  const seed = () => {
    if (typeof DATA === 'undefined' || !DATA.heroes[heroId] || typeof defaultPlayer !== 'function') return false;
    const player = defaultPlayer();
    player.heroes[heroId].owned = true;
    player.heroes[heroId].stars = rarityBaseStars(DATA.heroes[heroId]);
    player.gold = 5000000;
    player.gems = 50000;
    player.so = 5000;
    player.tinh = 5000;
    player.hoat = 5000;
    player.stamina = DATA.daily.stamCap;
    player.shards[heroId] = 10000;
    player.economy = player.economy || {};
    player.economy.dreamEssence = 5000;
    player.economy.spark = 5000;
    P = player;
    persist();
    if (typeof refreshResbar === 'function') refreshResbar();
    if (typeof renderHeroDetail === 'function') renderHeroDetail(heroId);
    if (typeof showScreen === 'function') showScreen('heroDetail');
    return true;
  };

  const banner = document.createElement('aside');
  banner.setAttribute('aria-label', 'Hồ sơ thử nghiệm thăng sao');
  Object.assign(banner.style, {
    position: 'fixed', zIndex: '10000', left: '50%', bottom: 'calc(12px + env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px',
    maxWidth: 'calc(100vw - 24px)', padding: '8px 10px 8px 14px', borderRadius: '999px',
    color: '#f8e9c9', background: 'linear-gradient(135deg,#211b17,#42301f)',
    border: '1px solid #d2aa5d', boxShadow: '0 5px 20px #0009',
    font: '600 12px/1.2 system-ui,sans-serif'
  });
  const label = document.createElement('span');
  label.textContent = 'QA PREVIEW · khách cục bộ · không đồng bộ';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Đặt lại';
  reset.setAttribute('aria-label', 'Đặt lại hồ sơ thử nghiệm thăng sao');
  Object.assign(reset.style, {
    minWidth: '72px', minHeight: '44px', borderRadius: '999px', border: '1px solid #e8c974',
    color: '#241b10', background: 'linear-gradient(#f7df9c,#c89b44)',
    font: '700 12px system-ui,sans-serif', cursor: 'pointer'
  });
  reset.addEventListener('click', () => {
    if (seed() && typeof toast === 'function') toast('Hồ sơ QA đã được đặt lại.');
  });
  banner.append(label, reset);
  document.body.appendChild(banner);

  if (!seed()) {
    label.textContent = 'QA PREVIEW · hồ sơ chưa sẵn sàng';
    reset.disabled = true;
  }
})();
