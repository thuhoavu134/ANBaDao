# Hồn Việt: Mộng Giới — AI Handoff / Source of Truth

**Ngày cập nhật:** 2026-09-02
**Repo:** `bktimmy247/luc-than`
**Câu nối mạch:** Khi user nói **“tiếp Hồn Việt”**, tiếp tục từ tài liệu này và build/commit mới nhất, không làm lại pipeline cũ.

## 1) Định hướng sản phẩm
- Game turn-based 2.5D, đội hình 6v6, fantasy Việt Nam.
- User tự tạo/gửi asset; AI phụ trách chuẩn hóa, tích hợp runtime, QA, metadata, source organization.
- Không dùng Spine làm pipeline chính. Hướng cuối cùng: **AI video/PNG sequence → full frames → cleanup/chroma → Texture Atlas/Sprite Atlas → metadata JSON → runtime frame-by-frame**.
- Không cắt frame để tối ưu. Giữ đầy đủ frame authored; atlas chỉ là cách đóng gói texture.

## 2) Chuẩn spatial/combat học từ game mẫu
- Không lấy kích thước PNG làm chuẩn; dùng `footAnchor + displayHeight + scale/trim + offset`.
- Chung baseline theo chân.
- Metadata mỗi tướng/skill nên có: `footAnchor`, `displayHeight`, `hitAnchor`, `castAnchor`, `meleeReach`, `attackOffset`, `vfxScale`, `moveType`.
- Ranged đứng nguyên slot (`moveType=0`), cận chiến mới tiến lên.
- VFX phát từ `castAnchor`; impact/damage tại `hitAnchor`.
- Skill toàn địch đặt theo tâm nhóm địch hoặc các row anchor; không scale VFX theo kích thước tướng.
- x1/x2/x3 phải đồng bộ animation/VFX/projectile/tween/timer, nhưng **không được thay global combat clock kiểu cũ** vì từng gây treo turn.

## 3) Texture Atlas / Skill Atlas Standard V1
Cấu trúc chuẩn:
```text
Hero/
  Skill_01/
    cast/frames.json + atlas
    projectile/frames.json + atlas
    impact/frames.json + atlas
    sfx/
    skill.json
```
- `frames.json` lưu layout, frameCount, cell size, frame duration, anchor, offset, display size, baseline, blend mode, layer.
- `skill.json` lưu `heroId`, `kind`, movement, targeting, timing, audio, effect, parts.
- Runtime dùng registry generic: `HonVietSkillAtlas.get(heroId, kind)`, `getById(id)`, `listHero(heroId)`.
- Registry tự quét `assets/characters/**/skill.json`, validate schema + metadata + atlas tồn tại.

## 4) Tướng đã đưa vào Atlas Registry
### Lục Ảnh
- Reference implementation đầu tiên, đủ **Basic + Skill 1 + Ultimate**.
- Basic: cast → projectile → impact.
- Skill 1: cast → VFX theo từng `hitAnchor` địch.
- Ultimate: character cast + VFX lớn phủ nửa màn hình địch, 3 lớp/3 hàng; không tràn sang team ta.
- Spatial pipeline anchor-based đã giữ lại.
- Local x1/x2/x3 chỉ áp riêng Lục Ảnh; không đụng global turn clock.
- Ultimate có voice; iOS audio unlock dùng first real interaction, không dùng màn chạm chặn.

### Đình Lôi
- Đã đưa vào registry chung.
- Basic: cast → projectile → impact.
- Talent Skill: cast → wave → impact → shield.
- Ultimate: cast → battlefield VFX → impact.
- Atlas 8x8, 64 frame / 4s. Ultimate VFX/Impact cell orientation khác phần còn lại; metadata phải giữ đúng runtime thật.

### Thầy Mo
- Đã bắt đầu/hoàn thiện manifest registry theo asset hiện có.
- Basic: Cast / Projectile / Impact.
- Skill 1 “Chuông Chấn Phách”: Cast / Wave / Impact, ranged, đứng slot.
- Ultimate “Trận Ảnh Phong Môn”: Cast / VFX, phủ toàn đội địch.
- `moveType=0` cho cả 3 vì là ranged.

