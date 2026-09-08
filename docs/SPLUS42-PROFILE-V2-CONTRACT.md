# L11-SPLUS-PROFILES — hồ sơ và nút kỹ năng

Contract: `splus-profile/2026-09-08-v2`; baseline `f3dc071a82ead9851bd4495fe92296f7c8c6fe1f`. Status: IN_PROGRESS → REVIEW only.

Hai bản mới chủ dự án gửi là nguồn cho tên, mô tả, voice text và cơ chế S+. Hồ sơ gameplay đầy đủ ưu tiên cho luật; bản 126 nút xác định artwork và tên ngắn. 42 icon HUD trạng thái và 126 icon nút là hai namespace khác nhau. Phần mô tả đồ họa không được vô tình đổi target/số lượt của gameplay (ví dụ hình 3 chiến binh Hỏa Khiêu vẫn gọi 2 đồng minh).

## Acceptance

- P2-A1: 42 hồ sơ và 126 chiêu có ID ổn định; tên đầy đủ/tên ngắn, mô tả tiếng Việt, mục tiêu/phạm vi, thông số, điều kiện và giới hạn; giữ voice lines thành text, không tự tạo audio.
- P2-A2: chạm nút Nội tại/S1/Ultimate từ danh sách, trang chi tiết và thanh trận S+ mở đúng mô tả. Popup có tên accessible, đóng bằng nút/Escape, trả focus, mở lại không nhân listener, nội dung cuộn được trên mobile.
- P2-A3: 126 asset entries lưu prompt gốc, mô tả, hình khung, element/hero/skill ID; artwork thật có nguồn/metadata. Không nhầm HUD icon thành nút chiêu; số cooldown/nộ là DOM sống.
- P2-A4: các thay đổi luật rõ ràng trong hồ sơ mới có test hành vi; mô tả và resolver dùng cùng version. Những phần chưa định lượng hoặc mâu thuẫn được ghi review decisions, không tự coi là balance đã chốt.
- P2-A5: source/build owner; giữ scheduler, seeded RNG, old roster/save/reward/arts/audio. Full npm test/build thật, browser production và device báo riêng; evidence theo revision.

## Quyết định triển khai

- Tiếp tục static HTML/JS + Canvas; không thêm backend/dependency. Hồ sơ S+ không cấp quyền sở hữu tướng hay thay migration.
- Nộ trần 100; 100 Nộ là ngưỡng glow trong bản UI. Giá Skill 25/Ultimate 60 giữ mặc định hiện có vì hai hồ sơ không chỉ định giá mới. Popup thể hiện giá thực tế và cooldown thực tế.
- Tên Ultimate ngắn dùng trên nút, tên đầy đủ dùng trong popup. Lưu nguyên nội dung chiêu, không thay bằng chỉ một dòng slogan.
- Các từ chưa nhất quán: Thiềm Ngân “vĩnh viễn trong 3 hiệp” hiểu là 3 hiệp; “toàn đội” gồm người dùng trừ đoạn chỉ rõ 5 đồng minh; phần trăm có tên nguồn dùng max HP nguồn. Stun 1.5 hiệp cần quyết định phù hợp scheduler theo hiệp, không âm thầm đổi thành thời gian thực.
- Asset tướng mới chưa được gửi; không sinh nhân vật thay người dùng. Hình nút được tạo/nhập độc lập, giữ prompt/metadata trong source.

## Scope / gate

`src/domain/hero/splus-*`, `src/domain/combat/splus-mechanics.mjs`, `src/runtime/splus-*`, `src/ui/splus-*`, `scripts/splus-*`, integration `scripts/build-static.mjs`, `splus-lab.html`, S+ skill art, tests S+, docs/evidence. Main agent code trực tiếp theo vibe-builder; vibe-lab gate trước/sau.

Ticket Board, boot/claim/lease/lock: probe và ghi kết quả, không giả claim. Owner đã cho phép tiếp tục source/test khi thiếu. Không DONE/MERGED. Rollback bằng revert các commit của lát cắt, không reset main.
