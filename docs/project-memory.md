## 17/09 — TKT-0160: 3Q-derived campaign resource lifecycle (branch only)

- Studied the static 3Q Laya H5 source: replay-driven preload, model/effect dedupe, queued pack loading, caller ownership/ref-count and delayed cleanup.
- Added a clean-room `campaign-resource-pack-cache` with bounded decoded bytes, max loading, shared keys and delayed scope release.
- Bày trận now uses generated `campaign-lite` atlases for the preview surface and reserves the native Ultra v5 assets for Battle. This tier is a Lục Thần adaptation, not a claimed 3Q feature.
- Six managed campaign-lite assets total ~84.6 MiB decoded under a 96 MiB campaign budget. Local focused/full verification is being run before PR. Main has not been changed.

## 17/09 — Fix Bạch Diện Ultra v5 Bày trận flicker

- Root cause: `src/ui/campaign-scene.js` still read the old 94-frame/8-column contract after the Ultra v5 atlas replacement. This sent Canvas source rectangles outside the 32-frame idle and 45-frame run atlases, making Bạch Diện appear/disappear.
- Fix: Bày trận metadata now uses idle `32 frames / 6 cols` and run `45 frames / 6 cols`; pivot/foot/body remain unchanged.
- Evidence: all Ultra v5 atlas frames have non-empty alpha; focused runtime suite and full `npm test` pass.
- Main commit pending this verification: direct-main fix after `a68701b`; no combat numbers changed.

## 17/09 — Direct main rollback to Bạch Diện Ultra v5

- Extreme v6 was rejected in the actual game visual review because aggressive frame thinning caused visibly poor motion. Replaced the 8 Bạch Diện runtime atlases on `main` with the preserved Ultra v5 sampling: **269 frames**, native 480×440 character / 440×248 VFX cells.
- Canonical Canvas Sprite Runtime and hero/roster contracts remain unchanged; only asset atlas content, runtime metadata version, and matching regression expectations changed.
- Focused Bạch Diện runtime tests: 10/10 PASS. Full `npm test`: EXIT 0.
- Rollback checkpoint before this direct-main change: `226e99b` (`backup/main-pre-ultra-v5-20260917` local).
- Production deploy: not run.

## 16/09 — TKT-0156: Bạch Diện tướng đầy đủ

`DATA.heroes.bach_dien` + `OFFICIAL_ROSTER_12_IDS` + kit v2 + hồ sơ idle. Linh Đồng giữ. TKT-0155 extras SUPERSEDED. LIVE #152 `85a35d5`. Owner tự `git pull && vercel --prod`.

## 16/09 — TKT-0155: thẻ Bạch Diện Tướng/Đồ Giám

Extra `bach_dien` trên roster, portrait card.webp, chạm `qaSplus42=hero_splus_bach_dien`. Roster 12 đóng. LIVE #151 `7a700e9`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0154: Bạch Diện Canvas Sprite Runtime

Pack animated WebP 94@30fps đóng atlas 8×12 (480×440) / 10×10 (440×248), không 4×2. Catalog + lazy idle + LRU 128 MiB dùng chung. Extra S+ giữ mechanics TKT-0152. Roster 12 đóng. LIVE #150 `aedd4cb`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0153: Chinh chiến Linh Đồng Run

March dùng `run-atlas.webp`. Idle giữ cho Bày trận. Cell/pivot L144 không đổi. LIVE #149 `7c70c69`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0152: Bạch Diện extra S+ (cơ chế)

`hero_splus_bach_dien` aliases bach_dien / bach-dien. Không phải hàng 43. Passive Diện Khúc Luân Hồi, S1 Huyễn Diện Trảm, Ult Ly Hồn Đoạt Phách 100 Nộ. Roster 12 đóng. LIVE cùng #150.


## 15/09 — TKT-0151: Canvas Sprite Runtime


LIVE #147 `e8cd581`. Catalog resolve Linh Đồng + Lục Ảnh + Đình Lôi, không Image. Loader lazy, decoded LRU 128 MiB / maxLoading 2. Renderer metadata, trận 477×440. Timing-main bỏ eager forEach TKT-0150. L150-T2 đổi thành load VFX lúc ra chiêu. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0150: VFX/SFX trận

LIVE #146 `7baca81`. motionDuration không min 80. Eager Linh Đồng atlas. SFX decode chậm vẫn phát. skipAnimations=false lúc vào trận. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0149: nhịp trận tuần tự

