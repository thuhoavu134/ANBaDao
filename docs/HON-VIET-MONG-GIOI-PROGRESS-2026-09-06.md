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
3. **Transaction/events:** một số event quest/opening chạy sau transaction; L03a đã audit boundary hiện hành nhưng chưa nghiệm thu một commit cho mọi side effect và mọi command. L03b sẽ chuyển từng nhóm.
4. **Vòng mở đầu:** graph hiện hữu không tự cung cấp seed/banner/item để đảm bảo player-vNext có thể đi hết; cần L07–L09, không lấy tài khoản QA đủ tướng làm bằng chứng new-user flow.
5. **Nuôi đội:** shared stat snapshot và 10 kit v2 còn lại, liên thông túi/đồ/đội/report, asset riêng/SFX mapping mỗi tướng chưa đủ.
6. **Ngày/tuần và mode phụ:** nhiều hệ có code legacy/local; cần period/claim/mode progression/return context nhất quán, không ghi là hoàn toàn chưa có cũng không ghi DONE cả hệ.
7. **Online:** netUploadSave gửi save local, netArenaResult gửi win client; server authority/migration guest vẫn là thiết kế và triển khai riêng, không dùng chúng như giao thức cuối.

## 4. Việc Luna nhận tiếp

| Thứ tự | Ticket | Bước kế tiếp cụ thể |
|---|---|---|
| 1 | **L02a — DONE** | Validator/extractor/report đã có ở commit 7272ede748eed62af4814e13776e468ebe7e9d15; 4/4 focused tests pass. Findings và phần chưa làm ghi trong docs/qa/L02a; chưa thay reward hoặc seed |
| 2 | **L02b — DONE (proposal only)** | Bảng đề xuất reward theo 6 chương ở docs/qa/L02b/reward-mapping-proposal.md; commit code 25140d3; 6/6 focused tests pass; chưa áp dụng DATA hoặc migration |
| 3 | **L02c — PREPARED** | Contract migration receipt/preview/explicit claim ở commit 324a33e; 11/11 focused tests pass; chưa nối runtime hoặc persist |
| Song song | L01 — VERIFY | Production/device smoke audio/route, ghi rõ thiết bị thật; không viết lại hotfix đã có |
| 4 | **L03a — DONE (audit source)** | Inventory 23 boundary và thứ tự persist/event đã đối chiếu; opening level-up → quest ghi nhận not-atomic |
| 5 | **L03b/L03c — IN_PROGRESS** | Source/build patch level-up và quest claim atomic; Vercel build READY, 21/21 focused pass; Chrome UI claim/reload smoke đã pass, save-fail/device còn mở |
| 6 | L04a / L05a — READY | Map return/lifetime và fixture các sub-action combat; chọn một việc mỗi phiên |
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
- Bước tiếp theo: duyệt 6 đích reward, rồi nối contract vào transaction/save owner; full L02 vẫn IN_PROGRESS.
## 4.3 L02c — contract migration reward đã chuẩn bị

- Commit 324a33e100170643a5223c87dd945e4bc5969879 thêm module thuần và QA note; không sửa DATA.chapters, defaultPlayer, migrateSave, build hoặc runtime.
- preview phân biệt clearedChapters/receipt claimed với chương unclaimed; backfill chỉ tạo receipt audit cho chương đã clear, không grant/revoke reward.
- explicit claim candidate yêu cầu commandId ổn định, giữ nguyên legacy ownership/shard, cộng reward proposal vào bản sao và ghi receipt; save đầu vào không bị mutate.
- Chính sách an toàn: cleared hoặc receipt claimed không được regrant; không có receipt nhưng đã clear thì chỉ backfill receipt; chương chưa clear không tự cấp trong migration.
- Test combined L02a + L02b + L02c: 11/11 pass. Full npm test, build, browser, Safari thật và production deployment chưa chạy trong phiên connector-only này.
- Bước tiếp theo: duyệt 6 mapping, nối candidate vào transaction/save owner hiện có, rồi chạy fixture migration trước khi thay reward runtime.

## 4.4 L03a — audit transaction command đã triển khai

- L03a đã hoàn thành trong phạm vi audit source/report ở commit 3e69e5c3b7ef3996946c77310d6e5cdb372e270e; L03 tổng thể vẫn IN_PROGRESS.
- Inventory có 23 boundary command/helper được đối chiếu đủ entrypoint, cost, credit, persist, event, receipt, transaction và atomicity. Report tái tạo được ở docs/qa/L03a/transaction-command-inventory.json.
- Audit source active index.html hash e4f79d41e3bf7bb225ff878729d71e72be9ad94bac962f5e41cffc98148680b9: 23/23 marker verified; static scan ghi nhận 509 function declaration và 163 mutation/persist candidate để truy vết tiếp.
- Lát cắt levelUpHero → questProgress → weeklyProgress xác nhận quest/weekly có persist nội bộ sau mutate hero và trước persist ngoài; runtime chưa wired receipt/transaction, nên atomicity được ghi là not-atomic.
- Focused tests L02a + L02b + L02c + L03a: 14/14 pass. Failure harness được mô tả nhưng chưa tiêm vào runtime thật; full npm test/build/browser/Safari/production chưa chạy.
- Không đổi index.html, seed, reward, balance, save migration, asset, battle, audio hoặc hotfix thoát trận. Hermes archive vẫn SOURCE_NOT_AVAILABLE.
- L03b đã nối level-up; L03c tiếp tục quest claim với command key theo ngày và clan XP cùng transaction. L02c vẫn chờ duyệt sáu reward mapping.

## 4.5 L03b — atomic level-up đã triển khai ở build owner

