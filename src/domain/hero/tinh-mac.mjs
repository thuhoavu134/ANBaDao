// Tịnh Mặc — Độ Hồn Đao Khách (owner kit 2026-10-21). Presentation lives in
// assets/characters/tinh-mac/hero.json; rules live in splus-mechanics AUTHORED_HIT.tinh_mac
// plus the Tâm Nhãn / U Hồn hooks (blind immunity, 50% evasion ignore, soul stacks).
// Owner said "Hệ Ám hoặc Thủy" -> Âm Hồn ('soul'). U Hồn counts enemies only (balance note).
export const TINH_MAC_KIT = Object.freeze({
  id: 'hero_splus_tinh_mac',
  key: 'tinh_mac',
  passive: Object.freeze({ name: 'Tâm Nhãn Tịnh Hồn', evasionIgnore: 0.5, maxStacks: 5, threshold: 0.7, armorPiercePerStack: 0.08, lifestealPerStack: 0.05 }),
  basic: Object.freeze({ name: 'Trảm Nghiệp Đoạn Hồn', cost: 0, hits: 1, target: 'front', multiplier: 1.1, healDown: 0.2, damageTaken: 0.15, turns: 2 }),
  ultimate: Object.freeze({ name: 'Phá Ấn: Hoàng Tuyền Đao Vực', cost: 60, hits: 1, multiplier: 2, trueDamagePerStack: 0.15, executeHp: 0.2, executeHpFull: 0.3, executeRage: 50 })
});

export const TINH_MAC_HERO = Object.freeze({
  id: 'hero_splus_tinh_mac', key: 'tinh_mac', number: null, catalogKind: 'authored-extra',
  name: 'Tịnh Mặc', fullName: 'Tịnh Mặc — Độ Hồn Đao Khách', rarity: 'S+', element: 'soul', elementName: 'Âm Hồn', role: 'mystic',
  recommendedSlots: [0, 1, 2], weapon: 'Đại Đao Phong Ấn',
  profileVersion: 'tinh-mac/2026-10-21-owner-kit', gender: 'Nam', age: 'Thanh niên',
  introduction: 'Đao khách bịt mắt không nhìn người sống mà nhìn nghiệp chướng; thanh đại đao quá tà ác nên phải dán bùa phong ấn, chỉ khi xé bùa mới chém thẳng vào linh hồn.',
  voice: Object.freeze({ lobby: 'Mắt ta đã mù, nhưng hồn ngươi thì ta thấy rõ.', ultimate: 'Phá Ấn — Hoàng Tuyền Đao Vực!' }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/tinh-mac/portrait-4b812b66.webp' }),
  iconId: 'splus.tinh_mac.ultimate', passiveName: 'Tâm Nhãn Tịnh Hồn',
  passive: Object.freeze({ id: 'tinh_mac.passive', name: 'Tâm Nhãn Tịnh Hồn', target: 'Bản thân',
    description: 'Miễn nhiễm 100% Mù / Giảm chính xác, đòn đánh bỏ qua 50% Né tránh. Mỗi khi một kẻ địch mất 30% máu (lần đầu) hoặc tử trận, nhận 1 tầng U Hồn (tối đa 5): mỗi tầng +8% Xuyên giáp, +5% Hút máu.',
    effects: ['Miễn nhiễm Mù', 'Bỏ qua 50% Né tránh', 'U Hồn: +8% Xuyên giáp, +5% Hút máu mỗi tầng (tối đa 5)'], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'tinh_mac.basic', name: 'Trảm Nghiệp Đoạn Hồn', description: 'Đao khí lửa xanh chém 1 địch hàng trước: 110% sát thương phép, gây Hồn Xiêu Phách Lạc 2 hiệp (giảm 20% hồi máu nhận vào, chịu thêm 15% sát thương từ phe ta).', target: '1 địch hàng trước', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'tinh_mac.skill', name: 'Trảm Nghiệp Đoạn Hồn', description: 'Alias hiển thị của đòn thường — Tịnh Mặc không có Skill tiêu hao riêng.', target: '1 địch hàng trước', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'tinh_mac.ultimate', name: 'Phá Ấn: Hoàng Tuyền Đao Vực', description: '200% sát thương toàn bộ địch. Tiêu hao toàn bộ U Hồn: mỗi tầng thêm 15% sát thương chuẩn bỏ qua khiên. Địch dưới 20% máu (30% khi đủ 5 tầng) bị Trảm Quyết kết liễu, hồi 50 Nộ (1 lần mỗi chiêu).', target: 'Toàn bộ địch',
      effects: ['200% sát thương toàn bộ địch', '+15% sát thương chuẩn mỗi tầng U Hồn', 'Trảm Quyết dưới 20% / 30% máu', '+50 Nộ khi kết liễu'], cost: 60, cooldown: 0 })
  })
});
