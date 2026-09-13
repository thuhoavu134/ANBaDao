---
id: TKT-0114
title: Chinh chiến — cảnh hành quân, rương gọn, popup thưởng
status: IN_PROGRESS
phase: EVIDENCE
priority: P0
created: 2026-09-13T02:30:00.000Z
updated: 2026-09-13T02:30:00.000Z
acceptance_ids: ['AC01','AC02','AC03','AC04','AC05','AC06','AC07','AC08','AC09','AC10','AC11','AC12']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/campaign-scene.js
  - src/ui/campaign-scene.css
  - src/ui/campaign-3d.css
  - tests/campaign-afk-ui.test.mjs
  - tests/campaign-3d.test.mjs
  - tests/campaign-grounding.test.mjs
  - tests/campaign-map.test.mjs
  - tests/campaign-farm.test.mjs
  - assets/ui/campaign/farm-moss-v1.webp
  - assets/ui/campaign/farm-moss-v1.meta.json
  - assets/ui/campaign/campaign-map-v3.webp
  - assets/ui/campaign/campaign-map-v3.meta.json
  - assets/ui/campaign/campaign-road-v2.webp
  - assets/ui/campaign/campaign-road-v2.meta.json
  - docs/qa/L114-CAMPAIGN-AFK-UI/
resource_locks: ["campaign-afk-home"]
branch_hint: work/l114-campaign-afk-ui-20260913
---
# TKT-0114 — Cảnh hành quân Chinh chiến

Owner 13/09: đội đứng rời, rương AFK che cảnh, dãy ải rối. Lấy đội hành quân làm vùng chính. Rương gọn + popup. Không giả Run.

## Keep
- Cap 15h, claimAfkChest, Khiêu chiến → Bày trận → Xuất trận
- `.cs-prepare` visual
- Roster 12, save, công thức AFK

## Non-goals
Run animation (WAITING_ASSET). Combat V2. 72 tướng. IAP/tác chiến nhanh. Đổi công thức. Phủ kem Thành chính.

## AC
- AC01 bố cục cảnh chính, không bảng rương lớn
- AC02 đội đúng, đổi đội cập nhật
- AC03 chân trên mặt đường
- AC04 chạm rương → popup
- AC05 nhận không trùng
- AC06 cap 15h
- AC07 Khiêu chiến / Đổi đội hình
- AC08 vòng đời màn
- AC09 hook Run, thiếu = Idle
- AC10 không đổi kinh tế/combat

## Correction 13/09 — owner rejected visual; Codex takeover

See docs/qa/L114-CAMPAIGN-AFK-UI/correction-contract.md. New road environment, full-height canvas, fixed staggered slots projected onto the road. 74 focused tests PASS; RED 3/3 failed before change. Run WAITING_ASSET. Browser visual gate currently BLOCKED; do not treat prior screenshots as evidence for this correction. No merge or deployment.

## 13/09/2026 — TKT-0114 bản đồ hành quân + mini map

Owner từ chối nền sân v2, yêu cầu bám góc nhìn bản đồ của video. Bản v3 nhìn từ trên xuống có đường nối cầu/làng/cổng; cảnh chính, mini map và bản đồ mở rộng dùng cùng một ảnh. Viewport và dấu đội dùng đúng phép chiếu; không mô phỏng tiến ải. Thiếu Run: giữ Idle và camera tĩnh.
76/76 test Chinh chiến/AFK PASS sau RED 2 lỗi thiếu map. Syntax PASS. Chờ CI revision mới. Chrome visual/actions vẫn BLOCKED do preview yêu cầu đăng nhập Vercel đã bị auto-review từ chối; Safari NOT_RUN. Chưa nghiệm thu thẩm mỹ.
Tiếp tục PR108, không merge hoặc deploy. AC11: mini map đồng nhất cảnh, mở/đóng được qua handler cũ. Thuật toán được kiểm thử; thao tác UI thật chưa được kiểm chứng.


## AC12 — AFK farm presentation, owner 13/09
Owner yêu cầu đội có nhân vật, quái xuất hiện tự nhiên và tự farm, chỉ diễn hoạt. Bổ sung vòng spawn → đánh → tan → nghỉ; luân phiên đúng đội hình đã lưu. Dùng Basic đã có và quái rêu nhỏ riêng cho cảnh này; không mở ticket quái/NPC khác. Không gọi reward, save, progression hoặc combat; dùng RAF và lifecycle hiện có. Reduced motion giữ cảnh tĩnh. Run vẫn WAITING_ASSET. Chrome gate tiếp tục BLOCKED; không xác nhận visual PASS.
