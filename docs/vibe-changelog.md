## 11/09/2026 — Đấu Trường lên main (TKT-0029)

Squash-merge PR #30 → main `9bd266a`. Vercel CD. Inject shop → summon → arena.

## 11/09/2026 — Gọi Mộng lên main (TKT-0028)

Squash-merge PR #29 → main `4deed0e`. Vercel CD.

## 11/09/2026 — Đấu Trường sơn mài + domain hạng/mùa/võ đài (TKT-0029)

Nhánh `work/l18-arena-20260911`. Giữ 5⚡, thắng chiếm hạng +220g, thua không tụt, LP mùa 34/−18, Võ Đài 8 tầng. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ. Settle + mốc LP qua transaction. Không thêm nút hub thứ hai, không đổi net PvP. Chrome 390 PASS; Safari NOT_RUN.

## 11/09/2026 — Gọi Mộng sơn mài + domain triệu hồi (TKT-0028)

Nhánh `work/l17-summon-20260911`. Giữ cost 80/720, pity 60, tỉ lệ 3/9/18/30/40, Hồi Ức 120. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ. Pull + spark qua transaction. Không thêm nút hub thứ hai, không đổi seed/banner D01/D02. Pool 12 SSR-only vẫn khóa gacha như live. Chrome 390 PASS; Safari NOT_RUN.

## 11/09/2026 — Chợ Mộng lên main (TKT-0027)

Squash-merge PR #28 → main `febfd5ec`. Vercel CD.

## 11/09/2026 — Chợ Mộng sơn mài + quầy ngày (TKT-0027)

Nhánh `work/l16-shop-20260911`. Giữ 5 quầy live, 1 lần/ngày, giá 320g / 60💎 / 160g / 40💎 / 220g. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ. Mua qua transaction. Không thêm nút hub thứ hai, không bán lực chiến. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 11/09/2026 — Mộng Lộ lên main (TKT-0026)

Squash-merge PR #27 → main `571dd264`. Vercel CD.

## 11/09/2026 — Mộng Lộ sơn mài + domain run (TKT-0026)

Nhánh `work/l15-expedition-20260911`. Giữ rogue 5 tầng live: Ngã Rẽ / Phúc Mộng / Mộng Ấn / checkpoint. Domain thuần bất biến, màn sơn mài như Tháp. Công thức vàng/ấn/gem không đổi. Không thêm nút hub thứ hai. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 11/09/2026 — Bàn giao toàn bộ tiến độ cho agent sau

Snapshot [HANDOFF-2026-09-11.md](HANDOFF-2026-09-11.md): live, PR #18–#25, bánh xe 11 nan, Tháp, deploy, CI. Ticket kế TKT-0026. Không đổi runtime.

## 11/09/2026 — CI/CD tự động (TKT-0025)

GitHub Actions: mỗi PR và mỗi lần đẩy `main` chạy cài đặt → build → test. Vercel vẫn tự deploy live. Job production xác nhận luc-than.vercel.app trả 200. Cổng CI 537/537 PASS.
