# HỒN VIỆT: MỘNG GIỚI — MASTER PLAN v2

## Hoàn thiện game theo Samkok, từ bản đang chạy đến bản phát hành

Ngày cập nhật: 06/09/2026. Chủ sản phẩm: Anh. Người tiếp nhận triển khai: Codex/Luna/dev được phân công.

## Chốt cơ chế AFK từ video — 07/09/2026 (giờ Việt Nam)

Nguồn: `ScreenRecording_09-07-2026 01-00-59_1.mp4` và đính chính trực tiếp của anh. Phần này THAY THẾ diễn giải trước về encounter hành quân. Đây là yêu cầu thiết kế đã chốt, CHƯA triển khai hoặc nghiệm thu runtime.

### Bản chất màn hình

- Đội chạy, đánh quái và vật phẩm bay vào rương chỉ là diễn hoạt AFK, cho thấy thưởng đang tích lũy theo thời gian. Không phải trận chiến thật, không chạy battle session/settlement, không tiêu hao thể lực, không tăng tiến độ ải.
- Nút Khiêu chiến riêng mới vào trận 6v6 hiện hữu. Giữ luật 15 hiệp và flow kết quả đã chốt; không biến AFK thành wave hoặc encounter thật.
- Animation và hiệu ứng vật phẩm là presentation của trạng thái thưởng; không được dùng số quái chết, frame, FPS hay callback VFX để sinh vật phẩm.
- Clip cho thấy HUD cố định khi cảnh di chuyển và CTA riêng. Mốc 15 giờ do anh xác nhận, không suy ra từ video. Audio clip im lặng nên không có kết luận về SFX/BGM mẫu.

### Rương AFK — luật đã chốt

1. Thưởng tự tích lũy cả khi online lẫn offline theo thời gian hợp lệ.
2. Rương chứa tối đa **15 giờ tích lũy = 54.000 giây**; đây là dung lượng theo thời gian, không phải 15 giờ được phép offline hay số slot túi.
3. Đủ 15 giờ thì dừng tích lũy. Thời gian vượt trần bị bỏ, không giữ lại để cộng bù sau khi nhận.
4. Người chơi phải đăng nhập **và nhận thưởng** để giải phóng rương. Chỉ đăng nhập, mở rương hoặc xem preview không reset mốc.
5. Sau nhận thành công, thưởng chuyển vào túi và chu kỳ mới bắt đầu tại thời điểm nhận. Khi lưu/credit thất bại, rương và mốc cũ phải giữ nguyên.
6. Nút nhận khi chưa đủ 15 giờ được đề xuất cho bản đầu (không bắt người chơi chờ đầy); rate, danh mục vật phẩm, điều kiện mở AFK và quy tắc nâng rate còn cần cấu hình/chốt, không tự thêm giá trị kinh tế hoặc quảng cáo tăng thưởng.

### Contract dữ liệu và giao dịch (E13-03 + E03)

- Clock dùng một nguồn tập trung; alpha local phải công khai giới hạn chống đổi giờ máy, không gọi là server-authoritative. Online dùng thời gian tin cậy từ backend đã được duyệt.
- Lưu cursor/mốc tích lũy, elapsed đã ghi nhận, phiên bản reward config, nội dung rương và receipt/commandId theo save schema. Migration bảo toàn quyền lợi cũ; không reset save im lặng.
- Khoảng thời gian mới được cộng chỉ tối đa phần còn trống của 54.000 giây. Khi rương đã đầy và người chơi nhận muộn, cursor chu kỳ mới là lúc nhận, không phải lúc rương vừa đầy.
- Tính/credit reward + xóa số dư rương + cập nhật cursor cùng một giao dịch atomic; retry cùng commandId trả receipt cũ, không cấp lại. Hai tab dùng revision guard.
- Reward preview và claim dùng cùng công thức/làm tròn; giữ phần dư đúng contract để mở/đóng nhiều lần không thay kết quả. Nếu có loot ngẫu nhiên phải lưu kết quả/seed ổn định, không reroll khi mở UI.
- Nếu đổi rate theo chương, phải chốt cách tính từng khoảng thời gian trước triển khai; không áp rate mới hồi tố cho toàn bộ thời gian cũ.
- Pause renderer khi tab nền/đổi màn nhưng không làm dừng clock thưởng. Không chạy hàng nghìn trận bù offline: chỉ tính khoảng thời gian hợp lệ có trần.

Ví dụ nghiệm thu: nhận lúc 00:00 → 10:00 có tối đa 10 giờ; không nhận, tới 20:00 chỉ có 15 giờ. Nhận lúc 20:00 → 21:00 có 1 giờ mới, không phải 6 giờ.

### UI/UX và asset

- Cảnh AFK là nội dung chính của màn Chinh chiến thay cho các card văn bản lớn; Thành Chính giữ bố cục U đã chốt.
- Giữ đội tướng, đường đi và vùng đánh diễn hoạt rõ; HUD account/tài nguyên cố định, chapter chip gọn, dock và CTA Khiêu chiến không che đội.
- Rương có trạng thái đang tích lũy / có thể nhận / đầy / đang nhận / lỗi lưu; hiển thị thời gian đã chứa trên 15 giờ, vật phẩm đang chứa và CTA nhận.
- Khi đầy: “Rương đầy — nhận để tiếp tục tích lũy”. Dừng hiệu ứng vật phẩm bay vào rương để không báo sai; có thể giữ idle/diễn hoạt nhẹ.
- Hiệu ứng nhận thưởng chỉ phát sau commit thành công. Khi trở lại từ offline cập nhật số dư trực tiếp, không phát lại mọi loot effect đã bỏ lỡ.
- Tái sử dụng ảnh toàn cảnh trong bộ 20 cặp background nếu phù hợp; ảnh sân đấu dùng cho battle. Kiểm tra đường đi, phối cảnh, anchor; không tự yêu cầu gen lại asset đã có.
- Kiểm kê run/idle/basic của đội dùng làm mẫu. Không kéo idle trượt trên đất rồi coi là run hoàn thiện. Thiếu asset phải ghi brief/queue.
- Agent chủ động tạo bằng Imagen ảnh rương/icon/visual còn thiếu khi triển khai tính năng; timer, tên và số dư là dữ liệu live. Animation/VFX/SFX thiếu phải có brief riêng; không dùng concept sheet giả làm VFX.
- SFX diễn hoạt cần tiết chế, giới hạn phát đồng thời và không chồng lên nhạc/trận thật. Một owner cho audio/RAF; dọn khi rời màn.

### Ticket triển khai và gate

- AFK-01 / E13-03: khóa schema, clock, cap 15 giờ, công thức preview/claim và migration.
- AFK-02 / E03: giao dịch claim atomic/idempotent; test retry, hai tab, lỗi lưu và không đủ điều kiện.
- AFK-03 / E04/E06: một cảnh diễn hoạt mẫu run → đánh giả lập → đi tiếp; không gọi combat/reward mutation từ animation.
- AFK-04 / E07: ghép rương và CTA Khiêu chiến độc lập, pause/resume, quay về màn AFK đúng trạng thái.
- AFK-05: QA mốc 0, 1, 14:59:59, 15:00:00, 15:00:01, 24/48 giờ; đăng nhập không nhận; nhận khi đầy; nhận sớm nếu áp dụng; clock âm; reload; background/foreground; đổi rate; đầy rương không phát loot giả.
- QA 390/430px, iPad dọc/ngang và Safari thật; chạm một lần, HUD không che cảnh, không rò renderer/audio sau 20 lần ra/vào. Battle 6v6 vẫn kiểm tra độc lập.
- Quay runtime gồm AFK tích lũy → rương đầy → nhận → tích lũy lại và bấm Khiêu chiến. Không claim PASS chỉ vì test clock hoặc ảnh tĩnh đẹp.

Thứ tự: xử lý lỗi battle/audio chặn chơi; sau đó AFK-01/02 và mẫu AFK-03, rồi ghép UI/QA. Không thay engine trận hoặc sinh thêm hệ thống encounter.

---

## Cập nhật thực thi — 06/09/2026

Đây là trạng thái đã đối chiếu với source GitHub, deployment production và QA runtime sau commit 153c116a8c732eb05287addae1e2a8c935388bcb. Nội dung kiểm kê lịch sử bên dưới không được dùng để phủ nhận các mốc đã hoàn thành trong status block này.

### Đã hoàn thành / đã kiểm tra

- **Samkok v2 và Rèn Mộng:** đã có catalog 20 item trong runtime/QA, asset item và material theo hướng Imagen, giao dịch forge/loadout đi qua transaction owner và có bảo vệ salvage.
- **Sảnh:** đã khôi phục icon Nhiệm vụ và Bạn bè riêng biệt; icon Bạn bè được giữ hiển thị ổn định; nhóm shortcut được sắp xếp theo vùng U phía trên như yêu cầu; tên tài khoản và số liệu vẫn là HTML/CSS live, còn avatar/tài nguyên dùng art Imagen.
- **Nhiệm vụ chính tuyến trên sảnh:** card lớn đã bỏ theo yêu cầu; shortcut Nhiệm vụ vẫn còn và không bị xóa.
- **Chinh chiến liên tục:** luồng tiếp tục nhiệm vụ hiện tại, tự chuyển sau khi thắng và dừng khi thua vẫn là flow chính. Thẻ mission trên mobile đã sửa để không kế thừa grid cũ làm chữ rơi thành một cột.
- **QA mở khóa:** đã có chế độ QA mở toàn bộ chức năng, save-safe, để kiểm tra các màn trước khi tiến độ tài khoản hoàn thiện.
- **Kết quả trận:** route victory/defeat và asset nhạc thắng/thua đã có trong repo; vẫn cần tiếp tục kiểm tra âm thanh một lần, chuyển màn và thiết bị iOS thật.

### Chưa được đánh dấu PASS cuối

- **Battle background:** repo có bộ background arena, nhưng Chapter 1 và crop/object-fit phải được duyệt bằng ảnh battle sạch đúng chuẩn, tuyệt đối không dùng ảnh hub làm map battle.
- **Damage popup:** bản hiện tại vẫn cần chỉnh theo mẫu: nhỏ hơn, nhiều dòng dọc sát mục tiêu, crit không biến thành banner lớn.
- **QA thiết bị thật:** cần kiểm tra lại iPhone/iPad Safari và desktop cho audio unlock, icon Bạn bè, 6 nhân vật mỗi team, ultimate Lục Ảnh và các màn victory/defeat.
- **Mở rộng roster/kit:** tiếp tục đưa các tướng đã authored còn lại qua chuẩn Basic + Ultimate + passive và registry atlas; không tự tạo placeholder thay cho asset thật.

### Thứ tự triển khai tiếp theo

1. Chốt và tích hợp background battle sạch theo từng chương.
2. Sửa damage popup rồi QA multi-hit ở mobile/iPad/desktop.
3. Rà lại battle audio bus, SFX sạch, ultimate Lục Ảnh và nhạc victory/defeat trên runtime thật.
4. Hoàn thiện UI/UX có chiều sâu cho roster/hero detail và các màn chức năng còn thiếu; tính trước asset Imagen, animation, VFX, SFX của từng màn.
5. Mở rộng roster sau khi mỗi kit vượt đủ gate asset, motion, VFX, SFX, UI và runtime QA.

### Mốc source và production

