# Kế hoạch tiếp tục Lục Thần — gói thực thi cho Luna

Ngày: **07/09/2026, giờ Việt Nam**. Current code checkpoint: [`005dc3a09661589ff7b96b6b7402212b1a26581e`](https://github.com/bktimmy247/luc-than/commit/005dc3a09661589ff7b96b6b7402212b1a26581e); L05b baseline: `fbb6f8137c98fcb25a99d308547cc2768de23a06`. Phân tích đầu vào: [source Hermes](HERMES-SOURCE-AUDIT-2026-09-07.md). Tiến độ: [snapshot hiện tại](HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md).

**Cập nhật theo yêu cầu của anh:** Luna được tái sử dụng/port code mẫu. Đọc [guide thực hiện](HERMES-CODE-REUSE-GUIDE.md) để lấy bản đồ 27 phương thức/dependency và cách đọc từ archive đã nhận; các chỉ dẫn cũ cấm toàn bộ source đã được thay. Các phương thức hiện NOT_PORTED, không làm tăng trạng thái hoàn thành L01–L20. Mã gốc chưa được đưa lên GitHub vì auto-review chặn phân phối lại; repo chứa guide và plan.

Tài liệu này cụ thể hóa E01–E26/R01–R11 của [master plan](HON-VIET-MASTER-PLAN-SAMKOK-v2-2026-09-06.md), không mở một roadmap cạnh tranh. Các ID **L01–L20** là lát cắt tiếp theo; nhiều E/R đã có một phần code. “Có test” và “đã đóng cả mốc” là hai trạng thái khác nhau.

## 0. Luna bắt đầu ở đâu

1. Đọc `AGENTS.md`, phần cập nhật đầu `docs/LUNA-HANDOFF.md`, progress và bảng ở mục 1 dưới đây. Lấy `main` hiện tại; commit trong tài liệu chỉ là baseline phân tích, không checkout ngược đè việc mới.
2. Nếu chưa có người làm L02, nhận **L02a: kiểm kê/validator catalog**, phạm vi chỉ xuất báo cáo và test dữ liệu. Đây là việc code tiếp đầu tiên không cần đổi seed, rate hoặc game engine.
3. Bảo toàn hotfix SFX `c8fefca`; L01 là nghiệm thu còn thiếu, không viết lại bus âm thanh. Nếu có thiết bị thật thì làm L01 song song; không có thì ghi `DEVICE_PENDING` rồi làm L02/L03.
4. Mỗi phiên chỉ làm một lát cắt có invariant cụ thể. Nếu ticket dài, chia a/b/c như bên dưới; ghi phần đã làm và bước kế tiếp trước khi dừng.
5. Chưa chốt seed/banner không ngăn làm validator, transaction, scene lifecycle, art đã rõ hoặc test lỗi đang tồn tại. Không tự thay xác suất, thu hồi tướng save cũ hay thêm backend trả phí.

### Trạng thái dùng chung

- `READY`: đã đủ đầu vào cho lát cắt đầu; chưa có nghĩa đã code.
- `PLANNED`: có spec; cần đầu ra ticket trước.
- `DECISION_PENDING`: phần chính sách chưa chốt; vẫn làm được công việc chuẩn bị được ghi rõ.
- `VERIFY`: đã có code, cần thêm bằng chứng cụ thể.
- `DONE`: đúng phạm vi ticket có source, test, UI evidence cần thiết và commit; chỉ thêm `DEPLOYED` khi deployment được xác minh.

## 1. Thứ tự triển khai và phạm vi nghiệm thu

| ID | Ưu tiên / trạng thái lúc bàn giao | Gắn E/R | Phụ thuộc | Đầu ra |
|---|---|---|---|---|
| L01 | P0 / VERIFY | E01, E04, E24; R02–04 | Hotfix đã deploy | Bằng chứng thoát/vào trận, route, audio trên thiết bị |
| L02 | P0 / IN_PROGRESS (L02a + L02b DONE; L02c PREPARED) | E02, E08; R05 | Baseline | L02a report, L02b proposal và L02c migration contract đã có; runtime integration còn mở |
| L03 | P0 / IN_PROGRESS (L03a DONE; L03b/L03c source patch; production build pass; L03c Chrome UI + save-fail retry pass; device open) | E03, E07; R07/R10 | Chủ transaction hiện có | Audit + level-up/quest-claim atomic patch đã có; device, đổi ngày và các command khác còn mở |
| L04 | P1 / IN_PROGRESS (L04a/L04b source/build + Chrome smoke; profiler/fault/device open) | E04, E06 | Router/bridge hiện có | Return context + campaign activation scope đã nối; profiler/lifecycle fault/device evidence còn mở |
| L05 | P1 / IN_PROGRESS (L05a/L05b + L05c-a + L05c-b fixture; round/device gates mở) | E05/E06; R08/R11 | Combat hiện có | Observer/report + seeded RNG/cursor + direct status/DoT/energy/heal/multi-hit evidence đã có; round-cap 15, full replay/speed parity và device còn mở |
| L06 | P1 / PLANNED | E02/E09/E10; R05/R11 | L02, L03 | Stat/kit snapshot thống nhất hồ sơ–đội–trận |
| L07 | P1 / DECISION_PENDING | E02/E12; R05/R09, D01/D02 | L02 | Seed/player/banner đề xuất có đường kiếm đủ tài nguyên |
| L08 | P1 / PLANNED | E12; R09 | L03, L07 được chốt | Chiêu mộ/shop giao dịch thực và reveal từ receipt |
| L09 | P1 / PLANNED | E07/E08; R10 | L03/L04/L06; L07 nếu đổi seed | Vòng mở đầu không cheat, không deadlock |
| L10 | P1 / PLANNED, làm từng tướng | E09/E23/E24; R11 | L05/L06 | 12 kit có mapping, art, combat và UI đúng |
| L11 | P1 / PLANNED | E10/E11 | L03/L04/L06 | Túi–mặc–rèn–phân giải–quay lại khép kín |
| L12 | P1 / PLANNED | E13/E07/E04 | L03/L04 | Daily/weekly/mail/reset/badge dùng state thật |
| L13 | P1 / PLANNED | E08/E13/E24 | L02/L09/L12 | Campaign/AFK có nội dung và thu nhập theo chính sách |
| L14 | P1 / PLANNED | E14/E15 | L03/L04/L05 | Tháp và boss local có tiến độ/settlement riêng |
| L15 | P2 / PLANNED | E16 | L14 | Viễn chinh có run/checkpoint/buff/resume |
| L16 | P1 xuyên suốt / READY phần đo | E23/E24/E25/E26 | Đo scene hiện có | Art/motion/audio/performance budget và tải có vòng đời |
| L17 | P2 / READY phần thiết kế | E18; D03/D04 | L02/L03/L05 | Spec online, migration guest và authority, chưa tạo dịch vụ |
| L18 | P2 / DECISION_PENDING | E18 | L17, D03/D04 được chốt | Account/cloud/ledger/battle authority chạy thật |
| L19 | P2 / PLANNED | E17/E19/E20 | L18 | Arena + xã hội + bang lõi bằng hai tài khoản thật |
| L20 | P2/P3 / PLANNED | E21/E22/E25/E26 | Alpha ổn định; online nếu cần | Event/mùa, beta và release có rollback |

Ưu tiên alpha: L02 → L03/L04 → L06 → L09, đồng thời L01/L05/L16 theo phạm vi. L07/L08 nối vào khi có chính sách. Không chờ làm hết online mới cho anh chơi vòng lõi; không gọi bản local là game online hoàn chỉnh.

## 2. Ranh giới kiến trúc phải giữ

| Dữ liệu/trách nhiệm | Owner hiện tại | Cách mở rộng |
|---|---|---|
| Catalog và seed legacy | `index.html`: DATA, defaultPlayer, migrateSave | Thêm module/validator có adapter; không sao chép cả DATA thành nguồn thứ hai |
| Save | `src/domain/save/save-contract.mjs`, `scripts/save-contract-v1.mjs` | Version/revision, backup, lỗi ghi; giữ storage key và ownership |
| Giao dịch | `src/domain/transaction/receipt-contract.mjs`, `scripts/transaction-contract-v1.mjs` | Dùng `HonVietTransaction.commit`/helper hiện có; giảm đường mutate ngoài transaction |
| Đội/trang bị | `src/domain/hero/loadout.mjs`, `src/ui/party-command-runtime.js` | Một command save/equip, kiểm snapshot trước debit/start |
| Rèn | `src/domain/equipment/forge-commands.mjs`, `src/ui/forge-command-runtime.js` | Cost/lock/salvage/batch cùng receipt |
| Campaign/AFK | `src/domain/campaign/campaign-view.mjs`, `src/domain/afk/afk-chest.mjs`, `src/ui/campaign-scene.js` | Scene render state; `startChapter` tiếp tục sở hữu mở trận/cost |
| Điều hướng và kết quả | `index.html`: navTo/showScreen/HonVietMetaBridge; `scripts/settlement-navigation-v1.mjs` | Mở rộng owner hiện có, không dựng controller song song |
| Combat luật | `battle.html`, `src/domain/combat/*`, `scripts/combat-domain-3q-adapter-v1.mjs` | Tách từng invariant sau fixture; scheduler hiện hành tiếp tục điều khiển hành động |
| Motion/VFX | Manifest, các patch nhân vật, renderer trong battle | Dùng pivot/offset/timing đã có; không đổi pixel để che lỗi |
| SFX/voice/result | `src/ui/audio-sfx-runtime.js`, `scripts/ios-audio-unlock-patch.mjs`, `scripts/result-audio-runtime-v1.mjs`, `scripts/battle-audio-lifecycle-v1.mjs` | Đúng session, cancellation trước teardown, UI/nhạc không sở hữu kết quả |
| Opening quest | `src/domain/quest/opening-loop-contract.mjs`, `scripts/opening-loop-v1.mjs` | Event có receipt/source, resume, route guard |
| Build | `scripts/build-static.mjs` | 38 patch ở baseline; cuối cùng đồng bộ embedded battle. File mới phải được nối build, test marker |

Mọi đường dẫn ở bảng trên là file hiện có. Đường dẫn ghi **mới đề xuất** trong ticket chưa tồn tại và chỉ tạo khi cần. Đọc nguồn tạo runtime trước khi sửa `dist`; sản phẩm bàn giao phải nằm ở source.

### 2.1. Cách nhận code mẫu vào từng owner

Theo [guide tái sử dụng](HERMES-CODE-REUSE-GUIDE.md): hàm thuần được port sau khi khóa input/output; code có Cocos/network/global phải thay dependency qua adapter/command hiện có. Ghi excerpt ID/hash, file đích, khác biệt có chủ đích, caller/test và trạng thái port trong evidence ticket. Nếu owner hiện có đã đủ, ghi KEEP_EXISTING thay vì dựng hệ song song. Giữ các quyết định sản phẩm và quy tắc imagegen.

Thân code gốc còn trong archive người dùng bàn giao; guide chỉ rõ 27 method cần đọc cùng dependency. Không nạp bundle tham chiếu vào runtime; module đã port mới nối vào source/build. Các method này không tạo thành backend/engine hoàn chỉnh. Bảng nhóm trong guide map trực tiếp tới L02/L03/L04/L05/L06/L08/L11/L12/L13/L16.

## 3. Các ticket nền: chỉ dẫn chi tiết

### L01 — Nghiệm thu hồi quy vòng đời màn/trận

**Mục đích:** người chơi thoát trận là hết âm trận, vào trận tiếp vẫn hoạt động. Học `baseview.release`, `herodownv.release`, `bcwar.cleanRound` của mẫu; không copy semantics chỉ ẩn `warVis`.

**Đọc:** các owner audio ở mục 2; `tests/battle-audio-lifecycle.test.mjs`, `tests/campaign-scene.test.mjs`, `tests/result-flow-integration.test.mjs`; phần audio cập nhật trong LUNA-HANDOFF.

**Thực hiện:**

1. Kiểm đúng commit đang chạy trên URL kiểm thử. Vào campaign → chuẩn bị → trận; thoát khi có Basic/Ultimate; đợi mà không bấm thêm.
2. Kiểm DOM diagnostics của bus cha: combat tắt, active voice/combat về 0, bộ đếm phát không tự tăng. Mở trận mới, xác nhận có event mới. Đóng iframe cũ không được mute trận mới.
3. Thử kết quả thắng/thua, back/Escape/quick nav; cold load và audio đang decode; lặp vào–ra 20 lần. Ghi UI/BGM riêng, không coi tiếng bấm nút là combat còn rò.
4. Trên iPhone/iPad Safari thật: chạm unlock, mute/unmute, khóa/mở màn hình, đổi hướng, thoát lúc Lục đang thoại. Chỉ ghi PASS khi đã nghe/quan sát trên thiết bị đó.

**Đóng:** evidence có URL/commit/browser/device/các bước/actual result. Code test 171 pass trước đó không thay bước máy thật. Không có thiết bị: `VERIFY / DEVICE_PENDING`; không chặn L02.

### L02 — Catalog, roster và phần thưởng chương nhất quán

**Mục đích:** thưởng người chơi nhận phải dùng/hiểu được; các màn không tự đưa tướng cũ vào roster.

**Đọc:** `index.html` vùng DATA.chapters/scene/battles/OFFICIAL_ROSTER/defaultPlayer; `src/domain/hero/roster-plan.mjs`, `roster-view.mjs`; `src/domain/battle/background-registry.mjs`; `tests/official-roster-12.test.mjs`, `tests/main-quest.test.mjs`, `tests/battle-backgrounds-20-v1.test.mjs`. Mẫu: `main_guard_cfg[3]`, `mainlinemdl.getNextGuardInfo`, config liên kết theo ID. Nhóm Catalog trong guide chỉ rõ các method `basemdl.getConfig/getCompCfg` và `mainlinemdl.getNextGuardInfo/getCurCityCfg`; được port cách tra dữ liệu, thay ID mặc định và xử lý missing edge. Validator cycle/legacy là phần viết thêm.

**L02a — READY, làm trước:**

1. Tạo validator thuần **mới đề xuất** `src/domain/catalog/validate-catalog.mjs`; nhận dữ liệu vào, không import DOM hoặc chạy script toàn game.
2. Viết adapter/extractor có boundary duy nhất đọc catalog nguồn/built đang active; tránh copy DATA và tránh `eval` cả HTML. Nếu phải dùng VM fixture, chỉ evaluate literal/catalog cần thiết với context không network/storage.
3. Xuất report: 12 playable IDs, NPC/enemy/lore IDs, chương/scene/battle liên kết thật, hero/item/reward/asset reference lỗi. Phân biệt “ID không tồn tại” với “có trong DATA nhưng không playable”.
4. Kiểm `next` vòng, ải không tới được, reward trỏ ngoài playable, giá âm, asset missing, ID trùng. Đừng suy 20 nền là 20 chương. Report lỗi legacy đã biết phải có classification/owner, không giấu bằng bỏ qua toàn bộ validation.

**L02b — DONE (proposal only):** bảng reward cũ/mới/lý do/tác động save đã có ở docs/qa/L02b/reward-mapping-proposal.md và module/test proposal ở commit 25140d3fd8c0b151d89f9bbecdc85834fe7195ea. Sáu đích đều là playable ID chính thức, giữ nguyên giá trị vàng/ngọc/mảnh và không đưa `ong_chu_wifi` vào roster. Chưa áp dụng DATA hoặc migration; L02c còn mở.

**L02c — PREPARED (chưa nối runtime):** contract preview/backfill/explicit claim đã có ở commit 324a33e100170643a5223c87dd945e4bc5969879 và docs/qa/L02c. Contract không mutate save gốc, không regrant cleared chapter, giữ legacy ownership/shard và yêu cầu commandId ổn định. Chỉ tích hợp sau khi duyệt mapping.

**Test/đóng:** report tái tạo được; fixtures valid/unknown/non-playable/cycle; save đã/ chưa qua chương; UI receipt không hứa tướng không thể xuất hiện trong roster. Không đổi balance trong L02a. Asset: dùng portrait/icon đang có; chỉ gen art mới sau khi item/hero đích rõ.

**L02a đã triển khai:** commit 7272ede748eed62af4814e13776e468ebe7e9d15 thêm validator thuần, extractor boundary, audit script, behavior tests và report từ catalog active. Kết quả thực tế là 4/4 focused tests pass; report không che 5 missing chapter scene starts và 11 legacy reward references. Hermes archive không có trong phiên này (SOURCE_NOT_AVAILABLE), nên không có method body nào được port. Full L02 vẫn giữ IN_PROGRESS; nhận L02b để lập bảng đề xuất trước khi sửa dữ liệu.

### L02b — proposal reward đã triển khai

- Phạm vi đã đóng: 6 chương, 11 legacy reward refs; bảng human-review và validator proposal cùng kiểm tra đủ coverage.
- Đề xuất giữ nguyên gold/gems/shards, chuyển shardHero sang 6 playable ID chính thức và bỏ unlockHero khỏi reward chương. Đây là phương án review, không phải thay đổi balance.
- Save policy đề xuất: clearedChapters/receipt đã nhận thì giữ nguyên; chưa claim mới dùng mapping sau khi L02c được duyệt. Không thu hồi legacy ownership/shard.
- Test: 6/6 focused tests pass. Scene first reference thiếu và scene unlockHero legacy không nằm trong ticket này.
### L02c — contract migration reward đã chuẩn bị

- Scope đã đóng ở mức contract/test: preview trạng thái, backfill receipt đã clear và candidate explicit claim cho chương chưa claim.
- Không có runtime caller hoặc build patch trong commit này; không thể coi reward migration/gameplay đã chạy.
- Evidence: 11/11 focused tests pass cho L02a + L02b + L02c; full test/build/browser/device/deploy vẫn chưa chạy trong phiên này.
- Gate tiếp theo: duyệt proposal 6 đích, sau đó nối vào transaction/save owner và kiểm tra reload/double-claim/legacy preserve.
### L03 — Giao dịch và event tiến độ cùng thành công hoặc cùng thất bại

**Mục đích:** nâng tướng/nhận thưởng không bị lệch tiền, nhiệm vụ hoặc trạng thái sau reload.

**Đọc:** transaction/save owner, `scripts/opening-loop-v1.mjs`, `src/domain/quest/opening-loop-contract.mjs`; `tests/transaction-contract.test.mjs`, `tests/forge-transactions.test.mjs`, `tests/opening-loop-contract.test.mjs`. Được dùng phần kiểm cost của `heromdl.jsfChkCost` sau khi gộp vật liệu trùng/validate số và inject inventory; `mainlinectrl.n16401` cung cấp nhánh xử lý reply/reward. Tính nguyên tử local vẫn dùng transaction owner Lục Thần, không sao chép callback server để giả đã atomic.

**L03a — DONE (audit source):** inventory 23 boundary command/helper đã ghi entrypoint, cost, credit, persist, event, receipt, transaction và atomicity; bắt đầu đúng `levelUpHero` → `questProgress` → `weeklyProgress` trên source active. Commit 3e69e5c3b7ef3996946c77310d6e5cdb372e270e; report ở `docs/qa/L03a/transaction-command-inventory.json`.

**L03b — IN_PROGRESS (source patch):** commit 83f7ed607deca63595fe1a2bc73c0eff7793c682 sửa `scripts/transaction-contract-v1.mjs`: `levelUpHero` đưa `questProgress('level',1,false)` vào cùng mutation, `questProgress/weeklyProgress` hỗ trợ outer transaction, command ID ổn định và UI click truyền ID. 3/3 test mới pass, combined focused suite 17/17 pass. Chưa chạy full build/UI/device/production, nên chưa đánh dấu DONE. Khi verify runtime, sau commit chỉ notification/render/audio; event không được mutate lại qua listener thứ hai.

**L03c — IN_PROGRESS (source/build patch + production UI smoke):** commit `ee9503f8e80b10e0cde57076a38cfa8f038c402d` nối `claimQuest` vào build owner: command ID `quest.claim:<questId>:<daily dayIndex>`, reward + claimed + activity points + +5 clan XP cùng candidate transaction; level-up notification chỉ chạy qua `afterCommit` sau persist thành công. Commit `8774812051e60ecca055d73e67b91c6183fb15fe` sửa marker tương thích với `opening-loop-v1.mjs` và giữ opening event trong candidate level-up. Test mới 3/3 pass và thêm 1 regression build-owner test; combined focused 21/21. Vercel production build đạt READY và HTTP smoke 200. Chrome control-browser cô lập đã đi qua Nhiệm vụ → Nhận ca trực → Thu nhận → claim quest, sau reload xác nhận `1/1`, `✓` disabled và ngọc `800 → 820`; vẫn cần save-fail fault injection và Safari/device evidence trước khi DONE. Không đổi seed, reward, balance, save migration hoặc asset.\n\n**L03d / bước kế tiếp:** chạy `npm test` local khi có checkout đầy đủ; dùng browser kiểm UI quest claim/reload/đổi ngày/persist failure và level-up Gia Tộc. Sau đó mở rộng theo nhóm sao/skill → daily milestone/weekly → batch thư/shop; không sửa đồng loạt toàn bộ economy. Giữ `executeLocalTransaction`, không phát minh `TransactionManager2`.

**Contract bổ sung đề xuất:** event `{id, commandId, type, sourceId, periodKey, rulesVersion, payload}`; receipt và event cùng `committedRevision`. Dùng ID hành động ổn định qua retry; một claim còn có khóa nguồn `sourceId + periodKey`. Không dùng revision mới để giả một lần nhận mới.

**Test:** nhấn đôi, retry cùng ID, stale revision, thiếu tiền, lỗi persist, listener chạy lại, reload giữa success và render. Expected: state/quest/receipt cùng cũ hoặc cùng mới, đúng một debit/credit/event. UI giữ lỗi và cho retry, không phát reveal success trước persist.

**Đóng L03:** L03a chỉ đóng inventory và source evidence. L03b/L03c đã có source patch, focused contract/static tests, Vercel production build READY, HTTP smoke 200 và L03c Chrome UI + save-fail retry evidence. Vẫn cần đổi ngày, device evidence và các command legacy khác trước khi đánh dấu DONE. Audio/art dùng lại, chưa cần gen ảnh cho logic này.

### L04 — Return context, modal và scene lifetime

**Mục đích:** thua → tăng tướng/mặc đồ → quay lại đúng mode/đội/ải, không mất lựa chọn hay rò công việc.

**Đọc:** `navTo`, `showScreen`, `closeOverlay`, `HonVietMetaBridge` trong index; settlement patch; campaign scene; roster runtime và hero tabs. Mẫu: `viewmgr` load queue/layer/back, `baseview.release` và lazy tab cache. Guide chỉ rõ method baseview/basemdl/herodownv/jumpmgr và chỉ rõ lỗi index 0, callback đơn, stale load cần sửa khi port; thay Cocos handle bằng scope owner đang có.

**L04a — IN_PROGRESS (source/build + Chrome smoke):** vẽ bảng route/owner/enter/leave/callback hiện có và nối luồng defeat → heroDetail → back qua `src/domain/navigation/return-context.mjs` + `scripts/return-context-v1.mjs`. Context có `mode`, `encounterId`, params/hero/tab, filter/scroll và draft revision; source route phải còn hợp lệ lúc quay lại. Build owner đã chạy sau settlement/navigation và trước opening-loop; syntax + combined focused suite đạt 24/24, Vercel READY và Chrome production route/back smoke pass. Chưa có stress 20 lần, lifecycle/fault harness và Safari/device evidence nên chưa đánh dấu DONE.

**L04b — IN_PROGRESS (source/build + Chrome re-entry):** đã thêm `src/ui/scene-lifetime.js` và nối vào `src/ui/campaign-scene.js` qua build owner `scripts/afk-chest-runtime-v1.mjs`. Mỗi activation Chinh chiến có scope riêng cho RAF, interval, ResizeObserver và image load; scope cũ dispose idempotent, guard callback stale, còn DOM root/click owner dùng lại. Unit + source/build checks đạt 28/28; Chrome production đã re-entry 20 vòng và root campaign/roster không nhân bản. Chưa có profiler renderer/listener, fault/lifecycle browser harness hoặc Safari/device evidence; L04b chưa DONE.

**L04c:** modal focus/backdrop/safe area; enter/update/leave rõ, giữ Idle khi chỉ đổi tab/stat. Tắt hoặc bỏ handler cũ tại boundary đã chuyển, không thêm listener capture toàn trang để vá nút.

**Test/đóng:** mở 20 lần không tăng renderer/listener; back từ source không còn hợp lệ có fallback hợp lý; confirm result/cancel draft/deep link khóa/hết thể lực; tốc độ chạm nhanh không mở hai iframe. Dùng portal/scroll owner đang có, kiểm 390×844, 430×932 và PC. Thiếu panel/nút/nền thì gen trong ticket giao diện, text sống và focus rõ.

### L05 — Combat có event đầy đủ và RNG luật kiểm được

**Mục đích:** kết quả đáng tin; tăng tốc/replay không đổi damage hay thưởng. Được tận dụng đoạn `bcwar.exeRound/exeAction/checkActQueue` và cleanup trong archive tham chiếu để port thứ tự presentation/sub-action; giữ scheduler, luật và settlement Lục Thần. Đọc dependency/khác biệt ở guide, không coi các đoạn này là combat simulator đầy đủ.

**Đọc:** `battle.html` resolveAction/applyDamage/applyHeal/runOngPhoUltimateAftermath/run action caller, combat adapter/core, `src/domain/combat/*`, các test combat hiện có. Không giả một domain recorder là simulator đã tách hoàn toàn.

**L05a — IN_PROGRESS, đã nối observer/fixture:** `src/domain/combat/action-observation.mjs` và `scripts/combat-domain-3q-adapter-v1.mjs` ghi action sequence, before/after snapshot, typed result, RNG site và known gap tại `resolveAction.finally`; fixture chỉ bật bằng `qaCombatFixture=l05a`, tự stop ở `endBattle`.
- Test thật: `node --check` + `node --test tests/*.mjs` đạt **31/31 pass**. Chrome production URL `https://luc-than.vercel.app/?qaCombatFixture=l05a` đã chạy UI thật tới result: 8 hiệp, 51 action, 125 typed result, `impactCount=0`, status `finished`; encounter là Ải 1–2 / Mộng Phố.
- Đã thấy action/result thực của engine: stun, damage, guardAll/barrier, aoeBurn, AOE/debuff, execute/death, miss và buffAdd. RNG site được biết nhưng giá trị chưa capture; target selector hiện hành là hash deterministic.
- Chưa đủ để đóng: chưa có heal, DoT tick riêng, Ông Phở hai nhịp/đuổi đánh hoặc `subActionIndex`, per-impact boundary, round cap đủ 15 hiệp, speed/replay parity hay Safari/device evidence. L05a giữ **IN_PROGRESS**; report còn `resolve-action-final-snapshot`, `per-impact-boundary-missing`, `rng-value-not-captured`.
- Archive/source mẫu không khả dụng trong phiên (`SOURCE_NOT_AVAILABLE`); không port archive method và không đổi seed, reward, balance, save migration, asset, audio hoặc hotfix thoát trận.

**L05b:** instrument từng sub-action tại nơi luật áp dụng (damage/heal/status/death/resurrect/energy). Schema đề xuất mở rộng event: `{sessionId, sequence, round, actionId, subActionIndex, actorId, targetId, type, amount, flags, rngCursor}`. Không suy mọi miss từ “không thấy HP giảm”; shield/overkill/crit có thông tin riêng. Version mới, giữ reader cũ.

**L05b — IN_PROGRESS, đã capture sub-action ở build owner:** [`fbb6f8137c98fcb25a99d308547cc2768de23a06`](https://github.com/bktimmy247/luc-than/commit/fbb6f8137c98fcb25a99d308547cc2768de23a06) mở rộng event impact với `amount`, `flags`, `rngCursor`; fixture giữ `actionId` qua `performAction`, buffer impact và tự đánh `subActionIndex`. Test syntax + toàn bộ `tests/*.mjs` đạt **31/31 pass**; static build-owner validation compile đủ 5 inline script body. Deployment `dpl_FkVnkvQ6QBRzUf5a6rrazvhuw1YN` READY/CI success. Chrome production UI thật ghi `finished`, hiệp 1–7, 51 action, 141 result và 281 impact; 51/51 action có impact, counter khớp, snapshot/action association đủ và sub-index liên tục; không console error/warn. L05b vẫn mở vì direct status removal/DoT tick, actor energy-cost assignment, heal/two-hit fixture, seeded RNG values, round cap 15, speed/replay parity và Safari/device chưa có evidence. Archive/source mẫu vẫn `SOURCE_NOT_AVAILABLE`; không đổi seed, reward, balance, save migration, asset, audio hoặc hotfix thoát trận.

**L05c:** RNG có seed theo session cho hit/crit/variance/target/random passive. RNG hạt bụi/camera/animation tách riêng. Cùng snapshot/rules/seed tái hiện được, thêm unrelated VFX không làm lệch RNG luật. Không đổi hệ số damage khi migrate RNG.

**L05c-a — REVIEW / đã triển khai một phần:** source `src/domain/combat/seeded-rng.mjs` và build owner adapter đã tách rule RNG khỏi presentation RNG, capture cursor/call/value và giữ evidence optional trong action/impact/replay; không thay hệ số damage, seed config live, reward, balance hoặc save. Focused suite 32/32 pass; Vercel `147badb` READY; Chrome production ghi 4.712 RNG call, 122 rule call và parity prefix hai action đầu cùng seed. Đây chưa đáp ứng toàn bộ L05c.

**L05c-b — REVIEW / đã triển khai:** commit `005dc3a` hook direct action-cost/tickStatuses/applyHeal/status/energy/death; focused 34/34 pass; Vercel READY; Chrome fixture finished 28 action/81 result/219 impact với DoT/heal/multi-hit evidence. Giữ `resolve-action-final-snapshot`/`per-impact-boundary-missing` mở; không claim full acceptance.

**L05c-c kế tiếp:** fixture round cap 15 + full replay/speed parity; sau đó mới mở device QA.

**L05d:** replay chỉ đọc event và outcome đã chốt; không gọi applyReward/startChapter. Skip/fast-forward nếu thêm phải qua settlement owner, không tự cắt timer khi trận chưa chốt. Kiểm các action authored, không cắt frame để tăng tốc giả.

**Test/đóng:** cùng seed ×1/×2/×3 cho event luật/outcome giống nhau; actor chết/choáng giữa combo, target chết/mất, AOE nhiều hit, phản đòn dây chuyền có giới hạn, cuối hiệp 15 và kết thúc hai lần. Fixture không chỉ so hai wrapper cùng logic. UI report/MVP khớp event; toàn bộ runtime nguồn và embedded parse/pass.

### L06 — Stat, đội và kit snapshot dùng cùng dữ liệu

**Mục đích:** mặc đồ/nâng tướng thấy số thay đổi đúng và vào trận nhận đúng số đó.

**Đọc:** heroStats/squadSnapshot/teamPower trong index; `roster-view.mjs`, `skill-kit.mjs`, `loadout.mjs`, campaign view, battle snapshot converter/bridge; test roster/loadout/skill kit. Mẫu: Hero model và Dmbl nhận trạng thái đã resolve. Được port `heromdl.sortByClk` (thực chất là filter) và cách giữ selected ID trong `herobagv.refSortList` vào read model/roster owner; sort tie-break, trường hợp không còn hero và input immutability cần test riêng.

**Thực hiện:**

1. Inventory công thức thật: base/level/star/gear/mastery/awaken/build/tactics/synergy; phân biệt combat stat và chỉ số “lực chiến” dùng trình bày.
2. Tách calculator thuần **mới đề xuất** `src/domain/hero/stat-view.mjs` từ owner hiện hành, khóa fixture trước. Không xây công thức mới dựa trên power mục tiêu.
3. Roster/detail/preparation dùng cùng read model; battle input giữ `rulesVersion`, `kitVersion`, stat và loadout snapshot tại start. Nâng trong menu không sửa một trận đang chạy.
4. Kiểm buff theo trận không chảy ngược về stat dài hạn; chọn tướng chưa sở hữu bị chặn dù có ID hợp lệ.

**Test/đóng:** lên level, mặc/tháo, đổi stance, đội khác synergy đều phản ánh đúng; reload giữ; hai phe có cùng hero nhưng instance riêng; kit legacy/migrated không lẫn. UI preview ghi delta và cost từ calculator/command thật, không hardcode. Các hồ sơ thiếu nền/icon được gen theo manifest từng tướng.

## 4. Vòng chơi alpha và chiều sâu

### L07 — Chốt seed, banner và đường kiếm đầu game

**Mục đích:** tài khoản mới có mục tiêu thu thập/nuôi đội, không bị nhiệm vụ yêu cầu một hệ chưa mở. **D01/D02 chưa chốt**, không thu hồi 12 tướng đã sở hữu trong save hiện hành.

**Đọc:** defaultPlayer/migrateSave, save contract, roster-plan, banner-validation, summon guard; `DEFINITIONS` trong opening patch; L02 report. Mẫu: pub_cfg cost/pool, guide prerequisite, task reward — được tận dụng schema và port logic đọc/kiểm phù hợp; không tự dùng nguyên giá, pool hoặc xác suất của mẫu làm policy Lục Thần.

**Việc làm được ngay:** lập bảng 30–60 phút chơi dự kiến bằng dữ liệu hiện có: đội/sở hữu, nguồn vàng/đồ/mảnh, cost nâng/rèn, unlock. Tách `legacy` / `qa` / `player-vNext` bằng đề xuất migration có fixture, chưa đổi production default.

**Đề xuất để bàn:** giữ bản đang chơi đủ 12 cho legacy/QA; player-vNext có đội sáu vị trí đủ chơi và nhận phần còn lại theo tiến trình/banner; không đổi SSR hiện hành. Danh sách cụ thể, lượt tặng, odds/pity/duplicate/shard exchange và giới hạn phải nằm trong bảng chính sách có version. Đây chưa là quyết định áp dụng.

**Đóng phần thiết kế:** bảng đã tính cost/resource, không deadlock và ghi rõ lựa chọn chưa chốt. **Đóng phần triển khai:** chính sách được chốt, migration bảo toàn dữ liệu, không tự re-grant sau mỗi reload. Đổi seed không đồng nghĩa đổi save mọi người.

### L08 — Chiêu mộ và chợ có giao dịch đầy đủ

**Đọc/sửa:** `src/domain/summon/banner-validation.mjs`, summon guard, doSummon/renderSummon và shop functions trong index; nối transaction owner. Domain **mới đề xuất**: `summon-command.mjs`, `shop-command.mjs` trong nhóm tương ứng, chỉ sau L07.

**Lát cắt:** một banner → 1/10 lượt → receipt → reveal; skip/reload hiển thị lại chính receipt. RNG roll một lần trong giao dịch, dup chuyển mảnh theo chính sách, pity/counter/cost/free mark cùng persist. Sau đó một shop có stock, thời điểm reset và khóa nguồn mua.

**UX/art:** ảnh nền điện Gọi Mộng, cổng/reveal, loại vé, thẻ kết quả, duplicate badge; ưu tiên art hiện có, gen phần thiếu cùng feature. Chữ giá/odds/lượt còn lại và rarity là live UI. Loading disable/failed retry/insufficient/empty pool rõ; không gọi lỗi pool là “quay không may”.

**Test/đóng:** pool rỗng, ID không playable, odds sai tổng, thiếu tiền, double tap, save fail, retry sau reload, skip giữa reveal, hết stock/reset ngày. Kết quả đi vào roster, xếp đội, battle; banner không có policy hoàn chỉnh vẫn giữ guard.

### L09 — Vòng mở đầu: chơi được bằng tài khoản mới

**Đọc/sửa:** opening contract/patch, main-quest, startChapter, campaign scene; L02/L03/L04/L06 outputs. Graph hiện có: hai trận chương 1 → lưu đội → nâng tướng → mặc đồ; chưa có summon step và chưa chứng minh cung cấp item/cost đủ cho player-vNext.

**Thực hiện:** thêm catalog quest có source event/target/prerequisite/count policy/route/terminal; mỗi bước có lối đạt thật. Tách reward đã hoàn thành và đã nhận. Không bắt người chơi nghỉ giữa auto-chain vốn đã được yêu cầu giữ; học nâng đội sau đoạn hợp lý hoặc từ màn thua. “Đến ngay” mở đúng hero/slot/mode, không chỉ route chung rồi bỏ người chơi tự tìm.

**UX/art:** giữ shortcut Nhiệm vụ và dock; không phục hồi card main quest lớn trên hub đã bị anh bỏ. Tutorial ngắn, có skip/resume, anchor ID ổn định; gen panel/icon khi thiếu, không vẽ chữ hướng dẫn vào ảnh nền.

**Test/đóng:** fresh approved profile đi từ hub đến trận sau khi nuôi đội mà không cheat; làm sớm bước sau, đang thiếu tiền, thua, reload tại mỗi bước, đóng tutorial, anchor mất, save cũ và full inventory. Đo số thao tác/điểm kẹt thực; không tự bịa retention hoặc thời gian người dùng chơi.

### L10 — Hoàn thiện 12 kit và hồ sơ, một tướng mỗi đợt

**Đọc/sửa:** skill-kit registry/patch, calculator L06, hero tabs, battle action và manifest của tướng đó. Ông Phở/Lục Ảnh là pilot đã có code; trước khi chọn tướng tiếp kiểm nguồn và ticket đang active. Thầy Mo/Đình Lôi có asset đáng kể nhưng không tự suy đã có kit v2.

**Mỗi tướng:** (a) bảng Basic/Ultimate/passive/target/cost/cooldown/stack/counterplay; (b) map legacy ID và đầu tư; (c) fixture luật; (d) nối authored motion/VFX/impact/SFX; (e) UI 5 tab/stat/source materials; (f) save/battle/replay/performance QA. Không làm mười tướng một commit.

**Art:** nền trưng bày sâu có mặt đứng/ánh sáng/perspective theo tướng; portrait/skill/status icon dùng lại hoặc imagegen; giữ identity chính thức. Idle/Basic/Ultimate và motion phụ theo yêu cầu thực của renderer; thiếu animation/audio ghi asset queue với file/timing/spec cụ thể. Không dùng ảnh đơn làm bằng chứng có animation.

**Test/đóng:** đúng hai hành động chính + passive trong kit mới; skill1 cũ map/bảo toàn, không tự cast như đòn thứ ba; mô tả sát thực thi; nâng/đổi tab/back không restart Idle; alpha/pivot/scale/timing đúng; trạng thái thiếu SFX phải còn mở. Đủ 12 trước khi lấy capacity 72 làm lý do sinh placeholder.

### L11 — Túi, đội và Rèn Mộng khép kín

**Đọc/sửa:** loadout/party/forge commands + item-assets, renderBag/renderForge, detail Trang bị. Base 20 icon đồ và 3 icon vật liệu đã có, không ghi như việc chưa bắt đầu.

**Lát cắt:** vào từ một hero/slot → xem đồ hợp lệ → so trước/sau → mặc/đổi → trở về đúng tab; tiếp theo cường hóa có preview cost; cuối cùng khóa/phân giải/batch có preview debit/credit và xử lý lỗi. Batch chọn atomic-all hoặc partial rõ bằng receipt từng item, không báo thành công toàn bộ khi có thất bại.

**UX/art:** mỗi item có ảnh đúng slot/tier/model; filter/sort/owned/locked/equipped rõ, một vùng cuộn. Gen panel compare/nền lò/phần thiếu đúng theme; recycle ảnh hiện có. Hiệu ứng búa/reveal đọc receipt, SFX impact không sống qua thoát màn.

**Test/đóng:** item ở hai tướng, move/unequip, slot sai, duplicate UID, equipped/locked salvage, batch thiếu tiền, persist fail, cold/warm load, back/reload. Power tại roster/preparation/battle đúng L06; không có đường mutate legacy thứ hai.

### L12 — Daily/weekly/thư/điểm danh và điểm đỏ

**Đọc/sửa:** daily/weekly/mail/sign functions trong index, transaction patch; domain **mới đề xuất** `src/domain/time/period-key.mjs`, `src/domain/quest/activity-progress.mjs`, badge read model trong UI. Mẫu: Task*, Mail*, `jumpmgr`, `redpointmgr`. Guide xác định `checkCond` và hai method redpoint để port condition/aggregate/unsubscribe; sửa callback trì hoãn/stale node, không dựng badge manager thứ hai.

**Lát cắt:** định nghĩa clock/period policy hiện hành → migration → claim đơn → claim nhiều → badge. Daily/weekly reset chỉ field đúng kỳ, không reset campaign/AFK đã tích lũy. Chọn mốc ngày/tuần theo chính sách ghi lại, không tự đổi múi giờ vì mẫu có `next_eight`. Online sau này dùng server time qua adapter.

**Contract:** `{definitionId, periodKey, progress, claimedAt, receiptId}`; item/task/source links validate; expiry và read/claimed của thư tách biệt. Badge chỉ báo có hành động khả dụng, aggregate từ child theo state commit, tháo listener khi leave.

**UX/art:** tab ngày/tuần/thành tựu, tiến độ và reward preview, nút Đến/Nhận, hết hạn/đã nhận; gen icon activity/rương từng mốc nếu thiếu. Không đặt chấm đỏ vĩnh viễn lên nút đang khóa hoặc hoạt động không thể làm.

**Test/đóng:** trước/sau reset, offline nhiều ngày, clock lùi, retry claim, nhiệm vụ render nhiều lần, reward batch lỗi giữa chừng, đọc/xóa thư có attachment, period cũ không nhận lại. Dùng clock inject cho tests; thiết bị thật kiểm reload/date boundary, không cần chờ thật 7 ngày mới test.

### L13 — Campaign/AFK và nội dung chơi dài hơn

**Đọc/sửa:** campaign/afk domain + scene, DATA chapters/scenes/battles, background registry; outcome L02. Mẫu: MainLine state machine và config theo guard. Được adapt `getFixedHangIncome`, `receHangUpData`, `n16401` theo guide; thay ID tiền/đơn vị/server callback bằng AFK/receipt owner hiện hành, giữ cap 15 giờ.

**Lát cắt:** một chương có stage/enemy/reward/story/background/unlock rõ → result/end-of-content → rate AFK theo stage nếu được chốt. Giữ six-slot challenge và diễn hoạt AFK không gây damage/reward/progress. Rate cũ đang khóa vào rương: khi rate đổi, chốt accrued theo rate cũ tại checkpoint rồi áp rate mới cho khoảng thời gian sau; không tính lại toàn bộ quá khứ. Nếu chưa có policy mới, giữ rate v1 và ghi tạm.

**UX/art:** thể hiện chương/ải/địch hiện tại, rương rỗng/đang tích/đầy, preview thu nhập và thiếu stamina. Battle dùng nền chiến đấu sạch; không dùng ảnh hub. Gen background/map/icon cho chương chưa có, chọn crop và vùng đứng an toàn, không chèn chữ/nút vào artwork.

**Test/đóng:** đầu/cuối chương, hết content, mất mạng/asset lỗi trước start, thua/retry, rút trận không thưởng, 14:59:59/15:00:00/vượt cap, partial claim, lỗi ghi, clock lùi, đổi rate khi offline. Soak thật 15 giờ còn là gate riêng; test clock không giả là soak máy thật.

### L14 — Tháp và Săn Mộng/Boss local

**Đọc/sửa:** renderTower/startTower và hunt/boss functions hiện có, settlement/navigation, mode snapshot. Mẫu: Tower*, boss config/controller. Không reuse `campaign.win` làm event mọi mode.

**Lát cắt:** tháp trước: floor/challenge/reward/next/retry; boss sau: lượt ngày/đội/tổng damage/phần thưởng mốc. Mỗi mode giữ tiến độ, entry cost, claim key và return context riêng. Không tăng campaign khi thắng boss/tháp; replay/report không tiêu thêm lượt.

**UX/art:** nền tháp, boss stage, ảnh boss/mốc thưởng, nút thử lại/đổi đội; gen art thiếu và giữ telegraph/status/damage dễ đọc. Mode chưa mở hiển thị lý do và đường đạt.

**Test/đóng:** last floor, repeat clear, ngày đổi trong trận, boss chết/hết 15 hiệp, lượt hết, retreat/retry, double settlement, reload result. Chưa có online rank thì UI nói đúng local; không tạo tên người thật giả lập.

### L15 — Viễn chinh và giao việc có lưu tiến trình

**Đọc/sửa:** rogue/routes/jobs trong index; domain **mới đề xuất** `src/domain/expedition/run.mjs`; settlement/receipt. Học maze/travel có state riêng, không sao nhánh progression muộn của mẫu.

**Contract:** runId, mode/rules version, floor/node, team snapshot, current HP/energy, buff choices, seed/rng cursor, reward receipts, status. Chốt policy đổi đội/hồi phục giữa chặng trước áp dụng.

**Lát cắt:** chọn đường → trận → chọn buff/thưởng → checkpoint → resume; bỏ run có thông báo phần mất/giữ. Giao việc thời gian và viễn chinh combat là hai luồng, không dùng chung timer/claim key.

**UX/art/test:** gen bản đồ node/card buff/camp/event art còn thiếu; node quyết định có mô tả tác dụng thật. Thử save lúc chọn buff, node trùng, party chết, item cứu hộ thiếu, bỏ/khởi động run mới, click đôi và tab cũ. Reward/HP/buff không rò qua campaign hoặc run khác.

## 5. Chất lượng, online và phát hành

### L16 — Art, âm thanh và performance: áp dụng với mọi ticket

**Phần đo READY:** inventory asset đang active theo màn/action, kích thước tải và decoded memory, cold/warm load, số RAF/timer/audio còn sống sau leave. Không tải native/APK mẫu để đưa vào build. Đọc chuẩn asset và metadata tướng hiện hành.

**Mỗi feature ghi một bảng asset:** `assetId → màn/vị trí → file dùng lại hoặc prompt cần gen → kích thước/aspect/safe area → alpha/pivot/timing → license/source/hash → trạng thái tích hợp/QC`. Ảnh tĩnh thiếu: agent tự imagegen và tích hợp. Âm thanh/animation thiếu: tận dụng nguồn được cung cấp, nếu không có khả năng tạo thì ghi brief cụ thể vào queue; không giả file có sẵn.

**UI/UX toàn game:** hierarchy rõ; một CTA chính mỗi quyết định; trạng thái loading/empty/error/locked/success; touch target mục tiêu 44 CSS px; safe area/dynamic viewport; giảm chuyển động; chữ đủ tương phản và không dính artwork. Những con số UX này là mục tiêu thiết kế Lục Thần, không phải đo từ mẫu.

**Memory:** dùng poster cho danh sách, giữ lazy load theo nhóm scene/hero/action, cache có budget dựa trên phép đo. Asset reference đếm đúng, hủy request cũ và bỏ decoded data không còn dùng. File mới dùng versioned URL vì `/assets/` immutable một năm. Không cắt motion authored, key đen hoặc resize X/Y khác nhau để đạt budget.

**Audio:** map theo semantic event và heroId/kitVersion; reuse bus có group/session; UI, ambience, combat, voice, result có phạm vi rõ. Dedupe AOE/impact, giới hạn polyphony, mute/dừng pending. Ghi rõ 9 âm dùng chung và âm riêng nào đã duyệt.

**Đóng:** manifest/prompt/file/caller + bằng chứng hình đúng + runtime tải thật + phép đo trước/sau; FPS mục tiêu/budget cuối dựa D05. Chrome responsive, Chrome gameplay và Safari thật báo riêng. L16 không là cớ làm lại art đã được chốt.

### L17 — Thiết kế online có thẩm quyền, chưa tạo hạ tầng

**Mục đích:** không biến save local hoặc `win:true` thành nguồn tin cậy của kinh tế/rank. Mẫu có protocol và server responses; archive không chứa backend để deploy lại.

**Đọc:** NET/api/netUploadSave/netArenaResult trong index; L02/L03/L05 outputs. Audit UI “mong-gioi-server.js” đang không có file tương ứng, chuẩn bị UI account phù hợp người chơi và trạng thái local rõ.

**Đầu ra:** spec identity/session, catalog version, command endpoint, ledger/receipt idempotency, revision conflict, trusted time, battle snapshot/rules/outcome authority và guest migration. Đề xuất API nghiệp vụ mới thay đường gửi nguyên save/số dư/kết quả. Data tables tối thiểu: account, profile revision, ownership/inventory, ledger, receipts, battle sessions, quest claims. Unique constraints cho command và source claim; retry contract có test plan.

**Quyết định cần chốt D03/D04:** nhà cung cấp, chi phí, phạm vi alpha online và chính sách dữ liệu guest. Viết spec/fake adapter/contract tests được; chưa tạo tài khoản dịch vụ, chưa đăng ký gói trả phí chỉ vì có plugin. Đóng thiết kế khi các trường và failure path đủ để L18 code, không ghi “backend done”.

### L18 — Account, cloud, ledger và battle authority thực

**Phụ thuộc:** L17 và quyết định hạ tầng/quyền đã có. Giữ web client deploy Vercel; chọn runtime/storage/server architecture theo dịch vụ được chốt, đọc tài liệu chính thức tại thời điểm triển khai.

**Chia nhỏ:** a) identity + read profile; b) một command/receipt server; c) save revision/conflict + migrate guest; d) server-resolved/verified battle; e) mất mạng/reconnect/observability. Không làm auth, chat, guild, payment trong một PR.

