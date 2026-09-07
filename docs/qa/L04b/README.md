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
