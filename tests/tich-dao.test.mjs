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
const marks=(e,id)=>e.unit(id)?.splus?.memory?.hoaAn||0;
test('regression: visual strike preview matches damage after earlier targets die',()=>{
 const e=setup();e.unit('e5').hp=1;
 const cast=e.act('shadow','ultimate',null,{deferTichDao:true});
 for(let strike=0;strike<3;strike++){
  const preview=e.tichDaoStrikeTarget('shadow',cast.castId,strike)?.id;
  const result=e.resolveTichDaoImpact('shadow',cast.castId,strike);
  assert.equal(preview,result.events.find(x=>x.type==='shadowStrike')?.targetId);
 }
});
test('regression: opening destination is read-only and respects targeting restrictions',()=>{
 const e=setup(),before=JSON.stringify(e.units);
 assert.equal(e.tichDaoOpeningTarget('shadow','ultimate')?.id,'e5');
 assert.equal(e.tichDaoOpeningTarget('shadow','basic')?.id,'e5');
 assert.equal(JSON.stringify(e.units),before,'preview must not spend rage or deal damage');
 e.addStatus('e1','shadow',{type:'taunted',turns:2});
 assert.equal(e.tichDaoOpeningTarget('shadow','ultimate')?.id,'e1');
});

test('Tịch Dao registry: locked kit — Basic Ảnh Bộ + Ultimate Tam Ảnh Đoạt Mệnh + passive Hoa Ấn',()=>{
 const hero=getSplusHero('tich_dao');
 assert.equal(hero?.name,'Tịch Dao');
 assert.equal(hero?.fullName,'Ảnh Sát Song Kiếm — Tịch Dao');
 assert.equal(hero?.rarity,'S+');assert.equal(hero?.role,'duelist');assert.equal(hero?.element,'soul');
 assert.ok(SPLUS_EXTRA_HEROES.some(h=>h.id==='hero_splus_tich_dao'));
 assert.equal(resolveSplusExtraId('tich-dao'),'hero_splus_tich_dao');
 assert.equal(resolveSplusExtraId('hero_splus_tich_dao'),'hero_splus_tich_dao');
 // Hợp đồng kit S+: Basic + Ultimate + passive. Slot `skill` chỉ là alias hiển thị
 // (pattern Kỷ Vân/Tiêu Phong) — combat chặn, không tiêu khí riêng.
 assert.equal(hero.actions.skill?.name,'Ảnh Bộ','skill slot là alias hiển thị của Basic');
 assert.equal(hero.actions.skill?.cost,0,'alias không tiêu khí — Ảnh Bộ là đòn Basic miễn phí');
 assert.equal(hero.actions.basic?.name,'Ảnh Bộ');
 assert.equal(hero.actions.basic?.cost,0,'Ảnh Bộ là đòn Basic miễn phí');
 assert.equal(hero.actions.ultimate?.name,'Tam Ảnh Đoạt Mệnh');
 assert.equal(hero.actions.ultimate?.cost,60);
 assert.equal(hero.passive?.name,'Hoa Ấn');
 const r=hero.actions.ultimate?.rules||{};
 assert.equal(r.markMultiplier,.35,'+35% sát thương mỗi dấu');
 assert.equal(r.executeHp,.30,'ngưỡng kết liễu 30%');
 assert.equal(r.executeMax,2,'tối đa 2 mục tiêu kết liễu');
 assert.equal(r.maxMarks,3,'Hoa Ấn tối đa 3 dấu');
 const e=setup();
 assert.equal(e.canUse('shadow','skill'),false,'duelist ships Basic+Ultimate only');
 assert.equal(e.canUse('shadow','basic'),true);
});

test('Ảnh Bộ Basic chém hàng sau XA NHẤT (fallback: hàng trước xa nhất khi hàng sau chết)',()=>{
 // Actor ở slot 0 (cột 0): hàng sau của địch là e3/e4/e5 (cột 0/1/2) → xa nhất là e5 (cột 2).
 const e=setup(0,units(['e5',2000],['e3',1500]));
 assert.deepEqual(e.targets('shadow','basic').map(u=>u.id),['e5'],'xa nhất = cột cách xa nhất, không phải yếu máu');
 // Hàng sau chết hết → chém tướng còn sống ở hàng trước xa nhất (e2, cột 2).
 const e2=setup(0,[actor,enemy(0,1500),enemy(1,9000),enemy(2,9000),enemy(3,0),enemy(4,0),enemy(5,0)]);
 assert.equal(e2.targets('shadow','basic')[0].id,'e2');
});

test('Ảnh Bộ đặt 1 dấu Hoa Ấn, tối đa 3 dấu',()=>{
 const e=setup(0);
 e.act('shadow','basic','e5');
 assert.equal(marks(e,'e5'),1,'một nhát chém = một dấu');
 e.act('shadow','basic','e5');
 e.act('shadow','basic','e5');
 assert.equal(marks(e,'e5'),3);
 e.act('shadow','basic','e5');
 assert.equal(marks(e,'e5'),3,'vượt 3 dấu không cộng thêm');
 assert.equal(marks(e,'e4'),0,'dấu gắn theo mục tiêu');
});

