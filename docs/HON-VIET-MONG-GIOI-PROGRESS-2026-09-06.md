# Hồn Việt / Lục Thần — tiến độ hiện tại

Cập nhật **07/09/2026, giờ Việt Nam**. Giữ tên file cũ để các link bàn giao tiếp tục hoạt động. Nội dung này thay snapshot 06/09; lịch sử còn trong Git. Không dùng phần trăm tổng khi chưa có nghiệm thu từng hệ thống.

## 1. Baseline và công việc mới nhất

- Repository: `bktimmy247/luc-than`; [game chính](https://luc-than.vercel.app/).
- Baseline code phân tích: [`c8fefca0e31b6ddb926921454413d38860171665`](https://github.com/bktimmy247/luc-than/commit/c8fefca0e31b6ddb926921454413d38860171665), bản sửa âm thanh tiếp diễn sau khi thoát trận.
- L05c-b deployment [`dpl_8JxKw4my7swxv4Yn6Not7w6bmRod`](https://vercel.com/cuong-duc-ai-s-projects/luc-than/8JxKw4my7swxv4Yn6Not7w6bmRod) từ commit `005dc3a09661589ff7b96b6b7402212b1a26581e` đạt **READY**, Vercel commit status và build đều thành công, alias `https://luc-than.vercel.app/` trỏ đúng build; GitHub Actions không có workflow run. Chrome production đã có direct boundary/DoT/heal/multi-hit evidence, chưa có Safari/device evidence.
- Bộ kiểm thử baseline trước L05a là **171/171 đạt**, gồm 9 test hồi quy vòng đời âm thanh; sau L05a, `node --test tests/*.mjs` trên checkout hiện có đạt **31/31 pass, 0 fail** và `node --check` build owner pass. Đây là test/build, không phải Safari thật.
- Công việc ngày 07/09: ghép 7 part source Hermes, CRC đạt, kiểm kê 1.748 module/169 config, đọc luồng lõi và protocol, đối chiếu Lục Thần; cập nhật analysis/plan/handoff. Bản audit/plan ban đầu đã lên GitHub ở `799efe62475e2c3ff8145be7b6d2b323b46bdcb2`.
- Yêu cầu tiếp theo của anh đã được đưa vào tài liệu: cho Luna tái sử dụng code mẫu. Đã viết [guide port](HERMES-CODE-REUSE-GUIDE.md), đồng bộ master/entrypoints và lập bản đồ **27 phương thức từ 10 file** trong archive, kèm dependency/khác biệt cần xử lý. **Tất cả đang NOT_PORTED**; chưa ghi nhận ticket gameplay mới hoàn thành. Đợt cập nhật này không đổi runtime, balance, asset hoặc hạ tầng.
- Việc đưa thân mã gốc lên GitHub bị xét duyệt tự động chặn vì chưa rõ quyền phân phối lại source. Đã hoàn tất phần không bị chặn bằng tài liệu do agent viết; mã gốc vẫn ở archive người dùng bàn giao, không có gói source trích chọn trong repo.

- L05a đã nối pure combat observation contract + build fixture opt-in; L05b đã thêm boundary action/sub-action. Chrome production capture trước đó ghi hiệp 1–7, 51 action, 141 typed result, 281 impact, status `finished`. L05c-a đã thêm seeded rule/presentation RNG; L05c-b đã thêm direct status/DoT/energy/heal/multi-hit capture, nhưng status ticket vẫn IN_PROGRESS vì round cap, full replay/speed parity và device còn thiếu.
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
| Combat/observation | L05a/L05b observer + L05c-a seeded RNG + L05c-b direct boundary fixture tại `resolveAction.finally`, action/sub-action wrappers và `endBattle` | Focused L05c-b 34/34 pass; Vercel `005dc3a` READY; Chrome `finished` với 28 action/81 result/219 impact, 7 direct boundary types và 5 multi-hit actions; round cap 15, full replay/speed parity và Safari/device còn mở |
| Audio thoát trận | Đã sửa/deploy | `c8fefca`, stop active + pending + voice + result, old iframe không mute trận mới; còn L01 máy thật |
| Opening loop | Có graph/resume/route/event contract và 5 bước | Hai trận chương 1 → đội → nâng → mặc đồ; chưa nghiệm thu player-vNext từ tài khoản trắng |
| Hub | Icon alpha/visibility, dock, Nhiệm vụ và Bạn bè đã sửa; card main quest lớn đã bỏ | Giữ hướng hiện tại, không phục hồi card bị bỏ |
| Gọi Mộng | Có guard chặn pool rỗng trước debit | Banner/seed D01/D02 chưa chốt; không gọi là vòng thu thập hoàn chỉnh |
| Online | Có client API hooks và các màn/state local | Tree baseline không chứa backend/API server; chưa có bằng chứng hai tài khoản thật |

## 3. Những khoảng thiếu đã xác định từ code

1. **Catalog/seed:** defaultPlayer và migrateSave mở cả 12 tướng. QA full-access opt-in không tự giải quyết việc này. DATA.chapters có 6 chương và còn reward/unlockHero dùng ID legacy ngoài roster. Cần L02 và D01/D02; không xóa lore hay thu hồi save.
2. **Combat:** L05a/L05b đã có recorder/build fixture và một trận production thật; L05c-a đã capture giá trị/cursor RNG bằng hai stream rule/presentation và parity prefix cùng seed. L05c-b đã capture direct `performAction.action-cost`, `tickStatuses`, `applyDamage`, `applyHeal`, status, energy và death; production có DoT burn, regen heal và multi-hit evidence. Hai gap report cũ vẫn mở; round cap 15, full replay/speed parity và device chưa chứng minh.
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
| 6 | **L04a/L04b — IN_PROGRESS** / **L05a/L05b/L05c-a/L05c-b — IN_PROGRESS** | Return context + campaign scene scope đã nối, 28/28 focused pass, Chrome route/back và re-entry 20 vòng; combat focused L05c-b 34/34 pass, Vercel `005dc3a` READY và Chrome fixture đã capture 28 action/81 result/219 impact; profiler/fault/device, round cap và full parity còn mở |
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

## 4.7 L04a — return context cho hồ sơ và route

- Pure contract `src/domain/navigation/return-context.mjs` giữ source route + params, mode/encounter, hero/tab/filter, scroll và draft revision; input được clone, không mutate save.
- `scripts/return-context-v1.mjs` là build owner mới, chạy sau settlement/navigation và trước opening-loop; patch `navTo`, `showScreen`, `renderHeroDetail`. Context tạm nằm trong `sessionStorage`, không đi vào `P` hay receipt.
- Test syntax và combined focused suite đạt **24/24 pass, 0 fail**. Hai build marker/compatibility failure đã được sửa; deployment `dpl_RSZG5giySADfczg5VL7m4wafo9Ct` từ `67bcc39` đạt **READY** và log xác nhận R04.
- Chrome production smoke đã đi qua `Tướng` → `Ông Phở` → hồ sơ → back; roster hiện lại, `Sở hữu 12/12 tướng`, vàng/ngọc giữ nguyên. Đây mới là route/back happy path.
- L04a chưa DONE vì chưa có stress mở/đóng 20 lần, đo renderer/listener, fault/lifecycle harness, stale source/draft trên browser và Safari/device thật. Không đổi seed, reward, balance hoặc save migration.
- Bước tiếp theo: đo renderer/listener và fault/lifecycle/device để đóng L04a/L04b; L05a combat fixture độc lập.

## 4.8 L04b — scope vòng đời cho Chinh chiến

- `src/ui/scene-lifetime.js` là contract thuần cho resource scope: dispose một lần theo thứ tự ngược, guard callback sau dispose, unregister listener và cancel timer/RAF/observer/load owner.
- `src/ui/campaign-scene.js` tạo scope mới khi vào route và dispose khi rời route; root DOM không bị tạo lại. `scripts/afk-chest-runtime-v1.mjs` là build owner nhúng helper trước campaign source.
- Test thực tế: syntax source/build pass và toàn bộ `tests/*.mjs` trong checkout đạt **28/28**. Unit có nhánh reverse disposal, idempotency, stale callback, listener unregister, late registration và disposal error.
- Vercel deployment `dpl_kogrZQR2p2hkbfkHbep4PJjxndtq` từ `f675cdb` đạt **READY**, CI `success`. Chrome đã re-entry Chinh chiến 20 vòng; root campaign/roster vẫn mỗi loại 1 và scene hiển thị đúng.
- L04b chưa DONE: chưa đo renderer/listener bằng profiler, chưa fault-inject browser, chưa Safari/iPhone/iPad; không thay seed, reward, balance hoặc save migration.

## 4.9 L05a — fixture quan sát combat

- Commit code `d1c10ce00b5c1ad0b8589a9bb650f932bddb231b` thêm pure module `src/domain/combat/action-observation.mjs`, export qua combat index và build owner bundle vào battle. Capture opt-in chỉ chạy với `qaCombatFixture=l05a`; `endBattle` stop fixture để report không còn mở sau màn kết quả.
- Test thật: `node --check scripts/combat-domain-3q-adapter-v1.mjs` và `node --test tests/*.mjs` đạt **31/31 pass, 0 fail**. Source shell `index.html` giữ nguyên hash L03a `e4f79d41e3bf7bb225ff878729d71e72be9ad94bac962f5e41cffc98148680b9`.
- Chrome production: `https://luc-than.vercel.app/?qaCombatFixture=l05a` → Chinh chiến → Khiêu chiến → Xuất chiến; iframe nhận `battle.html?...&qaCombatFixture=l05a`. Encounter Ải 1–2 / Mộng Phố đã kết thúc `finished`, 8 hiệp, 51 action, 125 typed result, `impactCount=0`, phe ta 6/6 và phe địch 0/3.
- Kinds quan sát được: `stun` 6, `damage` 28, `guardAll` 2, `aoeBurn` 3, `aoe` 6, `aoeDebuff` 2, `execute` 4. Results: `damage` 49, `miss` 10, `buffAdd` 36, `barrier` 28, `death` 2. RNG sites: `applyDamage.hit`, `applyDamage.variance`, `applyDamage.crit`, `burst.angle/speed/life/size/spin`; giá trị RNG không được lưu.
- Report giữ ba gap `resolve-action-final-snapshot`, `per-impact-boundary-missing` tại `applyDamage/applyHeal/status/energy` và `rng-value-not-captured`. `aoeBurn`/status snapshot không đủ chứng minh DoT tick riêng; không có heal, combo multi-impact hoặc round cap 15 trong run này.
- Archive/source mẫu không khả dụng trong phiên này (`SOURCE_NOT_AVAILABLE`), nên không có method archive nào được port. Giữ scheduler, combat rule, settlement, audio và dữ liệu Lục Thần hiện có; không đổi seed, reward, balance, save migration hay asset. L05a vẫn **IN_PROGRESS**. Bước tiếp theo: L05b hook từng sub-action và capture giá trị RNG luật, sau đó thu lại fixture thiếu.

## 4.10 L05b — capture ranh giới sub-action

- Commit code [`fbb6f8137c98fcb25a99d308547cc2768de23a06`](https://github.com/bktimmy247/luc-than/commit/fbb6f8137c98fcb25a99d308547cc2768de23a06) mở rộng observer impact với `amount`, `flags`, `rngCursor`; build owner giữ `actionId` qua `performAction` và ghi boundary tại damage/heal/status/energy/death.
- `node --check` hai file combat và `node --test tests/*.mjs` đạt **31/31 pass, 0 fail**; static build-owner validation trên battle active compile đủ 5 inline script body và marker wrapper.
- Deployment `dpl_FkVnkvQ6QBRzUf5a6rrazvhuw1YN` đạt **READY**, CI Vercel **success**. Chrome production UI thật chạy encounter Ải 1–2 / Mộng Phố qua URL [fixture](https://luc-than.vercel.app/?qaCombatFixture=l05a): `finished`, hiệp 1–7, 51 action, 141 result, 281 impact, không console error/warn.
- Invariant report: 51/51 action có impact; 51 action ID duy nhất; counter action/result/impact khớp; 281/281 impact có action và before/after; `subActionIndex` liên tục trong từng action. Histogram impact/action: 3×13, 4×28, 5×1, 7×1, 8×1, 9×1, 12×1, 13×1, 19×4. Impact types: energy 158, damage 71, miss 9, status 40, death 3.
- L05b vẫn **IN_PROGRESS**. Direct status removal/DoT tick và actor energy-cost assignment chưa có boundary; chưa chứng minh heal/DoT/two-hit riêng, round cap 15, seeded RNG value, speed/replay parity hoặc Safari/device. Archive/source mẫu vẫn `SOURCE_NOT_AVAILABLE`; không đổi seed, reward, balance, save migration, asset, audio hay hotfix thoát trận.
## 4.11 L05c-a — seeded RNG và replay-prefix evidence

- Commit source/build owner: [80a593c4](https://github.com/bktimmy247/luc-than/commit/80a593c4bd843e879eaf64725223d178f5542987), follow-up phân loại forced roll: [147badb](https://github.com/bktimmy247/luc-than/commit/147badb07db22961f073e89b1145d22fef467c6d). `src/domain/combat/seeded-rng.mjs` tạo schema `hon-viet-combat-rng/v1`, stream rule/presentation độc lập, cursor/call log; session state nằm ngoài save bằng `WeakMap`.
- Build owner patch đúng source vào `battle.html`: 13 call-site runtime đã được gắn helper RNG; 2 `Math.random` còn lại là fallback có chủ đích trong bridge. `rngCalls`/`rngCursor` là optional trên action/impact/replay. Không sửa dist trực tiếp, không đổi seed config live, reward, balance, save migration, roster, art hay audio.
- RED→GREEN focused suite đạt **32/32 pass**; adapter syntax/dry-run, 5 inline script compile và injected bundle smoke pass. Full `npm test`/CI chưa chạy lại; GitHub Actions không có workflow run.
- Vercel deployment [`dpl_5ae3g2Ff6kD8gjFDDS6iB3cMQezH`](https://vercel.com/cuong-duc-ai-s-projects/luc-than/5ae3g2Ff6kD8gjFDDS6iB3cMQezH) từ `147badb` **READY**, production alias giữ nguyên. Chrome shell giữ roster 12/12 và route Chinh chiến; fixture cô lập `battle.html?...qaCombatFixture=l05a` chạy trực tiếp và report `finished`: 28 action, 81 result, 180 impact, 4.712 RNG call, 122 rule call captured. Run cùng seed thứ hai có 12 action/28 result/90 impact/75 rule call; hai action đầu có rule trace/cursor/value trùng nhau.
- L05c-a là **REVIEW**, không phải DONE. L05b/L05 tổng thể vẫn **IN_PROGRESS**. Report còn `resolve-action-final-snapshot` và `per-impact-boundary-missing`; coverage DoT/status removal/tick, energy-cost, heal/two-hit, round cap 15, full replay parity/speed và Safari/device còn thiếu. Archive/source mẫu `SOURCE_NOT_AVAILABLE`; ticket board `TICKET_BOARD_NOT_AVAILABLE`.
- Bước kế tiếp: L05c-b instrument trực tiếp status/DoT/energy + heal/two-hit, rồi chạy round cap 15 và full replay parity trước khi mở device QA.

## 4.12 L05c-b — direct combat boundary evidence

- Commit source/build/test: [005dc3a](https://github.com/bktimmy247/luc-than/commit/005dc3a09661589ff7b96b6b7402212b1a26581e). Focused RED→GREEN suite đạt **34/34 pass, 0 fail**; `node --check`, adapter dry-run và 5 inline-script compile pass. Full `npm test`/CI chưa chạy trong checkout connector-only.
- Production: deployment [dpl_8JxKw4my7swxv4Yn6Not7w6bmRod](https://vercel.com/cuong-duc-ai-s-projects/luc-than/8JxKw4my7swxv4Yn6Not7w6bmRod) **READY**, source `005dc3a`, build `npm run build`, embedded payload **940941 bytes**; Vercel runtime error scan 1 giờ sạch.
- Chrome UI fixture: `finished`, **28 action / 81 result / 219 impact**, 4.712 RNG call, 122 captured rule call. Boundary coverage: `addStatus 20`, `applyDamage 43`, `applyHeal 6`, `gainEnergy 105`, `markDefeated 6`, `performAction.action-cost 28`, `tickStatuses 11`; DoT `burn`, regen heal, positive direct heal và 5 multi-hit actions đã quan sát.
- Same-seed run thứ hai có prefix hai action đầu `prefixEqual=true`, nhưng còn `open`; đây là prefix parity, không phải full replay parity. Round cap 15, full replay/speed parity và Safari/iPhone/iPad/device chưa chạy.
- Report vẫn giữ `resolve-action-final-snapshot` và `per-impact-boundary-missing`; không tự đánh dấu DONE. Archive/source mẫu `SOURCE_NOT_AVAILABLE`; ticket board `TICKET_BOARD_NOT_AVAILABLE`. L05b/L05 vẫn **IN_PROGRESS**; bước kế tiếp là round-15/full parity rồi device QA.

## 5. Gate còn mở

- iPhone/iPad Safari thật: unlock/mute/thoát trận, Lục ultimate, result music, roster/back/safe area. Chưa có chứng cứ mới sau audio hotfix.
- AFK soak thật 15 giờ, reload/offline trên thiết bị; rate v1 `60 vàng + 1 Tinh + 1 Hoạt / giờ` vẫn là cấu hình tạm, không đổi âm thầm.
- Visual acceptance nền từng chương, damage popup multi-hit và toàn roster/action; các patch nền/damage đã có, cần đối chiếu hiện trạng thay vì gọi là chưa tích hợp.
- D01 seed mới, D02 banner/odds/pity/duplicate, D03 phạm vi/hạ tầng online, D04 guest migration, D05 thiết bị/budget, D06 mở rộng/trả phí: chỉ chặn phần liên quan. Định hướng Samkok, 12 tướng hiện hành, capacity 72, hai đòn + passive và quy tắc imagegen đã được chốt, không hỏi lại.
- Các bài test khác nhau có phạm vi khác nhau; unit/build, Chrome responsive, Chrome interaction, Safari thật và production deployment phải báo riêng.

## 6. Luật bảo toàn

Giữ 12 ID, sáu slot, ba trước–ba sau, 15 hiệp, không multi-wave cho Lục Thần. Giữ ownership/đầu tư save cũ và các kit đã chuyển; không bật global combat clock. Build/runtime nguồn là một chuỗi, không hai engine. Router/scheduler/audio mỗi loại một owner. Ảnh thiếu phải imagegen và tích hợp; CSS bố trí/tương tác, chữ/số sống; không key đen/cắt frame/làm méo để che lỗi. Được trích/port code mẫu phù hợp theo guide và test tại boundary. Không nạp toàn APK/Cocos bundle hoặc chép archive đè repo; việc dùng code không tự thay art/identity/balance. Các câu cũ cấm toàn bộ source không còn là quy tắc hiện hành.

Mỗi lần đóng ticket: ghi code commit, test, UI/device evidence, deployment nếu có, phần còn mở và bước tiếp. Nếu dùng mẫu, ghi excerpt ID/hash, file đích, dependency đã thay, khác biệt hành vi và trạng thái port theo guide. Mốc code baseline và mốc commit cập nhật tài liệu có thể khác nhau; không lấy một commit docs làm bằng chứng gameplay mới.


## 4.14 L05c-c — round cap 15 + full replay/speed parity (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Implemented on source/build owner: `action-observation.mjs`, `combat-domain-3q-adapter-v1.mjs`, `combat-l05c-parity.test.mjs`.
- Acceptance evidence: E05 round cap reports terminal round 15 with zero actions beyond cap; E06 production Chrome UI passes cap and speed controls; R08 no settlement/reward path changed; R11 focused regression `37/37 PASS`, source syntax and inline compile pass.
- Production deployment `dpl_CHELjrknWnR353JPiVLK9Zs8SPn8` is `READY` for commit `369f545`; runtime error query for the last hour returned none.
- Cap fixture actual: `93 action / 228 result / 644 impact`, round `15/15`, `roundCapReached=true`, `roundsBeyondCap=0`, visible `KHẢI HOÀN`, parity fingerprint `a1458659`.
- Valid speed parity actual: 1× and 2× both `28 action / 81 result / 219 impact`, same seed and fingerprint `0757b35e`; completion speed fields were `1` and `2` respectively.
- An earlier pre-launch speed-control attempt was discarded because `beginBattle()` reset the selected speed; the final 2× run changed the top control after launch and verified `Tốc độ trận đấu 2 lần` before completion.
- The round-cap sentinel is query-scoped only. Normal `l05a` and live/default battles retain native terminal handling; no seed/reward/balance/save/roster/art/audio changes.

Open: device QA, full CI outside connector-only harness, source archive and ticket-board blockers, plus the two existing observer boundary gaps. Next: device QA on the production alias. Do not mark DONE.

## 4.15 L05c-d — explicit final action snapshot evidence (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Source/build owner commit `eab4a45f14f82cad4875eb26cde7dba6b2e5b2d1` adds explicit `finalSnapshot` + `finalSnapshotBoundary=resolveAction.complete`; prior `after` field remains compatible.
- RED was reproduced against the unimplemented baseline (`3 failed`, exit 1); GREEN focused boundary suite is `3/3 PASS`; REFACTOR combat regression is `39/39 PASS`, syntax and inline compile pass.
- Production `dpl_DZtRfRZGyWeDUnhxtQcVjn2GZAnZ` is `READY`; build ran `npm run build` / `node scripts/build-static.mjs`; embedded battle is `950131 bytes`; runtime errors 1h: none.
- Chrome production l05a capture at 1× and 2× both finished with `28 action / 81 result / 219 impact`, `finalSnapshotCoverage=28/28`, boundary `resolveAction.complete`, and identical full-replay fingerprint `282374be`; speed fields were 1 and 2.
- Final-action observer gap is closed only for actions with explicit capture. Per-impact gap remains open. No seed/reward/balance/save/roster/art/audio changes.

Open: per-impact boundary, real device QA, full npm test outside the connector-only source harness, `game-dev` CLI, Ticket Board, and archive source. Next: device matrix when available, then per-impact boundary.

## 4.16 L05c-e — per-impact boundary evidence (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Source/build owner commit `efab46434a36c805e6f0c5fe284c0827132d7ea2` adds explicit per-impact evidence fields: `boundaryCaptured` and `snapshotBoundary`. The observer report now exposes `impactSnapshotCoverage` and closes `per-impact-boundary-missing` only for complete action/impact capture.
- RED: focused new contract assertions produced 3 real failures, exit code 1. GREEN: focused suite `10/10 PASS`. REFACTOR: syntax and the full combat suite `39/39 PASS`.
- Production Vercel deployment `dpl_5AaCe8jwx53Xh7caas3UJQ5xMHca` is `READY`; build used `npm run build` → `node scripts/build-static.mjs`, embedded battle `951694 bytes`; runtime error query 1h: none.
- Real production Chrome run after `Xuất chiến` and UI speed change to 2×: `finished`, `28 action / 81 result / 219 impact`, impact snapshot coverage `219/219`, action boundary coverage `28/28`, final snapshot coverage `28/28`, completion `player / enemy-wiped / round 4`, fingerprint `282374be`, `gaps=[]`.
- No changes to seed, reward, balance, save migration, roster, art, audio or dist. Direct fixture emits the known embedded-config fallback warning only; no app runtime error.

Open: real responsive/device QA, full npm test outside the connector-only source harness, `game-dev`, Ticket Board and archive source. L05b/L05 remain `IN_PROGRESS`; do not mark DONE. Next: device matrix on the deployed alias, then reassess the remaining L05b acceptance evidence.

## 4.17 L05c-f — semantic impact-case coverage (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Observer source commit `4df4ff500d10e559ffff16ba5b265491fd8f896a` thêm `impactTypeCoverage` và `impactCaseCoverage` để evidence phân biệt damage, heal, DoT, status và multi-hit.
- RED có 3 failure thật; GREEN focused `10/10 PASS`; REFACTOR full combat `39/39 PASS` và syntax observer/adapter pass.
- Production deployment `dpl_6Zu9TgEAKBcgwAxWcLz9KQRSxZXy` READY; embedded battle `952325 bytes`; runtime errors 0.
- Production Chrome thực hiện `Xuất chiến` + đổi tốc độ 2×, kết thúc `28/81/219`; type counts `damage 38, death 6, dot 4, energy 133, heal 13, miss 5, status 20`; semantic cases đều `true`; boundary/final snapshot đều complete; fingerprint `282374be`; `gaps=[]`.
- Không đổi seed, reward, balance, save migration, roster, art, audio hoặc dist. L05b/L05 vẫn `IN_PROGRESS`.

Open: device matrix, full npm/CI outside connector-only harness, `game-dev`, Ticket Board và archive. Next: real device QA, rồi cập nhật Ticket Board khi khả dụng.

## 4.18 L04b — one-shot scene timer cleanup (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Source owner `src/ui/scene-lifetime.js` now releases a completed
  `trackTimeout` registration immediately after its one-shot callback. This
  prevents finished timer entries from accumulating between campaign
  activations while preserving the stale callback guard and timer handle API.
- RED was a real focused failure (`pending 1 !== 0`); GREEN/REFACTOR focused
  L04 suite is `18/18 PASS`, with changed owner/build-owner syntax checks pass.
- Code commit `e37c6df342e912a3c8ef15ac2ad5ed152547db21`; Vercel
  `dpl_8ZUUaBWq4z4yd58Br8piF7UNN68N` READY; complete-source build embedded
  battle `952325 bytes` and runtime error query returned none.
- Chrome production re-entry ran 20 rounds; roster/campaign root counts stayed
  at `1/1`, both visible, and app-origin browser errors were `0` after removing
  extension diagnostics.
- No seed, reward, balance, save migration, roster, art, audio, combat rule or
  dist-only change.

Open: Ticket Board, device matrix, local complete asset checkout, doctor/smoke
scripts and Game Development Studio CLI. Keep L04/L04b `IN_PROGRESS`; next is
real device QA and Ticket Board claim/lock when available.

## 4.19 L04-A2 — runtime stale-draft revision propagation (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Source/build owner commit `6e1bb9c28538ee65355f59f8bf6601b9934807d2` wires the
  live `P.revision` into return-context capture and both restore resolution
  points. Pure domain stale-revision semantics are now enforced by the actual
  generated runtime; no gameplay/player-data contract changed.
- RED was one real build-owner assertion failure. GREEN/REFACTOR focused
  return-context + scene-lifetime + campaign suite is `19/19 PASS`; syntax and
  diff checks pass.
- Vercel deployment `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` from the same SHA is
  `READY`; build log runs `npm run build` / `node scripts/build-static.mjs`,
  embedded battle is `952325` bytes, runtime error query 1 hour is empty.
- Chrome production smoke: Chinh chiến root `1/visible`; Tướng root `1/visible`
  with 12 cards; app-origin console errors `0`. Ông Phở card → hero detail was
  unstable in this run and remains unclaimed; no app console error surfaced.
- Responsive/device backend capabilities are `[]`; Safari/iPhone/iPad and
  responsive Chrome are not tested. Ticket Board `TICKET_BOARD_NOT_AVAILABLE`,
  archive `SOURCE_NOT_AVAILABLE`, `game-dev` CLI missing, local complete asset
  checkout missing and doctor/smoke scripts absent remain blockers.

Next exact action: retest/fix hero-detail route/back, then rerun responsive and
Safari/iPhone/iPad QA plus Ticket Board claim/lock/evidence when available.
Do not mark this or the parent L04 ticket `DONE`/`MERGED`.

## 4.20 L04-A2 — hero-detail route/back viewport surface (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Source/build owner commit `935a472c111b3d4096307cc5a95c434ee7bc9b1f` adds
  explicit `100vh`/`100dvh` height to the state-backed roster portal. This fixes
  the production hit-test failure without changing player data, gameplay or
  roster contracts.
- RED: new route contract failed because the source-owned portal had no explicit
  viewport height. GREEN: focused route test `1/1 PASS`. REFACTOR: focused
  route/roster/return-context/roster-plan tests `23/23 PASS`; syntax and diff
  checks pass.
- Production `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is `READY` from the same SHA;
  Vercel build completed with embedded battle `952325` bytes and runtime errors
  `0` in the selected 1-hour window.
- Chrome production evidence: viewport `1363×936`; roster root `680×936`,
  grid `680×716`, 12 cards; Ông Phở card opens `heroDetail`, and back returns
  to one visible roster root with the selected card active; app-origin errors `0`.
- Machine evidence: `docs/qa/L04a/l04a-hero-detail-route-back.json`.

Open: responsive/device matrix, full local/CI asset harness, Ticket Board,
archive and Game Development Studio CLI. Keep L04/L04a `IN_PROGRESS`; do not
mark `DONE` or `MERGED`.

## 4.21 L05c — round-cap and full replay parity (2026-09-07)

Status: `REVIEW` / `IN_PROGRESS`.

- Baseline main `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`; source/build commit
  `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`.
- The action-observation source now publishes the fixture seed in the
  `hon-viet-combat-replay-parity/v1` projection. This makes the existing
  full-replay fingerprint auditable without changing any gameplay or player-data
  rule.
- RED was a real missing `replayParity.seed` assertion. GREEN is the focused
  L05c test at `4/4 PASS`; REFACTOR is the full combat suite at `39/39 PASS`,
  plus syntax and diff checks.
- Vercel `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is `READY` from the code SHA;
  complete-source build embedded `952395` bytes and the selected runtime-error
  query is empty.
- Production Chrome 1× and 2× runs both ended at authored round `15/15` with
  no round `16`, `93` actions, `644` impacts, seed
  `l05a-production-seed`, fingerprint `86267582`, `roundsBeyondCap=0`, and
  `gaps=[]`. The report completion speed is `1` vs `2` respectively; final 2×
  app-origin console errors are `0`.
- Machine evidence: `docs/qa/L05c/l05c-round-cap-replay-parity.json`.

Remaining gates are unchanged: device capabilities `[]`, Ticket Board and
archive unavailable, Game Development Studio CLI absent, local binary-asset
checkout incomplete, and doctor/smoke scripts absent. Keep the parent work at
`REVIEW / IN_PROGRESS`; do not mark `DONE` or `MERGED`.
