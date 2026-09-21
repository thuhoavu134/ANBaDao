# TKT-0159 — Action Movement Profiles + owner preview gate

Status: PREVIEW_GATE
Date: 2026-09-21
Branch: `work/tkt-0159-action-movement-profiles-20260921`
Base: latest `main`

## Goal

Chuẩn hóa cách một skill đi tới điểm thi triển theo profile rõ ràng thay vì chỉ có tween/snap. Trước khi merge, owner phải được test cảm giác trực tiếp trên runtime 6v6 thật.

## Scope

- Mở rộng owner `src/combat-domain/skill-cast-movement.mjs` với 4 travel profile:
  - `snap`: dịch chuyển tức thời tới cast point.
  - `dash`: lướt/tween nhanh tới cast point.
  - `run`: chạy/tween theo timing hiện tại.
  - `stationary`: giữ nguyên home và cast tại chỗ.
- Giữ mapping production hiện tại của Lục Ảnh = snap; không tự đổi Đình Lôi/Ông Phở.
- Thêm bộ chọn movement trong `/skill-test.html` để owner đổi Snap/Dash/Run/Đứng yên cho Lục Ảnh trên cùng trận 6v6 và cùng skill.
- Browser QA phải ép và xác nhận đủ 4 profile bằng trace thật.
- Preview PR phải có URL test trực tiếp trước merge.

## Non-goals

- Không đổi combat math, damage, crit, energy, targeting, reward, save, auth.
- Không đổi asset/VFX/SFX/timing authored của skill.
- Không đổi movement production của Đình Lôi/Ông Phở.
- Không merge main hoặc deploy production trước khi owner test và chấp thuận.

## Acceptance

- A1: policy validation hỗ trợ snap/dash/run/stationary; tween cũ tương thích như run.
- A2: snap không tween; dash tween nhanh hơn run; stationary không di chuyển; run giữ timing approach hiện tại.
- A3: home/baseX/baseY bất biến; return-home vẫn await owner hiện tại.
- A4: /skill-test.html cho đổi movement Lục Ảnh và ép Basic/Skill/Ultimate trên runtime 6v6 thật.
- A5: browser QA desktop/mobile xác nhận 4 movement profile, action start→impact→complete, actor về home, không runtime/asset critical error.
- A6: owner nhận URL preview branch/PR để test cảm giác trước merge.

## Gate

Branch only → RED/GREEN → CI/browser evidence → preview owner test → owner nói merge/live thì mới merge.


## 2026-09-21 preview checkpoint

- Movement selector now mutates the real internal battle actor through `__HV_SKILL_MOVEMENT_QA.setTravel`; `__HON_VIET__.getUnits()` is snapshot-only and is not used for mutation.
- Labels for owner feel test: Dịch chuyển / Lướt nhanh / Chạy / Đứng tại chỗ.
- PR remains Draft and MUST NOT merge before owner hands-on approval.
- If hosted CI/preview infrastructure does not allocate a runner, status remains blocked at preview gate rather than treating infrastructure failure as code failure.
