import test from 'node:test';import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {getSplusHero} from '../src/domain/hero/splus-catalog.mjs';
import {SPLUS_EXTRA_HEROES,resolveSplusExtraId} from '../src/domain/hero/splus-extras.mjs';
import {readFileSync,existsSync} from 'node:fs';
const meta=JSON.parse(readFileSync(new URL('../assets/characters/hong-thuong/runtime-meta.json',import.meta.url),'utf8'));
// Actor slot 0 cột 0; địch e0-e5 (hàng trước 0-2, hàng sau 3-5).
const actor={id:'spear',sourceId:'hero_splus_hong_thuong',team:'player',slot:0,hp:10000,maxHp:10000,atk:100,energy:100,accuracy:100,crit:0};
const enemy=(i,hp=9000)=>({id:'e'+i,team:'enemy',slot:i,hp,maxHp:10000,atk:10,energy:0});
const units=(...overrides)=>{const list=[actor,...Array.from({length:6},(_,i)=>enemy(i))];for(const [id,hp] of overrides){const u=list.find(u=>u.id===id);if(u)u.hp=hp;}return list;};
const setup=(over,proc=.5,energy=100)=>{actor.energy=energy;return createSplusCombat({units:units(...over||[]),rng:()=>proc});};
const stacks=e=>id=>e.hongThuongStacks(e.unit(id));
const hitEvents=(result,type)=>(result.events||[]).filter(x=>x.type===type);

test('Hồng Thương registry: idea-locked kit + temp technical name (all numbers are review defaults)',()=>{
 const hero=getSplusHero('hong_thuong');
 assert.equal(hero?.name,'Hồng Thương','tên kỹ thuật tạm — chờ owner chốt');
 assert.equal(hero?.role,'striker');assert.equal(hero?.element,'metal');
 assert.ok(SPLUS_EXTRA_HEROES.some(h=>h.id==='hero_splus_hong_thuong'));
 assert.equal(resolveSplusExtraId('hong-thuong'),'hero_splus_hong_thuong');
 assert.equal(hero.actions.basic?.name,'Tam Điểm Phá Giáp');
 assert.equal(hero.actions.basic?.cost,0);
 assert.equal(hero.actions.ultimate?.name,'Kinh Hoồng Phá Trận');
 assert.equal(hero.actions.skill?.name,'Tam Điểm Phá Giáp','skill slot là alias hiển thị');
 assert.equal(hero.actions.skill?.cost,0);
 assert.equal(hero.passive?.name,'Phá Trận');
 assert.equal(hero.passive?.rules?.maxStacks,3);
 const e=setup();
 assert.equal(e.canUse('spear','skill'),false,'Basic+Ultimate+passive; không có Skill 1 tiêu khí');
 assert.equal(e.canUse('spear','basic'),true);
 assert.equal(e.canUse('spear','ultimate'),true);
});

test('Basic: 3 nhát resolve đúng một lần, không tiêu nộ, nộ cộng MỘT lần mỗi hành động',()=>{
 const e=setup(undefined,.5,20);
 const cast=e.act('spear','basic','e0',{deferHongThuong:true});
 assert.ok(cast.ok&&cast.castId,'basic có castId để runtime chạy từng nhát');
 const tokens=new Set();
 for(let i=0;i<3;i++){
  const before=e.events.length;
  const r=e.resolveHongThuongHit('spear',cast.castId,'e0',i);
  assert.ok(r.ok);
  assert.equal(hitEvents(r,'damage').length,1,'mỗi nhát đúng một damage');
  assert.equal(hitEvents(r,'spearThrust')[0]?.hit,i+1);
  // resolve lặp lại cùng hitIndex phải vô hiệu
  const again=e.resolveHongThuongHit('spear',cast.castId,'e0',i);
  assert.equal(again.ok,false,'token targetId:hitIndex chống double-resolve');
 }
 assert.equal(e.unit('spear').energy,20,'chưa finish thì chưa cộng nộ (nộ ở finishHongThuongCast cho basic)');
 e.finishHongThuongCast('spear',cast.castId);
 assert.equal(e.unit('spear').energy,20+15,'nộ +15 đúng MỘT lần cho cả hành động 3 nhát');
});

