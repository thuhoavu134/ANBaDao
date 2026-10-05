import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import{readFileSync}from'node:fs';
const html=readFileSync('dist/battle.html','utf8'),a=html.indexOf('    if (kind === "double" || kind === "multi") {'),b=html.indexOf('    const forceCrit = kind === "execute"',a);assert.ok(a>=0&&b>a);
function run(kind,stop){const actor={hp:100,name:'actor'},target={hp:100,name:'target'},multipliers=[];const ctx=vm.createContext({actor,target,kind,multiplier:1,applyDamage:(a,t,m)=>{multipliers.push(m);if(stop==='actor')a.hp=0;if(stop==='target')t.hp=0;return 10;},addStatus(){},addLog(){}});vm.runInContext('function run(){'+html.slice(a,b)+'}',ctx);ctx.run();return multipliers;}
test('sequential legacy hits stop when reflection kills the actor',()=>{for(const kind of ['double','multi'])assert.equal(run(kind,'actor').length,1,kind);});
test('sequential legacy hits stop after the target dies',()=>{for(const kind of ['double','multi'])assert.equal(run(kind,'target').length,1,kind);});
test('living participants preserve the original hit counts and multipliers',()=>{assert.deepEqual(run('double'),[1,.78]);assert.deepEqual(run('multi'),[.72,.72,.72,.72]);});
