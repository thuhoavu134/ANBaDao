(() => {
  if (typeof document === 'undefined' || !document.body) return;

  // ===== AN BÁ ĐẠO — cốt truyện v2 (owner duyệt 09/11) =====
  // AN, 8 tuổi, đi vào Cõi Mơ tìm Ba. Ba là Người Gác Mộng.
  // Câu kết do anh Cường Đức viết — KHÔNG sửa:

  const CHAPTERS = [
    { name: 'Trấn Đình Làng', desc: 'Ba "đi công tác" không về. AN ôm bông hải cẩu trốn nhà đi tìm Ba, tiện làm Minh chủ võ lâm luôn.' },
    { name: 'Rừng Trúc Lăng Gia', desc: 'Bốn anh em họ Lăng cãi nhau ai làm anh cả. Hắc Liên Giáo thì đã bắt sư phụ của họ.' },
    { name: 'Bến Sông Nguyệt', desc: 'Thủy Trại Hắc Liên chiếm bến sông. AN muốn qua sông, nhưng AN không biết bơi.' },
    { name: 'Núi Huyền Thuật', desc: 'Thầy Mo bói rằng bên cạnh AN có một vì sao rất sáng. AN bảo: con biết, là con.' },
    { name: 'Ải Cao Thủ', desc: 'Năm cao thủ chặn ải, không phục một đứa 8 tuổi. Nhưng cứ thấy Bạch Diện là lùi ba bước.' },
    { name: 'Hắc Liên Đài', desc: 'Giáo chủ Khaos đợi trên đài. Mười năm trước, chỉ một người từng đánh lui hắn: Vô Danh Kiếm.' }
  ];

  const AN_NPC = { name: 'AN', col: '#a8320c', emblem: '' };
  const BA_NPC = { name: 'Ba', col: '#2f3a5a', emblem: '' };
  const AN_ENDING_LINE = 'Không ai trên thế giới này yêu thương con gái bằng ba của cô ấy.';

  // Tên NPC/boss trong kịch bản gốc -> tên giang hồ.
  const NPC_NAMES = {
    narrator: 'Người Kể Chuyện',
    mob_sale: 'Đệ Tử Hắc Liên',
    boss_chungcu: 'Sơn Tặc Đầu Đảng',
    boss_sep_tong: 'Hộ Pháp Ba Đầu',
    boss_cua: 'Thủy Trại Chúa',
    boss_giam_doc: 'Hương Chủ Luyện Đan',
    boss_ban_the: 'Thiên Ảnh Hắc Liên',
    boss_nguoi_gac_mong: 'Khaos · Giáo Chủ Hắc Liên'
  };

  // Tên quái trong trận -> tên giang hồ (quái chưa có trong bảng giữ nguyên).
  const FOE_NAMES = {
    'Quái Khuyến Mãi 50%': 'Đệ Tử Hắc Liên',
    'Chung Cư Mất Ngủ': 'Sơn Tặc Đầu Đảng',
    'Email Chưa Đọc': 'Đệ Tử Hắc Liên',
    'Email GẤP!!!': 'Ám Khí Hắc Liên',
    'Thư Rác Khổng Lồ': 'Trúc Yêu Khổng Lồ',
    'Báo Cáo Sống': 'Hình Nhân Rơm',
    'Biểu Đồ Gãy': 'Hình Nhân Gãy Tay',
    'Cột KPI': 'Cọc Gỗ Luyện Công',
    'Thư Ký Bóng': 'Ảnh Vệ Hắc Liên',
    'Sếp Tổng Ba Đầu': 'Hộ Pháp Ba Đầu',
    'Lịch Họp Dày Đặc': 'Trận Đồ Hắc Liên',
    'Vỏ Sò Rỗng': 'Thủy Tặc',
    'Ốc Mượn Hồn Chung Cư': 'Thuyền Trưởng Thủy Tặc',
    'Thuỷ Thủ Sương': 'Thủy Quỷ Sương',
    'Mỏ Neo Oán': 'Mỏ Neo Hắc Liên',
    'Tàu Ma Nghiêng': 'Thuyền Ma',
    'Càng Trái': 'Tả Hộ Vệ',
    'Càng Phải': 'Hữu Hộ Vệ',
    'Cua Hoàng Đế': 'Thủy Trại Chúa',
    'Ngai Triều Dâng': 'Ngai Thủy Trại',
    'Hộp Mơ Sổng Chuồng': 'Cương Thi Giấy',
    'Máy Dán Nhãn': 'Phù Chú Sống',
    'Tay Máy Xếp Hộp': 'Lò Đan Biết Đi',
    'Quản Lý Ca Đêm': 'Đạo Đồng Hắc Liên',
    'Giám Đốc Máy Ấp Mơ': 'Hương Chủ Luyện Đan',
    'Bản Thể Bị Quên': 'Thiên Ảnh Hắc Liên',
    'Quái KM 50%': 'Đệ Tử Hắc Liên',
    'Ô Cửa Mất Ngủ': 'Sơn Tặc Canh Đèo',
    'Bóng Mộng': 'Bóng Hắc Liên',
    'Bóng Mộng Lớn': 'Bóng Hắc Liên Lớn',
    'Camera Giám Sát': 'Mắt Phù Canh Lò',
    'Loa Nội Bộ': 'Chuông Đồng Báo Động',
    'Máy Ấp Mơ': 'Lò Đan Hắc Liên',
    'Tay Máy Bốc Xếp': 'Thiết Nhân Khuân Đan',
    'Băng Chuyền Chính': 'Đan Đỉnh Chính',
    'Bánh Kem Nguội Lạnh': 'Kiếm Khách Vô Danh',
    'Bong Bóng Xịt Hơi': 'Đao Khách Say Rượu',
    'Nến Không Ai Thổi': 'Đèn Lồng Ma',
    'Ghế Trống Xếp Vòng': 'Trận Cọc Mai Hoa',
    'Phong Bì Ố Vàng': 'Chiến Thư Ố Vàng',
    'Con Tem Lạc Thời': 'Ấn Tín Giả',
    'Dòng Tái Bút Dang Dở': 'Bí Kíp Rách',
    'Mây Cuộn Canh Cổng': 'Hộ Vệ Mây Đen',
    'Sét Khô': 'Lôi Vệ Hắc Liên',
    'Cổng Gió Nghịch': 'Phong Vệ Hắc Liên',
    'Cánh Tay Trái Bảng Điều Khiển': 'Tả Sứ Hắc Liên',
    'Cánh Tay Phải Bảng Điều Khiển': 'Hữu Sứ Hắc Liên',
    'Sương Mơ': 'Sương Độc Hắc Liên',
    'Đồng Hồ Cát Cuối': 'Hắc Liên Tâm',
    'Người Gác Mộng': 'Khaos'
  };

  // Sự kiện giữa chương: id -> { title, desc }.
  const EVENTS = {
    ch01_event_cho_dem: { title: 'Hắc Thị', desc: 'Cả đội ghé chợ đêm giang hồ. AN mặc cả mua kẹo hồ lô từ 5 xu xuống 1 xu. Bạch Diện lặng lẽ trả nốt 4 xu, không ai thấy. (Khu chợ này giờ đã mở thật ở Thành Chính.)' },
    ch02_event: { title: 'Luyện Công Rừng Trúc', desc: 'Bốn anh em Lăng dạy AN múa côn. AN múa được ba vòng thì côn bay vào đầu Lăng Tiêu. Ông Phở nấu một nồi phở, cả rừng trúc khen… lịch sự.' },
    ch03_event: { title: 'Câu Cá Bến Nguyệt', desc: 'Tịch Dao dạy AN câu cá. AN câu được cái nón của Thủy Tặc, Bạch Diện câu được con cá to nhất rồi lặng lẽ móc vào cần của AN.' },
    ch04_event: { title: 'Xin Quẻ Đầu Năm', desc: 'Thầy Mo gieo quẻ cho cả đội. Quẻ của Bạch Diện ghi đúng hai chữ: "Phụ Tử". Bạch Diện xé quẻ ăn luôn. Thầy Mo không dám hỏi.' },
    ch05_event: { title: 'Tỉ Thí Trên Ải', desc: 'Năm cao thủ thay nhau thách AN. AN thách lại: ai nhịn cười lâu hơn. Tiêu Phong thua đầu tiên. Bạch Diện đứng sau, mặt nạ vẫn trắng tinh mà vai thì rung.' }
  };

  const CHOICES = {
    ch06_choice_02: {
      prompt: 'AN trả lời Khaos:',
      opts: ['Không đời nào! Ba con mà biết là chú tiêu đời!', 'Chú Bạch Diện ơi, đánh hắn đi!']
    }
  };

  // id -> text (người kể) | [speaker, text]. Giữ nguyên next/battle của kịch bản gốc.
  const SCENE = {
    ch01_intro_01: 'Mười năm trước, Vô Danh Kiếm, cao thủ số một giang hồ, một mình đánh lui Hắc Liên Giáo rồi biến mất. Không ai biết mặt.',
    ch01_intro_02: 'Nay Hắc Liên Giáo trở lại, các chưởng môn lần lượt bị bắt. Còn ở một căn nhà nhỏ, có một vấn đề lớn hơn.',
    ch01_intro_03: ['an', 'Ba lại "đi công tác"! Ba hứa tối nay kể chuyện cho con. Hứa là phải giữ chứ!'],
    ch01_intro_04: ['an', 'Được rồi. Ba không về thì con đi tìm Ba. Tiện đường làm Minh chủ võ lâm luôn cho đỡ phí công.'],
    ch01_intro_05: 'AN ôm bông hải cẩu, đội mũ, trèo cửa sổ. Hành trang gồm: ba cái kẹo, một cái miệng, không có võ công.',
    ch01_intro_06: ['ong_hang_pho', 'Ê ê, con nít đi đâu một mình? Thôi ông đi bán phở, tiện đường, ông đi theo.'],
    ch01_intro_07: ['mob_sale', 'Đứng lại! Đường này của Hắc Liên Giáo! Nộp kẹo ra đây!'],
    ch01_intro_08: ['an', 'Kẹo của Minh chủ mà cũng dám đòi hả? Ông Phở, lên!'],
    ch01_mid_01: ['dinh_loi', 'Muốn qua trấn này, phải thắng ta. Ta là Đình Lôi, Vệ Binh Trống Đồng.'],
    ch01_mid_02: ['an', 'Thi đánh trống đi! Ai to hơn người đó thắng. Con đập nồi phở của ông Phở.'],
    ch01_mid_03: ['dinh_loi', '…Ta đánh trống ba mươi năm, chưa thấy ai to bằng. Từ nay ta theo con bé này.'],
    ch01_preboss_01: 'Đêm đó, một bóng trắng đáp xuống mái đình. Mặt nạ trắng, kiếm sau lưng, không một tiếng động. Bạch Diện, sát thủ bị cả giang hồ truy nã.',
    ch01_preboss_02: ['bach_dien', 'Có người thuê ta bắt một đứa nhóc phiền phức. Đi theo ta.'],
    ch01_preboss_03: ['an', 'Bắt con thì phải mua kẹo hồ lô. Vị dâu. Không dâu là con khóc cả trấn nghe.'],
    ch01_epi_01: ['boss_chungcu', 'Bạch Diện! Ta trả tiền để ngươi bắt nó, sao ngươi lại đánh ta?!'],
    ch01_epi_02: ['bach_dien', 'Ngươi chưa trả đủ. Con bé ăn hết ba xiên hồ lô rồi.'],
    ch01_epi_03: ['an', 'Chú này hay. Từ giờ chú là con tin… à nhầm, là hộ vệ của con.'],
    ch01_epi_04: ['bach_dien', '…Ta chỉ đợi tiền chuộc. Đi.'],
    ch02_intro_01: 'Rừng trúc Lăng Gia. Bốn anh em họ Lăng đứng bốn góc, cãi nhau đã ba ngày.',
    ch02_intro_02: ['lang_chan', 'Ta sinh ra trước, ta làm anh cả!'],
    ch02_intro_03: ['lang_nguyet', 'Ta đẹp nhất, ta làm anh cả!'],
    ch02_intro_04: ['an', 'Dễ ợt. Ai thua con thì làm em út. Ai thắng con thì… con chưa nghĩ tới, vì chưa ai thắng.'],
    ch02_intro_05: ['ong_hang_pho', 'Con bé này ăn nói kiểu gì giống y ai đó ông quen…'],
    ch02_mid_01: 'Cả bốn anh em xông lên. Ba người vấp phải… một hòn đá không biết ở đâu bay tới. Bạch Diện đang phủi tay.',
    ch02_mid_02: ['lang_tieu', 'Khoan! Sư phụ bọn ta bị Hắc Liên bắt. Bọn ta cãi nhau vì không ai dám đi cứu.'],
    ch02_mid_03: ['an', 'Vậy đi cứu luôn. Con cũng đang đi cứu Ba con nè. Đi chung cho vui.'],
    ch02_mid_04: ['lang_van', 'Con bé tám tuổi mà gan hơn cả bốn đứa bọn ta cộng lại.'],
    ch02_mid_05: ['bach_dien', 'Đội nón cho chắc. Gió rừng trúc lớn.'],
    ch02_mid_06: ['an', 'Chú chỉnh nón y như Ba con chỉnh. Mấy người lớn học chung một trường hả?'],
    ch02_preboss_01: 'Giữa rừng, Hộ Pháp Ba Đầu canh lồng sắt nhốt sư phụ Lăng Gia. Ba cái đầu, mỗi đầu một ý.',
    ch02_preboss_02: ['boss_sep_tong', 'Đầu trái: Đánh! Đầu phải: Chạy! Đầu giữa: Để ta suy nghĩ đã…'],
    ch02_preboss_03: ['an', 'Ba cái đầu mà không cái nào thông minh. Tiếc ghê.'],
    ch02_preboss_04: ['lang_chan', 'Anh em, lần này đánh chung. Ai làm anh cả tính sau!'],
    ch02_epi_01: ['boss_sep_tong', 'Ba cái đầu… thua một đứa nhóc… nhục ba lần…'],
    ch02_epi_02: 'Lồng sắt mở. Sư phụ Lăng Gia bước ra, nhìn Bạch Diện rất lâu, rồi cúi đầu chào thật thấp.',
    ch02_epi_03: ['an', 'Ông ơi, ông chào nhầm người rồi. Minh chủ là con cơ.'],
    ch02_epi_04: ['lang_chan', 'Bốn anh em Lăng Gia xin theo con bé. Và quyết định rồi: AN làm chị cả.'],
    ch02_epi_05: ['an', 'Hợp lý. Đi tiếp!'],
    ch02_epi_06: 'Phía trước có tiếng sóng. Bến Sông Nguyệt, nơi Thủy Trại Hắc Liên chặn đường. Chương sau: Bến Sông Nguyệt.',
    ch03_intro_01: 'Bến Sông Nguyệt. Thuyền bè bị Thủy Trại Hắc Liên giữ hết. Muốn qua sông, phải đi đường nước.',
    ch03_intro_02: ['an', 'Con không biết bơi. Nhưng con biết ra lệnh. Ai biết bơi thì bơi giùm con.'],
    ch03_intro_03: ['nguyet_diep', 'Con bé này là ai mà dám ra lệnh ở bến của ta?'],
    ch03_intro_04: ['an', 'Con là AN. Minh chủ võ lâm tương lai. Cô đẹp đó, cho cô vào đội.'],
    ch03_mid_01: ['tich_dao', 'Nguyệt Diệp, đừng để con bé lừa. …Nhưng mà nó nói cô đẹp thì đúng.'],
    ch03_mid_02: 'Một con sóng lớn hất AN xuống sông. Trước khi Nguyệt Diệp kịp quay lại, Bạch Diện đã ôm AN lên bờ, áo ướt sũng.',
    ch03_mid_03: ['nguyet_diep', 'Nhanh như vậy… cả giang hồ chỉ có một người…'],
    ch03_mid_04: ['bach_dien', 'Ngươi nhìn nhầm. Ta chỉ sợ mất tiền chuộc.'],
    ch03_mid_05: ['hong_thuong', 'Tiền chuộc mà lao xuống sông còn nhanh hơn cá. Chú này lạ thật.'],
    ch03_preboss_01: 'Giữa sông, Thủy Trại Chúa ngồi trên ngai bằng mai cua, hai bên là Tả Hữu Hộ Vệ.',
    ch03_preboss_02: ['boss_cua', 'Bến này là của ta! Muốn qua sông thì nộp mạng, hoặc nộp đứa nhóc kia!'],
    ch03_preboss_03: ['an', 'Ngồi trên mai cua mà đòi làm vua. Con nói thật, chú trông như món lẩu.'],
    ch03_preboss_04: ['nguyet_diep', 'Bến Nguyệt theo con bé. Ra tay!'],
    ch03_epi_01: ['boss_cua', 'Ngai của ta… vỡ rồi… ta chỉ còn là con cua thường…'],
    ch03_epi_02: ['an', 'Cua thường cũng có ích mà. Ông Phở, tối nay nấu bún riêu.'],
    ch03_epi_03: ['ong_hang_pho', 'Thôi tha nó đi con. Ông nấu bún riêu còn dở hơn phở.'],
    ch03_epi_04: ['tich_dao', 'Bến Nguyệt mở đường cho AN. Ba chị em bọn ta theo luôn.'],
    ch03_epi_05: ['an', 'Đội con ngày càng đông. Mà Ba con vẫn chưa thấy đâu.'],
    ch03_epi_06: 'Bên kia sông là núi Huyền Thuật, nơi các thầy pháp biết hết mọi chuyện. Chương sau: Núi Huyền Thuật.',
    ch04_intro_01: 'Núi Huyền Thuật. Cương thi giấy nhảy lò cò khắp sườn núi. Hắc Liên Giáo đang luyện đan ở đỉnh.',
    ch04_intro_02: ['thay_mo', 'Ta là Thầy Mo. Ta biết vì sao con tới. Con đi tìm một người rất quan trọng.'],
    ch04_intro_03: ['an', 'Thầy giỏi ghê. Vậy thầy bói xem Ba con đang ở đâu đi.'],
    ch04_mid_01: ['thay_mo', 'Quẻ nói… người con tìm ở gần con hơn con tưởng. Bên cạnh con có một vì sao rất sáng.'],
    ch04_mid_02: ['an', 'Con biết. Là con.'],
    ch04_mid_03: 'Bạch Diện quay mặt đi. Vai run run. Không ai biết sát thủ đang khóc hay đang cười.',
    ch04_mid_04: ['luc_anh', 'Hình nhân của ta nói chú áo trắng kia đang cười. Lần đầu ta thấy hình nhân sợ một người.'],
    ch04_mid_05: ['linh_dong', 'Bọn ta muốn phá lò đan Hắc Liên. Đan đó dùng để khống chế các chưởng môn.'],
    ch04_mid_06: ['tieu_linh', 'Cho em đi với chị AN! Em nhỏ hơn chị, nhưng em biết bắn lửa.'],
    ch04_preboss_01: ['boss_giam_doc', 'Lò đan sắp thành. Cả giang hồ sẽ nghe lệnh Hắc Liên. Con nhóc kia đến đúng lúc để làm nguyên liệu.'],
    ch04_preboss_02: ['an', 'Chú định bỏ con vào lò hả? Con mặn lắm, đan hỏng đó.'],
    ch04_preboss_03: ['thay_mo', 'Phá lò! Đừng để khói đan bay ra!'],
    ch04_epi_01: ['boss_giam_doc', 'Lò vỡ rồi… Giáo chủ sẽ không tha cho ta…'],
    ch04_epi_02: 'Khói đan tan. Trên vách lò khắc một dòng chữ cũ: "Vô Danh Kiếm đã phá lò này một lần, mười năm trước."',
    ch04_epi_03: ['an', 'Lại Vô Danh Kiếm. Chú ấy làm hết việc rồi thì Minh chủ như con làm gì?'],
    ch04_epi_04: ['ong_hang_pho', 'Con lo ăn cho no là được rồi. Việc nặng có người lo.'],
    ch04_epi_05: ['bach_dien', 'Đi tiếp. Trời sắp tối, trẻ con không thức khuya.'],
    ch04_epi_06: 'Đường lên Hắc Liên Đài phải qua Ải Cao Thủ, nơi năm cao thủ giữ ải. Chương sau: Ải Cao Thủ.',
    ch05_intro_01: 'Ải Cao Thủ. Năm người đứng chắn đường, mỗi người từng một thời làm mưa làm gió giang hồ.',
    ch05_intro_02: ['tinh_mac', 'Một đứa tám tuổi đòi làm Minh chủ? Về nhà đi ngủ.'],
    ch05_intro_03: ['an', 'Con ngủ rồi mới đi đó. Mà Ba con chưa về thì con chưa ngủ lại được.'],
    ch05_mid_01: 'Năm cao thủ rút binh khí. Rồi khựng lại. Cả năm cùng nhìn về phía sau AN, nơi Bạch Diện đang đứng.',
    ch05_mid_02: ['van_phong', 'Thế đứng ấy… mười năm trước ta thấy nó một lần. Rồi ta nằm liệt ba tháng.'],
    ch05_mid_03: ['ky_van', 'Lùi ba bước. Ai không lùi thì tự chịu.'],
    ch05_mid_04: ['an', 'Chú Bạch Diện đẹp trai lắm hả mà người ta sợ dữ vậy?'],
    ch05_mid_05: ['bach_dien', 'Ta không đẹp. Họ sợ… tiền chuộc của ta.'],
    ch05_mid_06: ['co_nuong', 'Con bé này không có võ công, nhưng có thứ khó đánh hơn: một người chịu chết vì nó.'],
    ch05_preboss_01: 'Đỉnh ải tối sầm. Thiên Ảnh Hắc Liên hiện ra: bóng của chính từng người trong đội, đen kịt.',
    ch05_preboss_02: ['boss_ban_the', 'Bạch Diện. Ngươi giấu mặt mười năm. Con bé có biết ngươi là ai không?'],
    ch05_preboss_03: ['tieu_phong', 'Đừng nghe cái bóng. Đánh tan nó trước đã!'],
    ch05_epi_01: ['boss_ban_the', 'Bóng tan… nhưng sự thật thì không giấu mãi được…'],
    ch05_epi_02: ['an', 'Chú Bạch Diện, nó nói gì vậy? Chú là ai?'],
    ch05_epi_03: ['bach_dien', '…Lên đài rồi con sẽ biết. Ta hứa.'],
    ch05_epi_04: ['an', 'Chú hứa thì phải giữ đó. Ba con hay hứa mà hay quên lắm.'],
    ch05_epi_05: 'Năm cao thủ đứng sang hai bên, mở đường. Trên cao là Hắc Liên Đài. Chương cuối: Hắc Liên Đài.',
    ch06_intro_01: 'Hắc Liên Đài. Các chưởng môn bị treo trong lồng, khói đen phủ kín. Cả đội của AN đứng chật bậc thang.',
    ch06_intro_02: ['ong_hang_pho', 'Ăn một bát nữa rồi lên. Lên cao phải no.'],
    ch06_intro_03: ['an', 'Ông Phở, phở ông dở thật đó. Nhưng con vẫn ăn hết.'],
    ch06_intro_04: ['dinh_loi', 'Đánh trống đi! Đội của AN lên đài!'],
    ch06_mid_01: 'Trên đỉnh đài, một người ngồi giữa hoa sen đen. Giáo chủ Hắc Liên: Khaos.',
    ch06_mid_02: ['khaos', 'Một đứa nhóc dẫn cả giang hồ tới đây. Buồn cười thật.'],
    ch06_mid_03: ['an', 'Con không dẫn ai hết. Họ tự đi theo con. Chú thả Ba con ra!'],
    ch06_mid_04: ['khaos', 'Ba ngươi? Ta không bắt Ba ngươi. Nhưng ta biết hắn là ai.'],
    ch06_mid_05: ['bach_dien', 'Khaos. Mười năm trước ta tha ngươi một lần. Lần này thì không.'],
    ch06_choice_01: ['khaos', 'Khoan! Đưa con bé cho ta, ta thả hết đám chưởng môn. Ngươi chọn đi, nhóc.'],
    ch06_wake_01: ['an', 'Không đời nào! Ba con mà biết chú bắt nạt con là chú tiêu đời!'],
    ch06_choose_01: ['an', 'Chú Bạch Diện ơi, đánh hắn đi! Con đứng sau chú!'],
    ch06_mid_06: 'Một chiêu kiếm. Hoa sen đen vỡ vụn, đài sụp một nửa. Mặt nạ trắng của Bạch Diện nứt đôi rồi rơi xuống.',
    ch06_epi_01: ['ba', 'AN… Ba đây.'],
    ch06_epi_02: ['an', '…Bảo sao kẹo hồ lô chú mua đúng vị dâu con thích. Bảo sao chú chỉnh nón y như Ba.'],
    ch06_epi_03: ['ba', 'Ba không đi công tác. Ba đi đánh Hắc Liên Giáo. Ba sợ con lo, nên đeo mặt nạ đi theo con.'],
    ch06_epi_04: ['an', 'Ba là Vô Danh Kiếm hả? …Vậy Minh chủ võ lâm là Ba, còn con thì sao?'],
    ch06_end_wake_01: ['ba', 'Con là người duy nhất trên đời bắt được Vô Danh Kiếm phải cõng về nhà.'],
    ch06_end_wake_02: 'Cả giang hồ đứng nhìn Vô Danh Kiếm lần đầu lộ mặt, đang cõng con gái xuống núi, nghe con kể chuyện suốt đường về.',
    ch06_end_wake_03: 'KẾT THÚC · ' + AN_ENDING_LINE,
    ch06_end_choose_01: ['ba', 'Con là người duy nhất trên đời bắt được Vô Danh Kiếm phải cõng về nhà.'],
    ch06_end_choose_02: 'Cả giang hồ đứng nhìn Vô Danh Kiếm lần đầu lộ mặt, đang cõng con gái xuống núi. AN ngủ gục trên vai Ba, tay còn cầm xiên hồ lô.',
    ch06_end_choose_03: 'KẾT THÚC · ' + AN_ENDING_LINE
  };

  // Owner 09/11: đổi hết tên kiểu "mộng" sang giang hồ.
  const WORDS = [
    [/Hồn Việt:\s*Mộng Giới/g, 'AN Bá Đạo'],
    [/Lục Thần|Hồn Việt/g, 'AN Bá Đạo'],
    [/Chợ Đêm Mộng|Chợ Đêm|Chợ Mộng/g, 'Hắc Thị'],
    [/Săn Boss Mộng|Boss Mộng/g, 'Săn Boss'],
    [/Đấu Trường Mộng/g, 'Lôi Đài'],
    [/Gọi Mộng/g, 'Chiêu Mộ'],
    [/Rèn Mộng/g, 'Rèn Binh'],
    [/Xưởng Mộng/g, 'Xưởng Binh'],
    [/Kho Mộng/g, 'Kho Đồ'],
    [/Mộng Lộ/g, 'Hành Tẩu'],
    [/Phúc Mộng/g, 'Phúc Duyên'],
    [/Mộng Tủy/g, 'Nội Đan'],
    [/Mảnh mộng hiếm/g, 'Mảnh S+'],
    [/Người Dẫn Mộng|Người Kể Ấn/g, 'Người Kể Chuyện'],
    [/Kẻ Mất Ngủ|Người Giữ Ấn/g, 'AN'],
    [/Mộng Phố|Mộng Giới|Lục Châu|Mộng Châu|Cõi Mơ/g, 'Giang Hồ'],
    [/Shop điểm/gi, 'Tụ Bảo Các'],
    [/thợ mộng/gi, 'thợ rèn'],
    [/Bách Bảo Luân/g, 'Bách Bảo Rương'],
    [/Tam Nguyện Sông Mơ/g, 'Hoa Đăng Giang Hồ']
  ];
  function rewrite(s) {
    let out = String(s);
    for (const [re, to] of WORDS) out = out.replace(re, to);
    return out;
  }

  // Đổi chữ hiển thị ở sảnh, thanh dưới và tiêu đề màn (chỉ text node, không observer).
  function rewriteTextIn(sel) {
    document.querySelectorAll(sel).forEach(root => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const t = n.nodeValue;
        if (t && /Mộng|Lục Thần|Hồn Việt|Chợ Đêm|Cõi Mơ/.test(t)) {
          const r = rewrite(t);
          if (r !== t) n.nodeValue = r;
        }
      }
    });
  }

  function patchData() {
    if (typeof DATA === 'object' && Array.isArray(DATA.chapters)) {
      DATA.chapters.forEach((ch, i) => {
        if (!CHAPTERS[i]) return;
        ch.name = CHAPTERS[i].name;
        ch.desc = CHAPTERS[i].desc;
      });
    }
    if (typeof DATA === 'object' && DATA.daily && Array.isArray(DATA.daily.quests)) {
      DATA.daily.quests.forEach(q => { if (q && typeof q.text === 'string') q.text = rewrite(q.text); });
    }
    const bags = [];
    if (typeof DATA === 'object' && DATA.scenes) bags.push(DATA.scenes);
    if (typeof SCENES === 'object') bags.push(SCENES);
    bags.forEach(bag => {
      Object.keys(bag).forEach(id => {
        const sc = bag[id];
        if (sc && typeof sc.text === 'string') sc.text = rewrite(sc.text);
        if (sc && typeof sc.desc === 'string') sc.desc = rewrite(sc.desc);
        if (sc && typeof sc.title === 'string') sc.title = rewrite(sc.title);
      });
      // Lời thoại AN Bá Đạo ghi đè sau cùng (không qua rewrite).
      Object.keys(SCENE).forEach(id => {
        const sc = bag[id];
        if (!sc || typeof sc.text !== 'string') return;
        const v = SCENE[id];
        // 'an' dùng tướng Bé An (be_an) nếu có để hiện đúng chân dung.
        const anKey = (typeof DATA === 'object' && DATA.heroes && DATA.heroes.be_an) ? 'be_an' : 'an';
        if (Array.isArray(v)) { sc.sp = v[0] === 'an' ? anKey : v[0]; sc.text = v[1]; }
        else { sc.sp = 'narrator'; sc.text = v; }
      });
      const ch = bag.ch06_choice_02;
      if (ch && Array.isArray(ch.options)) {
        ch.prompt = 'AN trả lời Ba:';
        ch.options.forEach(o => {
          if (o.id === 'wake_all') o.text = 'Con đọc sổ cho Ba nghe, để Ba nhớ ra con.';
          if (o.id === 'let_dream') o.text = 'Con ở lại canh cùng Ba, Ba không phải một mình nữa.';
        });
      }
    });
    if (typeof NPC === 'object') {
      Object.keys(NPC_NAMES).forEach(k => { if (NPC[k]) NPC[k].name = NPC_NAMES[k]; });
      NPC.an = { ...AN_NPC };
      NPC.ba = { ...BA_NPC };
    }
    if (typeof DATA === 'object' && DATA.scenes) {
      Object.keys(EVENTS).forEach(id => {
        const sc = DATA.scenes[id];
        if (sc) { sc.title = EVENTS[id].title; sc.desc = EVENTS[id].desc; }
      });
      Object.keys(CHOICES).forEach(id => {
        const sc = DATA.scenes[id];
        if (!sc) return;
        sc.prompt = CHOICES[id].prompt;
        (sc.options || []).forEach((o, i) => { if (CHOICES[id].opts[i]) o.text = CHOICES[id].opts[i]; });
      });
    }
    if (typeof DATA === 'object' && DATA.encounters) {
      const renameFoe = f => { if (f && typeof f.name === 'string' && FOE_NAMES[f.name]) f.name = FOE_NAMES[f.name]; };
      Object.keys(DATA.encounters).forEach(id => {
        const e = DATA.encounters[id];
        if (Array.isArray(e)) e.forEach(renameFoe);
        else if (typeof e === 'function') {
          DATA.encounters[id] = function () { const r = e.apply(this, arguments); if (Array.isArray(r)) r.forEach(renameFoe); return r; };
        }
      });
    }
    if (typeof DATA === 'object' && DATA.heroes && DATA.heroes.be_an) DATA.heroes.be_an.name = 'AN';
  }

  function paintBrand() {
    document.title = 'AN Bá Đạo';
    document.querySelectorAll('.hv-brandcopy strong, .v4-name, .rr-name, .v3-name').forEach(el => {
      el.textContent = 'AN Bá Đạo';
    });
    document.querySelectorAll('.hv-brandcopy small').forEach(el => {
      el.textContent = 'Võ các · Bộ sưu tập tướng';
    });
    document.querySelectorAll('.hv-seal').forEach(el => { el.textContent = 'ABĐ'; });
    rewriteTextIn('#hubScreen, .dock, nav, .pagehdr, .mode-intro, .screen.active > header, #hvM3, .hv-hub-menu');
  }

  const SEAL_STAGES = 18;

  function mul(n, m) {
    return Math.max(1, Math.round(Number(n || 0) * m));
  }

  // Owner 10/11: boss cốt truyện KHÔNG được mạnh bằng boss thế giới (Săn Boss).
  // Trần máu = 60% máu boss Săn Boss cùng chương (45000 x (1 + 0.35 x chương)).
  const STORY_BOSS_HP_RATIO = 0.6;
  function storyBossHpCap(ch) { return Math.round(45000 * (1 + 0.35 * ch) * STORY_BOSS_HP_RATIO); }
  function cloneWave(foes, ch, stage, tag) {
    const m = 1 + ch * 0.22 + stage * 0.05;
    return (foes || []).map((f, i) => ({
      ...f,
      id: tag + '_' + i,
      stats: {
        hp: Math.min(mul(f.stats && f.stats.hp, m), storyBossHpCap(ch)),
        atk: mul(f.stats && f.stats.atk, m),
        def: mul(f.stats && f.stats.def, m * 0.92),
        spd: (f.stats && f.stats.spd) || 90
      }
    }));
  }

  function stageLoot(ch, stage) {
    const last = stage === SEAL_STAGES - 1;
    return {
      gold: Math.round(80 * (1 + ch * 0.4 + stage * 0.08)),
      gems: ((stage + 1) % 5 === 0 && !last) ? (6 + ch * 2) : 0,
      shards: (!last && (stage + 1) % 4 === 0) ? (4 + ch) : 0
    };
  }

  function previewStageLoot(battleId, context) {
    const ch = context?.chapterIdx, stage = context?.campaignBattleIndex;
    if (context?.mode !== 'campaign' || !Number.isInteger(ch) || ch < 0 || ch >= CHAPTERS.length ||
        !Number.isInteger(stage) || stage < 0 || stage >= SEAL_STAGES ||
        battleId !== 'lt_seal_' + ch + '_' + stage) return {};
    return stageLoot(ch, stage);
  }

  // The result transaction owns awards for iframe and full-page battles.
  // Preview is read-only; retain the same shard draw while a save retries.
  let pendingLoot = null;
  window.HonVietSealLoot = Object.freeze({
    preview: previewStageLoot,
    prepare(battleId, context, commandId) {
      const reward = previewStageLoot(battleId, context);
      if (!reward.gold) return reward;
      if (pendingLoot?.commandId === commandId && commandId) return { ...pendingLoot.reward };
      if (reward.shards) {
        const pool = Object.keys(DATA.heroes || {});
        if (pool.length) reward.shardHero = pool[(Math.random() * pool.length) | 0];
        else reward.shards = 0;
      }
      if (commandId) pendingLoot = { commandId, reward: { ...reward } };
      return reward;
    }
  });

  function expandSeals() {
    if (typeof DATA !== 'object' || !DATA.encounters) return;
    if (typeof chapterBattleSequence !== 'function') return;
    const baseSeq = chapterBattleSequence;
    chapterBattleSequence = function lucThanSealSequence(idx) {
      const ch = Math.max(0, Math.min(5, Number(idx) || 0));
      const cachedIds = Array.from({length:SEAL_STAGES}, (_,s) => 'lt_seal_' + ch + '_' + s);
      if(cachedIds.every(id => Array.isArray(DATA.encounters[id])))return cachedIds;
      const authored = baseSeq(ch) || [];
      const templates = authored.map(id => {
        const encounter=DATA.encounters[id];
        return typeof encounter === 'function' ? encounter() : encounter;
      }).filter(Array.isArray);
      // The authored final encounter is the chapter boss. Keep it out of
      // regular-wave rotation; boss checkpoints remain 6, 12 and 18.
      const regularTemplates = templates.length > 1 ? templates.slice(0, -1) : templates;
      const fallback = DATA.encounters.luyen_tap || DATA.encounters.ch01_fight_street_mobs || [];
      const out = [];
      for (let s = 0; s < SEAL_STAGES; s++) {
        const id = 'lt_seal_' + ch + '_' + s;
        if (!DATA.encounters[id]) {
          const isBoss = s === SEAL_STAGES - 1 || (s + 1) % 6 === 0;
          const src = isBoss && templates.length
            ? templates[templates.length - 1]
            : (regularTemplates[s % Math.max(1, regularTemplates.length)] || fallback);
          DATA.encounters[id] = cloneWave(src, ch, s, id);
          // Chuong 5 (Thien Anh) khong co boss trong du lieu goc -> them boss o tran cuoi.
          if (ch === 4 && s === SEAL_STAGES - 1 && !DATA.encounters[id].some(f => /Thiên Ảnh/.test(f.name || ''))) {
            const m = 1 + ch * 0.22 + s * 0.05;
            DATA.encounters[id].splice(1, 0, { id: id + '_boss', name: 'Thiên Ảnh Hắc Liên', col: '#5a3a7a', row: 'front',
              stats: { hp: mul(14000, m), atk: mul(260, m), def: mul(110, m * 0.92), spd: 96 }, skill: null });
          }
        }
        out.push(id);
      }
      return out;
    };
  }

  function pickShardHero() {
    const pool = (DATA && DATA.heroes) ? Object.keys(DATA.heroes) : [];
    return pool[(Math.random() * pool.length) | 0];
  }

  function boostCompete() {
    if (typeof runBattle === 'function') {
      const prev = runBattle;
      runBattle = function runBattleCompeteLoot(battleId, cb) {
        return prev(battleId, win => {
          if (win && typeof P === 'object' && typeof ST === 'object') {
            if (ST.mode === 'guildBoss') {
              P.gold = (P.gold || 0) + 850;
              P.gems = (P.gems || 0) + 40;
              const hid = pickShardHero();
              if (hid) { P.shards = P.shards || {}; P.shards[hid] = (P.shards[hid] || 0) + 8; }
              if (typeof persist === 'function') persist();
              if (typeof refreshResbar === 'function') refreshResbar();
              if (typeof toast === 'function') toast('Hổ Trấn · +🪙1200 +💎40 +🧩8');
            }
            if (ST.mode === 'guildWar') {
              P.gold = (P.gold || 0) + 580;
              P.gems = (P.gems || 0) + 20;
              const hid = pickShardHero();
              if (hid) { P.shards = P.shards || {}; P.shards[hid] = (P.shards[hid] || 0) + 4; }
              if (typeof persist === 'function') persist();
              if (typeof refreshResbar === 'function') refreshResbar();
              if (typeof toast === 'function') toast('Bang Chiến · +🪙800 +💎20 +🧩4');
            }
          }
          if (typeof cb === 'function') cb(win);
        });
      };
    }
    if (typeof prepareHuntSettle === 'function') {
      const baseHunt = prepareHuntSettle;
      prepareHuntSettle = function prepareHuntSettleValuable(player, opts) {
        const r = baseHunt(player, opts);
        if (!r || r.ok === false) return r;
        if (r.killed) {
          r.gems = (r.gems || 0) + 40;
          r.gold = (r.gold || 0) + 400;
          r.goldGain = (r.goldGain || 0) + 400;
        }
        return r;
      };
    }
    if (typeof prepareArenaSettle === 'function') {
      const baseAr = prepareArenaSettle;
      prepareArenaSettle = function prepareArenaSettleValuable(player, opts) {
        const r = baseAr(player, opts);
        if (!r || r.ok === false) return r;
        if (opts && opts.win) {
          r.gold = (r.gold || 0) + 180;
          r.gems = (r.gems || 0) + 8;
        }
        return r;
      };
    }
  }

  // Chân dung hội thoại: AN = Bé An, Ba = Người Gác Mộng (ảnh gpt_image 09/11).
  const PORTRAIT = {
    an: 'assets/characters/be-an/dialogue-bust-41cbe936.webp',
    be_an: 'assets/characters/be-an/dialogue-bust-41cbe936.webp',
    ba: 'assets/characters/ba/dialogue-bust-v4.webp',
    bach_dien: 'assets/characters/bach-dien/dialogue-bust-v4.webp',
    khaos: 'assets/characters/khaos/dialogue-bust-v4.webp'
  };
  if (typeof characterAsset === 'function') {
    const baseAsset = characterAsset;
    characterAsset = function characterAssetWithAnBaDao(id, kind) {
      if (kind === 'dialogue' && PORTRAIT[id]) return PORTRAIT[id];
      return baseAsset(id, kind);
    };
  }

  // QA: ?qa=...&storyboss=1..6 mở thẳng trận boss cốt truyện chương đó (owner 10/11).
  function qaStoryBattle() {
    try {
      const q = new URLSearchParams(location.search);
      const n = Number(q.get('storyboss'));
      if (!q.get('qa') || !(n >= 1 && n <= 6)) return;
      const go = () => {
        if (typeof P !== 'object' || !P || !P.heroes || typeof runBattle !== 'function') { setTimeout(go, 800); return; }
        setTimeout(() => {
          try { chapterBattleSequence(n - 1); ST.mode = 'campaign'; ST.chapterIdx = n - 1; runBattle('lt_seal_' + (n - 1) + '_17', () => {}); } catch (e) {}
        }, 14000);
      };
      go();
    } catch (e) {}
  }
  patchData();
  expandSeals();

  // QA (owner 10/11): ?qa=...&qaBoss=son-tac|ho-phap|thuy-trai|huong-chu|thien-anh|khaos
  // -> vào thẳng trận boss cốt truyện của chương đó (chỉ khi có qa=).
  (function qaBossJump() {
    try {
      const qs = new URLSearchParams(location.search);
      const key = qs.get('qaBoss');
      if (!qs.has('qa') || !key) return;
      const CH = { 'son-tac': 0, 'ho-phap': 1, 'thuy-trai': 2, 'huong-chu': 3, 'thien-anh': 4, 'khaos': 5 };
      const ch = CH[key];
      if (ch === undefined) return;
      // Owner 11/11: tran QA khong duoc chay sau man load. #hvLoginRoot va #hvBoot
      // deu position:fixed nen offsetParent LUON null -> khong dung offsetParent de
      // do hien thi (bug cu: tuong login/boot da dong nen ban tran o giay 2.5).
      const shown = el => {
        if (!el || el.hidden) return false;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const bootEl = () => document.getElementById('hvBoot');
      const loginShown = () => shown(document.getElementById('hvLoginRoot')) || shown(document.getElementById('hvLoginContinue'));
      const bootShown = () => { const b = bootEl(); return !!b && !b.classList.contains('is-done') && shown(b); };
      // Chi coi la load xong khi boot-loader da dong VA da go khoi DOM (fade 600ms).
      const bootFinished = () => window.HV_BOOT_DONE === true && !bootEl();
      const bootMissing = () => typeof window.HV_BOOT === 'undefined';
      let tries = 0;
      const go = () => {
        tries++;
        const st = {
          tries,
          P: typeof P === 'object' && !!P && !!P.heroes,
          rb: typeof runBattle === 'function',
          seq: typeof chapterBattleSequence === 'function',
          login: loginShown(),
          boot: bootShown(),
          bootDone: window.HV_BOOT_DONE === true
        };
        window.__qaBossDbg = st;
        const ready = st.P && st.rb && st.seq && !st.login && !st.boot && (bootFinished() || bootMissing());
        if (!ready) { if (tries < 240) setTimeout(go, 500); return; }
        chapterBattleSequence(ch);
        if (typeof ST === 'object') { ST.mode = 'campaign'; ST.chapterIdx = ch; }
        // QA: doi hinh rong thi khong vao tran duoc -> tu dien 5 tuong dau.
        try {
          if (typeof P === 'object' && P && Array.isArray(P.squad) && P.squad.length < 1 && typeof DATA === 'object' && DATA.heroes) {
            P.squad = Object.keys(DATA.heroes).slice(0, 5);
          }
        } catch (e) {}
        const bid = 'lt_seal_' + ch + '_17';
        window.__qaBossDbg = Object.assign({}, window.__qaBossDbg, { fired: bid, enc: !!(DATA.encounters && DATA.encounters[bid]) });
        try { runBattle(bid, () => { if (typeof navTo === 'function') navTo('hub'); }); }
        catch (e) { window.__qaBossDbg.err = String(e).slice(0, 200); }
      };
      setTimeout(go, 1200);
    } catch (e) {}
  })();

  boostCompete();
  paintBrand();
  qaStoryBattle();

  const login = document.getElementById('hvLoginRoot');
  if (login && !login.querySelector('.hv-lore-title')) {
    // Owner 12/11: dung logo chu An Ba Dao giong man tuong, khong dung chu Georgia.
    const t = document.createElement('p');
    t.className = 'hv-lore-title hv-lore-logo';
    t.innerHTML = '<img src="assets/ui/an-ba-dao/logo-v1.webp" alt="An Bá Đạo" decoding="async">';
    login.querySelector('.hv-login-stage')?.prepend(t);
  }

  const baseShow = typeof showScreen === 'function' ? showScreen : null;
  if (baseShow) {
    showScreen = function showScreenWithLucThanLore(name) {
      baseShow(name);
      paintBrand();
    };
  }
  if (typeof renderHub === 'function') {
    const baseHub = renderHub;
    renderHub = function renderHubWithLucThan() {
      baseHub.apply(this, arguments);
      paintBrand();
    };
  }
  if (typeof renderCampaign === 'function') {
    const baseCamp = renderCampaign;
    renderCampaign = function renderCampaignWithLucThan() {
      baseCamp.apply(this, arguments);
      paintBrand();
    };
  }
  if (typeof renderHeroes === 'function') {
    const baseHeroes = renderHeroes;
    renderHeroes = function renderHeroesWithLucThan() {
      baseHeroes.apply(this, arguments);
      paintBrand();
    };
  }
})();
