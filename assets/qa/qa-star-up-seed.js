// Preview-only star-up QA profile. Saves under its own key and stays offline.
(() => {
  if (typeof __HV_QA_STARUP__ === 'undefined' || !__HV_QA_STARUP__) return;

  const heroId = 'thay_mo';
  const refillMaterials = player => {
    player.gold = Math.max(Number(player.gold) || 0, 5000000);
    player.gems = Math.max(Number(player.gems) || 0, 50000);
    for (const key of ['so', 'tinh', 'hoat']) player[key] = Math.max(Number(player[key]) || 0, 5000);
    player.stamina = DATA.daily.stamCap;
    player.shards = player.shards || {};
    for (const id of Object.keys(DATA.heroes)) player.shards[id] = Math.max(Number(player.shards[id]) || 0, 10000);
    player.economy = player.economy || {};
    for (const key of ['dreamEssence', 'spark']) player.economy[key] = Math.max(Number(player.economy[key]) || 0, 5000);
  };
  const seed = () => {
    if (typeof DATA === 'undefined' || !DATA.heroes[heroId] || typeof defaultPlayer !== 'function') return false;
    const player = defaultPlayer();
    for (const [id, hero] of Object.entries(DATA.heroes)) {
      player.heroes[id] = player.heroes[id] || {};
      player.heroes[id].owned = true;
      player.heroes[id].stars = rarityBaseStars(hero);
    }
    refillMaterials(player);
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
  label.textContent = 'TEST THĂNG SAO · 10.000 mảnh/tướng';
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
  const refill = document.createElement('button');
  refill.type = 'button'; refill.textContent = 'Nạp nguyên liệu';
  refill.setAttribute('aria-label', 'Nạp nguyên liệu thử nghiệm, giữ nguyên cấp và sao');
  Object.assign(refill.style, reset.style);
  refill.addEventListener('click', () => {
    refillMaterials(P); persist();
    if (typeof refreshResbar === 'function') refreshResbar();
    const selected = document.getElementById?.('hvHeroDetailRoot')?.dataset.heroId;
    if (typeof renderHeroDetail === 'function') renderHeroDetail(DATA.heroes[selected] ? selected : heroId);
    if (typeof showScreen === 'function') showScreen('heroDetail');
    if (typeof toast === 'function') toast('Đã nạp đủ nguyên liệu test. Giữ nguyên cấp và sao.');
  });
  banner.style.flexWrap = 'wrap'; banner.style.justifyContent = 'center';
  label.style.flexBasis = '100%'; label.style.textAlign = 'center';
  banner.style.borderRadius = '12px';
  banner.append(label, reset, refill);
  document.body.appendChild(banner);

  if (!seed()) {
    label.textContent = 'QA PREVIEW · hồ sơ chưa sẵn sàng';
    reset.disabled = true;
    refill.disabled = true;
  }
})();