**UX:** account/đăng nhập/khôi phục/lưu đồng bộ là luồng sản phẩm; không bắt người chơi điền URL server thủ công. Mất mạng nói đang local hay đang chờ xác nhận; không cộng thưởng cạnh tranh khi server chưa chốt.

**Test/đóng:** hai tài khoản cách ly, hai thiết bị một tài khoản, replay command, sửa cost/ownership/winner client bị từ chối, timeout sau commit retry lấy đúng receipt, logout/reload, catalog version cũ, rollback migration. Phải có deployment và bằng chứng API–database–browser; mock tests không thay server thực.

### L19 — Arena, bạn bè/chat và bang lõi

**Lát cắt:** a) roster đối thủ/defense snapshot/battle authority/rank receipt; b) friend request/accept/remove/block; c) chat pagination/kênh/quyền/rate limit/report; d) bang create/join/roles/donation ledger. Boss bang/chiến mùa sau khi bang lõi chạy; chính sách social do scope sản phẩm chốt.

**Học mẫu:** Arena*/Friend*/Chat*/Army* chia model/controller/view, guard và reset theo mode. Không nhập toàn bộ live-op/vip/payment vào alpha.

**UI/art:** biểu tượng rank/faction/bang/khung chat/tabs, state rỗng/lỗi/khóa đủ; sinh ảnh thiếu theo style chung, số liệu thật. Tên/điểm local simulation phải phân biệt khi chưa có dịch vụ.

