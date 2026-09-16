# Quy chuẩn kỹ thuật & template tạo Animation, VFX/SFX — Lục Thần

Nguồn hướng dẫn production cho tướng: video AI → bóc chroma → atlas → runtime.

- Ngày khóa: 14/09/2026
- Runtime animation vẫn là **frame / atlas** (không bắt buộc Spine). Cụm “spine 2D” trong prompt chỉ là **phong cách idle/run** kiểu gacha đánh theo lượt.
- Pipeline sau khi có video: xem [HON-VIET-ASSET-PRODUCTION-STANDARD.md](./HON-VIET-ASSET-PRODUCTION-STANDARD.md).
- Trình diễn trên sân: xem [combat-presentation-standard-v3.24.8.md](./combat-presentation-standard-v3.24.8.md).

**Cách dùng:** copy đúng template slot (IDLE / RUN / HIT / FALL / ATK / VFX ATK / ULT / VFX ULT) → dán vào tool tạo video kèm ảnh tham chiếu tướng → điền chỗ `[MÔ TẢ…]` nếu có.

---

## I. Nguyên tắc kỹ thuật bắt buộc

### 1. Phông nền chroma key

- Toàn bộ video Animation và VFX dùng **xanh lá nguyên khối `#00FF00`**.
- Không viền dính màu (color spill), không gradient, không mặt sàn / nền đất, không bóng đổ dưới chân.

### 2. Góc nhìn & tỷ lệ

- Góc chuẩn: **phẳng 3/4 nhìn nghiêng sang phải** (full body 3/4 side view facing right).
- Đúng chuẩn turn-based RPG / gacha đánh theo lượt.

### 3. Bóc tách độc lập (isolated passes)

| Pass | Được có | Không được có |
|---|---|---|
| Animation nhân vật | Chỉ mô hình + chuyển động | Ma thuật, đòn đánh, VFX |
| VFX + SFX (1 pha liền mạch) | Ánh sáng / hạt / đường đạn / nổ, trái → phải | Nhân vật, bóng người, sàn đấu |

### 4. Màu hiệu ứng hệ Độc / ăn mòn

Dùng **đen tuyền** (pitch-black / inky black / necrotic obsidian) để chết chóc, cổ truyền, và **tương phản sạch 100%** với phông `#00FF00`.

---

## II. Bộ khung prompt chuẩn

Chỗ `[VIẾT HOA TRONG NGOẶC VUÔNG]` là chỗ điền theo từng tướng. Phần còn lại **không sửa**.

### 1. IDLE — dáng đứng chờ

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng tham chiếu! hành động trong video là ông ấy đứng yên phập phồng dáng idle dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx Nền video phải là màu CHROMA GREEN #00FF00.
```

### 2. RUN — chạy di chuyển

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng tham chiếu! hành động trong video là ông ấy chạy từ trái sang phải dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx Nền video phải là màu CHROMA GREEN #00FF00.
```

### 3. HIT — trúng đòn

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng nhân vật! hành động trong video là nhân vật bị trúng đòn hơi ngửa ra sau và trở lại bình thường, 2 chân giữ nguyên vị trí dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx, không có âm thanh, không có âm nhạc, không có hiệu ứng                                                                          Nền video phải là màu CHROMA GREEN #00FF00.
Không gradient, không sàn, không background object.
```

### 4. FALL / DIE — bị hạ gục

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng nhân vật! hành động trong video là nhân vật bị ngã ngửa ra sau sang bên trái dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx, không có âm thanh, không có âm nhạc, không có hiệu ứng                                                                          Nền video phải là màu CHROMA GREEN #00FF00.
Không gradient, không sàn, không background object.
```

### 5. ATK — animation ra đòn / kỹ năng

Điền `[MÔ TẢ HÀNH ĐỘNG RA ĐÒN CỦA NHÂN VẬT]`.

```
Isolated character animation pass. Full body 3/4 side view facing right. [MÔ TẢ HÀNH ĐỘNG RA ĐÒN CỦA NHÂN VẬT]. Flowing sleeve physics. Pure solid chroma key green screen background (#00FF00), strictly character only, no floor, no ground, no floor cast shadows, no spell VFX, clean cel-shaded anime character action keyframes, 4k 60fps.
```

