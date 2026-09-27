import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { authoredVisualCueTimes, pairAuthoredAudioToVisual } from '../src/combat-domain/authored-audio-visual-timing.mjs';

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



const iosAudioPatchSource = readFileSync(new URL('../scripts/ios-audio-unlock-patch.mjs', import.meta.url), 'utf8');
function voiceBusFixture() {
  const match = iosAudioPatchSource.match(/const manager = String\.raw\`<script id="honviet-ios-audio-unlock">([\s\S]*?)<\/script>\`;/);
  assert.ok(match, 'shared iOS/WebAudio manager source must be extractable');
  const sources = [], dataset = {};
  class AudioContextFixture {
    constructor() { this.state='running'; this.currentTime=0; this.destination={}; }
    resume() { this.state='running'; return Promise.resolve(); }
    createBuffer() { return { silent:true }; }
    decodeAudioData() { return Promise.resolve({ decoded:true }); }
    createGain() {
      return {
        gain:{ value:1, cancelScheduledValues(){}, setValueAtTime(){}, linearRampToValueAtTime(){} },
        connect(){}, disconnect(){}
      };
    }
    createBufferSource() {
      const source={
        buffer:null, connect(){}, disconnect(){},
        start(){this.started=true;},
        stop(){this.stopped=true;}
      };
      sources.push(source);
      return source;
    }
  }
  const window={AudioContext:AudioContextFixture};
  window.window=window;
  const document={
    visibilityState:'visible',
    documentElement:{dataset},
    addEventListener(){}
  };
  vm.runInNewContext(match[1], {
    window, document,
    fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}),
    Audio:class {},
    console:{warn(){}},
    setTimeout, clearTimeout
  });
  return {bus:window.HonVietAudio,sources,dataset};
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


test('shared combat voice epoch stops active Ultimate voice and re-enables next battle', async () => {
  const f=voiceBusFixture();
  const url='assets/audio/voice-luc-anh-ultimate.mp3';
  assert.equal(await f.bus.playVoice(url,2.75),true);
  const first=f.sources.find(source=>source.buffer?.decoded);
  assert.ok(first?.started,'Ultimate voice must create a decoded WebAudio source');
  assert.equal(f.dataset.voiceCombatActive,'1');

  f.bus.stopCombat();
  assert.equal(first.stopped,true,'combat stop must synchronously stop the active Ultimate voice');
  assert.equal(f.dataset.voiceCombatActive,'0');
  assert.equal(await f.bus.playVoice(url,2.75),false,'stopped combat epoch must reject stale/new combat voice');

  f.bus.beginCombat();
  assert.equal(await f.bus.playVoice(url,2.75),true,'new battle/unmute must re-enable combat voice');
  const decoded=f.sources.filter(source=>source.buffer?.decoded);
  assert.equal(decoded.length,2);
  assert.equal(decoded[1].started,true);
});


test('browser timing gate compares scheduled audio with actual authored draw/contact timestamps', () => {
  const qa = readFileSync(new URL('../scripts/qa-skill-test-browser.mjs', import.meta.url), 'utf8');
  const matcher = readFileSync(new URL('../src/combat-domain/authored-audio-visual-timing.mjs', import.meta.url), 'utf8');
  const evidence = readFileSync(new URL('../skill-test-evidence.js', import.meta.url), 'utf8');
  assert.match(evidence, /frameSequence/, 'draw evidence must preserve repeated frame transitions for multi-hit sheets');
  assert.match(matcher, /visualSignedOffsetMs/, 'timing gate must score audio against actual visual draw time');
  assert.match(qa, /frameIndex:\s*42/, 'Ông Phở Basic must score against sheet contact frame 42');
  assert.match(qa, /frameIndex:\s*36/, 'Ông Phở Skill must score against sheet contact frame 36');
  assert.match(qa, /frameIndex:\s*45/, 'Ông Phở Ultimate must score against sheet contact frame 45');
  assert.match(matcher, /expectedCuePerformanceMs[\s\S]*visualMs/, 'audio-to-visual comparison must use the scheduled audible sample cue, not play\(\) request time');
});


test('pairs Ông Phở chain2 audio with the second actual contact-frame draw', () => {
  const spec={src:'/assets/battle-runtime/embedded-11.png',frameIndex:42};
  const evidence={draws:{
    [spec.src]:{
      frameSequence:[
        {frameIndex:41,firstMs:970},
        {frameIndex:42,firstMs:1000},
        {frameIndex:43,firstMs:1040},
        {frameIndex:41,firstMs:2370},
        {frameIndex:42,firstMs:2400},
        {frameIndex:43,firstMs:2440}
      ]
    }
  }};
  const visualTimes=authoredVisualCueTimes(evidence,spec);
  assert.deepEqual(visualTimes,[1000,2400]);
  const scoped=[
    {actionId:'qa:ong-pho:basic',event:'basic',cue:'contact:sheet-frame-42',expectedCuePerformanceMs:1012},
    {actionId:'qa:ong-pho:basic:chain2',event:'basic',cue:'contact:sheet-frame-42',expectedCuePerformanceMs:2384}
  ];
  const paired=pairAuthoredAudioToVisual(scoped,visualTimes,50,spec);
  assert.equal(paired.bad.length,0);
  assert.deepEqual(paired.cues.map(item=>item.occurrence),[0,1]);
  assert.deepEqual(paired.cues.map(item=>item.visualSignedOffsetMs),[12,-16]);

  const late=pairAuthoredAudioToVisual(
    [{...scoped[1],expectedCuePerformanceMs:2475}],visualTimes,50,spec
  );
  assert.equal(late.bad.length,1,'actual audio cue more than 50ms from contact must fail');
  assert.equal(late.bad[0].visualSignedOffsetMs,75);
});


test('RED: maps visual cue time through AudioContext output timestamp instead of render-currentTime', async () => {
  const f=fixture();
  f.context.getOutputTimestamp=()=>({contextTime:9.98,performanceTime:1000});
  assert.equal(await f.bus.prepare('basic'),true);
  assert.equal(await f.bus.play('basic',{
    group:'combat',
    actionId:'qa:output-clock',
    cue:'release:first-vfx',
    cuePerformanceMs:1500,
    sampleCue:'onset'
  }),true);
  assert.equal(f.starts.length,1);
  const event=f.bus.timingEvents().find(item=>item.actionId==='qa:output-clock');
  const desiredSourceOutputMs=1500-Number(event?.audibleLeadInMs);
  const expectedContextStart=9.98+(desiredSourceOutputMs-1000)/1000;
  assert.ok(Math.abs(f.starts[0]-expectedContextStart)<0.002,'source start must use output-device clock mapping');
  assert.equal(event?.clockMapping,'output-timestamp');
  assert.ok(Math.abs(event?.outputTimestampContextTime-9.98)<0.0001);
  assert.ok(Math.abs(event?.outputTimestampPerformanceMs-1000)<0.01);
  assert.ok(Math.abs(event?.expectedCuePerformanceMs-1500)<0.01);
  assert.ok(Math.abs(event?.signedCueOffsetMs)<0.01);
});

test('RED: output clock reports unavoidable late cue when requested inside device latency window', async () => {
  const f=fixture();
  f.context.getOutputTimestamp=()=>({contextTime:9.98,performanceTime:1000});
  assert.equal(await f.bus.prepare('basic'),true);
  assert.equal(await f.bus.play('basic',{
    group:'combat',
    actionId:'qa:output-too-late',
    cue:'release:first-vfx',
    cuePerformanceMs:1100,
    sampleCue:'onset'
  }),true);
  const event=f.bus.timingEvents().find(item=>item.actionId==='qa:output-too-late');
  // currentTime 10.00 cannot reach output before ~1020 ms. The decoded
  // source onset is measured from the actual buffer envelope, so the unavoidable
  // audible cue is earliest-output + that measured lead-in.
  const expectedCueMs=1020+Number(event?.audibleLeadInMs);
  assert.ok(Math.abs(f.starts[0]-10)<0.0001);
  assert.ok(Math.abs(event?.expectedCuePerformanceMs-expectedCueMs)<0.01);
  assert.ok(Math.abs(event?.signedCueOffsetMs-(expectedCueMs-1100))<0.01);
});


test('RED: translates authored cue timestamps between battle iframe and shared parent SFX clock', async () => {
  const calls=[];
  const parentTiming=[{
    type:'sfx:scheduled',
    actionId:'qa:clock-domain',
    atPerformanceMs:5480,
    cuePerformanceMs:5500,
    expectedCuePerformanceMs:5512,
    sourceScheduledPerformanceMs:5404,
    outputTimestampPerformanceMs:5390
  }];
  const channel={
    play:async(event,options)=>{calls.push({event,options});return true;},
    prepare:async()=>true,
    unlock:async()=>true,
    stopCombat(){},setCombatEnabled(){},dispose(){},
    isBattleActive:()=>true,
    timingEvents:()=>parentTiming.map(item=>({...item}))
  };
  const parent={
    performance:{timeOrigin:100000,now:()=>6000},
    HonVietSfx:{createBattleChannel:()=>channel}
  };
  const window={parent,addEventListener(){}};
  const dataset={};
  vm.runInNewContext(audioSource,{
    window,URL,console:{warn(){}},Date,
    performance:{timeOrigin:105000,now:()=>1000},
    setTimeout,clearTimeout,
    document:{
      baseURI:'https://game.example/',
      documentElement:{dataset},
      addEventListener(){},
      querySelectorAll:()=>[]
    },
    fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})
  });
  assert.equal(await window.HonVietSfx.play('basic',{
    group:'combat',
    actionId:'qa:clock-domain',
    cuePerformanceMs:500,
    audibleAtPerformanceMs:520
  }),true);
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.cuePerformanceMs,5500,'child cue must be converted to parent performance clock');
  assert.equal(calls[0].options.audibleAtPerformanceMs,5520,'child audible target must be converted to parent performance clock');

  const event=window.HonVietSfx.timingEvents().find(item=>item.actionId==='qa:clock-domain');
  assert.equal(event.atPerformanceMs,480);
  assert.equal(event.cuePerformanceMs,500);
  assert.equal(event.expectedCuePerformanceMs,512);
  assert.equal(event.sourceScheduledPerformanceMs,404);
  assert.equal(event.outputTimestampPerformanceMs,390);
});


test('RED: browser QA records Lục Ảnh Ultimate voice lead separately from SFX timing', () => {
  const qa=readFileSync(new URL('../scripts/qa-skill-test-browser.mjs',import.meta.url),'utf8');
  const evidence=readFileSync(new URL('../skill-test-evidence.js',import.meta.url),'utf8');
  assert.match(evidence,/voiceBusOwner/,'evidence must state whether Lục Ảnh voice used parent or iframe audio bus');
  assert.match(evidence,/window\.parent\.HonVietAudio/,'embedded battle evidence must observe the same parent voice bus production uses');
  assert.match(qa,/voiceStartMs/,'browser report must record the observed voice graph/media start');
  assert.match(qa,/voiceLeadMs/,'browser report must measure intentional voice lead against actual Ultimate VFX draw');
  assert.match(qa,/voiceLeadMs\s*>=\s*0/,'Lục Ảnh voice must remain a lead, not be forced after the Ultimate visual release');
});
