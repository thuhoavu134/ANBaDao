# Chuẩn trình diễn chiến đấu v3.24.8

Nguồn tham chiếu: các video combat game mẫu do anh cung cấp ngày 30/08/2026. Chuẩn này chỉ điều khiển trình diễn; công thức sát thương và luật 6v6/15 hiệp không đổi.

## Nguyên tắc bắt buộc

- Mỗi tướng có `homeAnchorId = <team>:slot-<0..5>` và tọa độ `homeAnchor`. Mọi hành động kết thúc tại đúng điểm này.
- Tính toán và trình diễn tách riêng. Damage, hồi máu, buff/debuff và thanh HP chỉ bắt đầu hiển thị tại impact frame.
- Đánh nhiều hit tạo một floater và một lần chuyển HP cho từng hit. Các floater cùng mục tiêu xếp tối đa ba làn để không đè nhau.
- Damage thường: số trắng ngà, viền tối. Bạo kích: `BẠO KÍCH −N`, vàng cam, cỡ lớn. Hồi máu: `+N`, xanh lá.
- Trạng thái quan trọng hiện chữ ngắn khi được áp dụng; trạng thái còn hiệu lực được giữ bằng icon trên một hàng. Khống chế ưu tiên trước, sau đó buff, rồi debuff/DOT.
- Kết quả trận chỉ mở sau khi hit cuối, HP cuối và animation gục đã resolve.

## Profile chuyển động

| Profile | Di chuyển | Dùng cho |
|---|---:|---|
| `contact` | Áp sát mục tiêu, rồi về home | Basic/skill cận chiến một nhịp |
| `contactCombo` | Áp sát gần hơn, nhiều impact | Combo, multi-hit, execute cận chiến |
| `stationaryProjectile` | Đứng nguyên home | Basic cung, trượng, quạt; projectile bay tới mục tiêu |
| `stationaryCast` | Đứng nguyên home | Skill tầm xa, hồi máu, buff đơn |
| `battlefieldCinematic` | Đứng nguyên home | AOE, buff/heal toàn đội, Ultimate phủ chiến trường |

## Khai báo tướng mới

Không viết tọa độ riêng trong skill. Thêm dữ liệu tướng như cũ và chỉ override khi ngoại lệ:

```js
presentationProfile: {
  basic: "contact",
  skill: "stationaryCast",
  ultimate: "battlefieldCinematic"
}
```

Nếu không khai báo, runtime tự suy luận từ `weapon` và `skillKind`/`ultimateKind`. Tọa độ luôn lấy từ đội và slot; đổi đội hình không cần sửa animation code.

## Quy tắc nhận diện tự động

- `bow`, `staff`, `fan`: Basic là `stationaryProjectile`; skill/ultimate là `stationaryCast`, trừ AOE/toàn đội.
- `healAll`, `guardAll`, `cleanseGuard`, `buffAll`, `hasteAll`, `aoe`, `aoeBurn`, `aoeDebuff`: `battlefieldCinematic`.
- `heal`, `guard`, `buff`, `regen`: `stationaryCast`.
- `double`, `multi`, `execute`: `contactCombo`.
- Còn lại: `contact`.

## Checklist animation/VFX/SFX

1. Windup không làm mất HP.
2. Projectile chạm hoặc vũ khí tiếp xúc mới resolve hit.
3. Mỗi hit: floater → HP tween 220 ms → hurt/VFX/SFX đồng nhịp.
4. Critical tăng cường chữ, flash, shake và âm impact nhưng không đổi công thức/timing kỹ năng.
5. Tướng đánh xa không bước ảo khỏi slot; tướng cận chiến không đánh từ home khi động tác yêu cầu tiếp xúc.
6. Sau recovery, `x/y` phải khớp `homeAnchor` trước khi chuyển lượt.
