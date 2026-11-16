import test from 'node:test';
import assert from 'node:assert/strict';
import { SPLUS_HEROES, validateSplusCatalog } from '../src/domain/hero/splus-catalog.mjs';
import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';

function fixture(key, rng=()=>0.99) {
  const units=[];
  for(const team of [1,2])for(let slot=0;slot<6;slot++)units.push({id:`${team}:${slot}`,sourceId:team===1&&slot===0?`hero_splus_${key}`:'dummy',team,slot,maxHp:100000,hp:50000,atk:1000+slot*100,def:100,speed:100,energy:team===1&&slot===0?100:40,crit:0,critDamage:1.5,accuracy:100,statuses:[]});
  const e=createSplusCombat({units,rng});e.start();return e;
}
const status=(e,type,team)=>e.units.filter(u=>u.team===team).flatMap(u=>u.statuses.filter(s=>s.type===type).map(s=>({u,s})));
const damage=e=>e.events.filter(x=>x.type==='damage'&&!x.secondary);

test('42 unique identities, seven per element, no replacement art',()=>{
  assert.deepEqual(validateSplusCatalog().errors,[]);
  assert.equal(new Set(SPLUS_HEROES.map(h=>h.iconId)).size,42);
  for(const h of SPLUS_HEROES){
    if(h.key==='linh_dong'){
      assert.equal(h.art.status,'authored-rgba-v1');
      assert.equal(h.art.portrait,'assets/characters/linh-dong/avatar.webp');
      continue;
    }
    if(h.key==='co_nuong'){
      assert.equal(h.art.status,'authored-rgba-v1');
      assert.equal(h.art.portrait,'assets/characters/co-nuong/avatar.webp');
      continue;
    }
    assert.equal(h.art.status,'awaiting-authored-assets');
    assert.equal(h.art.portrait,null);
  }
});

