# PR 162 - Sửa tải hình, VFX và SFX trong trận

## Mốc bàn giao

- Nhánh: `fix/battle-asset-readiness-20260918`.
- Main gốc: `7f53dd7`.
- Mã gameplay đã kiểm chứng: `93767b916c5f4c26033a2be4932a0badd2a9b2c8`.
- Revision đã chạy đầy đủ CI và kiểm tra trình duyệt/host: `ac5fe07f2fa057e63ec78075429e92bd137d9488`.
- Đây là checkpoint REVIEW, chưa merge main và chưa deploy production. Không tự đánh dấu ticket DONE/MERGED. Ticket Board không có trong môi trường này.
- Bản `BATTLE-READINESS-REPAIR-2026-09-19.md` là lịch sử checkpoint thành phần; phần nối runtime của bản đó đã được triển khai ở đây.

## Hai nguyên nhân quan trọng đã xác minh

`performAction` chuyển sang `performSplusAction` khi đội hình có tướng trong catalog S+. Vì vậy chỉ sửa `__hvPerformAction3qAdapter` không sửa được trận hỗn hợp có Linh Đồng/Bạch Diện. Bản vá hiện chặn tải ở CẢ HAI đường thực thi, không đổi hàm tính kết quả `e.act`.

Trong lần chạy trình duyệt đầu, S+ còn bị kẹt sau đòn đầu: bộ đếm actionCount tăng ở mốc impact, làm chủ quản chuyển động nghĩ rằng lượt của mình đã hết. Đã chuyển quyền sở hữu chuyển động sang mã lease ổn định của lượt; vẫn từ chối return của lượt cũ. Hai test tái hiện trượt 0/2 trước sửa và đạt 2/2 sau sửa.

## Nội dung đã nối vào trận

1. Khóa lượt, chuẩn bị idle/run/cast/VFX của hai tướng canonical rồi mới tiến lên và chạy đồng hồ chiêu. Chưa tải đủ thì không trừ nộ hoặc gây damage; có nút Thử lại thật.
2. Giữ ảnh idle và tài nguyên lượt bằng lease. Thu hồi lease trong finally sau recovery/return hoặc khi hủy, không phá hủy ảnh ngay cuối mỗi chiêu. Cache giữ ảnh để tái sử dụng và loại ảnh không được bảo vệ khi cần.
3. Dùng đúng bus SFX chung của host. Chuẩn bị buffer không phát âm; xác nhận played sau kết quả Promise; âm thanh đến muộn/hủy lượt không phát sang lượt khác. Tắt tiếng không chặn trận.
4. Atlas lớn được tạo biến thể ngay lúc build theo đúng hệ số thu nhỏ mà cache cũ đã dùng. Giữ toàn bộ frame, alpha, tỷ lệ pivot, footprint hiển thị và thời gian nguồn. Không sửa ảnh gốc, không tạo tướng mới.
5. Dùng lại chủ quản di chuyển hiện có trong nhánh S+; không thêm scheduler/router/audio owner thứ hai. Build đồng bộ battle.html với payload iframe tại một điểm cuối.
6. Sửa riêng ID của đội hình QA để Bạch Diện không kế thừa ID demo Ông Phở và bị chọn nhầm renderer. Không đổi ID tướng thật trong save.

## Bằng chứng thực chạy