**Test/đóng:** hai tài khoản thật từ invite tới tương tác; thay quyền/xóa thành viên/kênh sai; rank chống double reward/stale defense; logout không để polling và âm tiếp diễn. Không gọi bot/local chat là online đã hoàn tất.

### L20 — Event, balance, beta và release

**Lát cắt:** một event có start/end/timezone/rules/reward/claim/expiry; đóng mùa và phát thưởng idempotent; sau đó playtest/balance và RC. Nhánh pet/lore/quan hệ giữ phong vị Lục Thần, chỉ mở thêm khi có lợi ích và contract riêng. D06 tiếp tục điều khiển phần trả phí/nhánh tùy chọn.

**Balance:** workbook/catalog nguồn–sink, tốc độ kiếm–tiêu, gate progression và power curve; đề xuất delta có version, thử fresh/legacy profile. Không đổi cả công thức và roster/motion cùng PR. Lịch playtest dựa bằng chứng, không hứa ngày xong khi asset/device/backend chưa sẵn sàng.

**Gate beta:** vòng alpha không cheat; 12 tướng đúng phạm vi cam kết; zero P0/P1 còn mở trong scope release; đo tải/memory trên thiết bị mục tiêu, test mất mạng/ghi lỗi/save cũ; không công bố “đã đạt” từ checklist chưa chạy.

