// Nguyệt Diệp — Võ Đang Kiếm Sư (owner kit 2026-10-20). Presentation lives in
// assets/characters/nguyet-diep/hero.json; rules live in splus-mechanics AUTHORED_HIT.nguyet_diep
// and the round-start Âm Dương Linh Kính hook. Owner said "Phong hoặc Ám" -> Âm Hồn ('soul').
export const NGUYET_DIEP_KIT = Object.freeze({
  id: 'hero_splus_nguyet_diep',
  key: 'nguyet_diep',
  passive: Object.freeze({ name: 'Âm Dương Linh Kính', allies: 2, debuffsPerAlly: 2, evasion: 0.15, evasionTurns: 1, healAtk: 0.6, controlResist: 0.3 }),
  basic: Object.freeze({ name: 'Thừa Phong Xuất Hồn', cost: 0, hits: 1, target: 'lane', multiplier: 1, speedDown: 0.15, armorDown: 0.1, turns: 2 }),
  ultimate: Object.freeze({ name: 'Nhân Kiếm Hợp Nhất', cost: 60, hits: 3, waveMultipliers: [1.0571, 0.5286, 0.2643], multiplier: 1.85, armorPierceOnBroken: 0.3, silenceChance: 0.4, silenceTurns: 1, allyRage: 100 })
});

export const NGUYET_DIEP_HERO = Object.freeze({
  id: 'hero_splus_nguyet_diep', key: 'nguyet_diep', number: null, catalogKind: 'authored-extra',
  name: 'Nguyệt Diệp', fullName: 'Nguyệt Diệp — Võ Đang Kiếm Sư', rarity: 'S+', element: 'soul', elementName: 'Âm Hồn', role: 'mystic',
  recommendedSlots: [3, 4, 5], weapon: 'Kiếm Võ Đang',
  profileVersion: 'nguyet-diep/2026-10-20-owner-kit', gender: 'Nam', age: 'Thiếu niên',
  introduction: 'Đệ tử Võ Đang xuất hồn cầm kiếm lướt xuyên địch, tay giữ Âm Dương Linh Kính thanh tẩy tà khí cho cả đội.',
  voice: Object.freeze({ lobby: 'Âm dương có đạo, kiếm ý tự thông.', ultimate: 'Nhân Kiếm Hợp Nhất!' }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/nguyet-diep/portrait-be8c9ab1.webp' }),
  iconId: 'splus.nguyet_diep.ultimate', passiveName: 'Âm Dương Linh Kính',
  passive: Object.freeze({ id: 'nguyet_diep.passive', name: 'Âm Dương Linh Kính', target: '2 đồng minh yếu nhất / đang bị khống chế',
    description: 'Đầu mỗi hiệp, Linh Kính xóa tối đa 2 hiệu ứng bất lợi cho 2 đồng minh đang bị khống chế hoặc ít máu nhất. Đồng minh được thanh tẩy +15% Né tránh 1 hiệp và hồi máu bằng 60% Công của Nguyệt Diệp. Bản thân vĩnh viễn kháng 30% khống chế.',
    effects: ['Thanh tẩy 2 đồng minh mỗi hiệp', '+15% Né tránh + hồi máu', 'Kháng khống chế 30%'], rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: 'nguyet_diep.basic', name: 'Thừa Phong Xuất Hồn', description: 'Hai hồn kiếm nối đuôi xuyên cả hàng địch (trước rồi sau), mỗi hồn nổ ở 1 địch: 100% sát thương phép, giảm 15% Tốc độ và 10% Giáp 2 hiệp.', target: 'Cả hàng địch đối diện', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: 'nguyet_diep.skill', name: 'Thừa Phong Xuất Hồn', description: 'Alias hiển thị của đòn thường — Nguyệt Diệp không có Skill tiêu khí riêng.', target: 'Một địch hàng trước', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: 'nguyet_diep.ultimate', name: 'Nhân Kiếm Hợp Nhất', description: 'Kiếm từ trời rơi lần lượt xuống vị trí 1-2-3-6-5-4, lặp 3 vòng, vòng sau bằng nửa vòng trước (tổng 185% sát thương phép); bỏ qua 30% phòng ngự địch đang bị giảm giáp; 40% Câm Lặng 1 hiệp. Linh Kính hồi 100 Nộ cho đồng minh gây nhiều sát thương nhất.', target: 'Toàn bộ địch',
      effects: ['185% sát thương phép toàn địch', 'Xuyên 30% phòng ngự địch bị giảm giáp', 'Câm Lặng 40%', '+100 Nộ cho đồng minh mạnh nhất'], cost: 60, cooldown: 0 })
  })
});
