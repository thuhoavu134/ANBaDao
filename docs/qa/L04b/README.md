# L04b — scope vòng đời cho Chinh chiến

Trạng thái: **IN_PROGRESS**. Đã triển khai scope activation và kiểm tra re-entry
trên Chrome production; chưa đánh dấu DONE vì chưa có đo renderer/listener
độc lập, fault/lifecycle harness đầy đủ và Safari thiết bị thật.

## Phạm vi đã làm

- Thêm helper thuần `src/ui/scene-lifetime.js`: đăng ký disposer, dispose idempotent
  theo thứ tự ngược, guard callback stale, event listener, timer, RAF, observer,
  AbortController và báo lỗi dọn dẹp mà không chặn owner khác.
- `src/ui/campaign-scene.js` tạo scope mới cho mỗi lần vào Chinh chiến. Scope quản
  lý RAF/interval, ResizeObserver và image load; khi rời route, tài nguyên của
  activation bị hủy và scope cũ không thể chạy callback lên scene mới.
- DOM root/click owner của scene vẫn dùng lại một lần; `booted` guard tránh gắn
  document/reduced-motion listener lặp lại. Build owner
  `scripts/afk-chest-runtime-v1.mjs` nhúng helper trước campaign runtime.

## Test chạy thật

```text
node --check src/ui/scene-lifetime.js
node --check src/ui/campaign-scene.js
node --check scripts/afk-chest-runtime-v1.mjs
node --test tests/*.mjs
```

Kết quả: **28/28 pass, 0 fail** trong checkout hiện có.

## Production build và Chrome

- Deployment `dpl_kogrZQR2p2hkbfkHbep4PJjxndtq` từ commit
  `f675cdb0a8d5fe44b28c382652b42ba2790a90d3` đạt **READY**; CI Vercel
  `success`, build log có `Campaign scene`, `R04 return context installed`,
  embedded battle `907780 bytes` và deployment hoàn tất.
- Chrome control-browser trên `https://luc-than.vercel.app/` đã mở Chinh chiến,
  chuyển sang Tướng rồi trở lại Chinh chiến **20 vòng** bằng thao tác UI.
  Kết quả cuối: Chinh chiến vẫn hiển thị, `#hvCampaignScene` = 1,
  `#hvHeroRosterV4` = 1 và nội dung `Rương treo máy` còn hiện. Đây là bằng chứng
  re-entry/root không nhân bản; chưa phải phép đo renderer/listener.

## Chưa chạy / giới hạn

- Checkout connector không có `package.json` và toàn bộ package nên chưa chạy
  `npm test` đầy đủ; bộ `tests/*.mjs` hiện có đã chạy thật.
- Chưa đo số renderer/listener trước-sau bằng profiler, chưa fault-inject load,
  ResizeObserver, timer/RAF hay dispose exception trong browser; unit contract
  đã có các nhánh idempotent/stale/error.
- Chưa kiểm Safari iPhone/iPad thật và chưa đóng các gate L04a stale source,
  draft revision, modal/deep-link.
- Không đổi seed, reward, balance, save migration, asset, battle, audio hoặc
  hotfix thoát trận.

Commit code: `f675cdb0a8d5fe44b28c382652b42ba2790a90d3`.

## 2026-09-07 — one-shot timer cleanup slice

**Trạng thái:** `REVIEW` / `IN_PROGRESS`; this slice does not close the L04
device, profiler, fault-injection or Ticket Board gates.

- Source owner `src/ui/scene-lifetime.js` now registers a timeout disposer
  through `add`, releases it immediately after the one-shot callback fires, and
  preserves the existing handle return value and stale-callback guard.
- Focused RED was real: the new timer assertion failed because a completed
  callback left `scope.snapshot().pending === 1`.
- GREEN and REFACTOR: `node --test tests/scene-lifetime.test.mjs
  tests/return-context.test.mjs tests/campaign-scene.test.mjs` → `18/18 PASS`;
  changed owner/build-owner syntax checks pass.
- Code commit: `e37c6df342e912a3c8ef15ac2ad5ed152547db21`.
- Vercel deployment `dpl_8ZUUaBWq4z4yd58Br8piF7UNN68N` is `READY`; production
  build ran the source owner and embedded battle payload sync successfully.
- Chrome production re-entry ran 20 Tướng → Chinh chiến rounds with one visible
  roster root and one visible campaign root at the end. Browser-extension
  diagnostics were excluded; app-origin errors were `0`.

### Remaining blockers / handoff

- `TICKET_BOARD_NOT_AVAILABLE`, `DEVICE_BACKEND_NOT_AVAILABLE`,
  `SOURCE_NOT_AVAILABLE` for the Hermes archive and `game-dev: command not
  found` remain explicit.
- Local `doctor` and `smoke` scripts are not present in this repository; the
  connector checkout is also missing the full binary asset package, so local
  full build/all-test results remain blocked. Vercel build is the authoritative
  complete-source build evidence for this commit.
- Next exact action: rerun Chrome responsive plus Safari/iPhone/iPad and
  Ticket Board claim/lock/evidence when those backends are available. Keep
  `REVIEW`.

## 2026-09-08 — opt-in campaign lifecycle diagnostics

**Trạng thái:** `REVIEW` / `IN_PROGRESS`; the acceptance slice is evidenced,
but device, Ticket Board, archive and complete local asset gates remain open.

- Source owner `src/ui/campaign-scene.js` now exposes a QA-only diagnostics
  snapshot for `?qaL04b=scene-lifetime` and mirrors it to the campaign root as
  `data-qa-l04b-snapshot` for machine-readable browser evidence. The snapshot
  reports root visibility, activation generation, scope disposal, pending
  resources, timer/RAF/ResizeObserver state and image-cache size. Normal URLs
  do not get the bridge.
- Code chain: `5979d493` (diagnostic contract), `eae7b4f1` (window-location
  flag fix), `7b1f2d6c` (browser evidence bridge), `4f8511bd` (exit snapshot).
  RED was `2` real failures on the baseline; GREEN was `2/2`; REFACTOR was
  `32/32` focused PASS with syntax and diff checks clean.
- Final Vercel deployment `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` from
  `4f8511bd` is READY. The complete-source build embedded `952395` battle
  bytes and the selected runtime-error query is `0`.
- Chrome production evidence: normal route had no QA snapshot; active route
  had one visible root with `pending=8`, timer/RAF/observer `1` and image cache
  `5`; leaving the route produced `scopeDisposed=true`, `pending=0`, timer/RAF/
  observer `0` and image cache `0`. Twelve re-entry loops stayed at one root,
  one visible root and stable resource counts; app-origin console errors were
  `0`. Machine evidence:
  `docs/qa/L04b/l04b-scene-lifetime-diagnostics.json`.
- Device capabilities are `[]`; responsive Chrome/Safari/iPhone/iPad,
  Ticket Board/boot protocol, archive, doctor/smoke, `agent-browser`,
  `game-dev` and the complete local binary checkout remain unavailable.
  Local full direct tests were `185/222` pass with `37` connector asset/dist
  failures; local build is blocked by the missing Luc Anh atlas metadata.

Next exact action: run the same evidence on the device matrix and complete the
Ticket Board claim/lock/review gates when available. Keep `REVIEW`.