test('Basic từ nộ 0 vẫn đánh được; đủ nộ ultimate ra trong vòng đánh tự nhiên',()=>{
 const e=setup(undefined,.5,0);
 assert.equal(e.canUse('spear','basic'),true,'basic miễn phí');
 const r=e.act('spear','basic','e0');
 assert.ok(r.ok);
 // 4 basic từ nộ 0 → 60 → đủ ultimate (theo engine basicRage=15)
 const e0=setup(undefined,.5,0);
 for(let i=0;i<4;i++)e0.act('spear','basic','e0');
 assert.ok(e0.unit('spear').energy>=60,'4 basic đạt ngưỡng ultimate 60');
 assert.equal(e0.canUse('spear','ultimate'),true);
});

test('Sơ Hở: 0→1→2→3 đúng cap; nhát tạo tầng 3 KHÔNG tự tiêu thụ; nhát KẾ TIẾP mới tiêu thụ',()=>{
 const e=setup();actor.energy=0;const check=stacks(e);
 const r=e.act('spear','basic','e0');
 assert.ok(r.ok);
 assert.equal(check('e0'),3,'3 nhát trúng → 3 tầng');
 // nhát vừa tạo tầng 3 phải KHÔNG phát loDiemYeu
 assert.equal(hitEvents(r,'loDiemYeu').length,0,'nhát tạo tầng 3 không tự phá giáp');
 // hành động basic KẾ TIẾP: nhát 1 kiểm 3 tầng → tiêu thụ → +1 dấu mới
 const r2=e.act('spear','basic','e0');
 const consumed=hitEvents(r2,'loDiemYeu');
 assert.equal(consumed.length,1,'đúng một lần tiêu thụ ở nhát đầu của hành động kế tiếp');
 assert.equal(consumed[0].consumed,3);
 assert.equal(check('e0'),3,'nhát tiêu thụ cũng là nhát trúng → +1, rồi 2 nhát sau lên lại 3');
});

test('Phá Trận: nhát tiêu thụ bỏ qua một phần giáp (damage cao hơn so với cùng stack không tiêu thụ)',()=>{
 // basic nhắm tuyến đối diện → e0 (slot 0 đối actor slot 0); cho e0 giáp dày
 const heavy=units().map(u=>u.id==='e0'?{...u,def:500,maxHp:99999,hp:99999}:u);
 const e=createSplusCombat({units:[{...actor,energy:0,id:'a',atk:100},...heavy],rng:()=>.5});
 e.act('a','basic','e0');
 e.act('a','basic','e0');
 const dmg=e.events.filter(x=>x.type==='damage'&&x.targetId==='e0').map(x=>x.amount);
 const noConsume=dmg[0],secondHit=dmg[3];
 assert.ok(secondHit&&noConsume,'có đủ damage events');
 assert.ok(secondHit>noConsume,`nhát tiêu thụ (${secondHit}) mạnh hơn nhát thường (${noConsume}) nhờ bỏ 35% giáp`);
});

test('Hit bị khiên hấp thụ hoàn toàn vẫn cộng dấu (review default) + tiêu thụ gây thêm sát thương lên khiên',()=>{
 const e=setup();
 e.unit('e0').shield=5000;
 const r=e.act('spear','basic','e0');
 assert.ok(r.ok);
 assert.equal(stacks(e)('e0'),3,'khiên hấp thụ hết vẫn là nhát trúng hợp lệ → 3 tầng');
 // hành động kế tiếp: nhát 1 tiêu thụ → bonus damage lên khiên
 const shieldBefore=e.unit('e0').shield;
 const r2=e.act('spear','basic','e0');
 assert.equal(hitEvents(r2,'loDiemYeu').length,1);
 const after=e.unit('e0').shield;
 assert.ok(shieldBefore-after>0,'khiên bị gãy thêm bởi đòn + bonus phá khiên');
});

