---
id: TKT-0032
title: Lịch Luyện ải wheel + Nhật Ký Mơ domain
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T19:10:00.000Z
updated: 2026-09-12T02:46:00.000Z
acceptance_ids: ["L21-T1","L21-T2","L21-T3","L21-P1","L21-P2","L21-P3","L21-P4","L21-P5"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/daily/daily-run.mjs","src/ui/daily-runtime.js","src/ui/daily-screen.css","scripts/daily-runtime-v1.mjs","scripts/build-static.mjs","tests/daily-run.test.mjs","scripts/qa-daily-screen.mjs","assets/daily/"]
resource_locks: ["daily-screen","lich-luyen-wheel"]
---
# TKT-0032 — Lịch Luyện bánh xe đi ải + Nhật Ký Mơ

Goal: Dock **Lịch Luyện** opens a **dedicated full-screen hall** (Trợ trận `#hvGearRoot` pattern: own hall bg, back X, chips, 11 unique painted ải icons). Side **Nhiệm vụ** keeps Nhật Ký Mơ. Sign-in / nap / idle / quest go through `hvRunCommittedTransaction`. Do **not** add a hub landmark. Do **not** invent new combat modes. Do **not** overlay the wheel on Thành Chính citadel. Do **not** reuse `menu-v3233` icons on spokes.

Non-goals: new currency, Combat V2, second `data-art-go`, seed/banner, changing 12-id roster, wrapping `questProgress`, Trợ trận painted icons (separate follow-up).

Branch: `work/l21-daily-onto-main` from main `42b0e24`. Owner gõ `live` 12/09 → squash-merge PR #33 → main `a1f936a`.

## Keep (live formulas)

- stamCap 120 · regen 5 phút · nap +50⚡ · trưa 11–14 · tối 18–21
- idle 12h · 🪙60/h · `floor(hrs×60×(1+0.5×chương)×guild×clan)` · `ga_bao_thuc` ×1.15 · min 0.02h
- điểm danh: n%28 → 💎120 · n%14 → 💎60 · n%7 → 💎30 · else 🪙120 · +1🐚 · `meo_mun` +2⚡
- 14 việc vặt · Sôi Nổi 20/40/60/80 · 5 việc tuần · nhật ký max 40
- JOURNEY_UNLOCK: Tháp ch.1 · Mộng Lộ ch.2 · Săn/Đấu ch.3 · Qua Ải + Luyện mở đêm 1

## Acceptance

- L21-T1..P3: nhật ký formulas frozen (unchanged)
- L21-P4: `#hvLichRoot` dedicated `inset:0` z-index 80 + `#hvDailyRoot`; dock intercept; unique `assets/daily/spokes/`; no new `data-art-go`; inject after festival
- L21-P5: 11 spokes with unique painted icons; night-1 Qua Ải + Luyện open; Tháp after 1 chương; ải `go:null` stay locked

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN `tests/daily-run.test.mjs` (L21-T1..T3 + L21-P1..P5)
- Chrome 390×844: dock Lịch Luyện → màn hall riêng 11 nan sơn; Qua Ải → Chinh chiến; Nhiệm vụ → Nhật Ký Mơ. Evidence `docs/qa/L21-DAILY/`
- Safari / device: NOT_RUN
- Deploy: squash-merge PR #33 → main `a1f936a67e125fd4a22f5f1b62ee798b67b0fec6`. Vercel production `dpl_G49Q6XjU29UzEYczLLRfvvq7VSpk` READY. Live HTTP 200.
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim / MERGED / DONE. Owner gõ `live`; Builder ghi LIVE trên main, không tự chuyển board.
