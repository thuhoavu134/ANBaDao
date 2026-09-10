# L12-pointer-lifecycle/v1

Goal: khi kéo tướng ở Bày trận, chỉ pointer bắt đầu thao tác được kết thúc/hủy nó; hủy hoặc thả ngoài slot phải trả hình tướng về vị trí cũ.

Baseline remote: a6b5de61ebb4d1b136b5595766aa86b3a11fff29. Local API snapshot checkpoint: 7d49022df82a3d74768874de3c3b182471a689a7; đây không phải parent để push remote.

Ticket: TKT-0001; VibeLab run: 20260909-112610-smpj8qm. Required gates: vibelab, tdd. Không có Boot Protocol hoặc shared/state.json trong repo. Ticket Board local vừa được khôi phục từ ZIP owner cung cấp; lease/path/resource scope đã kiểm.

- L12-P1: pointer phụ không ghi đè hoặc xóa drag đang hoạt động. Pointer chủ vẫn đổi hai vị trí occupied qua swapCampaignPositions.
- L12-P2: pointercancel, lostpointercapture và thả ngoài slot không đổi draft, giải phóng capture và redraw về vị trí gốc với reduced motion.
- L12-P3: hủy màn/ra route giải phóng capture; thao tác tiếp theo hoạt động. Browser desktop kiểm drag, cancel/re-entry và tick membership; mobile/Safari là gate REVIEW riêng khi không có backend.

Source scope: src/ui/campaign-scene.js; test mới tests/campaign-pointer-lifecycle.test.mjs; evidence và handoff. Không đổi CSS, HTML layout, art, pivot, animation timing, balance, save schema, rewards hoặc scheduler. Không khôi phục visual pass 74b3976 đã bị từ chối/revert 0bac75d. Giữ Victory/Defeat/MVP.

Rủi ro: cleanup capture có thể phát lostpointercapture đồng bộ; xóa owner trước release để tránh callback lặp. Rollback bằng revert commit lát cắt trên nhánh làm việc. Release target: GitHub work branch + Vercel preview; main/production không được cập nhật.

Validation: Node VM chạy handler source thực (không phải bằng chứng thiết bị touch); source syntax; existing tests; build-static; Chrome preview qua thao tác thật. Ghi rõ lỗi môi trường/NOT_RUN; không gọi build READY là UI/mobile PASS.
