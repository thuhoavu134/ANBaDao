# HỒN VIỆT: MỘNG GIỚI — OFFICIAL ROSTER 13 / SOURCE OF TRUTH

**Khóa ngày:** 29/08/2026  
**Phạm vi:** Roster nhân vật nguyên bản đang được sản xuất theo chuẩn Golden Character.  
**Quy tắc:** Mỗi tướng hiện có Basic, Skill 1 và Ultimate. Không tự thêm passive riêng cho một tướng khi hệ thống passive chưa được chuẩn hóa cho toàn roster.

Tài liệu này thay thế mọi danh sách roster mới thiếu Đình Lôi, Lục Ảnh, Tố Điệp hoặc Hồng Trầu. Không được nhầm với roster prototype/meta cũ gồm Ông Chú WiFi, Cá Trê Biết Buồn, Robot Trồng Rau… còn tồn tại trong `DATA.heroes`.

---

## 1. Bảng tổng quan 13 tướng

| # | Tướng | Hệ | Vai trò chính | Tầm/Movement profile | Vũ khí hoặc đạo cụ |
|---:|---|---|---|---|---|
| 1 | Ông Phở | Hỏa | Đấu sĩ / Liên kích / Đánh dấu | Cận chiến `contact` | Vá/vợt lọc phở sắt |
| 2 | Thầy Mo | Mộng | Pháp sư / Khống chế / AOE | Tầm xa `projectile`, Ultimate `stationaryCast` | Trượng, chuông, bùa và pháp khí |
| 3 | Thần Nỏ Sơn Nữ — Lạc Yên | Kim | Xạ kích / Phá giáp / Kết liễu | Tầm xa `projectile` | Nỏ chiến fantasy Việt Nam |
| 4 | Nữ Cung Thủ Tre | Mộc | Xạ thủ / Xuyên tuyến / Ghim mục tiêu | Tầm xa `projectile` | Cung tre và tên tre |
| 5 | Cô Đào Gánh Hội | Hỏa | Hỗ trợ / Điều nhịp / Sát thương lan | Trung xa `stationaryCast` | Đòn gánh hội, dải lụa và đạo cụ lễ hội |
| 6 | Phong Tử | Phong | Du đấu / Tốc độ / Cắt lượt | Cận-trung `contactDash` | Quạt/phiến phong nhận |
| 7 | Thủy Nương Rối Nước | Thủy | Điều khiển / Dời mục tiêu / AOE | Tầm xa `stationaryCast` | Sân nước và con rối nước |
| 8 | Hồng Liên Đao Nương — Combat V2 | Hỏa | Kiếm sĩ / Thiêu đốt / Quét tuyến | Cận chiến `contactDash` | Trường đao Hồng Liên |
| 9 | Thạch Quyền | Thổ | Đấu sĩ / Phá tuyến / Chấn động lan | Cận chiến `contact` | Quyền giáp đá |
| 10 | Đình Lôi — Vệ Binh Trống Đồng | Kim | Hộ vệ / Khiên / Phản công | Cận chiến `contact`, hỗ trợ `stationaryCast` | Khiên Đông Sơn và trống đồng |
| 11 | Lục Ảnh — Kép Đèn Kéo Quân | Mộng | Huyền thuật / Ảnh đăng / Nhiễu nhịp | Tầm xa `stationaryCast` | Đèn kéo quân lục giác |
| 12 | Tố Điệp — Mộc Bản Nương | Mộc | Hỗ trợ / Sao ấn / Khuếch đại hiệu ứng | Tầm xa `stationaryCast` | Ván khắc mộc bản, con lăn và mực |
| 13 | Hồng Trầu — Bà Mối Se Duyên | Mộc | Hỗ trợ / Nối sinh lực / Cứu nguy | Tầm xa `stationaryCast` | Khay trầu, lá trầu và chỉ hồng |

---

## 2. Hồ sơ và bộ kỹ năng

### 2.1 Ông Phở — Golden Character #1

**Chất tướng:** Đấu sĩ cận chiến bền nhịp. Mỗi lần nêm đúng vị khiến đòn sau mạnh hơn; cảm giác chiến đấu phải nặng, chắc, có lực của vá sắt và nhịp bếp lửa.