- CI toàn repo tại ac5fe07: Build và Test SUCCESS, run `35379332544`.
- GitHub Actions Browser QA tại cùng revision: SUCCESS, run `35379332514`, artifact `10561462672` (`battle-readiness-evidence`).
- Suite cục bộ liên quan: 85 PASS, 0 FAIL/cancel/skip. Bao gồm cache, loader, hai đường action thật được trích từ build, SFX, hủy lượt và chuyển động. Không coi mock Image là bằng chứng hình thật.
- RED trước khi nối: action canonical 0/7; action S+ 0/3; token chuyển động 0/2. Các test sau sửa đều xanh.
- Chromium desktop 1280x800 DPR1 và mobile viewport 390x844 DPR2: trận 6v6 thực, bấm Start/Auto/Speed thật, đi qua x1/x2/x3, đến hiệp 3 với 24/23 hành động. Không phải kiểm đủ mọi skill tại từng tốc độ riêng biệt hoặc toàn bộ 15 hiệp.
- Cả Basic và Ultimate VFX của Linh Đồng/Bạch Diện đã có draw thành công và ảnh kiểm tra. Cả bốn SFX riêng đã xác nhận phát; buffer có PCM khác 0 được start trên AudioContext running. Đây không phải kiểm loa iPhone thật.
- Không có JavaScript exception hoặc HTTP lỗi của asset gameplay trong các run. Standalone có favicon 404, ghi riêng.
- Đường host thật: vào khách -> Thành chính -> Chinh chiến -> bày trận bằng nút thật -> Xuất chiến -> iframe -> về Thành chính -> vào trận lần hai. Hai lượt kiểm tra đều đạt; mỗi lần cả hai tướng đều hiện VFX đánh thường và phát SFX qua bus host. Ải đầu hiện có 6 ta/4 địch; test không sửa số quái hay luật trận để ép 6v6.
- Host preview static không có backend nên `/api/health` trả 404. Không có lỗi HTTP asset; không tuyên bố đã kiểm auth/backend production.

## Quan sát ảnh đã đọc

- `browser/mobile-linh-dong-ultimateVfx.png`: thấy Linh Đồng và hiệu ứng hồn/quỷ trên vùng địch, nền sân và các tướng vẫn hiện.
- `browser/desktop-bach-dien-ultimateVfx.png`: thấy Bạch Diện ở điểm thi triển phía trước, mặt nạ/VFX màu mực trên đội hình địch.
- `host/battle-1-start.png`: đường Xuất chiến mở đúng sân, các tướng và thanh máu hiện, dock nằm dưới.
- `host/battle-2-effects.png`: trận thứ hai đã tiếp tục đánh, hình và HUD không trắng. Hàm scrollIntoView của test cuộn xuống dock và bảng chẩn đoán S+; không dùng ảnh này để tuyên bố bố cục/scale đẹp hoặc chính xác.

## Số đo và giới hạn

Peak reservation của decoded cache đo được: 130,838,400 B dưới cap 134,217,728 B. Đây KHÔNG phải RAM tổng trình duyệt. Atlas Idle Linh Đồng chuyển từ 81,100,800 B RGBA sang 20,275,200 B ở biến thể build; không được suy ra FPS hay thời gian load trên máy người dùng. Một số file lossless có thể nặng hơn về byte tải dù decoded pixels giảm.

Chưa xác minh: iPhone/Safari thật; FPS/RAM tổng; đầy đủ mọi bộ chiêu của tất cả tướng legacy; toàn bộ vòng 15 hiệp/thắng/thưởng; production sau merge. Những chênh lệch timeline nguồn và vấn đề scale/bố cục cũ không được coi là đã sửa bởi PR này.

Không làm lại phần queue/lease hoặc chỉ nối lại một action owner. Bước nghiệm thu tiếp theo là máy iPhone/Safari của chủ dự án và rà các bộ chiêu legacy còn lại, dùng đúng bản đã được owner cho merge/deploy.

## Bằng chứng lưu và rollback

Tóm tắt bền vững: `docs/qa/battle-readiness-20260919-summary.json`. CI artifact lưu 7 ngày; gói ảnh/report đã được giao riêng dưới tên `LucThan-PR162-verified-evidence.zip`, SHA-256 `e73459d77198114ea2060c3b28caecd939d5aa82dbdb2ba7e2ec426b1adb60f1`.

Rollback bằng revert toàn bộ PR. Không có migration hay thay đổi save/reward/auth. Không dùng force-push.
