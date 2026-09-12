(() => {
  'use strict';
  if (window.HonVietSfx) return;
  const files = {
    ui: 'se_button_click.mp3', select: 'se_icon_click.wav',
    victory: 'se_battlewin.mp3', defeat: 'se_battlelose.mp3', heal: 'se_gift.mp3',
    basic: '201800_se_atk.wav', skill: '201800_se_s1.wav',
    ultimate: '201800_se_s2.wav', 'forge-reveal': '400500_se_s1_beaten.wav'
  };
  const assetBase = new URL('assets/audio/sfx/', document.baseURI).href;
  let parentBus = null;
  try {
    if (window.parent !== window) {
      const shared = window.parent.HonVietSfx;
      parentBus = shared?.createBattleChannel ? shared.createBattleChannel() : shared;
    }
  } catch (_) {}
  const active = new Set(), buffers = new Map(), loads = new Map(), last = new Map();
  let ownContext = null, combatEnabled = true, combatEpoch = 0, played = 0;
  let battleSession = 0, disposed = false;
  const stamp = (key, value) => { document.documentElement.dataset[key] = String(value); };
  function context() {
    const early = window.__HV_EARLY_CTX;
    const shared = window.HonVietAudio?.context();
    if (shared) return shared;
    if (early) {
      ownContext = ownContext || early;
      return ownContext;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ownContext && AC) ownContext = new AC();
    return ownContext;
  }
  async function load(event) {
    if (buffers.has(event)) return buffers.get(event);
    if (loads.has(event)) return loads.get(event);
    const c = context();
    if (!c) throw new Error('Web Audio unavailable');
    const task = fetch(assetBase + files[event], { cache: 'force-cache' })
      .then(r => { if (!r.ok) throw new Error(`SFX ${event}: HTTP ${r.status}`); return r.arrayBuffer(); })
      .then(bytes => c.decodeAudioData(bytes))
      .then(buffer => { buffers.set(event, buffer); stamp('sfxLoaded', buffers.size); return buffer; })
      .finally(() => loads.delete(event));
    loads.set(event, task);
    return task;
  }
  function report(error) {
    stamp('sfxError', error.message || error);
    console.warn('[HonViet SFX]', error);
  }
  function unlock() {
    if (disposed) return Promise.resolve(false);
    if (parentBus) return parentBus.unlock();
    const c = context();
    if (!c) { stamp('sfxState', 'unsupported'); return Promise.resolve(false); }
    // resume() is invoked synchronously inside the real click/touch gesture.
    const resumed = c.state === 'running' ? Promise.resolve() : c.resume();
    return resumed.then(() => {
      stamp('sfxState', c.state);
      if (c.state !== 'running') return false;
      for (const event of Object.keys(files)) load(event).catch(report);
      return true;
    }).catch(error => { report(error); return false; });
  }
  function stopCombat() {
    if (parentBus) return parentBus.stopCombat();
    combatEpoch += 1;
    window.HonVietAudio?.stopCombat?.();
    for (const voice of active) if (voice.group === 'combat') {
      try { voice.source.stop(); } catch (_) {}
      voice.cleanup();
    }
  }
  function setCombatEnabled(enabled) {
    if (disposed) return;
    if (parentBus) return parentBus.setCombatEnabled(enabled);
    combatEnabled = Boolean(enabled);
    if (!combatEnabled) stopCombat();
    else window.HonVietAudio?.beginCombat?.();
    stamp('sfxCombatEnabled', combatEnabled);
  }
  function endBattle() {
    if (parentBus) return parentBus.dispose ? parentBus.dispose() : parentBus.stopCombat?.();
    battleSession += 1;
    setCombatEnabled(false);
    stamp('sfxBattleActive', false);
  }
  function createBattleChannel() {
    stopCombat();
    const session = ++battleSession;
    setCombatEnabled(true);
    stamp('sfxBattleActive', true);
    const ownsSession = () => !disposed && session === battleSession;
    return {
      play: (event, options = {}) => ownsSession() && event !== 'forge-reveal'
        ? play(event, { ...options, group: ['ui', 'select'].includes(event) ? 'ui' : 'combat', battleSession: session })
        : Promise.resolve(false),
      unlock: () => ownsSession() ? unlock() : Promise.resolve(false),
      stopCombat: () => { if (ownsSession()) stopCombat(); },
      setCombatEnabled: enabled => { if (ownsSession()) setCombatEnabled(enabled); },
      isBattleActive: ownsSession,
      dispose: () => { if (ownsSession()) endBattle(); }
    };
  }
  function isBattleActive() { return !disposed && (parentBus?.isBattleActive?.() ?? true); }
  function dispose() {
    if (disposed) return;
    // End the owned channel before closing this document. Old pagehide events
    // must never silence the next battle's channel in the shared parent.
    endBattle();
    disposed = true;
    for (const media of document.querySelectorAll?.('audio,video') || []) {
      try { media.pause(); media.currentTime = 0; } catch (_) {}
    }
  }
  async function play(event, options = {}) {
    if (!isBattleActive()) return false;
    if (parentBus) return parentBus.play(event, options);
    if (!files[event]) return false;
    // Forge audio belongs to an explicit shell UI command, never combat.
    if (event === 'forge-reveal' && options.group !== 'ui') return false;
    const group = options.group || (['ui', 'select'].includes(event) ? 'ui' : 'combat');
    if (options.battleSession !== undefined && options.battleSession !== battleSession) return false;
    if (group === 'combat' && !combatEnabled) return false;
    const c = context();
    stamp('sfxState', c?.state || 'unsupported');
    // Do not queue stale auto-battle effects behind an iOS autoplay lock.
    if (!c || c.state !== 'running') return false;
    const now = performance.now(), key = group + ':' + event;
    if (now - (last.get(key) ?? -Infinity) < (event === 'forge-reveal' ? 120 : 70)) return false;
    last.set(key, now);
    const ticket = combatEpoch;
    try {
      const buffer = await load(event);
      if (disposed || (options.battleSession !== undefined && options.battleSession !== battleSession)) return false;
      if (c.state !== 'running' || performance.now() - now > 1200) return false;
      if (group === 'combat' && (!combatEnabled || ticket !== combatEpoch)) return false;
      while (active.size >= 6) {
        const oldest = active.values().next().value;
        try { oldest.source.stop(); } catch (_) {}
        oldest.cleanup();
      }
      const source = c.createBufferSource(), gain = c.createGain();
      source.buffer = buffer;
      gain.gain.value = event === 'forge-reveal' ? 0.4 : group === 'ui' ? 0.3 : 0.38;
      source.connect(gain); gain.connect(c.destination);
      const voice = { source, group, cleanup() {
        if (!active.delete(voice)) return;
        source.disconnect(); gain.disconnect(); stamp('sfxActive', active.size);
      } };
      source.onended = voice.cleanup;
      active.add(voice); source.start(0);
      stamp('sfxPlayed', ++played); stamp('sfxLast', event); stamp('sfxActive', active.size);
      return true;
    } catch (error) { report(error); return false; }
  }
  window.HonVietSfx = { play, unlock, stopCombat, setCombatEnabled, createBattleChannel, endBattle, dispose, isBattleActive };
  for (const event of ['pointerdown', 'touchend', 'keydown']) {
    document.addEventListener(event, () => { void unlock(); }, { capture: true, passive: true });
  }
  document.addEventListener('click', event => {
    const control = event.target?.closest?.('button,[role="button"],a[href],select');
    if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true' || control.id === 'soundButton') return;
    void unlock().then(ready => { if (ready) void play(control.matches('select') ? 'select' : 'ui', { group: 'ui' }); });
  }, { capture: true });
  window.addEventListener('pagehide', parentBus ? dispose : endBattle);
  stamp('sfxVersion', 'forge-isolation-v3');
})();
