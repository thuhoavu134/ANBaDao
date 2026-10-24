// Lăng Chân — Vô Cực Kiếm Tử (scaffold 2026-10-23, scripts/hero/scaffold.mjs). Presentation lives in
// assets/characters/lang-chan/hero.json; rules live in splus-mechanics AUTHORED_HIT.lang_chan.
export const LANG_CHAN_KIT = Object.freeze({
  id: 'hero_splus_lang_chan',
  key: 'lang_chan',
  passive: Object.freeze({ name: "Thái Cực Hóa Kiếm" }),
  basic: Object.freeze({ name: "Lưu Tinh Cản Nguyệt", cost: 0, hits: 1, target: 'enemy', multiplier: 1.2 }),
  ultimate: Object.freeze({ name: "Bát Quái Kiếm Trận — Vạn Kiếm Quy Tông", cost: 60, hits: 1, target: 'aoe_enemy', multiplier: 2.2 })
});

export const LANG_CHAN_HERO = Object.freeze({
  id: 'hero_splus_lang_chan', key: 'lang_chan', number: null, catalogKind: 'authored-extra',
  name: "Lăng Chân", fullName: "Lăng Chân — Vô Cực Kiếm Tử", rarity: 'S+', element: 'water', elementName: 'Thương Thủy', role: 'duelist',
  recommendedSlots: [0,1,3], weapon: "Chân Võ Cổ Kiếm (kiếm thẳng, lam ngọc)",
  profileVersion: 'lang-chan/2026-10-23-scaffold', gender: "Nam", age: "Thiếu niên",
  introduction: "Truyền nhân Võ Đang, kiếm khí Thái Cực lam bạch. Hắn không đánh nhiều — hắn chỉ cần một nhát đúng lúc.",
  voice: Object.freeze({ lobby: "Kiếm tại tâm, tâm tại vô cực.", ultimate: "Bát Quái Kiếm Trận — Vạn Kiếm Quy Tông!" }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/lang-chan/portrait-9fd6b6ba.webp' }),
  iconId: 'splus.lang_chan.ultimate', passiveName: "Thái Cực Hóa Kiếm",
  passive: Object.freeze({ id: 'lang_chan.passive', name: "Thái Cực Hóa Kiếm", target: 'Bản thân',
    description: "Dưới chân luôn có trận đồ Âm Dương Ngư xoay chậm. Khi áp sát hoặc tấn công, trận đồ hấp thu chấn động: nhận thêm 15% Tốc độ và chuyển 10% sát thương gây ra thành giáp khí hộ thể.",
    effects: [{"when":"always","do":"stat","stat":"speed","value":0.15},{"when":"hit","action":"basic","do":"heal","who":"self","pctMaxHp":0.03}], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'lang_chan.basic', name: "Lưu Tinh Cản Nguyệt", description: "Hóa thành vệt sao băng lam bạch lướt xuyên thấu áp sát mục tiêu trước mặt, tung nhát chém vòng cung mang khí lưu Thái Cực: 120% sát thương Băng/Lôi, 50% tỉ lệ gián đoạn và đẩy lùi 15% Thanh Hành Động.", target: '1 địch', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'lang_chan.skill', name: "Lưu Tinh Cản Nguyệt", description: "Alias hiển thị của đòn thường, Lăng Chân không có Skill tiêu hao riêng.", target: '1 địch', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'lang_chan.ultimate', name: "Bát Quái Kiếm Trận — Vạn Kiếm Quy Tông", description: "Phóng kiếm lên không rồi giẫm mạnh xuống, khai mở trận đồ Thái Cực Bát Quái khổng lồ. Vạn luồng kiếm khí lam ngọc lao xuống tâm trận, hút chặt kẻ địch: 220% sát thương toàn sân, toàn bộ địch giảm 25% Tốc độ và bị phong tỏa di chuyển trong 2 hiệp.", target: 'Toàn bộ địch',
      effects: [{"when":"hit","action":"ultimate","do":"status","who":"target","status":"speedDown","value":0.25,"turns":2},{"when":"hit","action":"ultimate","do":"status","who":"target","status":"root","turns":2}], cost: 60, cooldown: 0 })
  })
});
