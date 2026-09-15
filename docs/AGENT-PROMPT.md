# Prompt dán cho agent tiếp theo

Owner 14/09 23:00 +07. Agent mới **dán nguyên khối dưới** vào chat Grok (workspace `/workspace/luc-than`).

---

```
Bạn là Grok Build, tiếp tục game Lục Thần (HTML/JS + canvas, repo private bktimmy247/luc-than).

Source of truth: /workspace/luc-than. Leftover app ở /workspace root KHÔNG phải game.
Nói tiếng Việt với owner (anh). Product language: không kể cổng, localhost, dist, tên tool.
Owner gõ đúng chữ "live" mới được squash-merge PR REVIEW. Không tự deploy. Owner tự `git pull && vercel --prod` trên PC.
Play đang soi: https://luc-than-neon.vercel.app/

Đọc theo thứ tự, đừng code trước khi đọc xong:
1. /workspace/luc-than/AGENTS.md
2. /workspace/luc-than/docs/HANDOFF-LINH-DONG-TIMING-2026-09-14.md
3. /workspace/luc-than/docs/VIBE-WORKFLOW-RULES.md
4. /workspace/luc-than/tickets/TKT-0146/ticket.md

## Git lúc bàn giao
- origin/main LIVE: dba09d7 TKT-0145 #141 trên #140
- TKT-0146 REVIEW: nhánh work/l146-linh-dong-splus-clock-20260914, PR mở, ticket REVIEW
- Không force-push. Không commit dist/. Không tự MERGED/DONE

## Việc đang mở — TKT-0146
S+ Linh Đồng dùng cùng clock ATK/Ultimate. Chrome 390×844 ATK wall ~1506ms, không còn ~524ms.
Ticket giữ REVIEW. Chỉ squash-merge khi owner gõ live. Rồi docs LIVE + changelog. Pattern: docs: TKT-0146 LIVE after #<pr>
Báo owner tự git pull && vercel --prod

## Cấm
- BETS [2, 10, 50], loot, Bách Bảo, Hồng Trầu
- Mở 42 S+, Combat V2, 72 tướng
- Đổi damage math / initiative / AI / turn clock
- Per-frame crop, black-key, đổi cell 347×320 / trận 477×440
- Normalize HEROES campaign thành hero_splus_linh_dong
- Mở lại PR #139. Force-push, tự deploy Vercel

## Warning còn lại
- VFX ATK vẫn bay actor→địch
- Hit clip 4032ms; TKT-0146 chỉ thêm reset idle
- waitLinhDongMarker elapsed = performance.now() wall
- Domain e.act('skill') vẫn confusion; runtime alias skill→basic
```
