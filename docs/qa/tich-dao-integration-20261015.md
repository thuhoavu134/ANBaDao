# Tích Đạo — tích hợp tướng authored S+ (2026-10-15)

Branch `feat/tich-dao-integration-20261015` từ main `0aa0c86` (đã gồm #306/#307). Draft PR, **chưa merge, chưa deploy**. Người duyệt cuối: anh Cường Đức. Thông số kit là **review defaults** theo brief.

## Contract
- Asset nguồn: `tich-dao-six-state-phase-aware.zip` SHA-256 `3a4c6a…eab` (đã xác minh trước khi giải nén). 6 state 18 frame, cell 480×440 **trùng khớp grid atlas action Kỷ Vân** — không lệch chuẩn, không upscale.
- Idle 77 frame được repagination không mất dữ liệu sang 9 trang 3×3 (9 frame/trang) để một trang decode ≈7.3 MB < gate 14 MB (trang 8×8 gốc sẽ decode 54 MB). Source PNG pack không vào repo; chỉ webp phái sinh + `runtime-meta.json` + script convert `scripts/tich-dao-convert-v1.mjs` (provenance SHA-256 ghi trong meta).
- Ultimate giữ **đúng timeline 4.0s / 9 phase** của pack (phase-segments.json → `ultimateTimeline`). Phase-03 và phase-05 **ẩn toàn bộ sprite** (không vẽ frame, không fallback standing, không đụng visibility cache), HP bar giữ nguyên. Damage 3 nhát vào đúng `strikeMs = [1083, 1750, 2917]` (đầu phase-04/06/08).
- Basic retiming 900ms, hit 350ms, run 750ms (tiền lệ Tiêu Phong); fall-die giữ 4000ms trong meta, runtime nén về 900ms/speed như KV/TP. Không shorten authored ultimate.
- Kit (review defaults): Basic "Ảnh Trảm" assassin targeting (hàng sau yếu nhất); Ultimate "Tịch Ảnh Liên Trảm" 0.7/0.9/1.0× ATK, nhát 3 35% chí mạng ×1.8, hạ gục ≥1 mục tiêu → `stealth` 1 lượt recipient-turn; Passive "Ảnh Bộ" lần đầu <40% máu → stealth 1 lượt. Không Skill 1 (`canUse` gate + `performAction` skill→basic rewrite, bài học #307).

## RED → GREEN
- RED: `tests/tich-dao.test.mjs` — **6/8 fail thật** trước khi hiện thực (registry, targeting basic, targeting ultimate, 3 nhát deferred, stealth khi hạ gục, passive 40%); 2 test pack-contract pass vì asset đã convert + verify xong. Capture: `red.txt`.
- GREEN: 8/8 pass. Bổ sung `tests/tich-dao-runtime.test.mjs` (5 test: idle native 480×440 + prefetch, 9 phase vẽ đúng cell + 2 gap ẩn không một pixel, marker release authored, battle patch idempotent trên battle.html thật, host compose sau KV+TP). Mở rộng `new-hero-result` (slug tich-dao, nhánh pageFrames từ idleVisual), `new-hero-visibility` (5 case visibility), `account-stars` (17 id), `legacy-skill-map` (ids + tên ultimate).
- **Full suite: build + 1793 test — 1779 pass / 14 fail.** Cả 14 fail **tái hiện trên worktree main sạch `0aa0c86`** (bug Windows-local: `new URL().pathname` → `C:\C:\` trong spawn/read + expectation idle registration cũ ở `ky-van-runtime`/`authored-idle-integration`/`tieu-phong-runtime`/`auto-rage-cycle`/`thay-mo-rage-rotation`/`ky-van-host`/`loading-lossless`) → **0 regression**. Linux CI (workflow `tich-dao-qa.yml`) là nguồn sự thật cho các test này.

## Browser QA (Chromium thật, CDP — `scripts/qa-tich-dao.mjs`)
Cả hai viewport **390×844 và 1280×800: PASS** — `evidence/tich-dao-fixes/report.json`, log `browser-qa.log`.
- Hero detail: canvas idle chạy (16 frame), canvas nằm trong stage, tên dưới canvas, poster ẩn — đều true.
- AFK campaign: squad label "Đội đang thám hiểm: Tích Đạo, …", 113–114 frame, đủ 9 trang idle-authored + run + basic.
- `/tich-dao-test.html`: ultimate start → marker:release → marker:impact → marker:recovery → action:complete, về vị trí 0px.
- Battle thật `qaForceAuthoredAction`: 17 cell ultimate khác nhau; **2 khoảng trống vẽ (vanish gap) được chứng minh bằng draw log** (≥45ms quanh 1.0s, ≥150ms quanh 1.5s, chịu offset lease tới ~200ms); phase 02/04/06/08 có vẽ đúng cửa sổ. 0 runtime exception, 0 asset HTTP error.
- 18 screenshot đã đọc trực tiếp: battle idle đội hình đúng tỷ lệ (đăng ký 310/422 world-px đo từ alpha frame idle đầu), phase ẩn **mất toàn bộ body, chỉ còn HP bar**, hiện lại đúng slot, desktop phase-08 thế đánh cuối, hero detail full. `physicalIphone`: **NOT_RUN**.
- Video tốc độ thật: **NOT_RUN** (không ghi hình CDP; preview MP4 của pack nằm ngoài game runtime).

## Tạm / chờ owner
- `avatar.webp` là **ảnh tạm** cắt từ idle frame 53 (`art.pending`), portrait authored chờ owner.
- **Chưa có SFX authored** cho basic/ultimate/hit — runtime không gọi SFX cho Tích Đạo (không 404, không fabricate).
- Thông số kit + host dataset stats (hp 920/atk 138/def 50/spd 122) là review defaults chờ duyệt.
- Không đụng Gọi Mộng showcase (`summon/showcase.mjs`) — ngoài phạm vi brief.
- KHÔNG merge / KHÔNG deploy production. Safari/iPhone thật NOT_RUN.

## QA checkpoint follow-up (16/10/2026) + CI status
Đối chứng 3 ghi chú của Tôm với commit `e4239ed` (bằng chứng lệnh, không cần commit mới):
1. **review PNG**: `git show --stat` / `git ls-files` / worktree — 0 file `review-idle-page-*.png` (đã xoá trước khi stage; chỉ webp phái sinh + meta vào repo).
2. **Phase map**: `runtime-meta.json` (đã commit) chứa `ultimateTimeline.phases` đủ 9 phase phủ frame 0–95; phase-03/05 `visible=false, cells=0`; `src/runtime/tich-dao.js` lookup `elapsed` → phase (dòng 22) và `hidden=!phase.visible` (dòng 42); `clips.ultimate.strikeMs=[1083,1750,2917]` = đầu phase-04/06/08. Đã chứng minh bằng draw-log QA (2 gap vẽ) + screenshot phase ẩn chỉ còn HP bar.
3. **Patch owner**: `git diff main...HEAD` — 0 sửa trực tiếp `battle.html`/`index.html`; toàn bộ qua `scripts/tich-dao-runtime-v1.mjs` do `scripts/build-static.mjs` install sau `installTieuPhong`.

**CI trên PR #308: FAIL hạ tầng billing** — mọi workflow (CI/CD, Hero visibility review, New hero result identity review, Tich Dao integration QA) kết thúc sau 3–5s với annotation GitHub: *"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings"*; job có **0 steps** chạy (ví dụ run 38778646696). Đây là lỗi billing/spending limit tài khoản GitHub chỉ owner xử lý được, trùng đúng blocker hạ tầng đã ghi từ 25/09. Không phải assertion failure — không rerun tiêu quota cho tới khi owner sửa billing; local full suite (1793 test) + browser QA Chromium là bằng chứng hiện hữu của PR.
