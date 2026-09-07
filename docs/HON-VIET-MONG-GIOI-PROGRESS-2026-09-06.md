# Hồn Việt / Lục Thần — tiến độ hiện tại

Cập nhật **07/09/2026, giờ Việt Nam**. Giữ tên file cũ để các link bàn giao tiếp tục hoạt động. Nội dung này thay snapshot 06/09; lịch sử còn trong Git. Không dùng phần trăm tổng khi chưa có nghiệm thu từng hệ thống.

## 1. Baseline và công việc mới nhất

- Repository: `bktimmy247/luc-than`; [game chính](https://luc-than.vercel.app/).
- Baseline code phân tích: [`c8fefca0e31b6ddb926921454413d38860171665`](https://github.com/bktimmy247/luc-than/commit/c8fefca0e31b6ddb926921454413d38860171665), bản sửa âm thanh tiếp diễn sau khi thoát trận.
- Vercel đã xác minh `READY`, alias production trỏ cùng SHA, deployment `dpl_F4jT4fcbv2G1jo9UaxgPVHqPUdKF`. Việc đọc trực tiếp HTML qua HTTP sau deploy bị treo và đã hủy; chưa có kiểm tương tác hoặc nghe loa trên production sau hotfix. Không ghi nhận nó như một lần browser smoke thành công.
- Bộ kiểm thử gần nhất cho code này: **171/171 đạt**, 30 file test, gồm 9 test hồi quy vòng đời âm thanh. Build kiểm inline script và embedded battle khớp standalone. Đây là test/build, không phải Safari thật.
- Công việc ngày 07/09: ghép 7 part source Hermes, CRC đạt, kiểm kê 1.748 module/169 config, đọc luồng lõi và protocol, đối chiếu Lục Thần; cập nhật analysis/plan/handoff. Bản audit/plan ban đầu đã lên GitHub ở `799efe62475e2c3ff8145be7b6d2b323b46bdcb2`.
- Yêu cầu tiếp theo của anh đã được đưa vào tài liệu: cho Luna tái sử dụng code mẫu. Đã viết [guide port](HERMES-CODE-REUSE-GUIDE.md), đồng bộ master/entrypoints và lập bản đồ **27 phương thức từ 10 file** trong archive, kèm dependency/khác biệt cần xử lý. **Tất cả đang NOT_PORTED**; chưa ghi nhận ticket gameplay mới hoàn thành. Đợt cập nhật này không đổi runtime, balance, asset hoặc hạ tầng.
- Việc đưa thân mã gốc lên GitHub bị xét duyệt tự động chặn vì chưa rõ quyền phân phối lại source. Đã hoàn tất phần không bị chặn bằng tài liệu do agent viết; mã gốc vẫn ở archive người dùng bàn giao, không có gói source trích chọn trong repo.

Đọc [phân tích source](HERMES-SOURCE-AUDIT-2026-09-07.md), [execution plan L01–L20](LUNA-EXECUTION-PLAN-2026-09-07.md), [master plan E01–E26](HON-VIET-MASTER-PLAN-SAMKOK-v2-2026-09-06.md), [manifest kiểm kê](reference/hermes-source-manifest-2026-09-07.json).

## 2. Những lát cắt đã có, cùng mức bằng chứng

| Hệ thống | Trạng thái đúng ở baseline | Bằng chứng / giới hạn |
|---|---|---|
| Hướng dẫn dùng code mẫu | Có policy, bản đồ 27 method, cách lấy từ archive và tiêu chí port | Mã gốc chưa đưa lên GitHub do auto-review chặn phân phối; code port/caller/test chưa triển khai |
| Build/runtime | Có pipeline 38 dynamic patch import; embedded sync cuối build | `scripts/build-static.mjs`, test parity; không sửa riêng dist |
| Roster/detail | 12 playable IDs, filter/sort/back, 5 tab, read state thật | QA lịch sử trong Samkok alignment và Luna handoff; Safari chưa nghiệm thu |
| Save | Có schema/revision/migration/backup | `save-contract.mjs`, fixtures/test; chưa gọi là cloud authority |
| Transaction | Receipt, rollback, level-up, claimQuest, claimMail, loadout/forge đã có | Cần audit các side effect/event sau commit và command legacy còn lại |
| Formation/forge | Save sáu slot không trùng; equip/move/unequip; forge/enhance/lock/salvage có command | Các test transaction; UI/art sâu còn trong L11 |
| Art rèn | 20 icon trang bị + 3 icon vật liệu | Item-assets registry; không phải mọi animation/SFX rèn đã đủ |
| Kit v2 | Ông Phở và Lục Ảnh đã đăng ký `samkok-v2.1` | Basic + Ultimate + passive và mapping đầu tư; 10 tướng còn lại chưa chuyển đủ |
| Campaign/AFK | Scene AFK, cap 15 giờ, claim atomic, preparation sáu slot, chọn/đổi hàng/hủy/xuất chiến, MVP portrait | [PR #16](https://github.com/bktimmy247/luc-than/pull/16) **đã merge** tại `92b503c`; 162 test + Chrome evidence của nhánh trước merge |
| Art campaign | 4 ảnh imagegen đã tích hợp | Background Mộng lộ, panel, nút và rương; prompt/manifest trong assets/ui/campaign-v1 |
| Bridge/result | Kiểm session/source/sequence; settlement trước navigation, chống duplicate | `settlement-navigation-v1.mjs` và test; cần QA hết mode/lỗi/reload |
| Audio thoát trận | Đã sửa/deploy | `c8fefca`, stop active + pending + voice + result, old iframe không mute trận mới; còn L01 máy thật |
| Opening loop | Có graph/resume/route/event contract và 5 bước | Hai trận chương 1 → đội → nâng → mặc đồ; chưa nghiệm thu player-vNext từ tài khoản trắng |
| Hub | Icon alpha/visibility, dock, Nhiệm vụ và Bạn bè đã sửa; card main quest lớn đã bỏ | Giữ hướng hiện tại, không phục hồi card bị bỏ |
| Gọi Mộng | Có guard chặn pool rỗng trước debit | Banner/seed D01/D02 chưa chốt; không gọi là vòng thu thập hoàn chỉnh |
| Online | Có client API hooks và các màn/state local | Tree baseline không chứa backend/API server; chưa có bằng chứng hai tài khoản thật |

## 3. Những khoảng thiếu đã xác định từ code

1. **Catalog/seed:** defaultPlayer và migrateSave mở cả 12 tướng. QA full-access opt-in không tự giải quyết việc này. DATA.chapters có 6 chương và còn reward/unlockHero dùng ID legacy ngoài roster. Cần L02 và D01/D02; không xóa lore hay thu hồi save.
2. **Combat:** recorder quanh resolveAction chưa chứng minh bao phủ nhịp hai/đuổi đánh. RNG hit/variance/crit vẫn dùng Math.random. Có seed field và test module chưa đồng nghĩa replay deterministic toàn engine. Làm L05 bằng fixture thực.
3. **Transaction/events:** một số event quest/opening chạy sau transaction; chưa nghiệm thu một commit cho mọi side effect và mọi command. L03 audit rồi chuyển từng nhóm.
4. **Vòng mở đầu:** graph hiện hữu không tự cung cấp seed/banner/item để đảm bảo player-vNext có thể đi hết; cần L07–L09, không lấy tài khoản QA đủ tướng làm bằng chứng new-user flow.
5. **Nuôi đội:** shared stat snapshot và 10 kit v2 còn lại, liên thông túi/đồ/đội/report, asset riêng/SFX mapping mỗi tướng chưa đủ.
6. **Ngày/tuần và mode phụ:** nhiều hệ có code legacy/local; cần period/claim/mode progression/return context nhất quán, không ghi là hoàn toàn chưa có cũng không ghi DONE cả hệ.
7. **Online:** netUploadSave gửi save local, netArenaResult gửi win client; server authority/migration guest vẫn là thiết kế và triển khai riêng, không dùng chúng như giao thức cuối.

## 4. Việc Luna nhận tiếp

| Thứ tự | Ticket | Bước kế tiếp cụ thể |
|---|---|---|
| 1 | **L02a — DONE** | Validator/extractor/report đã có ở commit 7272ede748eed62af4814e13776e468ebe7e9d15; 4/4 focused tests pass. Findings và phần chưa làm ghi trong docs/qa/L02a; chưa thay reward hoặc seed |
| 2 | **L02b — DONE (proposal only)** | Bảng đề xuất reward theo 6 chương ở docs/qa/L02b/reward-mapping-proposal.md; commit code 25140d3; 6/6 focused tests pass; chưa áp dụng DATA hoặc migration |
| Song song | L01 — VERIFY | Production/device smoke audio/route, ghi rõ thiết bị thật; không viết lại hotfix đã có |
| 3 | L03a — READY | Inventory entrypoints trừ/cộng và thứ tự persist/event; lấy level-up → quest làm lát cắt đầu |
| 4 | L04a / L05a — READY | Map return/lifetime và fixture các sub-action combat; chọn một việc mỗi phiên |
| Kế tiếp | L06 / L09 | Đồng bộ stat/snapshot rồi khép vòng nuôi đội và mở đầu |
| Chuẩn bị được | L07 / L17 | Bảng seed/banner và spec online để bàn; không chặn việc độc lập |

Spec từng ticket, file owner, contract, asset, test và điều kiện đóng ở [execution plan](LUNA-EXECUTION-PLAN-2026-09-07.md). Không coi việc lập danh sách L01–L20 là đã code các ticket đó.

## 4.1 L02a — validator catalog đã triển khai

- L02a đã hoàn thành trong phạm vi code/test ở commit 7272ede748eed62af4814e13776e468ebe7e9d15. Full L02 chưa DONE.
- Adapter đọc đúng catalog active từ index.html; report kiểm kê 12 playable hero, 11 hero tồn tại nhưng không playable, 3 NPC/lore speaker, 11 enemy ID, 6 chapter, 21 scene và 32 asset reference.
- Findings thật: 5 MISSING_SCENE_REF (first scene của ch02–ch06 chưa có trong DATA.scenes) và 11 LEGACY_REWARD_HERO reference (reward/unlock trỏ ngoài 12 playable). Không có cycle, scene/encounter unreachable, encounter unknown, missing asset, giá âm hoặc giá không hợp lệ trong catalog hiện tại.
- Test behavior: 4/4 focused tests pass. Audit không có allow-errors trả exit 1 vì findings đang tồn tại; report evidence được ghi với allow-errors. npm test, browser, Safari thật và production deployment chưa chạy trong phiên connector-only này.
- Bảo toàn seed, reward, balance, save migration, source/build runtime và hotfix audio. Bước tiếp theo sau L02b: L02c chỉ xử lý migration sau khi proposal reward được duyệt.

## 4.2 L02b — bảng đề xuất reward đã triển khai

- L02b hoàn thành phần proposal-only trong commit 25140d3fd8c0b151d89f9bbecdc85834fe7195ea; chưa sửa DATA.chapters, seed, balance, save migration hoặc runtime.
- 11 legacy reward refs của 6 chương đã được lập bảng và kiểm tra đủ. Đích playable đề xuất: ch1 → co_dao_ganh_hoi; ch2 → phong_tu; ch3 → thuy_nuong_roi_nuoc; ch4 → luc_anh; ch5 → to_diep; ch6 → dinh_loi.
- Vàng, ngọc và số lượng mảnh được giữ nguyên trong proposal; trường unlockHero của reward chương được bỏ ở phương án vì 12 playable đã được defaultPlayer/migrateSave mở sẵn. Legacy hero vẫn giữ cho lore/NPC.
- Save đã nhận không bị cấp lại/thu hồi; save chưa nhận chỉ xử lý một lần ở L02c sau khi có receipt/claim boundary. Các scene unlockHero legacy và 5 first scene thiếu vẫn mở.
- Test behavior L02a + L02b: 6/6 pass. Full npm test, build, browser, Safari thật và production deployment chưa chạy trong phiên connector-only này.
- Bước tiếp theo: duyệt 6 đích reward, rồi làm L02c migration đúng ownership/receipt; full L02 vẫn IN_PROGRESS.
## 5. Gate còn mở

- iPhone/iPad Safari thật: unlock/mute/thoát trận, Lục ultimate, result music, roster/back/safe area. Chưa có chứng cứ mới sau audio hotfix.
- AFK soak thật 15 giờ, reload/offline trên thiết bị; rate v1 `60 vàng + 1 Tinh + 1 Hoạt / giờ` vẫn là cấu hình tạm, không đổi âm thầm.
- Visual acceptance nền từng chương, damage popup multi-hit và toàn roster/action; các patch nền/damage đã có, cần đối chiếu hiện trạng thay vì gọi là chưa tích hợp.
- D01 seed mới, D02 banner/odds/pity/duplicate, D03 phạm vi/hạ tầng online, D04 guest migration, D05 thiết bị/budget, D06 mở rộng/trả phí: chỉ chặn phần liên quan. Định hướng Samkok, 12 tướng hiện hành, capacity 72, hai đòn + passive và quy tắc imagegen đã được chốt, không hỏi lại.
- Các bài test khác nhau có phạm vi khác nhau; unit/build, Chrome responsive, Chrome interaction, Safari thật và production deployment phải báo riêng.

## 6. Luật bảo toàn

Giữ 12 ID, sáu slot, ba trước–ba sau, 15 hiệp, không multi-wave cho Lục Thần. Giữ ownership/đầu tư save cũ và các kit đã chuyển; không bật global combat clock. Build/runtime nguồn là một chuỗi, không hai engine. Router/scheduler/audio mỗi loại một owner. Ảnh thiếu phải imagegen và tích hợp; CSS bố trí/tương tác, chữ/số sống; không key đen/cắt frame/làm méo để che lỗi. Được trích/port code mẫu phù hợp theo guide và test tại boundary. Không nạp toàn APK/Cocos bundle hoặc chép archive đè repo; việc dùng code không tự thay art/identity/balance. Các câu cũ cấm toàn bộ source không còn là quy tắc hiện hành.

Mỗi lần đóng ticket: ghi code commit, test, UI/device evidence, deployment nếu có, phần còn mở và bước tiếp. Nếu dùng mẫu, ghi excerpt ID/hash, file đích, dependency đã thay, khác biệt hành vi và trạng thái port theo guide. Mốc code baseline và mốc commit cập nhật tài liệu có thể khác nhau; không lấy một commit docs làm bằng chứng gameplay mới.