// Each row asserts an observable authored effect, not merely successful dispatch.
// Cổ Nương authored harp skill resolves 12 strokes across the 3 visible front-line foes.
const skills={co_trong:['shield',2,1],cuong_dong:['stun',1,2],lac_an:['damage',1],hac_pha:['armorDown',3,2],thiet_lanh:['disarm',1,2],minh_toa:['shieldBan',1,2],thiem_ngan:['heal',2,1],linh_dong:['confusion',1,2],tieu_hon:['rageBan',1,2],thach_kinh:['attackDown',3,2],han_nuong:['damage',2],vong_co:['silence',1,2],co_nuong:['damage',36],muc_chieu:['heal',3,1],thuy_co:['heal',1,1],ha_lang:['displacement',1,2],giang_quan:['airborne',1,2],thuy_ngoc:['shield',1,1],hai_phong:['stun',1,2],tram_chau:['bubble',1,1],da_xoa:['rageSlow',1,2],nung:['stun',1,2],hoa_tieu:['blind',1,2],hoa_khieu:['attackUp',2,1],cuu_tinh:['shieldBan',1,2],hoa_bai:['blind',3,2],hac_dao:['shieldBan',1,2],hoa_duc:['attackUp',2,1],mien_nuong:['statusRemove',2,1],tram_tue:['sleep',1,2],hac_hoa:['disarm',1,2],tam_nuong:['entangle',2,2],son_cuong:['bleed',2,2],tue_y:['regen',3,1],mang_xa:['armorDown',3,2],khaos:['inkMark',1,2],kinh_nuong:['blind',1,2],hoi_anh:['forcedBasic',1,2],van_phap:['attackUp',2,1],cuu_trieu:['damage',4],thach_mong:['taunted',3,2],to_linh:['speedDown',3,2]};
const ultimates={co_trong:['reflectPhysical',6,1],cuong_dong:['taunted',6,2],lac_an:['damage',7],hac_pha:['damage',3],thiet_lanh:['stun',3,2],minh_toa:['hardSilence',1,2],thiem_ngan:['deathWard',6,1],linh_dong:['silence',6,2],tieu_hon:['damage',1],thach_kinh:['magicResist',6,1],han_nuong:['armorDown',6,2],vong_co:['damageDown',6,2],co_nuong:['heal',5,1],muc_chieu:['healthEqualize',5,1],thuy_co:['speedUp',6,1],ha_lang:['attackDown',6,2],giang_quan:['root',3,2],thuy_ngoc:['heal',3,1],hai_phong:['armorDown',6,2],tram_chau:['critDown',6,2],da_xoa:['damage',1],nung:['armorUp',1,1],hoa_tieu:['damage',18],hoa_khieu:['assist',2,2],cuu_tinh:['damage',6],hoa_bai:['stun',6,2],hac_dao:['antiHeal',3,2],hoa_duc:['critUp',6,1],mien_nuong:['resistUp',6,1],tram_tue:['attackDown',6,2],hac_hoa:['antiHeal',3,2],tam_nuong:['paralysis',3,2],son_cuong:['damage',2],tue_y:['heal',6,1],mang_xa:['blind',6,2],khaos:['damage',12],kinh_nuong:['reflectSkills',6,1],hoi_anh:['stun',2,2],van_phap:['airborne',6,2],cuu_trieu:['damage',54],thach_mong:['shield',6,1],to_linh:['timeFreeze',6,2]};
for(const h of SPLUS_HEROES)for(const action of ['skill','ultimate'])test(`${h.name}: ${action} resolves authored target/effect`,()=>{
  const key=h.id.replace('hero_splus_',''),e=fixture(key);
  if(key==='mien_nuong')for(const u of e.units.filter(u=>u.team===1&&u.slot<3))e.addStatus('2:0',u,{type:'blind',power:0.3});
  if(key==='van_phap')for(const u of e.units.filter(u=>u.team===2))e.addStatus(u,u,{type:'attackUp',power:0.2});
  if(key==='hoa_bai')for(const u of e.units.filter(u=>u.team===2))e.addStatus('1:0',u,{type:'burn',percentMaxHp:0.03});
  const [type,count,team]=(action==='skill'?skills:ultimates)[key];
  // Basic + Ultimate kits (hero.json authored heroes) expose the Basic through the skill row.
  const performed=key==='khaos'&&action==='skill'?(assert.equal(e.canUse('1:0','skill'),false),'basic'):action;
  e.events.length=0;assert.equal(e.act('1:0',performed).ok,true);
  const actual=type==='damage'?damage(e):['shield','heal','airborne','displacement','statusRemove','healthEqualize','assist','swap','forcedBasic'].includes(type)?e.events.filter(x=>x.type===type&&(team==null||e.unit(x.targetId)?.team===team)):status(e,type,team);
  if(key==='co_nuong'&&action==='skill')console.log('CO_NUONG_SKILL_EVENTS',JSON.stringify(actual.map(x=>({targetId:x.targetId,amount:x.amount,sourceId:x.sourceId,secondary:x.secondary,action:x.action}))));
  assert.equal(actual.length,count,`${type}: expected ${count}`);
  for(const u of e.units){assert.ok(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp);assert.ok(u.energy>=0&&u.energy<=100);}
  assert.equal(new Set(e.units.map(u=>`${u.team}:${u.slot}`)).size,12);
});

