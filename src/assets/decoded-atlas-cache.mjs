// Decoded RGBA budget, not compressed transfer size. Self-contained so battle
// can inject createDecodedAtlasCache.toString() next to the loader.

export function atlasDecodedBytes(clip) {
  const cellW = Number(clip?.cellW ?? clip?.w);
  const cellH = Number(clip?.cellH ?? clip?.h);
  const cols = Number(clip?.cols);
  const frames = Number(clip?.frames);
  const rows = Number(clip?.rows > 0 ? clip.rows : Math.ceil(frames / cols));
  const atlasWidth = Number(clip?.atlasWidth > 0 ? clip.atlasWidth : cols * cellW);
  const atlasHeight = Number(clip?.atlasHeight > 0 ? clip.atlasHeight : rows * cellH);
  return atlasWidth * atlasHeight * 4;
}

export function atlasDecodeScale(cost, maxBytes) {
  if (!(cost > 0) || !(maxBytes > 0)) return 1;
  // Preserve authored pixels whenever a single atlas fits the cache budget.
  // Memory pressure is handled by one-at-a-time decoding + eviction, not by
  // silently shrinking a drawable that the renderer later scales back up.
  if (cost <= maxBytes) return 1;
  const raw = Math.sqrt(maxBytes / cost);
  if (raw >= 0.75) return 0.75;
  if (raw >= 0.5) return 0.5;
  return 0.25;
}

export function clipSource(clip) {
  if (!clip) return '';
  if (clip.src) return clip.src;
  if (clip.url) return clip.url;
  return String(clip.base || '') + String(clip.file || '');
}

