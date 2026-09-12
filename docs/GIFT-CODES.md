# Thêm mã quà tặng người chơi

Hai cách. **Không cần sửa game.** Mỗi mã mỗi tài khoản một lần.

## Cách 1 — Vercel (mã bí mật, nhanh)

1. Mở [Vercel project gamma](https://vercel.com/thuhoavu134-5379s-projects/hon-viet-mong-gioi-v3-25-4-dinh-loi-spacing-root) → **Settings** → **Environment Variables**.
2. Key: `GIFT_CODES`
3. Type: **Secret**
4. Value (một dòng JSON):

```json
{"TET2026":{"label":"Tết Lục Thần","gold":8000,"gems":500,"stam":50},"YOUTUBE":{"label":"Quà kênh","gold":2000,"gems":100,"stam":20}}
```

5. Environments: **Production** + **Preview**
6. Save → Deployments → bản Production đang Ready → **⋯** → **Redeploy** (không cần git)

Mã chỉ chữ/số, viết hoa. `TET-2026` = `TET2026`.

Đổi / xóa mã: sửa JSON trên Vercel → Redeploy.

## Cách 2 — file trong repo

Sửa [`gift-codes.json`](../gift-codes.json) (cùng nội dung [`src/domain/profile/gift-catalog.json`](../src/domain/profile/gift-catalog.json)):

```json
{
  "LUCTHAN": { "label": "Lục Thần khai ấn", "gold": 5000, "gems": 300, "stam": 40 },
  "TET2026": { "label": "Tết Lục Thần", "gold": 8000, "gems": 500, "stam": 50 }
}
```

Commit / bảo em push. Env Vercel **đè** file nếu trùng tên.

## Người chơi

Hồ sơ (bấm Ông Phở) → **Mã đổi** → gõ mã → Xác định.

Mã cũ vẫn chạy: `MONGGIOI` `ONGHANGPHO` `XOMDEM` `CATRUCDEM` `LUCTHAN` `THANHCHINH`.