LIVE #145 `506a7f8`. timingScale live 1, speed 1, turnRest 480, await performAction. S+ 0.35. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0148: địch Bày trận + cuộn Tướng

LIVE #144 `5de296f`. Foe prep luôn mirror. `.v4-grid` overflow auto. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0147: Ải 1-2 khóa sau thắng ải trước

LIVE #143 `4e61e58`. Con trỏ campaignStages sau thắng mở ải kế. Settlement ghi mốc theo ải đang đánh. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0146: S+ Linh Đồng clock ATK/Ultimate

LIVE #142 `c517cd8`. `performSplusAction` dùng `waitLinhDongMarker` wall clock, không `sleep(linhDur)`. Chrome 390×844 ATK 1506ms. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 13/09 — Gộp bản owner đã duyệt live: #111 + #112

#112 cấp người chơi đã merge tại147325b. Ghép #111 huy hiệu hai kiếm vào cùng cây nguồn, giữ đề xuất cấp đã chốt/implementation TKT-0118. Không quay lại trạng thái chờ chốt level. Kiểm tra bản kết hợp trước cập nhật main; Chrome390×844 BLOCKED (preview đăng nhập bị auto-review từ chối), Safari NOT_RUN. Owner tự deploy.

## 14/09 — TKT-0144: Linh Đồng crash / ảnh bust trên sân

Baseline 3accc0e. LIVE #138 `645902f`. Cache lazy/dedup 112 MiB, 2 loads; cleanup route/iframe; spriteSpecs idle toàn thân; renderer fallback; hồ sơ không ép vuông. CI 970/970. Chrome candidate BLOCKED, iPhone NOT_RUN. Owner tự `git pull && vercel --prod`. Không báo hết crash iPhone trước xác minh.

## 13/09 — TKT-0118: owner chốt cấp người chơi 1–60

Triển khai khóa108 ải theo cấp + thắng ải trước, giữ catalog lt_seal hiện có. Cấp tướng trần30 không đổi. EXP lần đầu/việc ngày-tuần/nhận rươngAFK ghép transaction cũ; migration cấp bù theo tiến độ, backup additive, clear keys chống nhậnEXP lại. UI cấp/EXP và đường rương/nhiệm vụ khi khóa. Sửa truyền Next qua2 wrapper lore và cursor replay. Chi tiết: docs/CAMPAIGN-LEVEL-PROPOSAL.md.
Tests domain + built owners kiểm gate trước hoạt lực, đủ108, migration3 save, duplicate/rollback/AFK cap và fractional carry. Full CI cần kiểm ở revision PR. Chrome390×844 vẫn BLOCKED do automatic approval review từ chối preview đăng nhập; Safari NOT_RUN. IN_PROGRESS/EVIDENCE, chưa merge/deploy. PR111 kiếm vẫn riêng, không hiểu «ok chốt» là live.

## 13/09 — TKT-0116: cơ chế AFK xuyên 6 chương

Owner duyệt cơ chế #109, main 305002f. Giữ hành quân cả đội, đánh bầy, damage/crit và loot về rương. Registry 6 world theo chapterIndex: Ấn Phố dùng art đã duyệt; 5 chương sau có map và quái khác silhouette. Waypoint được đặt sau khi xem từng ảnh, không dùng chung đường cũ. Chương mới reset clock và đổi cảnh lớn/minimap cùng nguồn; cùng chương không reset khi đổi ải. Chương chưa có cấu hình fallback Ấn Phố, cần bổ sung world trước khi phát hành chương mới.
5 map + 5 quái mới có prompt/metadata, RGBA giữ nguyên, pivot/bounds đo alpha 128 một lần; jelly/step/hover tách chuyển động. Không thay tướng, roster hoặc mở ticket NPC khác. Không thay thưởng/save/progression/combat.
RED 2 lỗi thiếu world resolver → GREEN 85/85 campaign/AFK; syntax và build PASS. Chrome 390×844 vẫn BLOCKED do automatic review từ chối preview đăng nhập; Safari NOT_RUN. Asset đã xem, UI runtime mới chưa nghiệm thu. VibeLab browser gate còn thiếu; ticket-file fallback, không claim giả. Chưa merge/deploy, chờ live riêng.

## 13/09 — TKT-0115: đội hành quân, đánh bầy và loot về rương

