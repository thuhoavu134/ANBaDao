import test from 'node:test';
import assert from 'node:assert/strict';

// Kept dynamic so RED reports the missing gameplay contract explicitly.
let mod = {};
try { mod = await import('../src/domain/combat/splus-mechanics.mjs'); } catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

test('S42-A1: 42 authored S+ heroes expose executable combat contract', () => {
  assert.equal(typeof mod.createSplusCombat, 'function', 'Missing S+ combat resolver');
});

const hero = (name, team=1, slot=0, extra={}) => ({id:`${team}:${name}`,sourceId:`hero_splus_${name}`,team,slot,hp:10000,maxHp:10000,atk:1000,def:0,speed:100,energy:100,crit:0,critDamage:1.5,accuracy:100,statuses:[],...extra});
function setup(names, foes=['dummy']) {
  return mod.createSplusCombat({units:[...names.map((n,i)=>hero(n,1,i)),...foes.map((n,i)=>hero(n,2,i))],rng:()=>0.99});
}
const id = (name,team=1) => `${team}:${name}`;

test('S42-A2: gear adds 5% team defense after ally action and resets per battle', () => {
  const e=setup(['co_trong','dummy']);e.start();
  e.act(id('dummy'),'basic',id('dummy',2));
  assert.equal(e.modifiers(id('dummy')).defense,0.05);
  assert.equal(e.hud(id('dummy'))[0].iconId,'splus.co_trong.passive');
  assert.equal(e.hud(id('dummy'))[0].stacks,1);
});

test('S42-A4: Cường Đồng mitigation and reflection cannot ping-pong',()=>{
  const e=setup(['cuong_dong'],['cuong_dong']);e.start();
  e.damage(id('cuong_dong'),id('cuong_dong',2),{raw:1000});
  assert.equal(e.unit(id('cuong_dong',2)).hp,9250);
  assert.equal(e.events.filter(x=>x.type==='damage').length,2);
});

test('S42-A2: Lạc An accumulates 4 percentage points per arrow up to 40',()=>{
  const e=setup(['lac_an']);e.start();
  for(let i=0;i<12;i++)e.damage(id('lac_an'),id('dummy',2),{raw:1,action:'basic'});
  assert.equal(e.modifiers(id('lac_an')).crit,0.4);
});

test('S42-A4: Hắc Đao passive is 80% anti-heal; Ultimate is 100%',()=>{
  const e=setup(['hac_dao'],['dummy','healer']);e.start();
  e.damage(id('hac_dao'),id('dummy',2),{raw:1,action:'basic'});
  e.unit(id('dummy',2)).hp=5000;
  e.heal(id('healer',2),id('dummy',2),1000);
  assert.equal(e.unit(id('dummy',2)).hp,5000,'200 permitted: 100 heal and 100 converted damage');
  assert.equal(e.events.filter(x=>x.type==='heal').at(-1).amount,100);
  assert.equal(e.events.filter(x=>x.type==='damage').at(-1).amount,100);
  e.act(id('hac_dao'),'ultimate',id('dummy',2));
  assert.equal(e.heal(id('healer',2),id('dummy',2),1000),0);
});

test('S42-A4: cocoon consumes two incoming hits and third reaches HP',()=>{
  const e=setup(['tam_nuong']);e.start();
  for(let i=0;i<2;i++)e.damage(id('dummy',2),id('tam_nuong'),{raw:1000});
  assert.equal(e.unit(id('tam_nuong')).hp,10000);
  e.damage(id('dummy',2),id('tam_nuong'),{raw:1000});
  assert.ok(e.unit(id('tam_nuong')).hp<10000);
});

test('S42-A4: Mục Chiêu rescues once per battle, not per damage recursion',()=>{
  const e=setup(['muc_chieu','dummy']);e.start();
  e.damage(id('dummy',2),id('dummy'),{raw:999999});
  assert.ok(e.unit(id('dummy')).hp>0);
  e.beginRound(3);e.damage(id('dummy',2),id('dummy'),{raw:999999});
  assert.equal(e.unit(id('dummy')).hp,0);
});

test('S42-A4: root, disarm and silence have different action restrictions',()=>{
  const e=setup(['dummy']);e.start();
  e.addStatus(id('dummy',2),id('dummy'),{type:'root',turns:2});
  assert.equal(e.canUse(id('dummy'),'basic'),true);
  assert.equal(e.canMove(id('dummy')),false);
  e.addStatus(id('dummy',2),id('dummy'),{type:'disarm',turns:1});
  assert.equal(e.canUse(id('dummy'),'basic'),false);
  assert.equal(e.canUse(id('dummy'),'ultimate'),true);
  e.addStatus(id('dummy',2),id('dummy'),{type:'silence',turns:1});
  assert.equal(e.canUse(id('dummy'),'ultimate'),false);
});

test('S42-A5: dispelled and expired statuses disappear from HUD with source provenance',()=>{
  const e=setup(['linh_dong']);e.start();
  e.damage(id('linh_dong'),id('dummy',2),{raw:10,action:'basic'});
  const s=e.hud(id('dummy',2)).find(s=>s.iconId==='splus.linh_dong.passive');
  assert.equal(s.sourceId,id('linh_dong'));assert.equal(s.polarity,'debuff');
  e.cleanse(id('dummy',2));
  assert.equal(e.hud(id('dummy',2)).length,0);
  e.addStatus(id('linh_dong'),id('dummy',2),{type:'silence',turns:1});
  e.beginRound(3);assert.equal(e.hud(id('dummy',2)).length,0);
});