test('Ultimate: cụm 3 nhát cho TẤT CẢ địch còn sống CẢ HAI hàng + đúng 1 hồi mã thương',()=>{
 const e=setup();
 const cast=e.act('spear','ultimate',null,{deferHongThuong:true});
 assert.ok(cast.ok&&cast.castId);
 const foeCount=6;
 let finaleSeen=false;
 let total=0;
 while(e.nextHongThuongCluster('spear',cast.castId)){
  const victim=e.nextHongThuongCluster('spear',cast.castId);
  // preview == resolve: cùng chọn mục tiêu
  for(let hit=0;hit<3;hit++){
   const r=e.resolveHongThuongHit('spear',cast.castId,victim.id,hit);
   assert.ok(r.ok);
   assert.equal(hitEvents(r,'damage').length,1);
   total++;
  }
 }
 assert.equal(total,foeCount*3,'6 địch × 3 nhát');
 const fin=e.resolveHongThuongFinale('spear',cast.castId);
 assert.ok(fin.ok&&fin.executed,'có hồi mã thương');
 assert.equal(hitEvents(fin,'hoiMaThuong').length,1);
 const again=e.resolveHongThuongFinale('spear',cast.castId);
 assert.equal(again.ok,false,'hồi mã chỉ một lần');
 e.finishHongThuongCast('spear',cast.castId);
 assert.ok(true);
});

test('Ultimate đi qua cả hàng trước lẫn hàng sau (không giới hạn hàng sau như Tịch Dao)',()=>{
 const e=setup([['e0',300],['e5',300]]);
 const e2=e;
 const cast2=e2.act('spear','ultimate',null,{deferHongThuong:true});
 const seen=[];
 while(e2.nextHongThuongCluster('spear',cast2.castId)){
  const v=e2.nextHongThuongCluster('spear',cast2.castId);
  seen.push(v.id);
  for(let h=0;h<3;h++)e2.resolveHongThuongHit('spear',cast2.castId,v.id,h);
 }
 assert.equal(seen.length,6,'mọi địch còn sống nhận một cụm');
 assert.ok(seen.includes('e0')&&seen.includes('e5'),'cả hai hàng');
 assert.deepEqual(seen,[...seen].sort(),'thứ tự bySlot ổn định: front trước');
});

test('Địch chết giữa cụm: bỏ hit còn lại của cụm đó, không cộng dấu lên xác, cụm sau vẫn chạy',()=>{
 const e=setup([['e0',600]]);
 const cast=e.act('spear','ultimate',null,{deferHongThuong:true});
 const v=e.nextHongThuongCluster('spear',cast.castId);
 assert.equal(v.id,'e0');
 const r1=e.resolveHongThuongHit('spear',cast.castId,'e0',0);
 assert.ok(!e.unit('e0').hp>0||hitEvents(r1,'soHo').length>0,'nhát 1 landing');
 const dead=e.unit('e0');
 dead.hp=0;dead.dead=true; // chết giữa cụm (ví dụ phản dame kế tiếp)
 const r2=e.resolveHongThuongHit('spear',cast.castId,'e0',1);
 assert.equal(hitEvents(r2,'damage').length,0,'không đánh xác');
 assert.equal(hitEvents(r2,'soHo').length,0,'không cộng dấu lên xác');
 const next=e.nextHongThuongCluster('spear',cast.castId);
 assert.notEqual(next?.id,'e0','cụm kế tiếp chuyển địch sống');
});

test('Hồi Mã Thương: ưu tiên tỷ lệ khiên cao nhất; hết khiên chọn giáp cao nhất; chọn lại NGAY trước cú đâm',()=>{
 const e=setup();
 e.unit('e2').shield=4000; // 40% maxHp — cao nhất
 e.unit('e3').shield=1500; // 15%
 actor.energy=100;
 const cast=e.act('spear','ultimate',null,{deferHongThuong:true});
 while(e.nextHongThuongCluster('spear',cast.castId)){
  const v=e.nextHongThuongCluster('spear',cast.castId);
  for(let h=0;h<3;h++)e.resolveHongThuongHit('spear',cast.castId,v.id,h);
 }
 // e2 chết ngay trước hồi mã → chọn lại giữa lúc đó: còn e3 khiên 15%
 e.unit('e2').hp=0;e.unit('e2').dead=true;e.unit('e2').shield=0;
 const pick=e.nextHongThuongFinale('spear',cast.castId);
 assert.equal(pick?.id,'e3','chọn lại từ địch còn sống, đọc khiên hiện tại');
 // không còn ai có khiên → giáp cao nhất
 for(const id of ['e0','e1','e3','e4','e5']){e.unit(id).shield=0;}
 e.unit('e4').def=600;
 const pick2=e.nextHongThuongFinale('spear',cast.castId);
 assert.equal(pick2?.id,'e4','fallback giáp cao nhất');
});

