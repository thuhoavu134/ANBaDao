---
id: TKT-0158
title: Audio trận phát cùng game trên iOS Chrome
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-17T20:10:00.000Z
updated: 2026-09-17T20:40:00.000Z
acceptance_ids: [L158-T1, L158-T2, L158-T3, L158-T4, L158-T5, L158-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - scripts/battle-enter-audio-v1.mjs
  - scripts/build-static.mjs
  - tests/battle-enter-audio.test.mjs
  - scripts/qa-battle-enter-audio.mjs
  - docs/qa/L158-BATTLE-ENTER-AUDIO/
resource_locks: [audio-event]
branch_hint: work/l158-battle-enter-audio-20260917
---
# TKT-0158

Owner 17/09 sau TKT-0157: «khá hơn chút, audio ko thấy phát cùng game». Tab iPhone Chrome sống; Hiệp 01 câm.

Nguyên nhân: chạm Xuất chiến không mở loa combat trên host. iframe tự `new Audio(bgm-combat).play()` sau 250ms — iOS chặn autoplay. Fallback 1.8s `location.assign(battle.html)` phá AudioContext đã unlock. Hunt `hushParentBgm` pause host ngay khi overlay mở.

## Goal

Một chủ quản audio: host phát BGM combat + unlock SFX trong cử chỉ Xuất chiến. iframe không autoplay BGM khi parent đã sở hữu. Overlay không `location.assign` sau 1.8s.

## Non-goals

Không đổi BETS/loot/công thức combat. Không Spine. Không pack lại master. Không đổi footprint 477×440. Không mở encyclopedia 42. Không sửa `index.html` / `battle.html` nguồn (L03a hash). Không thêm nút Bật tiếng. Không merge cho đến khi owner gõ `live`.

## Acceptance

- L158-T1: `dist/index.html` `openIntegratedBattle` gọi `HonVietSfx.unlock` và `playBgm('combat')` trước `frame.src`
- L158-T2: `enterFallback` không `location.assign(url)`
- L158-T3: `dist/battle.html` `beginBattle` gọi `parent.playBgm('combat')` khi parent sở hữu; không `new Audio` BGM trong nhánh đó
- L158-T4: `closeOverlay` gọi `playBgm(desiredBgm(...))` sau `endBattle`
- L158-T5: `hushParentBgm` dist không `bgmPlayer.pause` / `stopCombat` (overlay trận)
- L158-P1: Chrome 390×844 host unlock + combat BGM sau click. Safari/iPhone NOT_RUN

## Review

RED L158-T1…T5 → GREEN 5/5. npm test 1067/1067. Chrome 390×844 `host-combat-bgm-390x844.png` PASS: `bgm-combat-new.mp3` playing, AudioContext running. Safari/iPhone NOT_RUN.

Builder dừng REVIEW. Chờ owner `live` squash-merge. Owner tự `git pull && vercel --prod`.

