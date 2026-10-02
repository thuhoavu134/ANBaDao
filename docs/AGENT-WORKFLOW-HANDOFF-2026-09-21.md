# Agent Workflow Handoff — Lục Thần / Hồn Việt: Mộng Giới

Cập nhật: 2026-09-21  
Source-of-truth: GitHub repo `bktimmy247/luc-than`  
Baseline hiện tại: main `2a75e2b1e53fc755f2ee9616e6134c405d6cf9d1` (merge PR #178)

## 1. Mục đích
Tài liệu này mô tả **cách đang phát triển game**, không chỉ trạng thái một PR. Agent mới phải đọc tài liệu này trước khi sửa để tiếp tục đúng quy trình, không làm lại phần đã hoàn thành, không bỏ qua QA hình ảnh và không nhầm deploy với source.

Nếu main đã tiến xa hơn SHA ở trên thì luôn lấy main mới nhất làm baseline, sau đó dùng tài liệu này như contract quy trình.

## 2. Thứ tự đọc bắt buộc
1. `AGENTS.md`
2. file này
3. `vibelab.json`
4. `docs/ui-ux-reference-parity.md`
5. handoff chuyên đề liên quan, ví dụ `docs/BATTLE-READINESS-INTEGRATION-2026-09-19.md`
6. code owner thực tế của màn/hệ thống cần sửa
7. test/QA script đang khóa hành vi đó

Không suy diễn trạng thái từ chat cũ. GitHub main + PR merge + CI là bằng chứng chính.

## 3. Cách làm cho mỗi task

### A. Xác minh baseline
- Đọc main HEAD.
- Đọc PR gần nhất đã merge quanh vùng code cần sửa.
- Tìm test hiện có trước khi thêm test mới.
- Xác định đúng owner runtime. Không vá vào file trung gian nếu build sau đó overwrite.
- Ghi rõ cái gì đã PASS và cái gì còn UNVERIFIED.

### B. Branch nhỏ, patch nhỏ
- Tạo branch mới từ main HEAD.
- Mỗi branch chỉ giải một blocker hoặc một lát cắt rõ.
- Không rewrite toàn bộ subsystem khi sửa nhỏ đủ giải root cause.
- Không đổi combat math/save/reward/auth nếu task không cần.
- Không thay asset gốc chỉ để chữa layout/runtime nếu có thể sửa owner hiển thị.

### C. Test trước khi merge
Tối thiểu:
- `npm run build`
- `node --test --test-concurrency=1 tests/*.test.mjs`
- browser QA phù hợp vùng sửa.

CI hiện chạy:
- Build
- full Node test suite
- `scripts/qa-battle-readiness-browser.mjs`
- `scripts/qa-authored-legacy-browser.mjs`
- `scripts/qa-skill-test-browser.mjs`
- `scripts/qa-result-motion-browser.mjs`
- `scripts/qa-round15-result-flow.mjs`

Không kết luận PASS chỉ vì build xanh nếu UI/gameplay chưa có browser evidence.

### D. UI/game visual hard gate
Mọi thay đổi nhìn thấy phải theo vòng:
`render → screenshot → inspect → interact → screenshot lại → kiểm console/asset errors`.

Yêu cầu:
- desktop Chromium
- mobile Chromium
- bấm primary action thật
- đọc ảnh thật và mô tả observation cụ thể
- kiểm tra clipping/overflow/safe-area/black gap/asset missing
- runtime exception = 0 cho vùng acceptance
- asset error = 0 cho vùng acceptance

Responsive Chromium **không** được gọi là physical iPhone/Safari. Nếu chưa có máy thật thì ghi `UNVERIFIED`.

### E. PR và merge
- PR phải ghi scope, non-goals, acceptance, evidence.
- Không merge khi CI đỏ.
- Nếu CI bị cancel ngoài ý muốn, đọc log rồi rerun; không gọi đó là test failure khi không có assertion failure.
- Trước merge UI: đọc artifact screenshot/report, không chỉ nhìn dấu xanh.
- Merge xong mới coi main đã nhận thay đổi.
- Sau merge, nếu thay đổi workflow/contract/owner thì cập nhật tài liệu handoff này.

## 4. Delivery/build owner quan trọng

### Build pipeline
`scripts/build-static.mjs` là pipeline build static. Các patch runtime phải được áp dụng trước khi payload battle cuối cùng được nhúng vào `dist/index.html`.

Cuối pipeline hiện có:
- apply result motion patch
- đọc `dist/battle.html`
- base64 embed chính xác payload đó vào `dist/index.html`

Vì vậy khi sửa battle visible trong iframe phải kiểm tra **owner cuối** của build, không chỉ file source ban đầu.

### Result screen owner
Hiện màn Victory/Defeat được khóa bởi:
- `scripts/result-character-motion-v1.mjs`
- `scripts/qa-result-motion-browser.mjs`
- `scripts/qa-round15-result-flow.mjs`

Không tạo owner animation thứ hai nếu có thể sửa owner này.

## 5. Contract Victory/Defeat hiện tại — đã merge
PR #174 đã merge vào main ở `f535494f...`.

Phải giữ nếu task không yêu cầu đổi:
- Victory: hero **Run → Idle**, không tự chuyển ải.
- Victory có nút `Xác nhận` và `Ải sau`.
- Defeat: hero **Fall đúng một lần → giữ frame cuối**.
- Result card phải phủ xuống đáy, không còn dải đen dưới màn hình.
- Hero phải nằm trong vùng focus của cánh, không tụt xuống phần chữ.
- full flow 15 hiệp vẫn phải hoạt động.
- không thêm chữ “Thắng” ngoài thiết kế đã khóa.

Anchor hiện tại trong injected CSS:
- Victory authored hero-wrap top: `13.5%`
- Defeat mobile authored hero-wrap top: `11.5%`

Không thay các giá trị này theo cảm giác. Nếu thay phải có screenshot/measurement mới và test regression.

## 6. Browser QA hiện tại cần hiểu đúng

### Result Motion QA
Acceptance bao gồm:
- Victory Run có nhiều frame thật.
- chuyển sang Idle và Idle tiếp tục frame.
- touch target nút >= 44px.
- Defeat Fall chỉ 1 cycle và giữ frame cuối.
- card bottom gap <= 2px.
- authored hero checks PASS.
- runtime exceptions = 0.
- result asset errors = 0.

### Round 15 QA
Script ép trận 6v6 HP cao để runtime thật đi đủ 15 hiệp, không mock combat function.
Các case hiện gồm:
- victory confirm x1
- victory next x2
- victory confirm x3
- defeat back x3

Task nào ảnh hưởng result/campaign phải giữ gate này xanh.

### Battle VFX QA
Dùng cho asset readiness, VFX/SFX, action path và host iframe flow. Không dùng một screenshot VFX để suy ra toàn bộ layout/game đã hoàn hảo.

### Direct Skill Test QA
Màn `/skill-test.html` là bề mặt test trực tiếp đã merge ở PR #178:
- chọn Lục Ảnh / Đình Lôi / Ông Phở;
- bấm Basic / Skill / Ultimate để ép production action hook trên trận 6v6 thật;
- status dựa trên trace thật: action:start → marker:impact → action:complete;
- Reset tạo battle session mới;
- build phải copy màn này vào `dist`;
- `scripts/qa-skill-test-browser.mjs` phải click đủ 9 action + Reset ở desktop/mobile.
Favicon 404 và Media request bị hủy do Reset iframe được giữ trong raw audit nhưng không tính là critical; mọi HTTP/network failure khác vẫn phải làm gate đỏ.


## 7. Checkpoint gần nhất đã xác minh
PR #178 — `feat: add direct skill test surface`
- merge commit: `2a75e2b1e53fc755f2ee9616e6134c405d6cf9d1`
- tested head: `d420486da0f7105750b7fc34561123eb74a79002`
- CI run #566: **SUCCESS**
- Build + full Node tests PASS
- Battle VFX browser QA PASS
- Authored legacy hero browser QA PASS
- Direct skill-test browser QA PASS desktop 1280×800 + mobile 390×844
- Lục Ảnh / Đình Lôi / Ông Phở: Basic / Skill / Ultimate đều có start → impact → complete và về home 0px trong report
- Reset tạo session mới và trở lại ready
- direct report: exceptions=0; criticalHttpErrors=0; criticalNetworkFailures=0; qaErrors=0
- Result Motion QA PASS
- Round-15 result-flow QA PASS
- screenshot đã review: controller không che đội hình desktop; mobile không overflow ngang; IMPACT/action state đọc được; VFX authored vẫn hiển thị
- physical iPhone/Safari: **NOT RUN**
- production/Vercel của route `/skill-test.html`: phải kiểm riêng; GitHub source PASS không đồng nghĩa đã live

PR gần trước liên quan:
- #175: certify Lục Ảnh / Đình Lôi / Ông Phở Basic/Skill/Ultimate trên runtime thật
- #174: result hero wing alignment
- #171: gate card bottom coverage
- #170: remove mobile Defeat bottom gap
- #169: faster VFX + Linh Đồng/Bạch Diện readiness + Đình Lôi return stabilization
- #168: 15-round result flow browser QA
- #167/#166: result motion readiness
- #165: Victory manual next/confirm
- #162: battle asset readiness/SFX/VFX repair
- #161: per-skill movement positions

Không reopen vấn đề đã khóa nếu chưa có regression evidence.

## 8. Quy tắc movement/combat đang theo
- Vị trí tung chiêu là theo skill, không phải mọi tướng đứng cố định một chỗ.
- Ranged có thể tiến lên gần mục tiêu giống reference.
- Melee/ranged dùng movement owner hiện tại; tránh tạo scheduler thứ hai.
- Damage vẫn phải resolve sau authored VFX.
- Normal damage và crit feedback phải giữ hành vi hiện tại.
- Lục Ảnh Ultimate giữ anchor vùng giữa đội hình địch và không screen shake nếu không có yêu cầu mới.
- Không tự thay combat math khi đang sửa presentation.

## 9. Asset/SFX/VFX
- Không dùng placeholder để tuyên bố complete.
- Không tự tích hợp asset demo độc lập nếu user chưa yêu cầu tích hợp.
- Khi đã là task tích hợp game, phải kiểm asset load trên đường runtime thật.
- Cache/lease đã được dùng để giữ asset qua action/recovery; không quay lại kiểu load/xóa mỗi chiêu.
- Shared audio bus là owner; không tạo audio owner cạnh tranh.
- “Có file âm thanh” không bằng “đã phát”; browser QA phải xác nhận playback path.
- Decoded cache cap không được gọi là tổng RAM thiết bị.

## 10. GitHub vs Vercel
GitHub/source và Vercel/deploy là hai lớp khác nhau.

Hiện đã từng có Vercel failure do quyền/team membership. Vì vậy:
- CI GitHub xanh + merge main = source đã hoàn tất cho scope đó.
- Vercel đỏ **không** được mô tả thành source test fail.
- Ngược lại, không được gọi là `live`/production nếu Vercel chưa deploy thành công.
- Chỉ xử lý deploy khi task yêu cầu live/deploy; đừng để deploy permission chặn việc source/GitHub nếu user chỉ yêu cầu code.

## 11. Những điều cấm
- Không dựa vào branch cũ sau khi main đã tiến lên.
- Không merge stale PR chỉ vì title có vẻ đúng.
- Không sửa lại phần đã PASS mà không có regression.
- Không tuyên bố UI “mượt/đẹp/xong” nếu chưa xem screenshot mới.
- Không gọi responsive browser là thiết bị thật.
- Không bịa số test, FPS, RAM, screenshot, deploy.
- Không force-push main.
- Không thay source-of-truth gameplay bằng mock QA.
- Không làm mất fractional durations đang dùng trong combat timing.
- Không tự roll Combat V2 lên production nếu chưa có quyết định mới.

## 12. Cách bàn giao cho agent kế tiếp sau mỗi vòng
Mỗi vòng có thay đổi đáng kể phải ghi:
1. main SHA sau merge
2. PR số bao nhiêu
3. file owner đã đổi
4. acceptance nào PASS
5. CI run nào
6. screenshot/report nào đã đọc và observation
7. cái gì còn UNVERIFIED
8. bước tiếp theo thực sự còn mở

Nếu workflow không đổi, chỉ cần cập nhật checkpoint ngắn; không rewrite tài liệu lịch sử.

## 13. Bước tiếp theo sau tài liệu này
Khi được yêu cầu “tiếp game”, trước tiên:
- refresh main HEAD
- rà open PR/backlog/docs
- dùng `/skill-test.html` khi cần xem trực tiếp authored skill của Lục Ảnh / Đình Lôi / Ông Phở
- chọn blocker gameplay/UI cao nhất còn đỏ
- **không đụng lại Victory/Defeat hoặc direct skill-test đã PASS nếu chưa có regression evidence**
- thực hiện theo quy trình ở trên và lưu evidence trước merge.

## 2026-09-29 — character clip registration

Baseline `52153e0` (PR #240). Linh Đồng source-crop registration now lives in `src/assets/sprite-registration.mjs` and the asset catalog; Bạch Diện's fixed first-pose registration is stored in its runtime manifest. Both build adapters pass registration to the shared Canvas renderer, including reduced atlas variants. Keep animation motion; never resize each frame by its alpha bounds.

Evidence/limits: `docs/qa/character-registration-20260929/README.md`. Full real-asset build and 1376 Node tests PASS; 36 offline generated-renderer pixel cases PASS. Interactive browser and physical Safari NOT RUN; not a production deployment. Owner explicitly waived the workflow gate and authorized merge in chat.


## 2026-09-30 — hero visibility under atlas pressure

Baseline `3089882` (PR #242); approved character sizes stay unchanged. The late build patch `scripts/battle-character-visibility-v1.mjs` connects `src/render/hero-visibility-cache.mjs` to the four atlas-managed hero renderers. Keep its independent single-frame body backup separate from action/VFX readiness: animation sheets may be evicted, but a living visible hero must not lose its body. Never use the standing backup for a defeated unit. The native cache owner remains `scripts/legacy-authored-readiness-v1.mjs`; shared decoded eviction remains `src/assets/decoded-atlas-cache.mjs`.

Evidence: `docs/qa/hero-visibility-20260930/README.md`. Full build + 1391 tests PASS; forced atlas-loss pixel checks pass for both teams at desktop/mobile and resume normal rendering after reload. Offline Skia evidence only; physical Safari and production are not certified. Owner’s existing merge/gate waiver remains in effect.

## 2026-09-30 — preparation idle and formation slots

Baseline `3450853` (PR #243). Preparation idle pages are generated by `scripts/campaign-preparation-idle-v1.mjs` from the final `spriteSpecs`; `src/ui/campaign-scene.js` leases current/next pages and uses a native first-idle-frame fallback. Do not restore the portrait fallback for authored preparation sprites or raise the 64 MiB mobile cap to fit the old 85 MiB idle set. All 432 frames retain their pixels, pivots and clocks; the active idle set is at most 50.992 MiB.

`scripts/splus-runtime-v1.mjs` keeps Core's slot order, including mixed parties. Default targeting belongs to Core and the S+ factory; the late `scripts/battle-formation-targeting-v1.mjs` connects it to legacy/S+ selection and action entry. UI slots 1–3 run down the front column, 4–6 down the back. Prefer the first living column, then its facing row, otherwise its lowest living slot. Keep kit-specific skill scopes, healing, taunt and explicit extra-turn/delay effects.

Evidence: `docs/qa/preparation-slots-20260930/README.md`; full real-asset build + 1399 tests PASS, all casualty combinations and frame pixels checked, actual generated preparation draw inspected offline on desktop/mobile. Browser, physical Safari and production remain unverified. Existing owner merge/gate authorization applies.

## 2026-09-30 — persistent battle pages and AI progress

Baseline `13aa7c4` (PR #244). `scripts/battle-persistent-pages-v1.mjs` is the late build owner for native Lục Ảnh/Đình Lôi idle and persistent shield pages. `src/render/persistent-atlas-pages.mjs` holds current/next pages separately from action leases; its 19.336 MiB reserve is deducted from the normal native atlas budget. Preserve all frames, clocks, pivots and approved dimensions. Temporary authored action leases still have a separate documented peak.

`scripts/battle-ai-progress-v1.mjs` validates both AI dispatch sites and routes an unavailable turn through the existing scheduler. Keep legal target/slot ownership and never retry partially applied damage. `scripts/battle-enemy-cell-cleanup-v1.mjs` produces a hash-guarded derivative that removes two neighbour fragments from the enemy archer cell without changing the cell grid.

Evidence and limits: `docs/qa/battle-flicker-20260930/README.md`. 73 focused tests plus the existing inline-runtime check PASS; 224 frame pixel comparisons and offline boundary renders checked. Full clean build, interactive browser, physical Safari and production certification NOT RUN in this sparse recovery. Existing owner merge/gate authorization applies.


## 2026-09-30 — Result screen / full-page settlement repair

User supplied a Victory screenshot with an opaque Thầy Mo portrait, static/cropped reward labels and ineffective result buttons. Merge remains authorized by the user's earlier explicit gate waiver.

- Reproduced on the served site in Chromium: iframe Confirm advanced 1–1 → 1–2; full-page Next from 1–2 incorrectly completed chapter 1, opened chapter 2 and left player EXP unchanged. The return consumer ran before late campaign route initialization and did not restore ST mode/chapter/stage.
- Owner: `scripts/result-screen-contract-v1.mjs`, installed after result motion; patches existing result action/transport/return/settlement owners. One native click listener on the result root replaces pointerup/touchend/click capture dispatch. Storage errors are visible and retryable; host save failure releases the existing settlement guard and reports to the child.
- Full-page results wait for DOMContentLoaded, validate the lease/stage, restore context, and clear pending state only after successful settlement. Gold, first-clear player XP, capped mastery and pet participation share the existing receipt. Reward display uses existing preview/quest/chapter rules and distinguishes player EXP from hero progression. No economy amount is raised.
- Existing motion owner now handles Thầy Mo's verified transparent padded idle atlas (96 frames / 6000 ms). The pack has no authored Run/Fall: entry translates the animated idle, defeat uses the existing generic fall transform. Do not describe this as a newly authored running clip. Other authored heroes retain their Run clips; legacy roster uses its battle archetype pose. Lục Ảnh result uses verified RGBA idle and the compact legacy painter is removed to avoid competing RAFs. Idle is drawn before the entrance body is hidden.
- 35 focused tests passed against patched generated HTML; all inline scripts parse; five served assets match current-main Git blob hashes. Inspected six extracted Thầy Mo frames with clean transparency/full body.
- Full clean npm build/test and post-fix browser/iPhone visual QA NOT_RUN in this recovered sparse workspace. Production reproduction is pre-fix evidence, not proof of the new deployment. See `docs/qa/result-screen-20260930/README.md`.



## 2026-10-02 — campaign loot and battle return continuity

Baseline `8a57b69` (PR #246). Live Chromium confirmed Confirm/Next progression, but exposed missing seal rewards in the result display/full-page settlement and a welcome gate covering the next running battle.

`HonVietSealLoot` in `src/ui/lore-luc-than-runtime.js` retains the existing stage formula/hero pool; the existing result receipt now awards seal gold/gems/shards for both transports. Do not restore the old `runBattleWithSealLoot` award callback. `scripts/player-progress-v1.mjs` preserves Next through the remaining competitive callback.

Full-page settlement awaits `HonVietLoginGate.resumeBattleReturn()`: same account previously entered in this tab, existing cloud-readiness checks, no new login. Logout clears the per-tab marker. `__HV_RESUME_BATTLE_RETURN` shares one in-flight attempt and lets Continue retry retained data.

47 focused tests PASS; initial regressions failed. Affected build owners replayed on downloaded production HTML; full clean build/full suite and physical Safari NOT_RUN in the sparse workspace. Evidence: `docs/qa/campaign-loot-20261002/README.md`. Existing owner gate waiver/merge authorization applies. GitHub and Vercel are checked separately.

### CI follow-up to PR #247

Full CI Build passed; Test passed 1443/1446. Updated two existing harnesses for the async return marker, lore window and real mastery settlement function; retained behavior/rollback/duplicate assertions. All four affected suites now pass 47/47 locally. No runtime change in this follow-up. Full CI rerun required on its PR. Vercel currently rejects the commit author for team access; do not equate the merged commit with a live deployment or spoof author identity.