test('Không còn địch: không có hồi mã thương vào toạ độ cũ, kết thúc sạch, trả lượt (cast finish được)',()=>{
 const e=setup();
 const cast=e.act('spear','ultimate',null,{deferHongThuong:true});
 for(const u of e.units)if(u.team==='enemy'){u.hp=0;u.dead=true;}
 const fin=e.resolveHongThuongFinale('spear',cast.castId);
 assert.equal(fin.executed,false,'không phát cú đâm bồi');
 assert.ok(e.finishHongThuongCast('spear',cast.castId),'cast kết thúc sạch');
});

test('Tướng thi triển chết giữa chuỗi: dừng sạch, không hit tiếp theo',()=>{
 const e=setup();
 const cast=e.act('spear','ultimate',null,{deferHongThuong:true});
 const v=e.nextHongThuongCluster('spear',cast.castId);
 e.resolveHongThuongHit('spear',cast.castId,v.id,0);
 e.unit('spear').hp=0;e.unit('spear').dead=true;
 const r=e.resolveHongThuongHit('spear',cast.castId,v.id,1);
 assert.equal(hitEvents(r,'damage').length,0,'actor chết → không phát hit');
 assert.equal(e.nextHongThuongCluster('spear',cast.castId),null);
 assert.ok(e.finishHongThuongCast('spear',cast.castId));
});

test('Tướng khác không tiêu thụ dấu ngoài ý muốn (dấu chỉ do đòn của Hồng Thương tiêu thụ)',()=>{
 const e=setup();
 e.unit('e0').splus.memory.soHo=3;e.unit('e0').splus.memory.soHoRound=e.round;
 const other={id:'ranger',sourceId:'hero_splus_lac_an',team:'player',slot:1,hp:9000,maxHp:9000,atk:100,energy:100,accuracy:100,crit:0,statuses:[],splus:{memory:{},cooldowns:{},lastActRound:0}};
 e.units.push(other);
 e.act('ranger','basic','e0');
 assert.equal(stacks(e)('e0'),3,'đòn của tướng khác không tiêu thụ Sơ Hở');
});

test('Asset/meta: VFX mẫu 22 + SFX tw_zxzy_c + provenance + marker timeline từ clip đo thật',()=>{
 assert.ok(existsSync(new URL('../assets/vfx/hong-thuong/impact.webp',import.meta.url)));
 assert.ok(existsSync(new URL('../assets/audio/sfx/hong-thuong/impact.wav',import.meta.url)));
 const v=meta.vfx;
 assert.equal(v.clips.impact.frames,14,'14 khung có nội dung (khung 15 của SPR rỗng)');
 assert.equal(v.clips.impact.blendMode,'screen');
 assert.equal(v.provenance.vfxCode,'tw_90_zxzy_d');
 assert.equal(v.provenance.sfxCode,'tw_zxzy_c');
 assert.match(v.provenance.note,/KHÔNG tuyên bố cặp gốc/);
 // timeline đo từ clip: 3 hit basic + 3 hit cluster + 1 hồi mã
 assert.deepEqual(meta.ultimateTimeline.hitMsBasic,[384,816,864],'nhịp đo từ atk_2 (f18/f36/f38 bước 2)');
 assert.deepEqual(meta.ultimateTimeline.clusterHitsAt,[96,384,672]);
 assert.equal(meta.ultimateTimeline.finisherHitAt,720);
 // scale chuẩn hoá thân về mốc authored ~423px, cùng hệ mọi clip
 for(const k of ['basic','ult-prep','ult-cluster','ult-finisher','run','hit','fall-die']){
  const c=meta.clips[k];
  assert.ok(c.content.scale>0.9&&c.content.scale<1.1,k+' scale đồng nhất (không phập phồng)');
 }
 assert.ok(meta.pending?.some(p=>p.includes('2 cú đâm')),'ghi rõ clip ATK chỉ có 2 cú đâm riêng biệt');
});
