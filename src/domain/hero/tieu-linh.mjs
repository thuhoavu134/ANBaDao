// Tiểu Linh - Tiểu Quái Y (scaffold 2026-10-23, scripts/hero/scaffold.mjs). Presentation lives in
// assets/characters/tieu-linh/hero.json; rules live in splus-mechanics AUTHORED_HIT.tieu_linh.
export const TIEU_LINH_KIT = Object.freeze({
  id: 'hero_splus_tieu_linh',
  key: 'tieu_linh',
  passive: Object.freeze({ name: "Tà Hoa Diệu Thuật & Bảo Hiệp Thoát Thân" }),
  basic: Object.freeze({ name: "Khô Mộc Đập Đất & Phóng Khói", cost: 0, hits: 1, target: 'enemy', multiplier: 0.9 }),
  ultimate: Object.freeze({ name: "Vạn Cổ Hồ Lô - Loạn Thế Hồi Xuân Trận", cost: 60, hits: 1, target: 'aoe_enemy', multiplier: 2.1 })
});

export const TIEU_LINH_HERO = Object.freeze({
  id: 'hero_splus_tieu_linh', key: 'tieu_linh', number: null, catalogKind: 'authored-extra',
  name: "Tiểu Linh", fullName: "Tiểu Linh - Tiểu Quái Y", rarity: 'S+', element: 'wood', elementName: 'Mộc Tinh', role: 'support',
  recommendedSlots: [0,1,2], weapon: "Gậy cành khô và hồ lô",
  profileVersion: 'tieu-linh/2026-10-23-scaffold', gender: "Nam", age: "Thiếu niên",
  introduction: "Thầy lang nhỏ lang thang, sau lưng là hồ lô gốm nứt phì khói hoa đào; ai yếu nhất thì được cứu trước.",
  voice: Object.freeze({ lobby: "", ultimate: "Vạn Cổ Hồ Lô - Loạn Thế Hồi Xuân Trận!" }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/tieu-linh/portrait-025e4a34.webp' }),
  iconId: 'splus.tieu_linh.ultimate', passiveName: "Tà Hoa Diệu Thuật & Bảo Hiệp Thoát Thân",
  passive: Object.freeze({ id: 'tieu_linh.passive', name: "Tà Hoa Diệu Thuật & Bảo Hiệp Thoát Thân", target: 'Bản thân',
    description: "Đầu mỗi lượt của mình: hồ lô hồi 6% HP tối đa cho đồng đội yếu nhất và giải 1 hiệu ứng xấu trên người đó. Mỗi đòn gây sát thương gắn 1 tầng Độc Mộc Chú (2 hiệp, tối đa 3): đầu hiệp của địch chịu 35% Công mỗi tầng, một nửa lượng đó hồi cho cả đội. Khi bị đánh (1 lần mỗi vòng): bản thân nhận Khói Ẩn 1 hiệp (giảm 30% sát thương nhận, tăng 25% né) và được đẩy 15% thanh hành động; kẻ đánh bị giảm 20% chính xác và gắn thêm 1 tầng Độc Mộc Chú.",
    effects: [{"do":"status","who":"target","status":"poison","pctAtk":0.35,"turns":2,"stack":true,"maxStacks":3,"when":"hit","action":"basic"},{"when":"receive","do":"status","who":"target","status":"blind","value":0.2,"turns":1}], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'tieu_linh.basic', name: "Khô Mộc Đập Đất & Phóng Khói", description: "Đập gậy xuống đất rồi phóng sương bùa: 90% Công, gắn 1 tầng Độc Mộc Chú, hồi 20 Nộ. 40% tỉ lệ giảm 15% tốc mục tiêu trong 1 hiệp.", target: '1 địch', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'tieu_linh.skill', name: "Khô Mộc Đập Đất & Phóng Khói", description: "Alias hiển thị của đòn thường, Tiểu Linh không có Skill tiêu hao riêng.", target: '1 địch', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'tieu_linh.ultimate', name: "Vạn Cổ Hồ Lô - Loạn Thế Hồi Xuân Trận", description: "Hồ lô phun bão khói đào: hồi 22% HP tối đa của Tiểu Linh cho cả đội, giải sạch hiệu ứng xấu cho đồng đội dưới 50% HP, ban Hưng Phấn 2 hiệp (+20% Công, +10% bạo kích). Với địch: kích nổ toàn bộ sát thương độc còn lại (không mất tầng) và gây Hỗn Loạn 1 hiệp (giảm 30% kháng hiệu ứng, giảm 20% sát thương gây ra).", target: 'Toàn bộ địch',
      effects: [{"when":"hit","action":"ultimate","do":"status","who":"target","status":"confusion","value":0.2,"turns":1}], cost: 60, cooldown: 0 })
  })
});
