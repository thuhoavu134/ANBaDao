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

## 2026-10-03 — desktop canvas presentation flicker

Baseline `57202df` (#248). User's 13-second video shows the arena background remaining while multiple living heroes disappear/reappear together; user confirms desktop reproduces and phone does not. Do not publish the raw user recording.

The final canvas owner `scripts/battle-entry-fail-open-v1.mjs` previously requested `desynchronized:true` only on desktop. Its direct presentation can expose the background repaint before actors/VFX finish, consistent with the video and device split. Use the existing composited opaque profile `{alpha:false}` on both profiles, retaining the plain 2D fallback. No sprite size, frame timing, combat scheduler, memory budget or phone profile changed. Reference: https://developer.chrome.com/blog/desynchronized/ (Avoiding flicker).

Validation: desktop/profile and fallback regressions failed before the fix (2 fail/3 pass); all 5 entry tests pass after it. All 16 generated battle inline scripts parse after replaying the changed context owner. Full CI runs on the PR. Cloud Chromium did not reproduce the user's physical monitor symptom; final validation on that Windows/GPU setup remains necessary after deployment. GitHub merge is separate from Vercel/production.

## 2026-10-04 — progression, quest rewards and routine motion

Baseline `07f38e5` (#249). Owner authorized the audit fixes and retains the prior merge/gate waiver.

- `src/ui/preview-journey-unlock.js`: both known production domains preserve chapter gates. Other hosts require explicit `window.HonVietPreviewConfig.unlockJourney === true`; host mismatch no longer means test access. Existing intentional full-access QA remains separate.
- `src/domain/daily/daily-run.mjs` reads DAILY_DRIP/WEEKLY_DRIP from the economy domain once. Claim, task preview and receipt feedback use the same balanced definition. Do not patch a second legacy quest catalog to award these materials.
- Locked-mode quests and the level-up quest for an owned roster at level 30 receive accessible win/train assignments. IDs, rewards and activity points stay unchanged. Persist `variant: 'accessible'` through daily/weekly normalization; do not reroll it mid-period or overwrite prior progress/claims. The next day/week selects again. Runtime passes the actual chapter-unlock configuration.
- `scripts/daily-runtime-v1.mjs` bundles the economy dependency and connects existing progress counters/hub badges to `HonVietDailyQuests`. Existing daily route wrapper adopts assignments after cloud account replacement and at period rollover; no new router/counter owner.
- Routine sign-in/idle/task/milestone claims show brief existing progress feedback with all amounts. Seven-day sign-in, 80 daily points and 100 weekly points retain ceremonies. Account XP comes from the committed transaction result; max-level, duplicate or failed saves cannot advertise a fresh XP award. Save failure remains retryable and reports an error.
- Tower copy describes a suggested power level; actual battle result still determines victory. No promise that catch-up alone guarantees a clear. Battle/result hero animation and combat math are unchanged.

Validation: original reward/production regressions failed; 30 focused functional/owner tests pass locally after replaying changed build owners. The sparse workspace lacks the daily artwork and some lane files, so complete clean build/suite and actual desktop/mobile UI are delegated to CI/remaining QA, not claimed from local checks. Physical Safari and production deployment remain unverified. New regression suite: `tests/game-loop-consistency.test.mjs`.


## 2026-10-04 — remove stacked turn handoff delays

Baseline `119d6d2` (#250). User reports several idle seconds between heroes. `scripts/battle-turn-pacing-v1.mjs`, installed after final AI/formation/authored owners, shortens only scheduler dead time: rest 80 ms + reveal 40 ms + AI think 0 ms + announcement 60 ms (180 ms at nominal x1, previously 1440 ms). Ong Pho uses the same announcement budget and no extra 120 ms post-idle hold.

Do not accelerate or skip authored attack/recovery/VFX/SFX clocks to reproduce this fix. Existing completion, return-home, cancellation, manual-choice and defeat-exit guards stay intact; the single scheduler still dispatches exactly once. Four regression tests pass (three failed before repair); generated inline scripts parse. Full build/suite run on the PR; physical browser timing and production deployment are not certified from these local scheduler checks. Existing owner merge/gate authorization applies.


## 2026-10-04 — battlefield death exit

Baseline `6a3b109` (#251). User requires fall once then disappearance from the arena. S+ Linh Đồng/Bạch Diện previously returned through drawSplusToken before the common defeat visibility check, holding the last fall frame forever. `scripts/battle-defeat-exit-v1.mjs` installs the shared exit guard before all battlefield painter branches, then ends visibility at the actual fall duration with no corpse hold/early fade. Marking death uses each authored fall duration, including Lục Ảnh's playback-scaled clip; its fall playback rate is frozen to survive speed toggles. Generic heroes keep their existing fall transform.

Final-result Defeat artwork/hold is separate and unchanged. Existing revival, target exclusion, result wait and cancellation owners stay intact. Four generated-runtime regression tests cover all hero kinds, both sides/S+ and hunt exit, living/revived visibility, repeated death, x1/x2/x3 Lục Ảnh timing and last-death result exit. Initial regressions failed; eight focused tests (including previous turn pacing) pass. Inline scripts parse. Full CI build/test runs on the PR; actual browser frame/pixel behavior and physical Safari are not certified locally. Prior user merge/gate authorization applies.


## 2026-10-04 — roster enemies and common body height

Baseline 4891dda (#252). Enemy NPC definitions without a roster source now resolve deterministically to an official roster identity and its skills; encounter stats, rows, slots and reward ownership stay independent. Existing roster-backed/PvP definitions are unchanged. NPC progression does not borrow the player account upgrades. Preparation preserves duplicate identities as separate slots. Ambient chapter mobs use roster bodies too; old hunt visuals are disabled for configured combat units.

Final build owner scripts/roster-enemies-size-v1.mjs measures the alpha height/foot of the first roster row at build time (including fractional legacy cells) and fixes each pose to 310 world pixels. Side, slot and duplicate role no longer choose old monster rows or alternate silhouettes. Preparation uses the same first-pose registration. Lục Ảnh/Thầy Mo use fixed whole-character scale shared by all authored clips; existing action clocks and pivots remain. Depth perspective and viewport/layout ownership remain intact. Death-exit marker and guard must survive renderer replacement.

Twenty focused local tests pass (roster generation, registered drawing, host syntax, death exit, turn pacing, formation). Sparse checkout cannot run a complete clean build locally; full build and suite run on PR CI. Offline source-asset contact sheet inspected; actual browser/device behavior and production deployment are not certified. Prior merge/gate authorization applies.


## 2026-10-04 — Atomic campaign settlement follow-up
PR #254 baseline `57b1c3d`: ordinary checkpoint, main quest bonus and battle reward share the existing receipt; persistence failure restores original state and supports retry. Living-target VFX/status filtering is installed after prior combat owners.

Final campaign encounter now includes chapter reward, hero unlock, next chapter, world incident, clan XP, weekly progress and chapter checkpoint removal inside that same battle transaction. The reference-loop endChapter path only renders/routes the committed result, and no longer pays replay gold on a duplicate result. Legacy story-mode endChapter remains unchanged. No reward rebalance or animation edits. Focused generated-runtime tests include rollback, duplicate receipt, legitimate replay and non-final/mismatched results. Full CI build/test and browser/device evidence must be reported separately; user has authorized merge and waived the workflow gate.

## 2026-10-04 21:27 +07 — Progress and next implementation

Current source baseline: main `0bf0ba9359cfc0463e37aed0604d970078c3ec17`.

| Work | Evidence | Status |
| --- | --- | --- |
| Living-target VFX/statuses, atomic battle rewards/main quest and ordinary checkpoint | PR #254; clean build/full tests passed | Merged |
| Final chapter reward, hero/chapter unlock, incident, clan XP and weekly progress in battle receipt | PR #255; clean build/full tests passed | Merged |
| Boss template excluded from regular wave rotation; boss checkpoints 6/12/18 | PR #256; RED 2 failures, GREEN 21 focused tests and CI build/full tests | Merged |
| Seeded S+ benchmark, 324 controlled matches, deterministic replay | PR #257; 3 focused tests and CI build/full tests | Merged; tool only |

Do not report production/Safari visual verification from the above. Browser QA was running at merge; consult each current Actions run before describing its final outcome. Existing permission to merge and waive workflow gate remains; do not alter protection or claim device PASS.

### Next work, in order
1. Extend simulation through the actual mixed legacy/S+ effect adapter, canonical hero/encounter definitions and deterministic roster mapping. Keep animations/storage outside headless mechanics.
2. Cover starter/earned-hero teams at several affordable upgrade states, boss checkpoints and adjacent regular stages. Record seeds, source SHA, action availability, HP judgement, wins and remaining HP. Verify seeded replay and turn/target contracts.
3. Compare upgrade costs with battle/main quest/chapter/daily/AFK income. Current arithmetic: six heroes level 1→10 costs 16,200 gold; chapter-1 battle + seal + main-quest gold totals 10,114 before chapter rewards, starting balance and daily activities. Campaign-only XP first requires an external source at chapter 3; this excludes daily/AFK XP and is not proof of a progression blocker.
4. Change only an evidenced mismatch; do not nerf heroes or increase income based on equal-stat S+ fixtures alone.
5. After balance evidence, clarify activity rewards/unlock routes, then tutorial and remaining animation timing.

### Benchmark limits
`scripts/combat-balance-benchmark.mjs` isolates S+ kits at fixture stats (2000 HP/180 ATK/50 DEF), twelve seeds per scenario, with player-level scaling. It is NOT a production campaign simulator and omits legacy kits, equipment, account bonuses, synergy and visual/device timing. Results/assumptions: `docs/qa/combat-balance-20261004/`. No balance or animation changes were made in PR #257.

Active next scope: mixed-adapter simulation and representative campaign data. Preserve single scheduler, existing 15-round judgement, transaction ownership and authored RGBA/pivots.

### Mixed healing integration follow-up
First mixed-adapter test reproduces legacy healing bypassing S+ antiHeal (340 HP despite full block). The existing generated healing owner now delegates received-healing rules and the canonical heal event to S+ when active; Core retains cast strength and legacy-only behavior. Test coverage: both teams, single reduction, missing-HP cap, death, expiry and one event. Details: `docs/qa/combat-balance-20261004/mixed-healing.md`. Complete mixed campaign simulation and visual/device validation remain pending; do not report full campaign balance from these impact tests.

### Mixed status actor-turn integration
The mixed bridge previously bypassed LegacyCore.tickStatuses whenever S+ was active. Generated bridge RED: poison left HP at 500 instead of 470. Restore actor-turn expiry/control for unmanaged legacy statuses; route their periodic healing/damage through the S+ owner so anti-heal, shields and death prevention apply. S+ managed statuses retain their round clock and are not ticked again. Legacy-only path is unchanged. Fourteen focused tick/heal/formation tests pass locally; full CI reported separately. This does not yet unify all status-name/stat modifier aliases or implement a complete campaign simulator. Next review legacy ↔ S+ stat/status interoperability, then canonical campaign teams. Browser/device/deployment not certified by VM tests.

### Mixed core stat modifiers — attack/defense/speed
Legacy atkUp/atkDown, defUp/defDown, armorBreak and speedUp/speedDown now contribute to the S+ stat owner. The legacy damage adapter reads a projection of combined stats and removes already-consumed legacy stat statuses from the projection only, avoiding double application and preserving original unit state. Core damage formula stays unchanged; S+ passives/auras contribute through its stat owner. RED: legacy attack buff remained 100 instead of 120; generated bridge damage was 60 instead of expected 91. Focused mixed stat/tick/heal/target tests pass; report full CI separately. This scope covers attack/defense/speed only, not all crit/control/accuracy aliases. Full mixed campaign simulation and physical/browser/deployment verification remain pending.

### Compact damage typography and mixed critical readout
Owner supplied IMG_7500 reference and IMG_7625/7626 current-game shots. Reduce damage font 31/24→22/18, critical label 14 vs number 22, pop peak 1.36→1.18, stroke 8/7→3.5/3, glow to 2; non-damage large/base 25/18→16/13 with 2px outline. Keep actual values, event lifetime and damage timing. Offline canvas preview generated/inspected via `docs/qa/compact-floaters-20261004/render-preview.mjs`; this is not browser/device evidence. Images remain original RGBA; no asset edits.

Mixed legacy damage stat projection now reads S+ crit modifier as percentage points and critDamage as a multiplier increment, strips only consumed S+ critUp/critDown from its read-only projection, and keeps base stats intact. Test: base crit10 + S+ .3→40 instead of Core relative 13; critDamage1.5+.2→1.7. Legacy crit aliases into S+, accuracy/control compatibility and complete campaign simulations remain pending. Full CI/browser/device/deployment statuses must be reported separately.


## 2026-10-04 — Mixed control and accuracy interoperability
- Legacy silence now blocks S+ skill/ultimate; hard controls block manual actions before actor-turn ticking.
- Freeze/sleep capture control before expiration so the affected actor skips exactly that turn.
- S+ hit rolls consume legacy accuracy/evasion modifiers; legacy damage projection reads managed blind and strips projected modifiers to avoid double application.
- Focused local validation: 21 tests passed across control/accuracy, mixed status, stats and healing. Fresh generated build and complete test suite remain CI checks; no live browser/device verification claimed.
- Remaining: explicit-zero fallback in legacy hitChance; managed blind charge consumption for legacy attacks; legacy crit modifiers into S+ engine; full canonical mixed campaign simulation before economy/balance changes.


## 2026-10-04 — Explicit zero stats and mixed critical modifiers
- Legacy hit/critical formulas now honor explicit zero accuracy, evasion, crit and crit resistance. Defaults apply only to absent/invalid base stats; existing probability floors/caps remain unchanged.
- S+ critical rolls now apply legacy critUp/Down and critResUp/Down using the legacy multiplicative convention, separately from managed additive crit effects. Actor-turn expiry restores original behavior without mutating base stats.
- Validation: 26 focused local mixed-combat tests passed, including deterministic before/after critical rolls and explicit-zero cases. Fresh generated build/full tests are CI checks; no live device verification claimed.
- Remaining: managed blind charge consumption in legacy impact path, full canonical mixed campaign simulation, then evidence-based reward/economy balance.


## 2026-10-04 — Mixed one-hit blind consumption
- Managed blind charges now share consumeHitAttempt between S+ rolled damage and the legacy impact adapter.
- Legacy damage computes its current hit with blind before consuming the charge; consumption happens even on a miss, never in read-only previews or rejected dead-target attempts. Raw DOT retains existing non-consumption behavior.
- Build owner patches the impact boundary with an idempotent checked anchor. No additional RNG calls or changes to hit probability formulas.
- Validation: 29 focused local mixed-combat tests passed, including extracted generated impact-boundary checks. Fresh build/full suite remain CI validation; physical browser/device behavior unverified.
- Next: canonical mixed campaign simulation with real encounters/host stats and affordable teams, before evidence-based reward changes. Existing S+-only benchmark is not a campaign simulation.


## 2026-10-04 — Enemy slot preservation before campaign simulation
- While tracing canonical campaign payloads, found prepareTeam deduplicating enemy instances by roster source identity. Six foes sharing a roster body could collapse to one, despite preparation preserving all instances.
- Roster build owner now identifies enemy entries by formation slot; separate slots may share a hero identity. Player identity deduplication remains intact. Duplicate enemy slot entries remain rejected; encounter HP/ATK and source ordering stay unchanged.
- RED test reproduced 6 -> 1; after fix 12 focused generated-host/roster/campaign tests passed. Fresh build/full suite are CI validation. No physical browser/deploy verification claimed.
- Difficulty impact: encounters with repeated identities may now be harder because previously omitted foes enter combat. No numeric encounter/reward rebalance in this fix.
- Canonical full mixed campaign simulator is still pending. Do not use the S+-only equal-stat benchmark to tune campaign rewards; next extract canonical host hero stats, expanded encounter waves, bridge skill mapping and progression assumptions into an auditable harness.


## 2026-10-04 — Canonical campaign data audit and dynamic chapter-5 boss
- Added scripts/campaign-progression-audit.mjs: selected generated-host data + actual heroStats/levelCost + lore expansion + roster conversion. Covers 108 stages/14 official IDs, explicit bare level profiles and seal-only loot; NOT a win-rate simulator or affordability model.
- Extraction found a real chapter-5 blocker: authored mirror boss is a factory, previously passed directly to cloneWave. Resolve factory before wave cloning; reuse already-generated chapter waves without repeated factory invocation. Static templates and boss stages 6/12/18 retained.
- RED reproduced map-is-not-a-function. Focused audit/boss/slot suite: 11 tests passed. Fresh build/full test suite are CI validation; no browser/device/deploy claims.
- Reproduction, totals, fixture mirror squad and limitations: docs/qa/campaign-progression-20261004/README.md. No reward/encounter numeric tuning.
- Next: canonical bridge and legacy impact execution with trace equivalence, then representative budget/bonus assumptions for mixed win-rate/progression simulation.


## 2026-10-04 — Shared legacy skill bridge mapping
- Extracted existing host mapSkill verbatim into src/domain/combat/legacy-skill-map.mjs (local helpers included for closure-free build injection). Host bridge delegates to this owner through a checked/idempotent build patch. No intentional skill/multiplier/energy behavior changes.
- Canonical campaign audit now includes mapped skill/ultimate kinds and multipliers for each player profile and encounter enemy from the same owner as the generated host.
- Captured pre-extraction mapping outputs for all 14 official IDs in tests/fixtures/legacy-skill-map-baseline.json; shared owner matches baseline. Generated injected function runs in isolated VM with no external helper closures. Focused mapping/audit/boss suite: 10 tests passed; fresh build/full suite remain CI validation.
- No browser/device/deploy verification or combat win-rate claim. Versioned skill-kit execution/passives/progression overrides are not represented by mapSkill alone.
- Next: extract/execute actual legacy impact/action owner with versioned kit and progression, compare runtime traces, then mixed campaign win rates and economy assumptions. Do not approximate legacy actions from mapped kinds and call it full simulation.


## 2026-10-04 — Shared legacy impact calculation
- Added resolveLegacyHitDetail: actual Core formula, combined read-only mixed stats, existing ordered RNG labels and force-hit/miss/crit rules, then managed blind charge consumption. Dead targets skip RNG and consumption. Pure detail calculation does not mutate HP/shields/energy.
- Generated legacy impact adapter now calls this shared function with LegacyCore (not the projected Core wrapper, avoiding double modifiers). Checked build patch runs after mixed stat/hit owners; legacy downstream impact/presentation remains unchanged.
- Validation: 32 focused mixed-combat tests passed. Formula result/RNG call order checked against previous path, mixed blind expiry tested through generated impact boundary. CI validates fresh build/full suite; browser/device/deploy not verified.
- This is only hit-detail extraction, not full action/impact simulation. Remaining owners include tactical modifiers, shield/HP settlement, counters/kill rage, legacy versioned multi-hit followups and native skill passives.
- Also inspect legacy direct HP mutation versus S+ received-damage prevention/reflection/lifesteal before claiming unified impact behavior. No win-rate/economy balancing claim or reward tuning in this change.


## 2026-10-05 — Mixed received-damage settlement
- RED reproduced real generated legacy adapter bypassing managed damageImmune (265 damage despite immunity) and killing immortal/deathWard targets.
- Added settleLegacyDamage: legacy formula/tactical modifiers retain outgoing raw damage; active S+ engine owns received mitigation, shield packs, prevention and reactions. Legacy-only HP/shield settlement preserved. Incoming melee/type derived explicitly from legacy archetype.
- Primary engine damage/death events carry legacyImpact provenance. S+ bridge suppresses only their duplicate presentation/statistics; legacy adapter owns primary feedback, engine owns kill count/rage. Secondary/reflected/native S+ events retain normal presentation. Blocked hits return without false hurt/rage.
- Validation: 41-test mixed suite passed, then an additional native-S+ presentation regression test passed (42 focused cases total). Tests execute full generated legacy adapter + actual S+ event bridge with presentation stubs, not just a reimplemented formula. Checks include shields, cocoon charges, immortal/ward expiry, reflection/lifesteal, single damage/death/kill-rage credit and legacy-only behavior. Fresh build/full tests remain CI validation; no physical browser/deploy claim.
- Full campaign simulation still pending. Remaining: legacy counterReady direct-HP branch, versioned multi-hit followups/passives and runtime trace equivalence. Review bubble crit cancellation with precomputed legacy raw damage separately. No win-rate/economy balancing claim.


## 2026-10-05 — Ready-counter and bubble critical interoperability
- RED generated-adapter tests reproduced counterReady ignoring managed immunity/shields/immortal, and bubble taking 410 forced-critical damage instead of 265 normal damage.
- Active S+ ready-counters now use combined stat projection and received-damage settlement, tagged secondary/noTriggers to avoid reflection loops. Primary counter accounting/presentation remains at legacy adapter; engine owns managed shields/death protection/kill rage. Legacy-only counter behavior retained.
- Added lightweight hasStatus API using engine active-status clock. Shared hit detail forces a non-critical roll while bubble is active, retaining original RNG order. criticalBlocked prevents forced-critical label/flags from overriding immunity. Expiry restores normal critical behavior.
- Validation: 47 focused mixed-combat tests passed, including full generated legacy adapter, shield/immunity/protection, bubble expiry, single counter stats/floater, no reflection loop and legacy-only compatibility. Fresh build/full suite are CI checks; no physical browser/device/deploy verification claimed.
- Next: versioned multi-hit/followup execution and runtime trace equivalence, then mixed campaign simulation. No complete win-rate simulator or reward rebalance claimed.


## 2026-10-05 — Ong Pho follow-up actor liveness
- Found delayed skill strike #2 checking only target HP; actor killed by first-hit reflection could still deal the next hit and stun. Generic Ong Pho follow-up also lacked actor-liveness guard.
- Source build owner now rejects dead actors in ongPhoFollowUp and gates the delayed second skill impact/status block on actor HP after waiting. Living-actor behavior and existing target-selection policy retained.
- RED reproduced dead actor doing 10 damage; GREEN: 3 generated-runtime behavioral tests passed, including actor dying during the await and no subsequent hit/status. CI validates fresh build/full tests; no physical device/deploy claim.
- Next: broader versioned follow-up/trace equivalence and canonical mixed campaign simulator; no complete balance simulation or reward tuning claimed.


## 2026-10-05 — Generic sequential legacy multi-hit actor liveness
- RED reproduced generic double/multi loop continuing after actor died during first impact (double produced 2 hits instead of 1). Existing loop already checked target HP but omitted actor HP.
- Living-target build owner now checks both participants before each sequential hit. Original 2/4 hit counts, .78/.72 multipliers and dead-target stop behavior retained.
- Validation: 6 generated-runtime behavioral tests passed across generic multi-hit and Ong Pho queued follow-up, including actor death, target death and unchanged living participant behavior. Fresh build/full suite remain CI checks; no physical browser/device/deploy verification claimed.
- Next: remaining raw team-skill reaction settlement and versioned action trace equivalence before full canonical mixed campaign simulation. No complete balance or win-rate claim.


## 2026-10-05 — Finish systems before new hero assets: team reactions
- Owner asks to finish the game systems before adding new heroes/art. Preserve Ong Pho's own ultimate chase; new concept image is not integrated.
- RED: generated applyReactionDamage dealt 100 through damageImmune and allowed a dead actor to deal 40. Mixed settlement build owner now delegates reaction raw damage to settleLegacyDamage (skill, secondary/noTriggers), preserving shields/protection and preventing recursive on-hit chains. Legacy-only fallback retained; engine owns kill/rage, reaction owner owns primary feedback/statistics. Reaction loop stops before consuming primers if actor died.
- Local verification: 41 focused combat/reward/navigation tests PASS; patch idempotency/drift and 15 generated inline scripts parse. Full fresh build/suite and browser QA are CI checks. Physical Safari/production not verified.
- Remaining order: remaining special action/assist received-damage bypasses and runtime trace equivalence; canonical mixed campaign progression/affordability simulation; activity gates and reward receipt coverage; visual/timing regression checks; reusable hero data/asset contract. Do not claim all systems complete or tune economy using the S+-only benchmark.


## 2026-10-05 — Reserve strike received-damage protection
- Baseline main 73162ab (PR #274). Its full build and 1565 tests passed; desktop/mobile VFX browser checks passed in log. Workflow failed at upload-artifact because GitHub artifact storage quota is full, so later browser checks were skipped. Do not describe this as a gameplay assertion failure or rerun unchanged to consume quota; screenshot artifact review/physical Safari/deploy remain unverified.
- RED generated useSupportCall reproduced 130 HP damage through damageImmune and a 100 shield. Mixed settlement build owner now routes reserve offensive damage through settleLegacyDamage, tagged skill/secondary/noTriggers/legacyImpact. Immutable ephemeral support actor has a distinct ID and is never registered as a battlefield unit. Enemy shields, cocoon and lethal prevention apply; normal reserve raw multiplier and targeting remain unchanged.
- The existing call owner retains one use per battle, no action-count cost, current feedback/history, and marks death once. Target damageTaken receives actual HP loss; primary S+ presentation is suppressed through existing legacyImpact provenance. No reserve roster HP/energy/status mutation, no recursive reflection/on-hit loop.
- Additional RED: exploding water shield targeted the ephemeral support object and threw on missing combat memory. Represent support as nonliving source metadata (HP zero), so retaliation follows the engine's existing living battlefield targeting; it cannot kill a phantom reserve or grant bogus enemy kill rage. No engine unit is inserted.
- Local validation: 34 focused tests PASS, including all 6 support tests and exploding-shield regression. Patch idempotency/drift and 15 generated inline scripts parse. Full fresh build/suite run in CI. No browser/device/deploy acceptance claimed.
- Remaining: support heal/shield/rage status interoperability, misleading controller support copy (claims a lock but only drains rage), canonical mixed campaign trace/progression simulation and final visual regressions. Preserve Ong Pho ultimate chase; no new hero art integration.


## 2026-10-05 — Reserve healing, shield and rage interoperability
- Baseline main 8df2c6b (PR #275). Prior build/full suite passed; final workflow again failed only at artifact upload quota after VFX QA. Later browser steps skipped, no physical/deploy acceptance inferred.
- RED useSupportCall reproduced antiHeal allowing +80 HP, shieldBan allowing 140 shield, and capped healing/rage feedback claiming +80/+10 when actual +20/+2. Source build owner now uses engine received-healing and rage APIs; legacy-only healDown reduction is applied once before managed healing and missing-HP cap. No reserve actor registered on battlefield.
- Engine shield floor option retains the existing unlayered, non-stacking/non-expiring reserve shield while enforcing shieldBan/buffBan and reporting only added shield. Native layered shield stacking/expiry unchanged.
- Reserved healing carries legacyImpact provenance; bridge suppresses only its duplicate healing floater, while native heals retain normal presentation. Reserve callback owns combined actual HP/rage feedback; existing engine owns heal reduction/wound conversion and rage bans/slow/rate/cap. Negative controller drain uses engine API and displays actual removed rage. Copy/history no longer promise a nonexistent control lock.
- Validation: 34 focused tests PASS (9 new support-benefit cases + existing reserve damage/mixed heal/damage suites), real S+ bridge used in benefit harness. Includes ban expiry, combined reductions, single capped feedback, native heal presentation, native shield expiry, wound conversion and no phantom unit. Patch idempotency/drift and 15 generated scripts parse. Fresh build/full suite run in CI; screenshots/physical Safari/deploy not claimed.
- Next: remaining special action/reaction integration and actual runtime trace equivalence, then canonical mixed campaign progression/affordability simulation; activity receipt/gate coverage and final visual regression. No new art/tướng integration or balance tuning claimed.
