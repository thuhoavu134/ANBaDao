import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manager = read('scripts/ios-audio-unlock-patch.mjs').match(/const manager = String.raw`<script[^>]*>([\s\S]*?)<\/script>`;/)[1];

function fixture({ pendingMusic = null } = {}) {
  const sources = [], media = [], listeners = {}, dataset = {};
  class Context {
    state = 'running'; currentTime = 12; destination = {};
    async resume() { this.state = 'running'; }
    async decodeAudioData() { return { duration: 9 }; }
    createBuffer() { return {}; }
    createGain() {
      const gain = { value: 1, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; } };
      return { gain, connect() {}, disconnect() {} };
    }
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source); return source;
    }
  }
  class Audio { constructor() { media.push(this); } async play() { this.played = true; } pause() {} }
  const window = { AudioContext: Context, addEventListener(name, fn) { listeners[name] = fn; } };
  const document = {
    visibilityState: 'visible', documentElement: { dataset },
    addEventListener(name, fn) { listeners['document:' + name] = fn; },
    querySelectorAll() { return []; }
  };
  vm.runInNewContext(manager, {
    window, document, Audio, console, setTimeout, clearTimeout,
    fetch: async url => ({ ok: true, arrayBuffer: async () => pendingMusic?.(url) ?? new ArrayBuffer(1) })
  });
  return { window, bus: window.HonVietAudio, sources, media, listeners };
}

test('one unlock carries hub music through battle and result without another HTML-media gesture', async () => {
  const f = fixture();
  assert.equal(await f.bus.unlock(), true);
  assert.equal(typeof f.bus.playMusic, 'function');
  assert.equal(await f.bus.playMusic('assets/audio/bgm-hub-new.mp3', { loop: true, volume: 0.34 }), true);
  assert.equal(await f.bus.playMusic('assets/audio/bgm-combat-new.mp3', { loop: true, volume: 0.34 }), true);
  assert.equal(await f.bus.playMusic('assets/audio/bgm-victory.mp3', { loop: false, volume: 0.9, category: 'result' }), true);
  const count = f.sources.filter(source => source.started).length;
  assert.equal(await f.bus.playMusic('assets/audio/bgm-victory.mp3', { loop: false, volume: 0.9, category: 'result' }), true);
  assert.equal(f.sources.filter(source => source.started).length, count, 'same track is not restarted');
  assert.equal(f.bus.music().url, 'assets/audio/bgm-victory.mp3');
  assert.equal(f.media.length, 0, 'track changes stay on the unlocked shared Web Audio context');
  assert.equal(count, 5, 'unlock silence plus three music sources');
});

test('newer music request wins if an older track finishes decoding later', async () => {
  let resolveCombat;
  const pending = new Promise(resolve => { resolveCombat = resolve; });
  const f = fixture({ pendingMusic: url => url.includes('bgm-combat') ? pending : undefined });
  await f.bus.unlock();
  assert.equal(await f.bus.playMusic('assets/audio/bgm-hub-new.mp3'), true);
  const combat = f.bus.playMusic('assets/audio/bgm-combat-new.mp3');
  assert.equal(await f.bus.playMusic('assets/audio/bgm-victory.mp3', { loop: false, category: 'result' }), true);
  resolveCombat(new ArrayBuffer(1));
  assert.equal(await combat, false);
  assert.equal(f.bus.music().url, 'assets/audio/bgm-victory.mp3');
});

test('result audio delegates to the host shared bus and close can preserve music during route handoff', async () => {
  const calls = [], listeners = {};
  const window = {
    HonVietAudio: {
      async playMusic(src, options) { calls.push(['play', src, options]); return true; },
      stopMusic(options) { calls.push(['stop', options]); }
    },
    addEventListener(name, fn) { listeners[name] = fn; }
  };
  function Audio() { throw new Error('result must not create a gesture-gated media player'); }
  const source = read('scripts/result-audio-runtime-v1.mjs').match(/const parentScript=String.raw`<script[^>]*>([\s\S]*?)<\/script>`;/)[1];
  vm.runInNewContext(source, { window, Audio, document: { getElementById: () => null }, location: { origin: 'https://game.example' } });
  assert.equal(await window.__HV_RESULT_AUDIO.play('victory'), true);
  assert.equal(calls[0][0], 'stop');
  assert.equal(calls[0][1].keepCurrent, true);
  assert.equal(calls[1][0], 'play');
  assert.equal(calls[1][1], 'assets/audio/bgm-victory.mp3');
  assert.equal(calls[1][2].loop, false);
  window.__HV_RESULT_AUDIO.stop({ keepCurrent: true });
  assert.equal(calls[2][0], 'stop');
  assert.equal(calls[2][1].keepCurrent, true);
});

test('profile volume and audio-only hunt screens control the shared BGM owner', () => {
  assert.match(read('src/ui/profile-runtime.js'), /HonVietAudio\?\.setMusicVolume\?\.\(n\)/);
  assert.match(read('src/ui/hunt-runtime.js'), /HonVietAudio\?\.stopMusic\?\.\(\)/);
  assert.match(read('src/ui/hunt-3d-runtime.js'), /HonVietAudio\?\.stopMusic\?\.\(\)/);
});

test('built BGM routes use shared Web Audio and retain a media fallback only without a context', () => {
  const patch = read('scripts/bgm-runtime-patch.mjs');
  const routed = patch.slice(patch.indexOf('const newPlay ='), patch.indexOf("if(!s.includes(oldPlay))"));
  assert.match(routed, /bus\.playMusic/);
  assert.match(routed, /bgmPlayer\.pause/);
  assert.match(routed, /bgmPlayer\.onerror/);
  assert.match(patch, /__HV_BGM_RETRY/);
});
