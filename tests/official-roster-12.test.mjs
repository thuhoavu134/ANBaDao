import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const roster = [
  ['ong_hang_pho', 'Ông Phở'],
  ['thay_mo', 'Thầy Mo'],
  ['lac_yen', 'Thần Nỏ Sơn Nữ — Lạc Yên'],
  ['cung_thu_tre', 'Nữ Cung Thủ Tre'],
  ['co_dao_ganh_hoi', 'Cô Đào Gánh Hội'],
  ['phong_tu', 'Phong Tử'],
  ['thuy_nuong_roi_nuoc', 'Thủy Nương Rối Nước'],
  ['hong_lien_dao_nuong', 'Hồng Liên Đao Nương'],
  ['thach_quyen', 'Thạch Quyền'],
  ['dinh_loi', 'Đình Lôi — Vệ Binh Trống Đồng'],
  ['luc_anh', 'Lục Ảnh — Kép Đèn Kéo Quân'],
  ['to_diep', 'Tố Điệp — Mộc Bản Nương'],
  ['linh_dong', 'Linh Đồng']
];

test('official production roster contains the locked 12 plus Linh Đồng', () => {
  for (const [id, name] of roster) {
    assert.match(index, new RegExp(`\\b${id}:\\{`), id);
    assert.ok(index.includes(`name:"${name}"`), name);
  }
  const ownership = index.match(/\["ong_hang_pho","thay_mo"[^\]]+"linh_dong"\]\.forEach\(id=>\{ if\(heroes\[id\]\) heroes\[id\]\.owned=true; \}\);/);
  assert.ok(ownership, 'default profile unlocks official identities including Linh Đồng');
});

test('every official hero has Basic runtime, Skill 1 and Ultimate contracts', () => {
  const dataStart = index.indexOf('const DATA={');
  assert.ok(dataStart >= 0);
  for (const [id] of roster) {
    const start = index.indexOf(` ${id}:{`, dataStart);
    assert.ok(start >= 0, id);
    const next = index.indexOf('\n ', start + id.length + 3);
    const source = index.slice(start, next > start ? next : start + 2500);
    assert.match(source, /stats:\{hp:/, `${id} stats`);
    assert.match(source, /skill:\{name:/, `${id} Skill 1`);
    assert.match(source, /ultimate:\{name:/, `${id} Ultimate`);
  }
  assert.match(index, /function mapSkill\(combatant\)/);
  assert.match(index, /ultimateName: ultimate\.name/);
});

test('six-slot starter team and twelve-hero reserve pool remain 6v6-safe', () => {
  assert.match(index, /squad:\[\{id:"ong_hang_pho"[\s\S]{0,500}\{id:"cung_thu_tre",row:"back"\}\]/);
  assert.match(index, /if\s*\(prepared\.length\s*>=\s*6\) break;/);
  assert.match(index, /heroPool: Object\.entries\(DATA\.heroes\)\.filter\(\(\[id\]\)=>P\.heroes\?\.\[id\]\?\.owned\)/);
  assert.match(index, /objective: battlefieldObjectiveForBattle\(battleId,heroes\)/);
  assert.match(index, /const roster12Mode = qaParam === "roster12"/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS\.slice\(0,6\)/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS\.slice\(6,12\)/);

  assert.match(index, /dinhLoiStarterInjected3255/);
  assert.match(index, /source\.findIndex\(x=>x\.id==='phong_tu'\)/);
  assert.match(index, /12 tướng Hồn Việt chia thành hai đội 6v6 để kiểm thử combat tới màn kết quả/);
});