- **Basic — Vá Sắt Nêm Vị:** Áp sát một mục tiêu và đánh bằng vá sắt. Gắn 1 tầng `Nêm Vị`. Khi đủ điều kiện liên kích, Ông Phở phải trở về home slot rồi mới áp sát lần hai; không đứng trước mục tiêu đánh liền hai hit.
- **Skill 1 — Thiết Vá Chấn Kình:** Lao tới mục tiêu, tung hai contact rõ ràng. Đòn đầu bổ sung Nêm Vị; đòn sau dễ bạo kích hơn nếu mục tiêu đã có nhiều Nêm Vị và có thể gây Choáng Vị.
- **Ultimate — Thiết Vá Long Triều:** Ultimate AOE quét toàn bộ đội địch. Nêm Vị khuếch đại sát thương; mục tiêu đủ tầng có thể bị bạo kích/choáng và tiêu dấu. Mục tiêu không Né phải knockdown; damage trùng contact VFX đỏ cuối.

**Animation contract:** Basic/Skill là `contact`; Ultimate hiện là `contactDash + battlefield sweep`. Hai hit Basic dùng chuỗi `home → contact → home → contact → home`.

**Trạng thái:** Đã có Idle, Basic, Skill 1, Ultimate, Hit và Fall; là chuẩn scale/baseline/presentation.

### 2.2 Thầy Mo — Golden Character #2

**Chất tướng:** Pháp sư nghi lễ đứng tại trận tuyến, đặt Ấn Trấn rồi kích nổ kiểm soát toàn đội địch. Không chạy tới mục tiêu.

- **Basic — Ấn Trấn:** Cast tại slot, RELEASE rõ, phóng lá bùa target-aware tới một mục tiêu. Impact gây damage và đặt 1 `Ấn Trấn`.
- **Skill 1 — Chuông Chấn Phách:** Rung chuông tạo sóng chấn phách tách khỏi character cast. Wave đánh vùng/hàng mục tiêu, gây damage và làm chậm nhịp; tương tác với số tầng Ấn Trấn theo manifest hiện hành.
- **Ultimate — Trận Ảnh Phong Môn:** Dựng đại trận trên toàn bộ đội địch và gây damage cho mọi mục tiêu sống, tối đa 6 slot, tại cùng MAIN IMPACT. 0 Ấn: damage nền; 1 Ấn: hất nhẹ 8% action gauge; 2 Ấn: Chậm 25% trong 2 lượt; 3 Ấn: Khóa Skill 2 lượt nhưng vẫn dùng Basic. Ấn đã kích nổ bị tiêu. Chỉ mục tiêu 3 Ấn có icon khóa nhỏ phía trên đầu, không quấn xích quanh người.

**Animation contract:** Cả ba chiêu `stationaryCast`; Basic có `projectile`; Skill 1 có `wave`; Ultimate dùng `battlefield/cinematic VFX`. Damage chỉ resolve lúc impact.

**Trạng thái:** Basic PASS v3.20.3 target-aware; Skill 1/Ultimate đã có nhiều lớp asset và QA nhưng vẫn cần full runtime approval; Hit đã khóa semantic, Fall/Death cần xác minh.

### 2.3 Thần Nỏ Sơn Nữ — Lạc Yên

**Hệ:** Kim.  
**Chất tướng:** Xạ thủ nỏ chọn đúng điểm yếu, phá giáp trước rồi kết liễu; không biến nỏ thành súng.

- **Basic — Nỏ Sơn Xuyên Diệp:** Bắn một bolt vào mục tiêu hợp lệ. RELEASE, bolt và impact tách riêng; ưu tiên mục tiêu đối diện theo luật formation.
- **Skill 1 — Mũi Nỏ Phá Giáp:** Bắn bolt nặng vào một mục tiêu, gây damage và đặt `Phá Giáp` trong 2 lượt. Nếu mục tiêu đã Phá Giáp, mũi nỏ xuyên sang mục tiêu hợp lệ gần nhất phía sau với sát thương giảm.
- **Ultimate — Thiên Nỏ Truy Hồn:** Khóa mục tiêu có %HP thấp nhất và bắn phát kết liễu. Sát thương tăng khi mục tiêu dưới nửa máu hoặc đang Phá Giáp; nếu hạ mục tiêu, Lạc Yên nhận một phần nộ để tiếp tục nhịp săn.

**Animation contract:** Tất cả cast tại home slot. Character cast, bolt/projectile và impact là ba asset riêng; Ultimate có camera focus ngắn nhưng không áp sát.

**Visual khóa:** Premium CHIBI/SSR; tóc đen ponytail lớn; navy/black/crimson/ivory/aged bronze; fur/feather accents; full body và toàn bộ crossbow trong canvas; nhìn sang phải.

