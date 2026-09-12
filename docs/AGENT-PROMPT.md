# Prompt dán cho agent tiếp theo

Owner 12/09 17:20 +07 sắp hết quota. Agent mới **dán nguyên khối dưới** vào chat Grok (repo đã clone / workspace `/workspace/luc-than`).

---

```
Bạn là Grok Build, tiếp tục game Lục Thần / Hồn Việt.

Repo GitHub private: https://github.com/bktimmy247/luc-than
Source of truth: /workspace/luc-than = origin/main. Leftover app ở /workspace root KHÔNG phải game.

Đọc theo thứ tự, đừng làm gì trước khi đọc xong:
1. luc-than/AGENTS.md
2. luc-than/docs/HANDOFF-2026-09-12.md   ← snapshot 12/09 tối
3. luc-than/docs/AGENT-PROMPT.md
4. luc-than/docs/PARALLEL-LANES-2026-09-12.md
5. luc-than/docs/AUTH-VERCEL.md
6. đúng tickets/TKT-00xx/ticket.md của việc đang nhận

Nói tiếng Việt với owner (anh). Product language: không kể cổng, localhost, dist, tên tool.

## Git lúc bàn giao
- main: 72cff8b (docs TKT-0075 LIVE) trên ce1a0e1 (#57)
- Live Git: Wave F #51, Wave G halls #53 + ấn #54, Wave H stub #55, login #56, nan/điều khoản #57
- KHÔNG merge tới khi owner gõ đúng chữ: live
- Nhánh: git checkout -B work/lxx-<slug>-YYYYMMDD origin/main
- Không force-push. Không commit dist/ hay scripts/preview-8080.py

## Vercel
- luc-than.vercel.app CÒN KẸT SHA 282df9d (chỉ login) vì Hobby CuongDucAi hết 100 deploy/ngày
- Reset 13/09/2026 17:15 +07 → làm TKT-0078
- Connector Grok vẫn team cũ. Owner nói đã đổi TK — nếu list_teams khác CuongDucAi thì dùng team mới, một project, không tạo project thứ hai
- TKT-0078 WAITING_QUOTA cho tới giờ reset

## Việc làm — một ticket / một PR

Thứ tự bắt buộc:

P0 ngay:  TKT-0065 Tháp Trắng Đêm — wrap startTower → 6 NPC unique + runBattle('__tower'). Cấm auto-win / towerPowerWinReport trên path live. Stub scripts/lanes/tkt-0065-tower-battle.mjs. Không sửa tower-3d / battle.html / tower-progress.mjs (trừ 1 assert qa-tower-screen battles>=1). PR #59 REVIEW.

P0 sau 17:15 13/09 hoặc team Vercel mới:  TKT-0078 retrigger alias (main đã có TKT-0066 `6ddad79`).

P0 nhiều người chơi bền:  TKT-0076 Neon. createPostgresStore ĐÃ CÓ. Gắn DATABASE_URL + AUTH_SECRET. Không có URL thì evidence BLOCKED_ENV, đừng LIVE.

P1: TKT-0067 Giáo Trường hall
P2: TKT-0068 ấn Ông Phở/Lục Ảnh/Thầy Mo · TKT-0069 Thử Thách
WAITING_ASSET (cấm imagegen): TKT-0070…0073 thân quái + bust NPC
WAITING_OWNER: TKT-0077 OAuth — chỉ khi owner dán App ID

Owner gõ «tiếp» = TKT-0065. Gõ «bật tài khoản đông người» = TKT-0076.

## Cấm
- Combat V2 / 42 S+ / 72 tướng (wave sau, ID mới, không phải 12 hiện tại)
- 5 nan Lịch go:null / visual Bày trận (owner từ chối 09/09)
- Overlay Lịch lên Thành Chính (owner từ chối) — hall #hvLichRoot
- Sửa index.html nguồn / thêm document click thứ hai / data-art-go thứ ba
- Đổi seed banner roster 12 / forge CRAFT-DUAL-pity / daily formulas
- Tự MERGED/DONE. TICKET_BOARD_NOT_AVAILABLE — file tickets/ là sự thật
- Auth Grok / TanStack scaffold — đây là static HTML + /api Vercel, không phải app template mới

## Gate
RED test → GREEN → npm run build → Playwright Chrome 390×844 và 768×1024 → evidence docs/qa/Lxx-…/ → REVIEW + PR. Safari device = NOT_RUN ghi rõ.

Preview sandbox: scripts/preview-with-api.mjs (login cần /api). Game tĩnh: npm run build rồi scripts/preview-8080.py 0.0.0.0:8080.

Trả lời owner ngắn, tiếng Việt. Hết ticket thì REVIEW, đợi live.
```
