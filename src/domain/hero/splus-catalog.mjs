export const SPLUS_SCHEMA = 'luc-than-splus42/v1';
export const SPLUS_ELEMENTS = Object.freeze({metal:'Kim Khí',soul:'Âm Hồn',water:'Thương Thủy',fire:'Viêm Hỏa',wood:'Mộc Tinh',dream:'Hư Mộng'});
// Numeric omissions are review defaults, not owner-approved balance. Explicit
// percentages in the authored descriptions are implemented by splus-mechanics.
export const SPLUS_REVIEW_DEFAULTS = Object.freeze({skillCooldown:2,skillCost:25,ultimateCost:60,basicRage:15,duration:2,markDuration:3,skillMultiplier:1.4,singleUltimateMultiplier:2.4,aoeUltimateMultiplier:1.2});
const rows = [
  [1,'co_trong','Cơ Trọng','metal','support',[5],'Bánh Răng Kim Cương','Mỗi hành động đồng minh tích 1 bánh răng, +5% giáp cả đội.','Khiên hàng trước bằng 20% HP tối đa.','Toàn đội +40 Nộ và phản 20% sát thương trong 2 hiệp.','Cỗ Cơ Quan Khí Đồng'],
  [7,'cuong_dong','Cường Đồng','metal','guardian',[1,2],'Đồng Thuẫn Bất Hoại','Giảm 25% sát thương; phản 30% sát thương nhận vào.','Choáng hàng trước địch 1 hiệp.','Khiêu khích toàn địch 2 hiệp và +60% giáp.','Đông Sơn Đại Đồng Thuẫn'],
  [13,'lac_an','Lạc An','metal','ranger',[4,6],'Thần Xạ Mục Tiêu','Mỗi mũi tên +4 điểm % chí mạng, tối đa 40%, hết trận reset.','Xuyên 30% giáp mục tiêu đối diện.','7 tên vào tướng yếu nhất hàng sau; chắc chắn bạo kích.','Kim Cổ Thần Nỏ'],
  [19,'hac_pha','Hạc Phá','metal','striker',[2,3],'Cuồng Nộ Chim Lạc','Dưới 50% HP: +30% tốc đánh, 20% hút máu.','Quét hàng trước, giảm 25% giáp.','Chém bộc phát hàng ngang địch.','Lạc Điêu Kim Rìu'],
  [25,'thiet_lanh','Thiết Lãnh','metal','guardian',[1,2],'Thép Nguội','Giảm 20% sát thương; kẻ tấn công giảm 20% tốc đánh.','Tước Khí tướng trước đối diện 1 hiệp.','Phá toàn bộ khiên hàng trước và choáng 1 hiệp.','Bách Luyện Hắc Thiết Kiềm'],
  [31,'minh_toa','Minh Tỏa','metal','guardian',[1,2],'Kim Thiết Trấn Khẩu','Địch Công cao nhất xuất chiêu: giảm 25% uy lực, phản 20% sát thương.','Phá khiên và cấm nhận khiên 2 hiệp.','Khóa chủ lực hàng sau: câm lặng tuyệt đối 2 hiệp và -50 Nộ.','Càn Khôn Đồng Khóa & Phá Ma Đại Thược'],
  [37,'thiem_ngan','Thiềm Ngân','metal','healer',[5],'Ngân Lưu Tố Thể','Hồi máu kèm giáp; phần hồi dư chuyển thành khiên bạc.','Hồi 22% max HP và +20% giáp cho 2 tiền quân.','Hồi 35% max HP cả đội, +30% kháng hiệu ứng; hộ mệnh hồi 20% HP khi chí tử.','Ngân Đe & Kim Búa'],
  [2,'linh_dong','Linh Đồng','soul','mystic',[4],'Oan Linh Tỏa','Đòn đánh đặt ấn giảm 15% hồi máu.','Cấm di chuyển tướng đối diện 1 hiệp.','Quét toàn địch, câm lặng 1 hiệp.','Lạc Âm Song Chuông'],
  [8,'tieu_hon','Tiêu Hồn','soul','duelist',[6],'Đoạt Phách Khúc','Đánh thường cướp tối đa 10 Nộ sang bản thân.','Đơn thể Âm Hồn; câm lặng 1 hiệp.','Dồn sát thương chủ lực địch, đưa Nộ về 0.','Cốt Tiêu U Minh'],
  [14,'thach_kinh','Thạch Kinh','soul','guardian',[1,2],'Oán Khí Cột Đá','Nhận 5 đòn: tiêu tầng, hồi 15% HP đã mất.','Giảm 30% Công hàng trước địch.','Toàn đội +50% kháng phép 2 hiệp.','Trấn Hồn Thạch Trụ'],
  [20,'han_nuong','Hàn Nương','soul','mystic',[4,5],'Tiền Trảm Hàn Khí','Đánh trúng giảm 10% tốc chạy và tốc đánh.','Gỡ buff của 2 kẻ địch.','Đa tầng toàn địch; giảm 40% giáp.','Đoạn Hồn Kim Kéo'],
  [26,'vong_co','Vọng Cơ','soul','support',[5,6],'Vong Niệm','Kỹ năng địch tăng 1 hiệp hồi chiêu.','Câm lặng 1 hiệp và -20 Nộ.','Nộ 2 chủ lực địch về 0; giảm 30% sát thương phe địch 2 hiệp.','Vong Niệm Mộc Trượng'],
  [32,'co_nuong','Cổ Nương','soul','mystic',[4,6],'Trùng Hồn Ký Sinh','Tướng max HP cao nhất địch mất 6% max HP/hiệp; nhận phản chấn thành hồi máu.','Xuyên hàng trước; giảm 40% giáp.','Sát thương % max HP toàn địch; 30% sát thương hồi chia đều đồng đội.','Cửu Xà Cốt Cầm'],
  [40,'muc_chieu','Mục Chiêu','soul','healer',[5],'Hộ Mệnh Hồn Đăng','Một lần/trận cứu đồng minh chí tử ở 1 HP, miễn tử 1 hiệp và hồi 15%.','Hồi 18% max HP cho 3 đồng minh thấp nhất, xóa nguyền rủa.','Hồi 35% max HP toàn đội, cân bằng tỷ lệ HP và gỡ câm lặng.','Trúc Trượng Lạc Linh & Chiêu Hồn Bát'],
  [3,'thuy_co','Thủy Cơ','water','healer',[5],'Lạc Thủy Gia Tốc','Mỗi hành động +10% tốc đánh cho đồng minh liền kề.','Hồi 15% max HP cho tiền quân.','Gỡ toàn bộ debuff, +25% tốc đánh cả đội 2 hiệp.','Thủy Vân Tơ Lụa'],
  [9,'ha_lang','Hà Lãng','water','mystic',[4],'Ba Động Đập Trùng','Đòn thường lan sang 1 địch kề mục tiêu.','Đẩy lùi hàng trước địch.','Sóng thần toàn địch, giảm 30% Công.','Hải Loa Thần Khí'],
  [15,'giang_quan','Giang Quân','water','guardian',[1,2],'Thiết Cọc Trấn Thủy','Giảm 20% sát thương cận chiến.','Hất tung tướng đối diện 1 giây.','Sát thương và cấm di chuyển tiền quân 2 hiệp.','Bạch Đằng Hắc Thiết Cọc'],
  [21,'thuy_ngoc','Thủy Ngọc','water','support',[5,6],'Linh Châu Tụ Nộ','Dùng kỹ năng: +15 Nộ cho đồng minh Công cao nhất.','Khiên nước cho chủ lực, khiên vỡ nổ gây sát thương.','Hồi 20% max HP và +30 Nộ cho hậu quân.','Thủy Tinh Châu'],
  [27,'hai_phong','Hải Phong','water','striker',[2,3],'Nộ Kình Hộ Thể','Chặn phần đòn vượt 20% max HP; +25% Công, 20% hút máu 2 hiệp.','Kéo chủ lực hậu quân lên trước, choáng 1 hiệp.','Quét toàn địch, giảm 40% giáp.','Kình Lực Tam Xoa Kích & Lưới Chì'],
  [35,'tram_chau','Trầm Châu','water','guardian',[1,2],'Bọt Châu Kháng Bạo','Bản thân và 2 hậu quân giảm 50% sát thương bạo kích; chặn crit tăng giáp.','Bong bóng cho đồng minh thấp nhất: giảm 25% damage, miễn crit/chảy máu 2 hiệp.','Khiên 30% max HP cả đội; 50% damage nhận chuyển thành Nộ; -35 điểm % crit địch.','Song Hạp Xà Cừ Khiên'],
  [38,'da_xoa','Dạ Xoa','water','duelist',[3,4],'Huyết Kình Liệp Sát','Nhắm hậu quân yếu nhất; dưới 50% HP: +35 điểm % crit và +50% crit damage.','Chém X hậu quân yếu nhất; giảm 30% hồi Nộ.','Burst Chuẩn bỏ qua khiên/gánh hộ; giết mục tiêu tàng hình 1 hiệp.','Kình Xỉ Cốt Dao'],
  [4,'nung','Nung','fire','guardian',[1,2],'Lò Than Bốc Hỏa','Kẻ đánh nhận Thiêu Đốt 3% max HP mỗi hiệp.','Đánh tiền quân, choáng 1 mục tiêu.','Tiền quân ta +40% giáp; thiêu đốt địch lân cận.','Bát Tràng Hỏa Gốm Bình'],
  [10,'hoa_tieu','Hỏa Tiêu','fire','ranger',[4,6],'Pháo Hoa Mù Mắt','Đánh thường lan 30% sang tối đa 2 ô kề.','Chủ lực địch giảm 30% chính xác.','Tên lửa liên hoàn sát thương Viêm Hỏa toàn địch.','Thần Cơ Hỏa Tiễn Ống'],
  [16,'hoa_khieu','Hỏa Khiêu','fire','support',[5],'Than Hồng Cuồng Nhiệt','Đồng minh đánh địch bị burn: +15 điểm % crit.','Hai đồng minh kề bên +20% Công.','Hai đồng minh Công cao nhất đánh thường hỗ trợ vào chủ lực địch.','Song Đoạn Hỏa Côn'],
  [22,'cuu_tinh','Cửu Tính','fire','ranger',[4,6],'Nợ Máu','Đánh trúng đặt Nợ Máu: tối đa 5 ×4% crit damage nhận; đủ 5 choáng 1 hiệp.','Chuẩn vào hậu quân; cấm khiên 2 hiệp.','AoE, nổ Nợ Máu và hút 20% damage thành HP bản thân.','Xích Hỏa Cửu Toán'],
  [28,'hoa_bai','Hỏa Bài','fire','mystic',[4,5],'Bột Lửa Lưu Huỳnh','Đánh trúng đặt độc hỏa 4% max HP/hiệp và giảm 25% hồi máu.','Quét tiền quân, nứt giáp và giảm 30% chính xác 2 hiệp.','3 nhịp AoE, choáng 1 hiệp mục tiêu đang thiêu đốt.','Xích Hỏa Chày & Ma Nham Cối'],
  [34,'hac_dao','Hắc Đao','fire','striker',[2,3],'Vết Thương Sâu','Đánh trúng: giảm 80% heal, chảy máu; 50% heal từ ngoài còn lại đổi thành Chuẩn.','Giảm 40% giáp và cấm khiên 2 hiệp.','Chém tướng HP cao nhất; cấm heal 100% 2 hiệp, lan tối đa 4 ô quanh.','Song Trảm Cốt Đao & Móc Treo Thịt'],
  [41,'hoa_duc','Hỏa Dực','fire','healer',[5],'Đan Sa Tái Sinh','50% damage Thiêu Đốt trên địch hồi đồng minh thấp nhất.','Hai chủ lực hậu quân +20% Công, +20 Nộ; buff 2 hiệp.','Hồi 30% max HP toàn đội, +25 điểm % crit; kích nổ burn địch thành hồi phục.','Chu Sa Đan Hồ & Xích Đồng Phất Trần'],
  [5,'mien_nuong','Miên Nương','wood','healer',[5],'Hương Hoa Nhài','Mỗi hiệp hồi 5% max HP đồng minh thấp nhất.','Gỡ 1 debuff trên mỗi tiền quân.','Hồi 25% max HP và +20% kháng hiệu ứng cả đội 2 hiệp.','Bách Thảo Hoa Lam'],
  [11,'tram_tue','Trầm Tuệ','wood','mystic',[4],'Trầm Mê Giảm Lực','Kẻ tấn công giảm 15% Công 2 hiệp.','Ngủ 1 địch, mất lượt nếu chưa bị đánh thức.','Toàn địch -30% Công và chậm 40% thanh hành động.','Trầm Hương Huân Lư'],
  [17,'hac_hoa','Hạc Hoa','wood','mystic',[6],'Gai Mây Siết Thịt','Đánh trúng quấn gai, mất 4% max HP mỗi hiệp.','Trói tiền quân 1 hiệp, cấm đánh thường.','Quét tiền quân; cấm hồi máu 2 hiệp.','Kim Cương Mộc Tiên'],
  [23,'tam_nuong','Tằm Nương','wood','guardian',[2,3],'Kén Vàng Hộ Thể','Đầu trận: bản thân và đồng minh thấp HP nhất chặn 2 hit đầu, +30% giáp.','Hai tiền quân địch cấm di chuyển, -20% Công 2 hiệp.','Trói toàn trận; tiền quân tê liệt 1 hiệp; hồi cả đội 25% max HP.','Bách Niên Mộc Thoi'],
  [29,'son_cuong','Sơn Cương','wood','striker',[2,3],'Chảy Máu Mủ Sơn','Chảy máu 4 tầng chuyển Nhựa Sơn: -30% giáp, +20 điểm % crit nhận.','Chém cột dọc, +40 điểm % crit, chảy máu nặng 2 hiệp.','Bão gai cột đối diện; hạ gục thì tái kích hoạt tối đa 1 lần.','Tróc Mộc Liêm Đao'],
  [33,'tue_y','Tuệ Y','wood','healer',[5],'Nam Dược Thần Hiệu','Đồng minh dưới 30% HP: cứu cấp 25% max HP, miễn CC 1 hiệp; heal gỡ 1 debuff.','Hồi 20% max HP cho 3 người thấp nhất; HoT 6% ×2 hiệp.','Hồi cả đội 40%, gỡ mọi debuff; hồi sinh 1 người 50% HP/50 Nộ, 1 lần/trận.','Bách Thảo Dược Tráp & Cửu Chuyển Ngân Châm'],
  [42,'mang_xa','Mãng Xà','wood','ranger',[4,6],'Mãng Độc Tê Liệt','Độc 5% max HP/hiệp; 5 tầng giảm 30% tốc đánh và lây ô cạnh.','3 mục tiêu ngẫu nhiên khác nhau: phá khiên, -25% giáp 2 hiệp.','Mưa tên toàn địch; nổ mọi độc; 40% tỷ lệ hụt 2 hiệp.','Cửu Tiễn Độc Mộc Nỏ'],
  [6,'khaos','Khaos','dream','duelist',[3],'Ảnh Ảo Hư Không','Đầu trận có phân thân nhận 50% damage thay bản thân.','Dịch chuyển 1 địch sang slot ngẫu nhiên khác.','3 phân thân chém toàn địch, sát thương Chuẩn.','Vô Ảnh Hư Trúc Phiến'],
  [12,'kinh_nuong','Kính Nương','dream','support',[5],'Gương Soi Phản Pháo','25% tỷ lệ phản đòn đánh thường.','Làm mù 1 chủ lực địch 1 hiệp.','Toàn đội phản 35% damage kỹ năng 1 hiệp.','Chiếu Mộng Kính'],
  [18,'hoi_anh','Hồi Ảnh','dream','mystic',[4],'Rối Hạp Loạn Mộng','Mỗi 2 hiệp hoán đổi 1 tiền quân và 1 hậu quân địch ngẫu nhiên.','Đòn kế của mục tiêu tấn công đồng minh của nó.','Xáo trộn toàn đội địch, choáng ngẫu nhiên 2 mục tiêu.','Huyễn Mộng Rối Hạp'],
  [24,'van_phap','Vân Pháp','dream','support',[5],'Lạc Mộng Chuông Khiên','Mộng Khiên phản 1 khống chế kế tiếp về người thi triển.','Cướp buff Công/giáp của 2 địch, chuyển đồng minh 2 hiệp.','Gỡ mọi debuff; mỗi debuff hồi 5% HP; hất tung toàn địch 1 giây.','Vạn Vân Mộng Lọng'],
  [30,'cuu_trieu','Cửu Triều','dream','mystic',[5],'Thời Không Nhịp Điệu','Tầng tăng Công/crit; từ 8 tầng đánh Chuẩn và đốt 6% HP. Miễn tử 1 lần hồi 35%, bị silence/hard CC thì vô hiệu.','Nón quét tiền quân lan 1 hậu quân; gỡ 1 buff và +25 Nộ.','9 nhịp toàn địch; giết nhận ngay lượt thêm, tối đa 1 lần/hiệp.','Cửu Long Phá Hư Cổ'],
  [36,'thach_mong','Thạch Mộng','dream','guardian',[1,2],'Hư Giới Hấp Kình','Gánh 30% damage đồng minh; tự giảm 35% damage, tích đủ gánh đẩy tiền quân.','Khiêu khích tiền quân 2 hiệp, cướp mỗi địch 15 Nộ.','Khiên 35% max HP cả đội; 30% damage đã gánh thành Chuẩn lên toàn địch.','Nghê Thần Hư Không Thuẫn'],
  [39,'to_linh','Tố Linh','dream','mystic',[4,6],'Mực Mộng Định Thân','Mực Mộng giảm 20% kháng hiệu ứng; 3 tầng cấm hành động 1 hiệp.','Đẩy tiền quân nửa ô, -30% tốc đánh 2 hiệp.','Toàn địch đóng băng thời gian 1 hiệp.','Càn Khôn Họa Quyển & Bách Linh Mặc Bút']
];

