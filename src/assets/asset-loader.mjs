import { clipSource, createDecodedAtlasCache } from './decoded-atlas-cache.mjs';

export function createAssetLoader(options = {}) {
  const cache = options.cache || createDecodedAtlasCache(options);

  function ensure(clip, opts = {}) {
    if (!clip) return { state: 'failed', image: null, error: 'missing clip', key: '' };
    return cache.reserve(clip, opts);
  }

  function retry(clip, opts = {}) {
    cache.allowRetry(clipSource(clip));
    return ensure(clip, opts);
  }

  // An action lease pins its working set before awaiting readiness. Releasing
  // the lease removes protection, not decoded data; ordinary LRU can reuse it.
  async function acquire(clips, opts = {}) {
    if (!Array.isArray(clips)) throw new TypeError('Atlas acquire expects an array');
    const pin = Symbol(opts.owner || 'atlas-lease');
    const handles = [];
    let released = false, timer, onAbort;
    const releaseLease = () => {
      if (released) return;
      released = true;
      for (const handle of handles) cache.unpin(handle.key, pin);
    };
    const abortError = () => Object.assign(new Error('Atlas readiness aborted'), { name: 'AbortError' });
    try {
      if (opts.signal?.aborted) throw abortError();
      const unique = new Map(clips.map(clip => [clipSource(clip), clip]));
      for (const clip of unique.values()) {
        const handle = ensure(clip, { ...opts, scope: opts.scope || 'battle', priority: 'critical', pin });
        handles.push(handle);
        if (handle.state === 'failed') throw new Error(String(handle.error || 'Atlas readiness failed'));
      }
      await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Atlas readiness timeout')), Math.max(1, Number(opts.timeoutMs) || 15000));
        onAbort = () => reject(abortError());
        opts.signal?.addEventListener('abort', onAbort, { once: true });
        if (opts.signal?.aborted) { onAbort(); return; }
        Promise.all(handles.map(handle => handle.promise)).then(() => {
          if (handles.some(handle => handle.state !== 'ready' || !handle.image)) {
            reject(new Error('Atlas readiness lost before acquisition'));
          } else resolve();
        }, reject);
      });
      return { handles, release: releaseLease };
    } catch (error) {
      releaseLease();
      throw error;
    } finally {
      clearTimeout(timer);
      if (onAbort) opts.signal?.removeEventListener('abort', onAbort);
    }
  }

  function release(key) {
    cache.release(key);
  }

  function clearScope(scope) {
    cache.clearScope(scope);
  }

  function inspect() {
    return cache.inspect();
  }

  return { ensure, retry, acquire, release, clearScope, inspect, cache };
}

export { clipSource };
