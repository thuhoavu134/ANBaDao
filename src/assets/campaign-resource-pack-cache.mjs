// 3Q-derived resource lifecycle for campaign/preview surfaces.
// This is a clean-room adaptation: keyed packs, owner ref-counting, bounded
// queueing and delayed cleanup. It does not copy 3Q code or assets.

export function campaignResourceKey(pack) {
  return [pack?.heroId, pack?.clip, pack?.tier, pack?.src].map(value => String(value ?? '')).join(':');
}

export function createCampaignResourcePackCache(options = {}) {
  const maxDecodedBytes = Number(options.maxDecodedBytes ?? 128 * 1024 * 1024);
  const maxLoading = Math.max(1, Number(options.maxLoading ?? 2));
  const clearDelayMs = Math.max(0, Number(options.clearDelayMs ?? 10_000));
  const makeImage = options.makeImage || (() => null);
  const load = options.load || (async (pack, image) => ({ image: image || new Image(), decodedBytes: pack.decodedBytes }));
  const entries = new Map();
  const queue = [];
  let bytes = 0;
  let loading = 0;
  let serial = 0;

  const error = message => Promise.reject(new Error(message));
  const ownersCount = entry => entry.owners.size;
  const clearEntry = entry => {
    if (entries.get(entry.key) !== entry) return;
    entries.delete(entry.key);
    bytes -= entry.bytes;
    try { entry.image?.close?.(); } catch (_) {}
    try { entry.image?.removeAttribute?.('src'); } catch (_) {}
  };
  const evictUntil = (need, now) => {
    while (bytes + need > maxDecodedBytes) {
      const candidate = [...entries.values()]
        .filter(entry => entry.state === 'ready' && ownersCount(entry) === 0)
        .sort((a, b) => (a.lastUsedAt - b.lastUsedAt) || (a.serial - b.serial))[0];
      if (!candidate) return false;
      clearEntry(candidate);
    }
    return bytes + need <= maxDecodedBytes;
  };

  const startNext = now => {
    while (loading < maxLoading && queue.length) {
      const job = queue.shift();
      if (entries.get(job.key) !== job.entry || job.entry.state !== 'queued') continue;
      const declared = Number(job.pack.decodedBytes);
      if (!Number.isFinite(declared) || declared <= 0 || declared > maxDecodedBytes || !evictUntil(declared, now)) {
        entries.delete(job.key);
        job.entry.state = 'failed';
        job.reject(new Error(`decoded budget unavailable for ${job.key}`));
        continue;
      }
      loading += 1;
      job.entry.state = 'loading';
      const task = Promise.resolve().then(() => load(job.pack, job.entry.image)).then(result => {
        if (entries.get(job.key) !== job.entry) return null;
        const actual = Number(result?.decodedBytes ?? declared);
        if (!Number.isFinite(actual) || actual <= 0 || actual > maxDecodedBytes || bytes + actual > maxDecodedBytes) {
          job.entry.state = 'failed';
          entries.delete(job.key);
          throw new Error(`decoded budget exceeded for ${job.key}`);
        }
        job.entry.state = 'ready';
        job.entry.image = result?.image ?? result;
        job.entry.bytes = actual;
        job.entry.lastUsedAt = now;
        bytes += actual;
        return { key: job.key, image: job.entry.image, bytes: actual };
      }).catch(reason => {
        if (entries.get(job.key) === job.entry) entries.delete(job.key);
        job.entry.state = 'failed';
        throw reason instanceof Error ? reason : new Error(String(reason));
      });
      task.finally(() => {
        loading -= 1;
        startNext(now);
      }).then(job.resolve, job.reject);
    }
  };

  const ensure = (pack, owner = 'default', now = Date.now()) => {
    const key = campaignResourceKey(pack);
    if (!key) return { key: '', image: null, state: 'failed', promise: error('missing campaign resource key') };
    const declared = Number(pack?.decodedBytes);
    if (!Number.isFinite(declared) || declared <= 0 || declared > maxDecodedBytes) {
      return { key, image: null, state: 'failed', promise: error(`decoded budget invalid for ${key}`) };
    }
    let entry = entries.get(key);
    if (!entry) {
      let resolve;
      let reject;
      const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
      promise.catch(() => {});
      entry = { key, pack, state: 'queued', owners: new Set(), bytes: 0, image: makeImage(pack), lastUsedAt: now, pendingClearAt: null, serial: ++serial, promise };
      entries.set(key, entry);
      queue.push({ key, pack, entry, resolve, reject });
    }
    entry.owners.add(String(owner));
    entry.lastUsedAt = now;
    entry.pendingClearAt = null;
    startNext(now);
    return {
      key,
      get image() { return entry.image; },
      get state() { return entry.state; },
      promise: entry.promise
    };
  };

  const acquire = (pack, owner = 'default', now = Date.now()) => ensure(pack, owner, now).promise;

  const release = (packOrKey, owner = 'default', now = Date.now()) => {
    const key = typeof packOrKey === 'string' ? packOrKey : campaignResourceKey(packOrKey);
    const entry = entries.get(key);
    if (!entry) return false;
    entry.owners.delete(String(owner));
    entry.lastUsedAt = now;
    if (!entry.owners.size) {
      if (entry.state === 'queued') {
        entries.delete(key);
        entry.state = 'failed';
        // The queued promise is intentionally allowed to reject at startNext;
        // no Image or decoded bytes have been allocated yet.
      } else {
        entry.pendingClearAt = now + clearDelayMs;
      }
    }
    return true;
  };

  const clearScope = (scope, now = Date.now()) => {
    const prefix = String(scope);
    for (const entry of [...entries.values()]) {
      for (const owner of [...entry.owners]) {
        if (owner === prefix || owner.startsWith(prefix + ':')) release(entry.key, owner, now);
      }
    }
    sweep(now);
  };

  function sweep(now = Date.now()) {
    for (const entry of [...entries.values()]) {
      if (!entry.owners.size && entry.pendingClearAt != null && entry.pendingClearAt <= now) clearEntry(entry);
    }
    startNext(now);
  }

  const purge = () => {
    queue.length = 0;
    for (const entry of [...entries.values()]) {
      entry.owners.clear();
      entry.pendingClearAt = null;
      clearEntry(entry);
    }
    loading = 0;
  };

  const inspect = () => ({
    bytes,
    maxDecodedBytes,
    maxLoading,
    loading,
    queued: queue.filter(job => entries.get(job.key) === job.entry).length,
    entries: [...entries.values()].map(entry => ({
      key: entry.key,
      state: entry.state,
      bytes: entry.bytes,
      owners: ownersCount(entry),
      pendingClear: entry.pendingClearAt != null,
      pendingClearAt: entry.pendingClearAt
    }))
  });

  return { ensure, acquire, release, clearScope, sweep, purge, inspect };
}
