# Bài học: tích hợp SFX cho tướng (2026-10-26)

Ghi lại đúng chuỗi sai sót khi thay tiếng đòn đánh cho Lăng Vân, để lần sau không lặp lại. Mỗi mục đều có bằng chứng đo được, không phải cảm nhận.

## 1. "Có phát" không bằng "nghe được"

Lần đầu, engine **gọi đúng** 3 cue mới (`lang-van-basic-1/2/3`) nhưng tai owner vẫn chỉ nghe ra tiếng cũ. Nguyên nhân: mỗi nhịp còn phát kèm `lang-van-basic-hit` (`basic-hit.wav` của bộ cũ) **cùng thời điểm**:

| File | RMS | Đỉnh |
|---|---|---|
| `basic-hit.wav` (cũ) | **−8,4 dB** | 0 dB |
| tiếng mới nhịp 1–2 | −15,9 dB | −1,5 dB |
| tiếng mới nhịp 3 | **−21,6 dB** | −3,3 dB |

Tiếng cũ to hơn 7–13 dB nên đè chết tiếng mới.

**Quy tắc:** khi thay tiếng cho một action, phải liệt kê **mọi** cue phát trong action đó — kể cả cue không ghim nhịp (`hit` không có index) và cue va chạm — rồi **đo RMS/đỉnh của từng cái**. Chênh quá ~6 dB là cái to sẽ giết cái nhỏ.

## 2. Trận nhúng chạy x3, và SFX từng bị tua theo tốc độ trận

`battle.html` (~dòng 7028):

```js
if (!EMBEDDED) return;
state.speed = 3;
```

Trong khi `src/ui/audio-sfx-runtime.js` gán `source.playbackRate = clamp(speed, 1..3)`. `AudioBufferSourceNode.playbackRate` đổi **cả tốc độ lẫn cao độ** → tiếng nhanh gấp 3, cao hơn ~19 nửa cung (>1,5 quãng tám). Đây chính là "không đúng âm thanh gốc".

**Đã chốt (owner duyệt):** mọi tiếng phát `playbackRate = 1`. Nhịp phát vẫn theo tốc độ trận vì các runtime (`authored-hero.js`) tự canh giờ gọi `play()`. Không bao giờ tua tiếng để "khớp animation nhanh" — cao độ sai là owner nghe ra ngay.

## 3. Không tự ý xử lý âm thanh owner đã chọn

Đã từng nâng +6 dB và nén đỉnh (`alimiter`) cho tiếng số 23 để "cân bằng". Owner nghe ra ngay là **không còn là tiếng gốc**.

**Quy tắc:** tiếng owner chọn thì dùng **nguyên byte** (`md5` đối chiếu với file trong kho). Cân bằng âm lượng chỉ được làm bằng cách **hạ** tiếng khác xuống hoặc bỏ tiếng gây nhiễu, không được sửa tiếng owner đã duyệt. Nếu buộc phải sửa, phải nói rõ và xin duyệt lại.

## 4. Đổi nội dung file âm thanh thì phải đổi TÊN file

`vercel.json` đang đặt `Cache-Control: public, max-age=31536000, immutable` cho `/assets/(.*)`. Ghi đè cùng tên → thiết bị đã tải trước đó **không bao giờ** lấy bản mới.

**Quy tắc:** tên file mang mã nội dung, ví dụ `atk-gai-90bd2748.wav` (8 ký tự md5). Đổi tiếng = đổi URL.

## 5. Kiểm chứng trong trận thật, đừng chỉ đọc code

Cách kiểm đúng (đã dùng được):

1. Mở `battle.html` bằng Playwright, truyền đội hình qua `window.name = 'hvBattleConfig:' + encodeURIComponent(cfg)` đặt trong `addInitScript`.
2. Bẫy tiếng: `Object.defineProperty(window,'HonVietSfx',{set(v){…gắn wrap play()…}})`. Phải bẫy trong `addInitScript` vì module gán `HonVietSfx` rất sớm.
3. Ép đúng đòn cần kiểm: `window.__HON_VIET__.qaForceAuthoredAction(unitId,'basic')`.
4. Đọc `window.__cues` để biết **cue nào** phát; đọc `HonVietSfx.timingEvents()` để biết **playbackRate** thật.

Lưu ý: headless **không chạy AudioContext** nên `timingEvents()` thường rỗng — muốn khoá `playbackRate` thì viết test `node:test` nạp `audio-sfx-runtime.js` vào `vm` với AudioContext giả (mẫu: `tests/co-nuong-audio.test.mjs`, `tests/authored-sfx-pitch.test.mjs`).

## 6. So sánh tiếng bằng số, không bằng mô tả

Để biết clip owner gửi là tiếng cũ hay mới: tách audio, tính **phổ dải băng** (log 24 dải, 80 Hz–8 kHz), chuẩn hoá rồi tính cosine. Bản cũ vs bản mới lệch rõ (≈ −0,20); cùng một tiếng thì ≈ 0,93. Tương quan dạng sóng trực tiếp **không dùng được** với bản ghi qua điện thoại.

## 7. Khi owner báo lỗi: kiểm code trước, đừng đổ cho deploy/cache

Đã mất mấy vòng vì kết luận "máy anh đang chạy bản cũ / Vercel chưa deploy" trong khi nguyên nhân nằm trong code (mục 1 và 2). Owner đã nói rõ: **Vercel không liên quan**.

**Quy tắc:** trước khi nói "do deploy/cache", phải chỉ ra được **bằng chứng trong code** hoặc **số đo trong clip** chứng minh điều đó. Không có bằng chứng thì im và đọc code tiếp.

## 8. Gửi file nghe thử cho owner

- Không dùng `loudnorm` cho tiếng ngắn (<1 s): nó ăn gần hết âm lượng, owner chỉ nghe thấy giọng đếm. Dùng `volume = 0.92/peak` rồi **đo lại RMS**.
- Mã bíp (trầm = chục, cao = đơn vị) là ý tồi: owner không dò được. Dùng TTS đọc số trước mỗi tiếng (máy này không có speech model; SAPI chỉ có giọng Anh → sinh số bằng `System.Speech`).
- Mỗi file **10 tiếng**, kèm danh sách tên. Không gửi 181 file rời, không nhồi 46 tiếng/file.

## Checklist trước khi báo "xong" một thay đổi SFX

- [ ] Đã liệt kê mọi cue trong action (kể cả cue không ghim nhịp) và đo RMS/đỉnh từng cái
- [ ] Tiếng owner chọn là **file gốc**, `md5` khớp kho
- [ ] Tên file mang mã nội dung (không ghi đè tên cũ)
- [ ] `playbackRate = 1`, không tua theo tốc độ trận
- [ ] Kiểm trong `battle.html` thật bằng `qaForceAuthoredAction` + bẫy `HonVietSfx`
- [ ] Test `node:test` khoá cả `playbackRate` lẫn đường dẫn file
- [ ] Build PASS + `npm test` 0 lỗi mới so baseline
- [ ] Gửi owner nghe thử đúng file engine sẽ phát (dựng từ `dist`, không dựng từ file nguồn)