## 5) Lục Ảnh — các lỗi và rule đã khóa
- Từng có regression do `combat-spatial-clock-v1` thay global timing, làm Lục Ảnh đứng yên và turn không kết thúc.
- Đã rollback/tắt global combat clock patch. **Không bật lại kiểu patch này.**
- Giữ `luc-anh-spatial-pipeline-v1`.
- Scale Idle và skill phải đồng nhất về cảm giác hiển thị.
- Ultimate cần full-strength original effect, không làm mờ; SCREEN chỉ dùng để bỏ black background khi phù hợp.
- Ultimate phủ đủ enemy half, center-reaching, 3 hàng.
- Voice ultimate phải guaranteed.

## 6) Audio
- iOS/iPad chặn autoplay trước user gesture: giải pháp hiện tại là **unlock audio tại lần tương tác thật đầu tiên**, không dựng màn “Tap to Start”.
- BGM routing: hub / hero / combat / challenge.
- Result audio đã tích hợp logic: combat end → dừng combat BGM → victory/defeat audio phát một lần, không loop → rời result thì dừng và chuyển BGM màn sau.
- Asset repo đã có `bgm-victory.mp3` và `bgm-defeat.mp3`.

## 7) Victory / Defeat
- Victory dùng asset V6; Defeat dùng V4.
- Victory hero phải run-in từ trái → đúng tâm cánh → idle loop.
- Defeat: fall 1 lần rồi nằm im.
- Hai nút Victory từng lỗi click; đã có patch reliable taps nhưng phải QA runtime thật sau mỗi thay đổi.
- MVP/tướng/tên phải linh hoạt theo trận.

## 8) UI Tướng theo game mẫu
Flow user mô tả:
- Bấm Tướng → màn danh sách tướng.
- Bấm 1 tướng → màn chi tiết, tướng idle + voice câu giới thiệu.
- Bấm 3 skill xanh → chi tiết skill.
- Nút 3 chấm cạnh khiên → thông số chi tiết.
- Nút áo giáp vàng → trang phục.
- Nút mũi tên vòng tròn → trùng sinh.
- User yêu cầu bỏ UI Tướng cũ hoàn toàn, làm sạch và theo mẫu.

## 9) Background battle — trạng thái hiện tại
- User yêu cầu **background trận là ảnh bitmap thật theo từng chương**, không vẽ CSS.
- Background phải là **asset sạch tuyệt đối**: không nhân vật, không quái, không HUD/UI, không chữ/logo, không VFX, không damage number, không baked shadows nhân vật.
- Composition: 16:9, middle/low-middle rộng và thoáng cho 2 team; foreground nhẹ; background kiến trúc/thiên nhiên Việt; có chiều sâu.
- Patch `battle-visual-polish-v1` từng trỏ Chapter 1 nhầm vào `assets/hub/hub-bg-city-clean-v2571.png`; user xác nhận FAIL vì đó là ảnh hub/Thành Chính và crop mờ.
- **Không dùng ảnh hub cho battle nữa.**
- User sẽ tự gen background sạch theo prompt rồi gửi lại; khi nhận phải đưa chính file đó vào `assets/battle-maps/` và map theo chapter.

## 10) Damage popup font — trạng thái hiện tại
User đưa ảnh mẫu và yêu cầu:
- Damage không phải banner chữ lớn.
- Nhiều hit phải nảy **nhiều dòng dọc sát mục tiêu**, nhìn đã mắt.
- Font nhỏ hơn bản patch hiện tại khoảng 40–50%.
- Màu vàng/cam, viền tối, hơi nghiêng/combat, bounce ngắn, crit chỉ nhấn mạnh vừa đủ.
- Patch hiện tại dùng `Arial Black/Impact`, size ~24/31 và chữ `BẠO KÍCH −xx` còn quá to so với mẫu; **visual FAIL, cần chỉnh lại**.
- Target đề xuất: thường khoảng 13–16px theo WORLD scale hiện tại; crit 16–19px; 5–6 lane, spacing dọc khoảng 15–20px, lifetime đủ để multi-hit chồng nhiều dòng nhưng không che nhân vật.
- Có thể tách label “Bạo Kích” nhỏ hơn damage number hoặc chỉ dùng màu/scale để thể hiện crit, tùy QA với user.

## 11) Prompt background sạch đã giao cho user
Yêu cầu chính:
- Ancient Vietnamese fantasy mountain village battlefield, golden sunset.
- Traditional Vietnamese wooden houses/curved tile roofs, limestone mountains, bamboo, old trees, stone/earth courtyard.
- Center and lower-middle open for two teams.
- 16:9, 1920x1080+.
- ABSOLUTELY NO characters/people/animals/monsters/weapons/VFX/damage/text/logo/HUD/UI/portraits/skill icons/health bars.
- “Do NOT create a game screenshot. The final image must look like an EMPTY RPG BATTLE STAGE before characters/UI are rendered.”

