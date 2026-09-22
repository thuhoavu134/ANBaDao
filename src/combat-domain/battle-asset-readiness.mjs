// Serialized into the existing battle closure. Owns readiness, not combat rules.
export function createBattleAssetReadiness(options) {
  const { getState, getUnits, describe, sound } = options;
  const timeoutMs = options.timeoutMs ?? 15000;
  const events = [], visible = new Map(), tasks = new Set(), paints = {};
  let visibleBattleId, sequence = 0;
  const record = (type, detail = {}) => {
    events.push({ type, at: Date.now(), ...detail });
    if (events.length > 120) events.splice(0, events.length - 120);
  };
  const abortError = () => Object.assign(new Error('Battle asset preparation cancelled'), { name: 'AbortError' });
  const current = (actor, battleId) => {
    const state = getState();
    return state.battleId === battleId && state.mode === 'battle' &&
      state.currentId === actor.id && actor.hp > 0;
  };
  const constrainedLoader = loader => {
    const info = loader?.inspect?.();
    return Boolean(info && (
      (Number(info.maxBytes) > 0 && Number(info.maxBytes) <= 64 * 1024 * 1024) ||
      Number(info.maxLoading) === 1
    ));
  };
  function resetVisible() {
    for (const [loader, pins] of visible) for (const [src, pin] of pins) loader.cache.unpin(src, pin);
    visible.clear();
  }
  function image(loader, clip, key) {
    if (!clip) return null;
    const id = getState().battleId;
    if (id !== visibleBattleId) { resetVisible(); visibleBattleId = id; }
    let pin;
    if (key === 'idle' && !constrainedLoader(loader)) {
      if (!visible.has(loader)) visible.set(loader, new Map());
      const pins = visible.get(loader);
      if (!pins.has(clip.src)) pins.set(clip.src, Symbol('battle-visible-idle'));
      pin = pins.get(clip.src);
    }
    return loader.ensure(clip, { scope: 'battle', priority: 'visible', pin }).image;
  }
  async function prepare(actor, action, target, battleId) {
    const controller = new AbortController(), leases = [];
    let released = false;
    const taskId = ++sequence;
    const active = () => !controller.signal.aborted && current(actor, battleId);
    const release = () => {
      if (released) return;
      released = true; clearInterval(watch); controller.abort();
      for (const lease of leases) lease.release();
      tasks.delete(release);
      record('assets:released', { taskId, actorId: actor.id, battleId });
    };
    const watch = setInterval(() => { if (!current(actor, battleId)) controller.abort(); }, 40);
    tasks.add(release);
    const grouped = new Map();
    const add = (descriptor, key) => {
      if (!descriptor) return;
      const clip = descriptor.clip(key);
      if (!clip) throw new Error('Missing battle clip: ' + descriptor.hero + '/' + key);
      if (!grouped.has(descriptor.loader)) grouped.set(descriptor.loader, new Map());
      grouped.get(descriptor.loader).set(clip.src, clip);
      if (key === 'idle') image(descriptor.loader, clip, key);
    };
    try {
      if (!active()) throw abortError();
      const actorDescription = describe(actor);
      // Visible idle atlases are requested lazily by the renderer. Blocking an
      // action on every unit's idle caused iOS Safari to decode multiple large
      // atlases before the first move. Readiness now owns only the active
      // actor's movement/cast/VFX working set.
      if (actorDescription) {
        add(actorDescription, 'run');
        add(actorDescription, action === 'ultimate' ? 'ultimate' : 'attack');
        add(actorDescription, action === 'ultimate' ? 'ultimateVfx' : 'atkVfx');
      }
      record('assets:waiting', { taskId, actorId: actor.id, battleId, action,
        urls: [...grouped.values()].flatMap(clips => [...clips.keys()]) });
      options.onWaiting?.(actor);
      // Prepare buffers without emitting sound. Muted/unsupported audio is not
      // a readiness blocker. The audio bus bounds preparation independently.
      const event = actorDescription?.sfx(action);
      const audio = getState().sound && event && sound()?.prepare
        ? Promise.resolve(sound().prepare(event, { signal: controller.signal, timeoutMs: 2000 }))
          .then(ok => record('sfx:prepared', { event, ok: ok === true, taskId }))
          .catch(error => record('sfx:prepare-failed', { event, error: String(error.message || error), taskId }))
        : Promise.resolve();
      await Promise.all([...grouped].map(async ([loader, clips]) => {
        for (const clip of clips.values()) {
          const h = loader.ensure(clip, { scope: 'battle', priority: 'critical' });
          if (h.state === 'failed' && /^network\b/.test(String(h.error))) loader.retry(clip, { scope: 'battle' });
        }
        const lease = await loader.acquire([...clips.values()], {
          scope: 'battle', owner: 'action:' + taskId, signal: controller.signal, timeoutMs
        });
        if (released || !active()) { lease.release(); throw abortError(); }
        leases.push(lease);
      }));
      await audio;
      if (!active()) throw abortError();
      record('assets:ready', { taskId, actorId: actor.id, battleId, action });
      return { signal: controller.signal, active, release, taskId };
    } catch (error) {
      release();
      record(error?.name === 'AbortError' ? 'assets:cancelled' : 'assets:failed', {
        taskId, battleId, actorId: actor.id, error: String(error?.message || error)
      });
      throw error;
    }
  }
  function playSfx(info, event) {
    if (!info || info.finished || info.sfxPlayed) return Promise.resolve(!!info?.sfxPlayed);
    if (info.sfxPending) return info.sfxPending;
    const live = () => {
      const state = getState();
      return !info.finished && !info.assetSignal?.aborted && state.battleId === info.battleId &&
        state.mode === 'battle' && state.sound;
    };
    if (!live()) return Promise.resolve(false);
    const bus = sound();
    if (!bus?.play) { record('sfx:unavailable', { event }); return Promise.resolve(false); }
    record('sfx:requested', { event, battleId: info.battleId });
    let result;
    try { result = bus.play(event, { group: 'combat', signal: info.assetSignal, maxDelayMs: 250 }); }
    catch (error) { result = Promise.reject(error); }
    const pending = Promise.resolve(result).then(ok => {
      const played = ok === true && live();
      info.sfxPlayed = played;
      record(played ? 'sfx:played' : 'sfx:declined', { event, battleId: info.battleId });
      return played;
    }, error => {
      record('sfx:failed', { event, error: String(error?.message || error), battleId: info.battleId });
      return false;
    }).finally(() => { if (info.sfxPending === pending) info.sfxPending = null; });
    info.sfxPending = pending;
    return pending;
  }
  function painted(hero, key) { const name = hero + ':' + key; paints[name] = (paints[name] || 0) + 1; }
  function dispose() { for (const release of [...tasks]) release(); resetVisible(); }
  return { image, prepare, playSfx, painted, dispose, paintCounts: () => ({ ...paints }),
    events: () => events.map(event => ({ ...event })) };
}
