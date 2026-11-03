// Lăng Tiêu - Tử Lôi Kiếm Ảnh (scaffold 2026-10-23, scripts/hero/scaffold.mjs). Presentation lives in
// assets/characters/lang-tieu/hero.json; rules live in splus-mechanics AUTHORED_HIT.lang_tieu.
export const LANG_TIEU_KIT = Object.freeze({
  id: 'hero_splus_lang_tieu',
  key: 'lang_tieu',
  passive: Object.freeze({ name: "Thiên Lôi Ấn" }),
  basic: Object.freeze({ name: "Lôi Phong Kiếm Ảnh", cost: 0, hits: 1, target: 'enemy', multiplier: 1 }),
  ultimate: Object.freeze({ name: "Vạn Kiếp Tử Lôi Trảm", cost: 60, hits: 1, target: 'aoe_enemy', multiplier: 2.2 })
});

export const LANG_TIEU_HERO = Object.freeze({
  id: 'hero_splus_lang_tieu', key: 'lang_tieu', number: null, catalogKind: 'authored-extra',
  name: "Lăng Tiêu", fullName: "Lăng Tiêu - Tử Lôi Kiếm Ảnh", rarity: 'S+', element: 'metal', elementName: 'Kim', role: 'striker',
  recommendedSlots: [3,4,5], weapon: "Trường kiếm",
  profileVersion: 'lang-tieu/2026-10-23-scaffold', gender: "Nam", age: "Thiếu niên",
  introduction: "Kiếm sĩ lôi điện, mỗi nhát chém gieo một ấn sét; đủ bốn ấn thì trời giáng xuống.",
  voice: Object.freeze({ lobby: "", ultimate: "Vạn Kiếp Tử Lôi Trảm!" }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/lang-tieu/portrait-58e340a1.webp' }),
  iconId: 'splus.lang_tieu.ultimate', passiveName: "Thiên Lôi Ấn",
  passive: Object.freeze({ id: 'lang_tieu.passive', name: "Thiên Lôi Ấn", target: 'Bản thân',
    description: "Mỗi đòn gây sát thương gắn 1 tầng Lôi Ấn (2 hiệp, tối đa 4): mỗi tầng giảm 5% tốc và tăng 8% sát thương Lôi phải chịu. Đủ 4 tầng: tiêu hết tầng, gọi Lôi Giáng — 160% Công lên mục tiêu, 80% Công lan sang địch kề, mục tiêu bị Tê Liệt 1 lượt, Lăng Tiêu hồi 20 Nộ.",
    effects: [{"when":"hit","action":"basic","do":"status","who":"target","status":"speedDown","value":0.05,"turns":2,"stack":true,"maxStacks":4}], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'lang_tieu.basic', name: "Lôi Phong Kiếm Ảnh", description: "Phóng kiếm khí lôi: 100% Công, gắn 1 tầng Lôi Ấn, hồi 20 Nộ. Nếu bạo kích: bản thân được đẩy 15% thanh hành động và gắn thêm 1 tầng.", target: '1 địch', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'lang_tieu.skill', name: "Lôi Phong Kiếm Ảnh", description: "Alias hiển thị của đòn thường, Lăng Tiêu không có Skill tiêu hao riêng.", target: '1 địch', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'lang_tieu.ultimate', name: "Vạn Kiếp Tử Lôi Trảm", description: "Bão sét toàn sân: 220% Công lên toàn địch, gắn ngay 2 tầng Lôi Ấn (ai đã có 2 tầng thì kích nổ Lôi Giáng ngay). Để lại Vực Sấm Sét 2 hiệp: mỗi khi địch bắt đầu lượt, sét đánh 60% Công và gắn thêm 1 tầng.", target: 'Toàn bộ địch',
      effects: [{"when":"hit","action":"ultimate","do":"status","who":"target","status":"speedDown","value":0.05,"turns":2,"stack":true,"maxStacks":4}], cost: 60, cooldown: 0 })
  })
});