**Release:** commit code/config/asset manifest rõ; `npm test` thật; deployment đúng commit; browser smoke bằng UI; backup/migration/rollback đã diễn tập. Rollback code phải tương thích save version mới hoặc có forward recovery; không reset tài khoản để cứu build.

## 6. Ma trận kiểm tra dùng chung và bằng chứng cần lưu

| Rủi ro | Bằng chứng tối thiểu |
|---|---|
| Data/catalog | Report có path/ID lỗi; fixtures kiểm ref/cycle/legacy policy |
| Tiền/đồ/claim | Success, reject, duplicate, stale revision, save failure, reload |
| Nối các màn | Bấm UI từ điểm xuất phát → hành động → back → vào lần hai; giữ context |
| Combat | Fixture engine/sub-action/outcome, speed parity, abort, round cap |
| Asset | File/version/hash, alpha/offset/pivot/timing, render cold/warm |
| Audio | Start/stop/pending/mute/new session bằng test; nghe máy thật riêng |
| Build | Source patch marker đủ, inline syntax, embedded byte parity |
| Deploy | SHA code, Vercel READY, URL/commit thực; không dùng screenshot cũ |

Với thay đổi runtime, chạy `npm test` (đã gồm build). Thêm test vì invariant mới hoặc bug cụ thể, không chỉ regex khẳng định có tên function. Không viết/chạy thêm hàng loạt test cho một sửa markdown đơn giản. Sau khi bằng chứng đủ, dừng test tùy chọn và bàn giao.

