(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (document.getElementById('hvHubBackChip')) return;

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.id = 'hvHubBackChip';
  chip.setAttribute('data-hv-hub', '');
  chip.setAttribute('aria-label', 'Thành Chính');
  chip.textContent = '‹';
  document.body.append(chip);

  function overlayOpen() {
    return !!document.getElementById('hvBattleOverlay')?.classList.contains('is-open');
  }
  function endOpen() {
    const end = document.getElementById('endScreen');
    const veil = document.getElementById('integratedResultV6');
    const screen = typeof ST === 'object' ? ST.screen : '';
    const endVisible = end && end.classList.contains('active');
    const veilVisible = veil && (veil.classList.contains('show') || getComputedStyle(veil).display !== 'none');
    return screen === 'end' || endVisible || veilVisible;
  }
  function gearInner() {
    const root = document.getElementById('hvGearRoot');
    if (!root || root.hidden || !root.classList.contains('is-open')) return false;
    const active = root.querySelector('.hv-gear-screen.is-active');
    const view = active?.getAttribute('data-gear-view') || '';
    return view && view !== 'wheel';
  }
  function lichOpen() {
    if (document.body.classList.contains('hv-lich-open')) return true;
    const root = document.getElementById('hvLichRoot');
    return !!(root && !root.hidden && root.classList.contains('is-open'));
  }
  function hallOwnBack() {
    if (overlayOpen()) return false;
    const b = document.body.classList;
    return b.contains('expedition-3d-active') || b.contains('hunt-3d-active');
  }
  function needed() {
    if (lichOpen()) return false;
    if (hallOwnBack()) return false;
    return overlayOpen() || endOpen() || gearInner();
  }
  function sync() {
    chip.classList.toggle('is-on', needed());
  }
  function hideBattleOverlay() {
    const overlay = document.getElementById('hvBattleOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open', 'is-loading');
    overlay.hidden = true;
    const frame = overlay.querySelector('#hvBattleFrame');
    if (frame) {
      frame.removeAttribute('srcdoc');
      try { frame.src = 'about:blank'; } catch {}
    }
  }
  function abortBattleToHub() {
    const bridge = typeof window !== 'undefined' ? window.HonVietMetaBridge : null;
    if (bridge && typeof bridge.abort === 'function') {
      try { bridge.abort('hub'); } catch {}
    } else if (typeof abortIntegratedBattle === 'function') {
      try { abortIntegratedBattle('hub'); } catch {}
    }
    hideBattleOverlay();
  }
  function goHub() {
    if (overlayOpen()) {
      abortBattleToHub();
      if (typeof navTo === 'function') navTo('hub');
      sync();
      return;
    }
    const gear = document.getElementById('hvGearRoot');
    if (gear) {
      gear.hidden = true;
      gear.classList.remove('is-open');
    }
    const lich = document.getElementById('hvLichRoot');
    if (lich) {
      lich.hidden = true;
      lich.classList.remove('is-open');
    }
    document.body.classList.remove('hv-lich-open');
    navTo('hub');
    sync();
  }

  chip.addEventListener('click', goHub);

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithHubBack(name) {
    baseShowScreen(name);
    sync();
  };

  const obs = new MutationObserver(sync);
  const watch = id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el, { attributes: true, attributeFilter: ['class', 'hidden'], subtree: true });
  };
  watch('hvBattleOverlay');
  watch('hvGearRoot');
  watch('hvLichRoot');
  watch('endScreen');
  watch('integratedResultV6');
  obs.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true });
  sync();
})();
