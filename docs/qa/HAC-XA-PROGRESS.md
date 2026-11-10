# Hắc Xà — tiến độ làm boss animation (09/11/2026)

Trạng thái: **dở, chờ clip từ Google Flow**. Bạch Hổ đã xong và đã merge (PR #426, main `5781a888`).

## Đã có

| Việc | Ở đâu |
|---|---|
| Ảnh concept Hắc Xà (gpt_image, nền xanh) | `assets/bosses/concept/hac-xa.png` |
| Ảnh tham chiếu 16:9 đã tách nền + chừa lề | `C:\tmp\openclaw\uploads\hac-xa-ref169.png` (đã upload lên Flow, tên trong Flow: `hac-xa-ref169.png`) |
| SFX đòn thường (1,6s) | `C:\lt\packs\hac-xa\sfx\atk.wav` |
| SFX tuyệt kỹ (2,8s) | `C:\lt\packs\hac-xa\sfx\ultimate.wav` |
| Hỗ trợ nhiều boss trong trận | `src/ui/hunt-battle-visual.js` (PR #427) |
| Script đóng gói atlas dùng chung | `scripts/hero/boss-atlas.py` (PR #427) |

## Đang chặn

Flow đã nhận câu lệnh tạo 5 clip (idle / hit / ngã / atk / ultimate) cho `hac-xa-ref169.png`,
chạy qua "Đang tư duy…" → "Defining Video Parameters" rồi tự kết thúc. **Chưa xác nhận được
là có 5 video**, vì agent không đọc được danh sách asset của Flow (grid rỗng sau khi render,
API nội bộ không lộ qua `/api/`).

Cần người **nhìn mắt** trên Flow, project `Tháng 11 09 - 18:30`:
- có 5 video rắn đen mới không?
- nền xanh có sạch, 4 mép có trống không?
- có báo lỗi / credit bị trừ không?

## Khi có clip — chạy đúng thứ tự này

```powershell
# 1. Tải 5 clip (đặt tên: idle.mp4, hit.mp4, fall-die.mp4, atk.mp4, ultimate.mp4)
#    vào C:\lt\packs\hac-xa\raw\  (bản gốc 720p nếu nút 1080p bị chặn)
# 2. Phóng lên 1920x1080 + kiểm 4 mép
& "C:\lt\.venvs\pack\Scripts\python.exe" C:\Users\Admin\aicoworker\openclaw\workspace-main\tmp\clip-check.py   # sửa RAW/TMP sang hac-xa
# 3. Đóng gói 6 state (packager chuẩn: Blender key nền + uniform framing)
$env:BLENDER_PATH="C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"
& "C:\lt\.venvs\pack\Scripts\python.exe" "C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py" `
  --manifest C:\lt\packs\hac-xa\manifest.json --framing uniform
# 4. Atlas cho game
& "C:\lt\.venvs\pack\Scripts\python.exe" scripts\hero\boss-atlas.py --slug hac-xa `
  --pack C:\lt\packs\hac-xa\pack-v1\<pack> --idle C:\lt\packs\hac-xa\idle-fixed\idle --out assets\hunt\hac-xa
# 5. Nối SFX: chép atk/ultimate vào assets/audio/sfx/hac-xa/, build, QA
```

## Luật đã chốt với owner (áp cho cả 3 boss)

- Nền xanh `#00FF00`, không gradient, không sàn, không VFX/tiếng trong clip nhân vật.
- **Không chạm 4 mép khung hình** — để tách nền không bị đường cắt thẳng.
- Idle **không trộn khung**: chỉ tìm cặp frame trùng nhau để loop (owner chốt 09/11).
- Boss **không cần clip chạy**; chỉ idle / hit / fall-die / atk / ultimate.
- Boss 4 chân ngã kiểu khuỵu chân rồi đổ nghiêng, **không ngã ngửa**.
- Atlas của boss đã vẽ quay mặt sang trái ⇒ **không lật** khi vẽ ở phe địch.
