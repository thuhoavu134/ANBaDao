(() => {
  if (typeof window === 'undefined') return;
  if (window.__hvAbortNoise) return;
  window.__hvAbortNoise = true;

  function isAbortNoise(reason) {
    if (reason == null) return false;
    const name = reason.name || '';
    const msg = String(reason.message || reason || '');
    if (name === 'AbortError' || name === 'NotAllowedError') return true;
    return /operation was aborted|play\(\) request was interrupted|interrupted by a new load|The fetching process for the media resource was aborted/i.test(msg);
  }

  function sweep() {
    if (Array.isArray(window.__mgErrs)) {
      window.__mgErrs = window.__mgErrs.filter(entry => !isAbortNoise(entry) && !/operation was aborted|AbortError|play\(\) request was interrupted/i.test(String(entry)));
    }
    const box = document.getElementById('__mgDiag');
    if (!box) return;
    const text = box.textContent || '';
    const onlyAbort = /operation was aborted|AbortError|play\(\) request was interrupted/i.test(text)
      && (!window.__mgErrs || window.__mgErrs.length === 0);
    if (onlyAbort) box.remove();
  }

  window.addEventListener('unhandledrejection', function (ev) {
    if (!isAbortNoise(ev.reason)) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    sweep();
  }, true);

  window.addEventListener('error', function (ev) {
    const err = ev.error || ev.message;
    if (!isAbortNoise(err) && !/operation was aborted/i.test(String(ev.message || ''))) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    sweep();
  }, true);

  const kick = () => { try { sweep(); } catch (_) {} };
  kick();
  setTimeout(kick, 0);
  setTimeout(kick, 400);
  setTimeout(kick, 1400);
  setTimeout(kick, 2200);

  const attach = () => {
    if (!document.documentElement) return;
    const obs = new MutationObserver(kick);
    obs.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) attach();
  else document.addEventListener('DOMContentLoaded', attach);
})();
