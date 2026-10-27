// Kit idea owner-approved 2026-10-16; every numeric below is a REVIEW DEFAULT
// (ĐỀ XUẤT), not owner-locked balance. Display name "Hồng Thương" is a
// TECHNICAL TEMP NAME until the owner picks the official one (do not treat
// "Triệu Kình" or any past suggestion as official).
export const HONG_THUONG_HERO=Object.freeze({
 id:'hero_splus_hong_thuong',key:'hong_thuong',number:null,catalogKind:'authored-extra',
 name:'Hồng Thương',fullName:'Hồng Y Thương Nữ — Hồng Thương',rarity:'S+',element:'metal',elementName:'Kim Khí',role:'striker',recommendedSlots:[1,2],weapon:'Xích Thương',
 profileVersion:'hong-thuong/2026-10-16-idea-locked',gender:'Nữ',age:'Thanh niên',
 introduction:'Nữ đấu sĩ thương cận chiến: đâm ba nhát mở Sơ Hở, đòn kế tiếp phá giáp xé khiên, và Kinh Hoồng Phá Trận càn qua cả hai hàng địch.',
 art:{status:'canvas-sprite-runtime-review',portrait:'assets/characters/hong-thuong/avatar.webp',card:'assets/characters/hong-thuong/avatar.webp',hudIcon:'assets/characters/hong-thuong/avatar.webp',atlas:'assets/characters/hong-thuong/basic.webp',pending:['tên hiển thị tạm "Hồng Thương" chờ owner','avatar.webp tạm cắt từ idle frame 21','ATK clip chỉ có 2 cú đâm riêng biệt — hit2+hit3 hiện map vào cú đâm mạnh (chờ duyệt)']},
 voice:Object.freeze({lobby:'Thương đỏ đã mài sẵn. Chỗ nào có khiên, ta sẽ mở.'}),
 iconId:'splus.hong_thuong.ultimate',passiveName:'Phá Trận',
 passive:{id:'hong_thuong.passive',name:'Phá Trận',description:'Mỗi nhát thương trúng hợp lệ cộng 1 tầng Sơ Hở lên địch đó (tối đa 3). Đủ 3 tầng địch Lộ Điểm Yếu: nhát thương kế tiếp của nữ tướng tiêu thụ 3 tầng để bỏ qua một phần giáp và gây thêm sát thương lên khiên. Nhát tạo đủ tầng 3 không tự tiêu thụ.',target:'Địch',effects:['+1 Sơ Hở mỗi nhát trúng','Tối đa 3 tầng','Lộ Điểm Yếu: nhát kế tiếp bỏ giáp + thêm sát thương khiên'],rules:{maxStacks:3,soHoTurns:3,armorPierce:.35,shieldBonus:.5},cost:0,cooldown:0},
 actions:{basic:{id:'hong_thuong.basic',name:'Tam Điểm Phá Giáp',description:'Áp sát một địch, đâm ba nhát theo nhịp nhanh–nhanh–mạnh. Mỗi nhát trúng hợp lệ đặt 1 Sơ Hở (tối đa 3). Không tiêu nộ.',target:'Một địch (tuyến đối diện)',cost:0,cooldown:0,rules:{hitMultipliers:[.4,.4,.8],maxStacks:3}},
 // Display-only alias required by the S+ hero contract (splusHeroConfig reads it);
 // combat blocks the skill slot — she fights with Basic+Ultimate+passive.
 skill:{id:'hong_thuong.skill',name:'Tam Điểm Phá Giáp',description:'Alias hiển thị của đòn Basic Tam Điểm Phá Giáp — nữ tướng không có Skill 1 tiêu khí riêng.',target:'Một địch (tuyến đối diện)',cost:0,cooldown:0},
 ultimate:{id:'hong_thuong.ultimate',name:'Kinh Hoồng Phá Trận',description:'Lần lượt áp sát TẤT CẢ địch còn sống ở cả hai hàng, mỗi địch nhận một cụm ba nhát đâm. Kết thúc chuỗi là cú Hồi Mã Thương: đâm bồi vào địch có tỷ lệ khiên cao nhất (hết khiên thì giáp cao nhất), chọn lại ngay trước cú đâm. Sau đó trở về đội hình và trả lượt.',target:'Tất cả địch còn sống (cả hai hàng)',effects:['Ba đợt, mỗi đợt ba nhịp chọc xuống toàn bộ địch','Hồi Mã Thương chọn khiên cao nhất rồi mới giáp','Cả hai hàng, chọn lại ngay trước cú cuối'],rules:{hitMultipliers:[.4,.4,.8],clusterMultipliers:[.09,.10,.11,.10,.11,.12,.13,.15,.29],finaleMultiplier:1.2,maxStacks:3,armorPierce:.35,shieldBonus:.5},cost:60,cooldown:0}}
});
