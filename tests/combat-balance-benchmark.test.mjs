import test from 'node:test';import assert from 'node:assert/strict';
import {simulateMatch,BENCHMARK_TEAMS} from '../scripts/combat-balance-benchmark.mjs';
test('same seed reproduces outcome without leaking unit state between matches',()=>{
 const config={player:'balanced',enemy:'offense',level:5,seed:19};const first=simulateMatch(config);simulateMatch({player:'sustain',enemy:'balanced',seed:20});assert.deepEqual(simulateMatch(config),first);
});
test('all team pairs terminate within the production 15-round challenge rule',()=>{
 for(const player of Object.keys(BENCHMARK_TEAMS))for(const enemy of Object.keys(BENCHMARK_TEAMS)){const r=simulateMatch({player,enemy,seed:7});assert.ok(['player','enemy'].includes(r.winner));assert.ok(r.round>=1&&r.round<=15);assert.ok(r.actions>0);}
});
test('invalid scenario and progression are rejected',()=>{
 for(const input of [{player:'unknown'},{enemy:'unknown'},{level:0},{level:31},{enemyScale:0},{enemyScale:NaN}])assert.throws(()=>simulateMatch(input));
});
