# Tịnh Mặc (Độ Hồn Đao Khách) — 8 prompt chroma `#00FF00`

Nhân vật: kiếm sĩ chibi tiên hiệp **bịt mắt** bằng dải băng xanh đậm có chữ Hán khắc, tóc bạc dài buộc đuôi ngựa, áo bào nhiều lớp (trong trắng viền mực loang, ngoài xanh đậm/đen), giáp nhẹ vai phải, thắt lưng da có chuỗi hạt ngọc xanh quấn quanh, **tua rua đỏ** treo ở eo, ủng đen cao cổ. Vũ khí: **đại đao (guandao)** cán dài tối màu vác ngang vai phải, lưỡi đao bản khắc hoa văn mây cuộn, **lửa xanh dương cháy dọc sống đao**, nhiều dải **bùa giấy phù chú** cuốn quanh cán và bay phất phới, đuôi cán gắn tua đỏ.

Nền mọi clip: **CHROMA GREEN `#00FF00`**. Không gradient, không sàn, không bóng chân, không chữ, không watermark/ngôi sao 4 cánh ở góc.

> Ghi chú nguồn (2026-10-21): các clip nguồn của tướng này do chủ dự án cung cấp (Gemini) — đã bake sẵn **lửa xanh trên lưỡi đao** và **dải bùa giấy** vào bản thân nhân vật, đồng thời còn **biểu tượng ngôi sao 4 cánh ở góc phải dưới** (được packer loại bằng crop thành phần liền kề lớn nhất). Lửa xanh là identity của tướng nên được giữ nguyên, không tách pass.

## 1. IDLE

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng tham chiếu! hành động trong video là ông ấy đứng yên phập phồng dáng idle dạng spine 2D, đại đao vác vai phải, lửa xanh trên lưỡi đao lay nhẹ, dải bùa giấy trên cán đao phất phới, tua rua đỏ ở eo đung đưa, chuỗi hạt ngọc xanh lắc nhẹ, tóc bạc bay nhẹ về sau! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx Nền video phải là màu CHROMA GREEN #00FF00.
Không gradient, không sàn, không background object.
```

## 2. RUN

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng tham chiếu! hành động trong video là ông ấy chạy từ trái sang phải dạng spine 2D, đại đao vác vai, lửa xanh kéo dài sau lưỡi, dải bùa giấy bay ngược, tua rua đỏ và chuỗi hạt ngọc đung đưa theo nhịp bước! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx Nền video phải là màu CHROMA GREEN #00FF00.
Không gradient, không sàn, không background object.
```

