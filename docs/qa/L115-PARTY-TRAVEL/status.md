## 13/09 — TKT-0115: đội hành quân, đánh bầy và loot về rương

Tiếp từ main be983ff (#108 đã merge theo live của owner). Owner cho phép di chuyển bằng Idle tạm, thay quy tắc cũ chờ Run mới di chuyển. Camera theo tuyến đường 7 điểm trong map v3, quay lại liên tục không teleport; mini map đồng bộ cùng tọa độ. Cả đội đã lưu đánh đồng thời tối đa 4 quái, hai lượt Basic, giữ timing authored; thiếu Basic dùng gesture tạm.
Damage nảy, crit đỏ/cỡ lớn; hit timeline quyết định HP/death; loot rơi → nằm → bay về tâm rương đo từ HUD. Không cộng thưởng, ghi save, đổi tiến ải hoặc gọi combat scheduler. Dùng RAF/farmTime của scene, pause khi ẩn/Bày trận; reduced-motion tĩnh.
RED 3 fail trước implementation → GREEN 82/82 campaign/AFK tests (bao gồm camera/đội/quái trong 3 viewport và 12 chặng). Syntax PASS. Browser Chrome 390×844 vẫn BLOCKED do automatic approval review từ chối preview đăng nhập; Safari NOT_RUN. Không dùng tests toán thay nghiệm thu thẩm mỹ hoặc độ mượt. VibeLab runtime/browser gate chưa hoàn tất; ticket-file fallback, không claim giả.
PR mới, chưa merge/deploy. Chờ live riêng cho PR này sau khi owner xem.
