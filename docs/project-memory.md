## 12/09/2026 — TKT-0031 Lễ Hội LIVE

Main `3baffa8`, PR #32 squash-merge. Vercel production READY `dpl_CQjwBHTMpwKjPW7zu83pMeRovupz`. Domain festival + lacquer trên production. Inject sau hunt. Mở từ đêm đầu. Formulas frozen.

## 12/09/2026 — TKT-0031 Lễ Hội REVIEW

Domain `src/domain/festival/festival-run.mjs` owns hoa đăng / Tam Nguyện / Lễ Ấn / Bách Bảo / rương. Runtime wraps `renderFestival` / `releaseLantern` / `spinBachBaoCore` / `openBachBaoChest`, không thêm `data-art-go="festival"`. Transaction `hvRunCommittedTransaction`. Build: `scripts/festival-runtime-v1.mjs` sau hunt. Không đổi 5 đèn / 🪙100 / 20 ô / bảng rương. Không merge cho tới khi owner nói `live`.

## 12/09/2026 — TKT-0030 Săn Boss LIVE

Main `f96e53d`, PR #31 squash-merge. Vercel production READY `dpl_26SmNBM8BZarjCyP4U1ew3Cd9sDx`. Domain hunt + lacquer + painted boss art trên production. Inject sau arena. Boss 1 con to (`huntForm`) + 2 Mộng Tinh tinh thể. Mở sau 3 chương. Formulas frozen.

## 11/09/2026 — TKT-0030 Săn Boss REVIEW

Domain `src/domain/hunt/hunt-run.mjs` owns day/contract/start/settle. Runtime wraps `renderHunt` / `selectHuntContract` / `startHunt` / `huntSettle`, không thêm `data-art-go="hunt"`. Settle qua `hvRunCommittedTransaction`. Build: `scripts/hunt-runtime-v1.mjs` sau arena. Không đổi 6⚡/2 lượt/HP. Không merge cho tới khi owner nói `live`.

## 11/09/2026 — TKT-0029 Đấu Trường LIVE

Main `9bd266a`, PR #30 squash-merge. Domain arena + lacquer đã trên production. Inject sau summon.

## 11/09/2026 — TKT-0028 Gọi Mộng LIVE

Main `4deed0e`, PR #29 squash-merge. Domain summon + lacquer đã trên production.

## 11/09/2026 — TKT-0028 Gọi Mộng REVIEW

Domain `src/domain/summon/summon-pull.mjs` owns pull/pity/spark. Runtime wraps `doSummon` / `renderSummon` / `sparkSelectHero`, không thêm `data-art-go="summon"`. Pull qua `hvRunCommittedTransaction`. Build: `scripts/summon-runtime-v1.mjs` sau shop. Không đổi tỉ lệ/pity.

## 11/09/2026 — TKT-0027 Chợ Mộng LIVE

Main `febfd5ec`, PR #28 squash-merge. Domain shop + lacquer đã trên production.

## 11/09/2026 — TKT-0027 Chợ Mộng REVIEW

Domain `src/domain/shop/shop-day.mjs` owns open/buy/day. Runtime wraps `ensureShop` / `buyShop` / `renderShop`, không thêm `data-art-go="shop"`. Mua qua `hvRunCommittedTransaction`. Build: `scripts/shop-runtime-v1.mjs` sau expedition.

## 11/09/2026 — TKT-0026 Mộng Lộ LIVE

Main `571dd264`, PR #27 squash-merge. Domain expedition + lacquer đã trên production.

## 11/09/2026 — TKT-0026 Mộng Lộ REVIEW

Domain `src/domain/expedition/expedition-run.mjs` owns start/route/bless/reroll/win/lose. Runtime wraps `renderExpedition` / `startRogueBattle`, không thêm `data-art-go="expedition"`. Build: `scripts/expedition-runtime-v1.mjs` sau tower.

## 11/09/2026 — Bàn giao agent sau

Điểm vào: `docs/HANDOFF-2026-09-11.md`. Live đủ vòng chơi + Trợ trận + Tháp + Mộng Lộ + Chợ + Gọi Mộng + Đấu Trường + Săn Boss. Owner `tiếp` = Lễ Hội (TKT-0031). Không làm lại Bày trận visual 09/09, không merge S+ V2 vào roster.

## 11/09/2026 — CI/CD tự động (TKT-0025)

`.github/workflows/ci.yml`: job `ci` (build+test) trên PR/main; job `production` chỉ trên main, curl live 200. Vercel Git vẫn là CD.

## 11/09/2026 — Tối ưu deploy (TKT-0024)

`build-static` chỉ copy game (index/battle/qa/splus/assets). `sharp` là devDependency. Vercel install `--omit=dev`.

## 11/09/2026 — Tháp khóa lực chiến + bù ngày (TKT-0023)

`prepareTowerAttempt` auto-resolve theo `teamPower`. `stuckFloor`/`stuckSince` ghi lần fail đầu. Campaign không đụng. Công thức vàng/ấn/5⚡ giữ nguyên.

## 11/09/2026 — Tháp Trắng Đêm sơn mài (TKT-0022)

Domain `tower-progress` + màn leo tầng sơn mài. Hub landmark Tháp. Giữ công thức vàng/ấn/5⚡. Không đổi campaign/seed.

## 11/09/2026 — HUD trận sơn mài gọn (TKT-0011)

Trận nhúng ẩn topbar; ribbon 48px đêm/đồng; tốc độ và tua chip tròn 44px trên dock.