### 6. VFX + SFX ATK — hiệu ứng đòn 1 pha liền mạch

Điền `[MÔ TẢ ĐƯỜNG ĐẠN BAY VÀ ĐIỂM VA CHẠM PHÁT NỔ TỪ TRÁI SANG PHẢI]`, `[TỪ KHÓA ĐẶC THÙ NHÂN VẬT]`, `[MÔ TẢ CHUỖI ÂM THANH XUẤT CHIÊU, BAY VÀ VA CHẠM]`.

```
Isolated game VFX animation pass. Side-view 3/4 perspective moving from left to right. [MÔ TẢ ĐƯỜNG ĐẠN BAY VÀ ĐIỂM VA CHẠM PHÁT NỔ TỪ TRÁI SANG PHẢI]. Pure solid chroma key green screen background (#00FF00), completely isolated magic VFX element, no characters, no human figures, no ground, no floor, crisp cel-shaded anime game particle effects, 4k assets
Negative Prompt / Bổ trợ loại trừ:
character, human, person, [TỪ KHÓA ĐẶC THÙ NHÂN VẬT], enemy, silhouette, body, face, floor, ground, stones, scenery, 3d model.
SFX tích hợp:
(Hệ thống âm thanh đồng bộ: [MÔ TẢ CHUỖI ÂM THANH XUẤT CHIÊU, BAY VÀ VA CHẠM]).
```

### 7. ULT — animation vận chiêu tuyệt kỹ

Điền `[MÔ TẢ HÀNH ĐỘNG VẬN CHIÊU TUYỆT KỸ]`.

```
Sử dụng giữ nguyên hình ảnh tham chiếu Isolated character animation pass. Full body 3/4 side view facing right. [MÔ TẢ HÀNH ĐỘNG VẬN CHIÊU TUYỆT KỸ], floating sleeve ribbons fluttering violently. Pure solid chroma key green screen background (#00FF00), strictly character model only, no floor, no ground, no floor shadow, no ghost VFX, clean cel-shaded anime ultimate action, 4k 60fps.
```

### 8. VFX + SFX ULT — hiệu ứng tuyệt kỹ toàn màn hình

Điền `[MÔ TẢ CƠN BÃO HIỆU ỨNG DIỆN RỘNG CÀN QUÉT TỪ TRÁI SANG PHẢI VÀ KÍCH NỔ]`, `[TỪ KHÓA ĐẶC THÙ NHÂN VẬT]`, `[MÔ TẢ CHUỖI ÂM THANH BÙNG NỔ DIỆN RỘNG VÀ SUB-BASS]`.

```
Isolated fullscreen magical game VFX asset. Side-view 3/4 perspective. [MÔ TẢ CƠN BÃO HIỆU ỨNG DIỆN RỘNG CÀN QUÉT TỪ TRÁI SANG PHẢI VÀ KÍCH NỔ]. Solid chroma key green screen background (#00FF00), strictly VFX elements only, no characters, no human figures, no floor, no environment, dynamic cel-shaded anime particle FX pass, high contrast, 4k.
Negative Prompt / Bổ trợ loại trừ:
character, [TỪ KHÓA ĐẶC THÙ NHÂN VẬT], person, enemies, crowd, human body, floor, ground, architecture, background environment.
SFX Tích hợp:
Hệ thống âm thanh đồng bộ: [MÔ TẢ CHUỖI ÂM THANH BÙNG NỔ DIỆN RỘNG VÀ SUB-BASS].
```

---

## III. Ví dụ mẫu hoàn chỉnh — tướng Linh Đồng (hệ Âm hồn)

### 1. IDLE

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng tham chiếu! hành động trong video là ông ấy đứng yên phập phồng dáng idle dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx Nền video phải là màu CHROMA GREEN #00FF00.
```

### 2. RUN

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng tham chiếu! hành động trong video là ông ấy chạy từ trái sang phải dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx Nền video phải là màu CHROMA GREEN #00FF00.
```