Evidence của mỗi ticket nên ở `docs/qa/<ticket-id>/README.md`: baseline/commit, profile fixture, browser/device/viewport, bước bấm, actual/expected, pass/fail/not-tested, link ảnh/clip/log thích hợp. Không lưu token, URL chia sẻ tạm có secret hoặc save thật của người dùng vào repo.

## 7. Mẫu bàn giao một phiên cho Luna

```text
Ticket/subtask: Lxxa
Baseline đã đọc: <SHA main>
Mục tiêu người chơi và invariant:
File owner đã tìm; file nguồn sẽ sửa:
Input/output và dữ liệu/chính sách đã chốt:
Code mẫu: excerpt ID/hash; PORT/ADAPT/KEEP_EXISTING; dependency/khác biệt; file đích/trạng thái:
Art/animation/VFX/SFX dùng lại, phần thiếu và nơi tích hợp:
Thay đổi đã làm; caller cũ đã ngừng dùng:
Test chạy thật + kết quả:
Browser/máy thật: đã thử / chưa thử:
Commit/PR/deployment và SHA:
Điểm còn mở; bước chính xác tiếp theo:
```

Cuối phiên cập nhật progress và trạng thái ticket tương ứng. Handoff không tự cấp thêm quyền ngoài yêu cầu người dùng trong phiên; cũng không buộc hỏi lại việc đã được người dùng cho phép. Nếu thiếu một quyết định thật sự, hoàn thiện phần review được trước, ghi rõ quyết định đó và tiếp tục việc độc lập có ích.

