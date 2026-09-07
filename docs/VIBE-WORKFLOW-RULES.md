# Quy tắc phát triển Lục Thần — Vibe Builder + VibeLab

Cập nhật: **07/09/2026**

Tài liệu này là quy tắc làm việc chính thức cho các AI tiếp tục repo bktimmy247/luc-than. Hai skill bắt buộc là **vibe-builder** và **vibe-lab**. Đây là hai skill riêng, có trách nhiệm khác nhau.

## 1. Hai skill cốt lõi

### vibe-builder — xây sản phẩm

- Là entrypoint xây và mở rộng game/app.
- Main agent là product lead và builder; mặc định **code trực tiếp**, chỉ delegate một phần thật sự nặng khi cần.
- Chịu trách nhiệm quyết định sản phẩm, UI/UX, source code, build, sửa lỗi và báo cáo dễ hiểu.
- Với thay đổi tiếp tục qua nhiều phiên, giữ cập nhật brief/design/changelog/project memory phù hợp.
- Không sửa dist/ như nguồn bàn giao. Sửa source hoặc build-patch rồi tạo lại runtime.
- Với project hiện có: đọc handoff trước, kiểm tra trạng thái Git, xác định phạm vi/ticket và tạo checkpoint trước thay đổi runtime.
- Mọi thay đổi runtime phải có kiểm thử RED → GREEN → REFACTOR và kiểm tra UI thực tế trước khi báo hoàn tất.

### vibe-lab — cổng chất lượng và bằng chứng

- Là gate bắt buộc trước khi triển khai và trước khi kết thúc thay đổi runtime.
- Chịu trách nhiệm contract, acceptance IDs, quality tier, ticket, claim/lease/lock, TDD, evidence và handoff.
- ticket-board là nguồn sự thật cho trạng thái ticket; không tự suy đoán trạng thái từ hội thoại.
- Builders chỉ chuyển ticket tới **REVIEW** và bàn giao; không tự chuyển sang MERGED hoặc DONE.
- vibe-builder gọi vibe-lab; không đảo ngược trách nhiệm để VibeLab quyết định sản phẩm thay Builder.

## 2. Thứ tự bắt buộc cho mỗi thay đổi

1. Đọc AGENTS.md, mục hiện tại của docs/LUNA-HANDOFF.md, progress, execution plan và các tài liệu nguồn liên quan.
2. Xác nhận contract: goal, phạm vi, non-goals, quality tier, release target và acceptance IDs.
3. Chọn hoặc tạo ticket; claim ticket, kiểm tra lease và khóa path/resource trước khi sửa.
4. **RED:** viết test nhỏ nhất cho acceptance criterion và chạy để ghi failure thật.
5. **GREEN:** sửa tối thiểu để test đạt.
6. **REFACTOR:** cải thiện cấu trúc khi test vẫn xanh; không đổi phạm vi ngầm.
7. Chạy pipeline phù hợp: syntax/typecheck, npm test, build, smoke, browser/UI test và kiểm tra production khi tác vụ yêu cầu.
8. Gắn evidence theo revision/commit cho từng acceptance ID; phân biệt rõ test source, Chrome responsive, production và Safari/iPhone thật.
9. Cập nhật project memory/changelog/handoff; chuyển ticket tới REVIEW và bàn giao next action.
10. Commit/push đúng repo và nhánh được phép. Không force-push, không ghi đè thay đổi chen vào; nếu main đổi, lấy baseline mới và áp lại thay đổi.

## 3. Quy tắc riêng của Lục Thần

- Game hiện là HTML/JavaScript + Canvas 2D, shell index.html, iframe battle.html, build owner là scripts/build-static.mjs.
- Ưu tiên sửa source module hoặc patch script nhỏ, có marker/build assertion; hạn chế sửa trực tiếp hai HTML lớn.
- Giữ một owner cho router, combat scheduler, audio event và transaction; không thêm listener/controller thứ hai để che lỗi.
- Giữ identity Hồn Việt, save ownership, luật combat, seed, reward, asset và các quyết định đã chốt nếu ticket không yêu cầu đổi.
- Khi tái sử dụng code mẫu Hermes, đọc docs/HERMES-CODE-REUSE-GUIDE.md, port có chọn lọc vào owner hiện tại, ghi dependency/khác biệt và thêm test; không đưa nguyên bundle Cocos vào runtime.
- Không tuyên bố runtime PASS chỉ từ build. Với thiết bị thật, báo riêng Chrome responsive và Safari/iPhone/iPad.
- Khi có lỗi ảnh/render, dùng evidence UI/render thực tế; không thay tướng chính thức bằng ảnh sinh mới nếu chưa được yêu cầu.

## 4. Skill hỗ trợ thường dùng

| Nhu cầu | Skill ưu tiên |
|---|---|
| GitHub, issue, PR, CI | github, gh-issues |
| Kiến trúc và code | repo-harness, project-context-wiki, addy-source-driven-development, addy-code-review-and-quality |
| UI/UX | addy-frontend-ui-engineering, adaptive-ui |
| Debug và kiểm thử trình duyệt | addy-debugging-and-error-recovery, addy-browser-testing-with-devtools, browser-automation |
| Hiệu năng | addy-performance-optimization, game-performance-optimization |
| Asset và render game | codex-imagen, game-asset-production, game-asset-vendoring, game-visual-debugging |
| Bảng ticket/evidence | ticket-board, workspace-board |

Chỉ kích hoạt skill hỗ trợ khi task thực sự cần; không dùng skill để mở rộng phạm vi.

## 5. Ngoại lệ và blocker

- Docs-only hoặc thay asset không ảnh hưởng runtime có thể dùng kiểm tra thông thường; mọi thay đổi ảnh hưởng code, UI interaction, persistence, export, migration hoặc release phải qua gate đầy đủ.
- Nếu một gate, ticket board, contract, test harness hoặc skill cần thiết không khả dụng, báo blocker cụ thể; không âm thầm bỏ qua hoặc hạ tiêu chuẩn.
- Không tắt test, xóa evidence, dùng --force, đổi seed/balance/reward hoặc sửa file ngoài path scope chỉ để đạt trạng thái xanh.

## 6. Mẫu báo cáo hoàn thành

Báo ngắn gọn nhưng phải có:

- ticket và contract revision;
- acceptance IDs;
- RED failure, GREEN result và REFACTOR result;
- syntax/test/build/doctor/smoke/browser/device/deployment đã kiểm tra;
- commit và trạng thái REVIEW/handoff;
- giới hạn chưa kiểm chứng và next action.

AGENTS.md và docs/LUNA-HANDOFF.md phải trỏ về tài liệu này để model tiếp theo luôn đọc được.