export const SPLUS_HEROES = Object.freeze(rows.map(([number,key,name,element,role,slots,passiveName,passive,skill,ultimate,weapon])=>Object.freeze({
  id:`hero_splus_${key}`,key,number,name,rarity:'S+',element,elementName:SPLUS_ELEMENTS[element],role,
  recommendedSlots:Object.freeze(slots.map(slot=>slot-1)),weapon,
  art:Object.freeze({status:'awaiting-authored-assets',facing:'three-quarter-right',feet:'flat-clean-floor',portrait:null,atlas:null}),
  iconId:`splus.${key}.passive`,passiveName,
  actions:Object.freeze({basic:Object.freeze({id:`${key}.basic`,name:'Đánh thường',description:'Đòn đánh thường kích hoạt nội tại khi trúng.',cost:0}),skill:Object.freeze({id:`${key}.skill1`,name:`${name} · Kỹ năng 1`,description:skill,cost:25,cooldown:2}),ultimate:Object.freeze({id:`${key}.ultimate`,name:`${name} · Tuyệt kỹ`,description:ultimate,cost:60,cooldown:0})}),
  passive:Object.freeze({id:`${key}.passive`,name:passiveName,description:passive}),
  reviewDefaults:SPLUS_REVIEW_DEFAULTS
})));
export const SPLUS_HERO_BY_ID = Object.freeze(Object.fromEntries(SPLUS_HEROES.map(hero=>[hero.id,hero])));
export function getSplusHero(id) { return SPLUS_HERO_BY_ID[String(id)] || null; }

export function validateSplusCatalog(heroes=SPLUS_HEROES) {
  const errors=[];const ids=new Set();const numbers=new Set();
  for(const h of heroes){
    if(ids.has(h.id))errors.push(`DUPLICATE_ID:${h.id}`);ids.add(h.id);
    if(numbers.has(h.number))errors.push(`DUPLICATE_NUMBER:${h.number}`);numbers.add(h.number);
    if(!SPLUS_ELEMENTS[h.element])errors.push(`UNKNOWN_ELEMENT:${h.id}`);
    if(!h.recommendedSlots.length||h.recommendedSlots.some(s=>!Number.isInteger(s)||s<0||s>5))errors.push(`INVALID_SLOT:${h.id}`);
    if(!h.passive?.description||['basic','skill','ultimate'].some(a=>!h.actions[a]?.description))errors.push(`INCOMPLETE_KIT:${h.id}`);
  }
  if(heroes.length!==42)errors.push('EXPECTED_42_HEROES');
  for(const element of Object.keys(SPLUS_ELEMENTS))if(heroes.filter(h=>h.element===element).length!==7)errors.push(`EXPECTED_7:${element}`);
  return {ok:!errors.length,errors,count:heroes.length};
}