## 8. Những cách không được lặp lại

- Chép toàn archive Hermes đè source Lục Thần hoặc nạp nguyên bundle Cocos. Tái sử dụng từng phần theo guide được phép và phải nối owner/test; không đổi engine chỉ để né hiểu code.
- Coi mỗi module/config/ảnh là một tính năng đã xong; đếm 72 capacity thành 72 tướng sản xuất xong.
- Render thêm placeholder/tab/nút không có command, save và return path.
- Thêm listener/router/audio manager thứ hai mà không tháo owner cũ.
- Chỉ sửa dist, chỉ test standalone battle hoặc dùng seed field để khẳng định deterministic.
- Nhận thắng/thưởng trong callback animation, chạy lại RNG khi reveal hoặc retry.
- Đổi seed/migration làm mất save cũ; tự đổi banner odds hoặc thu hồi tướng.
- Để ảnh giả/CSS trang trí thay artwork còn thiếu; key đen/làm méo motion để che lỗi.
- Ghi Safari/online/production PASS khi chỉ có unit test hoặc mô phỏng local.


## Checkpoint addendum — L05c-c completed to REVIEW (2026-09-07)

The implementation slice is complete through production browser evidence and remains `REVIEW`, not `DONE`.

1. `369f545` is the current main code/build-owner commit. `scripts/build-static.mjs` produced a `READY` Vercel deployment with the expected embedded payload.
2. The cap fixture now proves a real terminal `round=15` with no action at round 16; its sentinel is isolated behind `qaCombatFixture=l05c-round-cap`.
3. Full replay parity at the same fixed seed was exercised through real UI at 1× and 2×. The reports have identical `0757b35e` full-replay-rule-outcome fingerprints and identical action/result/impact counts.
4. Preserve existing non-goals: no live seed, reward, balance, save migration, roster, art, or audio changes.
5. Next execution order: production device QA (Safari/iPhone/iPad), then decide whether the final-action/per-impact observer gaps need another slice. Keep archive/ticket blockers explicit.

