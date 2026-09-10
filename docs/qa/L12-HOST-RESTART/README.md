## 10/09/2026 — QA sau thua và restart trong host

Đã kiểm Chrome trên preview code `235c66699a0340f36300b1d3c54d4039217ede8f`, QA sandbox không lưu: đội một Ông Phở vào ải1-1 → Defeat → Xác nhận → Chinh chiến → mở trận mới ngay trong cùng trang, không reload.
- Defeat hiệp4/18 actions; MVP Ông Phở1568 damage/1 kill; không thưởng.
- Xác nhận giữ ải1-1, vàng500/ngọc800; đội một tướng giữ nguyên; thể lực114 sau lần xuất chiến đầu.
- Cleanup: sfxActive0, sfxBattleActive false; iframe cũ about:blank.
- Mở lại: một slot Ông Phở tích xanh; trận1v4 chạy lại, thể lực108 (đúng thêm6), một iframe, màn Xác nhận cũ không hiển thị, audio active/ultimate trở lại. Quan sát hiệp2 của trận mới.
- Thoát trận mới bằng Chinh chiến: active0, battleActive false, iframe about:blank.
- Query console error filter luc-than trả0; có lỗi metadata của extension ở query không lọc.
Chưa thấy lỗi trong mẫu này; không đổi runtime. Không suy ra toàn bộ callback/VFX leak, audio listening hoặc stress matrix đã PASS. Mobile/Safari vẫn NOT_RUN (backend không có emulation/device). Main/production giữ nguyên; visual pass bị từ chối vẫn không khôi phục.
Evidence: [host defeat/restart](evidence.json). Tiếp theo: mobile/touch cancel khi có device backend; enemy preview/power/art lấy đúng dữ liệu là lát cắt riêng.

