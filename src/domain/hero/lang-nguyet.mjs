// Lăng Nguyệt - Phong Linh Cung Thủ (scaffold 2026-10-23, scripts/hero/scaffold.mjs). Presentation lives in
// assets/characters/lang-nguyet/hero.json; rules live in splus-mechanics AUTHORED_HIT.lang_nguyet.
export const LANG_NGUYET_KIT = Object.freeze({
  id: 'hero_splus_lang_nguyet',
  key: 'lang_nguyet',
  passive: Object.freeze({ name: "Phong Khắc & Tật Phong Xạ" }),
  basic: Object.freeze({ name: "Thanh Phong Tiễn", cost: 0, hits: 1, target: 'enemy', multiplier: 1.1 }),
  ultimate: Object.freeze({ name: "Bão Phong Vũ Tiễn", cost: 60, hits: 1, target: 'aoe_enemy', multiplier: 2.1 })
});

export const LANG_NGUYET_HERO = Object.freeze({
  id: 'hero_splus_lang_nguyet', key: 'lang_nguyet', number: null, catalogKind: 'authored-extra',
  name: "Lăng Nguyệt", fullName: "Lăng Nguyệt - Phong Linh Cung Thủ", rarity: 'S+', element: 'wood', elementName: 'Mộc', role: 'marksman',
  recommendedSlots: [3,4,5], weapon: "Cung ngọc",
  profileVersion: 'lang-nguyet/2026-10-23-scaffold', gender: "Nữ", age: "Thiếu nữ",
  introduction: "Cung thủ gió, mũi tên xuyên giáp; đồng đội chạm đúng mục tiêu là nàng bắn theo.",
  voice: Object.freeze({ lobby: "", ultimate: "Bão Phong Vũ Tiễn!" }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/lang-nguyet/portrait-b1ca6091.webp' }),
  iconId: 'splus.lang_nguyet.ultimate', passiveName: "Phong Khắc & Tật Phong Xạ",
  passive: Object.freeze({ id: 'lang_nguyet.passive', name: "Phong Khắc & Tật Phong Xạ", target: 'Bản thân',
    description: "Mỗi đòn gây sát thương gắn 1 tầng Phong Khắc (2 hiệp, tối đa 3), mỗi tầng giảm 12% giáp. Khi đồng đội đánh mục tiêu đang đủ 3 tầng, Lăng Nguyệt bắn truy kích 80% Công và hồi 10 Nộ (tối đa 1 lần mỗi vòng).",
    effects: [{"do":"status","who":"target","status":"armorDown","value":0.12,"turns":2,"stack":true,"maxStacks":3,"when":"hit","action":"basic"}], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'lang_nguyet.basic', name: "Thanh Phong Tiễn", description: "Mũi tên gió xuyên thấu: 110% Công, bỏ qua 20% phòng ngự, gắn 1 tầng Phong Khắc, hồi 20 Nộ. Nếu bạo kích: đẩy lùi 15% thanh hành động của mục tiêu.", target: '1 địch', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'lang_nguyet.skill', name: "Thanh Phong Tiễn", description: "Alias hiển thị của đòn thường, Lăng Nguyệt không có Skill tiêu hao riêng.", target: '1 địch', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'lang_nguyet.ultimate', name: "Bão Phong Vũ Tiễn", description: "Mưa tên lốc xoáy: 210% Công lên toàn địch, gắn 1 tầng Phong Khắc, giảm 25% tốc toàn địch trong 2 hiệp. Sau đó bản thân nhận Thuận Phong 1 hiệp: được đẩy 100% thanh hành động (đánh thường ngay sau đó).", target: 'Toàn bộ địch',
      effects: [{"do":"status","who":"target","status":"armorDown","value":0.12,"turns":2,"stack":true,"maxStacks":3,"when":"hit","action":"ultimate"}], cost: 60, cooldown: 0 })
  })
});
