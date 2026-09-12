## 12/09/2026 — 72 tướng full-asset = wave sau

Owner `live` Wave G coordinator: «sau này mới bổ sung 72 tướng với asset đầy đủ chứ ko phải mấy nhân vật hiện tại». Roster playable **12**. Không nới 12 → 72. Không idle/combat/portrait sheet đầy đủ cho ID live. 42 S+ lab vẫn không vào production.

## 12/09/2026 — TKT-0036 Rèn hall REVIEW

`#hvForgeRoot` body overlay + hall 3D tươi. Giữ `forgeCommand`. Không merge tới khi owner gõ `live`.

## 12/09/2026 — TKT-0035 LIVE

PR [#36](https://github.com/bktimmy247/luc-than/pull/36) squash `f52e5fc`. Vercel `dpl_7N9JqoJDRJQGEX4XNKc1NYqzyAeP`. Roster overlay body. Việc kế: Rèn hall giả 3D, giữ `forgeCommand`.

## 12/09/2026 — TKT-0035 Màn Tướng hiện lại REVIEW

Roster `#hvHeroRosterV4` gắn `document.body` như `#hvGearRoot`. overflow auto + min-height thẻ/lưới — không mount trong `.wrap > #heroesScreen` (iOS/Grok clip lưới về 0). 12 ID / `heroStats` / nan không đổi. Không merge tới khi owner nói `live`.



## 12/09/2026 — TKT-0033 + TKT-0034 LIVE

Main `b5a91f6`, PR #35 squash-merge. Owner gõ `live`. Trợ trận + Lịch Luyện icon/nền giả 3D tươi trên production. Không đổi `heroStats` / daily formulas. Ticket kế: chờ `tiếp` (Rèn hall hoặc shell Túi/Mail/Bang).

## 12/09/2026 — TKT-0034 Lịch Luyện giả 3D tươi REVIEW

Owner chốt: icon + nền **tươi, giả 3D, nhiều lớp**. Lịch Luyện 11 nan + hall đổi theo Trợ trận. Không reuse `menu-v3233`. Không overlay Thành Chính. Công thức daily đóng băng. Không merge tới khi owner nói `live`.

## 12/09/2026 — TKT-0033 Icon sơn Trợ trận REVIEW

Dock Trợ trận `#hvGearRoot`. Owner chốt: icon + nền **tươi, giả 3D, nhiều lớp** (art sẵn có), không sơn dầu tối. 11 nan `assets/ui/account-gear/spokes/{key}.jpg` từ token account/item. Hall `assist-hall-day.jpg`. WHEEL / `heroStats` không đổi. Không thêm `data-art-go`. Không merge tới khi owner nói `live`.


## 12/09/2026 — TKT-0032 Lịch Luyện LIVE + bàn giao agent sau

Main `a1f936a`, PR #33 squash-merge. Vercel production READY `dpl_G49Q6XjU29UzEYczLLRfvvq7VSpk`. Dock Lịch Luyện mở `#hvLichRoot` hall riêng 11 nan sơn; Nhiệm vụ giữ Nhật Ký Mơ. Snapshot [HANDOFF-2026-09-12.md](HANDOFF-2026-09-12.md). Ticket kế TKT-0033 (gợi ý icon sơn Trợ trận). Không đổi runtime trong commit docs bàn giao.

## 12/09/2026 — TKT-0032 Lịch Luyện REVIEW

Dock Lịch Luyện mở **màn hall riêng** `#hvLichRoot` (inset 0, z-index 80, nền `lich-hall.jpg`, nút X, chip tài nguyên) — không overlay lên Thành Chính. 11 nan mỗi ải một icon sơn `assets/daily/spokes/{key}.jpg`, không dùng icon hub. Nan sống: Qua Ải Mộng, Giáo Trường Luyện, Tháp (ch.1), Mộng Lộ (ch.2), Đấu Trường + Săn Boss (ch.3). 5 nan sắp mở. Side Nhiệm vụ giữ Nhật Ký Mơ. Domain daily không đổi công thức. Không thêm `data-art-go`. Không merge cho tới khi owner nói `live`. Trợ trận icon sơn: chưa làm (ticket khác).




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
