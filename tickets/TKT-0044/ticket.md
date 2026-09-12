---
id: TKT-0044
title: Kho lưu / mã quà hall giả 3D overlay body
status: READY
phase: CONTRACT
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T02:35:00.000Z
acceptance_ids: ['L34-T1', 'L34-T2', 'L34-T3', 'L34-T4', 'L34-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/vault-hall-runtime.js', 'src/ui/vault-hall.css', 'scripts/vault-hall-v1.mjs', 'scripts/lanes/tkt-0044-vault.mjs', 'scripts/qa-vault-hall.mjs', 'assets/ui/vault/vault-hall.jpg', 'tests/vault-hall.test.mjs', 'docs/qa/L34-VAULT-HALL/']
resource_locks: ["vault-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l34-vault-hall-20260912
---
# TKT-0044 — Kho lưu / mã quà hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

**Không** thêm nút Thành Chính. Giữ `navTo('vault')` / lối settings hiện có. Overlay `#hvVaultRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#vaultBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0044-vault.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `exportSave` / `importSave` / `redeemCode` / GIFTCODES. Không đổi mã quà hay format MG1.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Auth/DB cloud, Mail, thêm data-art-go, Combat V2.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L34-T1: công thức / command hiện có không đổi (assert source freeze)
- L34-T2: `#hvVaultRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L34-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L34-T4: stub lane `tkt-0044-vault.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L34-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/vault-hall-runtime.js`
- `src/ui/vault-hall.css`
- `scripts/vault-hall-v1.mjs`
- `scripts/lanes/tkt-0044-vault.mjs`
- `scripts/qa-vault-hall.mjs`
- `assets/ui/vault/vault-hall.jpg`
- `tests/vault-hall.test.mjs`
- `docs/qa/L34-VAULT-HALL/`

Shared read-only: `index.html` `#vaultBody` / `showScreen` / `navTo('vault')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L34-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.
