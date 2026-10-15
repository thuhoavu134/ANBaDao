import test from 'node:test';import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {getSplusHero} from '../src/domain/hero/splus-catalog.mjs';
import {SPLUS_EXTRA_HEROES,resolveSplusExtraId} from '../src/domain/hero/splus-extras.mjs';
import {readFileSync} from 'node:fs';
const meta=JSON.parse(readFileSync(new URL('../assets/characters/tich-dao/runtime-meta.json',import.meta.url),'utf8'));
const actor={id:'shadow',sourceId:'hero_splus_tich_dao',team:'player',slot:0,hp:10000,maxHp:10000,atk:100,energy:100,accuracy:100,crit:0};
const enemy=(i,hp=9000)=>({id:'e'+i,team:'enemy',slot:i,hp,maxHp:10000,atk:10,energy:0});
const units=(...overrides)=>{const list=[actor,...Array.from({length:6},(_,i)=>enemy(i))];for(const [id,hp] of overrides){const u=list.find(u=>u.id===id);if(u)u.hp=hp;else list.push({id,team:'enemy',slot:Number(id.slice(1)),hp,maxHp:10000,atk:10,energy:0});}return list;};
const setup=(proc=0,heroUnits)=>createSplusCombat({units:heroUnits||units(),rng:site=>site.startsWith('splus.tich-dao')?proc:.5});

test('Tích Đạo registry: authored extra, assassin kit, no Skill 1',()=>{
 const hero=getSplusHero('tich_dao');
 assert.equal(hero?.name,'Tích Đạo');
 assert.equal(hero?.fullName,'Ảnh Nhận Khách — Tích Đạo');
 assert.equal(hero?.rarity,'S+');assert.equal(hero?.role,'duelist');assert.equal(hero?.element,'soul');
 assert.ok(SPLUS_EXTRA_HEROES.some(h=>h.id==='hero_splus_tich_dao'));
 assert.equal(resolveSplusExtraId('tich-dao'),'hero_splus_tich_dao');
 assert.equal(resolveSplusExtraId('hero_splus_tich_dao'),'hero_splus_tich_dao');
 const e=setup();
 assert.equal(e.canUse('shadow','skill'),false,'duelist ships Basic+Ultimate only');
 assert.equal(e.canUse('shadow','basic'),true);
 assert.equal(e.unit('shadow').energy>=60,true);
 assert.equal(hero.actions.ultimate.cost,60);
});

test('Basic Ảnh Trảm assassin targeting: weakest back-line, else weakest front',()=>{
 // e4 is the weakest back-line unit; default opposite targeting would pick e0.
 const e=setup(0,units(['e4',2000],['e0',1500]));
 assert.deepEqual(e.targets('shadow','basic').map(u=>u.id),['e4']);
 // With the whole back row dead the assassin falls back to the weakest front unit.
 const e2=setup(0,[actor,enemy(0,1500),enemy(1,9000),enemy(2,9000),enemy(3,0),enemy(4,0),enemy(5,0)]);
 assert.equal(e2.targets('shadow','basic')[0].id,'e0');
});

test('Ultimate legal targets cover every visible enemy and skip stealthed foes',()=>{
 const e=setup();
 assert.equal(e.targets('shadow','ultimate').length,6);
 e.addStatus('shadow','e3',{type:'stealth',turns:2});
 assert.equal(e.targets('shadow','ultimate').some(u=>u.id==='e3'),false);
});

test('Ultimate resolves three deferred strikes at 0.7/0.9/1.0 ATK with assassin retargeting',()=>{
 // proc .5 keeps the third-strike 35% crit roll from firing so amounts stay pure.
 const e=setup(.5,units(['e4',2000],['e0',1500]));
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 assert.equal(r.ok,true);
 assert.equal(e.unit('shadow').energy,40,'rage debited once at cast');
 assert.equal(e.unit('e4').hp,2000,'no damage before visual markers');
 for(let strike=0;strike<3;strike++){
  const step=e.resolveTichDaoImpact('shadow',r.castId,strike);
  assert.equal(step.ok,true,'strike '+strike+' resolves once');
  assert.equal(e.resolveTichDaoImpact('shadow',r.castId,strike).ok,false,'duplicate token rejected');
 }
 assert.equal(e.unit('shadow').energy,40,'impacts never debit rage again');
 const amounts=[];
 // strike 0 hit e4 (weakest back), strike 1 hit e0 (lowest HP excluding e4), strike 2 hit e0 again (lowest living)
 assert.equal(e.unit('e4').hp,2000-Math.round(100*0.7*1.22));
 assert.equal(e.unit('e0').hp,1500-Math.round(100*0.9*1.22)-Math.round(100*1.22));
 for(const other of ['e1','e2','e3','e5'])assert.equal(e.unit(other).hp,9000);
 assert.equal(e.finishTichDaoCast('shadow',r.castId),true);
 assert.equal(e.finishTichDaoCast('shadow',r.castId),false,'finish is single-use');
});

