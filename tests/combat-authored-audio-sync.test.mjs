import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const audioSource = readFileSync(new URL('../src/ui/audio-sfx-runtime.js', import.meta.url), 'utf8');

function fixture() {
  const starts = [], sources = [], dataset = {};
  let performanceNow = 1000;
  const samples = new Float32Array(1000);
  samples.fill(0.1, 100);
  const buffer = {
    duration: 1,
    numberOfChannels: 1,
    sampleRate: 1000,
    getChannelData: () => samples
  };
  const context = {
    state: 'running',
    currentTime: 10,
    destination: {},
    resume: async () => {},
    decodeAudioData: async () => buffer,
    createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
    createBufferSource() {
      const node = {
        connect() {},
        disconnect() {},
        start(when = 0) { this.startedAt = when; starts.push(when); },
        stop() { this.stopped = true; }
      };
      sources.push(node);
      return node;
    }
  };
  const window = { HonVietAudio: { context: () => context }, addEventListener() {} };
  window.parent = window;
  vm.runInNewContext(audioSource, {
    window, URL, console: { warn() {} }, Date,
    performance: { now: () => performanceNow },
    setTimeout, clearTimeout,
    document: {
      baseURI: 'https://game.example/',
      documentElement: { dataset },
      addEventListener() {},
      querySelectorAll: () => []
    },
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
  });
  return {
    bus: window.HonVietSfx, context, starts, sources,
    setPerformanceNow(value) { performanceNow = value; }
  };
}

test('RED: scheduled combat SFX compensates decoded leading silence so audible onset lands on the visual cue', async () => {
  const f = fixture();
  assert.equal(await f.bus.prepare('basic'), true);
  assert.equal(typeof f.bus.timingEvents, 'function', 'audio bus must expose QA-only timing evidence');
  assert.equal(await f.bus.play('basic', {
    group: 'combat',
    actionId: 'qa:luc-anh:basic',
    cue: 'release',
    audibleAtPerformanceMs: 1500
  }), true);
  assert.equal(f.starts.length, 1);
  // 500 ms until the cue minus 100 ms decoded lead-in => source begins 400 ms
  // from now, mapped onto AudioContext.currentTime 10.0 => 10.4.
  assert.ok(Math.abs(f.starts[0] - 10.4) < 0.02, 'source start must compensate the file lead-in');
  const event = f.bus.timingEvents().find(item => item.actionId === 'qa:luc-anh:basic');
  assert.ok(event, 'timing evidence must keep the actionId');
  assert.ok(Math.abs(event.audibleLeadInMs - 100) <= 5);
  assert.ok(Math.abs(event.expectedAudiblePerformanceMs - 1500) <= 5);
});

test('RED: cancelling an action stops a WebAudio source that was already scheduled for a future cue', async () => {
  const f = fixture();
  assert.equal(await f.bus.prepare('ultimate'), true);
  const controller = new AbortController();
  assert.equal(await f.bus.play('ultimate', {
    group: 'combat',
    actionId: 'qa:cancelled-action',
    cue: 'release',
    audibleAtPerformanceMs: 1800,
    signal: controller.signal
  }), true);
  assert.equal(f.sources.length, 1);
  assert.notEqual(f.sources[0].stopped, true);
  controller.abort();
  assert.equal(f.sources[0].stopped, true, 'scheduled source must not leak into the next/cancelled action');
});

test('RED: final generated battle has one authored SFX cue scheduler instead of owner-local immediate playback', () => {
  const battle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');
  assert.match(battle, /AUTHORED_COMBAT_AUDIO_SYNC_V1/);
  assert.match(battle, /__hvScheduleAuthoredSfx/);
  assert.match(battle, /cuePerformanceMs/);
  assert.match(battle, /performance\.now\(\)\+460,"release:first-projectile"/, 'Lục Ảnh Basic must follow the generated 460 ms projectile release');
  assert.match(battle, /performance\.now\(\)\+520,"release:first-vfx"/, 'Lục Ảnh Skill must follow the generated 520 ms VFX release');
  assert.match(battle, /performance\.now\(\)\+lucAnhDelayMs\(LUC_ANH_SPATIAL\.timing\.basic\.projectileTravel\),"release:first-vfx"/,
    'Lục Ảnh Ultimate SFX must follow the same speed-aware delay as its generated VFX');
  assert.doesNotMatch(battle, /LUC_ANH_META\.(?:attack|skill1)\.frames\*LUC_ANH_META\.(?:attack|skill1)\.ms\)\);playActionSound\(actor,action\)/,
    'Lục Ảnh Basic/Skill must not retain owner-local immediate playback');
});


test('RED: generated battle mute routes through the combat SFX bus so scheduled release audio is stopped', () => {
  const battle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');
  const start = battle.indexOf('  function toggleSound() {');
  const end = battle.indexOf('\n  function pathMountain(', start);
  assert.ok(start >= 0 && end > start, 'battle toggleSound owner must exist');
  const block = battle.slice(start, end);
  assert.match(block, /window\.HonVietSfx\?\.setCombatEnabled\?\.\(state\.sound\)/,
    'mute/unmute must drive the combat SFX bus so already-scheduled sources cannot leak after mute');
});