**Trạng thái:** Master Character đã tạo; chưa có full combat animation/runtime production.

### 2.4 Nữ Cung Thủ Tre

**Chất tướng:** Xạ thủ cơ động dùng độ dẻo của tre để ghim và xuyên tuyến. Khác Lạc Yên ở chỗ không săn kết liễu bằng một phát nỏ nặng mà kiểm soát đường bắn và hàng đội hình.

- **Basic — Tiễn Tre Vút Gió:** Bắn một tên tre vào một mục tiêu. Mỗi contact phải đọc rõ mũi tên, không thay bằng tia sáng chung chung.
- **Skill 1 — Trúc Tiễn Xuyên Hàng:** Bắn tên xuyên theo trục trước–sau của target. Mục tiêu đầu nhận damage chính; mục tiêu cùng trục phía sau nhận damage giảm và bị `Ghim` làm giảm tốc trong 1 lượt.
- **Ultimate — Vạn Trúc Lạc Vũ:** Bắn loạt tên tre phủ toàn đội địch. Mục tiêu đang Ghim chịu thêm damage; không tạo hiệu ứng súng hoặc mưa tên kim loại phương Tây.

**Animation contract:** `stationaryCast + projectile`; Ultimate là nhiều projectile theo stagger timing, damage từng target đúng contact hoặc một MAIN IMPACT đã khai báo rõ.

**Trạng thái:** Thiết kế đã duyệt; cần xác minh tên riêng/master asset và triển khai production.

### 2.5 Cô Đào Gánh Hội

**Chất tướng:** Người giữ nhịp hội làng; vừa hỗ trợ đội, vừa dùng đòn gánh và dải hội quét nhiều mục tiêu. Không biến thành ca sĩ/pháp sư sân khấu chung chung.

- **Basic — Nhịp Gánh Mở Hội:** Vung đầu đòn gánh đánh một mục tiêu ở cự ly trung bình; runtime dùng contact ngắn hoặc arc VFX, không cần chạy sâu vào đội địch.
- **Skill 1 — Đổi Vai Giữ Nhịp:** Chọn đồng minh có nộ thấp nhất, tăng action gauge và cấp một lớp khiên nhỏ; đồng thời Cô Đào đổi thế gánh để chuẩn bị nhịp hội tiếp theo.
- **Ultimate — Hội Làng Rợp Cờ:** Mở trường hội trên sân, gây một nhịp damage lên toàn địch và tăng tốc toàn đội trong 2 lượt. Cờ/lụa chỉ là battlefield VFX, không bake vào character sprite.

**Animation contract:** Basic `shortContact`; Skill/Ultimate `stationaryCast`. Ultimate cần lớp cờ, lụa, bụi sáng và stinger trống hội tách riêng.

**Trạng thái:** Thiết kế đã duyệt; chưa tích hợp runtime production.

### 2.6 Phong Tử

**Chất tướng:** Du đấu tốc độ cao, cắt nhịp kẻ địch bằng luồng gió sắc; khác xạ thủ ở việc vào–ra tuyến đánh bằng dash ngắn.

- **Basic — Phong Nhận:** Dash ngắn tới attack anchor, chém một mục tiêu rồi trở về slot.
- **Skill 1 — Hoán Phong Đoạt Nhịp:** Đánh mục tiêu và hất lùi action gauge. Nếu mục tiêu đang có buff Tốc, gỡ một buff Tốc trước khi hất gauge.
- **Ultimate — Bát Phong Đoạn Ảnh:** Tạo chuỗi dash qua các mục tiêu theo thứ tự slot, mỗi mục tiêu chỉ nhận một contact chính. Kết thúc phải trở về đúng home slot, không để duplicate sprite.

**Animation contract:** Basic/Skill `contactDash`; Ultimate `multiTargetDash` do runtime điều khiển translation, character atlas không bake quãng đường.

**Trạng thái:** Thiết kế đã duyệt; cần khóa lại master asset và production manifest.

### 2.7 Thủy Nương Rối Nước

**Chất tướng:** Chủ sân khấu rối nước, điều khiển mặt nước và con rối để đổi vị trí/khống chế. Đây là nhân vật duy nhất sở hữu fantasy điều khiển rối trong roster.

