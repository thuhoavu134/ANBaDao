import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const build=fs.readFileSync('scripts/build-static.mjs','utf8');
test('Phase 1 build injects opt-in battle trace without enabling it by default',()=>{
 assert.match(build,/battle-phase1-trace-v1/);
 const patch=fs.readFileSync('scripts/battle-phase1-trace-v1.mjs','utf8');
 assert.match(patch,/new URLSearchParams\(location\.search\)\.has\('qaPhase01'\)/);
 assert.match(patch,/__HV_BATTLE_PHASE1_TRACE/);
});