## Checkpoint addendum — L05c-d final-action snapshot (2026-09-07)

The next source slice is implemented and remains `REVIEW`, not `DONE`.

1. `eab4a45` adds explicit final-action snapshot capture at the build-owner `resolveAction` boundary and includes it in observer parity.
2. The observer report now proves `captured/expected/complete` coverage and removes only the final-action gap when every recorded action has the explicit snapshot; missing captures keep the gap open.
3. Production deployment `dpl_DZtRfRZGyWeDUnhxtQcVjn2GZAnZ` is `READY`; build payload is `950131 bytes` and runtime errors are absent.
4. Updated production Chrome 1× and 2× fixtures both report `28/81/219`, complete `28/28` final snapshots and fingerprint `282374be`.
5. Remaining order: real responsive/device QA, then per-impact before/after boundary. Preserve seed, reward, balance, save migration, roster, art and audio.

## Checkpoint addendum — L05c-e per-impact boundary evidence (2026-09-07)

The source slice is implemented through production browser evidence and remains `REVIEW`, not `DONE`.

1. Checkpoint `523ff30c` and feature commit `efab4643` are fast-forwarded on `main`; source owner records explicit per-impact capture evidence, while parity continues to ignore evidence-only fields.
2. RED produced 3 real focused failures. GREEN is `10/10`; the full combat regression is `39/39 PASS`, and observer/adapter syntax checks pass.
3. Vercel deployment `dpl_5AaCe8jwx53Xh7caas3UJQ5xMHca` is `READY` from `efab4643`; build ran `npm run build` / `node scripts/build-static.mjs`, embedded battle `951694 bytes`, runtime errors are absent.
4. Production Chrome real UI evidence reports `28/81/219`, `impactSnapshotCoverage 219/219`, `actionsWithBoundary 28/28`, final snapshots `28/28`, fingerprint `282374be`, completion at round 4 with speed 2, and `gaps=[]`.
5. Preserve all existing non-goals: no seed, reward, balance, save migration, roster, art, audio or dist-only change.
6. Remaining gates: Chrome responsive plus Safari/iPhone/iPad device evidence, full npm/CI outside the connector-only harness, Ticket Board and archive availability. Next exact action is the device matrix on the same deployed alias; retain `REVIEW`.


## Checkpoint addendum — L05c-f semantic impact-case coverage (2026-09-07)

The observer evidence slice is implemented and remains `REVIEW`, not `DONE`.

1. Feature commit `4df4ff50` adds deterministic type counts and semantic booleans for damage/heal/DoT/status/multi-hit; full replay projection is unchanged.
2. RED recorded 3 real focused failures; GREEN is `10/10`; REFACTOR is `39/39 PASS` plus syntax.
3. Vercel `dpl_6Zu9TgEAKBcgwAxWcLz9KQRSxZXy` is READY, build payload `952325 bytes`, runtime errors are absent.
4. Real Chrome production fixture reports `28/81/219`, type counts `damage=38, death=6, dot=4, energy=133, heal=13, miss=5, status=20`; all semantic case flags are true, snapshots are complete, fingerprint `282374be`, `gaps=[]`.
5. No gameplay or player-data contract changed. Remaining exact action: device matrix on the deployed alias; retain `REVIEW` until device/Ticket Board blockers clear.

## Checkpoint addendum — L04b one-shot timer cleanup (2026-09-07)

The source slice is implemented and remains `REVIEW`, not `DONE`.

1. Contract revision: `12e6279a39490d891114bdc7283d4bf7e99be4e4`; code commit:
   `e37c6df342e912a3c8ef15ac2ad5ed152547db21`.
2. `trackTimeout` now removes its completed one-shot disposer immediately;
   campaign activation scope still owns the reusable DOM root separately.
3. RED observed `pending=1` after the callback on baseline. GREEN/REFACTOR
   focused L04 suite is `18/18 PASS`; syntax checks pass.
4. Vercel `dpl_8ZUUaBWq4z4yd58Br8piF7UNN68N` is READY, source build completed
   with embedded battle `952325 bytes`, and runtime errors are absent.
