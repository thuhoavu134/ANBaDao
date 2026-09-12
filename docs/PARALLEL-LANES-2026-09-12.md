# Làn song song TKT-0037+ — 12/09/2026

Owner: rà soát chức năng còn thiếu, tách ticket **độc lập** để nhiều agent build cùng lúc. Ghép `main` không đè nhau.

**Coordinator LIVE** 12/09: PR [#38](https://github.com/bktimmy247/luc-than/pull/38) squash `c990516`.

**Hall + kit LIVE** 12/09: owner gõ `live`. Squash #39–#47 + rebase-merge Rèn #37 → main `a2d8bf1`.

**Wave C LIVE** 12/09: owner gõ `live`. Squash #48 → main `9f2bbff`.

**Wave D LIVE** 12/09: owner gõ `live`. Squash #49 → main `ea59313`.

**Wave E LIVE** 12/09: owner gõ `live`. Squash #50 → main `f43545e`.

**Wave F LIVE** 12/09: owner gõ `live`. Squash [#51](https://github.com/bktimmy247/luc-than/pull/51) → main `5bd9382`. TKT-0056…0057 Hành trình + Kết quả.

**Wave G halls LIVE** 12/09: owner gõ `live`. Squash [#53](https://github.com/bktimmy247/luc-than/pull/53) → main `b0d6d9d`. TKT-0058…0060 + TKT-0064 Safari pin.

**Wave G seals LIVE** 12/09: owner gõ `live`. Squash [#54](https://github.com/bktimmy247/luc-than/pull/54) → main `d94f8a3`. TKT-0061…0063 ấn UI 9 tướng.

**Wave G coordinator LIVE** 12/09: owner gõ `live`. Squash [#52](https://github.com/bktimmy247/luc-than/pull/52) → main `b77f35a`. Stub + ticket. **72 tướng full-asset = wave sau, không phải 12 hiện tại.**

**Wave H coordinator LIVE** 12/09: owner gõ `live`. Squash [#55](https://github.com/bktimmy247/luc-than/pull/55) → main `b4915a9`. Stub TKT-0065…0073. Overlay/runtime **chưa điền**.

**Wave H overlay TKT-0066 LIVE** 12/09: owner gõ `live`. Squash [#60](https://github.com/bktimmy247/luc-than/pull/60) → main `6ddad79`. Chip Thành Chính; Lịch chỉ mũi tên ‹.

**Wave J tickets READY** 12/09 tối: TKT-0076 Neon, TKT-0077 OAuth WAITING_OWNER, TKT-0078 Vercel WAITING_QUOTA. TKT-0066 overlay đã điền; 0065/0067–0069 còn PR.

**Wave I LIVE** 12/09: owner gõ `live`. Squash [#56](https://github.com/bktimmy247/luc-than/pull/56) → main `282df9d`. TKT-0074 đăng nhập.





---

## 0. Đã live / đang làm / còn lại

| Nhóm | Việc |
|---|---|
| Live | Chinh chiến AFK **hall giả 3D** /Bày trận/6v6 · Tướng overlay · Hồ sơ tướng overlay + 12 nền showcase · Trợ trận 11 nan · Lịch Luyện + **Nhật Ký Mơ hall giả 3D** · Tháp/Mộng Lộ/Chợ/Gọi/Đấu/Săn/Lễ **hall giả 3D** · Rèn · Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho · kit v2 12 tướng |
| Wave D | **LIVE** TKT-0053 (#49) Hồ sơ tướng overlay body + 9 nền showcase |
| Wave E | **LIVE** TKT-0054…0055 (#50) Nhật Ký Mơ + Chinh chiến AFK home giả 3D |
| Wave F | **LIVE** TKT-0056…0057 (#51) Hành trình + Kết quả hall giả 3D |
| Wave G | **Halls LIVE** TKT-0058…0060 + Safari pin TKT-0064 (#53). **Ấn UI LIVE** 0061…0063 (#54) |
| Wave H | **Coordinator LIVE** #55 stub. **TKT-0066 LIVE** #60 chip Thành Chính. 0065/0067/0068/0069 còn PR REVIEW |
| Wave I | **LIVE** TKT-0074 (#56) đăng nhập + tài khoản |
| Wave J | **Tickets READY** TKT-0076 Neon · TKT-0077 OAuth WAITING_OWNER · TKT-0078 alias WAITING_QUOTA |

| Không mở ticket | Combat V2 / 42 S+ · **72 tướng full-asset (wave sau, ID mới, không phải 12 hiện tại)** · 5 nan Lịch `go:null` · visual Bày trận · seed/banner/roster 12 · L02c reward (chờ owner) · Hermes 27 · atlas skill trận |

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

## 3c. Wave D

| Ticket | Việc | Stub | Khóa |
|---|---|---|---|
| [TKT-0053](../tickets/TKT-0053/ticket.md) | Hồ sơ tướng overlay + 9 nền showcase | `tkt-0053-hero-detail.mjs` | `hero-detail-hall` |

Không sửa `hero-detail-tabs.js` / 3 PNG Ông Phở · Lục Ảnh · Thầy Mo.

## 3d. Wave E — 2 lane sơn mài/giấy → giả 3D

| Ticket | Màn | Stub | Khóa | Hub |
|---|---|---|---|---|
| [TKT-0054](../tickets/TKT-0054/ticket.md) | Nhật Ký Mơ | `tkt-0054-daily.mjs` | `daily-3d` | Side trái Nhiệm vụ |
| [TKT-0055](../tickets/TKT-0055/ticket.md) | Chinh chiến AFK home | `tkt-0055-campaign.mjs` | `campaign-3d` | Dock Chinh chiến |

Chỉ sửa file `*-3d.*` + hall jpg. **Không** sửa `daily-runtime.js` / `campaign-scene.js`. TKT-0055 **không** restyle `.cs-prepare`.

## 3e. Wave F — 2 lane giấy/sơn mài → giả 3D

| Ticket | Màn | Stub | Khóa | Hub |
|---|---|---|---|---|
| [TKT-0056](../tickets/TKT-0056/ticket.md) | Hành trình | `tkt-0056-journey.mjs` | `journey-3d` | `navTo('journey')` / đích `featLocked` |
| [TKT-0057](../tickets/TKT-0057/ticket.md) | Kết quả + reward veil | `tkt-0057-end.mjs` | `end-3d` | `showScreen('end')` |

Chỉ sửa file `*-3d.*` + hall jpg. **Không** sửa `index.html` / `JOURNEY_UNLOCK`. TKT-0057 restyle `.rewardveil` CSS-only.

## 3f. Wave G — 3 hall + 3 lane ấn UI

| Ticket | Màn | Stub | Khóa | Hub |
|---|---|---|---|---|
| [TKT-0058](../tickets/TKT-0058/ticket.md) | Cốt truyện VN | `tkt-0058-story.mjs` | `story-3d` | `showScreen('story')` / `startStory` |
| [TKT-0059](../tickets/TKT-0059/ticket.md) | Trực Tuyến | `tkt-0059-net.mjs` | `net-3d` | Cạnh trái **Online** |
| [TKT-0060](../tickets/TKT-0060/ticket.md) | Trận Hình legacy | `tkt-0060-team.mjs` | `team-3d` | `navTo('team')` — **không** Bày trận |
| [TKT-0061](../tickets/TKT-0061/ticket.md) | Ấn UI 3 tướng A | `tkt-0061-skill-seals-a.mjs` | `skill-seals-a` | Hồ sơ `lac_yen` `cung_thu_tre` `co_dao_ganh_hoi` |
| [TKT-0062](../tickets/TKT-0062/ticket.md) | Ấn UI 3 tướng B | `tkt-0062-skill-seals-b.mjs` | `skill-seals-b` | Hồ sơ `phong_tu` `thuy_nuong_roi_nuoc` `hong_lien_dao_nuong` |
| [TKT-0063](../tickets/TKT-0063/ticket.md) | Ấn UI 3 tướng C | `tkt-0063-skill-seals-c.mjs` | `skill-seals-c` | Hồ sơ `thach_quyen` `dinh_loi` `to_diep` |

Hall (0058–0060): chỉ sửa file `*-3d.*` + hall jpg. Overlay `#hv{Story,Net,Team}Root` lên `document.body`. Bắt buộc `body.{story,net,team}-3d-active{filter:none}` + `width:100vw;height:100vh;min-height:100vh` (lỗi height 100px Wave F). TKT-0059 **Auth OFF** — restyle, đóng băng `netOnline`/`api`. TKT-0060 **không** sửa `campaign-scene.js` / `.cs-prepare`.

Seals (0061–0063): wrap `renderHeroDetail`, inject CSS riêng, thư mục `assets/ui/skill-seals/{id}/` exclusive. **Không** sửa `hero-detail-tabs.js` / `battle.html` / `index.html` / `campaign-scene.js`. Không viết combat `skill.json`. **Chỉ medallion UI** — owner 12/09: 72 tướng + asset đầy đủ là wave sau, **không** phải nhân vật hiện tại. Cấm idle/combat/portrait sheet đầy đủ cho 12 live.

Ghép Wave F: origin/main kết thúc `tkt-0055-campaign.mjs`. F chèn 0056/0057; G chèn comment `WAVE-G 2026-09-12` + 0058…. Conflict ~2–4 dòng — giữ F rồi block G.

## 3g. Wave H — trận tháp + nút hub + hall còn thiếu + WAITING_ASSET

Stub **sau** `overlay-safari-hotfix-v1.mjs`, **trước** TKT-0074 auth. Filling **không** thêm import `build-static.mjs`. Không sửa `journey-3d` / `end-3d`.

| Ticket | Việc | Stub | Khóa | Status |
|---|---|---|---|---|
| [TKT-0065](../tickets/TKT-0065/ticket.md) | Tháp: wrap `startTower` → 6 NPC + `runBattle('__tower')` | `tkt-0065-tower-battle.mjs` | `tower-battle` | READY P0 |
| [TKT-0066](../tickets/TKT-0066/ticket.md) | Chip Thành Chính chỗ thiếu | `tkt-0066-hub-back.mjs` | `hub-back` | READY P0 |
| [TKT-0067](../tickets/TKT-0067/ticket.md) | Giáo Trường hall + luyện iframe | `tkt-0067-train.mjs` | `train-3d` | READY |
| [TKT-0068](../tickets/TKT-0068/ticket.md) | Ấn UI Ông Phở · Lục Ảnh · Thầy Mo | `tkt-0068-skill-seals-d.mjs` | `skill-seals-d` | READY |
| [TKT-0069](../tickets/TKT-0069/ticket.md) | Thử Thách overlay từ Mộng Lộ | `tkt-0069-challenge.mjs` | `challenge-3d` | READY |
| [TKT-0070](../tickets/TKT-0070/ticket.md) | Thân quái ch.1–2 | `tkt-0070-campaign-foes-a.mjs` | `campaign-foes-a` | **WAITING_ASSET** |
| [TKT-0071](../tickets/TKT-0071/ticket.md) | Thân quái ch.3–4 | `tkt-0071-campaign-foes-b.mjs` | `campaign-foes-b` | **WAITING_ASSET** |
| [TKT-0072](../tickets/TKT-0072/ticket.md) | Thân quái ch.5–6 | `tkt-0072-campaign-foes-c.mjs` | `campaign-foes-c` | **WAITING_ASSET** |
| [TKT-0073](../tickets/TKT-0073/ticket.md) | Chân dung thoại NPC | `tkt-0073-npc-busts.mjs` | `npc-busts` | **WAITING_ASSET** |

0065: **không** sửa `tower-3d*` / `tower-progress.mjs` / `battle.html`. Power gate = toast. Cấm auto-win. 6 `sourceHeroId` unique.

0066: hall đã có close-hub thì bỏ. Không restyle `.cs-prepare`. Không sửa `journey-3d` / `end-3d`.

0070–0073: **không** imagegen wave này. Stub rỗng tới khi art về, ghép file là xong.

## 3h. Wave J — bền tài khoản + alias Vercel

Không stub `build-static.mjs`. Ops + store.

| Ticket | Việc | Khóa | Status |
|---|---|---|---|
| [TKT-0076](../tickets/TKT-0076/ticket.md) | Neon `DATABASE_URL` — `createPostgresStore` đã có | `auth-api` | READY P0 |
| [TKT-0077](../tickets/TKT-0077/ticket.md) | OAuth MXH khi owner dán App ID | `auth-api` | **WAITING_OWNER** |
| [TKT-0078](../tickets/TKT-0078/ticket.md) | Retrigger luc-than.vercel.app sau 13/09 17:15 +07 | `vercel-alias` | **WAITING_QUOTA** |

0076 conflicts 0074 (cùng store). 0077 conflicts 0076/0074 — làm tuần tự. 0078 không sửa game.

---

## 4. File đóng băng — mọi ticket

Không sửa (trừ khi ticket ghi rõ):

- `JOURNEY_UNLOCK`, `LICH_LUYEN_SPOKES` (5 `go:null` giữ khóa)
- `src/domain/daily/festival/hunt/arena/shop/summon/*.mjs` công thức
- `forge-commands.mjs` CRAFT 20/200 · DUAL 42/420 · pity 30 · +15
- `heroStats` / `teamPower` / `account-gear-runtime.js` `WHEEL` keys
- `battle.html`, `src/domain/combat/**`, `src/domain/hero/splus-*`
- `src/ui/campaign-scene.js` visual Bày trận
- `OFFICIAL_ROSTER_12_IDS` / `defaultPlayer` ownership — **không** nới thành 72
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
| **72 tướng + asset đầy đủ** | Owner 12/09: wave **sau**, ID **mới**, **không** phải 12 hiện tại. Không ticket READY |
| Online / Auth / `mong-gioi-server` | Auth/DB **OFF** |
| L02c map thưởng chương | 6 đích chờ owner duyệt |
| Device Safari | Nợ QA, không phải chức năng mới |
| Hermes 27 method | Archive user, chưa trên GitHub |
| Atlas skill trận 9 tướng | Combat-adjacent; cấm full asset cho 12 hiện tại. Wave G chỉ UI medallion |
