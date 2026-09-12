# Cách tạo gift code (mã đổi quà)

Cầm tay cho owner. Mỗi mã **một tài khoản một lần**. Người chơi: Thành Chính → bấm Ông Phở → **Mã đổi**.

File này nằm trên GitHub: [docs/GIFT-CODES.md](https://github.com/bktimmy247/luc-than/blob/main/docs/GIFT-CODES.md).

Danh sách thưởng **tự lớn** khi thêm tướng (`DATA.heroes`) hoặc vật phẩm (equipment / defs). Không cần sửa module mã.

Xem list id đang có:

`https://hon-viet-mong-gioi-v3-25-4-dinh-loi-gamma.vercel.app/api/gift`

JSON: `rewards.heroes` · `rewards.items` · `rewards.pets` · `rewards.currencies`.

---

## Cách 1 — Vercel (mã bí mật, nhanh)

1. Mở project **gamma** trên Vercel → **Settings** → **Environment Variables**.
2. Name: `GIFT_CODES`
3. Type: **Secret**
4. Environments: **Production** + **Preview**
5. Value = **một dòng JSON** (xem mẫu dưới).
6. Save → Deployments → bản Production **Ready** → **⋯** → **Redeploy**.

Đổi / xóa mã: sửa JSON → Redeploy lại.

Mã chỉ chữ/số. `ANH-20` khi nhập = `ANH20`.

Env Vercel **đè** file repo nếu trùng tên mã.

---

## Cách 2 — file trong repo

Sửa [`gift-codes.json`](https://github.com/bktimmy247/luc-than/blob/main/gift-codes.json) (cùng nội dung [`src/domain/profile/gift-catalog.json`](https://github.com/bktimmy247/luc-than/blob/main/src/domain/profile/gift-catalog.json)).

Commit lên `main` / bảo em push. Dùng khi mã công khai.

---

## Mẫu JSON

Chỉ vàng/ngọc:

```json
{"TET2026":{"label":"Tết Lục Thần","gold":8000,"gems":500,"stam":50}}
```

Mảnh tướng + đồ:

```json
{"ANH20":{"label":"Sự kiện Lục Ảnh","shards":{"luc_anh":20},"items":{"equipment.weapon.ssr":1},"pets":{"kim-quy":1},"gems":80,"tinh":30}}
```

Nhiều mã một lúc:

```json
{"ANH20":{"label":"Mảnh Lục Ảnh","shards":{"luc_anh":20},"gems":50},"PHO10":{"label":"Mảnh Ông Phở","shards":{"ong_hang_pho":10}},"YOUTUBE":{"label":"Quà kênh","gold":2000,"gems":100}}
```

Tướng mới (wave 72): ghi đúng `id` lúc mở, không sửa module này.

```json
{"WAVE72":{"label":"Quà tướng mới","shards":{"id_tuong_moi":15},"items":{"id_vat_pham_moi":1}}}
```

---

## Trường thưởng

| Field | Ý | Lấy id từ đâu |
|---|---|---|
| `label` | Tên hiện khi đổi | — |
| `gold` `gems` `stam` | Vàng, ngọc, thể lực | Cố định |
| `tinh` `hoat` `so` | Tinh, hoạt, sò | Cố định |
| `essence` | Tinh hoa mộng | Cố định |
| `shards` | Mảnh tướng `{ "id": số }` | `rewards.heroes` — 12 nay, 72 sau tự thêm |
| `items` | Vật phẩm `{ "id": số }` vào túi `P.bag` | `rewards.items` — equipment + defs mới |
| `pets` | Pet `{ "id": 1 }` | `rewards.pets` |

12 tướng live (tham khảo):  
`ong_hang_pho` `thay_mo` `lac_yen` `cung_thu_tre` `co_dao_ganh_hoi` `phong_tu` `thuy_nuong_roi_nuoc` `hong_lien_dao_nuong` `thach_quyen` `dinh_loi` `luc_anh` `to_diep`

Mã sẵn trong game: `MONGGIOI` `ONGHANGPHO` `XOMDEM` `CATRUCDEM` `LUCTHAN` `THANHCHINH`.
