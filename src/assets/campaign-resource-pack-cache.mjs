// Clean-room pack lifecycle: resource identity, reservation-before-decode,
// owner ref-count and delayed cleanup. Campaign must never turn a denied pack
// into a permanently invisible actor.

export function campaignResourceKey(pack) {
  return [pack?.heroId, pack?.clip, pack?.tier, pack?.src].map(v => String(v ?? '')).join(':');
}

export function createCampaignResourcePackCache(options = {}) {
  const maxDecodedBytes = Number(options.maxDecodedBytes ?? 128 * 1024 * 1024);
  const maxLoading = Math.max(1, Number(options.maxLoading ?? 2));
  const clearDelayMs = Math.max(0, Number(options.clearDelayMs ?? 10_000));
  const makeImage = options.makeImage || (() => null);
  const load = options.load || (async (pack, image) => ({ image: image || new Image(), decodedBytes: pack.decodedBytes }));
  const entries = new Map(), queue = [];
  let bytes = 0, reservedBytes = 0, loading = 0, serial = 0;

  const owners = entry => entry.owners.size;
  const releaseImage = image => { try { image?.close?.(); } catch (_) {} try { image?.removeAttribute?.('src'); } catch (_) {} };
  const settle = (entry, method, value) => {
    if (entry.settled) return false;
    entry.settled = true;
    entry[method](value);
    return true;
  };
  const finishLoading = entry => {
    if (!entry.loadingCounted) return;
    entry.loadingCounted = false;
    loading = Math.max(0, loading - 1);
    reservedBytes = Math.max(0, reservedBytes - entry.reservation);
  };
  const remove = entry => {
    if (entries.get(entry.key) !== entry) return;
    entries.delete(entry.key);
    finishLoading(entry);
    if (entry.bytes) bytes = Math.max(0, bytes - entry.bytes);
    entry.bytes = 0;
    releaseImage(entry.image);
  };
  const evict = need => {
    while (bytes + reservedBytes + need > maxDecodedBytes) {
      const oldest = [...entries.values()].filter(e => e.state === 'ready' && !owners(e))
        .sort((a, b) => a.lastUsedAt - b.lastUsedAt || a.serial - b.serial)[0];
      if (!oldest) return false;
      remove(oldest);
    }
    return true;
  };

  function pump(now = Date.now()) {
    while (loading < maxLoading && queue.length) {
      const job = queue[0], entry = job.entry;
      if (entries.get(job.key) !== entry || entry.cancelled || entry.state !== 'queued') {
        queue.shift();
        settle(entry, 'reject', new Error(`cancelled ${job.key}`));
        continue;
      }
      const reservation = entry.reservation;
      if (!evict(reservation)) {
        // A current decoder may settle and free/release memory. Do not reject the
        // waiting actor early or leave it permanently invisible.
        if (loading) return;
        queue.shift(); entry.state = 'failed'; remove(entry);
        settle(entry, 'reject', new Error(`decoded budget unavailable for ${job.key}`));
        continue;
      }
      queue.shift(); loading += 1; reservedBytes += reservation; entry.state = 'loading'; entry.loadingCounted = true;
      const generation = entry.generation;
      Promise.resolve().then(() => {
        if (entry.cancelled || entries.get(entry.key) !== entry || entry.generation !== generation) {
          throw new Error(`cancelled ${entry.key}`);
        }
        return load(entry.pack, entry.image);
      }).then(result => {
        finishLoading(entry);
        if (entry.cancelled || entries.get(entry.key) !== entry || entry.generation !== generation) {
          releaseImage(result?.image);
          settle(entry, 'reject', new Error(`cancelled ${entry.key}`));
          return;
        }
        const actual = Number(result?.decodedBytes ?? reservation);
        if (!Number.isFinite(actual) || actual <= 0 || actual > maxDecodedBytes || bytes + reservedBytes + actual > maxDecodedBytes) {
          entry.state = 'failed'; remove(entry);
          settle(entry, 'reject', new Error(`decoded budget exceeded for ${entry.key}`));
          return;
        }
        entry.image = result?.image ?? entry.image ?? result;
        entry.bytes = actual; entry.state = 'ready'; entry.lastUsedAt = now; bytes += actual;
        // Free the loading slot before resolving callers: the queued asset may
        // begin on the same lifecycle turn, matching the bounded preload plan.
        pump(Date.now());
        settle(entry, 'resolve', { key: entry.key, image: entry.image, bytes: actual });
      }).catch(error => {
        finishLoading(entry);
        if (entries.get(entry.key) === entry && !entry.cancelled) {
          entry.state = 'failed'; remove(entry);
        }
        pump(Date.now());
        settle(entry, 'reject', error instanceof Error ? error : new Error(String(error)));
      }).finally(() => { pump(Date.now()); });
    }
  }

  function ensure(pack, owner = 'default', now = Date.now()) {
    const key = campaignResourceKey(pack), reservation = Number(pack?.decodedBytes);
    if (!key || !Number.isFinite(reservation) || reservation <= 0 || reservation > maxDecodedBytes) {
      const promise = Promise.reject(new Error(`decoded budget invalid for ${key}`)); promise.catch(() => {});
      return { key, image: null, state: 'failed', promise };
    }
    let entry = entries.get(key);
    if (!entry) {
      let resolve, reject;
      const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); promise.catch(() => {});
      entry = { key, pack, reservation, owners: new Set(), image: makeImage(pack), bytes: 0, state: 'queued',
        pendingClearAt: null, lastUsedAt: now, serial: ++serial, generation: 1, cancelled: false, settled: false, promise, resolve, reject };
      entries.set(key, entry); queue.push({ key, entry });
    }
    entry.owners.add(String(owner)); entry.lastUsedAt = now; entry.pendingClearAt = null; pump(now);
    return { key, get image() { return entry.image; }, get state() { return entry.state; }, promise: entry.promise };
  }
  const acquire = (pack, owner = 'default', now = Date.now()) => ensure(pack, owner, now).promise;
  function release(packOrKey, owner = 'default', now = Date.now()) {
    const key = typeof packOrKey === 'string' ? packOrKey : campaignResourceKey(packOrKey), entry = entries.get(key);
    if (!entry) return false;
    entry.owners.delete(String(owner)); entry.lastUsedAt = now;
    if (!owners(entry)) entry.pendingClearAt = now + clearDelayMs;
    return true;
  }
  function clearScope(scope, now = Date.now()) {
    const prefix = String(scope);
    for (const entry of [...entries.values()]) for (const owner of [...entry.owners]) {
      if (owner === prefix || owner.startsWith(prefix + ':')) release(entry.key, owner, now);
    }
    sweep(now);
  }
  function sweep(now = Date.now()) {
    for (const entry of [...entries.values()]) if (!owners(entry) && entry.pendingClearAt != null && entry.pendingClearAt <= now) {
      entry.cancelled = true; entry.generation += 1; remove(entry); settle(entry, 'reject', new Error(`purged ${entry.key}`));
    }
    pump(now);
  }
  function purge() {
    for (const entry of [...entries.values()]) {
      entry.cancelled = true; entry.generation += 1;
      finishLoading(entry);
      remove(entry); settle(entry, 'reject', new Error(`purged ${entry.key}`));
    }
    queue.length = 0;
  }
  function inspect() { return { bytes, reservedBytes, maxDecodedBytes, maxLoading, loading, queued: queue.length,
    entries: [...entries.values()].map(e => ({ key: e.key, state: e.state, bytes: e.bytes, reservation: e.reservation, owners: owners(e), pendingClear: e.pendingClearAt != null })) }; }
  return { ensure, acquire, release, clearScope, sweep, purge, inspect };
}
