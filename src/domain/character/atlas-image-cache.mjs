// This self-contained factory is embedded in both static runtime documents.
// Budget is decoded RGBA, not compressed transfer size; reserve before loading.
export function createAtlasImageCache(meta, options = {}) {
  // Native-size Blender atlases are ~81 MiB decoded for idle plus ~40 MiB
  // for Basic; keep the two-atlas cap just above that without allowing an
  // unbounded mobile-memory spike.
  const maxBytes = options.maxBytes ?? 128 * 1024 * 1024;
  const maxLoading = options.maxLoading ?? 2;
  const makeImage = options.makeImage || (() => new Image());
  const entries = new Map(), failed = new Set();
  let bytes = 0;
  const source = m => m.src || (options.base || '') + m.file;
  function release(src) {
    const entry = entries.get(src);
    if (!entry) return;
    entries.delete(src); bytes -= entry.bytes;
    entry.image.onload = null; entry.image.onerror = null;
    if (entry.image.removeAttribute) entry.image.removeAttribute('src');
    else entry.image.src = '';
  }
  function loadingCount() {
    let count = 0;
    for (const entry of entries.values()) if (entry.loading) count++;
    return count;
  }
  function get(key) {
    const m = meta[key];
    if (!m) return null;
    const src = source(m);
    if (failed.has(src)) return null;
    let entry = entries.get(src);
    if (entry) {
      entries.delete(src); entries.set(src, entry);
      return entry.image;
    }
    const width = m.cols * m.w, height = Math.ceil(m.frames / m.cols) * m.h;
    const cost = width * height * 4;
    if (!Number.isSafeInteger(cost) || cost <= 0 || cost > maxBytes) {
      failed.add(src); return null;
    }
    if (loadingCount() >= maxLoading) return null;
    // Never cancel another pending decode to make room: retry on the next draw.
    while (bytes + cost > maxBytes) {
      const oldest = Array.from(entries).find(([, item]) => !item.loading);
      if (!oldest) return null;
      release(oldest[0]);
    }
    const image = makeImage();
    entry = { image, bytes: cost, width, height, loading: true };
    entries.set(src, entry); bytes += cost;
    function fail() {
      if (entries.get(src) !== entry) return;
      failed.add(src); release(src);
    }
    image.decoding = 'async';
    image.onerror = fail;
    image.onload = () => {
      if (entries.get(src) !== entry) return;
      if (image.naturalWidth !== width || image.naturalHeight !== height) { fail(); return; }
      const scale = cost > 8 * 1024 * 1024 && cost > maxBytes / 4
        ? (Math.sqrt((maxBytes / 4) / cost) >= 0.75 ? 0.75 : 0.5)
        : 1;
      if (scale < 1) {
        let canvas = null;
        try { canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null; } catch (_) {}
        if (canvas && canvas.getContext) {
          const dw = Math.max(1, Math.round(width * scale)), dh = Math.max(1, Math.round(height * scale));
          canvas.width = dw; canvas.height = dh;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(image, 0, 0, dw, dh);
            canvas.__hvAtlasScale = scale; canvas.complete = true;
            try {
              Object.defineProperty(canvas, 'naturalWidth', { value: dw, configurable: true });
              Object.defineProperty(canvas, 'naturalHeight', { value: dh, configurable: true });
            } catch (_) { canvas.naturalWidth = dw; canvas.naturalHeight = dh; }
            bytes -= entry.bytes;
            entry.bytes = Math.max(1, Math.round(cost * scale * scale));
            bytes += entry.bytes;
            image.onload = null; image.onerror = null;
            if (image.removeAttribute) image.removeAttribute('src'); else image.src = '';
            entry.image = canvas;
          }
        }
      }
      entry.loading = false;
    };
    image.src = src;
    return image;
  }
  const images = Object.create(null);
  for (const key of Object.keys(meta)) {
    Object.defineProperty(images, key, { enumerable: true, get: () => get(key) });
  }
  return {
    images, get,
    clear() { for (const src of Array.from(entries.keys())) release(src); failed.clear(); },
    inspect() {
      return { bytes, maxBytes, loading: loadingCount(), failed: failed.size,
        entries: Array.from(entries, ([src, entry]) => ({ src, bytes: entry.bytes,
          width: entry.width, height: entry.height, loading: entry.loading })) };
    }
  };
}
