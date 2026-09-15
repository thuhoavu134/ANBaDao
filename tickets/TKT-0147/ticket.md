---
id: TKT-0147
title: Ải 1-2 khóa dù đã thắng ải trước
status: REVIEW
phase: REVIEW
priority: P0
acceptance_ids: [L147-T1, L147-T2, L147-T3, L147-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/domain/campaign/player-progress.mjs
  - src/ui/player-progress-runtime.js
  - tests/player-progress.test.mjs
  - tests/player-progress-runtime.test.mjs
  - tickets/TKT-0147/
resource_locks: [player-progress]
branch_hint: work/l147-campaign-prev-stage-20260915
---

# TKT-0147

Owner 15/09: Chinh chiến Ải 1-2 hiện «Vượt ải trước để mở khóa» sau khi đã vào trận.

## Goal

Con trỏ `campaignStages` sau thắng ải là bằng chứng đã vượt ải trước. Không khóa Ải 1-2 khi Ải 1-1 đã thắng. Ghi mốc `clears` khi thắng trận campaign kể cả `battleId` lệch.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage math / initiative / AI / turn clock. Không đụng atlas Linh Đồng.

## Acceptance

- L147-T1: `campaignStages[0]=1` mà `clears` trống → Ải 1-2 OPEN; chưa có con trỏ thì vẫn PREVIOUS_STAGE
- L147-T2: Ải 1-1 luôn OPEN khi chương 1 đã mở; chương sau vẫn cần xong chương trước
- L147-T3: settlement campaign thắng ghi clear theo `ST.campaignBattleIndex` dù `battleId` lệch
- L147-P1: Chrome 390×844 Chinh chiến Ải 1-2 không còn khóa khi đã thắng Ải 1-1. Safari/iPhone NOT_RUN

## Result

REVIEW. Con trỏ `campaignStages` sau thắng ải mở ải kế. Settlement ghi clear theo ải đang đánh, không phụ thuộc `battleId` payload.
GREEN focused + npm test 982/982. Chrome: ảnh owner (Ải 1-2 khóa) là bằng chứng lỗi; bản sửa chưa lên máy anh. Safari NOT_RUN.
Chỉ squash-merge khi owner gõ `live`. Owner tự `git pull && vercel --prod`.
