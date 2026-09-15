# L150 trận hiện VFX và SFX

Owner 15/09 · vào trận không thấy VFX, không nghe SFX.

- Trước: iOS giảm chuyển động nén hết 80ms; atlas VFX load muộn; SFX lần đầu bị cắt nếu decode > 1.2s
- Sau: giữ duration chiêu; load atlas sẵn; SFX vẫn phát nếu trận còn chạy
- Camera vẫn không giật khi máy bật giảm chuyển động

Safari/iPhone NOT_RUN. Chưa deploy.