- **Basic — Rối Nước Xuất Đình:** Từ vũng nước gần mục tiêu, một con rối lao lên đánh một mục tiêu rồi chìm xuống. Thủy Nương đứng nguyên slot.
- **Skill 1 — Kéo Màn Thủy Đình:** Dựng sân nước tại hàng mục tiêu, gây damage nhẹ và kéo mục tiêu có action gauge cao nhất trong hàng về sau nhịp; không đổi slot vật lý nếu luật formation không cho phép, chỉ hất gauge/debuff tương đương.
- **Ultimate — Thủy Đình Vạn Tượng:** Phủ sân khấu nước lên toàn đội địch; nhiều rối xuất hiện theo lớp và gây AOE, sau đó đặt `Ướt`/giảm tốc trong 2 lượt.

**Animation contract:** Character `stationaryCast`; toàn bộ rối/mặt nước là summon/battlefield VFX riêng. Không dùng lại con rối cho Lục Ảnh hoặc tướng khác.

**Trạng thái:** Thiết kế đã duyệt; chưa tích hợp runtime production.

### 2.8 Hồng Liên Đao Nương — Combat V2

**Chất tướng:** Kiếm sĩ Hỏa bùng nổ, chém tuyến bằng đao lớn và để lại Hồng Liên thiêu đốt. Combat V2 là bản sử dụng, không quay lại choreography cũ.

- **Basic — Liên Đao Khai Hỏa:** Áp sát và chém một mục tiêu, có xác suất/điều kiện đặt `Thiêu Đốt`.
- **Skill 1 — Hồng Liên Phá Tuyến:** Dash xuyên trục trước–sau, đánh mục tiêu trước và mục tiêu cùng trục phía sau. Kẻ đang Thiêu Đốt nhận thêm damage ở contact cuối.
- **Ultimate — Cửu Liên Phần Trận:** Cast từ home slot hoặc bước lên rất ngắn, triệu hồi chín cánh Hồng Liên quét toàn đội địch. Đây là `stationaryCinematic`, không bắt cô chạy tới từng mục tiêu.

**Animation contract:** Basic/Skill `contactDash`; Ultimate `stationaryCast + battlefield VFX`. Lửa/hoa sen tách khỏi character atlas.

**Trạng thái:** Đã duyệt Combat V2; cần kiểm kê master/prompt và triển khai runtime.

### 2.9 Thạch Quyền

**Chất tướng:** Võ sĩ Thổ phá hàng trước bằng quyền nặng. Chấn động cạnh bên phải có tác dụng gameplay rõ, không chỉ là trang trí.

- **Basic — Thạch Kình:** Áp sát và đấm một mục tiêu, gây damage đơn.
- **Skill 1 — Địa Chấn Liên Quyền:** Cú đấm chính gây damage và `Phá Thế`/giảm phòng thủ mục tiêu chính; sóng chấn động lan sang tối đa hai mục tiêu cạnh bên, gây damage giảm và hất nhẹ action gauge. Đây chính là ý nghĩa gameplay của “sóng chấn động sang các mục tiêu cạnh bên”.
- **Ultimate — Sơn Quyền Trấn Địa:** Thạch Quyền đứng tại vị trí hoặc tiến tới tâm tuyến ngắn rồi đập đất; gây damage toàn hàng trước, lan một phần ra hàng sau và tăng hiệu lực nếu hàng trước có mục tiêu Phá Thế.

**Animation contract:** Basic/Skill `contact`; shockwave/ground impact là VFX riêng target-aware. Ultimate không cần chạy tới từng địch.

**Trạng thái:** Thiết kế đã duyệt; có các concept võ sĩ huyền thuật/Huyền Sơn liên quan cần phân loại trước khi chọn master cuối.

### 2.10 Đình Lôi — Vệ Binh Trống Đồng

**Chất tướng:** Hộ vệ Đông Sơn giữ tuyến bằng khiên và tiếng trống đồng; silhouette nặng, uy nghi, không trùng Thạch Quyền là võ sĩ tay không.

- **Basic — Khiên Đồng Trấn Kích:** Áp sát ngắn, nện cạnh khiên vào một mục tiêu và trở về vị trí.
- **Skill 1 — Hồi Văn Hộ Trận:** Đập khiên/trống tạo sóng đồng, cấp khiên cho đồng minh có %HP thấp nhất và bản thân; nếu đồng minh đó đang bị nhắm/khống chế, Đình Lôi nhận thế `Phản Vệ` cho đòn kế.
- **Ultimate — Đông Sơn Lôi Trận:** Gióng trống đồng tại home slot, dựng khiên toàn đội và gây một nhịp chấn động lên toàn địch. Trong thời gian khiên còn hiệu lực, lần đầu mỗi đồng minh bị đánh sẽ phản lại một phần damage cố định/giới hạn.