5. Production Chrome re-entry: 20 `Tướng` → `Chinh chiến` rounds, one roster
   root and one campaign root, both visible; app-origin errors `0`.
6. Remaining gates: Ticket Board, responsive/device matrix, local full asset
   checkout, doctor/smoke scripts and `game-dev`. Preserve `REVIEW` and do not
   mark L04/L04b DONE.

## Checkpoint addendum — L04-A2 runtime stale-draft revision (2026-09-07)

The build-owner slice is implemented and remains `REVIEW`, not `DONE`.

1. Contract baseline is `0299d4b5`; source/build owner commit is
   `6e1bb9c28538ee65355f59f8bf6601b9934807d2`.
2. `scripts/return-context-v1.mjs` captures the live `P.revision` and passes
   it to `resolve({ currentRevision })` in both pre-navigation and
   post-screen-change restoration paths. No seed, reward, balance, save,
   roster, art, audio, gameplay rule or dist-only behavior changed.
3. RED reproduced the missing propagation assertion; GREEN/REFACTOR focused
   suite is `19/19 PASS`, with syntax and diff checks clean.
4. Vercel `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is READY from the code SHA;
   complete-source build embedded `952325` bytes and runtime error query is 0.
5. Production Chrome smoke proved campaign/roster root uniqueness and
   visibility (`1/1` each), 12 roster cards and 0 app-origin console errors.
   Hero-card → detail was unstable, so route/back restoration is not claimed.
6. Device capabilities are `[]`; Ticket Board, archive source, game-dev,
   local complete asset checkout and doctor/smoke remain blocked. Next exact
   action is retest/fix hero-detail route/back, then device matrix. Keep
   `REVIEW / IN_PROGRESS`.

## Checkpoint addendum — L04-A2 hero-detail route/back surface (2026-09-07)

This source slice is implemented through production Chrome evidence and remains
`REVIEW`, not `DONE`.

1. Contract baseline is `0706198b`; code commit is
   `935a472c111b3d4096307cc5a95c434ee7bc9b1f`.
2. RED was a real missing viewport-height assertion. GREEN is `1/1`; REFACTOR
   is `23/23` focused route/roster/return-context/roster-plan tests plus syntax
   and diff checks.
3. Vercel `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is READY from the code SHA; the
   complete-source build embedded `952325` bytes and the selected runtime-error
   query is empty.
4. Chrome production route now proves `1363×936` viewport, `680×936` roster
   root, `680×716` grid, 12 cards, Ông Phở → `heroDetail` → back to one visible
   roster root with selected-card context, and 0 app-origin errors.
5. Remaining exact gates are device matrix, Ticket Board claim/lock/evidence,
   complete local asset checkout, archive source, doctor/smoke scripts and
   `game-dev`; retain `REVIEW / IN_PROGRESS`.

## Checkpoint addendum — L05c round-cap and replay parity (2026-09-07)

This source/build-owner slice is implemented and remains `REVIEW`, not `DONE`.

1. Contract baseline is `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`; code
   commit is `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`.
2. `action-observation.mjs` exposes the authored fixture seed in the existing
   replay-parity projection. This is an evidence contract only; seed setup,
   reward/balance, save migration, roster, assets and gameplay rules are out of
   scope.
3. RED is the missing-seed assertion; GREEN is `4/4` focused parity tests;
   REFACTOR is `39/39` full combat tests plus syntax and diff checks.
4. Vercel `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is READY from the code SHA;
   build embedded `952395` bytes and selected runtime errors are `0`.
5. Chrome production 1× and 2× fixtures both prove seed
   `l05a-production-seed`, fingerprint `86267582`, `93` actions, `644`
   impacts, round `15/15`, `roundsBeyondCap=0`, and `gaps=[]`; final 2×
   app-origin errors are `0`.
6. Device capabilities remain `[]`; Ticket Board, archive, game-dev, full
   local asset checkout and doctor/smoke remain blocked. Keep
   `REVIEW / IN_PROGRESS` and hand off device/Ticket Board evidence next.

## Checkpoint addendum — L04b preparation timer scope (2026-09-07)

This source/build-owner slice is implemented and remains `REVIEW`, not `DONE`.

1. Baseline main is `f2ff2ef14df703a1ad6cc31bf884d95ce94764d8`; code commit is
   `5bea38657178c70b39ddce55f3d1866242940dbb`.
2. `trackSceneTimer()` is the single source-owned timer registration for the
   campaign home, preparation screen and visibility resume; it attaches the
   existing interval cleanup to the campaign activation scope.
3. RED was `5 pass / 1 fail`; GREEN was `6/6`; REFACTOR was `11/11` focused
   scene/route checks, syntax checks and `git diff --check`.
4. Vercel `dpl_A4rM7BwWDW6xzqzM6iHyjCvuf5VB` is READY, build payload is
   `952395` bytes, alias is `https://luc-than.vercel.app/`, and selected
   runtime errors are `0`.
5. Chrome production semantic QA verified 10 independent preparation
   open/cancel/re-entry cycles; one campaign root remained, final home state
   was visible, preparation was hidden, stamina stayed `120/120`, and app
   origin errors were `0`. A larger batch hit a CDP input timeout and is not
   counted as pass.
6. Device capabilities are `[]`; responsive/Safari/iPhone/iPad backend,
   Ticket Board, archive, local complete assets, doctor/smoke and `game-dev`
   remain unavailable. Next is the device matrix and Ticket Board claim/lock
   evidence when those backends become available; keep `REVIEW / IN_PROGRESS`.

## Checkpoint addendum — L03c save-failure fault injection (2026-09-07)

This source/build-owner slice is implemented and remains `REVIEW`, not `DONE`.

1. Baseline main is `39b91072edf1d50a3eabf35ff3dd61f18ceee7bd`; code commit is
   `f99165d77d88be9f31c76569e7e9b01acdc943e0`.
2. `scripts/qa-full-access-v1.mjs` now installs a one-shot `persist()` failure
   control only after `qa=unlock-all`; it can be armed by
   `qaPersistFail=once|1|true` or the visible QA button. The normal route has
   no QA banner or fault control. `tests/qa-save-failure.test.mjs` covers the
   bridge and the existing transaction rollback code returns `SAVE_WRITE_FAILED`.
3. RED was `1 failure / 1 pass`; GREEN was `9/9 PASS` for QA + transaction
   checks; REFACTOR syntax checks and `git diff --check` pass. No gameplay,
   seed, reward, balance, save migration, roster, art or audio rule changed.
4. Vercel `dpl_9vxdxR6mwe5TXfhwF13epAZ489hP` is READY from the code SHA;
   complete-source build embedded `952395` bytes and selected runtime errors
   are `0`.
5. Chrome production first claim after arming kept quest `1/1`, button `Nhận`
   enabled and gems `820`, with visible `Lỗi lưu: đã mô phỏng`. The same retry
   committed the reward, showed `HOÀN THÀNH VIỆC VẶT`, raised gems to `840` and
   changed the claim button to disabled `✓`. Reloading the QA sandbox returned
   to gems `820` and quest `0/1`; app-origin browser errors were `0`.
6. Device capabilities remain `[]`; Ticket Board, archive, doctor/smoke,
   `agent-browser`, `game-dev` and the complete local asset checkout remain
   unavailable. Next handoff is device matrix + Ticket Board evidence; retain
   `REVIEW / IN_PROGRESS`.

## Checkpoint addendum — L04b opt-in scene lifecycle diagnostics (2026-09-08)

This source/test slice is implemented and remains `REVIEW`, not `DONE`.

1. Contract: `L04b-scene-lifetime-fault-diagnostics/v1`. The campaign source
   owns a QA-only snapshot for `qaL04b=scene-lifetime`; the DOM mirror is only
   written when that query is active. No seed, reward, balance, save
   migration, roster, art, audio or gameplay rule changed.
2. Code chain: `5979d493` → `eae7b4f1` → `7b1f2d6c` → `4f8511bd`. RED had two
   real failures on the baseline; GREEN was `2/2`; REFACTOR focused coverage
   was `32/32` with source/build-owner syntax and diff checks clean.
3. Vercel `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` is READY from `4f8511bd`; build
   logs confirm the source/build path and `952395` embedded battle bytes;
   selected runtime errors are `0`.
4. Chrome production normal route had no diagnostic snapshot. Active route
   reported one root, one visible root, eight pending resources, timer/RAF/
   observer active and five cached images. Exit disposed all activation
   resources. Twelve enter/exit loops kept root/resource counts stable and
   app-origin errors were `0`.
5. Device capabilities are `[]`; Ticket Board/boot, archive, doctor/smoke,
   `agent-browser`, `game-dev` and complete local assets remain unavailable.
   Full direct local suite is `185/222` pass with `37` connector-only
   asset/dist failures; local build is blocked by the missing Luc Anh atlas
   metadata. Next action is device matrix plus Ticket Board claim/lock/evidence;
   keep `REVIEW / IN_PROGRESS`.
