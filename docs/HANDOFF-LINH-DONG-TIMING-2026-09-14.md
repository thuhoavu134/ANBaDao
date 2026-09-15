# Linh Đồng timing — 14/09/2026

## LIVE trên main

- TKT-0146 S+ Linh Đồng cùng clock: LIVE #142 `c517cd8`.
- TKT-0145 clock trận thường (adapter 3Q): LIVE #140 rồi fix alias #141 `dba09d7`.
- Canonical: `hero_splus_linh_dong`. Alias: `linh_dong`, `linh-dong`.
- Runtime actions: ATK + Ultimate. `basic/normal/skill/skill1` = alias ATK. Không Skill 1 runtime.
- Một `elapsedMs` cho char/VFX/SFX/damage/recovery. Flow: start → release SFX/VFX → impact (damage một lần) → recovery. VFX cắt `recoveryEndMs`, không chạy 4s.
- ATK: release 420 / impact 1320 / recovery 1496 (44f × 34ms).
- Ultimate: release 400 / impact 1600 / recovery 1980 (60f × 33ms).
- Pack: Drive Blender rekey 14/09 (TKT-0143). SFX wav HonVietSfx, không ogg, không `new Audio`.

## TKT-0146 — LIVE #142 `c517cd8`

Bug S+ trước vá: `performSplusAction` `sleep(linhDur)` × `timingScale` 0.35 → ATK 1496→524, Ult 1980→693.

Bản vá: `performSplusAction` đi `beginLinhDongAction` → `waitLinhDongMarker(release)` → `emitLinhDongRelease` → `waitLinhDongMarker(impact)` → `e.act` một lần → `waitLinhDongMarker(recovery:end)`.
Thanh S+ Linh Đồng chỉ `['passive','ultimate']`. Hurt reset idle.
Không đổi `createSplusFixture.timingScale = 0.35` của 41 tướng S+ kia.

Kiểm chứng:
- RED L146-T1/T2 fail trên source cũ; T3 khóa timingScale đã xanh sẵn.
- GREEN 15 focused + `npm test` 979/979. CI Build and test PASS.
- Chrome 390×844 `qaSplus42=hero_splus_linh_dong`: ATK wall 1506ms, không còn ~524ms. `__HV_LINH_DONG_QA` là object `{force,snapshot,timeline}` (kèm `registry`). Thanh Linh Đồng `passive`+`ultimate`.
- Safari/iPhone NOT_RUN. Production: owner tự `git pull && vercel --prod`.

## Warning còn lại (đừng im, đừng tự nới trừ khi owner kêu)

- VFX ATK vẫn bay actor→địch (một combined atlas, không kênh projectile riêng).
- Hit clip 4032ms (96f × 42ms); TKT-0146 chỉ thêm reset idle.
- `waitLinhDongMarker` elapsed = `performance.now()` wall — đừng đổi sang `motionDuration`.
- Domain `e.act('skill')` vẫn confusion trong splus-mechanics; runtime trận alias skill→basic nên nút/AI Linh Đồng không bắn Skill 1.

## Cấm

- BETS [2, 10, 50], loot, Bách Bảo, Hồng Trầu
- Mở 42 S+, Combat V2, 72 tướng
- Đổi damage math / initiative / AI / turn clock
- Per-frame crop, black-key, đổi cell 347×320 / trận 477×440
- Normalize HEROES campaign thành `hero_splus_linh_dong`
- Mở lại PR #139 (đã đóng, dirty). Port sạch là #140
- Force-push, tự deploy Vercel
