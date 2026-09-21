# Agent Workflow Handoff — Lục Thần / Hồn Việt: Mộng Giới

Cập nhật: 2026-09-21  
Source-of-truth: GitHub repo `bktimmy247/luc-than`  
Baseline hiện tại: main `2a75e2b1e53fc755f2ee9616e6134c405d6cf9d1` (merge PR #178)

## 1. Mục đích
Tài liệu này mô tả **cách đang phát triển game**, không chỉ trạng thái một PR. Agent mới phải đọc tài liệu này trước khi sửa để tiếp tục đúng quy trình, không làm lại phần đã hoàn thành, không bỏ qua QA hình ảnh và không nhầm deploy với source.

Nếu main đã tiến xa hơn SHA ở trên thì luôn lấy main mới nhất làm baseline, sau đó dùng tài liệu này như contract quy trình.

## 2. Thứ tự đọc bắt buộc
1. `AGENTS.md`
2. file này
3. `vibelab.json`
4. `docs/ui-ux-reference-parity.md`
5. handoff chuyên đề liên quan, ví dụ `docs/BATTLE-READINESS-INTEGRATION-2026-09-19.md`
6. code owner thực tế của màn/hệ thống cần sửa
7. test/QA script đang khóa hành vi đó

Không suy diễn trạng thái từ chat cũ. GitHub main + PR merge + CI là bằng chứng chính.

## 3. Cách làm cho mỗi task

### A. Xác minh baseline
- Đọc main HEAD.
- Đọc PR gần nhất đã merge quanh vùng code cần sửa.
- Tìm test hiện có trước khi thêm test mới.
- Xác định đúng owner runtime. Không vá vào file trung gian nếu build sau đó overwrite.
- Ghi rõ cái gì đã PASS và cái gì còn UNVERIFIED.

### B. Branch nhỏ, patch nhỏ
- Tạo branch mới từ main HEAD.
- Mỗi branch chỉ giải một blocker hoặc một lát cắt rõ.
- Không rewrite toàn bộ subsystem khi sửa nhỏ đủ giải root cause.
- Không đổi combat math/save/reward/auth nếu task không cần.
- Không thay asset gốc chỉ để chữa layout/runtime nếu có thể sửa owner hiển thị.

### C. Test trước khi merge
Tối thiểu:
- `npm run build`
- `node --test --test-concurrency=1 tests/*.test.mjs`
- browser QA phù hợp vùng sửa.

CI hiện chạy:
- Build
- full Node test suite
- `scripts/qa-battle-readiness-browser.mjs`
- `scripts/qa-authored-legacy-browser.mjs`
- `scripts/qa-skill-test-browser.mjs`
- `scripts/qa-result-motion-browser.mjs`
- `scripts/qa-round15-result-flow.mjs`

Không kết luận PASS chỉ vì build xanh nếu UI/gameplay chưa có browser evidence.

### D. UI/game visual hard gate
Mọi thay đổi nhìn thấy phải theo vòng:
`render → screenshot → inspect → interact → screenshot lại → kiểm console/asset errors`.

Yêu cầu:
- desktop Chromium
- mobile Chromium
- bấm primary action thật
- đọc ảnh thật và mô tả observation cụ thể
- kiểm tra clipping/overflow/safe-area/black gap/asset missing
- runtime exception = 0 cho vùng acceptance
- asset error = 0 cho vùng acceptance

Responsive Chromium **không** được gọi là physical iPhone/Safari. Nếu chưa có máy thật thì ghi `UNVERIFIED`.

### E. PR và merge
- PR phải ghi scope, non-goals, acceptance, evidence.
- Không merge khi CI đỏ.
- Nếu CI bị cancel ngoài ý muốn, đọc log rồi rerun; không gọi đó là test failure khi không có assertion failure.
- Trước merge UI: đọc artifact screenshot/report, không chỉ nhìn dấu xanh.
- Merge xong mới coi main đã nhận thay đổi.
- Sau merge, nếu thay đổi workflow/contract/owner thì cập nhật tài liệu handoff này.

## 4. Delivery/build owner quan trọng

### Build pipeline
`scripts/build-static.mjs` là pipeline build static. Các patch runtime phải được áp dụng trước khi payload battle cuối cùng được nhúng vào `dist/index.html`.

Cuối pipeline hiện có:
- apply result motion patch
- đọc `dist/battle.html`
- base64 embed chính xác payload đó vào `dist/index.html`

Vì vậy khi sửa battle visible trong iframe phải kiểm tra **owner cuối** của build, không chỉ file source ban đầu.

### Result screen owner
Hiện màn Victory/Defeat được khóa bởi:
- `scripts/result-character-motion-v1.mjs`
- `scripts/qa-result-motion-browser.mjs`
- `scripts/qa-round15-result-flow.mjs`

Không tạo owner animation thứ hai nếu có thể sửa owner này.

## 5. Contract Victory/Defeat hiện tại — đã merge
PR #174 đã merge vào main ở `f535494f...`.

Phải giữ nếu task không yêu cầu đổi:
- Victory: hero **Run → Idle**, không tự chuyển ải.
- Victory có nút `Xác nhận` và `Ải sau`.
- Defeat: hero **Fall đúng một lần → giữ frame cuối**.
- Result card phải phủ xuống đáy, không còn dải đen dưới màn hình.
- Hero phải nằm trong vùng focus của cánh, không tụt xuống phần chữ.
- full flow 15 hiệp vẫn phải hoạt động.
- không thêm chữ “Thắng” ngoài thiết kế đã khóa.

Anchor hiện tại trong injected CSS:
- Victory authored hero-wrap top: `13.5%`
- Defeat mobile authored hero-wrap top: `11.5%`

Không thay các giá trị này theo cảm giác. Nếu thay phải có screenshot/measurement mới và test regression.

## 6. Browser QA hiện tại cần hiểu đúng

### Result Motion QA
Acceptance bao gồm:
- Victory Run có nhiều frame thật.
- chuyển sang Idle và Idle tiếp tục frame.
- touch target nút >= 44px.
- Defeat Fall chỉ 1 cycle và giữ frame cuối.
- card bottom gap <= 2px.
- authored hero checks PASS.
- runtime exceptions = 0.
- result asset errors = 0.

### Round 15 QA
Script ép trận 6v6 HP cao để runtime thật đi đủ 15 hiệp, không mock combat function.
Các case hiện gồm:
- victory confirm x1
- victory next x2
- victory confirm x3
- defeat back x3

Task nào ảnh hưởng result/campaign phải giữ gate này xanh.

### Battle VFX QA
Dùng cho asset readiness, VFX/SFX, action path và host iframe flow. Không dùng một screenshot VFX để suy ra toàn bộ layout/game đã hoàn hảo.

### Direct Skill Test QA
Màn `/skill-test.html` là bề mặt test trực tiếp đã merge ở PR #178:
- chọn Lục Ảnh / Đình Lôi / Ông Phở;
- bấm Basic / Skill / Ultimate để ép production action hook trên trận 6v6 thật;
- status dựa trên trace thật: action:start → marker:impact → action:complete;
- Reset tạo battle session mới;
- build phải copy màn này vào `dist`;
- `scripts/qa-skill-test-browser.mjs` phải click đủ 9 action + Reset ở desktop/mobile.
Favicon 404 và Media request bị hủy do Reset iframe được giữ trong raw audit nhưng không tính là critical; mọi HTTP/network failure khác vẫn phải làm gate đỏ.


## 7. Checkpoint gần nhất đã xác minh
PR #178 — `feat: add direct skill test surface`
- merge commit: `2a75e2b1e53fc755f2ee9616e6134c405d6cf9d1`
- tested head: `d420486da0f7105750b7fc34561123eb74a79002`
- CI run #566: **SUCCESS**
- Build + full Node tests PASS
- Battle VFX browser QA PASS
- Authored legacy hero browser QA PASS
- Direct skill-test browser QA PASS desktop 1280×800 + mobile 390×844
- Lục Ảnh / Đình Lôi / Ông Phở: Basic / Skill / Ultimate đều có start → impact → complete và về home 0px trong report
- Reset tạo session mới và trở lại ready
- direct report: exceptions=0; criticalHttpErrors=0; criticalNetworkFailures=0; qaErrors=0
- Result Motion QA PASS
- Round-15 result-flow QA PASS
- screenshot đã review: controller không che đội hình desktop; mobile không overflow ngang; IMPACT/action state đọc được; VFX authored vẫn hiển thị
- physical iPhone/Safari: **NOT RUN**
- production/Vercel của route `/skill-test.html`: phải kiểm riêng; GitHub source PASS không đồng nghĩa đã live

PR gần trước liên quan:
- #175: certify Lục Ảnh / Đình Lôi / Ông Phở Basic/Skill/Ultimate trên runtime thật
- #174: result hero wing alignment
- #171: gate card bottom coverage
- #170: remove mobile Defeat bottom gap
- #169: faster VFX + Linh Đồng/Bạch Diện readiness + Đình Lôi return stabilization
- #168: 15-round result flow browser QA
- #167/#166: result motion readiness
- #165: Victory manual next/confirm
- #162: battle asset readiness/SFX/VFX repair
- #161: per-skill movement positions

Không reopen vấn đề đã khóa nếu chưa có regression evidence.

## 8. Quy tắc movement/combat đang theo
- Vị trí tung chiêu là theo skill, không phải mọi tướng đứng cố định một chỗ.
- Ranged có thể tiến lên gần mục tiêu giống reference.
- Melee/ranged dùng movement owner hiện tại; tránh tạo scheduler thứ hai.
- Damage vẫn phải resolve sau authored VFX.
- Normal damage và crit feedback phải giữ hành vi hiện tại.
- Lục Ảnh Ultimate giữ anchor vùng giữa đội hình địch và không screen shake nếu không có yêu cầu mới.
- Không tự thay combat math khi đang sửa presentation.

## 9. Asset/SFX/VFX
- Không dùng placeholder để tuyên bố complete.
- Không tự tích hợp asset demo độc lập nếu user chưa yêu cầu tích hợp.
- Khi đã là task tích hợp game, phải kiểm asset load trên đường runtime thật.
- Cache/lease đã được dùng để giữ asset qua action/recovery; không quay lại kiểu load/xóa mỗi chiêu.
- Shared audio bus là owner; không tạo audio owner cạnh tranh.
- “Có file âm thanh” không bằng “đã phát”; browser QA phải xác nhận playback path.
- Decoded cache cap không được gọi là tổng RAM thiết bị.

## 10. GitHub vs Vercel
GitHub/source và Vercel/deploy là hai lớp khác nhau.

Hiện đã từng có Vercel failure do quyền/team membership. Vì vậy:
- CI GitHub xanh + merge main = source đã hoàn tất cho scope đó.
- Vercel đỏ **không** được mô tả thành source test fail.
- Ngược lại, không được gọi là `live`/production nếu Vercel chưa deploy thành công.
- Chỉ xử lý deploy khi task yêu cầu live/deploy; đừng để deploy permission chặn việc source/GitHub nếu user chỉ yêu cầu code.

## 11. Những điều cấm
- Không dựa vào branch cũ sau khi main đã tiến lên.
- Không merge stale PR chỉ vì title có vẻ đúng.
- Không sửa lại phần đã PASS mà không có regression.
- Không tuyên bố UI “mượt/đẹp/xong” nếu chưa xem screenshot mới.
- Không gọi responsive browser là thiết bị thật.
- Không bịa số test, FPS, RAM, screenshot, deploy.
- Không force-push main.
- Không thay source-of-truth gameplay bằng mock QA.
- Không làm mất fractional durations đang dùng trong combat timing.
- Không tự roll Combat V2 lên production nếu chưa có quyết định mới.

## 12. Cách bàn giao cho agent kế tiếp sau mỗi vòng
Mỗi vòng có thay đổi đáng kể phải ghi:
1. main SHA sau merge
2. PR số bao nhiêu
3. file owner đã đổi
4. acceptance nào PASS
5. CI run nào
6. screenshot/report nào đã đọc và observation
7. cái gì còn UNVERIFIED
8. bước tiếp theo thực sự còn mở

Nếu workflow không đổi, chỉ cần cập nhật checkpoint ngắn; không rewrite tài liệu lịch sử.

## 13. Bước tiếp theo sau tài liệu này
Khi được yêu cầu “tiếp game”, trước tiên:
- refresh main HEAD
- rà open PR/backlog/docs
- dùng `/skill-test.html` khi cần xem trực tiếp authored skill của Lục Ảnh / Đình Lôi / Ông Phở
- chọn blocker gameplay/UI cao nhất còn đỏ
- **không đụng lại Victory/Defeat hoặc direct skill-test đã PASS nếu chưa có regression evidence**
- thực hiện theo quy trình ở trên và lưu evidence trước merge.
