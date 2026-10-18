export const KHAOS_HERO = Object.freeze({
  id: 'hero_splus_khaos',
  name: 'Khaos',
  shortName: 'Khaos',
  element: 'thuy',
  role: 'Pháp sư / Khống chế / Phù Lục Thủy Mặc',
  rarity: 'SSR',
  art: Object.freeze({
    portrait: 'assets/characters/khaos/avatar.webp',
  }),
  passive: Object.freeze({
    id: 'mac_nhan_phu_luc',
    name: 'Mặc Nhãn Phù Lục',
    description: 'Đòn đánh và chiêu thức găm ấn ký [Mặc Tích] lên kẻ địch (cộng dồn 3 tầng, giảm tốc và thủ). Tích đủ 3 tầng kích hoạt [Mặc Phược] gây Choáng 1 lượt.'
  }),
  actions: Object.freeze({
    basic: Object.freeze({
      id: 'basic',
      name: 'Điểm Mặc Tiễn',
      description: 'Phẩy nhẹ ngón tay phóng tia mực đen sắc bén về phía trước, gây 140% sát thương phép và tích 1 tầng [Mặc Tích].'
    }),
    ultimate: Object.freeze({
      id: 'ultimate',
      name: 'Vạn Tượng Thủy Mặc',
      description: 'Vung cây Đại Bút lông khổng lồ quét một vệt mực xé toạc không gian, triệu hồi sóng mực cuồn cuộn nhấn chìm toàn bộ kẻ địch, gây 300% sát thương phép AOE và kích nổ toàn bộ ấn Mặc Tích.'
    })
  })
});
