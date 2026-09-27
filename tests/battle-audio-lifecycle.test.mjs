import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const sfxSource = read('src/ui/audio-sfx-runtime.js');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function fixture({ parent = null, pending = null, voice = null } = {}) {
  const sources = [], events = {}, dataset = {}, media = [];
  let time = 100;
  const context = {
    state: 'running', destination: {}, resume: async () => {},
    decodeAudioData: async () => ({ duration: 3 }),
    createGain: () => ({ gain: {}, connect() {}, disconnect() {} }),
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source); return source;
    }
  };
  const window = { HonVietAudio: voice || { context: () => context }, addEventListener: (name, fn) => { events[name] = fn; } };
  window.parent = parent?.window || window;
  vm.runInNewContext(sfxSource, {
    window, URL, console, performance: { now: () => time },
    document: { baseURI: 'https://game.example/', documentElement: { dataset }, addEventListener() {}, querySelectorAll: () => media },
    fetch: async () => ({ ok: true, arrayBuffer: () => pending ? pending.promise : Promise.resolve(new ArrayBuffer(1)) })
  });
  return { window, bus: window.HonVietSfx, sources, events, dataset, media, advance: () => { time += 200; } };
}

test('leaving battle stops shared attack and result SFX but keeps normal UI usable', async () => {
  const parent = fixture(), child = fixture({ parent });
  await child.bus.play('basic'); await child.bus.play('victory', { group: 'ui' });
  assert.equal(parent.sources.length, 2);
  parent.bus.endBattle();
  assert.ok(parent.sources.every(s => s.stopped));
  assert.equal(await child.bus.play('skill'), false);
  child.bus.setCombatEnabled(true);
  assert.equal(await child.bus.play('ultimate'), false, 'late engine callback cannot reopen the closed channel');
  assert.equal(await parent.bus.play('ui'), true);
});

test('pending decode and queued iframe click cannot restart sound after close', async () => {
  const pending = deferred(), parent = fixture({ pending }), child = fixture({ parent });
  const attack = child.bus.play('basic'), click = child.bus.play('ui');
  parent.bus.endBattle(); pending.resolve(new ArrayBuffer(1));
  assert.deepEqual(await Promise.all([attack, click]), [false, false]);
  assert.equal(parent.sources.length, 0);
});

test('old iframe pagehide cannot mute the next battle; repeated exits stay safe', async () => {
  const parent = fixture(), first = fixture({ parent });
  parent.bus.endBattle();
  const next = fixture({ parent });
  await next.bus.play('basic');
  first.events.pagehide(); first.events.pagehide(); first.bus.setCombatEnabled(false);
  assert.equal(parent.sources[0].stopped, undefined);
  assert.equal(await next.bus.play('skill'), true);
  next.events.pagehide();
  assert.ok(parent.sources.every(s => s.stopped));
});

test('disposing the child pauses its HTML voice player and invalidates its fallback', () => {
  const parent = fixture(), child = fixture({ parent });
  const audio = { currentTime: 2, pause() { this.paused = true; } }; child.media.push(audio);
  child.bus.dispose();
  assert.equal(audio.paused, true); assert.equal(audio.currentTime, 0);
  assert.equal(child.bus.isBattleActive(), false);
  const patch = read('scripts/runtime-qa-polish-v2.mjs');
  for (const name of ['fallback', 'play']) {
    const start = patch.indexOf(' const ' + name + '=()=>{');
    assert.ok(start >= 0);
    assert.match(patch.slice(start, start + 170), /isBattleActive/);
  }
});

function voiceFixture({ pending = null, rejectDecode = false } = {}) {
  const sources = [], media = [], dataset = {};
  class Audio {
    constructor() { media.push(this); }
    async play() { this.played = true; }
    pause() { this.paused = true; }
  }
  class Context {
    state = 'running'; destination = {};
    createBuffer() { return {}; }
    async resume() {}
    async decodeAudioData() { if (rejectDecode) throw new Error('decode failed'); return { duration: 5 }; }
    createGain() { return { gain: {}, connect() {}, disconnect() {} }; }
    createBufferSource() {
      const s = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(s); return s;
    }
  }
  const window = { AudioContext: Context };
  const source = read('scripts/ios-audio-unlock-patch.mjs').match(/const manager = String.raw`<script[^>]*>([\s\S]*?)<\/script>`;/)[1];
  vm.runInNewContext(source, {
    window, Audio,
    document: { documentElement: { dataset }, querySelectorAll: () => [], addEventListener() {} },
    fetch: async () => ({ ok: true, arrayBuffer: () => pending ? pending.promise : Promise.resolve(new ArrayBuffer(1)) })
  });
  return { bus: window.HonVietAudio, sources, media, dataset };
}
const ultimate = 'assets/audio/voice-luc-anh-ultimate.mp3';