test('RED: generated battle exit stops scheduled combat audio before host abort', () => {
  const battle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');
  const start = battle.indexOf('  dom.exitBattleButton?.addEventListener("click", () => {');
  const end = battle.indexOf('\n  dom.actionButtons.forEach', start);
  assert.ok(start >= 0 && end > start, 'embedded exit handler must exist');
  const block = battle.slice(start, end);
  assert.match(block, /window\.HonVietSfx\?\.stopCombat\?\.\(\)/,
    'exit must synchronously cancel active/future scheduled combat audio');
  assert.ok(block.indexOf('stopCombat') < block.indexOf('postToHonVietHost("battle-abort"'),
    'audio cancellation must happen before host navigation is requested');
});


test('muting combat stops a source already scheduled for a future authored cue', async () => {
  const f = fixture();
  assert.equal(await f.bus.prepare('basic'), true);
  assert.equal(await f.bus.play('basic', {
    group: 'combat',
    actionId: 'qa:future-mute',
    cue: 'release',
    cuePerformanceMs: 1800
  }), true);
  assert.equal(f.sources.length, 1);
  assert.ok(f.sources[0].startedAt > f.context.currentTime, 'fixture must actually schedule this source in the future');
  f.bus.setCombatEnabled(false);
  assert.equal(f.sources[0].stopped, true, 'mute must cancel the already-scheduled future source immediately');
  const cancelled = f.bus.timingEvents().find(item => item.actionId === 'qa:future-mute');
  assert.equal(cancelled?.cancelReason, 'combat-stop', 'timing evidence must distinguish forced combat cancellation from normal completion');
  assert.ok(Number.isFinite(cancelled?.cancelledPerformanceMs), 'timing evidence must record when the scheduled source was cancelled');
  f.sources[0].onended?.();
  const ended = f.bus.timingEvents().find(item => item.actionId === 'qa:future-mute');
  assert.equal(ended?.completed, false, 'a source stopped by mute/exit must never be reported as a natural completion');
  assert.equal(await f.bus.play('skill', { group:'combat' }), false, 'combat remains muted until explicitly re-enabled');
});


test('RED: generated battle mute and exit own the Lục Ảnh combat voice lifecycle', () => {
  const battle = readFileSync(new URL('../dist/battle.html', import.meta.url), 'utf8');
  const toggleStart = battle.indexOf('  function toggleSound() {');
  const toggleEnd = battle.indexOf('\n  function pathMountain(', toggleStart);
  assert.ok(toggleStart >= 0 && toggleEnd > toggleStart, 'battle toggleSound owner must exist');
  const toggle = battle.slice(toggleStart, toggleEnd);
  assert.match(toggle, /__hvCombatVoiceBus\(\)\?\.stopCombat\?\.\(\)/,
    'mute must stop the dedicated Lục Ảnh combat voice bus');
  assert.match(toggle, /__hvCombatVoiceBus\(\)\?\.beginCombat\?\.\(\)/,
    'unmute must re-enable combat voice for the next Ultimate');

  const exitStart = battle.indexOf('  dom.exitBattleButton?.addEventListener("click", () => {');
  const exitEnd = battle.indexOf('\n  dom.actionButtons.forEach', exitStart);
  assert.ok(exitStart >= 0 && exitEnd > exitStart, 'embedded exit handler must exist');
  const exit = battle.slice(exitStart, exitEnd);
  assert.match(exit, /__hvCombatVoiceBus\(\)\?\.stopCombat\?\.\(\)/,
    'exit must synchronously stop Lục Ảnh combat voice');
  assert.ok(exit.indexOf('__hvCombatVoiceBus') < exit.indexOf('postToHonVietHost("battle-abort"'),
    'voice cancellation must happen before host abort navigation');
});

test('RED: integrated battle host resets and closes the combat voice epoch', () => {
  const index = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const open = index.indexOf('  function openIntegratedBattle(');
  const close = index.indexOf('  function closeOverlay() {');
  assert.ok(open >= 0 && close > open, 'integrated battle open/close owners must exist');
  const openBlock = index.slice(open, close);
  assert.match(openBlock, /window\.HonVietAudio\?\.beginCombat\?\.\(\)/,
    'a new integrated battle must re-enable parent combat voice after a prior stop');
  const closeEnd = index.indexOf('\n  function ', close + 24);
  const closeBlock = index.slice(close, closeEnd > close ? closeEnd : close + 1800);
  assert.match(closeBlock, /window\.HonVietAudio\?\.stopCombat\?\.\(\)/,
    'closing the overlay must stop parent combat voice');
  assert.match(closeBlock, /frame\.contentWindow\?\.HonVietAudio\?\.stopCombat\?\.\(\)/,
    'closing the overlay must also stop an iframe-owned combat voice fallback');
});