### 3. HIT

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng nhân vật! hành động trong video là nhân vật bị trúng đòn hơi ngửa ra sau và trở lại bình thường, 2 chân giữ nguyên vị trí dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx, không có âm thanh, không có âm nhạc, không có hiệu ứng                                                                          Nền video phải là màu CHROMA GREEN #00FF00. Không gradient, không sàn, không background object.
```

### 4. FALL / DIE

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng nhân vật! hành động trong video là nhân vật bị ngã ngửa ra sau sang bên trái dạng spine 2D! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx, không có âm thanh, không có âm nhạc, không có hiệu ứng                                                                          Nền video phải là màu CHROMA GREEN #00FF00. Không gradient, không sàn, không background object.
```

### 5. ATK

```
Isolated character animation pass. Full body 3/4 side view facing right. Chibi boy monk pulls back his right arm holding an antique bronze bell, eyes flashing with eerie focus, then sharply thrusts his bell forward to the right, shaking his wrist with a snappy snapping motion, and smoothly recoils back to combat stance. Flowing sleeve physics. Pure solid chroma key green screen background (#00FF00), strictly character only, no floor, no ground, no floor cast shadows, no spell VFX, clean cel-shaded anime character action keyframes, 4k 60fps.
```

### 6. VFX + SFX ATK

```
Isolated game VFX animation pass. Side-view 3/4 perspective moving from left to right. A glowing ethereal pale-cyan spectral ghost-skull projectile shoots horizontally forward, trailing violent ghostly blue wisps, spectral smoke ribbons, and crackling spiritual psychic spark ripples, exploding into a burst of ethereal soul shockwaves on the right side. Pure solid chroma key green screen background (#00FF00), completely isolated magic VFX element, no characters, no human figures, no ground, no floor, crisp cel-shaded anime game particle effects, 4k assets
Negative Prompt / Bổ trợ loại trừ: character, human, person, boy, monk, enemy, silhouette, body, face, floor, ground, stones, scenery, 3d model.
SFX tích hợp: (Hệ thống âm thanh đồng bộ: tiếng chuông lắc kim loại buốt lạnh đanh gọn "CHIME-RING TINKLE", tiếp nối tiếng bóng ma rít gió xé toạc không gian "SPECTRAL HOWL WHOOSH", kết thúc bằng tiếng nổ xung kích tâm linh dội màng nhĩ "PSYCHIC HIT IMPACT BOOM").
```

### 7. ULT

```
Sử dụng giữ nguyên hình ảnh tham chiếu Isolated character animation pass. Full body 3/4 side view facing right. Chibi boy monk crosses both arms over his chest holding twin bronze bells, dramatically thrusts both hands upward skyward, furiously shaking both bells in rapid rhythmic succession, tilting head back with an ominous creepy grin, floating sleeve ribbons fluttering violently. Pure solid chroma key green screen background (#00FF00), strictly character model only, no floor, no ground, no floor shadow, no ghost VFX, clean cel-shaded anime ultimate action, 4k 60fps.
```

### 8. VFX + SFX ULT

```
Isolated fullscreen magical game VFX asset. Side-view 3/4 perspective. A colossal roaring supernatural storm of thousands of glowing pale-blue screaming ghost wisps and spectral smoke vortexes bursting from an ethereal netherworld rift on the left, rushing horizontally across the entire screen from left to right, detonating across the entire right side with glowing cyan curse runes, violent psychic energy shockwaves, and soul residue. Solid chroma key green screen background (#00FF00), strictly VFX elements only, no characters, no human figures, no floor, no environment, dynamic cel-shaded anime particle FX pass, high contrast, 4k.
Negative Prompt / Bổ trợ loại trừ: character, boy, person, monk, enemies, crowd, human body, floor, ground, architecture, background environment.
SFX Tích hợp: Hệ thống âm thanh đồng bộ: tiếng rung lắc chuông dồn dập rợn người "FRANTIC DUAL-BELL RATTLING", tiếng ngàn bóng ma rít gào như bão táp càn quét "DEAFENING GHOST SCREAM SWARM", kết thúc bằng tiếng bùa chú phong ấn nổ dội chấn động sub-bass "SEALING SUB-BASS SHUTDOWN".
```

---

