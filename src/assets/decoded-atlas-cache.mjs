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
  if (cost <= 8 * 1024 * 1024) return 1;
  const room = maxBytes / 4;
  if (cost <= room) return 1;
  const raw = Math.sqrt(room / cost);
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
  const maxBytes = options.maxBytes ?? 128 * 1024 * 1024;
  const maxLoading = options.maxLoading ?? 2;
  const makeImage = options.makeImage || (() => new Image());
  const makeCanvas = options.makeCanvas || (() => {
    try {
      if (typeof document !== 'undefined' && document.createElement) return document.createElement('canvas');
    } catch (_) {}
    return null;
  });
  const log = options.log || (message => { try { console.warn(message); } catch (_) {} });
  const entries = new Map();
  const failed = new Map();
  const logged = new Set();
  let bytes = 0;

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

  function inspect() {
    return {
      bytes,
      maxBytes,
      maxLoading,
      loading: loadingCount(),
      failed: failed.size,
      entries: Array.from(entries, ([src, entry]) => ({
        src,
        bytes: entry.bytes,
        width: entry.width,
        height: entry.height,
        scale: entry.scale || 1,
        loading: entry.loading,
        state: entry.state,
        scope: Array.from(entry.scopes).join(',')
      }))
    };
  }

  function releaseSrc(src) {
    const entry = entries.get(src);
    if (!entry) return;
    entries.delete(src);
    bytes -= entry.bytes;
    const image = entry.image;
    if (image) {
      image.onload = null;
      image.onerror = null;
      if (image.removeAttribute) image.removeAttribute('src');
      else if ('src' in image) image.src = '';
    }
  }

  function evictUntil(need) {
    while (bytes + need > maxBytes) {
      const oldest = Array.from(entries).find(([, entry]) => !entry.loading);
      if (!oldest) return false;
      releaseSrc(oldest[0]);
    }
    return bytes + need <= maxBytes;
  }

  function liveHandle(src) {
    return {
      get state() {
        if (failed.has(src)) return 'failed';
        const entry = entries.get(src);
        return entry ? entry.state : 'idle';
      },
      get image() {
        if (failed.has(src)) return null;
        return entries.get(src)?.image || null;
      },
      get error() { return failed.get(src); },
      get promise() {
        const entry = entries.get(src);
        if (entry?.promise) return entry.promise;
        if (failed.has(src)) return Promise.reject(failed.get(src));
        return Promise.resolve(null);
      },
      key: src
    };
  }

  function reserve(clip, opts = {}) {
    const scope = opts.scope || 'default';
    const priority = opts.priority || 'visible';
    const src = clipSource(clip);
    if (!src) return { state: 'failed', image: null, error: 'missing src', key: src };
    if (failed.has(src)) {
      return liveHandle(src);
    }
    let entry = entries.get(src);
    if (entry) {
      entries.delete(src);
      entries.set(src, entry);
      entry.scopes.add(scope);
      entry.priority = priority;
      return liveHandle(src);
    }
    const cellW = Number(clip.cellW ?? clip.w);
    const cellH = Number(clip.cellH ?? clip.h);
    const cols = Number(clip.cols);
    const rows = Number(clip.rows > 0 ? clip.rows : Math.ceil(Number(clip.frames) / cols));
    const width = Number(clip.atlasWidth > 0 ? clip.atlasWidth : cols * cellW);
    const height = Number(clip.atlasHeight > 0 ? clip.atlasHeight : rows * cellH);
    const cost = atlasDecodedBytes({ ...clip, cellW, cellH, cols, rows, atlasWidth: width, atlasHeight: height });
    if (!Number.isSafeInteger(cost) || cost <= 0 || cost > maxBytes) {
      const error = `decodedBytes ${cost} exceeds budget maxBytes ${maxBytes}`;
      failed.set(src, error);
      logOnce(src, error);
      return liveHandle(src);
    }
    if (loadingCount() >= maxLoading) return liveHandle(src);
    if (!evictUntil(cost)) return liveHandle(src);
    const image = makeImage();
    let resolve;
    let reject;
    const promise = new Promise((ok, err) => { resolve = ok; reject = err; });
    promise.catch(() => {});
    entry = {
      image,
      bytes: cost,
      width,
      height,
      scale: 1,
      loading: true,
      state: 'loading',
      scopes: new Set([scope]),
      priority,
      src,
      promise,
      resolve,
      reject
    };
    entries.set(src, entry);
    bytes += cost;
    function fail(reason) {
      if (entries.get(src) !== entry) return;
      const error = String(reason || 'load failed');
      failed.set(src, error);
      logOnce(src, error);
      entry.state = 'failed';
      releaseSrc(src);
      entry.reject?.(error);
    }
    image.decoding = 'async';
    image.onerror = () => fail('network');
    image.onload = () => {
      if (entries.get(src) !== entry) return;
      if (image.naturalWidth !== width || image.naturalHeight !== height) {
        fail(`dimension ${image.naturalWidth}x${image.naturalHeight} != ${width}x${height}`);
        return;
      }
      const scale = atlasDecodeScale(cost, maxBytes);
      const drawable = downsampleDecodedAtlas(image, scale, makeCanvas);
      if (drawable !== image) {
        bytes -= entry.bytes;
        entry.bytes = Math.max(1, Math.round(cost * scale * scale));
        bytes += entry.bytes;
        entry.scale = scale;
        entry.width = drawable.width || Math.round(width * scale);
        entry.height = drawable.height || Math.round(height * scale);
        image.onload = null;
        image.onerror = null;
        if (image.removeAttribute) image.removeAttribute('src');
        else image.src = '';
        entry.image = drawable;
      }
      entry.loading = false;
      entry.state = 'ready';
      entry.resolve?.(liveHandle(src));
    };
    image.src = src;
    return liveHandle(src);
  }

  function release(key) {
    releaseSrc(key);
  }

  function clearScope(scope) {
    for (const [src, entry] of Array.from(entries)) {
      entry.scopes.delete(scope);
      if (entry.scopes.size === 0) releaseSrc(src);
    }
  }

  function allowRetry(src) {
    failed.delete(src);
    logged.delete(src);
  }

  function clear() {
    for (const src of Array.from(entries.keys())) releaseSrc(src);
    failed.clear();
  }

  return { reserve, release, clearScope, clear, allowRetry, inspect, atlasDecodedBytes, atlasDecodeScale };
}
