# Linh Đồng — authored combat kit

Nguồn: Blender 5.1.2 compositor master render từ video nguồn 1920×1080 (isolated character vs VFX).
Pack: native-size runtime atlas, không lấy Viewer Node 256×256.

- Character: cell 480×440, chân đáy-giữa. Không crop từng frame.
- VFX: cell 440×248, lưới 10 cột.
- ATK char + VFX/SFX dùng cho đánh thường và kỹ năng 1. ULT char + VFX/SFX cho tuyệt kỹ.
- Encode: WebP lossless RGBA. Không key màu đen.
- Kích thước hiển thị gameplay giữ nguyên; runtime downscale nhẹ thay vì upscale cell 347×320.
- Cache decoded RGBA đã nâng có giới hạn 128 MiB để giữ an toàn mobile.