test('Ultimate grants stealth for one recipient turn after at least one kill',()=>{
 const e=setup(0,units(['e4',80]));
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e.resolveTichDaoImpact('shadow',r.castId,strike);
 assert.equal(e.unit('e4').hp,0);
 assert.equal(e.hasStatus('shadow','stealth'),true,'kill during ultimate grants stealth');
 e.consumeTurnStatuses('shadow');
 assert.equal(e.hasStatus('shadow','stealth'),false);
 // no-kill cast stays visible
 const e2=setup(0,units(['e4',5000]));
 const r2=e2.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e2.resolveTichDaoImpact('shadow',r2.castId,strike);
 assert.equal(e2.hasStatus('shadow','stealth'),false);
});

test('Passive Ảnh Bộ: first drop below 40% HP vanishes once per battle',()=>{
 const e=setup();
 assert.equal(e.hasStatus('shadow','stealth'),false);
 e.damage('e0','shadow',{raw:7000,forceHit:true});
 assert.equal(e.unit('shadow').hp,3000);
 assert.equal(e.hasStatus('shadow','stealth'),true,'first threshold crossing vanishes');
 e.consumeTurnStatuses('shadow');
 e.damage('e0','shadow',{raw:1000,forceHit:true});
 assert.equal(e.hasStatus('shadow','stealth'),false,'second crossing does not re-trigger');
 const e2=setup();
 e2.damage('e0','shadow',{raw:5500,forceHit:true});
 assert.equal(e2.hasStatus('shadow','stealth'),false,'staying above 40% never vanishes');
});

test('Pack contract: nine ultimate phases cover 0-95, hidden gaps carry no atlas cells',()=>{
 const phases=meta.ultimateTimeline.phases;
 assert.equal(phases.length,9);
 let cursor=0;
 for(const p of phases){assert.equal(p.sourceFrames[0],cursor);cursor=p.sourceFrames[1]+1;}
 assert.equal(cursor,96);
 const hidden=phases.filter(p=>!p.visible);
 assert.deepEqual(hidden.map(p=>p.id),['phase-03-vanish-gap-1','phase-05-vanish-gap-2']);
 for(const p of hidden)assert.deepEqual(p.cells,[],'invisible phases must not reference atlas cells');
 for(const p of phases.filter(p=>p.visible))assert.ok(p.cells.length>0,'visible phases need cells');
 assert.deepEqual(meta.clips.ultimate.strikeMs,[1083,1750,2917]);
 assert.equal(meta.clips.ultimate.durationMs,4000);
 assert.ok(meta.clips.ultimate.strikeMs.every((ms,i)=>{const p=phases.find(p=>Math.round(p.startMs)===ms);return p&&['phase-04-reappear-strike-1','phase-06-reappear-combo','phase-08-final-strike'].includes(p.id);}));
});

test('Pack budgets: 77-frame idle on nine-frame pages inside mobile decode caps',()=>{
 assert.equal(meta.idle.frames,77);
 assert.equal(meta.idleVisual.pageFrames,9);
 assert.equal(meta.idleVisual.pages,9);
 for(const [key,c] of Object.entries(meta.clips)){
  assert.equal(c.frames,c.frameDurationsMs.length,key);
  const decoded=c.cols*c.cellW*Math.ceil(c.frames/c.cols)*c.cellH*4;
  if(key.startsWith('idle-authored-'))assert.ok(decoded<14*1024*1024,key+' '+decoded);
  else assert.ok(decoded<16*1024*1024,key+' '+decoded);
 }
});
