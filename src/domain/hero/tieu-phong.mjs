// Owner-approved probabilities and recipient-turn durations; normal wave damage/cost remain review defaults.
export const TIEU_PHONG_HERO=Object.freeze({
 id:'hero_splus_tieu_phong',key:'tieu_phong',number:null,catalogKind:'authored-extra',
 name:'Tiêu Phong',fullName:'Ngự Phong Công Tử — Tiêu Phong',rarity:'S+',element:'metal',elementName:'Kim Khí',role:'mystic',recommendedSlots:[3,4,5],weapon:'Thiết Phiến',
 profileVersion:'tieu-phong/2026-10-09-review',gender:'Nam',age:'Thanh niên',
 introduction:'Ngự Phong Công Tử dùng thiết phiến điều khiển ba đợt lốc xuyên hàng địch.',
 art:{status:'canvas-sprite-runtime-review',portrait:'assets/characters/tieu-phong/standing.webp',card:'assets/characters/tieu-phong/standing.webp',hudIcon:'assets/characters/tieu-phong/standing.webp',atlas:'assets/characters/tieu-phong/basic.webp',pending:[]},
 iconId:'splus.tieu_phong.ultimate',passiveName:'Thiết Phiến',
 passive:{id:'tieu_phong.passive',name:'Thiết Phiến',description:'Chưa bổ sung nội tại riêng.',effects:[],rules:{},cost:0,cooldown:0},
 actions:{skill:{id:'tieu_phong.skill',name:'Hô Phong',description:'Dùng cùng đòn đánh thường.',cost:0,cooldown:0},basic:{id:'tieu_phong.basic',name:'Hô Phong',description:'Lốc nhỏ chạy sát đất đến một mục tiêu.',target:'Một địch',cost:0,cooldown:0},
 ultimate:{id:'tieu_phong.ultimate',name:'Tam Điệp Phong Bạo',description:'Ba lốc chạy sát đất xuyên địch trước–sau cùng hàng. Lốc 1: 50% choáng 1 lượt. Lốc 2: 40% cấm hồi máu 2 lượt. Lốc 3: 30% chí mạng 200% ATK cơ bản. Kiểm tra riêng trên từng mục tiêu.',target:'Hai địch cùng hàng ngang',effects:['Ba lượt lốc','Choáng','Cấm hồi máu','Chí mạng'],rules:{waveMultiplier:1,stunChance:.5,stunTurns:1,antiHealChance:.4,antiHealTurns:2,criticalChance:.3,criticalMultiplier:2},cost:60,cooldown:0}}
});
