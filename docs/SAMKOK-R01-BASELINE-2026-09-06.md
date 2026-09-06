# R01 — Samkok v2 baseline và roster capacity

Ngày ghi nhận: 2026-09-06  
Repository: [bktimmy247/luc-than](https://github.com/bktimmy247/luc-than)

## Baseline source

- Branch chuẩn: `main`
- Commit hiện tại lúc bắt đầu R01: `97c62f0cd22fff64d23ecb76659d8fee1c119ca7`
- Commit message: `fix: render authored MVP portrait in Victory result`
- Package: `v3.26.0`
- Production: `https://luc-than.vercel.app/`
- Build chain hiện tại import 25 runtime patch scripts.
- Repository inventory tại baseline: 418 blobs, 295 path dưới `assets/`, 18 test files.
- Không có GitHub Actions workflow; không có save fixture/seed fixture riêng trong tree.

Các file manifest ở root như `BUILD-UTC.txt`, `RUNTIME-PACKAGE.txt`, `SHA256SUMS.txt` và `SIZE-REPORT.txt` được xem là historical manifest, không dùng làm bằng chứng build mới vì chúng đang lệch thời điểm/commit.

## Evidence table

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Source baseline/hash | PASS | GitHub ref `main` tại commit nêu trên |
| Build chain | PASS | `scripts/build-static.mjs` đọc đủ 25 import patch hiện tại |
| Production deploy | PASS | Production HTML có marker Dinh Lôi retina và authored MVP; browser live đã đi qua Chinh chiến → Victory |
| R02 roster lifecycle | PASS | 12 card; lọc Mộng còn Thầy Mo/Lục Ảnh; mở detail, back giữ filter; rời Hub và mở lại vẫn đúng |
| R03 Dinh/MVP visual | PARTIAL | Dinh Lôi và MVP Ông Phở đã đúng asset/render live; harness spacing Dinh vẫn chưa PASS; PC flicker/iPhone Safari chưa test |
| R04 SFX runtime | PARTIAL | Browser context running, 9 asset loaded, không có app SFX error; speaker thật/iPhone chưa test |
| Full `npm test` tại workspace | NOT TESTED | Workspace hiện không có full checkout để chạy pipeline local |
| Save/seed fixture | NOT PRESENT | Cần tiếp tục ở R06/R05; không tự chốt economy hoặc tài khoản thật |

## Roster capacity contract

Samkok v2 ghi nhận quy mô dự kiến 72 tướng:

| Bậc | Số lượng mục tiêu |
|---|---:|
| SSR | 32 |
| SR | 16 |
| A | 16 |
| B | 8 |
| Tổng | 72 |

Contract mới chỉ là capacity/data contract. Roster production vẫn gồm 12 tướng chính thức hiện có; 60 slot còn lại chưa được đưa vào `DATA.heroes`, UI, summon pool hoặc economy. Vì vậy contract không tạo placeholder, không đòi asset ngay và không thể bị hiểu là đã có 72 tướng playable.

## Next handoff

Theo thứ tự Samkok v2: giữ contract này làm nền cho R05 catalog/seed QA; sau đó làm R06 save version/revision/migration fixtures. D01 seed player và D02 banner vẫn là product decisions, chưa tự chọn.
