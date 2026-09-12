---
id: TKT-0078
title: Retrigger Vercel production sau khi Hobby hết hạn
status: SUPERSEDED
phase: SUPERSEDED
priority: P0
created: 2026-09-12T17:20:00.000Z
updated: 2026-09-12T17:20:00.000Z
acceptance_ids: ['L78-T1', 'L78-P1']
required_gates: ["vibelab"]
affected_paths: ['docs/AUTH-VERCEL.md']
resource_locks: ["vercel-alias"]
parallel_wave: J
depends_on: []
conflicts_with: []
branch_hint: work/l78-vercel-retrigger-20260913
---
# TKT-0078 — Alias luc-than.vercel.app bắt kịp Git main

Wave **J** P0 ops. **Không làm trước 13/09/2026 17:15 +07.**

## Hiện trạng 12/09 17:20 +07

| | |
|---|---|
| Git `main` | `72cff8b` — TKT-0075 LIVE, Wave F #51, Wave H stub #55, login #56 |
| Alias [luc-than.vercel.app](https://luc-than.vercel.app/) | kẹt `dpl_Gw6KtJFxJYdGdxHVUBksnZAtYE2t` SHA `282df9d` (chỉ login) |
| Team Grok thấy | Hobby **CuongDucAi** `team_zHvAgW8dvl6qAM2oddNpPY6n` |
| Lỗi | `402 api-deployments-free-per-day` remaining 0, reset **13/09/2026 17:15 +07** |
| Owner | đã nói đổi tài khoản Vercel — connector Grok **vẫn** team cũ |

## Goal

Sau reset (hoặc khi Grok thấy team Vercel **mới**):

1. Deploy `main` lên **một** project gắn repo `bktimmy247/luc-than`. Không tạo project thứ hai trừ khi owner xác nhận URL mới.
2. Alias production HTTP 200, HTML có `#hvJourneyRoot` (Wave F) + `#hvLoginRoot` (I) + spoke `hold.jpg` không ổ khóa nướng (0075).
3. Empty commit docs **chỉ khi** Git hook không tự chạy.

## Non-goals

Không sửa game. Không merge nhánh feature. Không đụng Hobby nếu remaining 0. Không Combat V2.

## Acceptance

- L78-T1: `list_deployments` production `state=READY` SHA ≥ `ce1a0e1`
- L78-P1: mở luc-than.vercel.app (hoặc URL team mới owner gửi) — login + Thành Chính + Lịch Luyện nan không khóa nướng

Builder ghi evidence URL + SHA. Không tự MERGED/DONE.

Owner 12/09 21:10: **bỏ** luc-than.vercel.app / Hobby CuongDucAi. Production = team **thuhoavu** `hon-viet-mong-gioi-v3-25-4-dinh-loi-spacing-root` → [hon-viet-mong-gioi-v3-25-4-dinh-loi-gamma.vercel.app](https://hon-viet-mong-gioi-v3-25-4-dinh-loi-gamma.vercel.app/). Không retrigger alias cũ.