test('ultimate voice pending decode is cancelled even if a new battle starts before it resolves', async () => {
  const pending = deferred(), f = voiceFixture({ pending });
  const playing = f.bus.playVoice(ultimate); await flush();
  f.bus.stopCombat(); f.bus.beginCombat(); pending.resolve(new ArrayBuffer(1));
  assert.equal(await playing, false);
  assert.equal(f.sources.length, 2, 'only the silent unlock buffers were created');
  assert.equal(f.media.length, 0, 'cancelled voice does not enter HTML fallback');
});

test('stop combat cancels active ultimate voice while leaving hero-detail voice alone', async () => {
  const f = voiceFixture();
  await f.bus.playVoice(ultimate); await f.bus.playVoice('assets/audio/voice-luc-anh-hero.mp3');
  f.bus.stopCombat();
  assert.equal(f.sources[2].stopped, true);
  assert.equal(f.sources[3].stopped, undefined);
  assert.equal(await f.bus.playVoice(ultimate), false);
  f.bus.beginCombat(); assert.equal(await f.bus.playVoice(ultimate), true);
});

test('HTML fallback voice is owned and stopped on exit too', async () => {
  const f = voiceFixture({ rejectDecode: true });
  assert.equal(await f.bus.playVoice(ultimate), true);
  f.bus.stopCombat();
  assert.equal(f.media[0].paused, true); assert.equal(f.media[0].currentTime, 0);
});

test('result music cannot resume after stop while waiting for audio unlock', async () => {
  const pending = deferred(), listeners = {}, players = [];
  class Audio { constructor() { players.push(this); } pause() {} async play() { this.played = true; } }
  const window = { HonVietAudio: { unlock: () => pending.promise }, addEventListener: (n, f) => { listeners[n] = f; } };
  const source = read('scripts/result-audio-runtime-v1.mjs').match(/const parentScript=String.raw`<script[^>]*>([\s\S]*?)<\/script>`;/)[1];
  vm.runInNewContext(source, { window, Audio, document: { getElementById: () => null }, location: { origin: 'https://game.example' } });
  const play = window.__HV_RESULT_AUDIO.play('victory');
  window.__HV_RESULT_AUDIO.stop(); pending.resolve();
  assert.equal(await play, false); assert.equal(players.length, 0, 'cancelled play never creates a fallback player');
  listeners.message({ data: { source: 'hon-viet-battle', type: 'battle-result-audio', payload: { sessionId: 'old', victory: true } } });
  assert.equal(window.__HV_RESULT_AUDIO.current(), '', 'stale frame cannot reopen result music');
});

test('battle close preserves result BGM through the parent route handoff', () => {
  assert.match(read('scripts/battle-audio-lifecycle-v1.mjs'), /__HV_RESULT_AUDIO\?\.stop\(\{keepCurrent:true\}\)/);
});

test('built close owner stops both parent buses and the child before blanking the iframe', () => {
  const index = read('dist/index.html');
  const start = index.indexOf('  function closeOverlay() {');
  const end = index.indexOf('\n  function finishIntegratedBattle', start);
  assert.ok(start >= 0 && end > start);
  const order = [];
  const context = vm.createContext({
    window: { HonVietSfx: { endBattle: () => order.push('sfx') }, __HV_RESULT_AUDIO: { stop: () => order.push('result') }, __HV_HOST_ATLASES: { resume() {} } },
    frame: { contentWindow: { HonVietSfx: { dispose: () => order.push('child') } }, removeAttribute() {}, dataset: {}, set src(v) { order.push(v); } },
    activeBattle: null, overlay: { classList: { remove() {} } }, loading: {}, document: { documentElement: { style: {} } }
  });
  vm.runInContext(index.slice(start, end) + '\ncloseOverlay();', context);
  assert.deepEqual(order, ['sfx', 'result', 'child', 'about:blank']);
});
