---
id: TKT-0161
title: Chốt 1 combat engine — hiện trạng thật và phần còn lại
status: IN_PROGRESS
phase: IN_PROGRESS
priority: P1
owner: assistant (theo duyệt chủ)
created: 2026-09-28
---

# TKT-0161 — Chốt 1 combat engine

## Hiện trạng thật (khảo sát 28/09, sửa nhận định cũ)

Review đầu tiên kết luận "3 combat engine song song, bản canonical bị chặn sau QA flag".
Khảo sát kỹ `scripts/combat-domain-3q-adapter-v1.mjs` cho thấy nhận định đó SAI một nửa:

1. **Engine sống là engine inline battle.html** (đã rename `__hvApplyDamage3qAdapter`...),
   wrapper `applyDamage` LUÔN gọi engine đó trong production. QA fixture
   (`?qaCombatFixture=l05a`) KHÔNG phải engine thay thế — là **bộ ghi quan sát**
   (snapshot before/after + rngCalls per action, `parityScope:'full-replay-rule-outcome'`).
2. **`src/domain/combat` (modules v1) ĐANG ĐƯỢC DÙNG THẬT** trong production như thư viện:
   seeded combat RNG (toàn bộ rule sites hit/variance/crit/fear/stun + presentation sites
   đã qua `__hvRuleRandom3qAdapter`/`__hvPresentationRandom3qAdapter` — dist còn đúng
   2 chỗ `Math.random()` là fallback an toàn trong bridge), session/result snapshots,
   `recordCombatAction` mỗi resolveAction, `serializeReplay` lúc endBattle.
3. `__HV_COMBAT_DOMAIN_V1` (3q-core) là **fallback** khi modules v1 thiếu
   (`modules?.x || core?.x`) — không phải engine song song.

## Đã xong trong ticket này

- Seed RNG meta-roll còn thiếu: **Gọi Mộng** (rollTier + pick) qua
  `scripts/meta-rng-seed-v1.mjs` — per-pull seed ghi ring `hv_pull_seeds_v1`
  (localStorage riêng, không đụng save contract), replay contract có test khóa.
  Full suite 1338 test.

## Phần còn lại (các ticket con sau này)

1. **Rule-swap**: chuyển nội dung applyDamage/applyHeal/addStatus sang modular rules —
   CHỈ làm khi có parity replay diff (fixture đã ghi đủ dữ liệu để diff).
2. Seed các meta-roll còn lại: festival wheel, expedition reroll (cùng pattern,
   scoping theo thân hàm như meta-rng-seed-v1).
3. Sau parity: xóa fallback 3q-core + fixture gate nếu owner muốn.

## Bằng chứng

- dist/battle.html: `Math.random()` còn 2/12 (fallback trong bridge);
  rule sites seeded ×7, presentation ×8.
- tests/meta-rng-seed.test.mjs: 3/3 PASS (replay contract + scoping).

## Cập nhật 28/09 (phiên 2)

- **Seed RNG hub hoàn tất**: PR #235 (Gọi Mộng) + PR #236 (lễ hội/hoa đăng/wish/Bách Bảo wheel/forge rarity/càn quét/nhận việc/mốc tháp/shop pick) — mọi roll cấp giá trị ở hub đều qua stream có seed, ring replay `hv_pull_seeds_v1` + `hv_scope_seeds_v1`. Full suite 1343/1343 PASS.
- Cosmetic rolls (chat/mail/voice/star/rival-name) cố tình không seed.
- **Còn lại duy nhất cho "chốt engine"**: rule-swap applyDamage/applyHeal/addStatus sang modular — CHỈ bật sau khi parity replay diff qua fixture `?qaCombatFixture=l05a` (hạ tầng observation đã sẵn: before/after + rngCalls per action). Việc này cần 1 session riêng trọn vẹn.

## Cập nhật 28/09 (phiên 3) — Core single-source HOÀN TẤT

- **HonVietCore (219 API rule: damage/heal/status/objective/synergy/zone...) dời verbatim** từ battle.html script #1 sang `src/domain/combat/hon-viet-core.mjs` (UMD giữ tương thích Node/browser).
- Nguồn battle.html chỉ còn **placeholder** `<script id="hon-viet-core-umd-v1">`; build inject từ module (`scripts/combat-core-module-v1.mjs`) và **throw** nếu ai tái chèn inline core. battle.html nguồn nhẹ đi 155 KB.
- Round-cap Tháp/Săn (60 ải) — trước đây là patch chuỗi build đụng vào core — nay là **phần của module**; hunt-runtime-v1 chỉ guard.
- Contract test mới (`tests/hon-viet-core-module.test.mjs`): golden damage/heal (113/132/291/175-crit), parity sweep 200 case dist-vs-module, byte-for-byte dist, nguồn sạch.
- Full suite: **1346/1346 PASS**. Từ đây sửa rule combat = sửa module; sửa inline sẽ vỡ build.
- Còn lại trong ticket: parity replay diff runtime-level qua fixture (hạ tầng có sẵn) trước khi đổi công thức — không chặn việc sửa bug/balance trên module ngay bây giờ.
