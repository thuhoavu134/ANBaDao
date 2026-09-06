# Hồn Việt: Mộng Giới — Progress Snapshot — 06/09/2026

## Thiết kế mới đã chốt — AFK / 07-09-2026

- Đính chính video: chạy/đánh quái là diễn hoạt AFK, chưa vào battle thật. Nút Khiêu chiến riêng mở trận 6v6.
- Rương tích lũy thưởng theo thời gian online/offline, tối đa 15 giờ; đầy ngừng cộng. Phải nhận thưởng, không chỉ đăng nhập, mới có chỗ tích lũy tiếp; không cộng bù thời gian vượt trần.
- Claim phải atomic/idempotent, lỗi lưu giữ nguyên rương; animation không sinh reward hoặc tăng tiến độ ải.
- Master plan đã thay toàn bộ diễn giải encounter cũ và cập nhật E13-03, AFK-01…05, asset/UI và QA.
- Trạng thái: **đã triển khai AFK runtime v1 và đã QA production**. Contract/test đã khóa cap 15 giờ, partial/full claim và clock edge cases; reward rate v1 còn là cấu hình cân bằng tạm thời.
- Đọc [master plan](HON-VIET-MASTER-PLAN-SAMKOK-v2-2026-09-06.md), mục Chốt cơ chế AFK từ video.
- Các mốc source/QA ở phần bên dưới là lịch sử trước bổ sung này, không phải QA AFK.

## Mốc hiện tại

Game đang ở nhánh triển khai Samkok v2 trên build production mới nhất. Mục tiêu trước mắt là hoàn thiện một vòng chơi 6v6 thật mượt trên mobile, sau đó mở rộng roster và các hệ thống.

## Đã hoàn thành

- AFK v1 đã có contract rương 15 giờ, tích lũy online/offline, dừng ở cap, claim qua transaction atomic và nút Khiêu chiến 6v6 tách riêng; diễn hoạt không gọi battle/không tự sinh reward.

- Rèn Mộng có catalog 20 item và material art; transaction forge/loadout được giữ atomic, không làm mất item khi salvage.
- QA có chế độ mở khóa toàn bộ chức năng theo cách save-safe để kiểm tra trước khi tài khoản mở tiến độ thật.
- Sảnh đã có icon Nhiệm vụ và Bạn bè riêng biệt; Bạn bè được giữ visible ổn định; shortcut được xếp trong vùng U phía trên theo bố cục Samkok.
- Avatar tài khoản và icon tài nguyên đã chuyển sang art Imagen; tên account và các con số vẫn là text/CSS động.
- Card NHIỆM VỤ CHÍNH TUYẾN lớn trên sảnh đã bỏ theo yêu cầu; shortcut Nhiệm vụ vẫn giữ lại.
- Chinh chiến liên tục vẫn dùng flow thắng tự sang nhiệm vụ kế tiếp, thua thì dừng.
- Đã sửa lỗi responsive làm thẻ nhiệm vụ trên điện thoại biến thành một cột chữ. Card hiện full-width; header, progress và CTA không còn bị ép vào grid legacy.
- Battle/result đã có nền tảng route victory/defeat và asset nhạc thắng/thua; Lục Ảnh, Đình Lôi, Thầy Mo đã có các manifest/registry skill đáng kể.

## Bằng chứng source và runtime

- Commit mới nhất: [fix: guard AFK runtime debug export on frozen window](https://github.com/bktimmy247/luc-than/commit/e1792491b46315438ac2d17f5ac8df159ddb9b62).
- Production: [luc-than.vercel.app](https://luc-than.vercel.app/).
- Deployment commit trên Vercel: e1792491b46315438ac2d17f5ac8df159ddb9b62, trạng thái READY; [deployment](https://vercel.com/cuong-duc-ai-s-projects/luc-than/8VGgvt6K8QjNQUwVpW2JpSHQKwfs).
- QA viewport 390×844 và 430×932: title “Rừng Deadline” không còn rơi từng chữ; card width, progress bar và nút “Tiếp tục chinh chiến” đều có kích thước hợp lệ.
- GitHub/Vercel CI: success; runtime errors trong 1 giờ kiểm tra: không có.

## Chưa PASS cuối

1. Chapter 1 battle background phải dùng ảnh battle sạch, không dùng hub background; cần visual approval sau khi map/crop đúng.
2. Damage popup cần nhỏ hơn và xếp nhiều dòng dọc sát mục tiêu theo ảnh mẫu.
3. Cần test thật trên iPhone/iPad Safari cho audio unlock, icon Bạn bè, 6 nhân vật mỗi team, Lục Ảnh ultimate và victory/defeat music.
4. Cần tiếp tục hoàn thiện UI/UX có chiều sâu cho hero detail và các màn chức năng còn thiếu.
5. AFK cần QA soak đủ 15 giờ và kiểm tra reload/offline trên iPhone/iPad thật; reward rate/loot table/unlock cần chốt cân bằng trước khi coi là phát hành.
6. Cần tiếp tục migrate roster authored sang hợp đồng Basic + Ultimate + passive, mỗi tướng phải có asset/motion/VFX/SFX/UI QA đủ gate.

## Việc tiếp theo

- Chốt reward rate/loot table AFK sau khi anh duyệt cảm giác phần thưởng; chạy soak/cap/claim trên thiết bị thật.

- Tích hợp background battle sạch theo từng chương.
- Sửa damage popup và QA multi-hit.
- Rà audio bus/SFX/VFX Lục Ảnh, sau đó QA result audio.
- Hoàn thiện hero detail/roster UI bằng art Imagen khi thiếu visual asset.
- Mở rộng roster sau khi các gate hiện tại đạt PASS.

## Luật không được phá

- Không bật lại global combat clock.
- Không dùng ảnh hub làm background battle.
- Không claim PASS nếu chưa có evidence runtime thật.
- Không cắt frame authored để tối ưu.
- Tính trước asset Imagen, animation, VFX và SFX khi bắt đầu từng tính năng.
- Tiếp tục từ commit/build mới nhất; không làm lại pipeline cũ.
