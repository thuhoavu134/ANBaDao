## 11/09/2026 — Bàn giao agent sau

Điểm vào: `docs/HANDOFF-2026-09-11.md`. Main `ec6df19`. Live đủ vòng chơi + Trợ trận + Tháp. TKT-0026 chưa mở. Owner `tiếp` = địa danh hub kế (Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường). Không làm lại Bày trận visual 09/09, không merge S+ V2 vào roster.

## 11/09/2026 — CI/CD tự động (TKT-0025)


`.github/workflows/ci.yml`: job `ci` (build+test) trên PR/main; job `production` chỉ trên main, curl live 200. Vercel Git vẫn là CD. First Actions run failed 6 stale tests; suite realigned to 537/537.

## 11/09/2026 — Tối ưu deploy (TKT-0024)

`build-static` chỉ copy game (index/battle/qa/splus/assets). `sharp` là devDependency. Vercel install `--omit=dev`.

## 11/09/2026 — Tháp khóa lực chiến + bù ngày (TKT-0023)

`prepareTowerAttempt` auto-resolve theo `teamPower`. `stuckFloor`/`stuckSince` ghi lần fail đầu. Campaign không đụng. Công thức vàng/ấn/5⚡ giữ nguyên.

## 11/09/2026 — Tháp Trắng Đêm sơn mài (TKT-0022)

Domain `tower-progress` + màn leo tầng sơn mài. Hub landmark Tháp. Giữ công thức vàng/ấn/5⚡. Không đổi campaign/seed.

## 11/09/2026 — HUD trận sơn mài gọn (TKT-0011)


Trận nhúng ẩn topbar; ribbon 48px đêm/đồng; tốc độ và tua chip tròn 44px trên dock.
