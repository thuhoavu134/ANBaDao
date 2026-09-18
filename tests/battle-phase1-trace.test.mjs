import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattlePresentationTrace } from '../src/domain/combat/battle-presentation-trace.mjs';

test('PHASE1 trace records action lifecycle with stable actionId and snapshots', () => {
  const trace=createBattlePresentationTrace({enabled:true,maxEvents:20});
  const action=trace.begin({actionId:'b:r1:a1',roundId:'r1',actorId:'bach_dien',targetIds:['enemy-1'],skillId:'basic',position:{x:120,y:300}});
  assert.equal(action.ok,true);
  trace.marker('release',{actionId:'b:r1:a1',position:{x:140,y:300}});
  trace.marker('impact',{actionId:'b:r1:a1',targetId:'enemy-1',position:{x:200,y:300}});
  trace.marker('impact',{actionId:'b:r1:a1',targetId:'enemy-1'});
  trace.complete({actionId:'b:r1:a1',position:{x:120,y:300}});
  const events=trace.events();
  assert.deepEqual(events.map(e=>e.type),['action:start','marker:release','marker:impact','action:complete']);
  assert.equal(events.find(e=>e.type==='marker:impact').duplicateCount,1);
});

test('PHASE1 trace rejects duplicate action start and duplicate completion', () => {
  const trace=createBattlePresentationTrace({enabled:true,maxEvents:20});
  assert.equal(trace.begin({actionId:'a',actorId:'x',targetIds:[]}).ok,true);
  assert.equal(trace.begin({actionId:'a',actorId:'x',targetIds:[]}).code,'ACTION_DUPLICATE');
  assert.equal(trace.complete({actionId:'a'}).ok,true);
  assert.equal(trace.complete({actionId:'a'}).code,'COMPLETION_DUPLICATE');
});

test('PHASE1 trace is inert when QA flag is disabled', () => {
  const trace=createBattlePresentationTrace({enabled:false});
  assert.equal(trace.begin({actionId:'a'}).ok,false);
  assert.deepEqual(trace.events(),[]);
});
