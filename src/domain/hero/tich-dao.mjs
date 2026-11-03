// Locked kit (owner-approved 2026-10-16): Basic Ảnh Bộ + Ultimate Tam Ảnh Đoạt Mệnh +
// passive Hoa Ấn. Damage numbers stay tunable; effects are the contract.
// Temporary avatar and missing SFX are tracked in art.pending.
export const TICH_DAO_HERO=Object.freeze({
 id:'hero_splus_tich_dao',key:'tich_dao',number:null,catalogKind:'authored-extra',
 name:'Tịch Dao',fullName:'Ảnh Sát Song Kiếm — Tịch Dao',rarity:'S+',element: 'soul', elementName: 'Hỏa',role:'duelist',recommendedSlots:[0,1,2],weapon:'Song Đao',
 profileVersion:'tich-dao/2026-10-16-locked-kit',gender:'Nữ',age:'Thanh niên',
 introduction:'Nữ sát thủ song kiếm: luồn qua tuyến trước, thoắt hiện cạnh hàng sau đặt dấu Hoa Ấn, rồi kích nổ bằng Tam Ảnh Đoạt Mệnh.',
 art:{status:'canvas-sprite-runtime-review',portrait:'assets/characters/tich-dao/avatar.webp',card:'assets/characters/tich-dao/avatar.webp',hudIcon:'assets/characters/tich-dao/avatar.webp',atlas:'assets/characters/tich-dao/basic.webp',pending:['avatar.webp tạm cắt từ frame idle 53 — portrait authored chờ owner','chưa có SFX authored cho basic/ultimate/hit']},
 iconId:'splus.tich_dao.ultimate',passiveName:'Hoa Ấn',
 passive:{id:'tich_dao.passive',name:'Hoa Ấn',description:'Đòn chém của Tịch Dao đặt 1 dấu Hoa Ấn lên mục tiêu (tối đa 3 dấu). Dấu cộng sát thương chiêu thức và bị Tam Ảnh Đoạt Mệnh tiêu thụ.',target:'Địch',effects:['Chém đặt 1 dấu Hoa Ấn','Tối đa 3 dấu'],rules:{maxMarks:3},cost:0,cooldown:0},
 actions:{basic:{id:'tich_dao.basic',name:'Ảnh Bộ',description:'Lướt xuyên tuyến trước, thoắt hiện cạnh địch hàng sau xa nhất, chém một nhát và đặt 1 dấu Hoa Ấn.',target:'Một địch (hàng sau xa nhất)',cost:0,cooldown:0},
 // Display-only alias required by the S+ hero contract (splusHeroConfig reads it);
 // combat blocks the skill slot for Tịch Dao — she fights with Basic+Ultimate+passive.
 skill:{id:'tich_dao.skill',name:'Ảnh Bộ',description:'Alias hiển thị của đòn Basic Ảnh Bộ — Tịch Dao không có Skill 1 tiêu khí riêng.',target:'Một địch (hàng sau xa nhất)',cost:0,cooldown:0},
 ultimate:{id:'tich_dao.ultimate',name:'Tam Ảnh Đoạt Mệnh',description:'Ba nhịp thoắt hiện chém 3 mục tiêu hàng sau (mỗi dấu Hoa Ấn trên mục tiêu cộng 35% sát thương nhịp đó rồi bị tiêu hao). Sau chuỗi: mưa kiếm xét địch ở cả hai hàng, kết liễu mục tiêu còn dưới 30% máu, kết liễu thành công chuyển sang mục tiêu kế tiếp, tối đa 2 mục tiêu.',target:'Ba mục tiêu hàng sau',effects:['Ba nhịp chém 3 mục tiêu hàng sau','Tiêu thụ dấu Hoa Ấn +35%/dấu','Mưa kiếm kết liễu dưới 30% máu, tối đa 2 mục tiêu'],rules:{strikeMultipliers:[1,1,1],markMultiplier:.35,maxMarks:3,executeHp:.30,executeMax:2},cost:60,cooldown:0}}
});

