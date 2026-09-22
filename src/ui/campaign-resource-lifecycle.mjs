/** Resource lifetime for the existing campaign renderer. No combat/animation clock. */
export function createCampaignSceneImageOwner(options) {
  const { images, cache, packFor, makeImage, draw, scheduleFrame, cancelFrame } = options;
  const now = options.now || Date.now;
  const active = options.active || (() => true);
  const setTimer = options.setTimer || setTimeout;
  const clearTimer = options.clearTimer || clearTimeout;
  const empty = Object.freeze({ complete: false, naturalWidth: 0, naturalHeight: 0 });
  const wanted = new Set(), failures = new Map();
  let epoch = 0, paint = null, retryTimer = null, scope = null, unlink = null, clearing = false;

  function redraw() {
    if (!active() || paint != null) return;
    const generation = epoch;
    paint = scheduleFrame(() => {
      if (generation !== epoch) return;
      paint = null;
      if (active()) draw();
    });
  }
  function deferRetry() {
    if (retryTimer != null) return;
    let due = Infinity;
    for (const record of images.values()) if (record.failed) due = Math.min(due, record.retryAt);
    if (!Number.isFinite(due)) return;
    const generation = epoch;
    retryTimer = setTimer(() => {
      if (generation !== epoch) return;
      retryTimer = null;
      if (active()) redraw();
    }, Math.max(1, due - now()));
  }
  function forget(src, record) {
    if (images.get(src) !== record) return;
    images.delete(src);
    if (record.handle) cache.release(record.handle.key, 'campaign', now());
    else if (record.raw) {
      record.raw.onload = null; record.raw.onerror = null;
      if (record.raw.removeAttribute) record.raw.removeAttribute('src');
      else record.raw.src = '';
    }
  }
  function clear() {
    if (clearing) return;
    clearing = true;
    try {
      epoch++;
      if (paint != null) cancelFrame(paint);
      if (retryTimer != null) clearTimer(retryTimer);
      paint = null; retryTimer = null;
      const remove = unlink; unlink = null; scope = null;
      if (typeof remove === 'function') remove();
      for (const [src, record] of [...images]) forget(src, record);
      wanted.clear(); failures.clear(); cache.purge();
    } finally { clearing = false; }
  }
  function bindScope() {
    const next = options.getScope?.();
    if (!next || next === scope) return;
    if (scope) clear();
    scope = next;
    unlink = next.add?.(clear) || null;
  }
  function image(src, spec = null) {
    if (!src || !active()) return empty;
    bindScope(); wanted.add(src);
    let record = images.get(src);
    if (record?.failed && now() >= record.retryAt) { forget(src, record); record = null; }
    if (record) return record.failed ? empty : record.handle?.image || record.raw || empty;
    const generation = epoch, pack = packFor(src, spec);
    record = { raw: null, handle: null, failed: false, retryAt: 0 };
    images.set(src, record);
    const live = () => epoch === generation && images.get(src) === record;
    const ready = () => {
      if (!live()) return;
      failures.delete(src); redraw();
    };
    const failed = error => {
      if (!live()) return;
      const count = (failures.get(src) || 0) + 1;
      failures.set(src, count);
      record.failed = true;
      record.budgetDenied = /budget/.test(String(error?.message || error));
      record.retryAt = now() + Math.min(8000, 1000 * 2 ** Math.min(3, count - 1));
      deferRetry();
    };
    try {
      if (pack) {
        record.handle = cache.ensure(pack, 'campaign', now());
        Promise.resolve(record.handle.promise).then(ready, failed);
      } else {
        record.raw = makeImage(); record.raw.decoding = 'async';
        record.raw.onload = ready; record.raw.onerror = failed; record.raw.src = src;
      }
    } catch (error) { failed(error); }
    return record.failed ? empty : record.handle?.image || record.raw || empty;
  }
  function beginFrame() { wanted.clear(); }
  function endFrame() {
    let released = false;
    for (const [src, record] of [...images]) if (!wanted.has(src)) {
      forget(src, record); failures.delete(src); released = true;
    }
    cache.sweep?.(now());
    if (released) for (const record of images.values()) if (record.failed && record.budgetDenied) {
      record.retryAt = now(); redraw();
    }
  }
  return { image, beginFrame, endFrame, clear };
}