## 3. HIT

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng nhân vật! hành động trong video là nhân vật bị trúng đòn hơi ngửa ra sau và trở lại bình thường, 2 chân giữ nguyên vị trí dạng spine 2D, đại đao vác vai run lên, dải bùa giấy chao đảo, lửa xanh trên đao bật lên rồi tắt dần! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx, không có âm thanh, không có âm nhạc, không có hiệu ứng Nền video phải là màu CHROMA GREEN #00FF00.
Không gradient, không sàn, không background object.
```

## 4. FALL / DIE

```
tạo video yêu cầu giữ nguyên nhân vật tham chiếu và hình dáng nhân vật! hành động trong video là nhân vật bị ngã ngửa ra sau sang bên trái dạng spine 2D, đại đao tuột khỏi vai rơi theo, lửa xanh trên đao tắt dần, dải bùa giấy rơi lảo tẩu, tóc bạc đổ xuống đất! video kiểu hoạt hình giống tạo hình nhân vật! giống như trong game gacha đánh theo lượt! không có phông nền video! chỉ tập trung vào chuyển động của nhân vật, ko có vfx, không có âm thanh, không có âm nhạc, không có hiệu ứng Nền video phải là màu CHROMA GREEN #00FF00.
Không gradient, không sàn, không background object.
```

## 5. ATK — Chém Đao Hồn (character only)

```
Isolated character animation pass. Full body 3/4 side view facing right. Blindfolded chibi swordsman with silver ponytail, layered dark blue and white robes with ink-splattered trim, red tassel at the waist and green bead chain belt, huge guandao blade resting on his right shoulder with burning blue flame along the blade spine and paper talisman strips fluttering from the haft. He drops his stance low, swings the guandao in a wide horizontal crescent slash from upper right down to lower left, blue flame trailing the blade edge, then settles back into a low combat stance. Pure solid chroma key green screen background (#00FF00), strictly character only, no floor, no ground, no floor cast shadows, no separate spell VFX pass, clean cel-shaded anime character action keyframes, 4k 60fps.
Negative Prompt / Bổ trợ loại trừ: background, scenery, ground, floor, shadow, extra characters, crowd, text, watermark, logo, 3d model render.
```

## 6. VFX + SFX ATK — vệt lưỡi liềm lửa xanh

```
Isolated game VFX animation pass. Side-view 3/4 perspective. A wide crescent slash wave of pure blue-cyan soul fire sweeps across the frame, thick dark-teal negative space inside the crescent, blazing white-cyan rim light, small ember sparks spraying outward. Pure solid chroma key green screen background (#00FF00), completely isolated magic VFX element, no characters, no human figures, no ground, no floor, crisp cel-shaded anime game particle effects, 4k asset
Negative Prompt / Bổ trợ loại trừ: character, human, person, swordsman, enemy, silhouette, body, face, guandao, floor, ground, stones, scenery, text, watermark, 3d model.
SFX tích hợp: (Hệ thống âm thanh đồng bộ: tiếng đại đao rạch qua không khí "HEAVY GUANDAO SWING WHOOSH", tiếng lửa xanh cháy rào rào "SOUL-FLAME IGNITION ROAR", kết thúc bằng tiếng chém trúng đích nặng "HEAVY CLEAVE IMPACT CRACK").
```

## 7. ULT — Trảm Quyết Hồn Dao (character only)

```
Isolated character animation pass. Full body 3/4 side view facing right. Blindfolded chibi swordsman with silver ponytail, layered dark blue and white robes, red waist tassel and green bead belt, guandao with blue flame blade. He plants the guandao into the ground, spreads a ring of glowing yellow paper talismans with black ink script around him like a rotating clock face, thrusts the blade forward and drags a massive blue soul-flame arc across the screen, the talisman ring spinning faster and dissolving into embers. Pure solid chroma key green screen background (#00FF00), strictly character model only, no floor, no ground, no floor shadow, no ghost VFX pass, clean cel-shaded anime ultimate action, 4k 60fps.
Negative Prompt / Bổ trợ loại trừ: background, scenery, ground, floor, extra characters, crowd, text, watermark, logo, 3d model render.
```

## 8. VFX + SFX ULT — trận pháp 12 lá bùa

```
Isolated fullscreen magical game VFX asset. Side-view 3/4 perspective. Twelve pale yellow paper talismans with black ink calligraphy arranged in a perfect rotating clock formation in the centre of frame, each slip pointing outward, spinning fast while glowing edges shed amber embers and violet soul wisps curl in from the edges of the screen. Solid chroma key green screen background (#00FF00), strictly VFX elements only, no characters, no swordsman, no enemies, no crowd, no human body, no floor, no environment, dynamic cel-shaded anime particle FX pass, high contrast, 4k.
Negative Prompt / Bổ trợ loại trừ: character, swordsman, human, person, enemies, crowd, human body, floor, ground, architecture, background environment, text, watermark.
SFX Tích hợp: Hệ thống âm thanh đồng bộ: tiếng phù chú xé gió lúc xoay trận "TALISMAN PAPER RUSTLING WHIRL", tiếng âm hồn gào thấp từ xa "DISTANT SOUL WAIL RISING", kết thúc bằng tiếng đao trọc trấn phạt "SIXTY CYCLE SOUL CLEAVE DETONATION".
```
