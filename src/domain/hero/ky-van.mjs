// Review defaults: owner approved the effect, not its probability/damage/cost.
export const KY_VAN_HERO=Object.freeze({
 id:'hero_splus_ky_van',key:'ky_van',number:null,catalogKind:'authored-extra',
 name:'Kỷ Vân',fullName:'Lôi Châm Sư — Kỷ Vân',rarity:'S+',element: 'metal', elementName: 'Kim',role:'mystic',recommendedSlots:[3,4,5],weapon:'Lôi Châm',
 profileVersion:'ky-van/2026-10-09-review',gender:'Nam',age:'Thanh niên',
 introduction:'Lôi Châm Sư điều khiển phi châm dẫn sét, tạo châm trận trên đội hình địch.',
 art:{status:'canvas-sprite-runtime-review',portrait:'assets/characters/ky-van/avatar.webp',card:'assets/characters/ky-van/avatar.webp',hudIcon:'assets/characters/ky-van/avatar.webp',atlas:'assets/characters/ky-van/basic.webp',pending:[]},
 iconId:'splus.ky_van.ultimate',passiveName:'Lôi Châm',
 passive:{id:'ky_van.passive',name:'Lôi Châm',description:'Chưa bổ sung nội tại riêng.',effects:[],rules:{},cost:0,cooldown:0},
 actions:{skill:{id:'ky_van.skill',name:'Phi Châm',description:'Dùng cùng đòn đánh thường.',cost:0,cooldown:0},basic:{id:'ky_van.basic',name:'Phi Châm',description:'Gọi một cột sét từ trên cao giáng xuống mục tiêu.',target:'Một địch',cost:0,cooldown:0},
 ultimate:{id:'ky_van.ultimate',name:'Thiên Lôi Châm Trận',description:'Gây sát thương toàn bộ địch. Mỗi mục tiêu có 30% tỷ lệ bị choáng và cấm hồi máu đến hết lượt hành động kế tiếp. Các đợt sét dùng chung một lần kiểm tra tỷ lệ trên mỗi mục tiêu. Thông số đang thử cân bằng.',target:'Toàn bộ địch',effects:['Sét diện rộng','Choáng','Cấm hồi máu'],rules:{multiplier:1.2,stunChance:.3,recipientTurns:1},cost:60,cooldown:0}}
});

