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

  function release(key) {
    cache.release(key);
  }

  function clearScope(scope) {
    cache.clearScope(scope);
  }

  function inspect() {
    return cache.inspect();
  }

  return { ensure, retry, release, clearScope, inspect, cache };
}

export { clipSource };
