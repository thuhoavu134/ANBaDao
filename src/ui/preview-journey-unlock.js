(() => {
  if (typeof document === 'undefined' || typeof featLocked !== 'function') return;
  const host = String(location.hostname || '').toLowerCase();
  if (host === 'luc-than.vercel.app' || host === 'luc-than-chi.vercel.app') return;
  // Preview access is deliberate configuration, never inferred from a host.
  if (window.HonVietPreviewConfig?.unlockJourney !== true) return;
  if (document.documentElement.dataset.hvQaFullAccess === '1') return;
  if (document.documentElement.dataset.hvPreviewUnlock === '1') return;

  featLocked = function previewUnlocked() { return false; };
  document.documentElement.dataset.hvPreviewUnlock = '1';

  try {
    if (typeof ST === 'object' && ST && ST.screen === 'hub' && typeof renderHub === 'function') renderHub();
  } catch (_) {}

  if (typeof toast === 'function') toast('Đã mở tạm các khu đang khóa để test. Bản live vẫn khóa theo chương.');
})();
