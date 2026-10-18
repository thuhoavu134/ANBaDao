(() => {
  'use strict';
  if (window.HonVietSfx) return;
  const files = {
    'tich-dao-blink':'tich-dao/blink.wav','tich-dao-slash':'tich-dao/slash.wav','tich-dao-sword-rain':'tich-dao/sword-rain.wav','tich-dao-execute-impact':'tich-dao/execute-impact.wav',
    'hong-thuong-impact':'hong-thuong/impact.wav',
    'be-an-basic':'be-an/basic.m4a',
    'be-an-ultimate':'be-an/ultimate.m4a',
    'be-an-special':'be-an/special.m4a',
    'co-nuong-pierce':'co-nuong/pierce.wav',
    'dinh-loi-atk':'dinh-loi/atk.m4a',
    'dinh-loi-skill':'dinh-loi/skill.m4a',
    'dinh-loi-ultimate':'dinh-loi/ultimate.m4a',
    'thay-mo-ultimate':'thay-mo/ultimate.m4a',
    'co-nuong-atk':'co-nuong/tm_shyy_c.wav',
    'co-nuong-ultimate':'co-nuong/tm_bylh_f.wav',
'tieu-phong-basic-x1':'tieu-phong/basic-x1.m4a','tieu-phong-basic-x2':'tieu-phong/basic-x2.m4a','tieu-phong-basic-x3':'tieu-phong/basic-x3.m4a','tieu-phong-ultimate-x1':'tieu-phong/ultimate-x1.m4a','tieu-phong-ultimate-x2':'tieu-phong/ultimate-x2.m4a','tieu-phong-ultimate-x3':'tieu-phong/ultimate-x3.m4a',
    'ky-van-basic-x1':'ky-van/basic-x1.m4a','ky-van-basic-x2':'ky-van/basic-x2.m4a','ky-van-basic-x3':'ky-van/basic-x3.m4a','ky-van-ultimate-x1':'ky-van/ultimate-x1.m4a','ky-van-ultimate-x2':'ky-van/ultimate-x2.m4a','ky-van-ultimate-x3':'ky-van/ultimate-x3.m4a',
    ui: 'se_button_click.mp3', select: 'se_icon_click.wav',
    victory: 'se_battlewin.mp3', defeat: 'se_battlelose.mp3', heal: 'se_gift.mp3',
    basic: '201800_se_atk.wav', skill: '201800_se_s1.wav',
    ultimate: '201800_se_s2.wav', 'forge-reveal': '400500_se_s1_beaten.wav',
    'linh-dong-atk': 'linh-dong/atk.wav', 'linh-dong-ult': 'linh-dong/ult.wav',
    'bach-dien-atk': 'bach-dien/atk.wav', 'bach-dien-ult': 'bach-dien/ult.wav'
  };
  const assetBase = new URL('assets/audio/sfx/', document.baseURI).href;
  let parentBus = null, parentPerformanceOffsetMs = 0;
  try {
    if (window.parent !== window) {
      const shared = window.parent.HonVietSfx;
      parentBus = shared?.createBattleChannel ? shared.createBattleChannel() : shared;
      const localOrigin = Number(performance.timeOrigin);
      const parentOrigin = Number(window.parent.performance?.timeOrigin);
      if (Number.isFinite(localOrigin) && Number.isFinite(parentOrigin)) {
        // Convert a child performance.now() timestamp into the parent's clock:
        // parentNow = childNow + childTimeOrigin - parentTimeOrigin.
        parentPerformanceOffsetMs = localOrigin - parentOrigin;
      } else {
        const localNow = Number(performance.now());
        const parentNow = Number(window.parent.performance?.now?.());
        if (Number.isFinite(localNow) && Number.isFinite(parentNow)) parentPerformanceOffsetMs = parentNow - localNow;
      }
    }
  } catch (_) {}
  const translatePerformanceFields = (item, delta) => {
    const copy = { ...item };
    for (const key of Object.keys(copy)) {
      if (/PerformanceMs$/.test(key) && Number.isFinite(Number(copy[key]))) copy[key] = Number(copy[key]) + delta;
    }
    return copy;
  };
  const optionsForParent = options => {
    if (!parentBus || !parentPerformanceOffsetMs) return options;
    const copy = { ...options };
    for (const key of ['cuePerformanceMs', 'audibleAtPerformanceMs']) {
      if (Number.isFinite(Number(copy[key]))) copy[key] = Number(copy[key]) + parentPerformanceOffsetMs;
    }
    return copy;
  };
  const active = new Set(), buffers = new Map(), loads = new Map(), analyses = new Map(), last = new Map();
  const timing = [];
  const recordTiming = detail => {
    const item = { atPerformanceMs: performance.now(), ...detail };
    timing.push(item);
    if (timing.length > 160) timing.splice(0, timing.length - 160);
    return item;
  };
  function analyseBuffer(event, buffer) {
    if (analyses.has(event)) return analyses.get(event);
    const fallback = { audibleLeadInMs: 0, dominantCueMs: 0, method: 'unavailable' };
    if (!buffer || typeof buffer.getChannelData !== 'function' || !Number.isFinite(buffer.sampleRate) || buffer.sampleRate <= 0 || !buffer.numberOfChannels) {
      analyses.set(event, fallback); return fallback;
    }
    const sampleRate = buffer.sampleRate, channels = Math.max(1, buffer.numberOfChannels | 0);
    const first = buffer.getChannelData(0), length = first?.length || 0;
    if (!length) { analyses.set(event, fallback); return fallback; }
    const channelData = [first];
    for (let channel = 1; channel < channels; channel += 1) channelData.push(buffer.getChannelData(channel));
    const onsetWindow = Math.max(1, Math.round(sampleRate * 0.005));
    const peakWindow = Math.max(1, Math.round(sampleRate * 0.010));
    const onsetThreshold = Math.pow(10, -50 / 20);
    const onsetRing = new Float64Array(onsetWindow), peakRing = new Float64Array(peakWindow);
    let onsetSum = 0, peakSum = 0, onsetFrame = null, dominantFrame = 0, dominantRms = -1;
    for (let frame = 0; frame < length; frame += 1) {
      let power = 0;
      for (let channel = 0; channel < channels; channel += 1) {
        const value = Number(channelData[channel]?.[frame]) || 0;
        power += value * value;
      }
      power /= channels;
      const oi = frame % onsetWindow; onsetSum += power - onsetRing[oi]; onsetRing[oi] = power;
      const pi = frame % peakWindow; peakSum += power - peakRing[pi]; peakRing[pi] = power;
      if (onsetFrame === null && frame >= onsetWindow - 1 && Math.sqrt(onsetSum / onsetWindow) >= onsetThreshold) {
        onsetFrame = Math.max(0, frame - onsetWindow + 1);
      }
      if (frame >= peakWindow - 1) {
        const rms = Math.sqrt(peakSum / peakWindow);
        if (rms > dominantRms) { dominantRms = rms; dominantFrame = Math.max(0, frame - peakWindow + 1); }
      }
    }
    const result = {
      audibleLeadInMs: ((onsetFrame ?? 0) * 1000) / sampleRate,
      dominantCueMs: (dominantFrame * 1000) / sampleRate,
      method: 'decoded-buffer:rms-5ms--50db/onset;rms-10ms-max/dominant'
    };
    analyses.set(event, result);
    return result;
  }
  function timingEvents() {
    if (parentBus?.timingEvents) {
      return parentBus.timingEvents().map(item => ({
        ...translatePerformanceFields(item, -parentPerformanceOffsetMs),
        performanceClockDomain: 'battle-local',
        parentPerformanceOffsetMs
      }));
    }
    return timing.map(item => ({ ...item, performanceClockDomain: 'local', parentPerformanceOffsetMs: 0 }));
  }
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
  // HV_SFX_READINESS_V1: decoding is not playback and is safe before release.
  async function prepare(event, options = {}) {
    if (disposed || options.signal?.aborted || !files[event]) return false;
    if (parentBus) return parentBus.prepare ? parentBus.prepare(event, options) : false;
    let timer, onAbort;
    try {
      const buffer = await new Promise((resolve, reject) => {
        onAbort = () => reject(new Error('SFX preparation cancelled'));
        options.signal?.addEventListener('abort', onAbort, { once: true });
        if (options.signal?.aborted) { onAbort(); return; }
        timer = setTimeout(() => reject(new Error('SFX preparation timeout')), Math.max(1, Number(options.timeoutMs) || 2000));
        load(event).then(resolve, reject);
      });
      if (buffer) analyseBuffer(event, buffer);
      return !disposed && !options.signal?.aborted;
    } catch (error) {
      stamp('sfxPrepareError', error.message || error);
      return false;
    } finally {
      clearTimeout(timer);
      if (onAbort) options.signal?.removeEventListener('abort', onAbort);
    }
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
    const resumed = window.HonVietAudio?.unlock
      ? window.HonVietAudio.unlock()
      : c.state === 'running' ? Promise.resolve() : c.resume();
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
      voice.cancelled = true;
      if (voice.timingEvent) {
        voice.timingEvent.cancelled = true;
        voice.timingEvent.cancelReason = 'combat-stop';
        voice.timingEvent.cancelledPerformanceMs = performance.now();
      }
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
      prepare: (event, options = {}) => ownsSession() ? prepare(event, options) : Promise.resolve(false),
      unlock: () => ownsSession() ? unlock() : Promise.resolve(false),
      stopCombat: () => { if (ownsSession()) stopCombat(); },
      setCombatEnabled: enabled => { if (ownsSession()) setCombatEnabled(enabled); },
      isBattleActive: ownsSession,
      timingEvents: () => ownsSession() ? timingEvents() : [],
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
    const requestedAt = Date.now(), requestedPerformanceMs = performance.now();
    if (options.signal?.aborted) return false;
    if (!isBattleActive()) return false;
    if (parentBus) return parentBus.play(event, optionsForParent(options));
    if (!files[event]) return false;
    // Forge audio belongs to an explicit shell UI command, never combat.
    if (event === 'forge-reveal' && options.group !== 'ui') return false;
    const group = options.group || (['ui', 'select'].includes(event) ? 'ui' : 'combat');
    if (options.battleSession !== undefined && options.battleSession !== battleSession) return false;
    if (group === 'combat' && !combatEnabled) return false;
    const c = context();
    stamp('sfxState', c?.state || 'unsupported');
    if (!c || c.state !== 'running') return false;
    const now = performance.now(), key = group + ':' + event;
    if (now - (last.get(key) ?? -Infinity) < (event === 'co-nuong-pierce' ? 0 : event === 'forge-reveal' ? 120 : 70)) return false;
    last.set(key, now);
    const ticket = combatEpoch;
    try {
      const buffer = await load(event);
      const decodedReadyPerformanceMs = performance.now();
      if (options.signal?.aborted || (Number.isFinite(options.maxDelayMs) && Date.now() - requestedAt > options.maxDelayMs)) {
        stamp('sfxLastResult', 'expired'); return false;
      }
      if (disposed || (options.battleSession !== undefined && options.battleSession !== battleSession)) return false;
      if (c.state !== 'running') return false;
      if (group === 'combat' && (!combatEnabled || ticket !== combatEpoch)) return false;
      while (active.size >= 6) {
        const oldest = active.values().next().value;
        try { oldest.source.stop(); } catch (_) {}
        oldest.cleanup();
      }
      const analysis = analyseBuffer(event, buffer);
      const cuePerformanceMs = Number.isFinite(Number(options.cuePerformanceMs))
        ? Number(options.cuePerformanceMs)
        : Number.isFinite(Number(options.audibleAtPerformanceMs)) ? Number(options.audibleAtPerformanceMs) : null;
      const sampleCue = options.sampleCue === 'dominant' ? 'dominant' : 'onset';
      const playbackRate=event.startsWith('be-an-')||event.startsWith('tich-dao-')||event.startsWith('hong-thuong-')||event.startsWith('co-nuong-')||event.startsWith('dinh-loi-')||event.startsWith('thay-mo-')?Math.max(1,Math.min(3,Number(options.playbackRate)||1)):1;
      const sampleCueOffsetMs = (sampleCue === 'dominant' ? analysis.dominantCueMs : analysis.audibleLeadInMs)/playbackRate;
      const source = c.createBufferSource(), gain = c.createGain();
      source.buffer = buffer;
      if(source.playbackRate)source.playbackRate.value=playbackRate;
      gain.gain.value = event === 'co-nuong-pierce' ? .20 : event === 'forge-reveal' ? 0.4 : group === 'ui' ? 0.3 : 0.38;
      source.connect(gain); gain.connect(c.destination);
      const voice = { source, group, cleanup: null, cancelled: false, timingEvent: null };
      let cancel = null;
      voice.cleanup = () => {
        if (active.delete(voice)) stamp('sfxActive', active.size);
        if (cancel && options.signal) options.signal.removeEventListener('abort', cancel);
        try { source.disconnect(); gain.disconnect(); } catch (_) {}
      };
      cancel = () => {
        voice.cancelled = true;
        if (voice.timingEvent) {
          voice.timingEvent.cancelled = true;
          voice.timingEvent.cancelReason = 'signal-abort';
          voice.timingEvent.cancelledPerformanceMs = performance.now();
        }
        try { source.stop(); } catch (_) {}
        voice.cleanup();
      };
      if (options.signal) options.signal.addEventListener('abort', cancel, { once: true });
      source.onended = () => {
        if (voice.timingEvent) {
          voice.timingEvent.endedPerformanceMs = performance.now();
          voice.timingEvent.completed = !voice.cancelled;
        }
        voice.cleanup();
      };
      active.add(voice);
      const sourceRequestPerformanceMs = performance.now();
      const desiredSourcePerformanceMs = cuePerformanceMs === null ? null : cuePerformanceMs - sampleCueOffsetMs;
      const contextNow = Number(c.currentTime);
      let sourceScheduledPerformanceMs = sourceRequestPerformanceMs;
      let sourceStartContextTime = 0;
      let clockMapping = 'current-time';
      let outputTimestampContextTime = null;
      let outputTimestampPerformanceMs = null;
      let estimatedOutputLatencyMs = null;
      if (desiredSourcePerformanceMs !== null && Number.isFinite(contextNow)) {
        let outputTimestamp = null;
        try { outputTimestamp = c.getOutputTimestamp?.() || null; } catch (_) {}
        const outputContextTime = Number(outputTimestamp?.contextTime);
        const outputPerformanceMs = Number(outputTimestamp?.performanceTime);
        // A newly resumed output device can report (0,0), or a timestamp from
        // before suspension. Mapping the page clock through it schedules early
        // attacks seconds late; their action lease then cancels them unheard.
        const outputAgeMs = sourceRequestPerformanceMs - outputPerformanceMs;
        const freshOutputClock = Number.isFinite(outputContextTime) && Number.isFinite(outputPerformanceMs)
          && outputPerformanceMs > 0 && outputContextTime >= 0 && outputContextTime <= contextNow + .05
          && outputAgeMs >= -50 && outputAgeMs <= 1000;
        if (freshOutputClock) {
          clockMapping = 'output-timestamp';
          outputTimestampContextTime = outputContextTime;
          outputTimestampPerformanceMs = outputPerformanceMs;
          const earliestOutputPerformanceMs = outputPerformanceMs + Math.max(0, contextNow - outputContextTime) * 1000;
          estimatedOutputLatencyMs = Math.max(0, earliestOutputPerformanceMs - sourceRequestPerformanceMs);
          sourceScheduledPerformanceMs = Math.max(sourceRequestPerformanceMs, desiredSourcePerformanceMs, earliestOutputPerformanceMs);
          sourceStartContextTime = Math.max(contextNow, outputContextTime + Math.max(0, sourceScheduledPerformanceMs - outputPerformanceMs) / 1000);
        } else {
          sourceScheduledPerformanceMs = Math.max(sourceRequestPerformanceMs, desiredSourcePerformanceMs);
          sourceStartContextTime = contextNow + Math.max(0, sourceScheduledPerformanceMs - sourceRequestPerformanceMs) / 1000;
        }
      }
      const expectedAudiblePerformanceMs = sourceScheduledPerformanceMs + analysis.audibleLeadInMs/playbackRate;
      const expectedCuePerformanceMs = sourceScheduledPerformanceMs + sampleCueOffsetMs;
      const baseLatency = Number(c.baseLatency), outputLatency = Number(c.outputLatency);
      voice.timingEvent = recordTiming({
        type: 'sfx:scheduled', event, group, playbackRate,
        battleSession: options.battleSession ?? battleSession,
        actionId: options.actionId || null, cue: options.cue || null, sampleCue,
        requestedPerformanceMs, decodedReadyPerformanceMs,
        cuePerformanceMs, audibleLeadInMs: analysis.audibleLeadInMs,
        dominantCueMs: analysis.dominantCueMs, sampleCueOffsetMs,
        sourceScheduledPerformanceMs, sourceStartContextTime,
        expectedAudiblePerformanceMs, expectedCuePerformanceMs,
        signedCueOffsetMs: cuePerformanceMs === null ? null : expectedCuePerformanceMs - cuePerformanceMs,
        clockMapping, outputTimestampContextTime, outputTimestampPerformanceMs, estimatedOutputLatencyMs,
        contextBaseLatencyMs: Number.isFinite(baseLatency) ? baseLatency * 1000 : null,
        contextOutputLatencyMs: Number.isFinite(outputLatency) ? outputLatency * 1000 : null,
        timingBasis: 'web-audio-output-scheduled',
        audibleCueBasis: 'decoded-buffer-envelope',
        analysisMethod: analysis.method
      });
      if (options.signal?.aborted) { cancel(); return false; }
      source.start(sourceStartContextTime);
      stamp('sfxPlayed', ++played); stamp('sfxLast', event); stamp('sfxActive', active.size); stamp('sfxLastResult', 'played');
      return true;
    } catch (error) { report(error); return false; }
  }
  window.HonVietSfx = { play, prepare, unlock, stopCombat, setCombatEnabled, createBattleChannel, endBattle, dispose, isBattleActive, timingEvents };
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






