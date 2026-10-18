// Owner's seal companion kit, 18 October 2026. Numbers remain explicit tuning.
const basic={id:'be_an.basic',name:'Bắt Lấy Nè!',description:'Ném hải cẩu chạm hai lần, mỗi lần 70% Công. Hit cuối đặt một Dấu Chân Hải Cẩu, tối đa 3 tầng trong 2 lượt.',target:'Một địch',cost:0,cooldown:0,rules:{hits:2,multiplier:.7}};
export const BE_AN_HERO=Object.freeze({
 id:'hero_splus_be_an',key:'be_an',number:null,catalogKind:'authored-extra',name:'Bé An',fullName:'Bé An — Bạn Thân Hải Cẩu',rarity:'S+',element:'dream',elementName:'Hư Mộng',role:'mystic',recommendedSlots:[3,4,5],weapon:'Hải Cẩu Bông',profileVersion:'be-an/2026-10-18',gender:'Nữ',age:'Bé nhỏ',
 introduction:'Cô bé đeo kính cùng người bạn hải cẩu: hai cú ném tinh nghịch, ba lần triệu hồi và lời hứa luôn bảo vệ nhau.',
 art:{status:'authored-source24-review',portrait:'assets/characters/be-an/avatar.webp',card:'assets/characters/be-an/avatar.webp',hudIcon:'assets/characters/be-an/avatar.webp',atlas:'assets/characters/be-an/idle-0.webp'},
 iconId:'splus.be_an.passive',passiveName:'Không Được Bắt Nạt Bé!',
 passive:{id:'be_an.passive',name:'Không Được Bắt Nạt Bé!',target:'Bản thân và kẻ vừa tấn công',description:'Mỗi hành động địch gây mất máu cho bé cộng một Dỗi. Đủ 3 tầng: phản kích 180% Công, đặt 1 dấu và tạo khiên 15% Máu tối đa. Bạn Thân Không Bỏ Cuộc: một lần mỗi trận, ngăn đòn chí tử, hồi 35% Máu, xóa bất lợi, miễn khống chế tới hết lượt tiếp theo và đầy Nộ.',cost:0,cooldown:0,rules:{maxStacks:3,counter:1.8,shield:.15,revive:.35}},
 actions:{basic,skill:{...basic,id:'be_an.skill',description:'Bắt Lấy Nè! là đòn thường; không có kỹ năng tiêu Nộ riêng.'},ultimate:{id:'be_an.ultimate',name:'Hải Cẩu Ơi, Xử Đi!',description:'Ba lần hải cẩu đáp xuống toàn đội địch, mỗi lần 100% Công và thêm 1 dấu. Lần cuối kích nổ mỗi dấu thêm 40% Công, xuyên 40% Giáp; đủ 3 dấu gây đóng băng 1 lượt rồi tiêu thụ dấu.',target:'Toàn địch',cost:60,cooldown:0,rules:{hits:3,multiplier:1,markMultiplier:.4,armorPierce:.4}}}
});
