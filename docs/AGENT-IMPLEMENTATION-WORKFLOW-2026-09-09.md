# Quy trình triển khai và bàn giao đã dùng — Hồn Việt, 09/09/2026

Quy trình này ghi lại cách thực hiện phiên vừa được chủ dự án duyệt. Dùng cùng AGENTS.md và VIBE-WORKFLOW-RULES.md; không thay quyền chủ dự án, không bỏ gate hoặc giả evidence khi thiếu công cụ.

## 1. Khôi phục đúng mốc trước khi code

Đọc bàn giao mới nhất; xác minh remote main/head SHA. Phân biệt checkpoint code, checkpoint docs, preview và production. Những câu “chưa release” trong log lịch sử không ghi đè quyền mới hơn. Không chạy lại phần hoàn thành nếu chưa có rủi ro cụ thể cần kiểm.

Nếu checkout bẩn hoặc là snapshot tổng hợp, kiểm status và giữ công việc đang có. Ưu tiên checkout/worktree biệt lập từ remote thật. Không lấy local master không đáng tin làm parent để push main.

## 2. Chuyển reference thành contract thao tác

Với từng ảnh/video ghi: màn nào → thao tác nào → trạng thái trước/sau → owner lưu trạng thái → màn tiếp. Phân biệt cảnh AFK với combat. Ví dụ tích xanh là membership trong đội; chạm lần nữa bỏ tướng, không chỉ thay viền lựa chọn. Tách điều đã thấy/được chủ dự án giải thích khỏi phần chưa xem.

Giữ thiết kế đã duyệt và bản sắc/asset Hồn Việt. Thiếu hình cho tính năng được giao thì sản xuất asset thật, lưu prompt/provenance; không thay nhân vật chính thức hoặc dùng ảnh concept giả animation/VFX production. Text/chỉ số vẫn sống.

## 3. Tìm đúng owner rồi làm lát cắt nhỏ

Tìm nguồn bằng rg, lần route → command → state → render → build patch. Trong phiên này tái sử dụng canvas/scene clock, save transaction và result-action M0/P0; tránh thêm listener, timer hay reward owner thứ hai.

Hero detail chuyển node idle/stats/upgrade hiện có vào layout, không clone một UI mất handler. Campaign partial squad mở bằng option riêng, không nới validator toàn game. Kết quả truyền intent confirm/next qua payload cũ, không dùng listener cạnh tranh.

Nếu chia Luna: giao một phạm vi file riêng + contract + test bắt lỗi; main agent đọc/review và tích hợp. Không dùng song song trên cùng file build owner.

## 4. Kiểm đúng rủi ro của thay đổi

Dùng RED khi thay behavior rồi kiểm GREEN hành vi thực, không chỉ kiểm chuỗi source. Kiểm save/load giữ đội một tướng; confirm không start lần hai; next bắt đầu trận độc lập; thua không tăng ải; cleanup hết dialog/target.

Chạy build qua scripts/build-static.mjs; so battle độc lập và embedded payload. Lỗi parity do scratch đồng bộ phải xác minh bằng source biệt lập, không xóa test. Thiếu sharp ghi là lỗi môi trường, không gọi full suite PASS.

Với crop: xem đủ vùng atlas/contact sheet trước; thử gutter nhỏ, thấy vẫn lộ mép thì điều chỉnh source rect lên 12×12. Không sửa alpha/art bytes để che lỗi crop. Browser kiểm viewBox thực và ảnh; sample Nung không đại diện đủ 126 runtime icons.

## 5. Evidence tách bạch

Ghi riêng: source tests, build, browser desktop, mobile viewport, Safari/device, owner visual approval, deployment. READY không đồng nghĩa UI PASS. Đưa SHA, command, counts, URL/deployment ID, scope và phần chưa kiểm vào evidence.

Quay/chụp bằng thao tác thật khi có browser. Không giả screenshot hoặc tự suy runtime đạt từ tests. ERR_BLOCKED_BY_CLIENT và thiếu viewport là blocker cụ thể; chuyển sang backend khả dụng hoặc ghi NOT_RUN, không lặp retry vô hạn. Không lưu token/link bypass protection vào repo.

## 6. Upload và preview

Kiểm quyền đã có trong phiên, không hỏi lại việc đã được cho phép. Upload đúng source/build/tests/docs/assets cần cho tác vụ lên nhánh làm việc. Khi công cụ automatic review từ chối, ghi rõ action và lý do; dùng cách an toàn hơn hoặc xin đúng quyền còn thiếu, không lách access control.

Nếu GitHub connector khả dụng nhưng không có checkout sạch: có thể dùng Git data API theo thứ tự create_blob → create_tree(base tree thật) → create_commit(parent remote thật) → update_ref(force:false). Chỉ đưa changed paths, giữ toàn bộ phần còn lại. Đây là lựa chọn kỹ thuật, không phải cách vượt branch protection. Dừng khi lỗi; không đoán SHA hay force-push.

Sau upload kiểm preview đúng SHA và READY trước khi mời duyệt. Chỉ đọc metadata cần thiết; tránh dump diff/index.html/base64 khổng lồ, không đưa secret vào log.

## 7. Gộp bản được duyệt lên main

Khi chủ dự án yêu cầu main, kiểm main có auto-deploy production và nêu rõ tác động. Đọc compare/mergeability. Phiên này diverged 11/1, main chỉ thêm docs; giữ cả lịch sử main và continuation mới, đánh dấu số liệu cũ là lịch sử.

Hòa giải main vào nhánh bàn giao với hai parent thật, dùng head tree làm nền; xác nhận runtime/assets blob SHAs không đổi so candidate được duyệt. Kiểm conflict markers và JSON. Re-read refs trước mutation, update force:false, merge PR với expected_head_sha. Nếu upstream di chuyển hoặc protection chặn, đánh giá lại bình thường, không vô hiệu hóa bảo vệ.

Thực tế: candidate 2f8049c → merge history ef5c89a → PR #17 merge f8ebc1a. Không chạy lại toàn bộ tests vì phần hòa giải chỉ docs; build production vẫn được Vercel thực hiện.

## 8. Xác minh và bàn giao

Poll deployment thời gian ngắn; xác nhận target=production, meta.githubCommitSha đúng merge, state=READY và alias luc-than.vercel.app thuộc deployment. Nếu ERROR thì đọc build logs trước khi kết luận. Chỉ thông báo live khi đủ chứng cứ.

Cập nhật một trang bàn giao hiện hành, source map, mục còn mở, link evidence và prompt tiếp tục. Gắn đường dẫn vào AGENTS.md để agent sau tìm thấy ngay. Lưu lịch sử nhưng không để “latest” cũ trở thành lệnh làm lại.

Lưu ý kỹ thuật: batch read độc lập, serialize mutation phụ thuộc; kiểm từng kết quả. Tool output có thể dùng structuredContent trực tiếp hoặc JSON trong content.text, phải đọc cấu trúc thật. Không nội suy nội dung PR/shell bằng JSON.stringify như thể shell escaping; ưu tiên structured args hoặc body-file.
