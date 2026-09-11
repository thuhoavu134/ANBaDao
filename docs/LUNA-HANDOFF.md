# Bàn giao Lục Thần / Hồn Việt cho Luna và các model tiếp theo

## 2026-09-11 — TKT-0030 Săn Boss · REVIEW

Nhánh `work/l19-hunt-onto-main` **chưa merge**. Sơn mài + domain khế/ấn/thưởng từ main `1139ef4`. Công thức live giữ nguyên (6⚡, 2 lượt/ngày, 3 boss xoay, Săn Khế Phá Lõi/Quét/Đoạt Mệnh, mốc 3/7/12). Chrome 390×844 PASS; Safari/device NOT_RUN. Owner gõ `live` mới lên production.

Contract: [tickets/TKT-0030](../tickets/TKT-0030/ticket.md). Evidence: [qa/L08-HUNT](qa/L08-HUNT/).


## 2026-09-11 — Snapshot toàn bộ · điểm vào agent sau

**Đọc [HANDOFF-2026-09-11.md](HANDOFF-2026-09-11.md) trước mọi mục dưới.** File đó là nguồn sự thật cho việc đang live, file owner, PR #18–#25, hub còn lại và TKT-0026.

- Production: [luc-than.vercel.app](https://luc-than.vercel.app/) · main `ec6df191042b8a512e230e037cc5d8833bd30133` (PR #25 CI/CD).
- Live đã có: vòng Chinh chiến/Bày trận/trận, Trợ trận 11 nan + Dung luyện, Tháp sơn mài khóa lực chiến + bù ngày, dist 361MB, GitHub Actions 537/537.
- Việc kế: chờ owner `tiếp`. Gợi ý địa danh còn shell legacy: Mộng Lộ, Chợ Mộng, Gọi Mộng, Đấu Trường. Không tự mở Combat V2 hay đổi seed.
- Safari/device: NOT_RUN. Ticket Board: không có. Builder dừng REVIEW.
- Visual pass Bày trận 09/09 đã bị owner từ chối — không khôi phục.

Contract Tháp: [tickets/TKT-0023](../tickets/TKT-0023/ticket.md). CI: [tickets/TKT-0025](../tickets/TKT-0025/ticket.md).

## 2026-09-11 — TKT-0023 Tháp khóa lực chiến · REVIEW

Nhánh `work/l14-tower-20260911` **đã merge main** (PR #23). Mỗi tầng Tháp có mốc lực chiến; đủ thì auto-qua, thiếu thì kẹt và bù +12%/ngày (trần 5). Thua không tụt tầng, không đụng campaign. Chrome 390×844 PASS; Safari/device NOT_RUN. Owner đã cho lên live.

Contract: [tickets/TKT-0023](../tickets/TKT-0023/ticket.md). Evidence: [qa/L22-TOWER](qa/L22-TOWER/).


## 2026-09-08 — Bàn giao L11 cho Luna: REVIEW / IN_PROGRESS


Chủ dự án yêu cầu chốt tiến độ trong lúc triển khai hồ sơ V2 và 126 nút chiêu. Source đang làm được lưu ở [handoff/l11-splus-profiles-v2-20260908](https://github.com/bktimmy247/luc-than/tree/handoff/l11-splus-profiles-v2-20260908), commit [`b6a2ae2`](https://github.com/bktimmy247/luc-than/commit/b6a2ae20a9b1b3071a8f5263740312e9d1465b04). Main nhận tài liệu/evidence; combat V2 chưa phát hành production.

[Bàn giao L11 đầy đủ](LUNA-HANDOFF-SPLUS-PROFILES-2026-09-08.md) là điểm bắt đầu mới nhất. Đã nhập 42 hồ sơ/126 chiêu, tạo 6 atlas ×21 vùng nút và viết UI giới thiệu/popup/bridge; resolver mới đồng bộ một phần. **23 test mới: 17 đạt, 6 fail; bộ S+ cũ trên WIP: 117/133 đạt, 16 fail; syntax: 17/17 đạt.** `npm test` dừng ở build do checkout local thiếu part01 atlas Lục Ảnh; GitHub đã xác nhận file gốc còn đủ. Browser/device V2 chưa chạy, REFACTOR chưa xong.

Tiếp tục sáu handler Cơ Trọng, Tiêu Hồn, Trầm Châu, Tuệ Y, Khaos, Hồi Ảnh; sau đó audit đủ84 S1/Ult và các passive theo hồ sơ mới. Không hiểu 6 fail là toàn bộ việc còn thiếu. [Machine checkpoint](qa/L11-SPLUS-PROFILES/handoff-checkpoint.json) và [log test](qa/L11-SPLUS-PROFILES/handoff-targeted.tap) ghi trạng thái thực. Ticket Board/claim-lock, doctor/smoke/boot và device backend vẫn thiếu; không giả claim, PASS, DONE hoặc MERGED.

Luna đọc bản bàn giao L11, lấy đúng nhánh/SHA source, tái hiện RED rồi tiếp tục GREEN → REFACTOR → build/browser/evidence → REVIEW. Các mốc L10 và lịch sử dưới đây không phải QA cho V2.

## 2026-09-08 — L10-SPLUS42 · REVIEW / IN_PROGRESS

Hồ sơ 42 tướng S+ và 42 icon của chủ dự án đã được chuyển thành catalog 6×7, 42 nội tại, 42 Kỹ năng 1, 42 Ultimate, status owner và bridge vào scheduler trận hiện có. Contract: [SPLUS42-COMBAT-CONTRACT.md](SPLUS42-COMBAT-CONTRACT.md). Trang production: [chọn 42 tướng để thử cơ chế](https://luc-than.vercel.app/splus-lab.html); mỗi tướng mở trận 6v6 thật tại `/battle.html?qaSplus42=<hero_id>`.

- Baseline upstream: `d3ee56cd1391208ae262652b383e5b7d443308c7`. Code chính: `2314c2ef522e5ad1b5a88ee7cc058a0a36b87d89`; code cuối sau browser QA: `889426acac6d3d860b3f945131969d93d8ce3107`. Đã push fast-forward lên main. Không làm lại L04b; không đổi seed/reward/save migration/roster sở hữu/art/audio cũ.
- Source/build owner: `src/domain/hero/splus-*.mjs`, `src/domain/combat/splus-mechanics.mjs`, `src/runtime/splus-battle-bridge.js`, `scripts/splus-runtime-v1.mjs`, `scripts/build-static.mjs`, `splus-lab.html`. HUD theo mục tiêu có nguồn, tên ấn, tầng, charge và thời hạn. Art mới chưa có: thẻ số/tên tạm, 42 icon manifest chưa có file ảnh; không coi art integrated.
- RED thật: 9 test đầu thiếu resolver; kit regression bắt miễn tử Cửu Triều, giáp Kén và splash khi kết liễu; browser follow-up bắt fixture chiếm chỗ tanker. GREEN cuối: **133 test S+**, combined focused+legacy **151 PASS / 0 FAIL**. 84 skill effects được kiểm bằng hành vi; source/bundle factory parity và không thêm scheduler. REFACTOR dùng chung factory, gom floater nhiều hit và ưu tiên vị trí tanker khi xếp fixture.
- `npm test` và `npm run build` local đã chạy, BLOCKED tại `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`; partial compile còn thiếu atlas Đinh Lôi. Targeted adapter compile PASS, không gọi là full build. Local Chrome `127.0.0.1:4173` bị `net::ERR_BLOCKED_BY_CLIENT`.
- Vercel full-source build **READY**, deployment `dpl_32S8AqbZtK3mtQ1nBacTKsj5Wpgz`, alias production đã gán. Embedded battle sync **1,077,714 bytes**; build hoàn tất 5 giây. Truy vấn runtime errors 1 giờ: **0**. [Machine deployment evidence](qa/L10-SPLUS42/vercel-code-deployment.json).
- Chrome production trên code cuối: **6/6 trận kết thúc, 951 hành động, 9,718 event, đủ 42 hero actor**, HP hữu hạn, slot tướng sống duy nhất, app-origin errors **0**. Mãng Xà kết thúc hiệp 13, năm trận còn lại đúng giới hạn hiệp 15. Lọc catalog đủ 7/hệ và 6 healer. Không khẳng định browser đã cast đủ 84 skill hoặc full speed/replay parity. [Machine battle evidence](qa/L10-SPLUS42/production-six-elements.json).
- Luồng thường: roster chuẩn bị 12 tướng, không có HUD S+, trận đầu thắng hiệp 2 / 16 hành động; Xác nhận xử lý kết quả và chuyển tới BOSS kế tiếp. Về Thành Chính chưa được xác minh riêng; không kết luận lỗi từ snapshot ngay sau click. [Legacy/catalog evidence](qa/L10-SPLUS42/production-legacy-and-catalog.json).
- Device capabilities `[]`; Ticket Board/claim/lease/lock, doctor/smoke, agent-browser/game-dev CLI không khả dụng. Chủ dự án đã cho phép tiếp tục source/test khi thiếu board; không giả claim. Workflow vibe-lab run `20260907-205925-epmcgpc`; trace và RED/GREEN log ở `docs/qa/L10-SPLUS42/`.
- Các hệ số/duration thiếu trong hồ sơ là **review defaults**, được liệt kê trong contract; chưa chốt balance hoặc khả năng vượt Tháp Nguyên Tố. Tổng ticket giữ **REVIEW / IN_PROGRESS**, không DONE/MERGED.

Bàn giao tiếp: review các mặc định còn thiếu, nhập atlas 42 tướng và 42 icon alpha do chủ dự án cung cấp, rồi nối chính sách mở/sở hữu tướng được duyệt. Khi backend có, chạy device + browser speed/replay matrix, kiểm riêng return navigation L04a và cập nhật Ticket Board. `tests/results/latest.md` và `docs/qa/L10-SPLUS42/evidence.json` là điểm vào evidence; phần dưới giữ lịch sử các lát cắt trước.

Cập nhật: **08/09/2026**. Đây là điểm vào cho Luna. Các mục pixel/render và evidence 05/09 phía dưới là lịch sử kỹ thuật; trạng thái hiện tại nằm ở mục 1 và progress.

## 0. Quy tắc skill bắt buộc

Trước khi nhận hoặc thực hiện bất kỳ lát cắt nào, đọc quy tắc Vibe Builder + VibeLab trong VIBE-WORKFLOW-RULES.md.

- Dùng **vibe-builder** để quyết định và triển khai sản phẩm; mặc định main agent code trực tiếp.
- Dùng **vibe-lab** làm gate trước/sau mọi thay đổi runtime: contract, ticket/claim/lock, RED → GREEN → REFACTOR, evidence và REVIEW/handoff.
- ticket-board là nguồn sự thật cho trạng thái ticket. Không tự đánh dấu MERGED/DONE.
- Nếu gate hoặc evidence không chạy được, ghi blocker cụ thể; không bỏ qua để báo hoàn tất.


## 1. Đọc nhanh: hiện có gì và làm tiếp ở đâu

- Latest source/build checkpoint là `4f8511bd52e2bd52eb79d44406b2b9153531f14c`;
  Vercel `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` đạt READY trên alias
  `https://luc-than.vercel.app/`. L04b diagnostics đã qua focused `32/32`,
  Chrome production active/exit/re-entry evidence; ticket tổng thể vẫn
  `REVIEW / IN_PROGRESS`.

- Repo `bktimmy247/luc-than`; [production](https://luc-than.vercel.app/). Game HTML/JavaScript + Canvas 2D, shell index và iframe battle, build bằng `scripts/build-static.mjs`.
- Code bàn giao hiện tại là [`005dc3a09661589ff7b96b6b7402212b1a26581e`](https://github.com/bktimmy247/luc-than/commit/005dc3a09661589ff7b96b6b7402212b1a26581e), nối observer combat L05a/L05b, seeded RNG L05c-a và direct boundary L05c-b vào build owner. Focused L05c-b suite đạt **34/34 pass, 0 fail**; full `npm test`/CI chưa chạy trong phiên connector-only này. Vercel production `dpl_8JxKw4my7swxv4Yn6Not7w6bmRod` từ commit `005dc3a` đạt READY. Chrome production fixture đã capture `finished`, 28 action, 81 result, 219 impact, 219 direct boundary impact và 5 action có từ hai hit. Hotfix âm thanh thoát trận vẫn được giữ; round-cap/full replay và Safari/device còn mở.
- [Progress](HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md) ghi trạng thái từng hệ; [execution plan](LUNA-EXECUTION-PLAN-2026-09-07.md) chia L01–L20. **L02a đã hoàn thành: audit/validator catalog ở commit 7272ede748eed62af4814e13776e468ebe7e9d15; L02b đã hoàn thành proposal reward ở commit 25140d3fd8c0b151d89f9bbecdc85834fe7195ea; L02c contract prep đã có ở commit 324a33e100170643a5223c87dd945e4bc5969879; L03a audit transaction command đã có ở commit 3e69e5c3b7ef3996946c77310d6e5cdb372e270e; L03b source patch level-up đã có ở commit 83f7ed607deca63595fe1a2bc73c0eff7793c682; L03c atomic quest claim ở commit ee9503f8e80b10e0cde57076a38cfa8f038c402d.** L02c vẫn chờ duyệt mapping rồi mới nối migration runtime; L03b/L03c đã qua Vercel production build; L03c đã có Chrome production UI smoke claim + reload; L04a return-context source/build đã qua Vercel và Chrome route/back smoke; L03c còn chờ save-fail/device verification, L04a còn chờ stale source/draft/modal/device; L04b resource scope đã có source/build patch và Chrome re-entry 20 vòng nhưng còn chờ profiler/fault/device; L05a/L05b observer/build fixture đã có code; L05b Chrome production đã capture 281 impact nhưng còn thiếu các case combat/device. Chưa thay balance/seed. L01 là device verification, không viết lại bus audio.
- [Phân tích source Hermes](HERMES-SOURCE-AUDIT-2026-09-07.md) là tài liệu học tổ chức game mẫu; [manifest](reference/hermes-source-manifest-2026-09-07.json) kiểm kê/hash. Archive là Cocos client đã tách mã + config/protocol; chưa có backend/project editor đầy đủ để deploy lại.
- **Anh đã yêu cầu dùng lại code mẫu.** [Hướng dẫn tái sử dụng](HERMES-CODE-REUSE-GUIDE.md) thay quy tắc cũ chỉ học kiến trúc/cấm toàn bộ source. Guide xác định 27 phương thức trong archive đã nhận, dependency và lỗi cần sửa khi port. Mã gốc chưa được đưa lên GitHub do xét duyệt tự động chặn việc phân phối lại; repo chứa phần phân tích/hướng dẫn do agent viết. Luna được tự trích/port phần phù hợp vào owner hiện có; chưa có đoạn nào được tích hợp trong đợt tài liệu này.
- Giữ bản sắc Hồn Việt, 12 ID chính thức, 6 slot (3 trước/3 sau), 15 hiệp, không multi-wave. Capacity được chốt trong plan là 72 (32 SSR/16 SR/16 A/8 B), hiện chưa có đủ nội dung; không tạo placeholder để đủ số.
- Ông Phở/Lục Ảnh có kit v2 Basic + Ultimate + passive; 10 tướng còn lại chưa chuyển đủ. Không hỏi lại định hướng hai đòn và không tráo legacy Skill 1/Ultimate hoặc bỏ đầu tư.
- PR #16 campaign/AFK/preparation/MVP đã merge tại `92b503c`. Cap AFK 15 giờ, cảnh diễn hoạt không tự tiến ải/nhận thưởng. Bốn ảnh campaign đã có.
- Điểm vướng đã thấy từ code: seed/migration mở cả 12; thưởng chương còn ID legacy ngoài roster; event combat cần đủ sub-action và seeded RNG; transaction/event chưa phủ mọi luồng. Không dùng API hooks để khẳng định backend/rank/chat thật đã có.
- Khi sửa runtime chạy npm test và bấm UI thật. Báo riêng build/unit/integration, Chrome responsive, Chrome interaction, Safari thiết bị thật và production deployment.

Thứ tự đọc tối thiểu mỗi phiên: AGENTS → mục này → progress → đúng ticket Lxx → guide tái sử dụng và đoạn source liên quan khi port. Master plan giữ mã E/R/M và quyết định D; chỉ đọc phần liên quan. Không dump dòng BATTLE_HTML_BASE64 khổng lồ khi tìm kiếm; dùng rg với giới hạn cột hoặc đọc theo function boundary.

## 1.1 L02b — proposal reward đã triển khai

- Đã lập bảng 6 chương / 11 legacy reward refs trong docs/qa/L02b/reward-mapping-proposal.md.
- Đích đề xuất lần lượt là co_dao_ganh_hoi, phong_tu, thuy_nuong_roi_nuoc, luc_anh, to_diep và dinh_loi; tất cả đều nằm trong 12 playable ID.
- Module proposal và behavior test không được import vào runtime, nên không đổi reward, seed, balance, ownership hay save migration. Test combined L02a + L02b đạt 6/6.
- Chưa đánh dấu full L02 DONE: cần duyệt mapping, xử lý receipt/claim trong L02c và xử lý riêng scene reference/unlock legacy.
## 1.2 L02c — contract migration reward đã chuẩn bị

- Module src/domain/save/chapter-reward-migration.mjs là pure contract, không DOM/storage/network và không mutate input save.
- Có ba boundary: preview chapter state, backfill receipt cho clearedChapters và explicit claim candidate có mappingVersion/commandId.
- Không có runtime import/build patch ở commit này. Vì vậy reward DATA và save người chơi hiện chưa đổi.
- Test chapter-reward-migration cùng L02a/L02b đạt 11/11; full npm test/build/UI/device/deploy chưa chạy lại.
- Chỉ tiếp tục tích hợp sau khi duyệt 6 mapping trong L02b; không regrant chapter đã clear, không thu hồi legacy ownership/shard.

## 1.3 L03a — audit transaction command đã triển khai

- L03a đã đóng phần kiểm kê source/report ở commit 3e69e5c3b7ef3996946c77310d6e5cdb372e270e; không đánh dấu L03 tổng thể DONE.
- 23 boundary command/helper được kiểm đủ marker: hero level/star/unlock, reward/apply/redeem, campaign start/clear, daily/weekly/idle, forge và mail. Report đầy đủ ở docs/qa/L03a/transaction-command-inventory.json.
- Source active index.html được khóa bằng SHA-256 e4f79d41e3bf7bb225ff878729d71e72be9ad94bac962f5e41cffc98148680b9. Kết quả: 23/23 verified, 509 function declaration, 163 mutation/persist candidate, 0 receipt-aware candidate.
- Deep slice hiện tại là levelUpHero → questProgress → weeklyProgress: cost/debit và level mutate trước quest progress; quest/weekly có persist nội bộ; outer persist đứng sau. Vì runtime chưa gọi transaction/receipt contract, boundary được ghi là not-atomic.
- Test thực tế: 14/14 focused tests pass cho L02a + L02b + L02c + L03a. Failure harness mới được ghi/kiểm tra ở mức contract mô tả, chưa tiêm vào runtime thật; full npm test/build/browser/Safari/production chưa chạy.
- L03b đã nối level-up; L03c tiếp tục quest claim với command key theo ngày và clan XP cùng transaction. L02c vẫn PREPARED cho tới khi sáu reward mapping được duyệt.
## 1.4 L03b — atomic level-up đã triển khai ở build owner

- Build owner `scripts/transaction-contract-v1.mjs` hiện đặt `questProgress('level',1,false)` bên trong mutation của `levelUpHero`; `questProgress`/`weeklyProgress` không tự persist trong outer transaction.
- Command ID mặc định dựa trên hero ID + level trước khi nâng. Nút level-up truyền cùng ID và khóa trong click hiện tại; batch level-up tạo ID riêng cho từng level.
- Commit 83f7ed607deca63595fe1a2bc73c0eff7793c682; test mới 3/3 pass, combined focused suite 17/17 pass. Harness chứng minh state candidate rollback khi persist fail và duplicate receipt sau reload.
- Vercel deployment `dpl_5V1u4BTmZ991AseBnGhzAgj1KULv` từ commit `8774812051e60ecca055d73e67b91c6183fb15fe` đạt READY; `scripts/build-static.mjs` đã chạy qua và embedded battle được sync. Chưa có interactive UI/browser/Safari gameplay evidence, nên L03b vẫn IN_PROGRESS.
- L03c đã nối claimQuest ở lát cắt riêng; mail/forge/campaign và candidate khác vẫn cần migrate riêng. L02c vẫn PREPARED, không có mapping/reward migration nào được áp dụng.
## 1.5 L03c — atomic quest claim đã triển khai ở build owner

- L03c được đưa lên `main` ở commit `ee9503f8e80b10e0cde57076a38cfa8f038c402d`: `claimQuest` dùng command ID ổn định theo quest ID + daily `dayIndex`, không dùng revision mới để tạo claim mới.
- Reward, trạng thái claimed, activity points và +5 XP Gia Tộc cùng nằm trong `hvRunCommittedTransaction`. Helper state-only thu level-up notification; toast chỉ chạy qua `afterCommit` sau persist thành công.
- Test mới 3/3 pass; thêm 1 regression test tương thích build owner; combined focused suite L02a + L02b + L02c + L03a + L03b + L03c đạt 21/21. Đã kiểm rollback khi persist fail và duplicate retry sau reload.
- HTTP smoke `https://luc-than.vercel.app/` trả 200 và production HTML có quest-claim/opening atomic hooks. CLI `agent-browser` không có trong môi trường; Chrome control-browser cô lập đã mở production, nhận Ca Trực Đêm → Thu nhận → claim quest `Nhận thưởng Ca Trực Đêm 1 lần`, rồi reload xác nhận quest vẫn `1/1`, nút `✓` disabled và ngọc giữ `820` sau mức ban đầu `800`. L03c vẫn chưa DONE vì chưa có save-fail fault injection và Safari/device evidence.
- Không đổi seed, reward definition, balance, save migration, asset, battle, audio hoặc hotfix thoát trận; L02c vẫn PREPARED.

## 1.6 L04a — return context đã triển khai ở build owner

- L04a thêm pure contract `src/domain/navigation/return-context.mjs` với schema `hon-viet-return-context/v1`: capture/validate/resolve source route, params, mode, encounter ID, hero ID, tab, filter, scroll và draft revision mà không mutate player save.
- Build owner `scripts/return-context-v1.mjs` được nối trong `scripts/build-static.mjs` sau settlement/navigation và trước opening-loop. Runtime chỉ giữ context tạm trong `sessionStorage`, kiểm source route/screen/revision và fallback an toàn khi source không còn hợp lệ hoặc draft đã cũ; back từ hồ sơ tướng restore scroll rồi clear context.
- Code được bắt đầu ở commit `70790e0fb64833e2d1923d99a7d413c2916d491c`; marker fix là `ee756bd7f6ad9bffa4e3069b11238dcb757e741d`; compatibility fix mới nhất là `67bcc39e936025f895ebea8551946de47c51412d`.
- Test syntax + focused suite L02a–L03c và L04a đạt **24/24 pass, 0 fail**. Vercel deployment `dpl_RSZG5giySADfczg5VL7m4wafo9Ct` từ `67bcc39` đạt **READY**; log xác nhận R04 được cài, embedded battle `907780 bytes` và deployment hoàn tất.
- Chrome control-browser cô lập trên [production](https://luc-than.vercel.app/) đã bấm `Tướng` → thẻ `Ông Phở` → hồ sơ → `Quay lại danh sách tướng`; roster trở lại đúng với `Sở hữu 12/12 tướng`, vàng/ngọc không đổi. Đây là route/back happy-path smoke, chưa phải stress/lifecycle/device acceptance.
- L04a vẫn **IN_PROGRESS**: chưa chạy mở/đóng 20 lần có đo renderer/listener, fault/lifecycle harness, source route mất trong runtime, draft revision stale bằng browser hoặc Safari iPhone/iPad thật. Không đổi seed, reward, balance, save migration, asset, battle, audio hay hotfix thoát trận.
- Bước tiếp theo chính xác: bổ sung lifecycle/return cases để đóng L04a hoặc chuyển L04b dispose scope nhỏ; L05a fixture combat có thể làm độc lập.

## 1.7 L04b — scope vòng đời đã triển khai cho Chinh chiến

- Commit `f675cdb0a8d5fe44b28c382652b42ba2790a90d3` thêm helper thuần `src/ui/scene-lifetime.js`: disposer idempotent theo thứ tự ngược, guard callback stale, event listener/timer/RAF/observer/AbortController tracking và báo lỗi dọn dẹp.
- `src/ui/campaign-scene.js` tạo scope mới cho mỗi activation của Chinh chiến; scope giải phóng RAF, interval, ResizeObserver và image load khi rời route. DOM root và click owner được dùng lại, `booted` guard ngăn document/reduced-motion listener bị gắn lặp.
- Build owner `scripts/afk-chest-runtime-v1.mjs` nhúng helper vào campaign runtime. Test syntax + `node --test tests/*.mjs` đạt **28/28 pass, 0 fail** trong checkout hiện có.
- Vercel deployment `dpl_kogrZQR2p2hkbfkHbep4PJjxndtq` từ commit `f675cdb` đạt **READY**, CI `success`; log xác nhận Campaign scene, R04 return context, embedded battle `907780 bytes` và deployment hoàn tất.
- Chrome production đã chuyển Chinh chiến → Tướng → Chinh chiến **20 vòng** bằng thao tác UI; cuối vòng Chinh chiến vẫn hiển thị, `#hvCampaignScene` = 1, `#hvHeroRosterV4` = 1 và Rương treo máy còn hiện. Đây là bằng chứng re-entry/root không nhân bản, chưa phải profiler renderer/listener.
- L04b vẫn **IN_PROGRESS** vì chưa có đo renderer/listener độc lập, fault-inject browser, Safari/device evidence và các gate L04a stale source/draft/modal. Không đổi seed, reward, balance, save migration, asset, battle, audio hay hotfix thoát trận.
- Bước tiếp theo chính xác: hoàn tất gap lifecycle L04a/L04b hoặc tiếp tục L05c từ fixture L05b; không gọi scope contract là acceptance đầy đủ.

## 1.8 L05a — combat observation fixture

- Pure contract `src/domain/combat/action-observation.mjs` dùng schema `hon-viet-combat-observation/v1`, giữ session/seed/mode/round cap, action sequence, snapshot `before`/`after`, typed result, RNG site và known gap.
- Build owner `scripts/combat-domain-3q-adapter-v1.mjs` bundle observer vào `battle.html`, record tại `resolveAction.finally`, đưa report/snapshot vào node ẩn cho QA và chỉ bật bằng query allowlist `qaCombatFixture=l05a`; shell nguồn `index.html` không bị đổi.
- Fixture tự stop trong `endBattle`. Commit code là `d1c10ce00b5c1ad0b8589a9bb650f932bddb231b`; test syntax + toàn bộ test hiện có đạt 31/31. Deployment `dpl_BimpTPBQCkrNkg6JYhVDyUhHqEgZ` đạt READY và CI Vercel success.
- Chrome production với URL `https://luc-than.vercel.app/?qaCombatFixture=l05a` đã bấm Chinh chiến → Khiêu chiến → Xuất chiến, nhận đúng iframe query và ghi report `finished`: 8 hiệp, 51 action, 125 typed result, `impactCount=0`; phe ta 6/6, phe địch 0/3. Kinds gồm stun, damage, guardAll, aoeBurn, aoe, aoeDebuff và execute; results gồm damage, miss, buffAdd, barrier và death.
- RNG site được ghi là `applyDamage.hit`, `applyDamage.variance`, `applyDamage.crit` và các burst presentation sites; giá trị RNG chưa capture. Target selector hiện hành dùng hash deterministic thay vì `Math.random`.
- L05a vẫn **IN_PROGRESS**: chưa có engine evidence riêng cho heal, DoT tick, combo hai nhịp/đuổi đánh với `subActionIndex`, per-impact boundary hoặc trận đủ 15 hiệp; chưa có Safari/device evidence. Ba gap report giữ nguyên `resolve-action-final-snapshot`, `per-impact-boundary-missing` và `rng-value-not-captured`.
- Không đổi combat rule, seed, reward, balance, save migration, asset, audio hoặc hotfix thoát trận. Archive/source mẫu không khả dụng trong phiên này nên không có archive method nào được port; phần observer là contract viết/adapt từ repo hiện tại. Bước tiếp theo là L05b instrument tại `applyDamage/applyHeal/status/energy` rồi thu lại các fixture thiếu.

## 1.9 L05b — capture ranh giới sub-action

- `src/domain/combat/action-observation.mjs` đã mở rộng impact với `amount`, `flags` và `rngCursor`; `scripts/combat-domain-3q-adapter-v1.mjs` giữ context `actionId` qua `performAction`, buffer impact trước action record và gắn `subActionIndex`.
- Commit code là [`fbb6f8137c98fcb25a99d308547cc2768de23a06`](https://github.com/bktimmy247/luc-than/commit/fbb6f8137c98fcb25a99d308547cc2768de23a06). Deployment `dpl_FkVnkvQ6QBRzUf5a6rrazvhuw1YN` đạt **READY**, CI Vercel **success**.
- Chrome production URL [`https://luc-than.vercel.app/?qaCombatFixture=l05a`](https://luc-than.vercel.app/?qaCombatFixture=l05a) đã chạy UI thật Chinh chiến → Khiêu chiến → Xuất chiến. Report `finished`: hiệp 1–7, 51 action, 141 result và 281 impact; 51/51 action có impact, action ID duy nhất, counter khớp, impact có before/after và `subActionIndex` liên tục. Không có console error/warn.
- Impact thực tế: `energy=158`, `damage=71`, `miss=9`, `status=40`, `death=3`. Một Ultimate ghi 19 impact với index `0..18`; đây là bằng chứng context multi-impact ở raw call-boundary, chưa phải semantic event canonical.
- L05b vẫn **IN_PROGRESS**. Ba gap report còn `resolve-action-final-snapshot`, `per-impact-boundary-missing` (direct status removal/DoT tick và actor energy-cost assignment chưa được hook) và `rng-value-not-captured`. Chưa có heal/DoT/two-hit riêng, round cap 15, seeded RNG value, speed/replay parity hoặc Safari/device evidence.
- Archive/source mẫu vẫn `SOURCE_NOT_AVAILABLE`; không có archive method nào được port. Không đổi seed, reward, balance, save migration, asset, audio hoặc hotfix thoát trận. Bước tiếp theo là L05c và các fixture case còn thiếu.
## 1.10 L05c-a — seeded RNG và replay evidence

- Lát cắt này đã triển khai phần seeded RNG có thể kiểm chứng từ source: `src/domain/combat/seeded-rng.mjs` định nghĩa schema `hon-viet-combat-rng/v1`, hai stream độc lập `rule`/`presentation`, cursor, call log và giá trị RNG. Session RNG được cache bằng `WeakMap`, nên không thêm key vào battle object, player save hay migration.
- Source/build owner là `src/domain/combat/*` và `scripts/combat-domain-3q-adapter-v1.mjs`; `battle.html` chỉ nhận sản phẩm build. Adapter thay đúng 13 call-site `Math.random` đã xác định (damage hit/variance/crit, status chance, burst và camera presentation), còn 2 fallback `Math.random` có chủ đích nằm trong bridge. Target selector hiện hành vẫn là hash deterministic. Action/impact/replay giữ thêm `rngCalls`/`rngCursor` dạng optional để không phá shape cũ.
- Không đổi seed config live, reward, balance, save migration, roster, art, audio hoặc hotfix thoát trận. QA fixture dùng seed đã cấp cho run; RNG presentation không làm lệch RNG luật.
- RED→GREEN: test mới ban đầu fail vì thiếu `seeded-rng.mjs`; sau khi viết source, focused suite combat/module/presentation gồm **32/32 pass**. Adapter dry-run, `node --check`, compile 5 inline script body và smoke injected bundle đều pass; full `npm test`/CI chưa chạy trong checkout connector-only.
- Code nằm ở [80a593c4](https://github.com/bktimmy247/luc-than/commit/80a593c4bd843e879eaf64725223d178f5542987) và follow-up [147badb](https://github.com/bktimmy247/luc-than/commit/147badb07db22961f073e89b1145d22fef467c6d). Vercel deployment [`dpl_5ae3g2Ff6kD8gjFDDS6iB3cMQezH`](https://vercel.com/cuong-duc-ai-s-projects/luc-than/5ae3g2Ff6kD8gjFDDS6iB3cMQezH) từ `147badb` đạt **READY**, build chạy `npm run build`, sync embedded battle `936487 bytes`; Vercel commit status success, không có GitHub Actions workflow run, runtime errors 1 giờ gần nhất không có.
- Chrome production đã kiểm tra shell `https://luc-than.vercel.app/?qaCombatFixture=l05a`: roster vẫn 12/12 và route Chinh chiến đúng; không bấm launch từ shell để không tiêu thể lực người chơi. Fixture cô lập được chạy bằng URL [`battle.html?embedded=1&session=l05c-qa-fixed&v=3173&qaCombatFixture=l05a`](https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-qa-fixed&v=3173&qaCombatFixture=l05a), có visual check battle viewport, HP bar, damage/critical popup và Hồn Việt branding.
- Run production fixture đã kết thúc: **28 action, 81 result, 180 impact, 4.712 RNG call, 4.712 captured call, 122 captured rule call**, `status=finished`; result types gồm `barrier`, `buffAdd`, `damage`, `death`, `heal`, `miss`. Report chỉ còn `resolve-action-final-snapshot` và `per-impact-boundary-missing`; chưa có RNG coverage gap.
- Run thứ hai cùng seed đang ghi nhận **12 action, 28 result, 90 impact, 2.505 RNG call, 75 captured rule call**. Prefix rule trace của hai run trùng nhau ở hai action đầu, cursor `0..5` và các value hit/variance/crit tương ứng; đây là parity prefix, chưa phải full replay acceptance.
- Trạng thái lát cắt: **REVIEW**; L05b/L05 tổng thể vẫn **IN_PROGRESS**. Còn mở: direct status removal/DoT tick/energy-cost boundary, heal và combo two-hit/đuổi đánh, round cap 15, full speed/replay parity, Safari/iPhone/iPad/device QA. Archive/source mẫu vẫn `SOURCE_NOT_AVAILABLE`; ticket board không có trong repo hiện tại (`TICKET_BOARD_NOT_AVAILABLE`).
- Bước kế tiếp chính xác: L05c-b thêm fixture/hook trực tiếp cho status/DoT/energy và heal/two-hit, sau đó chạy round-15 + full replay parity; chỉ khi có evidence riêng mới chuyển sang device QA.

## 1.11 L05c-b — direct combat boundary evidence

- Code/build commit: [005dc3a](https://github.com/bktimmy247/luc-than/commit/005dc3a09661589ff7b96b6b7402212b1a26581e). Source owner là `src/domain/combat/action-observation.mjs`; build owner là `scripts/combat-domain-3q-adapter-v1.mjs`; test mới là `tests/combat-l05c-boundary.test.mjs`. Không sửa dist làm source chính.
- RED→GREEN: test L05c-b fail 2/2 trước implementation; sau patch focused combat suite đạt **34/34 pass, 0 fail**. `node --check`, adapter dry-run, 5 inline-script compile và fallback `Math.random` count 2 đều pass. Full `npm test`/CI chưa chạy được trong connector-only checkout, không claim là đã chạy.
- Adapter đã ghi boundary before/after cho action-cost, tick status/DoT/heal/control/expired và bổ sung `effectPhase`/status metadata cho các wrapper impact hiện có. Report mới có `directBoundaryCount`, `directBoundaryTypes`, `impactBoundaryCoverage`, `multiImpactActionCount`, `multiHitActionCount`; hai gap cũ vẫn giữ nguyên để không tự đóng acceptance.
- Production deployment [dpl_8JxKw4my7swxv4Yn6Not7w6bmRod](https://vercel.com/cuong-duc-ai-s-projects/luc-than/8JxKw4my7swxv4Yn6Not7w6bmRod) từ `005dc3a` là **READY**, target production, alias [luc-than.vercel.app](https://luc-than.vercel.app/). Build log chạy `npm run build`, payload embedded **940941 bytes**; runtime error scan Vercel 1 giờ không có lỗi.
- Chrome production fixture đã chạy bằng UI thật (bấm `Xuất chiến`, bật `Tự động chiến đấu`) và kết thúc `finished`: **28 action, 81 result, 219 impact, 4.712 RNG call, 122 captured rule call**. Coverage: `addStatus=20`, `applyDamage=43`, `applyHeal=6`, `gainEnergy=105`, `markDefeated=6`, `performAction.action-cost=28`, `tickStatuses=11`; 5 action có ít nhất 2 hit. Đã thấy DoT `burn`, heal `regen`, 6 direct `applyHeal` (có amount dương) và ultimate trừ đúng 60 Nộ ở boundary.
- Run production thứ hai cùng seed còn `open`, nhưng prefix hai action đầu có `prefixEqual=true` với cursor/value rule giống nhau; đây là replay-prefix evidence, chưa phải full replay parity. Chưa chạy round cap 15 hoặc Safari/iPhone/iPad/device QA.
- Browser log chỉ có diagnostic metadata của extension Chrome; không có app runtime error. Archive/source mẫu vẫn `SOURCE_NOT_AVAILABLE`; Ticket Board/lease vẫn `TICKET_BOARD_NOT_AVAILABLE`.
- Trạng thái lát cắt: **REVIEW**, L05b/L05 tổng thể **IN_PROGRESS**. Bước kế tiếp: fixture round-15 + full replay/speed parity; sau đó mới mở device QA.

## 2. Bản đồ code: sửa đúng nguồn tạo ra sản phẩm

| Thành phần | Nguồn cần đọc/sửa | Vai trò |
|---|---|---|
| Shell game | `index.html` | Router, player state, màn tướng, đội hình, tạo iframe giao đấu |
| Engine giao đấu | `battle.html` | Combat, Canvas, animation và thời điểm hành động |
| Combat observer | `src/domain/combat/action-observation.mjs` | Pure schema/recorder cho before-after, typed result, RNG site và gap report |
| Combat fixture build | `scripts/combat-domain-3q-adapter-v1.mjs` | Bundle observer, QA query allowlist và capture action/sub-action tại build owner, tự stop ở endBattle |
| Combat fixture test | `tests/combat-observation.test.mjs` | Behavior/immutability/build-owner checks cho L05a/L05b |
| Build | `scripts/build-static.mjs` | Copy nguồn rồi chạy các patch theo thứ tự; đầu ra là `dist/` |
| Danh sách tướng | `src/ui/hero-roster-runtime.js` | Đọc state, lọc, sort, điều hướng và giữ vị trí cuộn |
| CSS danh sách | `scripts/hero-roster-phase-a-v4.mjs` | Chèn runtime + CSS vào index sau build |
| Dữ liệu thẻ tướng | `src/domain/hero/roster-view.mjs` | Chỉ lấy danh sách tướng chính thức và dữ liệu player hiện tại |
| Chi tiết tướng | `src/ui/hero-detail-tabs.js`, `src/ui/hero-detail-tabs.css` | Các tab dùng chung canvas Idle đang chạy |
| Hợp đồng Idle | `src/domain/character/luc-anh-idle.mjs` | File, grid, số frame, nguồn và crop cố định |
| Hình học Basic | `src/domain/character/luc-anh-spatial.mjs` | Tỷ lệ và baseline đo từ atlas thực tế |
| Áp dụng hình học | `scripts/luc-anh-spatial-pipeline-v1.mjs` | Sinh map kích thước/baseline riêng cho từng động tác |
| Bản vá alpha cũ | `scripts/m0-p0-runtime-repair-v1.mjs` | Chốt đúng nguồn RGBA, renderer, nền và luồng nút kết quả |
| Bản vá lần này | `scripts/runtime-mobile-render-sfx-v1.mjs` | Nối SFX, ổn định canvas/camera và bỏ chuyển động phụ của Lục Ảnh |
| Bus âm thanh | `src/ui/audio-sfx-runtime.js` | Unlock, preload/decode, phát, mute và giới hạn âm đồng thời |
| SFX nguồn | `assets/audio/sfx/sources.json` | Tên file gốc trong ZIP, codec và hash để đối chiếu |
| Kiểm tra khung hẹp | `qa-runtime.html` | Iframe 390×844, 430×932 và 1280×900; không giả lập Safari |
| Regression mới | `tests/mobile-render-sfx.test.mjs` | Pixel, audio, bố cục và mã sau build |
| Campaign/chuẩn bị | `src/ui/campaign-scene.js`, `src/domain/campaign/campaign-view.mjs` | AFK scene, draft sáu slot, gọi transaction/startChapter hiện có |
| Scene lifetime | `src/ui/scene-lifetime.js` | Scope activation, dispose idempotent và guard callback/tài nguyên stale |
| AFK domain | `src/domain/afk/afk-chest.mjs` | Thời gian/rate/claim/cap 15 giờ |
| Transaction/audit | `scripts/transaction-contract-v1.mjs`, `src/domain/transaction/receipt-contract.mjs`, `src/domain/transaction/command-audit.mjs`, `scripts/audit-transaction-commands-v1.mjs` | Owner commit/rollback/receipt; L03a inventory và source audit; caller migration còn mở |
| Result/navigation | `scripts/settlement-navigation-v1.mjs` | Kiểm bridge/session, settle và navigate một lần |
| Return context contract | `src/domain/navigation/return-context.mjs` | Pure capture/validate/resolve route context, không ghi player save |
| Return context build | `scripts/return-context-v1.mjs` | Patch `navTo`, `showScreen`, `renderHeroDetail` ở build owner và quản lý session context |
| Hotfix audio close | `scripts/battle-audio-lifecycle-v1.mjs` | Cancel parent SFX/voice/result và dispose child trước about:blank |
| Audio hồi quy | `tests/battle-audio-lifecycle.test.mjs` | 9 ca active/pending/voice/HTML fallback/stale iframe/result/close ordering |


**Không sửa trực tiếp `dist/` để làm bản sửa chính.** Vercel chạy build và sẽ ghi đè. Theo dấu từ file trong `dist` về script tạo nó. Chỉ thêm/chỉnh patch ở đúng giai đoạn; đừng sửa nhiều patch cũ cùng lúc bằng tìm-thay toàn cục.

## 3. Quy trình làm một lỗi, dành cho model ít context

1. Ghi lại câu người dùng báo, màn hình, thiết bị và bước tái hiện. Không tự đổi sang một tính năng khác.
2. Đọc trạng thái Git/commit hiện tại, thay đổi đang có và hướng dẫn dự án. Không ghi đè việc của người khác.
3. Đọc nguồn liên quan trong bảng trên. Tìm bằng `rg`, hạn chế đọc tràn toàn bộ hai HTML lớn.
4. Nêu một giả thuyết cụ thể và cách kiểm tra: ví dụ chiều cao cơ thể khác nhau hay cả atlas bị scale khác nhau.
5. Đo/kiểm tra trước khi sửa. Tách **quan sát được**, **suy luận**, **chưa xác minh**.
6. Làm một bản sửa nhỏ; được port code mẫu theo guide, ghi nguồn/dependency/khác biệt và nối vào owner hiện có. Giữ renderer, router, scheduler đang hoạt động. Build phải báo lỗi nếu không tìm thấy vị trí patch mong đợi.
7. Chạy `npm test`, đọc kết quả thực sự. Test đã bao gồm build. Không chỉ đọc dòng “build successful”.
8. Kiểm tra bằng UI thật: vào màn, thao tác, quay lại, lặp lần hai. Không gọi trực tiếp hàm nội bộ để thay cho thử thao tác người dùng.
9. Commit/push đúng repository và nhánh đã được người dùng cho phép; kiểm tra Vercel và chính URL production.
10. Báo ngắn gọn: sửa gì, commit nào, đã thử gì, còn giới hạn gì. Cập nhật tiến độ nếu công việc lâu; không nói “xong” khi mới viết code.

## 4. Tạo asset nhân vật: đầu vào đến đầu ra

### 4.1 Chọn đúng nguồn

- File ZIP/RAR là đầu vào, không phải asset tải trực tiếp trong game. Tự giải nén bằng công cụ có sẵn; không bắt người dùng giải nén hộ khi có thể tự làm.
- Kiểm tra số frame, thứ tự tên, kích thước, FPS/thời lượng, alpha channel và một số frame đầu/giữa/cuối.
- Lục Ảnh có hai nguồn khác nhau: `IDLE.rar` cũ là RGB trên nền đen; `IDLE(2).rar` mới là RGBA. Không chọn chỉ vì tên gần giống hoặc file nhỏ hơn.
- Nguồn đúng của Idle hiện tại: **96 PNG RGBA, 1510×1004**, từ `IDLE(2).rar`.
- Alpha trong suốt và RGB màu đen là hai chuyện khác nhau. Áo/tóc/khói đen có thể là chi tiết thật. Không xóa mọi pixel tối để “hút nền”.
- Nguồn có alpha rất thấp vẫn có thể thấy vệt mờ trên nền sáng. Cần đối chiếu frame gốc trước khi kết luận runtime làm bẩn ảnh.

### 4.2 Quy tắc crop, tỷ lệ và chân

Phương án an toàn đang dùng là một crop cố định cho toàn chuỗi:

```
crop: left=230, top=7, width=976, height=976
output cell: 480×480
grid: 8 cột × 12 hàng = 96 frame
atlas: 3840×5760
frame duration: 42 ms
```

Crop sát từng frame vẫn làm được nhưng bắt buộc lưu và dùng offset:

```
drawX = anchorX + (trimX - pivotX) * scale
drawY = anchorY + (trimY - pivotY) * scale
drawW = trimWidth  * scale
drawH = trimHeight * scale
```

`pivotX/pivotY` phải ở hệ tọa độ canvas nguồn chung. `trimX/trimY` là vị trí phần bị cắt trên canvas đó. `scale` là một hệ số chung cho X/Y. Nếu atlas có xoay frame khi đóng gói, renderer phải đọc rotation; nếu chưa hỗ trợ thì tắt rotate lúc pack.

**Tuyệt đối không làm:** crop từng frame rồi kéo mỗi phần crop vào cùng một ô hiển thị; căn giữa lại từng bbox; lấy mép dưới bbox của từng frame làm chân mới. Các cách đó làm nhân vật co giãn, rung chân hoặc nhảy vị trí. Không sửa mất rung bằng cách xóa frame hay đổi FPS tùy ý.

### 4.3 Pack và kiểm chứng

- Script: `scripts/pack-luc-anh-idle-rgba.mjs`.
- Chỉ nhận đúng 0001.png…0096.png, đúng kích thước và RGBA. Thiếu frame/RGB thì báo lỗi.
- Dùng crop cố định, resize có xử lý alpha rồi đóng WebP lossless. Không flatten lên nền, không threshold alpha, không đổi màu viền.
- Decode lại đầu ra: alpha phải khớp; RGB của pixel có alpha > 0 phải khớp. RGB của pixel alpha=0 không có ý nghĩa hiển thị.
- Giữ hash nguồn, hash đầu ra, kích thước và số frame trong manifest.
- File tải nhỏ không đồng nghĩa ít RAM/VRAM: atlas 3840×5760 RGBA giải mã khoảng 84,4 MiB trước overhead. Không preload mọi animation chỉ để hiện một thẻ tướng.
- Atlas Idle RGBA hiện tại là **21.682.860 byte**. Con số “177 MB còn hơn 5 MB” của bản trước không được dùng để mô tả file hiện tại. Lossless không có tỷ lệ nén cố định cho mọi nguồn.

### 4.4 Lưu và build asset lớn

Repository lưu Idle dưới hai phần ở `asset-sources/luc-anh/`. `scripts/luc-anh-idle-asset.mjs` ghép và kiểm tra SHA-256 trước build. Không đưa một file part riêng lẻ vào đường dẫn ảnh runtime.

Hash atlas chuẩn:

```
9fc7ba71a302b232068b3ac54c2c9c0e72e5cd183cd1c04fcfeae42e12a0fa8a
```

Khi thay asset, dùng tên/version mới hoặc đổi URL. `/assets/` đang được cache `immutable` một năm; ghi đè nội dung nhưng giữ URL có thể khiến máy người dùng chạy ảnh cũ với metadata mới.

## 5. Vì sao Basic nhỏ và cách đã sửa

Kích thước ô atlas không phải kích thước người. Đo frame đầu với alpha ≥128:

| Đại lượng | Idle | Basic trước sửa |
|---|---:|---:|
| Ô atlas | 480 | 240 |
| Cao cơ thể có alpha | 398 px | 148 px |
| Mép dưới cơ thể trong ô | 427 | 190 |
| Kích thước ô khi vẽ | 330 | 372 |
| Cao cơ thể khi vẽ | 273,625 | 229,4 |
| Baseline cũ | 48 | 54 |

Basic trước sửa nhỏ khoảng 16%, đồng thời chân lệch lên khoảng 35 đơn vị world. Công thức đang dùng:

```
targetBodyHeight = idleDisplay * idleBodyHeight / idleCell
targetFootY = idleBaseline - idleDisplay * (1 - idleFootY / idleCell)
basicDisplay = targetBodyHeight * basicCell / basicBodyHeight
basicBaseline = targetFootY + basicDisplay * (1 - basicFootY / basicCell)
```

Kết quả: Basic vẽ **443,716216×443,716216**, baseline **104,003378**. Đây là hiệu chỉnh cố định cho cả động tác, không đo lại từng frame khi game chạy. Không dùng hệ số này cho Skill 1/Ultimate vì chúng có crop khác; muốn sửa động tác nào thì đo động tác đó.

Bản sửa còn bỏ `idleBob` và xoay nghiêng giả lập ngoài atlas cho Lục Ảnh. Chuyển động đã có trong frame thì không thêm một lớp thở/nghiêng thứ hai.

## 6. Danh sách tướng trống trên điện thoại

Quan sát: ảnh lỗi vẫn hiện header và tab, phần dưới trống. Chrome trước sửa vẫn thấy thẻ; chưa tái hiện trên Safari thật.

Rủi ro thấy trong code: roster `position:fixed` nằm trong screen cũ có pseudo-element và CSS cụ thể hơn; thêm sticky/overflow/fixed lồng nhau dễ tạo vấn đề bố cục hoặc lớp vẽ.

Cách sửa:

- `#hvHeroRosterV4` là portal trực tiếp dưới `body`, ngoài lớp screen cũ.
- Router hiện có vẫn quản lý `root.hidden`. Không tạo router riêng, không dùng MutationObserver để dò text rồi dựng lại thẻ.
- Root chia ba hàng: header / `minmax(0,1fr)` danh sách / dock.
- Chỉ `.v4-grid` cuộn; có `min-height:0`. Header và dock là hàng bình thường, không sticky/fixed lồng nhau.
- Giữ filter, sort, tướng đang chọn và scroll khi vào chi tiết rồi quay lại.
- Chi tiết tướng giữ lại canvas Idle khi đổi tab/nâng cấp, tránh tạo lại animation mỗi thao tác.

Kiểm tra bắt buộc: mở Tướng; thấy đủ thẻ theo bộ lọc; lọc một hệ; mở Lục Ảnh; quay lại; trở về Thành Chính; mở Tướng lần hai; thử cuộn và đổi chiều màn hình.

## 7. PC nháy màn giao đấu

Trong code cũ, mỗi impact tạo flash cả màn hình, camera shake và zoom. Canvas nằm trong flex layout còn có thể góp kích thước nội tại khi resize.

Cách sửa:

- Canvas đặt absolute trong viewport đã có kích thước; không để kích thước canvas tác động ngược lại chiều cao viewport.
- Mỗi frame vẽ nền opaque trên toàn backing store với transform identity, rồi đặt transform world và vẽ nền/nhân vật cùng frame.
- Bỏ `clearRect` theo tọa độ world vốn có thể để phần rìa trong suốt.
- Trong layout `reference-simple`, đặt flash/shake/zoom về 0 trước khi render. Vẫn giữ VFX tại mục tiêu và số sát thương.

Kiểm tra trong trận đang đánh, không chỉ màn Victory đứng yên: kích thước backing canvas không dao động; nhân vật còn chuyển động; camera flash luôn 0 ở chế độ này; đổi kích thước cửa sổ vẫn vẽ đủ nền. Nếu vẫn nháy, thu tiếp evidence về mất context/ảnh chưa decode/RAM; đừng khẳng định nguyên nhân chỉ từ một screenshot.

## 8. SFX: file đã có nhưng runtime phải phát đúng lúc

**Cập nhật 07/09 — đã sửa lỗi âm trận còn chạy khi thoát:** `src/ui/audio-sfx-runtime.js` cấp `createBattleChannel` theo session, `endBattle`/`dispose` vô hiệu callback cũ. Patch `battle-audio-lifecycle-v1.mjs` nối đúng `closeOverlay` để dừng âm cha và âm HTML trong child trước blank iframe. Voice WebAudio/HTML fallback được theo dõi trong `ios-audio-unlock-patch.mjs`; result music hủy pending unlock và kiểm live session/source/origin. Guaranteed ultimate fallback cũng kiểm session còn active. Không thay bằng `stopCombat` đơn lẻ rồi cho callback cũ bật lại combat.

Pagehide của iframe cũ không được tắt trận mới; không suspend AudioContext chung làm mất tiếng UI/hồ sơ. Diagnostics bổ sung trên DOM: `data-sfx-active`, `data-sfx-combat-enabled`, `data-sfx-battle-active`, `data-voice-combat-active`; chúng là theo dõi nguồn phát, không chứng minh loa phát trên iPhone. Chạy L01 để khép gate thiết bị.

Hai gói nguồn: `SFX-UI-ALL-2026-09-01.zip` và `SFX-COMBAT-ALL-2026-09-01.zip`. Dùng `scripts/import-supplied-sfx.py <thư-mục-chứa-hai-zip>` để khôi phục bộ đang dùng. Không tải lại hay chuyển đổi tất cả 332 âm để sửa một hook.

| Event | File runtime | Nơi gọi |
|---|---|---|
| Bấm nút | `se_button_click.mp3` | Một listener click |
| Chọn | `se_icon_click.wav` | Điều khiển lựa chọn |
| Basic cast | `201800_se_atk.wav` | `playActionSound` |
| Skill cast | `201800_se_s1.wav` | `playActionSound` |
| Ultimate cast | `201800_se_s2.wav` | `playActionSound`, gồm nhánh riêng Lục Ảnh |
| Impact | `400500_se_s1_beaten.wav` | `applyDamage`, ở thời điểm trúng đòn |
| Hồi phục | `se_gift.mp3` | `applyHeal`, mặc định tạm theo event |
| Thắng | `se_battlewin.mp3` | Kết quả trận |
| Thua | `se_battlelose.mp3` | Kết quả trận |

**Đây là mapping event mặc định dùng chung, chưa phải mapping SFX riêng được duyệt cho từng tướng.** Không được nói ID 201800 là Lục Ảnh chỉ dựa trên tên file. Muốn cá nhân hóa cần bảng mapping nghệ thuật/tướng được xác nhận.

Một số file trong ZIP có đuôi WAV nhưng bytes là MP3. Script nhận diện header và đổi đuôi sang `.mp3`; giữ nguyên bytes và hash, không encode lại. Tổng 9 âm khoảng 978.638 byte.

Audio bus dùng AudioContext của trang cha đã unlock bằng thao tác thật, iframe dùng lại bus đó. Không chỉ gọi `new Audio().play()` lúc auto-battle rồi nuốt lỗi autoplay. Không ghi trạng thái “unlocked” nếu context thực tế vẫn suspended.

- Cache buffer đã decode, không decode lại mỗi lần đánh.
- Impact AOE gộp trong 120 ms; giới hạn 6 âm đồng thời để tránh cộng âm quá lớn.
- Mute dừng âm combat và hủy lệnh còn đang chờ decode. Không phát dồn âm cũ sau khi mở khóa.
- Không phát cả beep giả lập lẫn file thật cho cùng một event; cast không phát lần hai ở projectile release.
- DOM diagnostics: `data-sfx-state`, `data-sfx-loaded`, `data-sfx-played`, `data-sfx-last`, `data-sfx-error` trên documentElement của bus owner.
- `played` nghĩa là AudioBufferSource đã được start, không chứng minh người dùng nghe thấy loa. Kiểm tra nút âm, âm lượng, tab và iPhone thật khi cần.

## 9. Build, test và deploy không để hai engine khác nhau

```
npm install --ignore-scripts --no-audit --no-fund
npm test
```

`npm test` tự build rồi chạy test tuần tự vì các bài đọc atlas lớn có thể vượt RAM nếu chạy đồng thời. Không giảm chất lượng asset để làm test qua.

Cuối build, `BATTLE_HTML_BASE64` trong `dist/index.html` được đồng bộ với `dist/battle.html`. **So byte hai đầu ra sau tất cả patch**, không so bản template trước build rồi kết luận iframe production đúng. Sai bước này có thể làm trang xem thử và trận tích hợp dùng hai engine khác nhau.

Luồng Git bình thường: xem diff → commit → push nhánh được ủy quyền → chờ Vercel thành công → mở production và kiểm tra mã/asset mới. Không force push. Giữ các phần asset lớn và file nguồn cần ghép trong commit.

Nếu môi trường chỉ có GitHub connector, không có Git credential local:

1. Đọc `main` và `tree SHA` mới nhất.
2. Tạo blob cho đúng file thay đổi; file nhị phân dùng base64 và đối chiếu Git blob SHA.
3. Tạo tree trên **base tree hiện tại**, không dựng lại toàn repository từ bản scratch thiếu file.
4. Tạo commit có parent là main đã đọc. Kiểm tra main không thay đổi rồi update ref không force.
5. Kiểm tra status Vercel của commit và URL production. Nếu có người push xen vào, lấy main mới và áp lại thay đổi; không ghi đè lịch sử.

Tài liệu không cấp quyền mới để deploy, gửi tin, đổi cấu hình bảo vệ hay thay credential. Làm theo quyền đã có trong cuộc trò chuyện và công cụ đang kết nối.

## 10. Checklist bàn giao một bản sửa

- [ ] File nguồn và patch đúng; không chỉ thay `dist`.
- [ ] Không đổi màu/alpha hoặc scale X/Y khác nhau.
- [ ] Đúng số frame, đúng file/version, đúng grid và baseline.
- [ ] Mở tướng → chi tiết → quay lại → mở lần hai hoạt động.
- [ ] PC chạy ít nhất một trận; khung hình ổn định qua Basic/skill/impact.
- [ ] SFX tải/decode/start thực tế, không chỉ tồn tại trong thư mục.
- [ ] `npm test` đạt; bản embedded bằng byte bản standalone.
- [ ] Commit đã có trên GitHub; Vercel báo thành công và production dùng mã mới.
- [ ] Ghi rõ kiểm tra Safari thật đã làm hay chưa; không gọi iframe Chrome là iPhone.
- [ ] Ghi lại phần còn thiếu, đặc biệt mapping SFX riêng từng tướng.

## 11. Những cách đã gây lỗi: không lặp lại

- Chọn nhầm nguồn RGB nền đen rồi key mất chi tiết tối.
- Crop mỗi frame, bỏ offset/pivot rồi kéo đầy ô: nhân vật rung/co giãn.
- Dùng cùng chiều cao ô cho Idle mới và Basic cũ mà không đo cơ thể.
- Đổi metadata nhưng để trình duyệt cache ảnh cũ ở URL immutable.
- Tạo nhiều bộ điều khiển click/pointer/touch cho một nút quay lại hoặc Victory.
- Sửa CSS bằng thêm lớp fixed/sticky lên một screen đã bị đè.
- Có file SFX nhưng chỉ gọi oscillator beep; manifest audio vẫn null.
- Giữ flash cả màn hình cho từng cú đánh rồi nhầm thành “nâng chất lượng hiệu ứng”.
- Chỉ build hoặc sửa bản xem thử rồi báo production đã xong.

## 12. Lịch sử kiểm chứng production — bản sửa 05/09

Commit code: `641658e544511d40ad15ad5e5472e826079f194c`. GitHub báo Vercel **success**; trang `qa-runtime.html` mới đã trả HTTP 200. Những mục dưới đây là quan sát thực tế sau deploy, không phải checklist dự định:

- Chrome, iframe 390×844: đủ 12 thẻ tướng, có Lục Ảnh; nhìn thấy cả bộ lọc và dock. Mở chi tiết Lục Ảnh thấy nhân vật đầy đủ và đúng tỷ lệ.
- Lọc Hệ Mộng → mở Lục Ảnh → Quay lại: trở về đúng hai thẻ Thầy Mo/Lục Ảnh và giữ bộ lọc. Đổi khung 430×932 → Thành Chính → Tướng: mở lại được.
- Lưu đội có Lục Ảnh bằng UI, chạy Chinh chiến ở khung PC 1280×900. 24 mẫu DOM trong khoảng quan sát: canvas giữ 1280×828 khi giao đấu, flash luôn `0.000`, có trạng thái attack/hurt/ultimate. Khi chuyển sang Victory, canvas đổi một lần sang cao 900 theo layout kết quả; đây không phải dao động chiều cao trong trận.
- Đã thấy nhánh Ultimate của Lục Ảnh chạy trong mẫu live. **Chưa có ảnh chụp riêng đúng thời điểm Basic trên browser**; kết luận sửa tỷ lệ Basic dựa trên test pixel atlas thật và metadata renderer đã build, không giả nhận là đã đối chiếu screenshot Basic trên iPhone.
- Cả 9 URL SFX trả HTTP 200, đúng MIME, đúng hash nguồn. Chrome giải mã 9/9; AudioContext `running`, bộ đếm ghi 46 lần source start và event cuối `victory`, không có `data-sfx-error`. Không dùng các bộ đếm này để khẳng định loa trên iPhone đã phát âm.
- Nút `Ải sau` chuyển sang thông báo hoàn thành nhiệm vụ 1/2 và mở nhiệm vụ kế tiếp. Không ghi nhận việc nút bị chặn trong lần kiểm tra đó.
- Safari/iPhone thật: **chưa kiểm tra**. Cần người dùng xác nhận trên thiết bị từng gặp lỗi.

**Ghi chú cập nhật 07/09:** các phát hiện MVP/Đình Lôi trong đoạn lịch sử sau đã có các patch tiếp theo, gồm PR #16 và golden runtime. Chỉ dùng để truy lỗi; xem progress mới nhất trước khi nhận việc.

Phát hiện ngoài bốn lỗi đang sửa: phần ảnh MVP Ông Phở trên màn Victory có lúc hiện ô placeholder thay cho ảnh nhân vật; một ảnh chụp trận PC còn thấy frame của Đình Lôi bị cắt phần đầu. Hai renderer này không được chỉnh tỷ lệ trong bản vá lần này. Ghi làm việc tiếp theo, kiểm tra grid/source của chính nhân vật trước khi sửa; đừng ghi “toàn bộ màn Victory/nhân vật đã đạt” dựa trên việc nút Ải sau bấm được. SFX riêng từng tướng cũng chưa được duyệt mapping; hiện là bộ event dùng chung như bảng ở mục 8.



## L05c-c — round cap 15 và full replay/speed parity (2026-09-07)

**Trạng thái:** `REVIEW`; L05/L05c vẫn `IN_PROGRESS`. Lát cắt này đã chạy đủ code → build → production browser evidence nhưng chưa đóng checklist.

### Source/build owner

- Code đi qua source owner `src/domain/combat/action-observation.mjs`, build-owner adapter `scripts/combat-domain-3q-adapter-v1.mjs` và regression `tests/combat-l05c-parity.test.mjs`; không sửa dist-only.
- Commit feature `408864ac` thêm parity projection/digest, completion metadata và QA round-cap fixture.
- Commit hotfix `c74d37a` giữ terminal win/loss bình thường trước cap; commit hiện hành `369f545` thêm sentinel QA-only để fixture sống đến hết hiệp 15. Nhánh live/default vẫn gọi battle-end logic nguyên bản.
- Không đổi seed live/fixture (`l05a-production-seed`), reward, balance, roster, save migration, mỹ thuật hoặc audio.

### Verification

| Gate | Evidence | Kết quả |
| --- | --- | --- |
| Focused regression | 10 suite files, Node test runner | `37/37 PASS` |
| Source/build-owner syntax | `node --check scripts/combat-domain-3q-adapter-v1.mjs` | PASS |
| Inline build payload | 5 inline scripts compile, 2 expected `Math.random()` fallbacks, round-cap/parity/sentinel markers | PASS |
| Vercel build | `dpl_CHELjrknWnR353JPiVLK9Zs8SPn8`, commit `369f545`, `npm run build` → `node scripts/build-static.mjs` | `READY`; embedded payload `948770` bytes |
| Production runtime | Vercel runtime errors, last 1h | No runtime errors found |

### Production browser evidence

- Round-cap URL: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-c-cap&v=3173&qaCombatFixture=l05c-round-cap`.
- Real UI actions: mở trận bằng `Xuất chiến`, auto-battle bật, đổi speed bằng control thật lên `3×`; visible result là `KHẢI HOÀN`, `Lượt 15`.
- Report: `finished`, `93 action`, `228 result`, `644 impact`, `roundMax=15`, `maxObservedRound=15`, `roundsBeyondCap=0`, `roundCapReached=true`, completion `player / round-limit-hp / round 15 / roundMax 15 / speed 3`, fingerprint `a1458659`.
- Replay parity 1×: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-c-speed1&v=3173&qaCombatFixture=l05a` → `finished`, `28/81/219`, round 4, `speed=1`, fingerprint `0757b35e`.
- Replay parity 2×: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-c-speed2b&v=3173&qaCombatFixture=l05a` → `finished`, `28/81/219`, round 4, `speed=2`, fingerprint `0757b35e`.
- Final parity check: same seed, same full-replay-rule-outcome fingerprint, same action/result/impact counts; session ID and timing are excluded by schema `hon-viet-combat-replay-parity/v1`. Browser app error list was empty; only the browser extension metadata diagnostic appeared.

### Remaining boundary/blockers

- Existing observer gaps remain open: final `resolveAction` snapshot and per-impact before/after boundary.
- `npm test`/full CI was not run in the connector-only local harness; Vercel build did run. No lint/typecheck script is declared.
- Safari/iPhone/iPad device QA chưa chạy; đó là bước tiếp theo.
- Archive mẫu: `SOURCE_NOT_AVAILABLE`. Ticket Board/connector: `TICKET_BOARD_NOT_AVAILABLE`.

### Next handoff

Run device QA on the deployed alias for the same cap/parity evidence, then reassess whether to close L05c or continue the two observer gaps. Keep status `REVIEW` until those gates have evidence.

## L05c-d — explicit final action snapshot evidence (2026-09-07)

**Trạng thái:** `REVIEW`; L05/L05c vẫn `IN_PROGRESS`. Lát cắt này đóng gap final-action snapshot ở observer contract, nhưng không đóng per-impact/device/ticket checklist.

### Source/build owner

- Commit checkpoint `ef521bdf` → feature `eab4a45f14f82cad4875eb26cde7dba6b2e5b2d1`; main được fast-forward, không force-push.
- Sửa source owner `src/domain/combat/action-observation.mjs`: action có thêm `finalSnapshot` và `finalSnapshotBoundary`; parity projection đưa final snapshot vào digest; report chỉ bỏ gap `resolve-action-final-snapshot` khi mọi action đều capture.
- Sửa build owner `scripts/combat-domain-3q-adapter-v1.mjs`: `resolveAction` truyền snapshot cuối action với boundary `resolveAction.complete` vào fixture. `after`/`resolveAction.finally` vẫn giữ nguyên để không phá consumer cũ.
- Test thêm boundary complete/missing, coverage count và parity drift; không đổi seed, reward, balance, roster, save migration, asset, audio hoặc live/default combat.

### TDD and verification

- RED replay trên baseline chưa có contract: `node --test tests/combat-l05c-boundary.test.mjs` → `3 failed`, thiếu `finalSnapshotCoverage` và build-owner marker, exit code 1.
- GREEN: cùng focused test → `3/3 PASS`, exit code 0.
- REFACTOR regression: 10 combat suite files → `39/39 PASS`, exit code 0; `node --check` cho observer/adapter pass; inline observer compile và round-cap/parity markers pass.
- Local `npm test`/`npm run build` không chạy được vì source harness không có `package.json`; đây là blocker môi trường, không phải kết quả pass giả.

### Production deployment

- Vercel deployment `dpl_DZtRfRZGyWeDUnhxtQcVjn2GZAnZ` từ commit `eab4a45` đạt `READY`; alias `https://luc-than.vercel.app/`.
- Build log xác nhận clone đúng commit, chạy `npm run build` → `node scripts/build-static.mjs`, embedded battle `950131 bytes`, deploy completed.
- Runtime error query 1 giờ: không có runtime errors.

### Production Chrome evidence

- URL 1×: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05d-final-speed1&v=3174&qaCombatFixture=l05a` → real `Xuất chiến`, finished, `28 action / 81 result / 219 impact`, `finalSnapshotCoverage {captured:28, expected:28, complete:true}`, boundary `resolveAction.complete`, completion `player / enemy-wiped / round 4 / speed 1`, fingerprint `282374be`.
- URL 2×: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05d-final-speed2&v=3174&qaCombatFixture=l05a` → real `Xuất chiến`, đổi tốc độ sau khi bắt đầu lên `2×`, finished, cùng `28 / 81 / 219`, cùng `finalSnapshotCoverage 28/28`, completion `player / enemy-wiped / round 4 / speed 2`, fingerprint `282374be`.
- Cả hai report chỉ còn `per-impact-boundary-missing`; final-action gap đã đóng thật trên production. App log lọc theo URL không có lỗi. Diagnostic của browser extension được loại khỏi app evidence.

### Blockers and handoff

- Per-impact before/after boundary vẫn mở; đây là gap tiếp theo.
- Safari/iPhone/iPad/device backend chưa có; Chrome hiện chỉ là desktop browser, không ghi device PASS thay cho thiết bị thật.
- `game-dev` CLI của Game Development Studio không tồn tại trong môi trường (`command not found`), không tự cài/thay credential.
- Ticket Board: `TICKET_BOARD_NOT_AVAILABLE`; archive mẫu: `SOURCE_NOT_AVAILABLE`.
- Bước tiếp theo: khi có device backend, chạy lại cap/parity trên Chrome responsive + Safari/iPhone/iPad; sau đó mới quyết định lát cắt per-impact. Giữ `REVIEW`, không đánh dấu DONE.

## L05c-e — per-impact boundary evidence (2026-09-07)

**Trạng thái:** `REVIEW`; L05/L05b vẫn `IN_PROGRESS`. Lát cắt này đóng gap `per-impact-boundary-missing` cho các fixture có đủ evidence; không tự chuyển ticket sang `DONE`.

### Source/build owner

- Checkpoint `523ff30c341ba5663924e83812d5f8adedad2083` → feature `efab46434a36c805e6f0c5fe284c0827132d7ea2`; `main` được fast-forward, không force-push.
- Sửa source owner `src/domain/combat/action-observation.mjs`: mỗi impact ghi `boundaryCaptured` và `snapshotBoundary` khi có đủ `before` + `after` snapshot và `metadata.sourceBoundary`. Report thêm `impactSnapshotCoverage` và chỉ bỏ gap khi mọi action có ít nhất một impact, mọi impact đều được capture.
- Parity projection giữ đúng phạm vi `full-replay-rule-outcome`: field evidence boundary không làm thay đổi digest/luật replay. Build owner/identity, seed, reward, balance, save migration, roster, art, audio và dist không đổi.

### TDD and verification

- RED: focused boundary/observation/parity suite trên baseline → `3 failed`, exit code 1; thiếu report coverage và `boundaryCaptured`.
- GREEN: cùng focused suite → `10/10 PASS`, exit code 0.
- REFACTOR: `node --check` observer + adapter pass; `node --test tests/*.test.mjs` → `39/39 PASS`, exit code 0.
- Local `npm test`/`npm run build` vẫn chưa chạy được vì source harness connector-only không có `package.json`; không dùng kết quả này để claim full local pipeline.

### Production deployment

- Vercel deployment `dpl_5AaCe8jwx53Xh7caas3UJQ5xMHca` từ feature `efab464` đạt `READY`; alias [`https://luc-than.vercel.app/`](https://luc-than.vercel.app/).
- Build log: clone đúng commit, `npm run build` → `node scripts/build-static.mjs`, embedded battle `951694 bytes`, deploy completed.
- Runtime error query 1 giờ: không có runtime errors.

### Production Chrome evidence

- URL: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05e-per-impact&v=3175&qaCombatFixture=l05a`; đã bấm `Xuất chiến` thật và đổi tốc độ qua nút UI lên `2×`.
- Run kết thúc: `finished`, `28 action / 81 result / 219 impact`; `impactSnapshotCoverage={captured:219, expected:219, actions:28, actionsWithBoundary:28, complete:true}`; boundary types gồm `addStatus`, `applyDamage`, `applyHeal`, `gainEnergy`, `markDefeated`, `performAction.action-cost`, `tickStatuses`.
- `finalSnapshotCoverage={captured:28, expected:28, complete:true}`; completion `player / enemy-wiped / round 4 / speed 2`; full-replay fingerprint `282374be`; report `gaps=[]`.
- Visible result là `Khải hoàn`; browser log theo URL chỉ có warning fixture fallback, không có app error. Extension diagnostic không tính vào app evidence.

### Blockers and next handoff

- Chrome desktop production đã có evidence; Safari/iPhone/iPad và responsive device matrix chưa chạy vì backend thiết bị không có.
- Ticket Board: `TICKET_BOARD_NOT_AVAILABLE`; archive mẫu: `SOURCE_NOT_AVAILABLE`; `game-dev` CLI: `command not found`.
- Bước tiếp theo: chạy cùng cap/parity/interaction evidence trên Chrome responsive và Safari/iPhone/iPad khi có device backend; sau đó cập nhật trạng thái Ticket Board. Giữ `REVIEW`, không đánh dấu `DONE`.

## L05c-f — semantic impact-case coverage (2026-09-07)

**Trạng thái:** `REVIEW`; L05/L05b vẫn `IN_PROGRESS`. Đây là lát cắt evidence của observer, không thay đổi luật trận.

### Source/build owner

- Checkpoint `4ff19225cff5c243651c22caacdf791a4d816bd4` → feature `4df4ff500d10e559ffff16ba5b265491fd8f896a`; `main` fast-forward, không force-push.
- Sửa `src/domain/combat/action-observation.mjs`: report thêm `impactTypeCoverage` theo từng loại impact và `impactCaseCoverage` cho `damage/heal/dot/status/multiHit`. Các field chỉ đọc evidence; parity projection, resolver, seed, reward, balance, save, roster, art, audio và dist không đổi.

### TDD and verification

- RED: focused suite có 3 failure thật vì hai field semantic chưa tồn tại, exit code 1.
- GREEN: focused observer/boundary/parity suite `10/10 PASS`.
- REFACTOR: observer/adapter `node --check` pass; full combat suite `39/39 PASS`.

### Production deployment and browser

- Vercel deployment `dpl_6Zu9TgEAKBcgwAxWcLz9KQRSxZXy` từ `4df4ff50` đạt `READY`; build `npm run build` → `node scripts/build-static.mjs`, embedded battle `952325 bytes`; Vercel check success, runtime errors 0.
- URL fixture: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05f-semantic&v=3176&qaCombatFixture=l05a`; đã bấm `Xuất chiến` thật và đổi tốc độ qua UI lên `2×`.
- Report kết thúc: `28 action / 81 result / 219 impact`; `impactTypeCoverage={damage:38, death:6, dot:4, energy:133, heal:13, miss:5, status:20}`; `impactCaseCoverage={damage:true, heal:true, dot:true, status:true, multiHit:true}`.
- Boundary evidence vẫn đủ: `impactSnapshotCoverage=219/219`, `actionsWithBoundary=28/28`, `finalSnapshotCoverage=28/28`, completion `player / enemy-wiped / round 4 / speed 2`, fingerprint `282374be`, `gaps=[]`. DOM hiển thị `Khải hoàn`; app error/warning log theo session không có.

### Blockers and next handoff

- Chưa có Chrome responsive device emulation backend hoặc Safari/iPhone/iPad thật; không ghi device PASS thay cho desktop Chrome.
- Local source harness không có `package.json`, `game-dev` CLI không tồn tại, Ticket Board không có, archive là `SOURCE_NOT_AVAILABLE`.
- Bước kế tiếp: device matrix trên alias production khi backend có; sau đó cập nhật trạng thái Ticket Board. Giữ `REVIEW`, không đánh dấu `DONE`.

## L04b — one-shot scene timer cleanup (2026-09-07)

**Trạng thái:** `REVIEW`; L04/L04a/L04b vẫn `IN_PROGRESS`. Đây là một lát cắt
source/test nhỏ cho lifecycle scope, không phải đóng toàn bộ L04.

- `src/ui/scene-lifetime.js` giờ tự tháo disposer của `trackTimeout` ngay sau
  khi callback một lần chạy xong; callback vẫn bị chặn nếu scope đã dispose và
  `trackTimeout` vẫn trả về timer handle như trước.
- RED: focused timer test fail thật với `pending=1` sau callback. GREEN:
  focused L04 suite `18/18 PASS`. REFACTOR: node syntax checks cho scene,
  build owner và return-context pass.
- Code commit `e37c6df342e912a3c8ef15ac2ad5ed152547db21`; Vercel deployment
  `dpl_8ZUUaBWq4z4yd58Br8piF7UNN68N` đạt `READY`, build log chạy `npm run build`
  và embedded battle `952325 bytes`.
- Chrome production alias đã reload sau commit và chạy 20 vòng `Tướng` →
  `Chinh chiến`; `#hvHeroRosterV4` và `#hvCampaignScene` đều còn đúng một
  root và hiển thị. App-origin browser errors sau khi loại diagnostic của
  extension: `0`.
- Không đổi seed, reward, balance, save migration, roster, art, audio,
  gameplay rule hoặc dist-only output.

### Blocker và bàn giao tiếp

- Ticket Board: `TICKET_BOARD_NOT_AVAILABLE`; device: chỉ có Chrome CDP,
  `DEVICE_BACKEND_NOT_AVAILABLE`; archive: `SOURCE_NOT_AVAILABLE`; `game-dev`
  CLI: `command not found`.
- Local connector checkout thiếu binary asset package nên local build/all-test
  không đại diện đầy đủ; Vercel build complete-source đã pass. `doctor` và
  `smoke` scripts không có trong repo.
- Bước kế tiếp: khi có backend thiết bị hoặc Ticket Board, chạy lại device
  matrix và claim/lock/evidence; giữ `REVIEW`, không tự đánh dấu `DONE` hoặc
  `MERGED`.

## L04-A2 — runtime stale-draft revision propagation (2026-09-07)

**Trạng thái:** `REVIEW / IN_PROGRESS`; không đánh dấu `DONE` hoặc `MERGED`.

- Baseline contract: `0299d4b5e1c3c3010392652f964321645ec820c3`.
- Source/build owner commit: `6e1bb9c28538ee65355f59f8bf6601b9934807d2`.
- `scripts/return-context-v1.mjs` lấy `P.revision` hợp lệ qua `readRevision()`
  khi capture hero-detail context; `beforeNavigate` và `afterScreenChange` đều
  truyền `currentRevision` trước khi restore route/scroll. Không đổi seed,
  reward, balance, save migration, roster, art, audio, gameplay rule hoặc
  dist-only output.
- TDD: RED là failure thật của assertion build-owner; GREEN/REFACTOR focused
  suite `19/19 PASS`, `node --check` và `git diff --check` pass.
- Production: Vercel `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` **READY**, source SHA
  trùng code commit, build `npm run build` → `node scripts/build-static.mjs`,
  embedded battle `952325` bytes, runtime error query 1 giờ `0`.
- Chrome alias smoke đã bấm UI tới Chinh chiến rồi Tướng: `#hvCampaignScene`
  `1/visible`, `#hvHeroRosterV4` `1/visible`, 12 card, app-origin console
  errors `0`. Thao tác card Ông Phở chưa cho detail route ổn định (trở về hub,
  không có app error), nên detail/back chưa ghi PASS.
- Device capabilities `[]`: chưa có Chrome responsive hoặc Safari/iPhone/iPad.
  Ticket Board `TICKET_BOARD_NOT_AVAILABLE`; archive `SOURCE_NOT_AVAILABLE`;
  `game-dev` CLI `command not found`; local connector checkout thiếu asset/dist
  nên full local build/all-test không đại diện complete source; doctor/smoke
  scripts không có.

**Bàn giao chính xác:** retest/fix hero-detail → back route trong lát cắt L04a
kế tiếp, sau đó chạy device matrix và claim/lock Ticket Board khi backend khả
dụng. Giữ `REVIEW / IN_PROGRESS`.

## L04-A2 — hero-detail route/back viewport fix (2026-09-07)

**Trạng thái:** `REVIEW / IN_PROGRESS`; không đánh dấu `DONE` hoặc `MERGED`.

- Contract baseline: `0706198b82a69535ebcf1d503e55e2a6802913f9`.
- Source/build owner commit: `935a472c111b3d4096307cc5a95c434ee7bc9b1f`.
- Root cause: production `#hvHeroRosterV4` computed `height=100px` dù `inset=0`,
  nên card DOM tràn ngoài route surface và click rơi về screen cũ. Source fix
  thêm `height:100vh!important;height:100dvh!important`, giữ một grid scroll
  owner và không thêm document-level route listener.
- RED: `tests/hero-roster-route.test.mjs` fail thật trước patch vì thiếu
  viewport-height contract. GREEN: `1/1 PASS`. REFACTOR: focused
  route/roster/return-context/roster-plan `23/23 PASS`; syntax và diff check
  pass.
- Production Vercel `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is `READY` from the same
  SHA; complete-source build ran successfully, embedded battle `952325 bytes`,
  selected 1-hour runtime errors `0`.
- Chrome real UI: root `680×936`, grid `680×716`, 12 cards; Ông Phở →
  `heroDetail` → accessible `Quay lại danh sách tướng` returns to one visible
  roster root with Ông Phở still active; app-origin console errors `0`.
- Machine evidence: `docs/qa/L04a/l04a-hero-detail-route-back.json`.

Blockers unchanged: device backend capabilities `[]`, Ticket Board unavailable,
archive `SOURCE_NOT_AVAILABLE`, `game-dev` CLI missing, local connector checkout
missing binary assets, and no `doctor`/`smoke` scripts. Next handoff is device
matrix + Ticket Board claim/lock/evidence when those backends become available;
retain `REVIEW / IN_PROGRESS`.

## L05c — round-cap and full replay parity evidence (2026-09-07)

**Trạng thái:** `REVIEW / IN_PROGRESS`; không đánh dấu `DONE` hoặc `MERGED`.

- Contract baseline: `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`.
- Source/build owner commit: `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`.
- Scope is evidence-only: `src/domain/combat/action-observation.mjs` now exposes
  `replayParity.seed` next to the existing full-replay-rule-outcome fingerprint.
  No seed config, reward, balance, save migration, roster, art, audio or combat
  rule changed.
- RED: the new focused parity assertion failed because `report.replayParity.seed`
  was undefined. GREEN: `tests/combat-l05c-parity.test.mjs` is `4/4 PASS`.
  REFACTOR: full combat suite is `39/39 PASS`; changed-source syntax checks and
  `git diff --check` pass.
- Production deployment `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is `READY` from the
  code SHA; complete-source Vercel build embedded battle payload `952395` bytes.
  Selected runtime-error query is empty (`0`).
- Chrome production fixture at 1× and 2× reports the same seed
  `l05a-production-seed`, action count `93`, impact count `644`, fingerprint
  `86267582`, round cap `15`, max observed round `15`, `roundsBeyondCap=0`,
  `roundCapReached=true` and `gaps=[]`. Completion speed is `1` and `2`
  respectively; both visible result states are `Khải hoàn` at `HIỆP 15/15`.
  Final 2× app-origin console errors: `0`.
- Machine evidence: `docs/qa/L05c/l05c-round-cap-replay-parity.json`.

Blockers unchanged: device backend capabilities `[]` (no responsive Chrome or
Safari/iPhone/iPad), Ticket Board `TICKET_BOARD_NOT_AVAILABLE`, archive
`SOURCE_NOT_AVAILABLE`, missing `game-dev` CLI, incomplete local binary-asset
checkout and absent `doctor`/`smoke` scripts. Next handoff is device matrix and
Ticket Board claim/lock/evidence when those backends become available; retain
`REVIEW / IN_PROGRESS`.

## L04b — preparation timer scope ownership (2026-09-07)

**Trạng thái:** `REVIEW / IN_PROGRESS`; không đánh dấu `DONE` hoặc `MERGED`.

- Baseline main: `f2ff2ef14df703a1ad6cc31bf884d95ce94764d8`.
- Source/build-owner commit: `5bea38657178c70b39ddce55f3d1866242940dbb`.
- Scope: `src/ui/campaign-scene.js` now centralizes the existing
  `updateSceneNumbers` interval in `trackSceneTimer()`. Campaign clock,
  preparation screen and visibility-resume paths all register cleanup on the
  existing campaign activation lifetime. No gameplay, seed, reward, balance,
  save migration, roster, art or audio behavior changed.
- RED: focused scene-lifetime test was a real `5 pass / 1 fail` because the
  `trackSceneTimer` contract was absent. GREEN: `6/6 PASS`. REFACTOR:
  scene-lifetime + return-context + roster-route checks `11/11 PASS`, source
  syntax and `git diff --check` pass.
- Local full direct tests are `181 pass / 37 fail` only because this connector
  checkout lacks `dist/`, binary assets and complete-source fixtures. Local
  `npm run build` is blocked by missing
  `assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json`; Vercel is the
  complete-source build authority for this checkout.
- Production Vercel deployment `dpl_A4rM7BwWDW6xzqzM6iHyjCvuf5VB` is
  **READY**, source SHA matches the code commit, embedded battle is `952395`
  bytes, alias is `https://luc-than.vercel.app/`, and the selected 1-hour
  runtime-error query is `0`.
- Chrome production semantic smoke at
  `https://luc-than.vercel.app/?qaL04b=preparation-timer` verified 10
  independent open/cancel/re-entry cycles. End state has one
  `#hvCampaignScene`, home visible, preparation hidden, stamina `120/120`,
  and zero app-origin console errors. A larger batch hit a CDP input timeout
  and is not counted as pass.
- Device backend check is `browserCapabilities=[]`; responsive Chrome and
  Safari/iPhone/iPad are unavailable. Ticket Board is
  `TICKET_BOARD_NOT_AVAILABLE`, archive is `SOURCE_NOT_AVAILABLE`,
  `game-dev`/doctor/smoke are unavailable. Machine evidence:
  `docs/qa/L04b/l04b-preparation-timer-scope.json`.

**Next handoff:** run responsive/Safari/iPhone/iPad QA and obtain Ticket Board
claim/lock/evidence when those backends become available. Keep
`REVIEW / IN_PROGRESS`.

## 1.11 L03c — save-failure fault injection and retry evidence (2026-09-07)

**Trạng thái:** `REVIEW / IN_PROGRESS`; không đánh dấu `DONE` hoặc `MERGED`.

- Baseline main là `39b91072edf1d50a3eabf35ff3dd61f18ceee7bd`; code commit của lát
  cắt là `f99165d77d88be9f31c76569e7e9b01acdc943e0`.
- Source/build owner chỉ sửa `scripts/qa-full-access-v1.mjs`; test mới là
  `tests/qa-save-failure.test.mjs`. QA bridge đọc `qaPersistFail=once|1|true`
  sau khi đã có `qa=unlock-all`, hoặc dùng nút `Arm lỗi lưu`, rồi làm cho đúng
  một lần `persist()` trả `false`. Đường URL bình thường không được cài banner
  hay control lỗi; transaction owner hiện có vẫn trả `SAVE_WRITE_FAILED` và
  khôi phục candidate state.
- RED: test mới trên baseline có `1 failure thật / 1 pass`, vì thiếu marker
  fault injection. GREEN: focused QA + transaction contract là `9/9 PASS`.
  REFACTOR: `node --check` cho QA bridge/transaction và `git diff --check`
  pass; không đổi gameplay, seed, reward, balance, save migration, roster,
  art, audio hoặc default persist.
- Vercel deployment `dpl_9vxdxR6mwe5TXfhwF13epAZ489hP` từ đúng code SHA đạt
  `READY`; alias `https://luc-than.vercel.app/`; build chạy đầy đủ
  `npm run build` → `node scripts/build-static.mjs`, embedded battle
  `952395` bytes; selected runtime errors `0`.
- Chrome production QA URL là
  `https://luc-than.vercel.app/?qa=unlock-all&qaPersistFail=none&l03c=save-fail`.
  Sau khi hoàn tất precondition Ca Trực Đêm, lần claim quest đầu sau khi arm
  giữ `1/1`, nút `Nhận` còn bật, ngọc giữ `820`, banner hiện `Lỗi lưu: đã mô
  phỏng`. Retry cùng command cho ceremony `HOÀN THÀNH VIỆC VẶT`, ngọc lên
  `840`, quest vẫn `1/1` và nút thành `✓` disabled. Reload QA sandbox trả về
  ngọc `820`, quest `0/1`, chứng minh test session không ghi save thật.
- URL production bình thường được kiểm riêng: `#hvQaFullAccess=0` và
  `[data-qa-arm-persist-fail]=0`. Browser app-origin errors sau khi loại
  diagnostic `chrome-extension://` là `0`; device capabilities là `[]`.
- Machine evidence: `docs/qa/L03c/l03c-save-failure-browser.json`.

### Blocker và bàn giao tiếp

- Local connector checkout vẫn thiếu `assets/` nhị phân và `dist/`: `npm run
  build`/`npm test` bị chặn bởi
  `assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json`; full direct suite
  đã chạy `183 pass / 37 fail` với các lỗi ENOENT của checkout không đầy đủ.
- `scripts/doctor.mjs`, `scripts/smoke.mjs`, `agent-browser` và `game-dev`
  không có; không tự cài hoặc thay credential. Device backend responsive
  Chrome/Safari/iPhone/iPad chưa khả dụng. Ticket Board/claim/lock là
  `TICKET_BOARD_NOT_AVAILABLE`; archive mẫu là `SOURCE_NOT_AVAILABLE`.
- Bước tiếp theo: khi device backend có, chạy cùng luồng save-fail trên Chrome
  responsive và Safari/iPhone/iPad; nếu chưa có thì chọn lát cắt source/test
  tiếp theo từ L04a/L05b. Giữ `REVIEW / IN_PROGRESS`.

## 1.9 L04b — opt-in campaign lifecycle diagnostics (2026-09-08)

**Trạng thái:** `REVIEW / IN_PROGRESS`; không đánh dấu `DONE` hoặc `MERGED`.

- Contract `L04b-scene-lifetime-fault-diagnostics/v1` giữ nguyên ownership:
  `src/ui/campaign-scene.js` sở hữu scene, `src/ui/scene-lifetime.js` sở hữu
  activation resources, build owner chỉ nhúng source vào static build. Query
  `qaL04b=scene-lifetime` là opt-in; route bình thường không có diagnostic
  snapshot.
- Code chain mới nhất: `5979d493` → `eae7b4f1` → `7b1f2d6c` → `4f8511bd`.
  RED `2` failure thật; GREEN `2/2`; REFACTOR focused `32/32`, syntax và
  `git diff --check` pass.
- Production deployment `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` READY; build log
  ghi embedded battle `952395` bytes, runtime errors `0`. Chrome alias normal
  route không có bridge; active route có đúng 1 root, 8 pending resources,
  timer/RAF/observer đang hoạt động và cache 5; exit route dispose về 0;
  12 vòng re-entry giữ stable root/resource và app-origin errors `0`.
- Machine evidence: `docs/qa/L04b/l04b-scene-lifetime-diagnostics.json`.
- Full direct local suite: `185/222` pass, `37` fail do connector checkout
  thiếu `dist/`, binary assets và fixture; local build bị chặn bởi
  `assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json`. Device backend là
  `[]`; Ticket Board/boot, archive, doctor/smoke, `agent-browser` và `game-dev`
  là blocker đã ghi chính xác.

### Bàn giao tiếp

Khi device backend hoặc Ticket Board khả dụng, chạy device matrix và claim/lock
evidence cho L04b/L04a/L05b. Nếu chưa khả dụng, chọn lát cắt source/test tiếp
theo của L04a/L05b; không đổi seed, reward, balance, save migration, roster,
art, audio hoặc gameplay rule và giữ `REVIEW / IN_PROGRESS`.
