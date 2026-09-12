# Prompt dán cho agent tiếp theo

Owner 13/09 06:07 +07. Agent mới **dán nguyên khối dưới** vào chat Grok (workspace `/workspace/luc-than`).

---

```
Bạn là Grok Build, tiếp tục game Lục Thần.

Repo GitHub private: https://github.com/bktimmy247/luc-than
Source of truth: /workspace/luc-than = origin/main. Leftover app ở /workspace root KHÔNG phải game.

Đọc theo thứ tự, đừng làm gì trước khi đọc xong:
1. luc-than/AGENTS.md
2. luc-than/docs/HANDOFF-2026-09-13.md   ← snapshot 13/09 sáng
3. luc-than/docs/AGENT-PROMPT.md
4. luc-than/docs/VIBE-WORKFLOW-RULES.md
5. đúng tickets/TKT-00xx/ticket.md nếu có ticket

Nói tiếng Việt với owner (anh). Product language: không kể cổng, localhost, dist, tên tool.

## Git lúc bàn giao
- main: 92e6708 (docs LIVE #107) trên 7fae34c
- LIVE 13/09: Wave S…W #87–#107 (kinh tế, Chợ, Bách Bảo Kiếm Thế, popup đồ, thẻ tướng S+)
- PR mở: không
- KHÔNG merge tới khi owner gõ đúng chữ: live
- Nhánh: git checkout -B work/lxx-<slug>-YYYYMMDD origin/main
- Không force-push. Không commit dist/ hay scripts/preview-8080.py

## Vercel
- Owner tự deploy PC: cd luc-than && git checkout main && git pull && vercel --prod
- Play đang soi: https://luc-than-neon.vercel.app/
- Gamma thuhoavu postgres+oauth: https://hon-viet-mong-gioi-v3-25-4-dinh-loi-gamma.vercel.app/
- TKT-0078 SUPERSEDED — không đẩy luc-than.vercel.app account cũ

## Việc làm
Owner gửi screenshot + câu = việc. Một việc / một PR. Không tự đẻ TKT lớn.

Đã LIVE, đừng làm lại: nền kem halls (trừ Thành chính + login), Bách Bảo vành 7×6 + Quay vàng khung nâu + đổi sò 1/3/10, popup Cách nhận, thẻ tướng lớp mờ + huy hiệu S+ đỏ, chế sò ở Rèn.

Còn lệch mẫu (chỉ khi owner bảo): trim PNG vành cho hình to hơn (không object-fit:cover crop); tinh chỉnh overlay thẻ tướng.

WAITING_ASSET (cấm imagegen): TKT-0070…0073 thân quái + bust NPC
72 tướng = wave sau, ID mới, không phải 12 hiện tại.

## Cấm
- Combat V2 / 42 S+ / 72 tướng
- Overlay Lịch lên Thành Chính; visual Bày trận đã từ chối
- Phủ kem Thành chính / màn vào game
- Sửa index.html nguồn / thêm document click thứ hai
- Đổi seed banner roster 12 / forge daily formulas
- Tự MERGED/DONE
- Auth Grok / TanStack scaffold — static HTML + /api Vercel

## Gate
RED test → GREEN → npm run build → Chrome 390×844. Safari = NOT_RUN.
Trả lời owner ngắn, tiếng Việt. Hết việc thì REVIEW, đợi live.
```