## IV. Ví dụ mẫu hoàn chỉnh — tướng Bạch Diện (hệ Âm hồn, extra)

ID `hero_splus_bach_dien`. Prompt đầy đủ trong `assets/characters/bach-dien/PROMPTS.md`. Pack atlas chờ owner.

### 1. IDLE / 2. RUN / 3. HIT / 4. FALL

Dùng đúng template mục II.1–II.4 (chroma `#00FF00`, spine 2D chỉ là phong cách).

### 5. ATK — Huyễn Diện Trảm

```
Isolated character animation pass. Full body 3/4 side view facing right. Elegant androgynous opera performer in white robes snaps open an iron fan with sharp flick of the right wrist, thrusts it forward horizontally in a swift lunging strike, then gracefully spins the fan closed and retreats to composed combat stance. Flowing sleeve physics. Pure solid chroma key green screen background (#00FF00), strictly character only, no floor, no ground, no floor cast shadows, no spell VFX, clean cel-shaded anime character action keyframes, 4k 60fps.
```

### 6. VFX + SFX ATK

```
Isolated game VFX animation pass. Side-view 3/4 perspective moving from left to right. A sharp sweeping crescent slash of pure pitch-black ink energy combined with a shrieking white porcelain mask projectile shoots horizontally forward, trailing splashing black calligraphy ink droplets and red cinnabar sparks, violently exploding into a burst of shattered white ceramic shards and violent black ink shockwaves on the right side. Pure solid chroma key green screen background (#00FF00), completely isolated magic VFX element, no characters, no human figures, no ground, no floor, crisp cel-shaded anime game particle effects, 4k assets
Negative Prompt / Bổ trợ loại trừ: character, human, person, opera performer, assassin, enemy, silhouette, body, face, floor, ground, stones, scenery, 3d model.
SFX tích hợp: (Hệ thống âm thanh đồng bộ: tiếng mở quạt nan sắt đanh thép "SHARP IRON FAN SNAP", tiếp nối tiếng mặt nạ ma quái rít gió xé toạc không gian "EERIE HIGH-PITCHED WHISTLING WHOOSH", kết thúc bằng tiếng gốm sứ vỡ nát hòa cùng xung kích mực đen dội màng nhĩ "SHATTERING PORCELAIN & HEAVY INK IMPACT BOOM").
```

### 7. ULT — Ly Hồn Đoạt Phách

```
Sử dụng giữ nguyên hình ảnh tham chiếu Isolated character animation pass. Full body 3/4 side view facing right. Opera performer character dramatically reaches up with left hand to rip off the white porcelain mask, thrusts the mask forcefully forward with both arms outstretched toward the right in an explosive casting surge, flowing sleeve ribbons fluttering violently. Pure solid chroma key green screen background (#00FF00), strictly character model only, no floor, no ground, no floor shadow, no ghost VFX, clean cel-shaded anime ultimate action, 4k 60fps.
```

### 8. VFX + SFX ULT

```
Isolated fullscreen magical game VFX asset. Side-view 3/4 perspective. A gigantic glowing porcelain phantom mask weeping black ink tears erupts on the left, rocketing across the entire screen from left to right, violently clamping onto the right side while releasing massive swirling vortexes of pure pitch-black curse calligraphy ribbons, detonating into a catastrophic burst of flying porcelain fragments and violent dark soul shockwaves. Solid chroma key green screen background (#00FF00), strictly VFX elements only, no characters, no opera actor, no enemies, no crowd, no human body, no floor, no environment, dynamic cel-shaded anime particle FX pass, high contrast, 4k.
Negative Prompt / Bổ trợ loại trừ: character, opera actor, performer, person, enemies, crowd, human body, floor, ground, architecture, background environment.
SFX Tích hợp: Hệ thống âm thanh đồng bộ: tiếng cười ré ma mị rợn người của đào hát "CREEPY OPERA CHUCKLE ECHO", tiếng mặt nạ khổng lồ lao vút xé gió "MASSIVE ROARING GHOST PROJECTILE", kết thúc bằng tiếng phong ấn linh hồn nát vụn dội tiếng bass cực trầm "SOUL-SHATTERING DETONATION SUB-BASS".
```
