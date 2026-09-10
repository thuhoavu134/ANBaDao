## Tiếp tục 10/09/2026 — pointer lifecycle, chờ kiểm chứng bổ sung

Code trên nhánh `work/l12-pointer-lifecycle-20260909`, commit `9518581aee5b1406bcba94616be92a7cf9aaf504`. Chỉ sửa ownership và cleanup của pointer trong `src/ui/campaign-scene.js`: bỏ qua pointer khác, giải phóng capture khi hủy/rời màn, redraw khi reduced motion. Không đổi CSS, bố cục, art hoặc combat owner. Visual pass `74b3976` vẫn bị từ chối, revert `0bac75d` vẫn là quyết định áp dụng.

- RED 0/9 PASS; GREEN 9/9; focused với scene lifetime 15/15. [Evidence và giới hạn](qa/L12-POINTER-LIFECYCLE/evidence.json).
- Preview code chính xác SHA trên: https://luc-than-6fmr7sf4u-cuong-duc-ai-s-projects.vercel.app/ — Vercel READY, build hoàn tất. Đây không phải deployment production.
- Chrome desktop 1363×936, QA sandbox: kéo đổi ô có tướng, thả ngoài, hủy/quay lại, tích xanh thêm/bỏ, đội trống bị chặn, một tướng vào trận đều đã kiểm. Đã thấy Defeat và MVP động; chưa kiểm Xác nhận sau thua/restart do phiên browser reset.
- Full local direct: 413 tests, 381 PASS / 32 FAIL vì thiếu dist/assets/sharp trong snapshot. Local build thiếu atlas metadata. Không full-green; mobile/touch/Safari và reduced-motion browser chưa chạy.
- Đã đọc vibe-builder/vibe-lab/ticket-board từ zip owner cung cấp; blocker thiếu skill ban đầu đã được giải quyết trong phiên triển khai. TKT-0001 và gate evidence-review chưa đóng. Sau reset, runner/trace trong /tmp không còn; không bịa trạng thái gate hoặc lease.
- Main được đọc lại ngày 10/09: `a6b5de61ebb4d1b136b5595766aa86b3a11fff29`. Không cập nhật main/production. Owner approval còn PENDING.

Bước tiếp: khôi phục runner từ zip, tiếp tục ticket/gate; kiểm lại đầy đủ thua → Xác nhận → Chinh chiến → trận mới trong host, rồi thiết bị mobile/Safari. Chưa mở rộng sang slot trống cố định, enemy preview, redesign hoặc balance.

Các log được giữ nguyên từ phiên 09/09. Revision local là snapshot tái dựng, không phải ancestry GitHub; evidence.json ghi cả SHA local và source/test blob remote để đối chiếu.
