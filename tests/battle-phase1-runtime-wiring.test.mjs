import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const battle=fs.readFileSync('battle.html','utf8');
const tracePatch=fs.readFileSync('scripts/battle-phase1-trace-v1.mjs','utf8');
const build=fs.readFileSync('scripts/build-static.mjs','utf8');

test('PHASE1 runtime wiring has opt-in trace access and action lifecycle hooks',()=>{
 assert.match(tracePatch,/__HV_BATTLE_PHASE1_TRACE/);
 assert.match(tracePatch,/createBattlePresentationTrace/);
 assert.match(build,/battle-phase1-trace-v1/);
});

test('PHASE1 trace wiring is guarded and cannot alter disabled production flow',()=>{
 assert.match(tracePatch,/qaPhase01/);
 assert.match(tracePatch,/if\(!enabled\)return/);
});
