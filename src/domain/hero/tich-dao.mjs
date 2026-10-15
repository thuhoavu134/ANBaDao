// Review defaults: owner approved the effect design, not its probability/damage/cost.
// Temporary avatar and missing SFX are tracked in art.pending.
export const TICH_DAO_HERO=Object.freeze({
 id:'hero_splus_tich_dao',key:'tich_dao',number:null,catalogKind:'authored-extra',
 name:'Tích Đạo',fullName:'Ảnh Nhận Khách — Tích Đạo',rarity:'S+',element:'soul',elementName:'Âm Hồn',role:'duelist',recommendedSlots:[0,1,2],weapon:'Song Đao',
 profileVersion:'tich-dao/2026-10-15-review',gender:'Nữ',age:'Thanh niên',
 introduction:'Ảnh Nhận Khách song đao: lướt bóng nghĩa sĩ, ba nhát liên trảm tan vào bóng tối rồi hiện ra sau lưng địch.',
 art:{status:'canvas-sprite-runtime-review',portrait:'assets/characters/tich-dao/avatar.webp',card:'assets/characters/tich-dao/avatar.webp',hudIcon:'assets/characters/tich-dao/avatar.webp',atlas:'assets/characters/tich-dao/basic.webp',pending:['avatar.webp tạm cắt từ frame idle 53 — portrait authored chờ owner','chưa có SFX authored cho basic/ultimate/hit']},
 iconId:'splus.tich_dao.ultimate',passiveName:'Ảnh Bộ',
 passive:{id:'tich_dao.passive',name:'Ảnh Bộ',description:'Lần đầu mỗi trận xuống dưới 40% máu: tan vào bóng tối 1 lượt, kẻ địch ưu tiên mục tiêu khác.',target:'Bản thân',effects:['Tàng hình 1 lượt'],rules:{vanishBelow:.4,vanishTurns:1},cost:0,cooldown:0},
 actions:{skill:{id:'tich_dao.skill',name:'Ảnh Trảm',description:'Dùng cùng đòn đánh thường.',cost:0,cooldown:0},basic:{id:'tich_dao.basic',name:'Ảnh Trảm',description:'Lướt tới chém một địch, ưu tiên mục tiêu hàng sau yếu nhất.',target:'Một địch (hàng sau yếu nhất)',cost:0,cooldown:0},
 ultimate:{id:'tich_dao.ultimate',name:'Tịch Ảnh Liên Trảm',description:'Ba nhát liên trảm theo đúng phase của clip: 0.7× ATK vào hàng sau yếu nhất; 0.9× ATK vào địch ít máu nhất (khác nhát 1 nếu còn mục tiêu khác); 1.0× ATK vào địch ít máu còn sống, nhát cuối 35% chí mạng ×1.8. Hạ gục ít nhất 1 mục tiêu → tàng hình 1 lượt.',target:'Ba nhát đơn mục tiêu',effects:['Ba nhát liên trảm','Tan hình 2 lần','Tàng hình khi hạ gục'],rules:{strikeMultipliers:[.7,.9,1],criticalChance:.35,criticalMultiplier:1.8},cost:60,cooldown:0}}
});
