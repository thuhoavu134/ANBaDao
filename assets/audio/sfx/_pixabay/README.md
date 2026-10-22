# Thư viện SFX Pixabay

`scripts/hero/sfx-source.mjs` tìm ở đây khi clip của owner không có tiếng và kho Kiếm Thế không có âm phù hợp.

Cách thêm một âm (pipeline không có trình duyệt, nên phần tải là việc của agent):

1. Mở pixabay.com bằng browser, tìm từ khóa, tải file .mp3/.wav (Pixabay đòi đăng nhập — owner đăng nhập một lần).
2. Bỏ file vào thư mục này.
3. Thêm một mục vào `index.json`:

```json
{ "file": "sword-slash-476148.mp3", "tags": ["sword", "slash", "impact", "hit"],
  "source": "https://pixabay.com/sound-effects/sword-slash-476148/",
  "license": "Pixabay Content License", "author": "<tên tác giả>" }
```

4. Chạy lại bước: `node scripts/hero/sfx-source.mjs --bundle <bundle.json> --slug <slug> --key <hero_key>`.

Resolver khớp `tags` với từ khóa của vai (tên chiêu trong brief + gợi ý vai), điểm cao nhất thắng, hòa thì theo tên file.
File được chuyển về mono 44.1 kHz s16 khi vào `assets/audio/sfx/<slug>/<vai>.wav`.
