# L12 — vào trận sau Bày trận

Màn xanh/tối sau Xuất chiến không phải chỗ xếp tướng. Đó là lớp che khi tải trận.

iPhone Grok preview: game nằm trong iframe, iframe trận lồng thêm bị trống. Xuất chiến lúc này mở `battle.html` thành trang đầy đủ trong preview.

- Copy: “Đang vào trận… / Đội hình vừa bày sẽ ra sân ngay.”
- Không tắt lớp che khi iframe `load`; chỉ tắt khi `battle-ready`.
- Preview lồng iframe → `location.assign(battle.html)`.
- Chrome top-level: overlay 6v4. Nested preview: canvas trận hiện.

Safari/device NOT_RUN.
