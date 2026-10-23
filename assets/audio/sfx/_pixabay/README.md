# Thư viện SFX Pixabay

`scripts/hero/sfx-source.mjs` tìm ở đây khi clip của owner không có tiếng và kho Kiếm Thế không có âm phù hợp.

## Tải một âm (tự động, KHÔNG cần đăng nhập)

Trang web chặn HTTP thường và nút Download của nó đòi đăng nhập, **nhưng file trên CDN thì tải trực tiếp được**.
Trình duyệt chỉ dùng để **tìm**, file lấy thẳng từ `cdn.pixabay.com`:

1. Mở trang tìm kiếm bằng browser, bấm **Play** ở kết quả muốn lấy. Trang sẽ gọi
   `https://cdn.pixabay.com/audio/<YYYY>/<MM>/<DD>/audio_<hash>.mp3` — đọc `document.querySelector('audio').src`.
2. Chạy:

```bash
node scripts/hero/pixabay-get.mjs --preview "https://cdn.pixabay.com/audio/2026/01/29/audio_573798665f.mp3" \
     --name sword-slash-476148.mp3 --tags "dao,kiem,sword,slash" \
     --source "https://pixabay.com/sound-effects/sword-slash-476148/" --author "<tác giả>"
```

Script tự đổi URL sang `.../download/audio/...`, tải file vào thư mục này và ghi mục vào `index.json`
(kèm sha256 + nguồn + giấy phép). Cách này đã dùng thật từ 20/10 (`C:\lt\hero7\sword_sfx.py`).

3. Chạy lại bước SFX: `node scripts/hero/sfx-source.mjs --bundle <bundle.json> --slug <slug> --key <hero_key>`

Resolver khớp `tags` với từ khóa của vai (tên chiêu trong brief + gợi ý vai), điểm cao nhất thắng, hòa thì theo tên file.
File được chuyển về mono 44.1 kHz s16 khi vào `assets/audio/sfx/<slug>/<vai>.wav`.

Giấy phép: Pixabay Content License — dùng miễn phí, không bắt buộc ghi công (đã kiểm 20/10).
