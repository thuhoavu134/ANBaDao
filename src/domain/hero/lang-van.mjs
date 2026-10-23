// Lăng Vân — Thiếu Niên Thần Tướng (scaffold 2026-10-23, scripts/hero/scaffold.mjs). Presentation lives in
// assets/characters/lang-van/hero.json; rules live in splus-mechanics AUTHORED_HIT.lang_van.
export const LANG_VAN_KIT = Object.freeze({
  id: 'hero_splus_lang_van',
  key: 'lang_van',
  passive: Object.freeze({ name: "Song Thần Tiễn Ảnh" }),
  basic: Object.freeze({ name: "Thủy Triều Trảm Kích", cost: 0, hits: 4, target: 'enemy', multiplier: 1.15 }),
  ultimate: Object.freeze({ name: "Song Thương Loạn Vân Phá", cost: 60, hits: 1, target: 'aoe_enemy', multiplier: 2 })
});

export const LANG_VAN_HERO = Object.freeze({
  id: 'hero_splus_lang_van', key: 'lang_van', number: null, catalogKind: 'authored-extra',
  name: "Lăng Vân", fullName: "Lăng Vân — Thiếu Niên Thần Tướng", rarity: 'S+', element: 'water', elementName: 'Thương Thủy', role: 'duelist',
  recommendedSlots: [0,1,2], weapon: "Song thương",
  profileVersion: 'lang-van/2026-10-23-scaffold', gender: "Nam", age: "Thiếu niên",
  introduction: "Thiếu niên thần tướng múa song thương, dẫn dòng nước xiết và băng giá quét sạch chiến trường.",
  voice: Object.freeze({ lobby: "Song thương này, ta luyện chưa từng ngơi nghỉ!", ultimate: "Song Thương Loạn Vân Phá!" }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/lang-van/portrait-43908036.webp' }),
  iconId: 'splus.lang_van.ultimate', passiveName: "Song Thần Tiễn Ảnh",
  passive: Object.freeze({ id: 'lang_van.passive', name: "Song Thần Tiễn Ảnh", target: 'Bản thân',
    description: "Mỗi đòn đánh thường tích 1 tầng Thủy Chú lên mục tiêu, giảm 10% tốc chạy, tối đa 3 tầng.",
    effects: [{"when":"hit","action":"basic","do":"status","who":"target","status":"speedDown","value":0.1,"turns":3,"stack":true,"maxStacks":3}], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'lang_van.basic', name: "Thủy Triều Trảm Kích", description: "Chuỗi 4 đòn song thương: chém chéo, quét nước, đâm xuống đất; mỗi đòn tích 1 tầng Thủy Chú.", target: '1 địch', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'lang_van.skill', name: "Thủy Triều Trảm Kích", description: "Alias hiển thị của đòn thường, Lăng Vân không có Skill tiêu hao riêng.", target: '1 địch', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'lang_van.ultimate', name: "Song Thương Loạn Vân Phá", description: "Bão băng quét toàn bộ địch: làm chậm 20% trong 2 lượt và gây thêm 2% máu tối đa sát thương chuẩn.", target: 'Toàn bộ địch',
      effects: [{"do":"status","who":"enemies","status":"speedDown","value":0.2,"turns":2},{"do":"damage","who":"enemies","pctMaxHp":0.02}], cost: 60, cooldown: 0 })
  })
});