test('Cửu Triều prevents her own fatal hit once; silence disables it',()=>{
  const e=fixture('cuu_trieu');e.damage('2:0','1:0',{raw:999999});assert.ok(e.unit('1:0').hp>0);
  e.beginRound(2);e.damage('2:0','1:0',{raw:999999});assert.equal(e.unit('1:0').hp,0);
  const f=fixture('cuu_trieu');f.addStatus('2:0','1:0',{type:'silence'});f.damage('2:0','1:0',{raw:999999});assert.equal(f.unit('1:0').hp,0);
});
test('Tằm Nương armor persists after both cocoon hit charges',()=>{
  const e=fixture('tam_nuong');e.damage('2:0','1:0',{raw:100});e.damage('2:0','1:0',{raw:100});assert.equal(e.modifiers('1:0').defense,0.3);
});
test('Hỏa Tiêu splash still hits adjacent enemies when primary dies',()=>{
  const e=fixture('hoa_tieu');e.unit('2:0').hp=1;e.damage('1:0','2:0',{raw:1000,action:'basic'});assert.ok(e.unit('2:1').hp<50000);
});
test('Vân Pháp reflects only one control, with no reflection loop',()=>{
  const e=fixture('van_phap',()=>0);e.act('1:1','basic');e.addStatus('2:0','1:1',{type:'stun',turns:1});assert.equal(e.canUse('2:0','basic'),false);assert.equal(e.canUse('1:1','basic'),true);
  e.addStatus('2:0','1:1',{type:'stun',turns:1});assert.equal(e.canUse('1:1','basic'),false);assert.equal(e.events.filter(x=>x.type==='controlReflect').length,1);
});
test('Vọng Cơ extends only skill cooldown, and expiration is round based',()=>{
  const e=fixture('vong_co');e.unit('2:5').energy=100;e.act('2:5','skill');e.beginRound(3);assert.equal(e.canUse('2:5','skill'),false);e.beginRound(4);assert.equal(e.canUse('2:5','skill'),true);
});
test('Tuệ Y revive costs once per battle and restores 50 HP percent / 50 rage',()=>{
  const e=fixture('tue_y');e.damage('2:0','1:1',{raw:999999});e.act('1:0','ultimate');assert.equal(e.unit('1:1').hp,50000);assert.equal(e.unit('1:1').energy,50);
  e.damage('2:0','1:1',{raw:999999});e.unit('1:0').energy=100;e.act('1:0','ultimate');assert.equal(e.unit('1:1').hp,0);
});
test('Mãng Xà uses three distinct seeded targets; replay is identical',()=>{
  const a=fixture('mang_xa',()=>0.37),b=fixture('mang_xa',()=>0.37);a.act('1:0','skill');b.act('1:0','skill');assert.deepEqual(a.events,b.events);assert.equal(new Set(damage(a).map(x=>x.targetId)).size,3);
});
test('Dạ Xoa execution respects individual shield; kill grants stealth',()=>{
  const e=fixture('da_xoa');e.unit('1:0').atk=10000;e.unit('2:5').hp=100;e.unit('2:5').shield=999999;e.act('1:0','ultimate');assert.equal(e.unit('2:5').hp,100);assert.ok(e.unit('2:5').shield<999999);e.unit('2:5').shield=0;e.unit('1:0').energy=100;e.act('1:0','ultimate');assert.equal(e.unit('2:5').hp,0);assert.equal(e.hud('1:0').some(s=>s.type==='stealth'),true);
});
test('Zero damage does not consume cocoon or attach attack marks',()=>{
  const e=fixture('tam_nuong');e.damage('2:0','1:0',{raw:0});assert.equal(e.hud('1:0').find(s=>s.type==='cocoon').charges,2);
});
test('Taunt redirects forced single-target ultimate to the taunter',()=>{
  const e=fixture('lac_an');e.addStatus('2:0','1:0',{type:'taunted'});e.act('1:0','ultimate');assert.deepEqual([...new Set(damage(e).map(x=>x.targetId))],['2:0']);
});
for(const [key,effect,power] of [['linh_dong','healDown',0.2],['han_nuong','speedDown',0.15],['hoa_bai','brimstone',0.04],['hac_dao','wound',0.05],['hac_hoa','thornsDot',0.04],['cuu_tinh','bloodDebt',0.04],['son_cuong','resinBleed',0.06],['mang_xa','viperPoison',0.05],['to_linh','ink',0.2]])test(`${key} passive records authored mark value and provenance`,()=>{
  const e=fixture(key);e.damage('1:0','2:0',{raw:100,action:'basic'});const s=e.unit('2:0').statuses.find(s=>s.type===effect);assert.equal(s.power,power);assert.equal(s.sourceHeroId,`hero_splus_${key}`);assert.equal(s.iconId,`splus.${key}.passive`);
});
for(const [key,effect,power] of [['thiet_lanh','coldSteel',0.06],['nung','burn',0.03],['tram_tue','attackDown',0.15]])test(`${key} retaliatory passive attaches to attacker`,()=>{
  const e=fixture(key);e.damage('2:0','1:0',{raw:100,melee:true});assert.equal(e.unit('2:0').statuses.find(s=>s.type===effect).power,power);
});
test('Tiêu Hồn cannot siphon more rage than the target owns',()=>{
  const e=fixture('tieu_hon');e.unit('1:0').energy=20;e.unit('2:0').energy=3;e.damage('1:0','2:0',{raw:100,action:'basic'});assert.equal(e.unit('1:0').energy,23);assert.equal(e.unit('2:0').energy,0);
});
test('Hạc Phá berserk and Hải Phong heavy-hit cap use HP thresholds',()=>{
  const e=fixture('hac_pha');e.unit('1:0').hp=49999;assert.equal(e.modifiers('1:0').speed,0.35);assert.equal(e.modifiers('1:0').lifesteal,0.25);
  const f=fixture('hai_phong');f.damage('2:0','1:0',{raw:60000,critical:true});assert.equal(f.unit('1:0').hp,30000);assert.equal(f.modifiers('1:0').attack,0.25);
});
test('Thạch Kinh consumes five resentment stacks to heal 15% missing HP',()=>{
  const e=fixture('thach_kinh');e.unit('1:0').hp=100000;for(let i=0;i<5;i++)e.damage('2:0','1:0',{raw:10000});assert.equal(e.unit('1:0').hp,57500);assert.equal(e.unit('1:0').splus.memory.resentment,0);
});
test('Thiềm Ngân overheal becomes shield and respects shield ban',()=>{
  const e=fixture('thiem_ngan');e.unit('1:1').hp=99000;e.heal('1:0','1:1',3000);assert.equal(e.unit('1:1').shield,2000);e.addStatus('2:0','1:1',{type:'shieldBan'});e.heal('1:0','1:1',3000);assert.equal(e.unit('1:1').shield,2000);
});
test('Thủy Cơ buffs only other same-row slots after her action',()=>{
  const e=fixture('thuy_co');e.act('1:0','basic');assert.deepEqual(status(e,'speedUp',1).map(x=>x.u.slot),[1,2]);
});
test('Thủy Ngọc skill supplies 15 rage to strongest ally and explosive shield',()=>{
  const e=fixture('thuy_ngoc');e.act('1:0','skill');assert.equal(e.unit('1:5').energy,55);const before=e.unit('2:0').hp;e.damage('2:0','1:5',{raw:21000});assert.ok(e.unit('2:0').hp<before);assert.equal(e.hud('1:5').some(s=>s.type==='waterShield'),false);
});
test('Cổ Nương halves reflection and parasite drains capped damage once per round',()=>{
  const e=fixture('co_nuong');
  e.damage('2:0','1:0',{raw:1000,reflection:true});
  assert.equal(e.unit('1:0').hp,49500,'passive halves incoming reflection; it does not heal from reflection');
  assert.equal(e.events.filter(x=>x.type==='reflectionMitigated').at(-1).amount,500);
  e.damage('1:0','2:5',{raw:100});
  const parasite=e.unit('2:5').statuses.find(s=>s.type==='parasite'&&s.sourceId==='1:0');
  assert.equal(parasite.rawPerTick,500,'2% max HP is capped at 50% caster ATK');
  e.finishRound();
  assert.equal(e.unit('2:5').hp,49400);assert.equal(e.unit('1:0').hp,49750,'heals half of actual parasite damage');
  e.beginRound(2);e.beginRound(3);
  assert.equal(e.unit('2:5').hp,48900);assert.equal(e.unit('1:0').hp,50000);
});
test('Giang Quân mitigation is melee only; Trầm Châu protects two back allies',()=>{
  const e=fixture('giang_quan');e.damage('2:0','1:0',{raw:1000,melee:true});assert.equal(e.unit('1:0').hp,49200);e.damage('2:0','1:0',{raw:1000,melee:false});assert.equal(e.unit('1:0').hp,48200);
  const f=fixture('tram_chau');f.damage('2:0','1:3',{raw:1000,critical:true});assert.equal(f.unit('1:3').hp,49500);f.damage('2:0','1:5',{raw:1000,critical:true});assert.equal(f.unit('1:5').hp,49000);
});
test('Miên Nương HoT and Hỏa Dực burn conversion heal weakest ally',()=>{
  const e=fixture('mien_nuong');e.unit('1:2').hp=20000;e.beginTurn('1:1');assert.equal(e.unit('1:2').hp,25000);
  const f=fixture('hoa_duc');f.unit('1:2').hp=20000;f.addStatus('1:0','2:0',{type:'burn',percentMaxHp:0.03,turns:2});f.finishRound();assert.equal(f.unit('1:2').hp,21500);
});
test('Thạch Huyễn intercepts 30%, then reduces shared damage by 35%',()=>{
  const e=fixture('thach_mong');e.damage('2:0','1:1',{raw:1000});assert.equal(e.unit('1:1').hp,49300);assert.equal(e.unit('1:0').hp,49805);assert.equal(e.unit('1:0').splus.memory.intercepted,300);
});
test('Khaos Mặc Tích: 3 basics stun once, consume the marks and never keep a clone pool',()=>{
  const e=fixture('khaos');e.damage('2:0','1:0',{raw:1000});assert.equal(e.unit('1:0').hp,49000);assert.equal(e.unit('1:0').splus.memory.cloneHp,undefined);
  const ink=()=>e.unit('2:0').statuses.find(s=>s.type==='inkMark')?.stacks||0;
  e.act('1:0','basic','2:0');assert.equal(ink(),1);assert.ok(e.modifiers('2:0').speed<=-0.15+1e-9);assert.ok(e.modifiers('2:0').defense<=-0.10+1e-9);
  e.act('1:0','basic','2:0');assert.equal(ink(),2);
  e.act('1:0','basic','2:0');assert.equal(ink(),0);
  assert.equal(e.events.filter(x=>x.type==='inkBind').length,1);
  assert.ok(e.unit('2:0').statuses.some(s=>s.type==='stun'));
  assert.equal(e.unit('2:0').statuses.filter(s=>['speedDown','armorDown'].includes(s.type)&&s.sourceId==='1:0').length,0);
});
test('Khaos ultimate: deferred hits resolve once each; final wave detonates marks and lowers magic defence',()=>{
  const e=fixture('khaos');e.unit('1:0').energy=100;
  e.act('1:0','basic','2:0');assert.equal(e.unit('2:0').statuses.find(s=>s.type==='inkMark')?.stacks,1);
  e.unit('1:0').energy=100;
  const cast=e.act('1:0','ultimate',null,{deferAuthored:true});assert.equal(cast.ok,true);assert.equal(cast.targetIds.length,6);
  const hp=e.unit('2:3').hp;
  assert.equal(e.resolveAuthoredImpact('1:0',cast.castId,'2:3',0).ok,true);
  assert.equal(e.resolveAuthoredImpact('1:0',cast.castId,'2:3',0).ok,false);
  assert.ok(e.unit('2:3').hp<hp);
  for(const id of cast.targetIds)for(const hit of [0,1])e.resolveAuthoredImpact('1:0',cast.castId,id,hit);
  assert.equal(e.resolveAuthoredImpact('1:0',cast.castId,'2:0',2).ok,false);
  assert.ok(e.events.some(x=>x.type==='inkDetonate'&&x.targetId==='2:0'));
  for(const id of cast.targetIds)assert.ok(e.unit(id).statuses.some(s=>s.type==='magicArmorDown'));
  assert.equal(e.finishAuthoredCast('1:0',cast.castId),true);assert.equal(e.finishAuthoredCast('1:0',cast.castId),false);
});
test('Hồi Ảnh swaps rows after two rounds without duplicate slots',()=>{
  const e=fixture('hoi_anh',()=>0.3);e.finishRound();assert.equal(e.events.filter(x=>x.type==='swap').length,0);e.beginRound(2);e.finishRound();assert.equal(e.events.filter(x=>x.type==='swap').length,1);assert.equal(new Set(e.units.map(u=>`${u.team}:${u.slot}`)).size,12);
});
test('Mục Chiêu equalization cannot bypass absolute anti-heal',()=>{
  const e=fixture('muc_chieu');e.unit('1:1').hp=1000;e.addStatus('2:0','1:1',{type:'antiHeal',power:1});e.act('1:0','ultimate');assert.equal(e.unit('1:1').hp,1000);
});