- L03b hiện IN_PROGRESS ở commit 83f7ed607deca63595fe1a2bc73c0eff7793c682: scripts/transaction-contract-v1.mjs đưa questProgress và weeklyProgress vào cùng transaction candidate của levelUpHero, giữ một persist sau receipt.
- Command ID level-up dùng hero ID + level trước khi nâng; UI truyền ID và khóa nút trong click hiện tại, batch level-up truyền ID riêng cho từng level. Các caller khác chưa được migrate đồng loạt.
- Focused test mới 3/3 pass; combined suite L02a + L02b + L02c + L03a + L03b đạt 17/17. Harness kiểm rollback persist failure và duplicate retry sau reload ở mức contract/static source.
- Vercel build sau khi L03c bổ sung opening atomic hook đã đạt READY ở commit 8774812051e60ecca055d73e67b91c6183fb15fe; interactive UI/browser/device vẫn chưa kiểm.
- Không đổi seed, reward, balance, save migration, asset, battle, audio hoặc hotfix thoát trận; L02c vẫn PREPARED và không được gọi.
- L03c đã mở rộng receipt pattern sang quest claim ở source/build owner.

## 4.6 L03c — atomic quest claim đã triển khai ở build owner

- L03c được đưa lên main ở commit ee9503f8e80b10e0cde57076a38cfa8f038c402d: claimQuest dùng command ID ổn định theo quest ID + daily dayIndex, không dùng revision mới để tạo claim mới.
- Reward, trạng thái claimed, activity points và +5 XP Gia Tộc cùng nằm trong hvRunCommittedTransaction. hvApplyClanXp chỉ mutate state và thu level-up notification; toast chạy qua afterCommit sau persist thành công.
- Commit 8774812051e60ecca055d73e67b91c6183fb15fe sửa xung đột marker với opening-loop-v1.mjs và đưa opening hero-upgrade event vào candidate transaction thay vì persist riêng.
- Test mới 3/3 pass và thêm 1 regression test build-owner compatibility; combined focused suite L02a + L02b + L02c + L03a + L03b + L03c đạt 21/21. Harness kiểm rollback persist failure, duplicate retry sau reload và không phát notification khi persist thất bại.
- Vercel deployment dpl_5V1u4BTmZ991AseBnGhzAgj1KULv đạt READY; build-static chạy qua, embedded battle sync và HTTP production smoke trả 200. CLI `agent-browser` không có trong môi trường; Chrome control-browser cô lập đã kiểm happy path: Nhiệm vụ → Nhận ca trực → Thu nhận → claim `Nhận thưởng Ca Trực Đêm 1 lần`; reload giữ `1/1`, nút `✓` disabled và ngọc `800 → 820`. L03c vẫn chưa DONE vì chưa có save-fail fault injection và Safari/device evidence.
- Không đổi seed, reward definition, balance, save migration, asset, battle, audio hoặc hotfix thoát trận; L02c vẫn PREPARED và không được gọi.
- Bước tiếp theo chính xác: có checkout đầy đủ thì chạy npm test local; dùng browser tương tác claim quest, reload/cùng ngày/đổi ngày, lỗi save và level-up Gia Tộc trước khi mở rộng sao/skill hoặc daily milestone.

## 5. Gate còn mở

- iPhone/iPad Safari thật: unlock/mute/thoát trận, Lục ultimate, result music, roster/back/safe area. Chưa có chứng cứ mới sau audio hotfix.
- AFK soak thật 15 giờ, reload/offline trên thiết bị; rate v1 `60 vàng + 1 Tinh + 1 Hoạt / giờ` vẫn là cấu hình tạm, không đổi âm thầm.
- Visual acceptance nền từng chương, damage popup multi-hit và toàn roster/action; các patch nền/damage đã có, cần đối chiếu hiện trạng thay vì gọi là chưa tích hợp.
- D01 seed mới, D02 banner/odds/pity/duplicate, D03 phạm vi/hạ tầng online, D04 guest migration, D05 thiết bị/budget, D06 mở rộng/trả phí: chỉ chặn phần liên quan. Định hướng Samkok, 12 tướng hiện hành, capacity 72, hai đòn + passive và quy tắc imagegen đã được chốt, không hỏi lại.
- Các bài test khác nhau có phạm vi khác nhau; unit/build, Chrome responsive, Chrome interaction, Safari thật và production deployment phải báo riêng.

## 6. Luật bảo toàn

Giữ 12 ID, sáu slot, ba trước–ba sau, 15 hiệp, không multi-wave cho Lục Thần. Giữ ownership/đầu tư save cũ và các kit đã chuyển; không bật global combat clock. Build/runtime nguồn là một chuỗi, không hai engine. Router/scheduler/audio mỗi loại một owner. Ảnh thiếu phải imagegen và tích hợp; CSS bố trí/tương tác, chữ/số sống; không key đen/cắt frame/làm méo để che lỗi. Được trích/port code mẫu phù hợp theo guide và test tại boundary. Không nạp toàn APK/Cocos bundle hoặc chép archive đè repo; việc dùng code không tự thay art/identity/balance. Các câu cũ cấm toàn bộ source không còn là quy tắc hiện hành.

Mỗi lần đóng ticket: ghi code commit, test, UI/device evidence, deployment nếu có, phần còn mở và bước tiếp. Nếu dùng mẫu, ghi excerpt ID/hash, file đích, dependency đã thay, khác biệt hành vi và trạng thái port theo guide. Mốc code baseline và mốc commit cập nhật tài liệu có thể khác nhau; không lấy một commit docs làm bằng chứng gameplay mới.
