# Làn song song TKT-0037+ — 12/09/2026

Owner: rà soát chức năng còn thiếu, tách ticket **độc lập** để nhiều agent build cùng lúc. Ghép `main` không đè nhau.

**Coordinator LIVE** 12/09: PR [#38](https://github.com/bktimmy247/luc-than/pull/38) squash `c990516`.

**Hall + kit LIVE** 12/09: owner gõ `live`. Squash #39–#47 + rebase-merge Rèn #37 → main `a2d8bf1`.


---

## 0. Đã live / đang làm / còn lại

| Nhóm | Việc |
|---|---|
| Live | Chinh chiến/AFK/Bày trận/6v6 · Tướng overlay · Trợ trận 11 nan · Lịch Luyện + Nhật Ký · Tháp · Mộng Lộ · Chợ · Gọi Mộng · Đấu · Săn · Lễ Hội · Rèn hall + command · Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho overlay · kit v2 12 tướng |
| Wave C — 7 agent song song | TKT-0046…0052 restyle sơn mài → hall giả 3D overlay body (Tháp / Mộng Lộ / Chợ / Gọi / Đấu / Săn / Lễ) |
| Không mở ticket | Combat V2 / 42 S+ · 5 nan Lịch `go:null` · visual Bày trận · seed/banner/roster 12 · Auth/DB online · L02c reward (chờ owner) |

---

## 1. Cách ghép không đụng nhau

Mỗi hall ticket **chỉ được sửa file của mình**. `scripts/build-static.mjs` đã import sẵn stub:

`scripts/lanes/tkt-00xx-*.mjs`

Agent **điền stub đó** (`await import('../bag-hall-v1.mjs')` hoặc copy runtime vào stub). **Không thêm dòng import mới** vào `build-static.mjs`.

Wrap `showScreen` trong IIFE của chính hall:

```js
const base = showScreen;
showScreen = function (name) { base(name); syncOpen(ST.screen); };
```

Nhiều wrap xếp chồng được vì mỗi file gọi `base`. Không sửa `index.html`. Không thêm `document.addEventListener('click'|…)`. Không thêm `data-art-go`.

Nhánh: `git checkout -B work/lxx-<slug>-YYYYMMDD origin/main` rồi rebase nếu coordinator/TKT-0036 đã merge.

Nếu TKT-0036 chưa live: **vẫn branch từ `origin/main`**. Rèn hall là lane khác. Preview unlock (`featLocked=false`) **không** mang sang ticket mới.

---

## 2. Wave A — 8 lane song song

| Ticket | Màn | Stub | Khóa resource | Hub |
|---|---|---|---|---|
| [TKT-0037](../tickets/TKT-0037/ticket.md) | Túi đồ | `scripts/lanes/tkt-0037-bag.mjs` | `bag-hall` | Side **Túi đồ** |
| [TKT-0038](../tickets/TKT-0038/ticket.md) | Hòm thư | `tkt-0038-mail.mjs` | `mail-hall` | Side **Hòm thư** |
| [TKT-0039](../tickets/TKT-0039/ticket.md) | Giao việc | `tkt-0039-jobs.mjs` | `jobs-hall` | Trái **Giao việc** |
| [TKT-0040](../tickets/TKT-0040/ticket.md) | Bang Hội | `tkt-0040-guild.mjs` | `guild-hall` | Phải **Bang Hội** |
| [TKT-0041](../tickets/TKT-0041/ticket.md) | Bạn bè | `tkt-0041-friends.mjs` | `friends-hall` | Trái **Bạn bè** |
| [TKT-0042](../tickets/TKT-0042/ticket.md) | Trò chuyện | `tkt-0042-chat.mjs` | `chat-hall` | Phải **Trò chuyện** |
| [TKT-0043](../tickets/TKT-0043/ticket.md) | Gia Tộc | `tkt-0043-clan.mjs` | `clan-hall` | **Không** nút hub mới — mở từ Bang |
| [TKT-0044](../tickets/TKT-0044/ticket.md) | Kho lưu / mã quà | `tkt-0044-vault.mjs` | `vault-hall` | **Không** nút hub mới |

Mỹ thuật: hall **giả 3D tươi nhiều lớp** (pattern Trợ trận / Tướng / Rèn). **Không** sơn mài. **Không** tái `menu-v3233`. Chữ/số/nút là DOM sống.

---

## 3b. Wave C — 7 lane sơn mài → giả 3D

| Ticket | Màn | Stub | Khóa | Hub |
|---|---|---|---|---|
| [TKT-0046](../tickets/TKT-0046/ticket.md) | Tháp Trắng Đêm | `tkt-0046-tower.mjs` | `tower-3d` | Nan Lịch + landmark |
| [TKT-0047](../tickets/TKT-0047/ticket.md) | Mộng Lộ | `tkt-0047-expedition.mjs` | `expedition-3d` | Landmark phải |
| [TKT-0048](../tickets/TKT-0048/ticket.md) | Chợ Mộng | `tkt-0048-shop.mjs` | `shop-3d` | Landmark Chợ |
| [TKT-0049](../tickets/TKT-0049/ticket.md) | Gọi Mộng | `tkt-0049-summon.mjs` | `summon-3d` | Landmark Gọi |
| [TKT-0050](../tickets/TKT-0050/ticket.md) | Đấu Trường | `tkt-0050-arena.mjs` | `arena-3d` | Landmark Đấu |
| [TKT-0051](../tickets/TKT-0051/ticket.md) | Săn Boss | `tkt-0051-hunt.mjs` | `hunt-3d` | Side phải |
| [TKT-0052](../tickets/TKT-0052/ticket.md) | Lễ Hội | `tkt-0052-festival.mjs` | `festival-3d` | Side trái Sự kiện |

Chỉ sửa file `*-3d.*` + hall jpg. **Không** sửa domain / `*-runtime.js` / `*-screen.css` gốc (sơn mài giữ để freeze test). CSS 3d inject sau, kéo `#hv*Root` lên `document.body`.

## 3. Wave B — LIVE

| Ticket | Việc | Khóa | Song song với Wave A? |

|---|---|---|---|
| [TKT-0045](../tickets/TKT-0045/ticket.md) | Kit v2 10 tướng legacy | `hero-kits-v2` | Có — **không** sửa hall/lanes |

Một agent. Không tách 10 PR (cùng `skill-kit.mjs`).

---

## 4. File đóng băng — mọi ticket

Không sửa (trừ khi ticket ghi rõ):

- `JOURNEY_UNLOCK`, `LICH_LUYEN_SPOKES` (5 `go:null` giữ khóa)
- `src/domain/daily/festival/hunt/arena/shop/summon/*.mjs` công thức
- `forge-commands.mjs` CRAFT 20/200 · DUAL 42/420 · pity 30 · +15
- `heroStats` / `teamPower` / `account-gear-runtime.js` `WHEEL` keys
- `battle.html`, `src/domain/combat/**`, `src/domain/hero/splus-*`
- `src/ui/campaign-scene.js` visual Bày trận
- `OFFICIAL_ROSTER_12_IDS` / `defaultPlayer` ownership
- `dist/`, `scripts/preview-8080.py`

---

## 5. Gate mỗi ticket

1. RED test nhỏ trên `tests/<lane>.test.mjs`
2. GREEN overlay + inject stub
3. `npm run build` · `node --test tests/<lane>.test.mjs`
4. Chrome Playwright **390×844** và **768×1024**
5. Evidence `docs/qa/<ID>/` screenshot + `evidence.json`
6. Safari = `NOT_RUN` trừ khi có máy
7. PR vào `main`. **Không merge/live** tới khi owner gõ `live`

---

## 6. Việc cố ý không ticket

| Việc | Lý do |
|---|---|
| 5 nan Lịch Luyện `hold/forgegate/abyss/palace/drill` | Cấm bịa combat |
| Combat V2 / 42 tướng S+ | Nhánh `handoff/l11-*` / lab; không vào roster live |
| Online / Auth / `mong-gioi-server` | Auth/DB **OFF** |
| L02c map thưởng chương | 6 đích chờ owner duyệt |
| Device Safari | Nợ QA, không phải chức năng mới |
| Local `sharp` 2 test fail | Có sẵn; CI có sharp |
