## 12/09/2026 — retrigger Vercel production Wave F+H

Owner gõ gộp live + deploy. Git `main` đã có squash #51 `5bd9382` + #55 `b4915a9` + docs `ec9d7a0`, nhưng alias luc-than.vercel.app còn `dpl_Gw6KtJFxJYdGdxHVUBksnZAtYE2t` / `282df9d` (chỉ login, không `#hvJourneyRoot`). CI Live check chỉ HTTP 200 nên GREEN giả. Commit này kích CD.

## 12/09/2026 — Wave F + Wave H coordinator LIVE

Owner gõ `live` + deploy Vercel. Squash [#51](https://github.com/bktimmy247/luc-than/pull/51) → `5bd9382` Hành trình + Kết quả hall giả 3D. Squash [#55](https://github.com/bktimmy247/luc-than/pull/55) → `b4915a9` stub TKT-0065…0073 (overlay chưa điền). Việc kế: điền Tháp trận NPC + nút Thành Chính.

## 12/09/2026 — TKT-0074 màn đăng nhập + tài khoản LIVE

Owner merge. Squash [#56](https://github.com/bktimmy247/luc-than/pull/56) → main `282df9d`. Overlay `#hvLoginRoot`, email/du khách, OAuth chờ App ID, điều khoản tiếng Việt. Wave F #51 không trộn.

## 12/09/2026 — TKT-0074 tài khoản + API cùng Vercel REVIEW

Owner: bật tài khoản, một project Vercel, user/pass + OAuth Google (email). Gateway `api/[...path].js` + wrap Trực Tuyến same-origin. Không sửa `index.html` / `battle.html`. Chưa live — cần env Neon + Google. Wave F #51 không trộn.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals LIVE

Owner gõ `live`. Squash [#54](https://github.com/bktimmy247/luc-than/pull/54) → main `d94f8a3`. 27 medallion hồ sơ 9 tướng. Wave F #51 không trộn. 72 tướng vẫn wave sau.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals REVIEW

Owner gõ `tiếp`. Wrap `renderHeroDetail`, 27 medallion jpg exclusive, CSS scoped `[data-hero-id]`. Không sửa `hero-detail-tabs.js` / `index.html` / `battle.html`. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Wave F #51 không trộn. Không merge tới `live`.

## 12/09/2026 — TKT-0058…0060 Wave G halls + TKT-0064 Safari pin LIVE

Owner gõ `live`. Squash [#53](https://github.com/bktimmy247/luc-than/pull/53) → main `b0d6d9d`. Cốt truyện / Trực Tuyến / Trận Hình overlay body + pin Safari. Ấn UI 0061–0063 còn READY. Wave F #51 không trộn.

## 12/09/2026 — TKT-0064 Safari overlay pin REVIEW

Owner «Debug Safari overlay rendering». `body.night{filter}` + `overflow-x:hidden` chứa `position:fixed` trên WebKit; hall dời DOM → overlay ~100px. Pin `visualViewport` + `filter:none` + `100dvh`. Không sửa `index.html` nguồn / Bày trận. Không merge tới `live`.

## 12/09/2026 — Wave G TKT-0058…0060 halls REVIEW

Owner gõ `tiếp`. Cốt truyện / Trực Tuyến / Trận Hình overlay body giả 3D. Stub lane điền, không thêm import `build-static.mjs`. 100vh + `filter:none`. Auth/DB OFF. Bày trận đóng băng. 72 tướng không đụng. Không merge tới `live`.

## 12/09/2026 — Wave G TKT-0058…0063 coordinator LIVE

Owner gõ `live`. Squash [#52](https://github.com/bktimmy247/luc-than/pull/52) → main `b77f35a`. Stub + ticket READY. 6 agent điền overlay/ấn. Owner: 72 tướng + asset đầy đủ là wave sau, **không** phải 12 nhân vật hiện tại. Wave F #51 không trộn.

## 12/09/2026 — Wave G TKT-0058…0063 coordinator READY

Owner «tạo tkt chia agent». Stub `scripts/lanes/tkt-0058`…`0063` + ticket READY. 3 hall (Cốt truyện / Online / Trận Hình) + 9 ấn UI 3×3. Overlay chưa làm. Wave F #51 không trộn. Không merge tới `live`.

## 12/09/2026 — Wave E TKT-0054…0055 LIVE

Owner gõ `live`. Squash [#50](https://github.com/bktimmy247/luc-than/pull/50) → main `f43545e`. Nhật Ký Mơ + Chinh chiến AFK home overlay body. Bày trận đóng băng.

## 12/09/2026 — Wave E TKT-0054…0055 REVIEW


Owner gõ `tiếp`. Nhật Ký Mơ + Chinh chiến AFK home restyle hall giả 3D overlay body. Bày trận đóng băng. Không merge tới `live`.

## 12/09/2026 — Wave D TKT-0053 LIVE


Owner gõ `live`. Squash [#49](https://github.com/bktimmy247/luc-than/pull/49) → main `ea59313`. Hồ sơ tướng overlay body + 9 nền showcase.

## 12/09/2026 — Wave D TKT-0053 REVIEW


Owner gõ `tiếp`. Hồ sơ tướng overlay body giả 3D + 9 nền showcase còn thiếu. Không merge tới `live`.

## 12/09/2026 — Wave C TKT-0046…0052 LIVE


Owner gõ `live`. Squash [#48](https://github.com/bktimmy247/luc-than/pull/48) → main `9f2bbff`. 7 màn sơn mài thành hall giả 3D overlay body.

## 12/09/2026 — Wave C TKT-0046…0052 REVIEW


Owner gõ `tiếp`. 7 màn sơn mài (Tháp / Mộng Lộ / Chợ / Gọi / Đấu / Săn / Lễ) restyle hall giả 3D overlay body. Domain đóng băng. Không merge tới `live`.

## 12/09/2026 — TKT-0036…0045 LIVE


Owner gõ `live`. Squash-merge PR #39–#47 (Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho + kit v2) rồi rebase-squash Rèn PR [#37](https://github.com/bktimmy247/luc-than/pull/37) → main `a2d8bf1`. Overlay body giả 3D; preview tạm mở khóa hành trình; tiếng rèn unlock iOS rồi mới gõ.

## 12/09/2026 — TKT-0037…0045 hall + kit squash-merge



Owner gõ `live`. Squash-merge PR #39–#47 lên main. Overlay Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho + kit v2. TKT-0036 Rèn rebase sau halls.

## 12/09/2026 — TKT-0037…0045 LIVE (stub làn)

Owner gõ `live` rồi cho agent chạy song song. Squash-merge PR [#38](https://github.com/bktimmy247/luc-than/pull/38) → main `c990516`. Stub `scripts/lanes/tkt-00xx-*.mjs` + ticket READY. Overlay hall chưa làm. TKT-0036 Rèn không merge trong lần này.

## 12/09/2026 — Làn song song TKT-0037…0045

Owner: rà soát chức năng còn thiếu, tách ticket độc lập cho nhiều agent. 8 hall Wave A (Túi / Thư / Việc / Bang / Bạn / Chat / Tộc / Kho) + 1 Wave B kit v2. Stub `scripts/lanes/tkt-00xx-*.mjs` đã import sẵn — agent không sửa `build-static.mjs`. Cấm đụng Combat V2, nan `go:null`, Bày trận visual, Auth/DB.
## 12/09/2026 — Tiếng rèn unlock iOS rồi mới gõ

Owner «tiếng rèn bị mất». `hvForgeReveal` gọi `HonVietSfx.unlock` trước `forge-reveal`. Hall mở cũng unlock. Gain 0.22→0.4. Combat vẫn chặn forge-reveal.

## 12/09/2026 — Preview tạm mở khóa hành trình


Owner: «làm đến chức năng nào khoá thì e tạm mở để a test». Preview wrap `featLocked=false` (không đụng `JOURNEY_UNLOCK`). `luc-than.vercel.app` vẫn khóa theo chương. Rèn mở được trên save mới.

## 12/09/2026 — TKT-0036 Rèn hall giả 3D REVIEW


Nhánh `work/l25-forge-hall-20260912`. Overlay `#hvForgeRoot` gắn body, hall `assets/ui/forge/forge-hall.jpg` sáng nhiều lớp. `forgeCommand` / CRAFT 20·200 / DUAL 42·420 / pity 30 / +15 không đổi. Chrome 390+768 PASS. Không merge tới `live`.

## 12/09/2026 — TKT-0035 LIVE

Owner gõ `live`. Squash-merge PR [#36](https://github.com/bktimmy247/luc-than/pull/36) → main `f52e5fc`. Vercel production `dpl_7N9JqoJDRJQGEX4XNKc1NYqzyAeP` READY. Overlay Tướng gắn body trên luc-than.vercel.app. Ticket kế: Rèn hall (TKT-0036).

## 12/09/2026 — Màn Tướng hiện lại (TKT-0035)

Nhánh `work/l24-hero-roster-visible-20260912`. Owner «vẫn thế» / «vẫn ko hiện»: header còn, 12 thẻ trắng trên iOS/Grok. Overlay gắn `document.body` như Trợ trận (`position:fixed;inset:0;overflow:auto`), thẻ `min-height:150`, lưới `min-height:420`. Không flex-1fr, không `height:auto`, không visualViewport. Chrome 390 + 768 + iframe 768 PASS; Safari NOT_RUN. Builder dừng REVIEW.



## 12/09/2026 — TKT-0033 + TKT-0034 LIVE

Squash-merge PR #35 → main `b5a91f6`. Vercel CD production. Trợ trận + Lịch Luyện giả 3D tươi. Owner gõ `live`. Ticket kế: chờ `tiếp`.

## 12/09/2026 — Lịch Luyện giả 3D tươi (TKT-0034)

Cùng nhánh `work/l23-assist-spoke-icons-20260912`. Owner hỏi «lịch luyện đã đổi theo chưa» — chưa, art TKT-0032 còn sơn mài tối. Đổi 11 nan + hall + lõi sang token giả 3D tươi, không reuse icon hub. Công thức daily đóng băng. Chrome 390 PASS; Safari NOT_RUN.

## 12/09/2026 — Icon sơn 11 nan Trợ trận (TKT-0033)

Nhánh `work/l23-assist-spoke-icons-20260912` từ main `82f1c61`. Owner: «ngay bên trợ trận cũng ko có icon» rồi chốt icon/nền phải **tươi, giả 3D, nhiều lớp** — không sơn dầu tối. 11 nan lấy token 3D sẵn có (trống đồng, giáp SSR, cá lóc, kim quy…). Hall `assist-hall-day.jpg` sáng như Thành Chính / Mộng Lộ. `heroStats` / 11 nan / `data-art-go` không đổi. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.


## 12/09/2026 — Lịch Luyện lên main + bàn giao (TKT-0032)

Squash-merge PR #33 → main `a1f936a`. Vercel CD production READY `dpl_G49Q6XjU29UzEYczLLRfvvq7VSpk`. Inject hunt → festival → daily. Snapshot [HANDOFF-2026-09-12.md](HANDOFF-2026-09-12.md) cho agent sau. Ticket kế TKT-0033.

## 12/09/2026 — Lịch Luyện bánh xe đi ải + Nhật Ký Mơ (TKT-0032)

Nhánh `work/l21-daily-onto-main`. Owner: Lịch Luyện là bánh xe ải trên **màn riêng**, mỗi nan icon sơn độc lập — không overlay Thành Chính, không tái icon hub. Nhiệm vụ giữ Nhật Ký Mơ. Qua Ải + Luyện mở đêm 1. Không thêm nút hub, không ải combat mới. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.




## 12/09/2026 — Lễ Hội lên main (TKT-0031)

Squash-merge PR #32 → main `3baffa8`. Vercel CD production READY. Inject hunt → festival. Mở từ đêm đầu như Chợ.

## 12/09/2026 — Lễ Hội sơn mài + domain hoa đăng / Bách Bảo (TKT-0031)


Nhánh `work/l20-festival-onto-main` từ main `d62dea1`. Giữ 5 đèn/ngày, đèn đầu miễn phí, 🪙100, 3 hướng An Khang / Duyên Phố / Khai Lộ, Tam Nguyện +1 ấn +🪙150 +💎5, mốc 3/7/12, Bách Bảo 20 ô 1🐚, bảng Rương Báu / Chí Bảo. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường / Săn Boss. Thả đèn + quay + mở rương qua transaction. Không thêm nút hub thứ hai. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 12/09/2026 — Săn Boss lên main (TKT-0030)

Squash-merge PR #31 → main `f96e53d`. Vercel CD production READY. Inject arena → hunt. Painted boss tokens + 60-round hunt battle. Unlock still after 3 chapters.

## 11/09/2026 — Săn Boss sơn mài + domain khế/ấn (TKT-0030)

Nhánh `work/l19-hunt-onto-main` từ main `1139ef4`. Giữ 6⚡, 2 lượt/ngày, 3 boss xoay, Săn Khế Phá Lõi/Quét/Đoạt Mệnh, mốc ấn 3/7/12. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường. Chọn khế + settle qua transaction. Không thêm nút hub thứ hai, không đổi trận 60 lượt. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

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