- GitHub main: [153c116a8c732eb05287addae1e2a8c935388bcb](https://github.com/bktimmy247/luc-than/commit/153c116a8c732eb05287addae1e2a8c935388bcb).
- Vercel production: [luc-than.vercel.app](https://luc-than.vercel.app/), deployment đã READY.
- QA responsive: 390×844 và 430×932 đã xác nhận thẻ nhiệm vụ full-width, tiêu đề đọc bình thường, progress và CTA hiển thị đủ chiều ngang.

**Định hướng:** giữ game hiện tại; lấy Samkok làm mẫu chính về trải nghiệm; hoàn thiện một vòng chơi thật, sau đó mở rộng các hệ thống. Không viết lại toàn bộ game, không coi có màn hình là tính năng đã hoàn thành.

**Phạm vi kiểm kê gốc:** kiểm kê và lập kế hoạch. Các mốc source, số lượng file và kết quả lịch sử bên dưới thuộc lần kiểm kê đó; phải đọc lại main trước khi triển khai.

**Cập nhật thiết kế ngày 06/09/2026:** anh yêu cầu đưa chuẩn **hai đòn có animation — Basic + Ultimate**, cùng cơ chế nội tại, vào plan Samkok v2. Concept mới không bắt buộc có Skill 1 riêng; các tướng đã có ba bộ chiêu chuyển theo mapping bảo toàn asset và đầu tư trong save. Đồng thời áp dụng hai đính chính của anh: thiết kế phải tính trước độ dễ sản xuất VFX; nhân vật không bắt buộc thuộc văn hóa Việt Nam.

**Bổ sung quy tắc thực hiện ngày 06/09/2026:** làm đến tính năng nào cần hình ảnh thì agent phải chủ động tạo ảnh còn thiếu bằng **Imagen/công cụ image generation** và tích hợp ngay vào đúng chỗ. Ví dụ rèn ra món nào phải có ảnh đúng món đó. Animation/VFX/SFX cần thêm phải được phát hiện, chủ động báo anh kèm yêu cầu tạo cụ thể, hoặc ghi vào danh sách chờ để anh tạo sau. Quy tắc này áp dụng từ nay cho mọi tính năng; xem mục 3.2 và 7.8.

**Bổ sung yêu cầu UI/UX:** giao diện hồ sơ tướng phải đặt nhân vật trong background có chiều sâu, phối cảnh và mặt đứng hợp lý. UI/UX đẹp, mượt là ưu tiên của game; agent phải chủ động dùng Imagen tạo hình ảnh cần thiết và kiểm cách trình bày, chuyển cảnh, tải ảnh trong runtime.

**Phạm vi bắt buộc: TOÀN BỘ GAME.** Mọi tính năng, màn hình và luồng người chơi tương tác đều phải có UI/UX đẹp, rõ, nhất quán và mượt. Rèn Mộng và hồ sơ tướng chỉ là ví dụ, không giới hạn phạm vi. Tiêu chuẩn này đi cùng từng ticket triển khai trong mọi nhóm E/mốc R; agent phải chủ động hoàn thiện hình ảnh và trải nghiệm, không đợi anh chỉ ra từng màn.

**Chuẩn cảm giác hình ảnh/âm thanh:** animation, VFX và SFX phải được thiết kế và nghiệm thu để game **đẹp, sống động, tươi sáng**. Animation mượt và có sức sống; VFX có màu sắc/ánh sáng đẹp, nhịp rõ; SFX sạch, có lực, giàu sắc thái và đồng bộ hành động. Đây là yêu cầu chất lượng toàn game, không chỉ điều kiện có file để chạy.

**Ghi chú lịch sử:** đoạn kiểm kê này mô tả trạng thái trước khi triển khai. Khi có khác biệt, ưu tiên status block đầu tài liệu và progress snapshot cùng ngày.

### Đọc nhanh

- Mục 1–3: bản mới đang ở đâu, học gì từ Samkok, luật nào phải giữ.
- Mục 3.1, 7.4 và 7.7: chuẩn Basic + Ultimate + nội tại, chuyển kit cũ và thiết kế VFX dễ sản xuất.
- Mục 3.2 và 7.8: tạo và đặt ảnh cùng tính năng; danh sách animation/VFX/SFX phải chủ động báo anh hoặc lưu chờ sản xuất.
- Mục 4–5: thứ tự làm và danh mục công việc E01–E26.
- Mục 6–8: kiến trúc, pipeline asset và bản đồ giao diện.
- Mục 9–11: QA, gói việc tiếp theo và quy tắc giao việc cho Luna.
- Mục 12–13: các quyết định còn mở và nguồn đối chiếu.

---

## 1. Baseline và thay đổi so với kế hoạch cũ

### 1.1. Mốc nguồn

Repository: bktimmy247/luc-than. Mốc main đã kiểm tra: **1f59309889deb9019c26a19522db430a4c4acf5f**, ngày 06/09/2026, thông điệp “fix: align Dinh Loi retina frames and stabilize MVP portrait”.

Đây là mốc source của tài liệu, không tự chứng minh production hiện đang chạy đúng mốc đó. Khi bắt đầu code phải đọc lại main; nếu đã đổi, cập nhật delta trước khi làm.

Đã đối chiếu trong lượt lập kế hoạch:

- Cây source hiện tại; build-static và các module roster, tab hồ sơ, quest, guard chiêu mộ, hợp đồng Idle, SFX.
- index.html và battle.html trong workspace khớp Git blob hiện tại sau khi loại một ký tự xuống dòng cuối được thêm lúc phục hồi; không sửa hai file này.
- Commit mới nhất bổ sung patch Đình Lôi/MVP; bàn giao Luna và tài liệu Samkok.
- Kế hoạch 3Q bản 1.1, ngày 05/09/2026, 37 trang: dùng để kế thừa phạm vi E01–E26, không dùng trạng thái cũ làm trạng thái mới.

Build hiện gọi **25 patch động** sau bước copy và có **18 file test**. Đây là kiểm kê file, không phải 25 lỗi hay 18 ca test đã qua. Con số 79/79 trong LUNA-HANDOFF thuộc bản sửa trước; lượt này không chạy lại và không chứng nhận Safari/iPhone.

### 1.2. Delta quan trọng

| Nội dung | Trạng thái dùng cho kế hoạch v2 | Hệ quả |
|---|---|---|
| Game mẫu | Samkok: New Force / Tam Quốc Khởi Động đã được anh xác nhận | Samkok quyết định luồng/UI; 3Q bổ sung kiến trúc và dữ liệu tham khảo |
| Roster | Đã có read model trực tiếp từ player/catalog, lọc/sort/giữ vị trí; portal riêng do router hiện có quản lý | Không giao lại việc “bỏ dò chữ SSR/Lv.1”; chuyển sang regression, lifecycle và đồng bộ các màn |
| Hồ sơ tướng | Đã có 5 tab: Thuộc tính, Kỹ năng, Trang bị, Duyên phận, Tinh thông | Kiểm từng thao tác và giao dịch; không dựng thêm tab rỗng |
| Lục Ảnh Idle | Hợp đồng mới dùng đúng IDLE(2).rar RGBA, 96 frame | Giữ nguồn, tỷ lệ, pivot; không quay lại nguồn RGB nền đen |
| Lục Basic / PC nháy / SFX | Đã có bản sửa geometry, render và bus âm thanh dùng file thật | Phải kiểm lại runtime trên thiết bị lỗi; không ghi “chưa làm” hoặc “đã hết mọi lỗi” |
| Đình Lôi / MVP Ông Phở | Commit mới đã sửa đọc cell retina và tải portrait | Đưa vào nghiệm thu bản mới, không tự sửa thêm dựa trên lỗi trong handoff cũ |
| Gọi Mộng | Đã có guard khóa banner không hợp lệ trước debit | Lỗi pool đã có hàng rào; banner thương mại/gameplay hoàn chỉnh vẫn chưa chốt |
| Quyền sở hữu tướng | defaultPlayer và migrateSave vẫn mở cả 12; test hiện tại còn yêu cầu điều này | Tách profile QA khỏi người chơi mới trước khi làm thu thập; giữ tài sản save cũ |
| Combat module | Đã có Session, Round, Fighter, Target, Cooldown, Result và adapter | Chưa đồng nghĩa đã thay toàn bộ logic battle.html; cần parity với engine thực |
| Online | Có client API adapter và màn liên quan; chưa có bằng chứng backend vận hành đã nghiệm thu trong phạm vi kiểm kê | Không gọi arena/chat/bang local là dịch vụ nhiều người hoàn chỉnh |

### 1.3. Cách đọc trạng thái

- **Có nền:** đã thấy nguồn/module/handler; chưa đủ bằng chứng toàn luồng.
- **Đã kiểm ở bản trước:** tài liệu ghi rõ commit, thiết bị, hành động; phải chạy regression khi bản thay đổi.
- **Cần nghiệm thu lại:** đã có fix nhưng chưa có bằng chứng đầy đủ trên thiết bị mục tiêu.
- **Chưa khép kín:** thiếu giao dịch, dữ liệu, lưu, đường quay lại hoặc điều kiện mở.
- **Đề xuất:** chưa phải quyết định của anh; chỉ được triển khai sau khi duyệt phần liên quan.

P0 = chặn chơi, mất/nhân tài nguyên, sai save/asset hoặc lỗ hổng quyền. P1 = cần cho phạm vi bản chơi lõi/beta. P2 = chiều sâu/online sau nền. P3 = tùy chọn, không chặn lõi.

Không công bố phần trăm hoàn thành toàn game trước khi mỗi tính năng có trạng thái và bằng chứng.

---

## 2. Đối chiếu đúng Samkok

### 2.1. Những gì có căn cứ

Theo docs/SAMKOK-REFERENCE-ALIGNMENT.md: bản video được nhận diện là Samkok, dài 30:51, 426×240, đã được lấy mẫu trước đó. Anh từng gọi là video hơn 11 phút, sau đó xác nhận đúng game. Lượt này đọc lại biên bản, **không xem lại toàn video**, không suy ra giá/công thức từ chữ nhỏ.

| Quan sát được ghi trong biên bản Samkok | Áp dụng vào Hồn Việt | Không suy diễn |
|---|---|---|
| Roster 4 cột, lọc hệ, chỉ số trên thẻ, dock | Roster đọc save thật, bố cục mobile dễ thao tác, giữ state khi quay lại | Không bê rarity/chi phí/trần sao |
| Hồ sơ có nhân vật, chỉ số, kỹ năng và nâng tướng | Giữ 5 tab đang có; mỗi nút có dữ liệu và tác dụng thật | Không tạo “giống hình” nhưng nâng không đổi combat |
| Chọn tướng từ bộ sưu tập và xem đội trước trận | Liên thông hồ sơ → xếp 6 slot → lưu → vào trận đúng đội | Không nhân tướng hoặc dùng tướng chưa sở hữu |
| Chiêu mộ, chọn nguyên liệu, xác nhận, reveal | Xây banner phù hợp roster toàn SSR, preview rõ | Không dùng xác suất cũ có pool rỗng |
| Kết quả có thống kê/thưởng/đường mạnh lên | MVP động; thắng tiếp ải; thua đi nâng rồi trở lại | Không thay luật 15 hiệp/auto-chain của Hồn Việt |
| Hub và các nhánh nuôi đội/hoạt động | Mở hệ thống theo tiến trình, có thông báo việc làm được ngay | Có icon không chứng minh mọi mode/luật đã được quan sát |

3Q và Fable: tham khảo cách chia controller/model/view, vòng session–action–result, quest/unlock/economy. Không chờ giải mã hết Fable để làm game. Không đưa code, tên, art, vận hành hoặc tài nguyên thương mại của mẫu vào bản phát hành nếu chưa có quyền phù hợp.

### 2.2. Hồ sơ parity phải bổ sung

Mỗi điểm muốn giống mẫu ghi: nguồn/video timecode hoặc module đã đọc → hành vi → khác biệt Hồn Việt → mã E → ảnh/clip nghiệm thu. Không tự ghi timecode chưa kiểm.

Các nhánh arena mùa, bang chiến, pet, pass, viễn chinh ngẫu nhiên bên dưới thuộc roadmap Hồn Việt/đối chiếu kỹ thuật cũ; **không mặc nhiên là toàn bộ tính năng đã thấy trong video Samkok**.

Với bộ kỹ năng, **Basic + Ultimate + nội tại là quyết định thiết kế của Hồn Việt trong lần cập nhật này**. Mô tả tướng Samkok có phân biệt đánh thường, chiêu chính và các hiệu ứng thiên phú/nâng sao (S14); không diễn giải thành khẳng định mọi tướng, mọi phiên bản Samkok đều chỉ có đúng hai hiệu ứng hoặc hai mục kỹ năng. Việc chọn hai đòn để sản xuất không phụ thuộc vào kiểm chứng tuyệt đối đó.

---

## 3. Luật sản phẩm cần giữ

1. Web game HTML/JavaScript/Canvas 2D, mobile-first, phong cách chibi 2.5D huyền ảo thống nhất. Nhân vật được mở rộng cảm hứng sang nhiều nền văn hóa và sinh vật fantasy, ví dụ xác ướp; không bắt buộc mọi tướng phải mang chất Việt. Concept mới chưa tự trở thành ID trong roster runtime.
2. Trận 6v6, 6 vị trí mỗi bên, hàng trước/sau; tối đa 15 hiệp. Hòa/timeout phải có rule được khóa và test, không đổi công thức trong ticket visual.
3. Chinh Chiến giữ auto-chain đã chốt: thắng nối ải, thua dừng; mỗi ải là encounter mới, không biến thành nhiều wave trong một trận. Chỉ tạm dừng tutorial theo ngoại lệ được duyệt.
4. Roster chính thức hiện tại là 12 ID, toàn SSR. Không tự thêm tướng thứ 13, đổi tên/rarity hoặc xóa tài sản cũ để khớp thiết kế mới.
5. Frame-by-frame là pipeline mặc định; không yêu cầu anh học Spine. Giữ số frame/timing đã duyệt; không cắt frame chỉ để giảm MB.
6. Nhân vật giữ tỷ lệ X=Y, ground anchor ổn định; VFX có scale độc lập. Không dùng bbox của từng frame để tự đổi chiều cao nhân vật.
7. Bộ nguồn đã sản xuất của Lục Ảnh: Basic có cast/projectile/impact; Skill 1 sáu hình nhân vào sáu vị trí địch; Ultimate độc vân phủ nửa sân địch. Đây là danh tính asset cũ cần bảo toàn, không phải yêu cầu tiếp tục sản xuất ba đòn cho mọi tướng. Chuẩn đích theo mục 3.1; chuyển kit theo mục 7.4. Không tự tráo Skill 1/Ultimate, xóa nguồn hoặc đổi anchor trước khi có mapping; đọc manifest/điểm neo đang duyệt, không hardcode mọi chiêu vào slot 1.
8. Một chủ quản cho router, combat scheduler, kết quả và audio. Không đưa lại bản global combat clock từng gây freeze.
9. Hub, nền trận, icon và kết quả dùng art Hồn Việt đúng chức năng; không lấy cảnh hub làm sân đấu, không chồng UI/sân cũ bên dưới bản mới.
10. Victory V6/Defeat V4 và MVP động được giữ; nhân vật/thống kê phải theo trận, nút bấm được ngay khi trạng thái cho phép.
11. Tiền thật, hạ tầng trả phí và import tài sản offline lên online là các quyết định riêng; kế hoạch không cấp quyền triển khai những phần đó.
12. Hệ thống/UI/UX và hình ảnh cần cho tính năng đang làm phải được triển khai cùng nhau. Agent chủ động gen ảnh còn thiếu và tích hợp ngay theo mục 3.2; giữ và tái sử dụng asset đã đạt. Việc hoãn sản xuất hàng loạt art cho nội dung tương lai không cho phép bỏ trống hình ảnh của tính năng hiện tại.
13. Chuẩn đích mỗi tướng có hai đòn chính cần animation: **Basic + Ultimate**. Nội tại tạo chiều sâu bằng luật kích hoạt và hiệu ứng nhỏ; không mặc định sinh thêm một bộ động tác Skill 1. Độ dễ tạo, tách lớp và QC VFX phải được xét ngay từ concept.

### 3.1. Chuẩn kỹ năng: hai đòn chính và nội tại

“Hai skill” trong kế hoạch này **tính cả đánh thường**. Không hiểu thành hai kỹ năng đặc biệt cộng thêm một Basic.

| Thành phần | Vai trò gameplay | Yêu cầu sản xuất |
|---|---|---|
| Basic — đánh thường/hành động cơ bản | Duy trì nhịp chiến đấu; có thể đánh, hồi phục hoặc kèm một hiệu ứng đặc trưng theo vai trò | Một bộ động tác gọn, rõ lực; VFX/SFX vừa đủ đọc được điểm ra đòn và trúng đòn |
| Ultimate — tuyệt kỹ/chiêu chính | Thể hiện bản sắc tướng, thực hiện khi đạt điều kiện trong config | Một bộ động tác và bộ VFX/SFX chủ đạo; tách cast, projectile/wave và impact khi chiêu cần |
| Nội tại | Luật tự kích hoạt để tạo phối hợp, khắc chế và khác biệt; ưu tiên một cơ chế chủ đạo, nâng cấp qua sao/tinh thông | Mô tả, icon/status và VFX nhỏ hoặc asset có sẵn; không yêu cầu bộ động tác chủ động thứ ba |

- Điều kiện dùng Ultimate, nguồn/tiêu hao nộ hoặc tài nguyên tương ứng, thời điểm kích hoạt và giới hạn phải được ghi bằng config ở E05/E25; tài liệu này không tự đặt ngưỡng nộ hay thay luật đang chạy.
- Một hành động chính chọn Basic hoặc Ultimate theo rule. Phản kích/truy kích/lượt phụ từ nội tại nếu có phải khai báo trigger, giới hạn và dùng lại animation phù hợp; không tạo chuỗi đánh vô hạn hoặc tự sinh lượt từ callback animation.
- Tab Kỹ năng hiển thị rõ hai đòn chính và phần nội tại/thiên phú riêng. Nội tại là cơ chế gameplay, không phải nút cast thứ ba; mô tả và combat cùng đọc một định nghĩa.
- Độ sâu đến từ mục tiêu, trạng thái, nhịp dùng Ultimate và phối hợp đội hình. Không bắt buộc thêm chiêu chỉ để tăng số animation; không gộp mọi hiệu ứng cũ vào một Ultimate khiến chiêu khó hiểu hoặc quá mạnh.
- Concept mới áp dụng chuẩn này ngay. Tướng cũ được giữ tương thích trong giai đoạn chuyển đổi có theo dõi; chuẩn nghiệm thu cuối là hai đòn chính theo mục 7.4. Idle/run/hit/fall vẫn là asset hành vi riêng, không bị tính vào hoặc loại bỏ bởi con số hai.

### 3.2. Làm đến đâu, hình ảnh theo đến đó

Đây là yêu cầu thực hiện đã được anh chốt, thay cách hiểu chung rằng mọi asset đều có thể để sau.

**Áp dụng toàn game:** hub, roster/hồ sơ, đội hình, campaign, battle/result, chiêu mộ, túi/rèn, shop, nhiệm vụ, daily/treo máy/giao việc/thư, tháp/boss/viễn chinh, arena, bạn bè/chat/bang, sự kiện, cài đặt và mọi tính năng bổ sung về sau. Agent phải xét cả toàn bộ luồng vào → thao tác → phản hồi/kết quả → quay lại, không chỉ ảnh chụp một màn. Không xem một tính năng là hoàn thiện khi mới chạy được logic nhưng UI/UX còn sơ sài hoặc thiếu hình ảnh cần thiết.

1. Trước mỗi tính năng, tự xác định người chơi cần nhìn thấy/nghe thấy gì ở lúc mở màn, thao tác, chờ, thành công, thất bại và xem lại kết quả. Liệt kê hình tĩnh, animation, VFX và SFX tương ứng ngay trong ticket.
2. Hình tĩnh cần thiết nhưng chưa có nguồn phù hợp: **agent tự dùng Imagen/công cụ image generation để tạo, kiểm chất lượng rồi đặt vào UI trong cùng lát cắt triển khai**. Yêu cầu này đã được ủy quyền; không chờ anh nhắc gen ảnh cho từng tính năng. Kiểm nguồn đã có để tái sử dụng đúng trước khi tạo mới.
3. Ảnh phải đúng đối tượng và chức năng: trang bị, vật liệu, phần thưởng, công trình hoặc hoạt động nào dùng ảnh của đối tượng đó. Giữ phong cách chibi 2.5D, độ nét, nền/alpha, tỷ lệ và bố cục thống nhất. Ảnh gen phải được tích hợp thật; gửi ảnh trong chat chưa hoàn tất yêu cầu đặt ảnh vào game.
4. Với Rèn Mộng: tên món, loại, phẩm chất và ảnh phải khớp từ phôi/kết quả ra lò đến kho, hồ sơ tướng và xác nhận phân giải. Ví dụ **Đũa Tre Gõ Nồi** có ảnh đôi đũa tre, **Giáp Thùng Xốp Ép** có ảnh giáp tương ứng. Các instance cùng mẫu dùng chung ảnh theo định nghĩa món; không gen lại ngẫu nhiên mỗi lần rèn hoặc reload. Icon chức năng Rèn không thay cho ảnh món đồ.
5. Khi cần animation/VFX/SFX mà nguồn hiện có chưa đáp ứng, agent chủ động báo anh: cần tạo gì, để thể hiện việc gì, phát ở đâu/khi nào, số asset và prompt/spec có thể dùng ngay. Nếu làm sau, ghi thành mục chờ có ID, owner và trạng thái trong plan/handoff; lần tiếp tục phải đọc lại mục đó. Anh không phải tự phát hiện thứ còn thiếu.
6. Tiếng búa “keng keng”, animation rèn hoặc hiệu ứng ra lò là các nhu cầu phải xét khi làm Rèn Mộng. Âm búa bám nhịp va chạm; phản hồi thành công bám kết quả đã lưu. Animation/âm thanh chỉ thể hiện giao dịch, không quyết định trừ tiền, roll hoặc cộng vật phẩm.
7. Ảnh tĩnh còn thiếu thuộc việc agent phải làm ngay. Animation/âm thanh được hẹn anh tạo sau vẫn là việc mở, được báo rõ mức ảnh hưởng và hạng mục kế tiếp; không đánh dấu đã sản xuất/tích hợp/nghiệm thu khi mới có prompt hoặc ghi chú.
8. Trước bàn giao, mở UI thật kiểm ảnh đúng đối tượng ở các màn liên quan, kích thước mobile, đường dẫn, tải/reload và trạng thái thiếu ảnh. Animation/VFX/SFX đã gắn phải được kiểm đúng nhịp và âm lượng; anh vẫn duyệt cảm giác hình ảnh/combat theo quy tắc hiện có.
9. **Hồ sơ tướng cần một không gian trưng bày có chiều sâu:** agent chủ động gen background bằng Imagen khi thiếu cảnh phù hợp, rồi tích hợp phía sau nhân vật Idle. Cảnh có tiền/trung/hậu cảnh hợp lý, phối cảnh, mặt đứng và ánh sáng thống nhất với tướng; chủ đề hỗ trợ danh tính nhân vật. Chân, bóng tiếp xúc, tỷ lệ và điểm neo phải khiến tướng đứng vững trong cảnh. Tướng và background là các lớp riêng để dùng đúng asset Idle; bố cục dành vùng rõ cho tên, chỉ số, tab và nút thao tác. Kiểm ở mục tiêu mobile: nền đẹp, tướng nổi bật, chữ dễ đọc, thao tác rõ và chuyển hồ sơ mượt.
10. **Animation/VFX/SFX đẹp, sống động, tươi sáng trên toàn game:** chuyển động mượt, có nhịp chuẩn bị–tác động–kết thúc và sức sống phù hợp hành động; VFX sạch, màu/ánh sáng tươi đẹp, điểm nhấn đọc rõ; SFX có chất liệu, độ ngân/lực va chạm phù hợp, nghe rõ và ăn nhịp. Tạo cảm giác phong phú, hấp dẫn khi chơi, đồng thời giữ người chơi đọc được nhân vật, mục tiêu, chỉ số và nút thao tác. Đưa chuẩn này vào brief/prompt, QC từng asset và nghiệm thu khi ghép vào game; giữ danh tính, màu và timing của nguồn đã duyệt khi tái sử dụng.

UI/UX đẹp và mượt là tiêu chí của mỗi lát cắt, không chỉ là đợt trang trí cuối. Agent phải tự đề xuất và thực hiện hình ảnh, khoảng cách, phân cấp thị giác, phản hồi nút và chuyển trạng thái phù hợp tính năng. Tải ảnh theo màn, cache hợp lý, giữ tỷ lệ/anchor và tránh dựng lại canvas Idle khi chỉ đổi tab/chỉ số; dùng bằng chứng runtime để đánh giá độ mượt, không suy từ một screenshot.

Mỗi tính năng phải kiểm cùng một bộ tiêu chí: phong cách art thống nhất và ảnh đúng nội dung; bố cục/chiều sâu phù hợp chức năng; chữ và vùng chạm dễ dùng trên mobile; hành động chính rõ; chuyển màn/back đúng; phản hồi khi bấm; trạng thái chờ, trống, khóa, lỗi, thành công đầy đủ; tải và chuyển động mượt trong điều kiện đã thử. Không ép mọi màn thêm hiệu ứng: chọn hình ảnh, animation và âm thanh để giúp người chơi hiểu và cảm nhận thao tác. Ghi riêng phần đạt, phần chưa kiểm và phần đang chờ nguồn.

### Danh tính runtime

| ID | Tên |
|---|---|
| ong_hang_pho | Ông Phở |
| thay_mo | Thầy Mo |
| lac_yen | Thần Nỏ Sơn Nữ — Lạc Yên |
| cung_thu_tre | Nữ Cung Thủ Tre |
| co_dao_ganh_hoi | Cô Đào Gánh Hội |
| phong_tu | Phong Tử |
| thuy_nuong_roi_nuoc | Thủy Nương Rối Nước |
| hong_lien_dao_nuong | Hồng Liên Đao Nương |
| thach_quyen | Thạch Quyền |
| dinh_loi | Đình Lôi — Vệ Binh Trống Đồng |
| luc_anh | Lục Ảnh — Kép Đèn Kéo Quân |
| to_diep | Tố Điệp — Mộc Bản Nương |

Tài liệu cũ có tên “roster 13” hoặc Hồng Trầu là lịch sử, không phải lý do đổi roster hiện tại. Nếu save có ID legacy, cần migration tương thích và quyết định rõ, không xóa âm thầm.

---

## 4. Lộ trình có điều kiện ra mốc

Hai phạm vi tách biệt:

- **Bản chơi lõi/alpha:** vòng chơi một người hoàn chỉnh; online chưa có phải ghi rõ mô phỏng/khóa. Có thể trình anh duyệt trước khi xong mọi hệ thống xã hội.
- **Bản online/live:** tài khoản, giao dịch và kết quả có thẩm quyền; cạnh tranh/xã hội, lịch mùa và vận hành thật. Đây mới là điều kiện cho kinh tế chia sẻ/rank thật.

| Mốc | Công việc chính | Demo bắt buộc / điều kiện ra mốc |
|---|---|---|
| M0 — Chốt bản ổn định | Nghiệm thu các fix hiện có; regression mobile/PC; thống nhất tài liệu nguồn | Tướng → Lục → back → vào lại; Basic không co; Đình Lôi không cắt; SFX và kết quả hoạt động. Lỗi chưa tái hiện ghi chưa xác minh |
| M1 — State và giao dịch | Catalog, seed QA/player, save version, command, receipt, router, encounter contract | Save cũ giữ tài sản; bấm đôi/reload không nhận thưởng hay trả phí hai lần; thống nhất trạng thái giữa màn |
| M2 — Vòng chơi mở đầu | Campaign, main quest, tutorial; lát cắt tối thiểu summon/nâng/equip/xếp đội | Tài khoản mới thực hiện chuỗi nhận tướng → xếp đội → đánh → nhận → nâng/mặc đồ → đánh tiếp; không dev cheat |
| M3 — Thu thập và nuôi đội | Hoàn thiện 12 hồ sơ, chuyển kit theo chuẩn hai đòn, nâng cấp/sao/skill, đội hình, túi/rèn, banner/shop | Basic/Ultimate/nội tại đồng bộ hồ sơ–combat; đầu tư skill cũ được xử lý theo mapping; thay đổi build có tác dụng; thiếu tiền không mất gì; mọi thao tác lưu được và quay lại đúng |
| M4 — Vòng hằng ngày + PvE lõi | Daily/weekly/điểm danh, treo máy, giao việc, thư, tháp, boss đơn người | Chơi được D1/D2/D7 bằng thời gian test; reset/claim đúng; tháp/boss không tăng nhầm campaign |
| M5 — Viễn chinh + nền online | Run viễn chinh độc lập; sau phê duyệt triển khai identity/cloud/ledger/battle authority | Run resume đúng; hai tài khoản/thiết bị kiểm được quyền, xung đột và giao dịch server |
| M6 — Cạnh tranh và xã hội | Arena thật, bạn bè/chat, bang lõi; tài nguyên/điểm do server kiểm | Hai tài khoản tương tác thật; sửa kết quả client không được nhận điểm; quyền bang/kênh đúng |
| M7 — Nội dung và mùa | Event lifecycle, bang chiến nếu duyệt, QC đủ roster/art/audio; nhánh meta đã chọn | Mùa mở–đóng–phát thưởng thử được; asset thiếu không bị che bằng placeholder không duyệt |
| M8 — Closed beta | Playtest, balance, thiết bị, hiệu năng, mất mạng/save/rollback | Không còn P0/P1 trong phạm vi beta; có báo cáo chơi thử và điểm cần chỉnh, không tự bịa retention |
| M9 — Phát hành | Release candidate, phê duyệt, GitHub → Vercel, smoke và vận hành | Deployment đúng commit/config/asset, save tương thích, rollback diễn tập được |

### Phụ thuộc và việc song song

- Đường găng lõi: M0 → M1 → M2 → M3 → M4 → nghiệm thu alpha.
- Online: contract thiết kế từ M1; triển khai M5 chỉ sau quyết định hạ tầng/quyền. M6 không được đi trước server ledger và battle authority.
- M2 có bản tối thiểu của các command M3; không để tutorial yêu cầu chiêu mộ/nâng/equip chưa được làm.
- Asset và UI chạy song song sau khi khóa contract: trước tiên nghiệm thu Ông Phở/Lục Ảnh/Đình Lôi/Thầy Mo ở phạm vi nguồn hiện có, rồi hoàn thiện các tướng còn lại theo manifest đã thống nhất.
- Với mỗi lát cắt hệ thống đang thực hiện, ảnh còn thiếu được gen và tích hợp ngay; không đợi đến M7 hoặc batch nhân vật. Animation/VFX/SFX cần anh cung cấp được chuẩn bị yêu cầu và theo dõi theo mục 7.8.
- M5 viễn chinh có thể chạy song song phần online nếu không chia sẻ cùng người sửa state. Không cho hai agent cùng sửa một build hook/router/result controller.
- Không đợi mọi tính năng P2/P3 để có bản anh chơi được. Nhưng không gọi alpha là “toàn game online đã hoàn tất”.

### Ước lượng

S = một domain nhỏ; M = nhiều trạng thái/test; L = xuyên UI–state–save; XL = phải chia thành nhiều ticket. Không quy đổi S/M/L thành số ngày cố định.

Sau M0 đo năng lực hoàn thành ticket và phần asset còn thiếu, rồi chốt lịch theo nhân lực thực. Mỗi đợt chỉ nhận việc đã đủ đầu vào, có demo và thời gian QA riêng. Không hứa ngày phát hành khi đội ngũ, thiết bị và phạm vi online chưa chốt.

---

## 5. Backlog E01–E26

Giữ mã nhóm của kế hoạch 1.1 để truy vết. Các ID dưới đây là việc triển khai hoặc nghiệm thu; có code không tự đóng ticket. Owner là vai trò cần giao, không khẳng định đã có nhân sự.

### E01. Baseline, nguồn sự thật và chống hồi quy

P0 · M0, duy trì xuyên suốt · M · Dev/QA. Phụ thuộc: không.

- E01-01: Ghi main/build/config/hash asset và save mẫu. Đạt khi dựng lại đúng mốc, không chép ZIP cũ đè source.
- E01-02: Regression các lỗi anh báo: roster trống/back, Idle cắt/rung/méo, Basic co, PC nháy, SFX, result. Mỗi lỗi có bước bấm và bằng chứng theo thiết bị.
- E01-03: Cập nhật sổ parity Samkok, giữ 3Q làm nguồn bổ sung; hành vi chưa xem phải có nhãn chưa xác minh.
- E01-04: Kiểm danh sách 25 patch đang active, thứ tự và điểm chèn. Phân biệt build sạch lặp lại với reapply một patch; chỉ yêu cầu reapply nếu contract cho phép.
- E01-05: Tách kết quả unit/source-contract/integration/browser/máy thật; kiểm script và embedded battle sau tất cả patch.
- E01-06: Mỗi phần migration chỉ có một chủ xử lý, có cờ quay lại; không thêm timeout/listener thứ hai để che lỗi.
- E01-07: Giữ chỉ mục nguồn mẫu/asset/handoff và loại ghi chú lỗi đã được fix khỏi danh sách “chưa làm”; vẫn giữ lịch sử.

Gate: người tiếp nhận biết đúng file cần sửa, bản cần thử và phần chưa thử.

### E02. Catalog, player state, profile và save

P0/P1 · M1 · L · Dev, anh duyệt seed. Phụ thuộc: E01.

- E02-01: Khóa 12 ID, alias tên, hệ, skill, portrait; validator chặn tham chiếu mồ côi. Không mở lại quyết định tướng 13.
- E02-02: Tách QA unlock-all, seed tài khoản mới và migration. Cần anh duyệt đội khởi đầu; không thu hồi 12 tướng trong save cũ.
- E02-03: Save có schemaVersion/revision; migration có backup, kiểm đầu vào, xử lý phiên bản tương lai/JSON hỏng. Không reset im lặng.
- E02-04: Cô lập storage; export/import có xác nhận, xử lý quota/tab cũ. Ghi thất bại không báo “đã lưu”.
- E02-05: Validate hero/item/skill/reward/stage/unlock cùng phiên bản; ID sai, chi phí âm, vòng phụ thuộc báo lỗi rõ.
- E02-06: Khai báo kitVersion, Basic, Ultimate, nội tại và mapping skill legacy theo từng heroId. Save/snapshot tham chiếu đúng phiên bản; bảo toàn cấp kỹ năng và đầu tư cũ theo mapping, không đổi chỉ bằng vị trí phần tử trong mảng.

Gate: save mới, save cũ, thiếu trường, migrate hai lần, ghi lỗi và xung đột đều có test. Sửa test unlock-all cùng thay đổi chính sách; không xóa test chỉ để lấy màu xanh.

### E03. Command, giao dịch và nhận thưởng một lần

P0/P1 · M1, mở rộng M3–M6 · L · Dev/backend. Phụ thuộc: E02.

- E03-01: Validate chi phí/quyền/revision trước mutation; debit và credit cùng một commit. Lỗi giữa chừng không mất tiền hoặc sinh vật phẩm.
- E03-02: commandId/transactionId và kết quả đã xử lý; retry trả lại cùng receipt, không thực hiện lần hai.
- E03-03: RewardSettlement chung cho battle, quest, thư, daily, boss, shop; mỗi nguồn có khóa nhận riêng.
- E03-04: Error model gồm thiếu tiền, khóa, hết lượt, stale revision, đã nhận, lỗi lưu; UI giữ trạng thái và hướng khắc phục.
- E03-05: Ledger ghi delta, lý do, nguồn, rules/configVersion; kiểm số âm/overflow và test thao tác liên tiếp.

Gate: success, invalid, duplicate, stale và storage failure qua. Ledger local chỉ giúp nhất quán/debug, không tự chống gian lận online.

### E04. Router, modal và vòng đời giao diện

P0/P1 · M0–M3 · M · Frontend/QA. Phụ thuộc: E01; nối state E02.

- E04-01: Mở rộng router hiện có với route params/back context; giữ filter/sort/scroll/hero/tab. Không tạo router riêng cạnh roster portal.
- E04-02: Một lần chạm tạo một command; chuẩn loading/disabled, không dựa trên text nút để đoán hành động.
- E04-03: Quy định modal stack, focus, khóa nền và tháo listener; không lớp trong suốt chặn CTA hoặc click xuyên.
- E04-04: Màn nào cũng có loading/empty/error/locked/success; shortcut và deep link dùng cùng guard.
- E04-05: Quản RAF/timer/audio theo enter/exit; mở detail 20 lần không tăng renderer hoặc restart idle khi chỉ cập nhật stat.

Gate: ma trận back từ mọi màn, vào lại lần hai, touch/keyboard, thanh địa chỉ mobile thay đổi chiều cao.

### E05. Combat đúng luật và kiểm thử được

P1; lỗi chặn turn là P0 · M1 contract/M2 trở đi · XL, chia lát cắt · Dev combat. Phụ thuộc: E01/E02.

- E05-01: Fixture từ engine thực: seed, đội, level/equip, target, HP, round, winner. Không chỉ so hai adapter cùng nguồn.
- E05-02: Session/round/team ownership; kết thúc một lần, giới hạn 15 hiệp, hòa và hai phe chết cùng lúc theo rule đã chốt.
- E05-03: Action pipeline intent → target → resolve → typed result; test multi-hit, phản đòn, actor chết/choáng giữa chuỗi, mục tiêu biến mất.
- E05-04: Status add/tick/stack/refresh/expire/dispel và cooldown readyRound; không tick theo FPS hay renderer.
- E05-05: Seed/RNG thống nhất và target theo vị trí; test front/back, thấp/cao HP, taunt, untargetable, chết/hồi sinh.
- E05-06: Replay versioned, cùng seed ×1/×2/×3 cùng kết quả. Chuyển từng caller khỏi legacy sau parity, không thay đồng hồ toàn cục.
- E05-07: Áp dụng chuẩn hai đòn của mục 3.1 cho kit mới: chọn Basic/Ultimate đúng điều kiện; không còn nhánh tự cast Skill 1 legacy ở tướng đã chuyển. Khóa điều kiện/tài nguyên/cost theo config, không để renderer quyết định.
- E05-08: Nội tại có trigger, điều kiện, giới hạn/stack/cooldown nếu cần; kiểm sự kiện lặp, actor chết, mục tiêu mất và truy kích/phản kích dây chuyền. VFX kết thúc không được phát lại damage hoặc tự sinh lượt.
- E05-09: Chuyển thử một tướng với fixture kit cũ/mới, mapping và diff gameplay rõ. Giữ parity phần không đổi; phần chủ ý đổi số chiêu phải có kỳ vọng mới và kiểm balance, không ép kết quả hai ruleset khác nhau giống hệt nhau.

Gate: tập fixture đại diện heal/shield/revive/DoT/CC/boss/round limit qua. Thay module và thay balance là hai ticket riêng.

### E06. Bắt đầu trận, kết quả và nối ải

P0/P1 · M1–M2 · L · Gameplay/frontend. Phụ thuộc: E03/E04; E05 khi thay luật.

- E06-01: Bridge kiểm schema/version/sessionId, event.source, sequence và origin theo kiểu iframe thực tế. Không tin chỉ một trường do client gửi.
- E06-02: StartEncounter snapshot đội/rule/cost; double tap chỉ tạo một session/iframe; lỗi tải có chính sách hủy/hoàn rõ.
- E06-03: Một controller cho finished → settling → settled → navigating; không reward lại khi mở/đóng result.
- E06-04: Xác nhận về màn nguồn, Ải sau/auto-chain mở encounter tiếp, Thử lại theo luật; cuối chương/hết nội dung/thiếu lượt có CTA hợp lệ.
- E06-05: Lưu receipt và progress trước navigation; reload giữa các bước có resume an toàn, không mất/nhận đôi.
- E06-06: Damage/heal/kill/MVP từ session; kiểm portrait Ông Phở và animation result sau commit mới. Audio không quyết định thắng/thua hoặc thời điểm settle.

Gate: iframe cũ/message trùng, click đôi, back result, chuyển chương, thua và hết nội dung đều qua.

### E07. Main quest, tutorial và mở tính năng

P1 · M2 · L · Gameplay/frontend/content. Phụ thuộc: E02/E03/E04/E06 và command tối thiểu E09–E12.

Nền hiện có là quest thắng ải. Chưa coi đó là quest engine đầy đủ cho mọi hệ thống.

- E07-01: QuestDefinition theo event win/claim/summon/formation/upgrade/equip; target, prerequisite, route, reward dùng ID.
- E07-02: Phân biệt đang làm/hoàn thành/đã nhận; mỗi loại có luật tính lịch sử hay tính từ lúc nhận, không tăng sai khi render lại.
- E07-03: Unlock graph dùng chung toàn game; khóa/chưa đủ điều kiện có lý do, không vòng phụ thuộc làm kẹt tài khoản.
- E07-04: Tutorial resume/skip/back an toàn, anchor theo ID; không khóa input vô hạn khi nút chưa xuất hiện.
- E07-05: “Đến ngay” mở đúng màn/hero/stage và có đường quay về; panel hub không che nút tính năng.
- E07-06: Event ID và periodKey ngày/tuần/vĩnh viễn; chỉ phát sau giao dịch thành công, retry không đếm đôi.
- E07-07: Chuỗi mở đầu Hồn Việt: chiến đấu/nhận tướng theo seed duyệt → xếp đội → thưởng → nâng/mặc đồ → trận tiếp; giữ auto-chain, không tự thêm forced pause.
- E07-08: Validator kiểm next/prerequisite/route/terminal và resume; quest không yêu cầu tài nguyên/hero chưa có đường kiếm.

Gate: tài khoản trắng đi được vòng mở đầu mà không cheat; save cũ không phải làm lại tutorial để mở tính năng đã có.

### E08. Chinh Chiến, chương và truyện

P1 · M2, thêm nội dung ở M7 · L · Gameplay/content. Phụ thuộc: E06/E07; art E24.

- E08-01: Stage catalog gồm chapter/stage/enemy/reward/background/story/unlock; kiểm số encounter thực, không suy số chương từ 20 ảnh nền.
- E08-02: Màn campaign thể hiện tiến độ thật và CTA đúng; chỉ thêm map node nếu được duyệt, không tự phục hồi bộ chọn chương cũ.
- E08-03: Chốt cost/first-clear/replay/sao/quét nếu có; mỗi nguồn thưởng một claim key, quét phải đủ điều kiện.
- E08-04: Cảnh thoại → encounter → result → tiếp ải/chương theo dữ liệu; không thêm wave, không chuyển lùi tiến độ.
- E08-05: Bảng độ khó/địch/phần thưởng/lore cho nội dung hiện hữu; mở rộng sau khi một chương chơi xuyên suốt được.

Gate: đầu/cuối chương, thua/retry, hết nội dung và reload đúng ải. Một bản đồ đẹp không thay thế dữ liệu ải thật.

### E09. Tướng và phát triển nhân vật

P1; regression roster là P0 · M2 tối thiểu/M3 đầy đủ · L · Gameplay/frontend. Phụ thuộc: E02/E03/E04/E23.

- E09-01: Nghiệm thu read model roster đang có trên mọi profile; đủ 12 danh tính, sở hữu/đồ giám đúng, tài nguyên/level/power không hardcode.
- E09-02: Filter/sort/detail/back đồng bộ sau nâng; giữ canvas idle và tab. Chưa sở hữu phải có nguồn kiếm, không nút tương tác giả.
- E09-03: Level/cap/đột phá theo bảng, preview chi phí/chỉ số; nâng nhiều dừng đúng khi thiếu tiền/cap và trả kết quả thật.
- E09-04: Sao/thức tỉnh/kỹ năng dùng config đã duyệt theo Basic + Ultimate + nội tại; nâng sao/tinh thông ưu tiên tăng hoặc mở rộng cơ chế trong kit, không mặc định thêm đòn chủ động thứ ba. Mô tả trùng logic combat, vật liệu được khóa/bảo vệ trước tiêu hao.
- E09-05: Reset/tái sinh cho xem phần hoàn/không hoàn và tác động đội/equip; không hoàn hai lần hoặc mất instance.
- E09-06: Tinh thông/trang phục tách ngoại hình khỏi stat; giữ hệ hiện có, chỉ mở nhánh có rule/content đủ.
- E09-07: Tab Kỹ năng phân biệt hai đòn chính với nội tại/thiên phú; preview/nâng/reset theo đúng kitVersion. Khi chuyển kit, mô tả cũ không còn chỉ tới Skill 1 đã ngừng dùng; lịch sử/mapping vẫn giữ để truy vết đầu tư.
- E09-08: Hồ sơ tướng có background trưng bày với chiều sâu, chủ đề, phối cảnh, mặt đứng và ánh sáng phù hợp. Agent chủ động gen cảnh còn thiếu bằng Imagen và gắn vào lớp nền riêng; căn chân/bóng/tỷ lệ với Idle, dành khoảng trống cho UI. Kiểm thay tướng/tab/back/reload, tải lạnh/ấm và mobile để giữ hình đẹp, rõ, mượt theo E04/E23/E24.

Gate: roster/detail/formation/battle cùng một bộ chỉ số. Kiểm đủ năm tab; “có nội dung” chưa đủ nếu thao tác không lưu/tác động.

### E10. Đội hình

P1 · M2–M3 · M · Gameplay/frontend. Phụ thuộc: E02/E03/E09.

- E10-01: 6 slot, sở hữu, không trùng ID, hàng trước/sau đúng; có tap-to-place trên điện thoại, không chỉ kéo thả.
- E10-02: Lưu đội/preset theo mode nếu duyệt; cảnh báo rời khi chưa lưu, reload giữ đúng lựa chọn.
- E10-03: Preview vai trò/hệ/duyên đội chỉ khi bonus có rule thực; cùng modifier được đưa vào trận.
- E10-04: Snapshot bất biến lúc start; thay level/equip ở profile không thay giữa trận đang chạy.

Gate: đổi liên tục, thiếu slot, reset hero trong đội, chuyển mode và save cũ không tạo đội lỗi.

### E11. Túi, trang bị và Rèn Mộng

P1 · M2 tối thiểu/M3 hoàn thiện · L · Gameplay/frontend. Phụ thuộc: E02/E03/E09.

- E11-01: Item stack khác equip instance; mỗi equip có uid, slot, level, stat/roll, lock, equippedBy.
- E11-02: Túi có filter/sort/mô tả/nguồn kiếm/dùng số lượng; reward vừa nhận xuất hiện đúng nhóm.
- E11-03: Mặc/tháo/đổi có so sánh trước/sau; một món không ở hai tướng, món cũ về kho đúng một lần.
- E11-04: Rèn/nâng có bảng cost/cap và kết quả; batch không vượt tiền/cap, lỗi lưu không tiêu nguyên liệu.
- E11-05: Tái chế/ghép có preview và xác nhận; bỏ đồ đang mặc/khóa khỏi auto-select, retry không nhân vật liệu.
- E11-06: Bộ đồ/tinh luyện/reroll chỉ mở theo thiết kế; mỗi modifier có nguồn và test UI ↔ combat.
- E11-07: Mỗi mẫu trang bị/vật liệu có ảnh đúng danh tính. Kiểm nguồn, gen ảnh còn thiếu bằng Imagen, gắn định nghĩa item → asset và dùng thống nhất ở phôi, ra lò, kho, hồ sơ tướng, so sánh và phân giải. Cùng món/cùng mẫu không đổi ảnh sau reload; ảnh không tự thay chỉ số, rarity hoặc kết quả roll.
- E11-08: Thiết kế phản hồi rèn/nâng/phân giải, gồm animation/VFX và âm thanh cần thiết. Tái sử dụng nguồn phù hợp; phần thiếu chủ động gửi anh prompt/spec hoặc lưu mục chờ tại 7.8. Tiếng búa bám contact beat, ra lò chỉ báo thành công sau commit; retry/skip/reload không nhân giao dịch hoặc phát chồng hiệu ứng.

Gate: equip → nâng → đổi → reset → reload vẫn đúng đồ/chỉ số và ảnh đúng món. Chức năng tiêu hủy phải có xác nhận rõ. Ảnh tĩnh cần thiết phải được tích hợp cùng tính năng; animation/VFX/SFX còn chờ phải có yêu cầu sản xuất và trạng thái rõ trước bàn giao.

### E12. Gọi Mộng và chợ

P0 giữ guard; P1 hoàn thiện · M2 tối thiểu/M3 đầy đủ · L · Gameplay, anh duyệt banner. Phụ thuộc: E02/E03 và D02.

- E12-01: Giữ guard pool rỗng; test paid/free và số lượt sai không đổi ngọc, pity, Hồi Ức, ngày miễn phí.
- E12-02: Thiết kế banner hợp lệ cho 12 SSR; công bố pool/đầu ra. Không tự hạ rarity hoặc thêm tướng rác để lấp xác suất.
- E12-03: Pity/roll 1–10/bù trùng có config; tạo kết quả trước reveal; skip/reload không roll lại.
- E12-04: Reveal/history và đánh dấu tướng mới gắn receipt; bỏ animation vẫn nhận đủ, không ghi lịch sử giả.
- E12-05: Shop có giá/tiền tệ/limit/refresh/expiry; validate trước debit, mua đôi không vượt stock.
- E12-06: Test phân phối và pity boundary theo config công khai; khi online server tạo kết quả, không nhận kết quả client tự chọn.
- E12-07: Lượt tutorial bảo đảm tách rõ khỏi lượt xác suất; chỉ phát một SummonCompleted sau thành công.

Gate: seed người mới và banner tạo ý nghĩa thu thập thật; save cũ giữ sở hữu. Không lấy giá 80/720 hay tỷ lệ hiện tại làm quyết định cân bằng cuối.

### E13. Daily, weekly, treo máy, giao việc và thư

P1 · M4 · L · Gameplay/frontend. Phụ thuộc: E03/E07/E11; online time E18.

- E13-01: Clock/periodKey/reset policy tập trung; timezone là config. Đổi giờ máy không nhận thêm thưởng online.
- E13-02: Điểm danh, daily/weekly, điểm hoạt động/rương; claim từng/claim-all cùng engine, không reset nhầm thành tựu.
- E13-03: AFK tích lũy online/offline, rương tối đa 15 giờ (54.000 giây), đầy dừng cộng; phải nhận mới giải phóng, không bù thời gian vượt trần. Claim atomic/idempotent, diễn hoạt không sinh thưởng. Xem mục Chốt cơ chế AFK đầu tài liệu.
- E13-04: Giao việc có yêu cầu tướng, slot, thời lượng, hủy/hoàn và reward; resume đúng sau reload.
- E13-05: Thư có expiry, read, attachment, claim-all/delete; cảnh báo quà chưa nhận và chặn nhận trùng/hết hạn.
- E13-06: Hub badge chỉ báo hành động làm được ngay; không chấm đỏ mãi cho tính năng khóa hoặc rương đã nhận.
- E13-07: Board template khác job instance; refresh không đổi việc đang chạy hoặc cấp thêm lượt miễn phí.

Gate: test D1/D2/D7, chuyển tuần, offline dài, retry claim và hai tab. Lịch local cho alpha phải ghi rõ, không quảng cáo là server-authoritative.

### E14. Tháp thử thách

P1 · M4 · M · Gameplay/content. Phụ thuộc: E03/E06/E10.

- E14-01: Floor catalog gồm địch/modifier/nền/unlock/reward; tiến độ tháp tách campaign.
- E14-02: Luật tầng/đánh lại/lượt/hồi phục/reset rõ; thua hoặc back không bỏ qua tầng.
- E14-03: First-clear/milestone/daily/quét nếu duyệt có claim key riêng, không trả thưởng hai lần.
- E14-04: Preview địch, chọn đội, summary và hướng mạnh lên; chỉ mở tầng có dữ liệu được QA.

Gate: qua mốc, boss tầng, thua/retry/reload đúng. Rank tháp thật phải chờ E18.

### E15. Boss và Săn Mộng

P1 đơn người; P2 chia sẻ · M4 · M/L · Gameplay/content. Phụ thuộc: E03/E05/E06.

- E15-01: Ruleset phân biệt clear, damage score, timeout; không báo thắng boss thành clear campaign.
- E15-02: Phase, telegraph và target theo ngưỡng; multi-hit không chuyển phase nhiều lần; không tự thêm wave.
- E15-03: Attempt/cost/reset/reward có transaction; thoát/retry theo chính sách, không dùng số popup làm score.
- E15-04: UI kỹ năng/điểm yếu/thống kê; test CC/miễn nhiễm/heal để tránh khóa boss vô hạn.

Gate: chết cùng action, timeout, phase boundary và claim sau reload. World/guild boss không giả multiplayer bằng dữ liệu local.

### E16. Mộng Lộ / viễn chinh

P1/P2 tùy phạm vi · M5 · L · Gameplay/content. Phụ thuộc: E03/E06/E08/E11.

- E16-01: Chốt ranh giới campaign lâu dài và run viễn chinh; gộp/đổi route cũ chỉ sau kiểm tác động save.
- E16-02: Run state có seed, node, đội/HP, modifier, item tạm, checkpoint; reload không reroll hoặc đem item tạm về túi chính.
- E16-03: Shop/sự kiện lựa chọn/hồi phục trong run là nhánh đề xuất; chỉ làm khi duyệt, không gọi là luật Samkok/3Q đã chứng minh.
- E16-04: Win/lose/abandon và reward escrow; bỏ cuộc có xác nhận, kết sổ một lần.
- E16-05: Viễn chinh cơ bản có độ khó, điều kiện mở, run/periodId và rương; đổi khó/ngày không nhận lại mốc cũ.

Gate: một run ngắn hoàn chỉnh trước khi mở nhiều tầng/nhánh; thắng/thua/abandon đều có đầu ra và đường quay về.

### E17. Arena, xếp hạng và mùa

P2 online; mô phỏng phải gắn nhãn · M6 · L/XL · Gameplay/backend. Phụ thuộc: E18 authority, E05/E06.

- E17-01: Tách local training và cạnh tranh thật; không dùng chung điểm/thưởng.
- E17-02: Đội phòng thủ/snapshot version, matchmaking, refresh/cooldown; đối thủ không đổi stats sau khi challenge được tạo.
- E17-03: Server resolve/xác minh kết quả, một session đổi rating một lần; sửa winner/score client bị từ chối.
- E17-04: Rating, hòa, reset, mốc/cuối mùa theo config; snapshot kết mùa và phát thưởng idempotent.
- E17-05: Lịch sử, báo cáo/replay hỗ trợ, trạng thái chờ và lỗi mạng; retry không mất vé/đánh lại để chọn kết quả.

Gate: ít nhất hai tài khoản, challenge đồng thời, kết quả trễ và season đổi giữa trận. Không mở rank thật chỉ bằng upload toàn save.

### E18. Account, cloud và backend

P1 trước mọi online thật · Contract M1, thực thi M5 · XL · Backend; anh duyệt hạ tầng. Phụ thuộc: E02/E03/E05/E06, D03/D04.

- E18-01: Đăng nhập/session/logout/guest upgrade, kiểm quyền sở hữu; token không nằm trong repo/log hoặc gói bàn giao.
- E18-02: Cloud save version/revision, conflict/backup/recovery; không merge bằng cách lấy số dư lớn nhất từ hai thiết bị.
- E18-03: Server ledger/catalog kiểm cost/reward/limit và transaction; client gửi ý định, không gửi balance mới để server tin.
- E18-04: Battle authority dùng resolver deterministic hoặc phương án xác minh được duyệt, rulesVersion/seed/snapshot; hash client không phải chứng cứ đủ.
- E18-05: Server time, reset/season jobs, rate limit và kiểm quyền mọi endpoint; job retry không double payout.
- E18-06: Staging riêng, secret đúng chỗ, log có che dữ liệu, backup/restore, công cụ hỗ trợ có audit và feature flag.

Gate: test A không đọc/sửa B, disconnect/retry, restore backup, multi-device và downtime. Chọn provider sau duyệt, không tự tạo dịch vụ trả phí.

### E19. Bạn bè, chat và hỗ trợ

P2 · M6 · L · Backend/frontend. Phụ thuộc: E18; thư E13.

- E19-01: Tìm ID, request/accept/reject/remove, giới hạn/quà nếu duyệt; lời mời chéo không tạo quan hệ trùng.
- E19-02: Kênh world/guild/private đã chọn, pagination/order/unread/reconnect; mất quyền bang mất quyền kênh.
- E19-03: Block/mute/report, spam limit, sanitize nội dung, moderation có quyền/log; không mở chat cộng đồng khi chưa có quy trình xử lý báo cáo.
- E19-04: Hồ sơ công khai tối thiểu, trợ giúp/báo lỗi kèm build/session; không lộ dữ liệu riêng/credential.

Gate: hai tài khoản tương tác thật, logout/reconnect và kiểm nội dung độc hại; nút “Bạn bè” không dùng icon/đích Gia tộc.

### E20. Bang hội và Gia tộc trong Bang

P2 · M6 lõi/M7 nâng cao · XL · Backend/gameplay. Phụ thuộc: E03/E18/E19.

- E20-01: Tạo/tìm/xin vào/mời/duyệt/rời, vai trò và chuyển chủ; kiểm quyền/cap trên server khi nhiều người thao tác.
- E20-02: Donate, quỹ, điểm cá nhân, shop/tech; tiền người và quỹ bang thay đổi trong cùng transaction.
- E20-03: Boss/hoạt động chung có contribution/session; hai người không ghi đè HP/điểm, boss chết không phát thưởng trùng.
- E20-04: Gia tộc nằm trong Bang về điều hướng; quan hệ quyền/bonus của dữ liệu clan legacy cần spec/migration, không xóa chỉ vì gộp UI.
- E20-05: Chiến bang: đăng ký, ghép cặp, snapshot, thiếu đối thủ/bỏ cuộc, thưởng; làm sau bang lõi.
- E20-06: Lịch phase/season server; restart giữa phase, lệnh trễ và job retry không đổi đội đã khóa hoặc kết sổ lần hai.

Gate: đổi quyền/rời/trục xuất giữa hoạt động, chuyển chủ, reset tuần và khôi phục job. Chiến bang không chặn demo bang lõi.

### E21. Lễ hội và sự kiện

P2; nhánh trả phí là quyết định riêng · M7 · L · Content/gameplay/backend. Phụ thuộc: E07/E12/E13/E18.

- E21-01: EventDefinition có ID/version, eligibility, lịch, currency, quest, reward và asset; không đổi code mỗi lễ hội.
- E21-02: Một event nhỏ đủ vòng: tham gia → kiếm điểm → mốc/đổi quà → kết thúc; tiến độ tách daily/campaign.
- E21-03: Hết đổi quà và xử lý tiền dư công bố trước; close job có receipt, không mất vật phẩm âm thầm.
- E21-04: Season pass chỉ khi duyệt; free/paid entitlement và từng mốc nhận kiểm trên server, không dùng cờ local mở track.
- E21-05: Staging tua thời gian test open/live/close/settled; công cụ tạm khóa claim lỗi mà giữ dữ liệu.

Gate: lịch server và kết sổ thử được trước khi mở nhiều event đồng thời. Không suy ra luật pass từ một icon mẫu.

### E22. Lore, duyên phận và meta tùy chọn

P2/P3 · M7 hoặc sau lõi · L, tách nhánh · Content/gameplay. Phụ thuộc: E02/E03/E09 và phê duyệt phạm vi.

- E22-01: Kiểm kê giữ/gộp/hoãn Mái Nhà, pet, quan hệ, gia phả, bộ sưu tập, nhánh hành trình cũ; không mặc nhiên làm mới toàn bộ.
- E22-02: Lore/đồ giám/cảnh truyện dùng đúng 12 danh tính, mở theo hero/stage, đọc lại và lưu trạng thái.
- E22-03: Bonus meta có nguồn/cap/công thức dùng chung; collection visual không tự cộng stat, reset không tạo lợi vô hạn.
- E22-04: Pet/quan hệ sâu phải có loop, nguồn/sink, lợi ích và asset riêng trước khi code; không ép người mới qua nhiều màn để đánh ải đầu.

Gate: nhánh được duyệt tạo giá trị rõ. Giữ đóng băng mở rộng adaptive memory/AI sâu trong giai đoạn ổn định.

### E23. Asset nhân vật và renderer dùng chung

P0 regression; P1 chất lượng roster · M0–M7 song song · XL · Asset/dev; anh duyệt hình. Phụ thuộc: E02/E04.

- E23-01: Golden QA Lục: Idle/UI/battle/result và Basic toàn loop; so body scale/chân với nguồn, không chỉ một ảnh.
- E23-02: Manifest versioned có source size, rect, trim offset, pivot, duration, facing, display/anchor, hash; renderer hiểu cùng hệ tọa độ.
- E23-03: Pipeline extract → inspect alpha → normalize → pack → validate → preview; giữ nguồn/đủ frame, không key đen hoặc rotate atlas khi runtime chưa hỗ trợ.
- E23-04: Inventory đủ 12 hero theo master/avatar/card/showcase/battle idle/Basic/Ultimate/nội tại/run/hit/fall/VFX/voice; Skill 1 cũ nằm trong phần legacy kèm quyết định tái sử dụng. Kiểm cả nguồn embedded/legacy trước khi nói thiếu; không đặt mới Skill 1 như một bộ bắt buộc.
- E23-05: Nghiệm thu từng hero trọn chuỗi theo kit, mọi slot/target; tách cast/projectile/impact, không hardcode slot 1.
- E23-06: Budget tải và decoded memory riêng; tier showcase/combat, lazy load/cache/dispose theo manifest, asset mới dùng URL mới.
- E23-07: Trước khi chốt tạo hình hoặc đặt animation, lập bảng asset Basic/Ultimate, cách tạo từng lớp VFX và độ khó theo mục 7.7. Ưu tiên chuyển động rõ, tách độc lập, phát tại slot; sửa concept quá khó trước khi sản xuất.

Gate: mọi frame đúng cell, không cắt/méo/rung; alpha trên nền sáng/tối; full team và ×1/×2/×3 trên thiết bị đích. Xem mục 7.

### E24. UI/art, nền trận và audio toàn game

P0 regression; P1 đồng bộ · M0–M7 · L + sản xuất · UI/asset/audio/frontend. Phụ thuộc: E04/E08/E23.

- E24-01: Một owner nền trận, mapping stage → bitmap; kiểm 20 theme hiện có, không chồng sân cũ/hub hoặc đổi màu ngoài duyệt.
- E24-02: Shell/hub/dock theo hệ UI thống nhất, safe area, icon rõ và không trùng; quest panel không che tính năng.
- E24-03: Hoàn thiện toàn bộ màn meta theo bảng mục 8, đầy đủ empty/lock/error/loading; số liệu/cost/reward từ state.
- E24-04: Tái sử dụng bus SFX đang có; audit mapping riêng từng hero, BGM/voice/mute/volume/duck/resume; không tạo bus thứ hai.
- E24-05: HP/status/target ring/shadow/damage lane rõ khi 6v6 nhiều hiệu ứng; không flash toàn sân mỗi hit, không popup khổng lồ che người.
- E24-06: Thực thi mục 3.2 trên **toàn game, trong mọi ticket tính năng có giao diện/luồng người chơi**: agent chủ động hoàn thiện art, bố cục, thao tác, phản hồi và độ mượt; gen/đặt ảnh tĩnh cần thiết ngay; lập danh sách animation/VFX/SFX phải nhờ anh tạo. Nghiệm thu cả luồng bằng UI thật và bằng chứng phù hợp, không chỉ mockup hay ảnh chưa vào runtime. Rèn và hồ sơ tướng là các ví dụ triển khai đầu tiên, không phải phạm vi duy nhất.
- E24-07: Hoàn thiện mỹ thuật và độ mượt hồ sơ tướng theo E09-08: background có chiều sâu, tướng đứng đúng mặt phẳng, lớp ánh sáng/bóng và UI hài hòa; kiểm bố cục mobile, tương phản chữ/nút, chuyển hồ sơ và tải tài nguyên. Không tạo thêm renderer/router; bảo toàn Idle, tỷ lệ và pivot đã đạt.
- E24-08: QC cảm giác animation/VFX/SFX toàn game theo 3.2: đẹp, sống động, tươi sáng; động tác mượt/có lực, VFX màu/ánh sáng đẹp và rõ nhịp, SFX sạch/đúng chất liệu/đồng bộ. Kiểm cả asset riêng và khi nhiều hành động cùng xuất hiện; giữ độ đọc UI/combat, âm lượng và hiệu năng. Có clip/nghe thực cùng đánh giá thẩm mỹ, không coi tồn tại file hoặc phát được âm là đủ đạt chất lượng.

Gate: ảnh/clip trước–sau cùng viewport, âm thanh trên thiết bị thật và anh duyệt thẩm mỹ. SFX đã có 9 âm mặc định không đồng nghĩa bộ âm riêng 12 tướng đã xong.

### E25. Balance và playtest

P1 · Bắt đầu M2, trọng tâm M4/M8 · L lặp nhiều vòng · Game design/dev/QA. Phụ thuộc: E03/E05/E07/E12.

- E25-01: Bảng nguồn/sink tiền, EXP, mảnh, vé, thể lực, vật liệu; mô phỏng D1/D7 và vòng mua–bán/reset để tìm lợi vô hạn.
- E25-02: Combat fixtures/simulation nhiều đội/seed; phát hiện stun lock/heal stall/đội vượt trội, UI stat lệch combat.
- E25-03: Đo bước người mới, điểm thiếu tài nguyên và đường cải thiện khi thua; không cần cheat để hoàn tất vòng mở đầu.
- E25-04: Telemetry tối thiểu command/battle/quest/asset/frame time, có version; không thu credential hoặc nội dung riêng không cần thiết.
- E25-05: Mỗi chỉnh balance có giả thuyết, config diff, kết quả và rollback; không đổi art/luật/reward trong cùng thử nghiệm.
- E25-06: Đo lại nhịp Basic/Ultimate, thời điểm dùng Ultimate đầu tiên, sát thương/hồi phục theo lượt và giá trị nội tại sau đổi kit. Kiểm cả đồng đội/địch/boss liên quan; không chỉ bỏ một chiêu rồi giữ nguyên toàn bộ hệ số còn lại mà coi là đã cân bằng.

Gate: chơi thử thực tế và kinh tế nhất quán. Retention D1/D7 phải có dữ liệu người chơi đủ điều kiện, không bịa tỷ lệ từ simulation.

### E26. QA, release và vận hành

P1, P0 nếu phát hành lỗi · Xuyên suốt/M8–M9 · L · Dev/QA, anh duyệt release. Phụ thuộc: phạm vi mốc.

- E26-01: Domain/schema/migration/integration/browser/máy thật; có bằng chứng success/invalid/duplicate/boundary.
- E26-02: Cold/warm load, frame time, memory, tab nền, 404/chậm/mất mạng; không leak qua nhiều lần vào–ra.
- E26-03: Release manifest code/config/atlas/JSON đồng phiên bản; embedded battle khớp byte standalone, không cache ảnh cũ với metadata mới.
- E26-04: Commit/branch → preview nếu có quyền → QA/duyệt → merge/push theo nhánh đã cấu hình → xác minh Vercel + smoke URL thật.
- E26-05: Giữ release trước/cờ tắt/migration tương thích; rollback code không được rollback phá dữ liệu giao dịch.
- E26-06: Phân công xử lý lỗi/alert/support; chỉ tạo lịch theo dõi khi được ủy quyền, không tự mở monitoring ngoài phạm vi.

Gate: không P0/P1 còn mở trong release scope; có commit, test log, clip, manifest, hướng dẫn thử và rollback. Bị chặn quyền preview/deploy phải báo, không đổi bảo vệ để vượt qua.

---

## 6. Kiến trúc đích và hợp đồng triển khai

### 6.1. Tiến hóa từng phần

Giữ shell index.html và iframe battle.html trong giai đoạn chuyển tiếp. Build hiện là nguồn tạo runtime; không chọn đổi framework/engine làm bước đầu.

| Thành phần | Chủ sở hữu | Không được làm |
|---|---|---|
| Catalog | Định nghĩa tướng/item/skill/stage/reward/unlock có version | UI tự sửa định nghĩa để hợp save |
| PlayerState | Sở hữu, level, inventory, đội, progress dài hạn | Renderer tự cộng tiền/thưởng |
| NavigationState | Route, params, back, modal, filter/scroll | Mỗi màn có router/listener cạnh tranh |
| BattleSession | Snapshot, seed, phase, round, action, outcome | DOM/audio/timer hình ảnh quyết định luật |
| Application command | Kiểm luật, thực hiện giao dịch, phát event | Trừ tiền trước rồi mới kiểm config |
| Storage/network adapter | Lưu revision/receipt và giao tiếp | Domain phụ thuộc localStorage/DOM trực tiếp |
| Renderer/audio | Vẽ/phát theo snapshot/event | Tự đổi target, hết hạn buff hoặc settle |
| Server khi online | Identity/quyền/time/ledger/kết quả có thẩm quyền | Tin balance/winner client tự khai |

Tách module khi đang xử lý một invariant thật. Không chia file cơ học hàng loạt, không để compatibility adapter trở thành monolith mới.

### 6.2. Contract tối thiểu cần khóa ở M1

| Contract | Trường tối thiểu đề xuất | Invariant |
|---|---|---|
| CatalogVersion | version, entity IDs, refs, checksum | Mọi ref tồn tại; ID không đổi khi dịch tên |
| HeroSkillKit | heroId, kitVersion, basicId, ultimateId, passiveIds, legacySkillMap | Kit mới có đúng hai loại hành động chính; nội tại khai báo trigger/giới hạn; mapping và đầu tư cũ truy vết được |
| PlayerSave | schemaVersion, revision, profileKind, heroes, squad, inventory, progress | QA/player tách biệt; migrate không tự cấp lại tài sản |
| Command | commandId, type, actorId, expectedRevision, payload | Retry cùng ID trả cùng kết quả |
| TransactionReceipt | transactionId, sourceId, reason, debit, credit, configVersion, committedRevision | Không số dư âm; thưởng/chi phí cùng commit |
| Encounter | sessionId, encounterId, mode, seed, teamSnapshot, rulesVersion | Một session có một snapshot/ruleset |
| BattleEvent | sessionId, sequence, type, payload | Thứ tự tăng, message trùng không áp lại |
| BattleResult | sessionId, outcome, reason, rounds, summary, replayVersion | Kết thúc/settle tối đa một lần |
| QuestDefinition | id, eventType, target, initialPolicy, prerequisites, nextId, route, rewardId | Không phụ thuộc chữ trên nút hoặc route chưa tồn tại |
| QuestProgress | questId, periodKey, value, completedAt, claimedAt, receiptId | Chuyển ngày không xóa thành tựu vĩnh viễn |
| AssetManifest | heroId, action, version, sourceSize, rects, offsets, pivot, timing, hashes | Pixel/JSON cùng bản, scale X=Y |

Tên field là contract đề xuất của Hồn Việt; không khẳng định toàn bộ đã có trong runtime.

### 6.3. Quy tắc giao dịch dùng chung

1. Nhận command và xác định state/revision hiện tại.
2. Kiểm ID, quyền, unlock, cost, stock, cap, schema và dữ liệu cần resolve.
3. Kiểm commandId đã xử lý; nếu có, trả receipt cũ.
4. Tính state mới tách khỏi state đang hiển thị; chốt debit/credit/progress/receipt cùng lần commit.
5. Lưu thành công mới báo success và phát event cho quest/badge/UI; lỗi lưu không giả hoàn thành.
6. Chuyển màn sau receipt; reload/reconnect dựa vào trạng thái đã commit.

Online thực thi phần tin cậy trên server. Không “bảo mật” bằng cách giấu nút dev hoặc mã hóa JSON client.

### 6.4. Chiến lược chuyển hệ thống cũ

- Chọn một command, ví dụ nâng level, hoặc một boundary, ví dụ kết quả trận.
- Khóa fixture và kết quả cũ; thêm module mới và adapter nhỏ.
- Nối đúng một entry point, tắt đường mutate cũ tương ứng.
- Test parity, save và browser; chỉ nhân rộng khi ổn định.
- Retire mã legacy sau khi không còn caller và có bằng chứng, không xóa trước để ép build qua.
- Riêng chuyển ba đòn sang hai đòn: tách thay luật kit khỏi thay renderer; lưu rules/kitVersion trong snapshot và replay, xử lý save theo E02-06. So parity phần được giữ và kiểm kỳ vọng mới ở phần thay đổi theo E05-09.

---

## 7. Dây chuyền asset và âm thanh

### 7.1. Đầu vào → đầu ra có QC

| Bước | Công việc | Đầu ra / điều kiện |
|---|---|---|
| Concept và bộ chiêu | Tạo hình gọn, Basic/Ultimate/nội tại, footprint mục tiêu; dự kiến từng asset và độ khó VFX | Có phương án sản xuất theo mục 7.7 trước đặt nguồn; không mặc định thêm Skill 1 |
| Nhận nguồn | Lưu tên gốc/hash, đúng hero/action, FPS/duration/frame count/dimensions/alpha/quyền dùng | Source manifest; thiếu/hỏng báo chính xác, không lấy file gần tên thay |
| Kiểm nguồn | Xem đầu/giữa/cuối và toàn loop; kiểm identity, baseline, crop, blur, màu, alpha | Báo đạt/cần sửa; không âm thầm “hút” mọi pixel đen |
| Chuẩn hóa | Giữ nguồn gốc; crop cố định hoặc trim từng frame có offset; scale đồng nhất | Sequence normalized + metadata trong cùng hệ tọa độ |
| Pack | Atlas theo giới hạn runtime/thiết bị, gutter, thứ tự frame; tắt rotate nếu chưa hỗ trợ | Atlas pages + rect/offset/pivot/duration |
| Validate | Rect trong atlas, đủ frame, URL/version/hash, alpha round-trip nếu lossless | Máy kiểm báo lỗi theo frame; file nhỏ không thay QC |
| Preview | Nền sáng/tối/trong suốt, silhouette gốc, full loop, facing và transitions | Clip đối chiếu và các frame mốc |
| Tích hợp | Registry/bundle UI–battle–result dùng đúng contract, event cast/impact/audio | Một action đúng mọi slot, không hardcode đường dẫn rải |
| Nghiệm thu | Mobile/PC, Basic/Ultimate/nội tại/Idle/result, nhiều lần vào–ra; kiểm thêm Skill 1 cũ khi tướng còn trong giai đoạn chuyển đổi | Test + clip + người duyệt; kit đích có hai đòn chính; sau đó mới nhân rộng |

### 7.2. Cách crop không rung/co người

Nếu pack lưu rect ở kích thước nguồn, với pivot ở canvas nguồn chung:

    drawX = anchorX + (trimOffsetX - pivotX) * scale
    drawY = anchorY + (trimOffsetY - pivotY) * scale
    drawW = trimWidth  * scale
    drawH = trimHeight * scale

Nếu pack đã resize, manifest phải ghi packedScale và quy đổi rect/offset về cùng hệ trước khi áp công thức. Không lấy rect pixel trên atlas thu nhỏ trộn với pivot nguồn lớn.

Phần cắt thay đổi theo frame nhưng vị trí gốc/scale tham chiếu không thay đổi. Không fit mỗi bbox vào cùng một ô; không lấy pixel thấp nhất của áo/vũ khí làm chân mới. Foot anchor dùng landmark đã duyệt; crop phải tính cả VFX alpha mờ có ý nghĩa.

Basic và Idle có canvas/bbox khác nhau: chuẩn hóa theo cơ thể và mốc chân ở một hệ tham chiếu cố định, không theo chiều cao file. Đừng lấy hệ số Basic của Lục áp sang mọi skill/tướng.

### 7.3. Bản Lục Ảnh đang cần bảo toàn

- Nguồn: IDLE(2).rar, 96 PNG RGBA 1510×1004; nguồn RGB cũ không được thay thế vào.
- Crop cố định: left 230, top 7, 976×976; cell 480×480; grid 8×12; atlas 3840×5760; 42 ms/frame.
- Runtime là **atlas WebP lossless tĩnh được Canvas đọc frame**, không phải cùng một khái niệm với animated WebP tự phát.
- Báo cáo trong repo: **21.682.860 byte ≈ 21,68 MB**, khoảng 84,4 MiB pixel RGBA nếu giải mã đầy đủ, chưa tính bản sao/overhead. Lượt kế hoạch này không encode hay đo lại.
- “Lossless” mô tả encode sau normalize; resize 976 xuống 480 vẫn giảm độ phân giải so với PNG gốc. Không quảng cáo giữ nguyên mọi pixel 1080.
- Không dùng “177 MB → hơn 5 MB” của bản trước để mô tả file hiện tại.
- Build ghép asset từ hai phần rồi kiểm hash; đây là cách lưu source, không phải hai ảnh runtime.
- Giữ nguồn có alpha; không key đen, threshold alpha hoặc tăng contrast/saturation để che vệt.
- Atlas/JSON mới phải có URL/version mới vì cache immutable. Không thay metadata riêng khi người chơi còn ảnh cũ.

### 7.4. Kế hoạch đủ 12 tướng

Theo kiểm kê source gốc, cây assets/characters có 9 skill.json cho Lục Ảnh, Đình Lôi, Thầy Mo, mỗi tướng 3 action. Đây là hiện trạng legacy, không phải số action đích của chuẩn mới. Ông Phở có family asset riêng. Không suy rằng tám tướng khác “không có ảnh”; cần audit embedded/portrait/legacy trước đặt sản xuất.

Mỗi hàng asset inventory phải có: heroId/kitVersion → source → runtime URL đang dùng → master/avatar/card → showcase/battle Idle → Basic/Ultimate và phần VFX → nội tại/icon/hiệu ứng nhỏ nếu cần → run/hit/fall cần dùng → voice/SFX → trạng thái QC → hash. Ghi riêng skill/asset legacy và đích tái sử dụng; không bỏ thông tin chỉ vì kit mới có ít đòn hơn.

**Mục tiêu mới: 12 tướng × 2 đòn = 24 contract Basic/Ultimate**, cùng nội tại và các asset hành vi cần thiết. Mốc 36 contract của thiết kế ba đòn được thay bằng mốc này. Khi roster tăng lên N tướng, phần đòn chính được tính là 2 × N. Đây là số bộ hành động, không phải số file: mỗi bộ vẫn có thể gồm cast/projectile/impact/SFX riêng. Tái sử dụng nguồn đã đạt; không ép tạo lại toàn bộ 24 bộ hoặc suy mức giảm tổng dung lượng từ phép đếm này.

Mapping chuyển bộ cũ phải lập theo từng tướng:

| Nguồn đang có | Cách dùng trong kit đích | Điều kiện |
|---|---|---|
| Basic | Ưu tiên giữ làm Basic, bao gồm cast/projectile/impact đã đạt | Giữ identity, scale, timing và điểm trúng; ghi rõ mọi đổi luật |
| Skill 1 riêng | Chọn tái sử dụng làm một trong hai đòn chính, một lớp VFX phù hợp hoặc hiệu ứng nội tại; nếu chưa phù hợp thì lưu nguồn để dùng sau | Không tự nhét toàn bộ chiêu cũ vào Ultimate; nội tại không trở thành đòn chủ động thứ ba |
| Ultimate | Ưu tiên giữ bộ chủ đạo đã duyệt; chỉ thay khi mapping tướng chỉ rõ bộ nào được chọn | Không đổi tên/điểm neo để che việc chọn nhầm asset; không tự tráo chiêu |
| Cấp kỹ năng/vật liệu đã đầu tư | Ánh xạ sang kit mới theo rule migration, có ghi nhận kết quả | Không mất hoặc nhân đôi đầu tư; xử lý rõ nhánh Skill 1 nếu save đang lưu |

Riêng Lục Ảnh, giữ đúng quan hệ nguồn: sáu hình nhân thuộc Skill 1 legacy, độc vân thuộc Ultimate legacy. Chưa có mapping cụ thể thì giữ bộ đang chạy để QA, không tự biến một bộ thành bộ kia. Nguồn alpha, scale, anchor và SFX đã duyệt tiếp tục được bảo toàn.

Thứ tự:

1. Nghiệm thu bản đang có của Lục Ảnh, Đình Lôi, Ông Phở và Thầy Mo; kiểm kê nguồn và kit cũ, chưa đặt thêm art chỉ để đổi style.
2. Chốt mapping Basic/Ultimate/nội tại cho một tướng mẫu, khai báo kitVersion và cách xử lý đầu tư cũ; giữ manifest/renderer và kích thước cảm nhận chung, lấy Ông Phở làm tham chiếu đã duyệt.
3. Chuyển tướng mẫu qua hồ sơ → trận → result, kiểm save/UI/audio, nhịp Ultimate và nội tại; có clip ×1/×2/×3 và balance trước khi nhân rộng.
4. Hoàn thiện từng tướng còn lại theo vai trò thiếu trong đội và nguồn đã sẵn có; mỗi tướng phải đi hết UI → trận → result theo kit hai đòn. Tướng chưa chuyển có trạng thái legacy rõ, không coi đã xong chuẩn mới.
5. Chỉ mở batch tiếp sau QC; không làm 12 Idle trước rồi để cả 12 thiếu Basic/Ultimate, không đặt mới bộ Skill 1 như một yêu cầu bắt buộc.

Chuẩn nguồn mới tham khảo tài liệu sản xuất: battle 768×768 tối thiểu, Golden ưu tiên 960×960, showcase 1200×1200. Đây là định hướng sản xuất mới; không ép mọi nguồn đã nhận vào hình vuông hoặc upscale rồi gọi là thêm chi tiết. Runtime tier chọn theo kích thước vẽ/DPR và kết quả đo.

Hit/dodge/movement tuân kit và chuẩn hiện hành. Không thêm asset “né” hay dịch người theo phản xạ mặc định khi runtime/thiết kế đã có cách xử lý; không thay combat feel trong ticket pack ảnh.

### 7.5. Âm thanh

Nền đang có: 9 SFX event dùng chung, bus dùng AudioContext đã unlock bằng tương tác thật, source provenance trong assets/audio/sfx/sources.json. Mapping này chưa phải âm riêng của từng tướng.

Cần làm:

- Audit bộ UI/combat gốc theo nghe và ngữ cảnh; không đoán ID âm thanh là ID tướng.
- Bảng hero/action/event → file/volume/priority/timing; đặc biệt cast khác impact.
- Một câu voice vào hồ sơ và một câu Ultimate mỗi tướng khi nội dung được duyệt; kiểm nguồn đã có trước đặt thêm.
- BGM hub/hero/battle/challenge/result có chuyển cảnh/fade; result một lần, rời result dừng đúng.
- Mute/volume lưu theo người chơi; không phát dồn âm bị chặn trước unlock; giảm chồng âm AOE nhưng không bỏ event gameplay.
- SFX toàn game được chọn/tạo theo cảm giác đẹp, sống động và tươi sáng chung: âm sạch, có sắc thái/chất liệu phù hợp, lực và độ ngân vừa đủ, đồng bộ động tác/VFX. Đánh giá khi ghép nhiều nguồn để giữ rõ, dễ chịu và có điểm nhấn; đưa yêu cầu cảm giác vào brief âm thanh, không chỉ tên event/file.
- Kiểm cold cache, tab nền, quay lại, audio suspended và loa thật. File 200 hoặc source.start không chứng minh iPhone đã nghe được.

### 7.6. Hiệu năng

M0 đo bytes tải lần đầu, tải theo màn, decoded memory, frame time, số RAF/listener/context. Sau đó mới chốt budget MB/tier cụ thể.

Mục tiêu đề xuất: thao tác được phản hồi sớm khoảng 100 ms khi không chờ I/O; animation hướng tới 60 FPS ở thiết bị phù hợp, không tụt kéo dài dưới 30 FPS ở thiết bị tối thiểu được chọn. Đây là mục tiêu QA, không phải kết quả đã đạt.

Không preload mọi animation cho một thẻ roster; dùng portrait và tải detail/battle theo nhu cầu. Tách nhiều atlas page/tier nếu đo cho thấy cần; kiểm nền/alpha/memory trên máy thật trước chốt. ASTC/BC7 không phải bước “bật nén” áp trực tiếp cho Canvas 2D hiện tại; không đổi sang WebGL/engine chỉ để dùng tên định dạng.

### 7.7. Tạo hình và VFX phải có phương án sản xuất từ concept

Không giới hạn concept ở nhân vật Việt Nam. Xác ướp hoặc sinh vật fantasy khác vẫn phải cùng tỷ lệ chibi, phong cách và độ rõ khi đứng trong trận 6v6; mỗi tướng ưu tiên một điểm nhấn mạnh về dáng, vũ khí hoặc đạo cụ.

- Mỗi concept ghi rõ: tạo hình → Basic/Ultimate/nội tại → danh sách asset cần → cách tạo từng VFX → mức khó và phương án giản lược. Asset chưa có không được ghi thành đã sản xuất.
- Một prompt cho một asset với một chuyển động chính dễ nhận biết. Character cast tách khỏi VFX khi cần; projectile/wave/impact tạo độc lập theo đúng chức năng, không ép mọi chiêu phải có đủ ba lớp.
- Ưu tiên vệt chém, projectile đơn, vòng sáng, sóng lan, bụi/khói hoặc cột hiệu ứng có footprint rõ. Chiêu diện rộng có thể dùng một VFX vùng hoặc tái sử dụng tại các slot theo nhịp; kích thước VFX độc lập với tướng và đủ độ phân giải.
- Hạn chế concept phụ thuộc vào cơ thể vỡ rồi ráp chính xác, biến hình nhiều dạng, dây quấn khớp từng bộ phận, đàn sinh vật biến đổi liên tục hoặc cuộn/biến dạng cả sân. Nếu giữ ý tưởng đó, phải có phương án đơn giản và QC độc lập trước sản xuất hàng loạt.
- Camera/framing/scale của nguồn giữ cố định, tướng mặc định hướng sang phải; nền chroma #00FF00 sạch hoặc alpha thật theo nguồn. Giữ đầy đủ frame; không dùng đổi camera hay cắt frame để làm chiêu có vẻ mạnh hơn.
- Prompt VFX mới phải có SFX đồng bộ trong video nguồn để tách audio và gắn đúng release/impact. Nội tại ưu tiên icon/status hoặc VFX nhỏ dùng lại; tránh phát chồng nhiều âm khi lặp hiệu ứng ở sáu vị trí.

Ví dụ minh họa, chưa thêm vào roster: xác ướp dùng Basic quật nắp quan tài với impact bụi đá; Ultimate tạo các cột cát bằng một VFX phát tại vị trí địch; nội tại tăng chống chịu khi máu thấp theo config và hiển thị icon. Bộ này chỉ yêu cầu hai động tác chính, giữ được một dấu ấn tạo hình rõ.

### 7.8. Asset đi cùng tính năng và danh sách chờ anh tạo

Mỗi ticket có một bảng asset: **ID → tính năng/đối tượng → loại → nguồn đã có hoặc cách tạo → vị trí/thời điểm phát → owner → trạng thái → file/prompt → bằng chứng**. Khi chưa có đủ đầu vào, ghi rõ phần thiếu. Trạng thái dùng: cần kiểm nguồn / cần gen ảnh / cần anh tạo / đã có nguồn / đã tích hợp / đã nghiệm thu. “Có nguồn” và “đã tích hợp” là hai trạng thái khác nhau.

**Nhánh ảnh tĩnh:** agent kiểm nguồn → gen bằng Imagen khi thiếu → QC → gắn đúng asset vào source → xem UI thật → ghi file và bằng chứng. Không chuyển trách nhiệm tạo ảnh tĩnh thông thường sang anh hoặc gom toàn bộ sang đợt art cuối.

**Nhánh animation/VFX/SFX cần anh tạo:** agent chuẩn bị một brief có tên/ID, mục đích, số asset, kích thước/tỷ lệ, nền/alpha, thời lượng/loop nếu có, camera/anchor, nhịp hành động và nhịp âm thanh. Gửi prompt hoàn chỉnh phù hợp công cụ anh dùng; một prompt cho một asset. Nếu anh làm sau, lưu brief/prompt cùng mục chờ, ghi “cần anh tạo”, nêu điểm cần tích hợp và nhắc lại khi tiếp tục tính năng đó. Quy tắc prompt VFX có SFX đồng bộ của mục 7.7 vẫn áp dụng.

Mọi brief/prompt phải có mục cảm giác mong muốn: **đẹp, sống động, tươi sáng**, mô tả cụ thể chuyển động, màu/ánh sáng, điểm nhấn và chất âm của asset đó. Định nghĩa cách QC sau khi nhận nguồn: độ mượt, độ rõ, màu sắc/ánh sáng, nhịp âm-hình và cảm giác trong UI/combat thật. Ghi yêu cầu này ngay cả khi nguồn được hẹn anh tạo sau.

**Danh sách khởi đầu cho Rèn Mộng — việc phải xử lý khi tiếp tục E11:**

| ID | Hạng mục | Vị trí/thời điểm | Người thực hiện và việc kế tiếp | Trạng thái |
|---|---|---|---|---|
| IMG-E11-ITEM | Ảnh từng mẫu vũ khí, giáp, bùa, giày đúng tên và hình dáng | Phôi Song Rèn, kết quả ra lò, kho, trang bị tướng, xác nhận phân giải | Agent kiểm catalog/nguồn; gen ảnh thiếu bằng Imagen, QC và gắn vào cùng định nghĩa item | Cần kiểm nguồn; tạo và đặt phần còn thiếu ngay khi tiếp tục E11 |
| IMG-E11-MATERIAL | Ảnh các vật liệu rèn/nâng cần hiển thị | Chi phí, số dư, vật liệu nhận lại | Agent tái sử dụng ảnh đúng nghĩa hoặc gen phần thiếu, dùng đồng bộ trên các màn | Cần kiểm nguồn |
| ANIM-E11-FORGE | Động tác rèn/lò rèn với nhịp gõ dễ đọc | Sau khi bắt đầu thao tác, chuyển sang kết quả đã commit | Agent chốt brief và prompt; chủ động gửi anh tạo nguồn nếu chưa có nguồn phù hợp | Cần kiểm nguồn và chuẩn bị yêu cầu cho anh |
| SFX-E11-HAMMER | Tiếng búa rèn “keng keng” | Đồng bộ từng contact beat của animation; dừng khi rời màn | Agent nghe/đối chiếu bộ SFX đã gửi; nếu thiếu, gửi anh yêu cầu hoặc lấy SFX đồng bộ từ video rèn | Cần kiểm nguồn; phần thiếu ghi cần anh tạo |
| VFX-E11-REVEAL | Hiệu ứng ra lò/reveal món đồ, ưu tiên một lớp gọn dễ tạo | Hiện ảnh đúng món sau commit, âm thành công nếu cần | Agent chuẩn bị phương án tái sử dụng hoặc prompt VFX có SFX; gửi anh phần nguồn cần tạo | Cần thiết kế và kiểm nguồn |

Bảng này ghi nhu cầu cần thực hiện; lần cập nhật plan này chưa gen ảnh, tạo âm thanh/animation hoặc tích hợp các mục trên. Khi bắt tay vào E11, phải cập nhật từng hàng bằng kết quả kiểm nguồn, file/prompt và trạng thái thực, không giữ “cần kiểm nguồn” rồi bỏ qua.

**Danh sách khởi đầu cho hồ sơ tướng — E09-08/E24-07:**

| ID | Hạng mục | Vị trí/yêu cầu | Người thực hiện và việc kế tiếp | Trạng thái |
|---|---|---|---|---|
| IMG-E09-SHOWCASE-BG | Background hồ sơ tướng có chiều sâu | Bố cục dọc mobile, không gian đứng rõ; tiền/trung/hậu cảnh, ánh sáng và chủ đề hợp tướng; chừa vùng nhân vật cùng UI | Agent kiểm cảnh đang dùng, gen cảnh còn thiếu bằng Imagen, QC và tích hợp phía sau Idle; có thể tái sử dụng cảnh phù hợp cho nhóm tướng | Cần kiểm nguồn/bố cục; thực hiện cùng lát cắt hồ sơ tướng |
| UI-E09-SHOWCASE-FLOW | Bố cục và độ mượt khi xem tướng | Chân/bóng/anchor ổn định; tên, stat, tab, nút rõ; mở/đổi/back mượt, không nháy cảnh hoặc restart Idle do cập nhật stat | Agent kiểm trên UI thật, tối ưu tải/cache và lifecycle hiện có; ghi ảnh/clip, số đo phù hợp và thiết bị đã thử | Cần nghiệm thu cùng background |

Brief background phải ghi chủ đề, góc nhìn, mặt đứng/điểm đặt chân, hướng sáng, vùng dành cho tướng và vùng an toàn cho UI; scene art không vẽ sẵn nhân vật, tên hay nút. Độ sâu có thể tạo ngay trong ảnh bằng phối cảnh và lớp cảnh; chỉ thêm parallax/animation khi phục vụ trải nghiệm và có ngân sách hiệu năng. Các hiệu ứng hoặc âm thanh cần nguồn mới vẫn được báo anh/lưu chờ theo cùng quy tắc phía trên.

---

## 8. Bản đồ màn hình và tiêu chí UI/UX

Giữ khung điều hướng lõi hiện hành: Thành Chính, Tướng, Trợ trận/đội hình, Lịch Luyện, Chinh Chiến. Việc gộp/đổi tên một route phải có mapping và giữ đường back.

| Màn/nhóm | Hành động chính | Dữ liệu cần thật | Luồng trở về |
|---|---|---|---|
| Hub | Đến ngay / vào nhánh đã mở | Nhiệm vụ, tiền, thể lực, badge | Điểm gốc; panel không che icon |
| Roster/Đồ giám | Chọn tướng, lọc/sort | Sở hữu, level/sao/power, hệ | Giữ filter/scroll khi detail đóng |
| Hồ sơ 5 tab | Nâng, xem Basic/Ultimate và phần nội tại, xem đồ, duyên, tinh thông | Chỉ số/cost/đồ/điều kiện và kitVersion khớp combat | Back đúng nơi mở, không restart idle mỗi cập nhật |
| Đội hình | Đổi/lưu 6 slot | Sở hữu, power, synergy hợp lệ | Trả đúng roster/mode nguồn |
| Chinh Chiến | Tiếp tiến độ | Stage, unlock, đội địch, thưởng | Sau result giữ luật auto-chain |
| Battle | Tốc độ/âm thanh/hành động được hỗ trợ | HP/status/target/round thực | Kết quả một lần |
| Victory/Defeat | Xác nhận/Ải sau/đường mạnh lên | MVP, thống kê, receipt | Nguồn trận hoặc bước mạnh lên, không màn trắng |
| Gọi Mộng | Roll/reveal/history | Pool, rate, cost, pity, duplicate | Roster thấy tướng mới; lỗi không trừ tiền |
| Túi/Rèn | Dùng/mặc/nâng/tái chế | Item instance, stat, cost, lock | Hồ sơ phản ánh món và sức mạnh mới |
| Chợ | Mua/refresh | Giá, tiền tệ, stock, reset | Resource/badge cập nhật |
| Daily/việc/thư | Đi tới/nhận/phái tướng | Tiến độ, kỳ, timer, receipt | Hub badge hết đúng |
| Tháp/Boss/viễn chinh | Chọn đội/bắt đầu/resume | Ruleset, lượt, progress riêng | Không nhảy campaign |
| Arena | Chọn đối thủ/đội phòng thủ | Snapshot, rating, season | Lịch sử trận và reward server |
| Bạn bè/Chat/Bang | Giao tiếp/hoạt động có quyền | Tài khoản/kênh/vai trò thật | Gia tộc ở trong Bang, không icon trùng |
| Lễ hội/meta | Tham gia/đổi/đọc/nuôi theo scope | Eligibility/lịch/currency/lore | Không tạo route cụt |
| Cài đặt/hỗ trợ | Âm lượng, tài khoản, thông tin bản, báo lỗi | Settings và build thật | Thao tác nguy hiểm cần xác nhận |

Chuẩn chung: primary CTA thấy ở viewport đầu; chữ Việt không tràn; vùng chạm đủ rộng; safe area; không fixed/sticky lồng tùy tiện. Loading có retry; chưa có chức năng thì khóa có lý do, không toast giả thành công. Trên PC giữ tỷ lệ và vùng chơi ổn định, không kéo nhân vật để lấp màn.

---

## 9. QA và điều kiện được báo “xong”

### 9.1. Ma trận bắt buộc

Các dòng là yêu cầu kiểm thử trong tương lai, không mang trạng thái PASS của lượt lập kế hoạch.

| QA | Ca kiểm | Điều kiện đạt |
|---|---|---|
| Q01 | Save trắng → vòng mở đầu | Đủ đường kiếm tướng/tài nguyên; không cheat hoặc dead-end |
| Q02 | Save cũ → migrate → reload hai lần | Không mất hoặc tự cấp lại tài sản, giữ đội/level/equip |
| Q03 | Roster → lọc → Lục → nâng → back → vào lại | Đủ card, số liệu mới, giữ state và không màn trống |
| Q04 | Idle UI/battle/result toàn loop | Không méo/rung do crop/cắt; đúng nguồn RGBA |
| Q05 | Idle → Basic → Idle Lục | Thân/chân giữ tỷ lệ tham chiếu, VFX scale độc lập |
| Q06 | Đình Lôi mọi action + portrait MVP Ông Phở | Cell retina đúng; không cắt người/placeholder do tải chậm |
| Q07 | Detail mở/đóng 20 lần | Không tăng RAF/listener/memory vô hạn; voice không chồng |
| Q08 | PC battle đang chạy và resize | Backing size ổn định; không nháy do clear/camera/resize loop |
| Q09 | Audio UI/cast/impact/Ult/result | Nghe đúng event trên thiết bị thật; mute/resume không phát dồn |
| Q10 | Victory → Xác nhận/Ải sau/auto-chain | Settle một lần, mở đúng encounter/route; cuối nội dung có đích |
| Q11 | Defeat → mạnh lên → retry, thiếu lượt | Quay lại đúng trận, cost theo rule; không iframe trùng |
| Q12 | Double tap/message trùng/iframe cũ | Không nhân trận/thưởng/command |
| Q13 | Reload lúc settling/navigating | Receipt/progress nhất quán, không mất hay nhận đôi |
| Q14 | Seed cố định ×1/×2/×3 | Cùng outcome/target/round; chỉ tốc độ trình bày thay đổi |
| Q15 | Hiệp 15, hòa, chết đồng thời, revive/CD/status | Đúng rule và boundary, không turn ma |
| Q16 | Nâng/reset/đổi đội/mặc đồ | Stats nguồn → UI → snapshot combat đồng nhất |
| Q17 | Banner invalid/paid/free/pity/roll10/skip | Không charge lỗi; reveal/reload giữ cùng kết quả |
| Q18 | Túi/rèn/shop/claim-all retry và ghi lỗi | Atomic, không âm/nhân item, lock đồ đúng |
| Q19 | Daily/weekly/achievement/event trùng | Đúng kỳ, không đếm đôi hoặc xóa lịch sử |
| Q20 | Giao việc refresh/claim/reload | Không đổi instance đang chạy, không thêm lượt/thưởng |
| Q21 | Offline dài/đổi giờ máy/tab nền | Theo clock policy, có cap; không giả server time |
| Q22 | Tháp/boss/viễn chinh win/lose/abandon | Tiến độ/reward riêng, không đẩy campaign |
| Q23 | Hai tài khoản/thiết bị/cloud conflict | Quyền đúng, không ghi đè revision mới |
| Q24 | Arena giả winner/season đóng giữa trận | Server từ chối giả; rating/season payout một lần |
| Q25 | Chat/block/report/guild đổi quyền/rời | Quyền kênh và dữ liệu đúng, có moderation |
| Q26 | Event open/close/retry jobs | Eligibility/currency/claim theo version, kết sổ an toàn |
| Q27 | 404/chậm/atlas JSON khác version | Fallback rõ, không vẽ ô sai; retry không kẹt màn |
| Q28 | Cold/warm load/full roster/team | Có số đo tải/frame time/memory; không preload vô tội vạ |
| Q29 | Preview → production → rollback | Đúng commit/manifest; save tương thích; smoke route thật |
| Q30 | Mọi màn first viewport/back/empty/locked | CTA rõ, không overlay chặn, không số giả/nút giả |
| Q31 | Tướng đã chuyển kit: hồ sơ → Basic/Ultimate → result | Đúng hai loại đòn chính, không cast Skill 1 legacy; điều kiện/tài nguyên Ultimate và mô tả khớp config |
| Q32 | Nội tại, event lặp, truy kích/phản kích, chết/choáng | Trigger/giới hạn đúng; không lặp vô hạn hoặc nhân damage/lượt từ callback animation; icon/VFX/SFX đúng nhịp |
| Q33 | Save ba đòn → kit hai đòn → reload/migrate lại | Giữ sở hữu/đầu tư theo mapping; không mất/nhân cấp hoặc vật liệu; asset/anchor đúng danh tính và rules/kitVersion truy vết được |

### 9.2. Thiết bị và bằng chứng

- Chọn ít nhất một iPhone Safari thật, Android Chrome tầm trung, tablet và PC; ghi model/OS/browser cụ thể.
- Chrome responsive 390×844, 430×932 và khung PC chỉ giúp kiểm bố cục, **không thay cho Safari/loa/RAM/touch thật**.
- Mỗi bằng chứng ghi commit, config/asset version, save fixture, viewport/DPR, browser, bước bấm, ảnh/clip và log.
- P0 chạy trên mọi thiết bị mục tiêu. P1 chọn tổ hợp rủi ro và bổ sung từ lỗi thực.
- Không có thiết bị/quyền thì ghi “chưa kiểm”; không lấy unit test hoặc screenshot đứng yên để ký nghiệm thu animation.
- Không thay save thật của anh để chạy QA. Dùng profile/fixture tách biệt và giữ bản sao trước migration.

### 9.3. Definition of Ready

Ticket chỉ vào đợt code khi có mục tiêu người chơi, nguồn yêu cầu, ID, scope không làm, owner, phụ thuộc, contract/cost/reward, asset đầu vào, đường back, test và rollback. Quyết định thiếu phải ghi blocker; không tự chọn economy/roster/hạ tầng thay anh.

Asset đầu vào gồm nhu cầu hình tĩnh và phản hồi animation/VFX/SFX. Ảnh tĩnh agent có thể gen được là công việc trong ticket, không phải lý do chờ anh cung cấp. Nguồn động/âm thanh cần anh tạo phải có yêu cầu cụ thể và mục chờ theo 7.8.

### 9.4. Definition of Done

- Hành động chính chạy qua UI thật, có tác dụng và lưu đúng.
- **Mọi tính năng đều có gate UI/UX:** hình ảnh, bố cục, độ rõ của thao tác, phản hồi, trạng thái chờ/trống/khóa/lỗi/thành công, điều hướng/back và độ mượt được kiểm theo mục 3.2. Logic đạt chưa đủ để đóng toàn bộ tính năng; phần còn thiếu phải có việc tiếp theo rõ ràng.
- Animation/VFX/SFX đã tích hợp phải được QC cảm giác đẹp, sống động, tươi sáng theo 3.2/E24-08, với nhịp âm-hình, độ rõ, âm lượng và hiệu năng phù hợp. Ghi riêng kết quả kiểm kỹ thuật và đánh giá thẩm mỹ/cảm giác của anh.
- Hình ảnh cần thiết đã được gen/tái sử dụng và đặt vào đúng tính năng, đúng vật phẩm trên các màn liên quan; có bằng chứng UI thật. Không để toàn bộ phần hình ảnh của tính năng hiện tại sang “asset làm sau”.
- Với hồ sơ tướng, background có chiều sâu và điểm đứng hợp lý đã được tích hợp; kiểm bố cục/độ đọc mobile cùng Idle, đổi tab/đổi tướng/back và tải lạnh/ấm. Độ mượt phải có kiểm runtime phù hợp; ảnh tĩnh không tự chứng minh animation hoặc thao tác đã mượt.
- Animation/VFX/SFX cần thêm đã được chủ động báo anh hoặc ghi thành mục chờ có brief/prompt, owner và trạng thái. Phần còn chờ chưa được tính là hoàn thành/nghiệm thu.
- Success/invalid/duplicate/boundary đều được thử phù hợp.
- Không hồi quy các luồng đã duyệt; asset/JSON/source cùng version.
- Có test log và clip khi liên quan animation; tách kết quả máy thật khỏi mô phỏng.
- Handoff cập nhật file, commit, thay đổi, giới hạn và cách thử.
- Nếu ticket có phát hành: Vercel đúng commit và smoke production xác nhận; chưa deploy ghi chưa deploy.
- P0/P1 còn mở phải được sửa hoặc loại minh bạch khỏi phạm vi release, không đánh dấu xong cả nhóm.

---

## 10. Đợt triển khai tiếp theo: thứ tự cụ thể

Các gói dưới đây không tương ứng với số ngày hay số commit cố định. Đây là hàng đợi đầu tiên; mỗi hàng có thể tách tiếp. M0 nghiệm thu fix hiện tại, chỉ sửa khi có bằng chứng lỗi còn tồn tại.

| Thứ tự | Gói việc | Mã liên quan | Đầu ra để anh thử/kiểm |
|---|---|---|---|
| R01 | Khóa main mới nhất, build/test baseline, save fixture | E01-01/04/05 | Manifest và bảng đúng/sai/chưa thử; không copy source cũ |
| R02 | Roster mobile/back/lifecycle regression | E01-02, E04, E09-01/02 | Clip iPhone và PC: lọc → Lục → nâng → back → mở lại |
| R03 | Lục Basic, Đình Lôi retina, MVP, PC flicker | E23-01, E24-05, E06-06 | Clip các action và result; ghi riêng fix mới nào chưa đạt |
| R04 | SFX trên máy thật và bảng mapping hiện tại | E24-04 | Nghe/đối chiếu 9 event, mute/resume; danh sách âm riêng chưa map |
| R05 | Catalog/seed QA, thiết kế seed player và mapping kit | E02-01/02/05/06 | 12 ID thống nhất; mapping Basic/Ultimate/nội tại của tướng mẫu; đề xuất đội khởi đầu/banner cho anh duyệt; chưa thu hồi save cũ |
| R06 | Save version/revision + migration fixtures | E02-03/04 | Save cũ/mới/ghi lỗi/multi-tab có test và phục hồi |
| R07 | Transaction/receipt tối thiểu | E03 | Lệnh nhận thưởng và nâng tướng atomic; retry không nhân/mất |
| R08 | Settlement + navigation một chủ quản | E06, E04 | Trận → thưởng → tiếp ải; reload/click đôi không mở hai trận |
| R09 | Banner hợp lệ và lệnh thu thập tối thiểu sau D02 | E12, E09–E11 | Nhận tướng → sở hữu → xếp đội → nâng/mặc đồ thực, không giá trị giả |
| R10 | Vòng mở đầu qua main quest | E07/E08/E25-03 | Một chương/lát cắt nội dung đã chọn chơi xuyên suốt bằng tài khoản mới |
| R11 | Chuyển một tướng mẫu sang kit hai đòn, rồi mở rộng ở M3 | E02-06, E05-07/08/09, E09-07, E23, E25-06 | Hai đòn + nội tại hoạt động, mapping/save/UI/audio đồng bộ; clip ×1/×2/×3 và kiểm balance trước nhân rộng |

R02–R04 có thể kiểm song song bằng các fixture độc lập. R06–R08 cần contract state đã chốt. R09 chỉ triển khai thiết kế banner đã duyệt. Không để phần chờ D02 cản việc đo/kiểm/sửa regression độc lập.

**Áp dụng ngay cho phần đang làm:** khi tiếp tục Rèn Mộng, hoàn thiện E11-07 và bảng 7.8: kiểm từng mẫu item, gen và gắn ảnh còn thiếu, chuẩn bị yêu cầu animation rèn/tiếng búa/reveal. Quy tắc ảnh đi cùng tính năng áp dụng cho mọi gói R và E, không chỉ riêng Rèn; không đợi hoàn tất R11 hoặc toàn bộ roster mới làm ảnh của trang bị.

Với lát cắt hồ sơ tướng/R05/R11 tiếp theo, đưa E09-08/E24-07 và IMG-E09-SHOWCASE-BG vào cùng ticket: chủ động tạo và đặt background có chiều sâu, kiểm toàn bộ bố cục và độ mượt. Không để việc chuyển kit chỉ cập nhật mô tả mà bỏ qua cách tướng được trình bày trong hồ sơ.

Chuẩn concept hai đòn và bảng asset mới áp dụng ngay trong công việc thiết kế; triển khai runtime theo R05/R06/R11 khi có mapping và nền state. Việc cập nhật plan không có nghĩa R11 đã được code hoặc nghiệm thu.

**Điểm dừng trình anh:** hết M0 có clip các lỗi cũ; hết M2 có bản vòng chơi mở đầu; hết M3 có vòng nuôi đội hoàn chỉnh. Sau mỗi lần duyệt mới nhận thêm phạm vi phù hợp.

---

## 11. Cách giao việc để Luna tiếp tục được

### 11.1. Thứ tự đọc

1. AGENTS.md và AI-HANDOFF.md của commit mới nhất.
2. docs/LUNA-HANDOFF.md cho bản đồ lỗi/asset/build; chú ý ngày/commit của từng ghi chú.
3. docs/SAMKOK-REFERENCE-ALIGNMENT.md cho hướng sản phẩm.
4. Master Plan này cho mốc/ticket; mở đúng domain/script đang tạo runtime.
5. Nếu sửa asset, đọc chuẩn sản xuất và hợp đồng riêng đang active. Tài liệu cũ nói key nền đen bị thay thế bởi hợp đồng RGBA mới.

Khi tài liệu mâu thuẫn: yêu cầu mới nhất của anh → quyết định sản phẩm đã duyệt → nguồn/runtime tại commit đã kiểm → tài liệu lịch sử. Code hiện tại là bằng chứng trạng thái, không phải lý do giữ một bug hoặc bỏ yêu cầu đã duyệt.

### 11.2. Mẫu một ticket

    ID:
    Mục tiêu người chơi:
    Nguồn yêu cầu / reference:
    Baseline commit:
    Quan sát / suy luận / chưa xác minh:
    Phụ thuộc và quyết định đã duyệt:
    File/domain được phép sửa:
    Không làm trong ticket:
    Input / output / invariant:
    Hình tĩnh cần có / nguồn dùng lại / ảnh phải gen bằng Imagen:
    Vị trí tích hợp ảnh và đối tượng/itemId tương ứng:
    Animation / VFX / SFX cần có, nhịp phát:
    Phần cần anh tạo / brief-prompt / ID mục chờ / trạng thái:
    Bước tái hiện:
    Thay đổi dự kiến:
    Unit / integration / browser / thiết bị thật:
    Điều kiện nghiệm thu:
    Migration / rollback:
    Commit / deployment nếu được ủy quyền:
    Bằng chứng và việc còn mở:

Một ticket = một kết quả có thể kiểm. Ví dụ “sửa toàn bộ combat” phải tách; “reload khi nhận thưởng không cộng lần hai” là phạm vi đủ cụ thể.

### 11.3. Quy trình bắt buộc

- Đọc diff và giữ thay đổi người khác; không mặc định scratch đầy đủ như repository.
- Tái hiện/đo trước; chọn một giả thuyết, một đường xử lý.
- Đọc mục 3.2 và danh sách 7.8; tự xác định asset cần cho tính năng. Gen và tích hợp ảnh tĩnh còn thiếu ngay; chủ động gửi anh yêu cầu nguồn động/âm thanh hoặc lưu mục chờ có thể tiếp tục được.
- Áp dụng tiêu chuẩn UI/UX cho mọi tính năng đang nhận, kể cả chưa có ví dụ riêng trong plan. Hai danh sách Rèn/hồ sơ tại 7.8 là mẫu: mở thêm các hàng asset/UX tương ứng cho tính năng hiện tại, không bỏ qua chỉ vì chưa có ID mẫu sẵn.
- Sửa source hoặc patch tạo runtime, không sửa riêng dist rồi báo hoàn thành.
- Build theo package.json. Lệnh npm test hiện tự build và chạy test tuần tự vì atlas lớn; không tự tăng song song gây hết RAM.
- Kiểm output cuối: embedded battle khớp battle.html, script parse được, hook đúng số lần, asset URLs/metadata đồng bộ.
- Thử bằng nút người chơi thực; gọi hàm nội bộ chỉ là kiểm phụ.
- Có blocker quyền/asset/thiết kế thì dừng đúng phạm vi và báo; không đổi bảo vệ, credential hoặc dữ liệu thật để vượt.
- Chỉ push/merge/deploy khi có ủy quyền của tác vụ triển khai; bản kế hoạch này không phải ủy quyền đó.
- Bàn giao bằng: sửa gì → commit → test thực chạy → URL nếu có → chưa thử → việc kế tiếp.
- Bàn giao asset kèm theo: ảnh nào đã đặt vào đâu, animation/VFX/SFX nào đã gắn, mục nào cần anh tạo và brief/prompt tương ứng. Không chỉ ghi chung “asset để sau”.

### 11.4. Những cách không được lặp lại

Không dò text để tạo roster; không crop bỏ pivot; không scale X/Y riêng; không đổi ảnh giữ URL immutable; không key mọi pixel tối; không thêm RAF/listener/router để che lỗi; không bật lại global clock cũ; không map tên file SFX thành tên tướng bằng đoán; không tự mở 12 tướng trong mọi migration; không tin “build thành công” là Safari/production PASS.

---

## 12. Quyết định còn mở và phạm vi không tự mở

Các mã D bên dưới thuộc **v2**, thay cho danh sách D cũ; mã E tiếp tục giữ tương thích.

**Đã chốt trong lần cập nhật này:** hướng thiết kế Basic + Ultimate + nội tại; concept mới không bắt buộc Skill 1; ưu tiên VFX dễ sản xuất; tướng không bị giới hạn ở văn hóa Việt Nam. Không hỏi lại các định hướng này khi bàn giao. Mapping từng tướng cũ và thông số cân bằng được hoàn thiện trong các ticket liên quan; chưa coi bộ ba đòn đang chạy là đã chuyển xong.

**Đã chốt bổ sung:** ảnh tĩnh đi cùng tính năng, agent tự gen bằng Imagen và tích hợp khi cần; animation/VFX/SFX phải chủ động nhờ anh tạo hoặc ghi chờ cụ thể theo 3.2/7.8. Đây là quy tắc thực hiện đã được giao, không phải một quyết định D mới cần xin lại.

Hồ sơ tướng có background chiều sâu và UI/UX đẹp, mượt cũng là yêu cầu đã chốt. Agent chủ động hoàn thiện theo mục 3.2, E09-08 và E24-07, rồi đưa bằng chứng để anh đánh giá cảm giác hình ảnh.

| Quyết định | Đề xuất để anh duyệt | Chặn phần nào |
|---|---|---|
| D01 — Đội khởi đầu và QA unlock-all | Giữ profile QA đủ 12; player mới có đội/đường nhận được thiết kế; save cũ giữ sở hữu | Seed player và tutorial phát hành |
| D02 — Banner toàn SSR | Giữ phẩm chất; bảng pool/chi phí/pity/bù trùng minh bạch. Có thể dùng lượt tặng/bảo đảm tutorial tách riêng | Mở Gọi Mộng hoàn chỉnh; chưa áp tỷ lệ mới |
| D03 — Alpha trước, online tới đâu, hạ tầng | Duyệt lõi một người trước; chốt provider/ngân sách/phạm vi trước tạo backend thật | E18 triển khai, E17/E19/E20 online |
| D04 — Tài sản offline chuyển online | Không tin toàn bộ số dư local; chốt bảo toàn dữ liệu cũ và chính sách nhập có kiểm chứng | Liên kết guest/cloud kinh tế thật |
| D05 — Thiết bị tối thiểu và asset tier | Đo iPhone lỗi cũ + Android tầm trung; duyệt so sánh hình trước đổi chất lượng | Budget tải/memory và gate beta |
| D06 — Nhánh mở rộng/thương mại | Hoãn pet sâu, pass trả phí, tiền thật, chiến bang nâng cao nếu chưa có spec/duyệt | Không chặn lõi; chỉ chặn nhánh tương ứng |

Không cần anh trả lời tất cả để bắt đầu M0. Roster 12 và Samkok đã chốt, không hỏi lại chỉ vì tài liệu cũ khác tên. Không tự thêm thanh toán/VIP/quảng cáo/cơ chế xác suất ẩn.

### Rủi ro và cách kiểm soát

| Rủi ro | Biện pháp |
|---|---|
| Patch chồng, sửa bản không chạy | Theo build chain và output cuối; một owner; boundary fail rõ |
| Fix asset mới làm méo hoặc cắt nhân vật khác | Metadata riêng, pixel/loop test, không thay scale toàn roster |
| Lỗi Safari bị bỏ sót | Gate máy thật; Chrome responsive chỉ là chứng cứ bố cục |
| Save đổi seed làm mất tướng | Profile QA/player riêng, migration không thu hồi, backup và fixtures |
| Banner/claim làm mất hoặc nhân tài nguyên | Validate trước debit, transaction/receipt, idempotency |
| Roster tăng khiến tải/memory vượt | Inventory/tier/lazy load, đo decoded memory, dispose đúng |
| Đổi kit làm mất đầu tư hoặc dùng nhầm asset cũ | Mapping theo heroId/kitVersion, giữ source/hash, migration có fixture; không tự tráo Skill 1/Ultimate |
| Concept độc lạ nhưng VFX khó tạo ổn định | Bảng asset và phương án giản lược trước sản xuất; ưu tiên hai đòn và hiệu ứng độc lập có thể tái sử dụng |
| Có nhiều màn nhưng vòng chơi chưa hoàn chỉnh | M2/M3 phải demo chuỗi liên hệ thống, không đóng bằng screenshot |
| Online giả hoặc tin kết quả client | Tách local/online, server authority trước rank/kinh tế chung |
| Scope không dừng | Mỗi mốc có release scope/gate; P3 chỉ sau quyết định cụ thể |
| Giao việc mất context | Ticket nhỏ + commit/evidence + cập nhật handoff, không nói “tiếp” mà thiếu mốc |

---

## 13. Nguồn và độ chắc chắn

Các link mã nguồn được khóa theo commit của lần kiểm kê để tránh main thay đổi trong lúc đọc.

- [S01 — Mốc main 1f593098, sửa retina Đình Lôi và MVP](https://github.com/bktimmy247/luc-than/commit/1f59309889deb9019c26a19522db430a4c4acf5f). Đã đọc metadata và diff; chưa chạy lại runtime commit này trong lượt lập kế hoạch.
- [S02 — Biên bản Samkok](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/docs/SAMKOK-REFERENCE-ALIGNMENT.md). Chứng cứ gián tiếp qua audit đã lưu; không tuyên bố đã xem lại toàn video.
- [S03 — Bàn giao Luna](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/docs/LUNA-HANDOFF.md). Kiểm thử 79/79 và Chrome live thuộc mốc 641658e; các lỗi Đình Lôi/MVP cuối tài liệu cần đọc cùng S01.
- [S04 — Build chain hiện tại](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/scripts/build-static.mjs). Căn cứ 25 patch động và đồng bộ embedded battle.
- [S05 — Hợp đồng nguồn RGBA Lục Ảnh](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/src/domain/character/luc-anh-idle.mjs) và [biên bản alpha/size](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/docs/LUC-ANH-IDLE-RGBA-FIX.md). Số dung lượng là báo cáo đã lưu, không phải encode mới.
- [S06 — Roster runtime](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/src/ui/hero-roster-runtime.js), [tab hồ sơ](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/src/ui/hero-detail-tabs.js), [guard banner](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/scripts/summon-pool-guard-v1.mjs). Đã đọc source; có code chưa đồng nghĩa mọi thiết bị đã đạt.
- [S07 — Function map kỹ thuật 3Q](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/docs/HON-VIET-FUNCTION-MAP-3Q.md). Kế thừa ranh giới module, không kế thừa trạng thái background cũ đã bị thay đổi.
- [S08 — Template index: seed, save, meta và online adapter](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/index.html). Đã đối chiếu vùng liên quan; chưa audit mọi nhánh trong HTML lớn.
- [S09 — Quest module](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/src/domain/quest/main-quest.mjs) và [SFX runtime](https://github.com/bktimmy247/luc-than/blob/1f59309889deb9019c26a19522db430a4c4acf5f/src/ui/audio-sfx-runtime.js). Căn cứ phạm vi quest thắng ải và 9 SFX mặc định.
- S10 — Ke-hoach-trien-khai-Hon-Viet-doi-chieu-3Q-v1.docx, bản nội dung 1.1 ngày 05/09/2026, 37 trang. Đã đọc lại văn bản để kế thừa backlog/meta/QA; các kết quả tải archive, audit workbook và test trong đó là báo cáo lịch sử, không phải thực hiện lại trong lượt này.
- S11 — FEATURE-MATRIX.md ngày 17/08/2026: chỉ dùng nhận diện phạm vi hệ thống prototype. Nhãn “giữ nguyên” không được hiểu là production-ready.
- S12 — Yêu cầu của anh trong hội thoại: Samkok đúng mẫu, giữ tỷ lệ/alpha nhân vật, lỗi mobile/PC/Basic/SFX, bàn giao để Luna tiếp tục, GitHub/Vercel trong các lượt triển khai có ủy quyền.
- S13 — Đính chính và yêu cầu cập nhật plan trong hội thoại ngày 06/09/2026: nhân vật có thể thuộc nhiều nền văn hóa/sinh vật fantasy, ví dụ xác ướp; tính trước độ dễ tạo VFX; chuẩn hai đòn có animation là Basic + Ultimate, nội tại tạo chiều sâu. Đây là căn cứ thay yêu cầu ba đòn trong phần thiết kế/sản xuất; không phải bằng chứng runtime đã đổi.
- [S14 — Mô tả tướng Samkok: New Force](https://gamercatz.com/samkok-new-force-tier-list/). Nguồn hướng dẫn thứ cấp đã đối chiếu trong trao đổi: phân biệt basic/main skill và các hiệu ứng talent ở các tướng được mô tả. Chỉ dùng làm tham khảo cách chia bộ kỹ năng, không chứng nhận mọi tướng/phiên bản Samkok có đúng hai kỹ năng.
- S15 — Yêu cầu tiếp theo của anh trong hội thoại ngày 06/09/2026: làm đến phần cần hình ảnh phải tạo bằng Imagen và đặt ngay vào phần đó; rèn ra món nào có ảnh món đó; animation rèn/tiếng “keng keng” và các nguồn còn thiếu phải chủ động báo anh tạo hoặc ghi nhớ trong plan để anh tạo sau. Căn cứ cho 3.2, 7.8, E11-07/08, E24-06 và tiêu chí bàn giao; chưa phải bằng chứng các asset đã được sản xuất.
- S16 — Bổ sung của anh trong cùng lượt: hồ sơ tướng phải có background chiều sâu hợp lý; game cần UI/UX đẹp, mượt, agent phải chủ động dùng Imagen tạo ảnh. Căn cứ cho E09-08, E24-07 và phần hồ sơ tướng của 3.2/7.8; không phải bằng chứng background mới đã được gen/tích hợp trong lượt sửa plan.
- S17 — Anh xác nhận phạm vi trong cùng lượt: yêu cầu UI/UX đẹp, mượt và chủ động tạo ảnh áp dụng cho **tất cả tính năng của toàn game**, không chỉ Rèn hoặc giao diện tướng. Căn cứ cho phạm vi toàn game ở đầu plan, mục 3.2, E24-06 và gate UI/UX bắt buộc trong Definition of Done.
- S18 — Anh chốt thêm trong cùng lượt: animation, VFX và SFX phải đẹp, sống động, tươi đẹp. Căn cứ cho chuẩn cảm giác toàn game, yêu cầu brief/prompt, E24-08 và nghiệm thu sau tích hợp; chưa phải tuyên bố asset hiện tại đã đạt chuẩn đó.

**Kết luận triển khai:** nghiệm thu nền hiện tại → state/save/giao dịch an toàn → vòng chơi mở đầu theo Samkok → nuôi đội/kinh tế/PvE → online/xã hội/mùa sau duyệt → beta và phát hành. Việc tiếp theo là R01, không phải làm lại Idle hoặc dựng thêm màn mới ngay.