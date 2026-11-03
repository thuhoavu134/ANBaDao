// Bạch Y Vân Phong (owner kit 2026-10-20). Presentation lives in
// assets/characters/bach-y-van-phong/hero.json; rules live in splus-mechanics
// AUTHORED_HIT.van_phong. Phong (gió) thuộc hành Mộc trong ngũ hành → element 'wood'.
export const VAN_PHONG_KIT = Object.freeze({
  id: 'hero_splus_van_phong',
  key: 'van_phong',
  passive: Object.freeze({ name: 'Tiêu Dao Bất Nhiễm', evasion: 0.2, controlResist: 0.15, counterMultiplier: 0.6, counterRage: 15, guardReduction: 0.3, guardPerBattle: 1 }),
  basic: Object.freeze({ name: 'Lạc Diệp Phong Trảm', cost: 0, hits: 1, multiplier: 1, sealChance: 0.3, sealTurns: 2, speedDown: 0.15, attackDown: 0.1 }),
  ultimate: Object.freeze({ name: 'Cửu Tiêu Vân Loạn', cost: 60, hits: 1, multiplier: 1.85, blindChance: 0.5, blindMiss: 0.35, blindTurns: 2, silenceTurns: 1, domainSpeed: 0.2, domainEvasion: 0.15, domainTurns: 2 })
});

export const VAN_PHONG_HERO = Object.freeze({
  id: 'hero_splus_van_phong', key: 'van_phong', number: null, catalogKind: 'authored-extra',
  name: 'Vân Phong', fullName: 'Bạch Y Vân Phong', rarity: 'S+', element: 'wood', elementName: 'Mộc', role: 'mystic',
  recommendedSlots: [3, 4, 5], weapon: 'Huyền Vũ Tiên Phiến',
  profileVersion: 'van-phong/2026-10-20-owner-kit', gender: 'Nam', age: 'Thanh niên',
  introduction: 'Pháp sư bịt mắt, áo trắng, lướt trên gió mực với Huyền Vũ Tiên Phiến. Khống chế diện rộng, né đòn rồi phản kích, che chắn đồng minh cùng hàng.',
  voice: Object.freeze({ lobby: 'Gió không có hình, mực không có dấu… Ngươi định đánh vào đâu?', ultimate: 'Cửu Tiêu Vân Loạn!' }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/bach-y-van-phong/portrait-fcf4cd75.webp' }),
  iconId: 'splus.van_phong.ultimate', passiveName: 'Tiêu Dao Bất Nhiễm',
  passive: Object.freeze({ id: 'van_phong.passive', name: 'Tiêu Dao Bất Nhiễm', target: 'Bản thân / đồng minh cùng hàng',
    description: 'Vĩnh viễn +20% Né tránh và +15% Kháng khống chế. Né đòn thành công: hóa khói mực phản kích ngẫu nhiên 1 kẻ địch gây 60% sát thương và hồi 15 Nộ khí. Khi đồng minh cùng hàng nhận đòn chí mạng, đỡ bớt 30% sát thương (1 lần mỗi trận).',
    effects: ['+20% Né tránh', '+15% Kháng khống chế', 'Phản kích 60% khi né', 'Đỡ 30% chí mạng cho đồng minh cùng hàng'], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'van_phong.basic', name: 'Lạc Diệp Phong Trảm', description: 'Phóng luồng gió xoáy hòa khói mực vào mục tiêu, gây 100% sát thương phép. 30% gắn ấn Thất Phong 2 hiệp: −15% Tốc độ, −10% Tấn công.', target: 'Một địch', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'van_phong.skill', name: 'Lạc Diệp Phong Trảm', description: 'Alias hiển thị của đòn thường — Vân Phong không có Skill tiêu khí riêng.', target: 'Một địch', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'van_phong.ultimate', name: 'Cửu Tiêu Vân Loạn', description: 'Bão mực và lông vũ quét toàn bộ địch, 185% sát thương phép. 50% gây Mù Mịt 2 hiệp (35% đánh trượt); mục tiêu có ấn Thất Phong bị Câm Lặng 1 hiệp. Tạo Vân Phong Vực: đồng minh +20% Tốc độ, +15% Né tránh trong 2 hiệp.', target: 'Toàn bộ địch',
      effects: ['185% sát thương phép toàn địch', 'Mù Mịt 50%', 'Câm Lặng nếu có Thất Phong', 'Vân Phong Vực'], cost: 60, cooldown: 0 })
  })
});