**Animation contract:** Basic `contact`; Skill/Ultimate `stationaryCast`. Sóng trống, hoa văn Đông Sơn và shield VFX là layer riêng; không bake UI icon vào VFX.

**Visual source:** `Đình Lôi – Vệ binh trống đồng.png`, `Đình Lôi chibi cầm khiên Đông Sơn.png`.

**Trạng thái:** Master/concept đã tạo ngày 28/08/2026; kit chưa tích hợp runtime.

### 2.11 Lục Ảnh — Kép Đèn Kéo Quân

**Chất tướng:** Nghệ nhân ánh sáng và bóng quay trong đèn kéo quân. Anh điều khiển ảnh đăng, không điều khiển con rối; phải giữ khác biệt tuyệt đối với Thủy Nương Rối Nước.

- **Basic — Ảnh Đăng Xuyên Màn:** Xoay đèn, phóng một hình bóng ánh sáng tới mục tiêu và gây damage huyền thuật.
- **Skill 1 — Kéo Quân Đảo Nhịp:** Chiếu vòng quân ảnh lên một hàng địch, gây damage nhẹ và làm mục tiêu có action gauge cao nhất bị `Đảo Nhịp`: giảm gauge/giảm tốc trong 1 lượt.
- **Ultimate — Lục Đăng Vạn Ảnh:** Đèn mở lớn phía sau Lục Ảnh, bóng quân chạy vòng toàn sân rồi đồng loạt lao qua đội địch. Gây AOE và kéo dài một debuff nhịp đang có trên từng mục tiêu thêm 1 lượt, tối đa theo cap hệ thống.

**Animation contract:** Tất cả `stationaryCast`. Nhân vật và đèn thật thuộc character layer; vòng bóng quân/ánh sáng là VFX riêng. Không tạo puppet strings, sân nước hoặc con rối vật lý.

**Visual source:** `Lục Ảnh – Kép Đèn Kéo Quân.png`, `Lục Ảnh bên đèn lồng lục giác.png`.

**Trạng thái:** Master/concept đã tạo ngày 28/08/2026; kit chưa tích hợp runtime.

### 2.12 Tố Điệp — Mộc Bản Nương

**Chất tướng:** Nghệ nhân khắc/in mộc bản biến dấu ấn thành bản sao chiến thuật. Không phải triệu hồi rối và không phải pháp sư bùa giống Thầy Mo; ngôn ngữ hình ảnh là ván khắc, thớ gỗ, mực và bản in.

- **Basic — Điệp Ấn Mặc Kích:** Ép một ấn mực hình bướm/mộc văn lên mục tiêu, gây damage và đặt `Mộc Ấn` trong 2 lượt.
- **Skill 1 — Khắc Bản Sao Thế:** Chọn đồng minh có buff có lợi mới nhất và in một bản suy giảm của buff đó cho đồng minh có %HP thấp nhất. Nếu không có buff hợp lệ, cấp khiên mực thay thế. Không sao chép Ultimate, hồi sinh hoặc hiệu ứng độc quyền.
- **Ultimate — Vạn Bản Đồng Khắc:** Trải mộc bản lớn trên chiến trường; gây một nhịp damage lên toàn địch. Mọi mục tiêu có Mộc Ấn nhận lại phiên bản suy giảm của debuff có hại mới nhất đang mang, sau đó tiêu Mộc Ấn. Debuff sao chép phải tuân cap thời lượng/không nhân bản hard control vô hạn.

**Animation contract:** `stationaryCast`. Mộc bản lớn, mực lan, bản in và impact là VFX riêng; character cast giữ baseline cố định.

**Visual source:** `Tố Điệp – nghệ nhân mộc bản.png`, `Tố Điệp – Mộc Bản Nương chibi.png`.

**Trạng thái:** Được bổ sung chính thức vào roster ngày 29/08/2026; master/concept đã tạo ngày 28/08; chưa tích hợp runtime.

### 2.13 Hồng Trầu — Bà Mối Se Duyên

**Chất tướng:** Hỗ trợ cứu nguy bằng tục trầu cau và sợi duyên. Trục gameplay là nối hai cực HP của đội, không nối ngẫu nhiên và không chọn hai tướng cùng tiêu chí.

