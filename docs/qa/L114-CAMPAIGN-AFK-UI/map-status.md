## 13/09/2026 — TKT-0114 bản đồ hành quân + mini map

Owner từ chối nền sân v2, yêu cầu bám góc nhìn bản đồ của video. Bản v3 nhìn từ trên xuống có đường nối cầu/làng/cổng; cảnh chính, mini map và bản đồ mở rộng dùng cùng một ảnh. Viewport và dấu đội dùng đúng phép chiếu; không mô phỏng tiến ải. Thiếu Run: giữ Idle và camera tĩnh.
76/76 test Chinh chiến/AFK PASS sau RED 2 lỗi thiếu map. Syntax PASS. Chờ CI revision mới. Chrome visual/actions vẫn BLOCKED do preview yêu cầu đăng nhập Vercel đã bị auto-review từ chối; Safari NOT_RUN. Chưa nghiệm thu thẩm mỹ.
Tiếp tục PR108, không merge hoặc deploy. AC11: mini map đồng nhất cảnh, mở/đóng được qua handler cũ. Thuật toán được kiểm thử; thao tác UI thật chưa được kiểm chứng.