export function downsampleDecodedAtlas(image, scale, makeCanvas) {
  if (!(scale > 0) || scale >= 1 || !image) return image;
  const sourceW = Number(image.naturalWidth || image.width || 0);
  const sourceH = Number(image.naturalHeight || image.height || 0);
  if (!(sourceW > 0) || !(sourceH > 0)) return image;
  const canvas = makeCanvas ? makeCanvas() : null;
  if (!canvas || typeof canvas.getContext !== 'function') return image;
  const width = Math.max(1, Math.round(sourceW * scale));
  const height = Math.max(1, Math.round(sourceH * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.drawImage !== 'function') return image;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  canvas.__hvAtlasScale = scale;
  canvas.complete = true;
  try {
    Object.defineProperty(canvas, 'naturalWidth', { value: width, configurable: true });
    Object.defineProperty(canvas, 'naturalHeight', { value: height, configurable: true });
  } catch (_) {
    canvas.naturalWidth = width;
    canvas.naturalHeight = height;
  }
  return canvas;
}

export function createDecodedAtlasCache(options = {}) {
  const deviceProfile = options.deviceProfile || {};
  const runtimeNavigator = typeof navigator !== 'undefined' ? navigator : null;
  const userAgent = String(deviceProfile.userAgent ?? runtimeNavigator?.userAgent ?? '');
  const platform = String(deviceProfile.platform ?? runtimeNavigator?.platform ?? '');
  const maxTouchPoints = Number(deviceProfile.maxTouchPoints ?? runtimeNavigator?.maxTouchPoints ?? 0);
  const constrainedMobile = options.constrainedMobile ?? (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1)
  );
  const requestedMaxBytes = options.maxBytes ?? 128 * 1024 * 1024;
  const requestedMaxLoading = options.maxLoading ?? 2;
  const maxBytes = constrainedMobile ? Math.min(requestedMaxBytes, 96 * 1024 * 1024) : requestedMaxBytes;
  const maxLoading = constrainedMobile ? Math.min(requestedMaxLoading, 1) : requestedMaxLoading;
  if (!(maxBytes > 0) || !Number.isInteger(maxLoading) || maxLoading < 1) {
    throw new RangeError('Atlas cache requires a positive budget and loading limit');
  }
  const makeImage = options.makeImage || (() => new Image());
  const makeCanvas = options.makeCanvas || (() => {
    try {
      if (typeof document !== 'undefined' && document.createElement) return document.createElement('canvas');
    } catch (_) {}
    return null;
  });
  const log = options.log || (message => { try { console.warn(message); } catch (_) {} });
  const entries = new Map(), queued = new Map(), failed = new Map(), logged = new Set();
  const rank = priority => ({ critical: 0, visible: 1, prefetch: 2, background: 3 }[priority] ?? 1);
  let bytes = 0, draining = false, drainScheduled = false;

  function logOnce(key, message) {
    if (logged.has(key)) return;
    logged.add(key);
    log(message);
  }
  function loadingCount() {
    let count = 0;
    for (const entry of entries.values()) if (entry.loading) count += 1;
    return count;
  }
  function lookup(src) { return entries.get(src) || queued.get(src); }
  function inspect() {
    return {
      bytes, maxBytes, maxLoading, constrainedMobile, loading: loadingCount(), queued: queued.size,
      failed: failed.size,
      entries: Array.from([...entries, ...queued], ([src, entry]) => ({
        src, bytes: entry.bytes, width: entry.width, height: entry.height,
        scale: entry.scale || 1, loading: entry.loading, state: entry.state,
        queued: queued.has(src), pins: entry.pins.size,
        scope: Array.from(entry.scopes).join(',')
      }))
    };
  }
  function scheduleDrain() {
    if (drainScheduled) return;
    drainScheduled = true;
    queueMicrotask(() => { drainScheduled = false; drain(); });
  }
  function releaseSrc(src, reason = new Error('Atlas request cancelled'), force = false) {
    const entry = lookup(src);
    if (!entry || (!force && entry.pins.size)) return false;
    queued.delete(src);
    if (entries.delete(src)) bytes -= entry.bytes;
    if (!entry.settled) {
      entry.settled = true;
      entry.reject(reason);
    }
    const image = entry.image;
    if (image) {
      image.onload = null; image.onerror = null;
      if (image.removeAttribute) image.removeAttribute('src');
      else if ('src' in image) image.src = '';
      // Downsampled canvases otherwise retain their backing stores until GC.
      else if (image.__hvAtlasScale) { image.width = 0; image.height = 0; }
    }
    scheduleDrain();
    return true;
  }
  function evictUntil(need) {
    if (bytes + need <= maxBytes) return true;
    // Map order is LRU (reserve touches entries). Priority orders pending
    // decodes only: a completed, unleased cast must not outrank visible idle.
    const candidates = Array.from(entries).filter(([, entry]) => !entry.loading && !entry.pins.size);
    // Do not discard useful images if protected/in-flight images still prevent admission.
    if (candidates.reduce((sum, [, entry]) => sum + entry.bytes, 0) < bytes + need - maxBytes) return false;
    for (const [src] of candidates) {
      releaseSrc(src);
      if (bytes + need <= maxBytes) return true;
    }
    return false;
  }
  function liveHandle(src) {
    return {
      get state() { return failed.has(src) ? 'failed' : lookup(src)?.state || 'idle'; },
      get image() { return failed.has(src) ? null : lookup(src)?.image || null; },
      get error() { return failed.get(src); },
      get promise() {
        const entry = lookup(src);
        if (entry?.promise) return entry.promise;
        if (failed.has(src)) return Promise.reject(failed.get(src));
        return Promise.resolve(null);
      },
      key: src
    };
  }
  function start(entry) {
    const { src, cost, width, height } = entry;
    queued.delete(src); entries.set(src, entry);
    entry.bytes = cost; entry.loading = true; entry.state = 'loading'; bytes += cost;
    function fail(reason) {
      if (entries.get(src) !== entry) return;
      const error = String(reason || 'load failed');
      failed.set(src, error); logOnce(src, error);
      releaseSrc(src, new Error(error), true);
    }
    try {
      const image = makeImage();
      entry.image = image; image.decoding = 'async';
      image.onerror = () => fail('network');
      image.onload = () => {
        if (entries.get(src) !== entry) return;
        if (image.naturalWidth !== width || image.naturalHeight !== height) {
          fail(`dimension ${image.naturalWidth}x${image.naturalHeight} != ${width}x${height}`);
          return;
        }
        try {
          const scale = atlasDecodeScale(cost, maxBytes);
          const drawable = downsampleDecodedAtlas(image, scale, makeCanvas);
          if (drawable !== image) {
            bytes -= entry.bytes;
            entry.bytes = Math.max(1, Math.round(cost * scale * scale));
            bytes += entry.bytes; entry.scale = scale;
            entry.width = drawable.width || Math.round(width * scale);
            entry.height = drawable.height || Math.round(height * scale);
            image.onload = null; image.onerror = null;
            if (image.removeAttribute) image.removeAttribute('src');
            else image.src = '';
            entry.image = drawable;
          }
          entry.loading = false; entry.state = 'ready'; entry.settled = true;
          entry.resolve(liveHandle(src));
          // Promise consumers get a chance to observe readiness before queue admission.
          scheduleDrain();
        } catch (error) { fail(error?.message || error); }
      };
      image.src = src;
    } catch (error) { fail(error?.message || error); }
  }
  function drain() {
    if (draining) return;
    draining = true;
    try {
      const waiting = Array.from(queued.values()).sort((a, b) => rank(a.priority) - rank(b.priority));
      for (const entry of waiting) {
        if (loadingCount() >= maxLoading) break;
        if (queued.get(entry.src) !== entry || !evictUntil(entry.cost)) continue;
        start(entry);
      }
    } finally { draining = false; }
  }
  function reserve(clip, opts = {}) {
    const scope = opts.scope || 'default', priority = opts.priority || 'visible';
    const src = clipSource(clip);
    if (!src) return { state: 'failed', image: null, error: 'missing src', key: src };
    if (failed.has(src)) return liveHandle(src);
    let entry = lookup(src);
    if (entry) {
      if (entries.has(src)) { entries.delete(src); entries.set(src, entry); }
      entry.scopes.add(scope);
      if (rank(priority) < rank(entry.priority)) entry.priority = priority;
      if (opts.pin != null) entry.pins.set(opts.pin, scope);
      return liveHandle(src);
    }
    const cellW = Number(clip.cellW ?? clip.w), cellH = Number(clip.cellH ?? clip.h);
    const cols = Number(clip.cols);
    const rows = Number(clip.rows > 0 ? clip.rows : Math.ceil(Number(clip.frames) / cols));
    const width = Number(clip.atlasWidth > 0 ? clip.atlasWidth : cols * cellW);
    const height = Number(clip.atlasHeight > 0 ? clip.atlasHeight : rows * cellH);
    const cost = atlasDecodedBytes({ ...clip, cellW, cellH, cols, rows, atlasWidth: width, atlasHeight: height });
    if (!Number.isSafeInteger(cost) || cost <= 0 || cost > maxBytes) {
      const error = `decodedBytes ${cost} exceeds budget maxBytes ${maxBytes}`;
      failed.set(src, error); logOnce(src, error);
      return liveHandle(src);
    }
    let resolve, reject;
    const promise = new Promise((ok, err) => { resolve = ok; reject = err; });
    promise.catch(() => {});
    entry = { src, cost, width, height, bytes: 0, scale: 1, image: null,
      loading: false, state: 'idle', settled: false, scopes: new Set([scope]),
      pins: new Map(), priority, promise, resolve, reject };
    if (opts.pin != null) entry.pins.set(opts.pin, scope);
    // Keep the legacy idle/null handle while queued, but its promise stays pending.
    queued.set(src, entry);
    drain();
    return liveHandle(src);
  }
  function unpin(key, owner) {
    const entry = lookup(key);
    if (!entry) return false;
    const removed = entry.pins.delete(owner);
    if (removed) scheduleDrain();
    return removed;
  }
  function release(key) { return releaseSrc(key); }
  function clearScope(scope) {
    // Do not pump the queue mid-clear: all queued work in this scope is cancelled first.
    for (const [src, entry] of [...entries, ...queued]) {
      entry.scopes.delete(scope);
      for (const [owner, pinScope] of entry.pins) if (pinScope === scope) entry.pins.delete(owner);
      if (entry.scopes.size === 0) releaseSrc(src, new Error('Atlas scope cancelled: ' + scope), true);
    }
    scheduleDrain();
  }
  function allowRetry(src) { failed.delete(src); logged.delete(src); }
  function clear() {
    for (const src of [...entries.keys(), ...queued.keys()]) releaseSrc(src, new Error('Atlas cache cleared'), true);
    failed.clear(); logged.clear();
  }
  return { reserve, release, unpin, clearScope, clear, allowRetry, inspect, atlasDecodedBytes, atlasDecodeScale,
    constrainedMobile, maxBytes, maxLoading };
}