## 12) Voice lines
### Thầy Mo — đã user duyệt
- Giao diện: “Chuông còn ngân, đường âm dương còn mở.”
- Ultimate gợi ý user thích hướng: “Chuông dẫn lối — vạn tà lui!” / hoặc “Trận khai! Hồn định! Tà khí — lui!”

### Ông Phở — chưa chốt cuối
Các phương án tốt hơn đã đề xuất:
- “Lửa còn đỏ, người còn về… bếp này còn ấm.”
- “Giữ được lửa trong bếp, mới giữ được ấm trong nhà.”
- “Nước dùng phải ninh lâu… bản lĩnh cũng vậy.”
- “Ông chỉ bán phở thôi… nhưng đừng có quậy cái quán này.”
Ultimate options:
- “Lửa dậy — vị thành!”
- “Lửa lớn! Nước sôi! Đến lượt ông!”
- “BẾP ĐỎ — PHỞ SÔI!”
- “Nồi đã sôi — khỏi nói nhiều!”
- “Động vào bếp ông à? — ĂN ĐÒN!”
User nói Thầy Mo OK, Ông Phở vẫn đang chọn.

## 13) Roster / character rules
- Roster mục tiêu 12 tướng, đa dạng hệ/role/giới/tuổi/vũ khí/silhouette.
- Ông Phở Golden #1.
- Thầy Mo ranged #2.
- Lạc Yên — Thần Nỏ Sơn Nữ: Kim, xạ kích/phá giáp/kết liễu, nỏ chiến fantasy Việt, nhìn sang phải.
- Đình Lôi và Lục Ảnh đã có asset/runtime đáng kể.
- Prompt asset: character đánh từ trái → phải; ranged tách Cast/Projectile/Impact; melee có thể dash; HIT không lùi; Dodge runtime-only.
- VFX prompt mới phải yêu cầu có SFX đồng bộ trong video source để tách audio sau.

## 14) Build/deployment safety rules
- Luôn tiếp tục từ commit/build mới nhất đã duyệt; không làm lại từ đầu.
- Không tuyên bố PASS nếu chưa có evidence runtime thật.
- Mỗi patch nên nhỏ, idempotent, có rollback riêng.
- Tránh regex phụ thuộc exact formatting; từng gây lỗi Vercel build.
- Không thay global combat clock nữa.
- Khi sửa visual, test trực tiếp trận thật; user là người duyệt cuối cảm giác combat.
- QA x1/x2/x3; không tua/cắt frame.

## 15) Các commit/mốc quan trọng gần đây
- `a2ade70...` rollback shared combat clock regression.
- `d742a485...` Lục Ảnh Basic Skill Atlas Standard V1.
- `e8e99f1f...` Lục Ảnh Skill 1 + Ultimate atlas manifest.
- `5dc43d34...` generic Skill Atlas Registry V1.
- `43fd3335...` Thầy Mo registry manifest fix.
- `55d1b31c...` battle visual polish (image map + damage popup) — **build pass nhưng visual FAIL do dùng hub background + damage font quá lớn**.

## 16) Việc tiếp theo — ưu tiên tuyệt đối
1. **Chờ user gửi background battle sạch** vừa gen.
2. Đưa file vào `assets/battle-maps/chapter-01/...` và cập nhật `BATTLE_MAP_REGISTRY` trỏ đúng asset battle, không dùng hub.
3. Sửa damage popup theo ảnh mẫu: nhỏ hơn, nhiều dòng dọc, sát mục tiêu, crit không thành banner.
4. QA runtime trên iPhone/iPad và desktop: background crop/object-fit, hero readability, damage stacking.
5. Sau khi PASS visual, tiếp tục map background theo từng chương.
6. Tiếp tục đưa roster còn lại vào Skill Atlas Registry chung.

## 17) Câu lệnh cho Agent mới
> “Đọc `docs/HON-VIET-MONG-GIOI-AI-HANDOFF.md` trước. Tiếp tục đúng build mới nhất. Không bật global combat clock. Không dùng hub background cho battle. Ưu tiên tích hợp background battle sạch user gửi và sửa damage popup theo mẫu trước khi làm hệ khác.”