- **Basic — Lá Trầu Se Chỉ:** Phóng lá trầu vào một mục tiêu địch, gây damage nhẹ; đồng minh có %HP thấp nhất được hồi một lượng nhỏ.
- **Skill 1 — Duyên Hồng Tương Sinh:** Bắt buộc nối **đồng minh có %HP thấp nhất** với **đồng minh có %HP cao nhất** trong 2 lượt. Khi người máu thấp nhận damage, người máu cao chia sẻ một phần damage sau giảm trừ; khi người máu cao được hồi, người máu thấp nhận một phần hồi. Nếu chỉ còn một đồng minh sống, chuyển thành khiên tự thân thay vì tạo liên kết giả.
- **Ultimate — Trầu Cau Hợp Mệnh:** Tái xác định đúng hai đầu mút thấp nhất–cao nhất, hồi máu toàn đội, rồi cân bằng một phần chênh lệch HP giữa hai người mà không làm giảm HP người cao xuống dưới ngưỡng an toàn. Liên kết được gia cố và miễn một lần hiệu ứng khống chế nhẹ cho người máu thấp.

**Animation contract:** Tất cả `stationaryCast`. Sợi chỉ hồng là VFX nối hai runtime anchors và phải cập nhật khi nhân vật HIT/DODGE; không bake đường nối vào video. Link đứt ngay khi một đầu gục hoặc hết thời lượng.

**Visual source:** `Hồng Trầu – chiến nữ se duyên.png`, `Hồng Trầu – Bà Mối Se Duyên.png`.

**Trạng thái:** Master/concept đã tạo ngày 28/08/2026; cơ chế chọn hai đầu mút đã được người dùng sửa và khóa; chưa tích hợp runtime.

---

## 3. Trạng thái sản xuất tổng hợp

| Nhóm | Tướng | Trạng thái |
|---|---|---|
| Golden/runtime | Ông Phở | Bộ animation chính đã có; tiếp tục regression và polish. |
| Golden/runtime | Thầy Mo | Basic PASS; Skill 1/Ultimate/Hit/Fall cần hoàn tất và QA. |
| Master đã có | Lạc Yên | Có master; cần toàn bộ animation/VFX/SFX ranged pipeline. |
| Concept/master cần kiểm kê | Nữ Cung Thủ Tre, Cô Đào Gánh Hội, Phong Tử, Thủy Nương, Hồng Liên Combat V2, Thạch Quyền | Đã duyệt chất tướng; cần tìm/khóa lại asset source và manifest trước production. |
| Master ngày 28/08 | Đình Lôi, Lục Ảnh, Tố Điệp, Hồng Trầu | Có ảnh nguồn trong Library; chưa nối vào runtime. |

---

## 4. Quy tắc triển khai cho Agent

1. Tài liệu này là source-of-truth về roster mới; `DATA.heroes` cũ không phải roster production.
2. Không tự thêm passive. Nếu sau này chuẩn hóa passive, phải làm cho toàn bộ 13 tướng trong một pass thiết kế riêng.
3. Mỗi action phải có metadata movement: `contact`, `contactDash`, `stationaryCast`, `projectile`, `battlefield` hoặc `support`.
4. Runtime sở hữu translation tới attack anchor; animation nhân vật không bake quãng chạy.
5. Ranged action tách Character Cast → RELEASE → Projectile/Wave → Impact → Damage/Status.
6. Ultimate của tướng cận chiến vẫn có thể cast tại slot nếu bản chất chiêu là AOE/cinematic.
7. Không tạo fantasy điều khiển rối thứ hai; Lục Ảnh dùng bóng đèn kéo quân, Tố Điệp dùng mộc bản/in ấn.
8. Không trùng vũ khí/đường chơi giữa Lạc Yên (nỏ kết liễu) và Nữ Cung Thủ Tre (cung xuyên tuyến).
9. Hồng Trầu luôn nối thấp nhất ↔ cao nhất; không đảo thành thấp nhất ↔ thấp nhất hoặc chọn ngẫu nhiên.
10. Hoàn chỉnh một Golden Character rồi mới chuyển tướng tiếp theo; thứ tự production hiện tại: Thầy Mo → Lạc Yên → tướng kế tiếp do người dùng chọn.

---

## 5. Nhân vật không thuộc roster production hiện tại

- Toàn bộ nhân vật Tam Quốc.
- Ông Trống Hội.
- Vệ Đình Nghê Đồng.
- 12 nhân vật prototype/meta cũ trong `Official Roster v2.4/v2.5` không được tự động đổi thành Golden roster.

