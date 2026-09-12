(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (window.__HV_OVERLAY_SAFARI) return;
  window.__HV_OVERLAY_SAFARI = true;

  const openRoots = () => [...document.querySelectorAll('[id^="hv"]')].filter(el =>
    el.classList.contains('is-open') && !el.hidden && el.parentElement === document.body
  );

  const pin = () => {
    const open = openRoots();
    const on = open.length > 0;
    document.documentElement.classList.toggle('hv-overlay-open', on);
    document.body.classList.toggle('hv-overlay-open', on);
    const vv = window.visualViewport;
    const top = Math.round((vv && vv.offsetTop) || 0);
    const height = Math.round((vv && vv.height) || window.innerHeight || 0);
    if (!height) return;
    for (const el of open) {
      el.style.top = top + 'px';
      el.style.bottom = 'auto';
      el.style.height = height + 'px';
      el.style.minHeight = height + 'px';
      el.style.maxHeight = height + 'px';
    }
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithSafariOverlay(name) {
    baseShowScreen(name);
    pin();
  };

  const vv = window.visualViewport;
  if (vv && typeof vv.addEventListener === 'function') {
    vv.addEventListener('resize', pin);
    vv.addEventListener('scroll', pin);
  }
  window.addEventListener('resize', pin);
  pin();
})();