Tiếp từ main be983ff (#108 đã merge theo live của owner). Owner cho phép di chuyển bằng Idle tạm, thay quy tắc cũ chờ Run mới di chuyển. Camera theo tuyến đường 7 điểm trong map v3, quay lại liên tục không teleport; mini map đồng bộ cùng tọa độ. Cả đội đã lưu đánh đồng thời tối đa 4 quái, hai lượt Basic, giữ timing authored; thiếu Basic dùng gesture tạm.
Damage nảy, crit đỏ/cỡ lớn; hit timeline quyết định HP/death; loot rơi → nằm → bay về tâm rương đo từ HUD. Không cộng thưởng, ghi save, đổi tiến ải hoặc gọi combat scheduler. Dùng RAF/farmTime của scene, pause khi ẩn/Bày trận; reduced-motion tĩnh.
RED 3 fail trước implementation → GREEN 82/82 campaign/AFK tests (bao gồm camera/đội/quái trong 3 viewport và 12 chặng). Syntax PASS. Browser Chrome 390×844 vẫn BLOCKED do automatic approval review từ chối preview đăng nhập; Safari NOT_RUN. Không dùng tests toán thay nghiệm thu thẩm mỹ hoặc độ mượt. VibeLab runtime/browser gate chưa hoàn tất; ticket-file fallback, không claim giả.
PR mới, chưa merge/deploy. Chờ live riêng cho PR này sau khi owner xem.


## 13/09 — TKT-0114 AC12: farm chỉ diễn hoạt

Đội lấy từ savedSceneSquad. Quái rêu RGBA xuất hiện, nhún nhẹ, nhận đòn và tan; nghỉ rồi luân phiên tướng tiếp theo. Basic authored: Ông Phở/Thầy Mo/Đình Lôi/Lục Ảnh, giữ số frame và thời gian atlas; tướng còn thiếu Basic dùng nghiêng người nhẹ + tia tiếp xúc tạm, không coi là asset hoàn chỉnh. Tướng không bị thay bằng art mới. Quái riêng phục vụ yêu cầu này, không mở roster 72 hoặc các ticket NPC.
Dùng clock/RAF của cảnh, pause khi ẩn hoặc Bày trận, reset khi vào cảnh mới, reduced motion không chạy farm. Không chạm save/thưởng/tiến ải/combat scheduler; HP quái chỉ để vẽ. Run WAITING_ASSET.
RED 2 fail → GREEN 78/78 focused. Chrome 390×844 visual/actions BLOCKED do preview chuyển tới đăng nhập Vercel, automatic approval review đã từ chối. Safari NOT_RUN. Chưa xác nhận thẩm mỹ/độ mượt; IN_PROGRESS/EVIDENCE, không merge/deploy.

## 13/09/2026 — TKT-0114 bản đồ hành quân + mini map

Owner từ chối nền sân v2, yêu cầu bám góc nhìn bản đồ của video. Bản v3 nhìn từ trên xuống có đường nối cầu/làng/cổng; cảnh chính, mini map và bản đồ mở rộng dùng cùng một ảnh. Viewport và dấu đội dùng đúng phép chiếu; không mô phỏng tiến ải. Thiếu Run: giữ Idle và camera tĩnh.
76/76 test Chinh chiến/AFK PASS sau RED 2 lỗi thiếu map. Syntax PASS. Chờ CI revision mới. Chrome visual/actions vẫn BLOCKED do preview yêu cầu đăng nhập Vercel đã bị auto-review từ chối; Safari NOT_RUN. Chưa nghiệm thu thẩm mỹ.
Tiếp tục PR108, không merge hoặc deploy. AC11: mini map đồng nhất cảnh, mở/đóng được qua handler cũ. Thuật toán được kiểm thử; thao tác UI thật chưa được kiểm chứng.

## 13/09/2026 — TKT-0114 correction, browser gate pending

Owner rejected floating party and giant chest; Codex continues PR108 from 9ddec88.
New dedicated road-v2 background, explicit full-height canvas, cover-projected staggered feet; keep popup/claim/prepare behavior. Run WAITING_ASSET.
RED: 3 grounding tests fail; GREEN/regression: 74/74. Syntax and build PASS.
Local full suite: 780/831 PASS, 51 FAIL in partial asset checkout; use remote CI to determine complete-checkout result. No tests disabled.
Cloud browser cannot access local preview; hosted PR preview redirected to Vercel login and auto-review rejected dashboard access. Chrome visual/actions PENDING; Safari NOT_RUN. No claim of visual PASS. No merge/deploy.
Evidence: docs/qa/L114-CAMPAIGN-AFK-UI/correction-contract.md and correction-*.tap.

## 12/09/2026 tối — bàn giao hết quota

Wave J tickets 0076–0078. Agent tiếp TKT-0065. Vercel alias vẫn 282df9d tới 13/09 17:15 +07. Neon chưa gắn — nhiều người chưa bền. Prompt `docs/AGENT-PROMPT.md`.

## 12/09/2026 — TKT-0075 LIVE

Main `ce1a0e1` [#57](https://github.com/bktimmy247/luc-than/pull/57). Nan Lịch Luyện: icon = ải, khóa = overlay CSS. Điều khoản một câu. Vercel Hobby cũ hết hạn tới 13/09 17:15 +07.

## 12/09/2026 — TKT-0075 REVIEW

Nan Lịch Luyện: icon = ải, khóa = overlay CSS (biến mất khi mở). Đăng nhập: điều khoản một câu nối liền. Wave H vẫn READY. Không merge tới `live`.

## 12/09/2026 — Wave F + Wave H LIVE


Main `b4915a9`. PR #51 Hành trình/Kết quả overlay body. PR #55 stub 0065…0073. Overlay Wave H chưa điền. Việc kế: TKT-0065 trận Tháp NPC, TKT-0066 Thành Chính.

## 12/09/2026 — TKT-0074 màn đăng nhập LIVE

Owner merge [#56](https://github.com/bktimmy247/luc-than/pull/56) → `282df9d`. Mở game = login video rồi Thành Chính. Email + Du khách chạy mọi máy. Google/Facebook/Apple native cần App ID Vercel. Agent tiếp: Tháp có trận NPC, nút về Thành Chính, Wave F #51.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals REVIEW

Wrap `renderHeroDetail` sau tabs. 9 tướng × 3 ấn jpg `assets/ui/skill-seals/{id}/`. CSS `#hdBody[data-hero-id]`. Ông Phở / Lục Ảnh / Thầy Mo giữ emoji. 72 tướng vẫn wave sau. Không merge tới `live`.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals LIVE

Owner `live` [#54](https://github.com/bktimmy247/luc-than/pull/54) → `d94f8a3`. 27 medallion UI 9 tướng. Wave F #51 không trộn. 72 tướng vẫn wave sau.

## 12/09/2026 — Wave G halls + Safari pin LIVE

Owner `live` [#53](https://github.com/bktimmy247/luc-than/pull/53) → `b0d6d9d`. Cốt truyện / Trực Tuyến / Trận Hình overlay body. Pin Safari `visualViewport`. 72 tướng vẫn wave sau.

## 12/09/2026 — Safari overlay = night filter containing-block

Owner iOS: overlay WebKit co vì `body.night{filter}` + `html overflow-x:hidden`. Pin `visualViewport`, `hv-overlay-open{filter:none}`. Safari device vẫn NOT_RUN (sandbox không WebKit).

## 12/09/2026 — Wave G halls TKT-0058…0060 REVIEW

Cốt truyện / Trực Tuyến / Trận Hình overlay `#hv{Story,Net,Team}Root` body, 100vh + `filter:none`. Không merge tới `live`. 72 tướng vẫn wave sau.

## 12/09/2026 — 72 tướng full-asset = wave sau

Owner `live` Wave G coordinator: «sau này mới bổ sung 72 tướng với asset đầy đủ chứ ko phải mấy nhân vật hiện tại». Roster playable **12**. Không nới 12 → 72. Không idle/combat/portrait sheet đầy đủ cho ID live. 42 S+ lab vẫn không vào production.

## 12/09/2026 — TKT-0036 Rèn hall REVIEW

`#hvForgeRoot` body overlay + hall 3D tươi. Giữ `forgeCommand`. Không merge tới khi owner gõ `live`.

## 12/09/2026 — TKT-0035 LIVE

PR [#36](https://github.com/bktimmy247/luc-than/pull/36) squash `f52e5fc`. Vercel `dpl_7N9JqoJDRJQGEX4XNKc1NYqzyAeP`. Roster overlay body. Việc kế: Rèn hall giả 3D, giữ `forgeCommand`.

## 12/09/2026 — TKT-0035 Màn Tướng hiện lại REVIEW

Roster `#hvHeroRosterV4` gắn `document.body` như `#hvGearRoot`. overflow auto + min-height thẻ/lưới — không mount trong `.wrap > #heroesScreen` (iOS/Grok clip lưới về 0). 12 ID / `heroStats` / nan không đổi. Không merge tới khi owner nói `live`.



## 12/09/2026 — TKT-0033 + TKT-0034 LIVE

Main `b5a91f6`, PR #35 squash-merge. Owner gõ `live`. Trợ trận + Lịch Luyện icon/nền giả 3D tươi trên production. Không đổi `heroStats` / daily formulas. Ticket kế: chờ `tiếp` (Rèn hall hoặc shell Túi/Mail/Bang).

## 12/09/2026 — TKT-0034 Lịch Luyện giả 3D tươi REVIEW

Owner chốt: icon + nền **tươi, giả 3D, nhiều lớp**. Lịch Luyện 11 nan + hall đổi theo Trợ trận. Không reuse `menu-v3233`. Không overlay Thành Chính. Công thức daily đóng băng. Không merge tới khi owner nói `live`.

## 12/09/2026 — TKT-0033 Icon sơn Trợ trận REVIEW

Dock Trợ trận `#hvGearRoot`. Owner chốt: icon + nền **tươi, giả 3D, nhiều lớp** (art sẵn có), không sơn dầu tối. 11 nan `assets/ui/account-gear/spokes/{key}.jpg` từ token account/item. Hall `assist-hall-day.jpg`. WHEEL / `heroStats` không đổi. Không thêm `data-art-go`. Không merge tới khi owner nói `live`.


## 12/09/2026 — TKT-0032 Lịch Luyện LIVE + bàn giao agent sau

Main `a1f936a`, PR #33 squash-merge. Vercel production READY `dpl_G49Q6XjU29UzEYczLLRfvvq7VSpk`. Dock Lịch Luyện mở `#hvLichRoot` hall riêng 11 nan sơn; Nhiệm vụ giữ Nhật Ký Mơ. Snapshot [HANDOFF-2026-09-12.md](HANDOFF-2026-09-12.md). Ticket kế TKT-0033 (gợi ý icon sơn Trợ trận). Không đổi runtime trong commit docs bàn giao.

## 12/09/2026 — TKT-0032 Lịch Luyện REVIEW

Dock Lịch Luyện mở **màn hall riêng** `#hvLichRoot` (inset 0, z-index 80, nền `lich-hall.jpg`, nút X, chip tài nguyên) — không overlay lên Thành Chính. 11 nan mỗi ải một icon sơn `assets/daily/spokes/{key}.jpg`, không dùng icon hub. Nan sống: Qua Ải Mộng, Giáo Trường Luyện, Tháp (ch.1), Mộng Lộ (ch.2), Đấu Trường + Săn Boss (ch.3). 5 nan sắp mở. Side Nhiệm vụ giữ Nhật Ký Mơ. Domain daily không đổi công thức. Không thêm `data-art-go`. Không merge cho tới khi owner nói `live`. Trợ trận icon sơn: chưa làm (ticket khác).




## 12/09/2026 — TKT-0031 Lễ Hội LIVE

Main `3baffa8`, PR #32 squash-merge. Vercel production READY `dpl_CQjwBHTMpwKjPW7zu83pMeRovupz`. Domain festival + lacquer trên production. Inject sau hunt. Mở từ đêm đầu. Formulas frozen.

## 12/09/2026 — TKT-0031 Lễ Hội REVIEW

Domain `src/domain/festival/festival-run.mjs` owns hoa đăng / Tam Nguyện / Lễ Ấn / Bách Bảo / rương. Runtime wraps `renderFestival` / `releaseLantern` / `spinBachBaoCore` / `openBachBaoChest`, không thêm `data-art-go="festival"`. Transaction `hvRunCommittedTransaction`. Build: `scripts/festival-runtime-v1.mjs` sau hunt. Không đổi 5 đèn / 🪙100 / 20 ô / bảng rương. Không merge cho tới khi owner nói `live`.

## 12/09/2026 — TKT-0030 Săn Boss LIVE

Main `f96e53d`, PR #31 squash-merge. Vercel production READY `dpl_26SmNBM8BZarjCyP4U1ew3Cd9sDx`. Domain hunt + lacquer + painted boss art trên production. Inject sau arena. Boss 1 con to (`huntForm`) + 2 Mộng Tinh tinh thể. Mở sau 3 chương. Formulas frozen.

## 11/09/2026 — TKT-0030 Săn Boss REVIEW

Domain `src/domain/hunt/hunt-run.mjs` owns day/contract/start/settle. Runtime wraps `renderHunt` / `selectHuntContract` / `startHunt` / `huntSettle`, không thêm `data-art-go="hunt"`. Settle qua `hvRunCommittedTransaction`. Build: `scripts/hunt-runtime-v1.mjs` sau arena. Không đổi 6⚡/2 lượt/HP. Không merge cho tới khi owner nói `live`.

## 11/09/2026 — TKT-0029 Đấu Trường LIVE

Main `9bd266a`, PR #30 squash-merge. Domain arena + lacquer đã trên production. Inject sau summon.

## 11/09/2026 — TKT-0028 Gọi Mộng LIVE

Main `4deed0e`, PR #29 squash-merge. Domain summon + lacquer đã trên production.

## 11/09/2026 — TKT-0028 Gọi Mộng REVIEW

Domain `src/domain/summon/summon-pull.mjs` owns pull/pity/spark. Runtime wraps `doSummon` / `renderSummon` / `sparkSelectHero`, không thêm `data-art-go="summon"`. Pull qua `hvRunCommittedTransaction`. Build: `scripts/summon-runtime-v1.mjs` sau shop. Không đổi tỉ lệ/pity.

## 11/09/2026 — TKT-0027 Chợ Mộng LIVE

Main `febfd5ec`, PR #28 squash-merge. Domain shop + lacquer đã trên production.

## 11/09/2026 — TKT-0027 Chợ Mộng REVIEW

Domain `src/domain/shop/shop-day.mjs` owns open/buy/day. Runtime wraps `ensureShop` / `buyShop` / `renderShop`, không thêm `data-art-go="shop"`. Mua qua `hvRunCommittedTransaction`. Build: `scripts/shop-runtime-v1.mjs` sau expedition.

## 11/09/2026 — TKT-0026 Mộng Lộ LIVE

Main `571dd264`, PR #27 squash-merge. Domain expedition + lacquer đã trên production.

## 11/09/2026 — TKT-0026 Mộng Lộ REVIEW

Domain `src/domain/expedition/expedition-run.mjs` owns start/route/bless/reroll/win/lose. Runtime wraps `renderExpedition` / `startRogueBattle`, không thêm `data-art-go="expedition"`. Build: `scripts/expedition-runtime-v1.mjs` sau tower.

## 11/09/2026 — Bàn giao agent sau

Điểm vào: `docs/HANDOFF-2026-09-11.md`. Live đủ vòng chơi + Trợ trận + Tháp + Mộng Lộ + Chợ + Gọi Mộng + Đấu Trường + Săn Boss. Owner `tiếp` = Lễ Hội (TKT-0031). Không làm lại Bày trận visual 09/09, không merge S+ V2 vào roster.

## 11/09/2026 — CI/CD tự động (TKT-0025)

`.github/workflows/ci.yml`: job `ci` (build+test) trên PR/main; job `production` chỉ trên main, curl live 200. Vercel Git vẫn là CD.

## 11/09/2026 — Tối ưu deploy (TKT-0024)

`build-static` chỉ copy game (index/battle/qa/splus/assets). `sharp` là devDependency. Vercel install `--omit=dev`.

## 11/09/2026 — Tháp khóa lực chiến + bù ngày (TKT-0023)

`prepareTowerAttempt` auto-resolve theo `teamPower`. `stuckFloor`/`stuckSince` ghi lần fail đầu. Campaign không đụng. Công thức vàng/ấn/5⚡ giữ nguyên.

## 11/09/2026 — Tháp Trắng Đêm sơn mài (TKT-0022)

Domain `tower-progress` + màn leo tầng sơn mài. Hub landmark Tháp. Giữ công thức vàng/ấn/5⚡. Không đổi campaign/seed.

## 11/09/2026 — HUD trận sơn mài gọn (TKT-0011)

Trận nhúng ẩn topbar; ribbon 48px đêm/đồng; tốc độ và tua chip tròn 44px trên dock.