test('Tam Ảnh Đoạt Mệnh: 3 nhịp chém 3 mục tiêu hàng sau KHÁC nhau, xa nhất trước, +35%/dấu rồi xoá dấu',()=>{
 const e=setup(.5,units(['e5',6000]));
 e.unit('e5').splus.memory.hoaAn=3;   // 3 dấu sẵn trên mục tiêu xa nhất
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 assert.equal(r.ok,true);
 assert.equal(e.unit('shadow').energy,40,'60 khí trừ một lần lúc tung');
 assert.equal(e.unit('e5').hp,6000,'chưa có sát thương trước marker');
 for(let strike=0;strike<3;strike++){
  const step=e.resolveTichDaoImpact('shadow',r.castId,strike);
  assert.equal(step.ok,true,'nhịp '+(strike+1)+' resolves once');
 }
 // Nhịp 1 → e5 (xa nhất, 3 dấu): 100 × 1.22 × (1+0.35×3) = 250; dấu bị xoá.
 assert.equal(e.unit('e5').hp,6000-Math.round(100*1.22*(1+.35*3)));
 assert.equal(marks(e,'e5'),0,'dấu bị ultimate tiêu thụ');
 // Nhịp 2 → e4, nhịp 3 → e3 (3 mục tiêu hàng sau khác nhau, không đánh ô trống).
 assert.equal(e.unit('e4').hp,9000-Math.round(100*1.22));
 assert.equal(e.unit('e3').hp,9000-Math.round(100*1.22));
 // Hàng trước không dính đòn khi hàng sau còn sống.
 for(const other of ['e0','e1','e2'])assert.equal(e.unit(other).hp,9000);
 // Hàng sau chỉ còn 2 tướng: nhịp 3 đánh tướng còn sống (không bỏ nhịp).
 const e2=setup(.5,[actor,enemy(0,9000),enemy(1,9000),enemy(2,9000),enemy(3,5000),enemy(4,0),enemy(5,0)]);
 const r2=e2.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e2.resolveTichDaoImpact('shadow',r2.castId,strike);
 assert.ok(e2.unit('e3').hp<5000,'nhịp 1 vào e3');
 assert.ok(e2.unit('e2').hp<9000,'nhịp 2 rơi vào tướng hàng trước xa nhất còn sống');
 assert.ok(e2.unit('e1').hp<9000,'nhịp 3 rơi vào tướng còn sống kế tiếp');
 assert.equal(e2.unit('e0').hp,9000,'cột gần nhất bị bỏ lại cuối');
 assert.equal(e2.finishTichDaoCast('shadow',r2.castId),true);
 assert.equal(e2.finishTichDaoCast('shadow',r2.castId),false,'finish single-use');
});

test('Mưa kiếm kết liễu: HP < 30% sau chuỗi chém, tối đa 2 mục tiêu, xa nhất trước',()=>{
 // 3 mục tiêu hàng sau đủ điều kiện sau sát thương nhịp chém → chỉ 2 bị kết liễu.
 const e=setup(.5,units(['e5',3100],['e4',3100],['e3',3100]));
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e.resolveTichDaoImpact('shadow',r.castId,strike);
 // sau nhịp: e5/e4/e3 đều 3100−122=2978 < 3000 (30%) → đủ điều kiện, nhưng tối đa 2.
 const step=e.resolveTichDaoExecute('shadow',r.castId);
 assert.equal(step.ok,true);
 assert.deepEqual(step.executed,['e5','e4'],'kết liễu xa nhất trước, tối đa 2');
 assert.equal(e.unit('e5').hp,0);
 assert.equal(e.unit('e4').hp,0);
 assert.ok(e.unit('e3').hp>0,'mục tiêu thứ 3 sống vì đã đủ hạn 2');
 assert.ok(e.unit('e3').hp<3000,'e3 vốn đủ điều kiện nhưng bị cắt bởi executeMax');
 assert.equal(e.resolveTichDaoExecute('shadow',r.castId).ok,false,'execute single-use per cast');
 assert.equal(e.finishTichDaoCast('shadow',r.castId),true);
});

test('Mưa kiếm: đúng 30% máu KHÔNG được kết liễu (ngưỡng là dưới 30%)',()=>{
 const e=setup(.5,units(['e5',3122]));   // 3122 − 122 (nhịp 1) = đúng 3000
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e.resolveTichDaoImpact('shadow',r.castId,strike);
 assert.equal(e.unit('e5').hp,3000,'đúng 30% sau nhịp chém');
 const step=e.resolveTichDaoExecute('shadow',r.castId);
 assert.deepEqual(step.executed,[],'đúng 30% không đủ điều kiện kết liễu');
 assert.equal(e.unit('e5').hp,3000);
 e.finishTichDaoCast('shadow',r.castId);
});

test('Mưa kiếm chỉ quét hàng sau: tướng hàng trước dưới 30% không bị kết liễu',()=>{
 const e=setup(.5,units(['e5',5000],['e0',100]));
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e.resolveTichDaoImpact('shadow',r.castId,strike);
 const step=e.resolveTichDaoExecute('shadow',r.castId);
 assert.deepEqual(step.executed,[],'e0 (hàng trước, 1% máu) không thuộc hàng kết liễu');
 assert.equal(e.unit('e0').hp,100);
 e.finishTichDaoCast('shadow',r.castId);
});

test('Không còn tàng hình: bỏ stealth-on-kill và vanish dưới 40% của kit tạm',()=>{
 const e=setup(.5,units(['e5',200]));
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 for(let strike=0;strike<3;strike++)e.resolveTichDaoImpact('shadow',r.castId,strike);
 e.resolveTichDaoExecute('shadow',r.castId);
 e.finishTichDaoCast('shadow',r.castId);
 assert.equal(e.hasStatus('shadow','stealth'),false,'hạ gục không còn tự tàng hình');
 const e2=setup();
 e2.damage('e0','shadow',{raw:7000,forceHit:true});
 assert.equal(e2.hasStatus('shadow','stealth'),false,'rớt dưới 40% không còn vanish');
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

test('VFX provenance: restores the three owner-approved clips',()=>{
 const vfx=meta.vfx;
 assert.ok(vfx,'runtime-meta.vfx tồn tại');
 assert.match(vfx.provenance?.source,/Owner-approved/);
 assert.deepEqual(Object.values(vfx.clips).map(c=>c.sourceCode),['jgm_120_ftw_c','jgm_30_hxc_c','zgm_110_qzzh_c']);
 for(const key of ['vanish','appear','rain'])assert.ok(vfx.clips?.[key]?.file,'thiếu vfx clip '+key);
 for(const key of ['vanish','appear','rain']){
  const c=vfx.clips[key];
  assert.ok(c.frames>0&&c.cols>0&&c.cellW>0&&c.cellH>0,key+' có grid atlas hợp lệ');
  assert.ok(c.sourceCode,'ghi mã hiệu ứng gốc');
 }
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

test('LỖI-1: clip atk/ultimate chuẩn hoá kích thước nội dung bằng idle (content scale)',()=>{
 const clips=meta.clips;
 const idleH=clips['idle-authored-0'].content?.frameHeightPx||0;
 assert.ok(idleH>350,'idle content height cần được đo (>350px), got '+idleH);
 for(const key of ['basic','ultimate','hit','run','fall-die']){
  const c=clips[key],scale=c.content?.scale??1,h=c.content?.frameHeightPx??0;
  assert.ok(h>0,key+': cần đo frameHeightPx');
  assert.ok(scale>1.01||h>=idleH*0.9,key+': nội dung bị bé ('+Math.round(h*scale)+'px vs idle '+idleH+'px) — cần phóng scale '+ (idleH/Math.max(1,h)).toFixed(2));
  assert.ok(h*scale<=idleH*1.25,key+': sau scale vượt quá 125% idle');
 }
});
test('LỖI-2 engine: tichDaoStrikeTarget preview khớp đúng mục tiêu từng nhịp',()=>{
 const e=setup(.5,units(['e5',6000],['e3',1500]));
 const r=e.act('shadow','ultimate','e0',{deferTichDao:true});
 const picks=[0,1,2].map(s=>e.tichDaoStrikeTarget('shadow',r.castId,s)?.id);
 assert.deepEqual(picks,['e5','e4','e3'],'preview: xa nhất trước, 3 mục tiêu khác nhau');
 for(let s=0;s<3;s++)e.resolveTichDaoImpact('shadow',r.castId,s);
 const struck=(e.events||[]).filter(x=>x.type==='shadowStrike').map(x=>x.targetId);
 assert.deepEqual(struck,picks,'strike thực khớp preview');
 e.resolveTichDaoExecute('shadow',r.castId);e.finishTichDaoCast('shadow',r.castId);
});


test('Hoa An is visible in the shared enemy HUD and clears after its ultimate strike',()=>{
 const e=setup();e.act('shadow','basic');
 let mark=e.hud('e5').find(s=>s.type==='hoaAn');
 assert.ok(mark,'Hoa An must be exported to the enemy head-icon owner');
 assert.equal(mark.stacks,1);assert.equal(mark.maxStacks,3);assert.equal(mark.name,'Hoa Ấn');
 e.act('shadow','basic');e.act('shadow','basic');
 assert.equal(e.hud('e5').find(s=>s.type==='hoaAn').stacks,3);
 const cast=e.act('shadow','ultimate',null,{deferTichDao:true});
 e.resolveTichDaoImpact('shadow',cast.castId,0);
 assert.equal(e.hud('e5').some(s=>s.type==='hoaAn'),false);
});

test('natural auto cadence reaches ultimate from zero rage after four basics',()=>{
 const e=setup();e.unit('shadow').energy=0;
 for(let i=0;i<4;i++){
  assert.equal(e.chooseAction('shadow'),'basic');
  assert.equal(e.act('shadow','basic').ok,true);
  assert.equal(e.unit('shadow').energy,(i+1)*15);
 }
 assert.equal(e.chooseAction('shadow'),'ultimate');
 assert.equal(e.act('shadow','ultimate',null,{deferTichDao:true}).ok,true);
 assert.equal(e.unit('shadow').energy,0);
});
