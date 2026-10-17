# Quy chuẩn kích thước tướng trong trận

Trạng thái **DRAFT / REVIEW**, ngày 2026-10-17. Baseline là main `de5d425e11719cd275112953d539339e2eb4b77a`, sau khi PR #310 đã merge. Thay đổi quy chuẩn kích thước này đang ở nhánh `fix/shared-hero-scale-contract-20261017`; chưa có tuyên bố merge hoặc phát hành production cho thay đổi mới.

## Mục tiêu và đơn vị đo

Mọi tướng trong trận dùng một chiều cao thân chuẩn **310 world units**, lấy vóc dáng Bạch Diện đã được duyệt làm tham chiếu. Đây là chiều cao thân quy đổi ở tư thế đứng, trước hệ số viewport và độ sâu của ô đội hình gốc. Kích thước màn hình thực tế vẫn phụ thuộc hai hệ số chung đó.

Idle, ATK và Ultimate giữ cùng tỷ lệ cơ thể. Cúi người, nhảy, xoay, ngã và các pha biến mất vẫn giữ hình dáng/chuyển động authored; chiều cao vùng ảnh nhìn thấy không cần bằng nhau ở mọi frame. Vũ khí, cánh tay vươn ra, khoảng trong suốt và VFX không được dùng thay cho chiều cao thân.

```text
heroScale = 310 / referenceBodyHeight
bodyHeightInWorld = referenceBodyHeight × heroScale × viewportScale × homeSlotDepth
                  = 310 × viewportScale × homeSlotDepth
```

`homeSlotDepth` lấy từ vị trí đội hình gốc, không đổi theo y của tướng khi lao lên hoặc bay. Hai phe dùng cùng phép tính; chiều hướng là phép mirror riêng. HUD và điểm giữa thân cho impact dùng chung phép chiếu thân, gồm cả compact offset đã có.

## Hợp đồng asset

Mỗi family authored khai báo `assets/characters/<family>/presentation.json`, schema `battle-hero-presentation/v1`. Loader tự tìm các file này; thêm tướng không cần thêm nhánh ID hoặc hệ số kích thước viết tay trong renderer.

| Trường | Ý nghĩa |
| --- | --- |
| `heroId`, `aliases` | ID canonical và các tên mà runtime đang dùng. |
| `referenceBodyHeight` | Chiều cao thân trong hệ tọa độ local đã đăng ký, trước correction về 310. Phải dương và hữu hạn. |
| `footOffsetY` | Vị trí chân/điểm neo baseline trong cùng hệ local so với anchor của unit. Đây không phải một hệ số phóng đại. |
| `registration` | `source-body` cho shared painter; `pre-registered` cho painter legacy đã đăng ký clip. |
| `clips` | Mọi clip nhân vật, kể cả standing, run, hit/hurt, fall/defeated và các trang idle. Dùng đúng source key. |
| `vfxClips` | Danh sách source key của hiệu ứng, tách khỏi clip nhân vật. |
| `states` | Các clip thuộc `idle`, `attack`, `ultimate`; mọi key phải có trong `clips`. |
| `evidence` | Nguồn đo, camera/registration được giữ lại và giới hạn của phép đo. |
| `compact` | Metadata giữ calibration ngang cũ nếu đã có; hiện Linh Đồng giữ `scaleX` và `offsetX`. |

### `source-body`: cố định theo camera xuất ảnh

Mỗi clip khai báo `bodyHeight`, `footX`, `footY` trong **source cell đầy đủ của asset**, không phải kích thước atlas sau khi decode/downsample. `bodyHeight` mô tả tỷ lệ cơ thể tương đương tư thế đứng của camera/export đó. Chân và tỷ lệ được cố định cho cả clip; các trang của cùng một loop dùng cùng registration.

```text
clipScale = referenceBodyHeight / clips[key].bodyHeight
destinationX = -clips[key].footX × clipScale
destinationY = footOffsetY - clips[key].footY × clipScale
destinationSize = sourceCellSize × clipScale
```

Shared painter tính registration này trước outer `heroScale × viewportScale × homeSlotDepth`. Đổi camera hoặc tỷ lệ xuất của một clip cần calibration đúng cho clip đó trong manifest. Không đo lại alpha bounds từng frame để ép mọi pose cao 310: cách đó làm nhân vật phồng/xẹp trong action. Chuyển động bên trong clip không được bù bằng scale động.

Decoded atlas có thể nhỏ hơn source. `__hvAtlasScale` chỉ đổi tọa độ/vùng lấy ảnh; destination và body registration giữ nguyên. VFX dùng rectangle/painter riêng; kích thước vũ khí và hiệu ứng không tác động correction của thân.

### `pre-registered`: giữ một chủ sở hữu registration

Các painter legacy đã có crop, packing, baseline hoặc clip transform riêng. Manifest vẫn liệt kê mọi character key dưới `clips` với giá trị `{}`, nhưng shared painter không đăng ký chúng lần nữa. Registry chỉ cung cấp correction chung và phép chiếu thân cho HUD/impact; clip transform cũ tiếp tục do painter hiện có sở hữu.

Một số legacy chỉ có điểm neo đáy cell/packing, chưa có landmark bàn chân giải phẫu. `footOffsetY` của các trường hợp đó giữ điểm neo đã có và phải ghi rõ là proxy. Không được gọi các giá trị này là kết quả đo chân mới.

## Mười profile hiện tại

Các số dưới đây là local units **trước** correction chung về 310; chi tiết source keys và chứng cứ nằm trong từng manifest.

| Family | Registration | Reference body | Foot offset Y | Cơ sở |
| --- | --- | ---: | ---: | --- |
| Bạch Diện | pre-registered | 395 | 39 | Reference pose top 20, bottom 415; baseline 64 trong cell 440. |
| Kỷ Vân | source-body | 413 | -12 | Action body 413, chân `(240, 428)`; authored idle body 645, chân `(216, 657)`. |
| Tiêu Phong | source-body | 413 | -12 | Action body 413, chân `(240, 428)`; authored idle body 648.5, chân `(216, 658)`. |
| Tịch Dao | source-body | 423 | 0 | `content.frameHeightPx` theo clip; giữ anchor `(240, 440)` và các pha ẩn thân. |
| Hồng Thương | source-body | 423 | 0 | `bodyHeightPx`, `bodyCx`, `footCellY` của owner pack; ngọn thương không quyết định scale. |
| Linh Đồng | pre-registered | 335 | 48 | Giữ calibration cũ; chân là packing anchor `440 - 16`, không phải phép đo giải phẫu mới. |
| Lục Ảnh | pre-registered | 273.625 | 48 | Giữ `330 × 199 / 240`; foot là proxy đáy cell/baseline có sẵn. |
| Ông Phở | pre-registered | 266.083333… | 18.75 | Thân 103 px, y 23…125, loại gậy/muôi; quy đổi bằng `348.75 / 135`. |
| Đình Lôi | pre-registered | 301.6 | 26.533333… | Thân 117 px, y 12…128 trên bản 240×135; source production đúng 2×, native draw height 348. |
| Thầy Mo | pre-registered | 329.545454… | 28 | Giữ calibration `348 × 250 / 264`; foot là proxy đáy cell, chưa có landmark chân riêng. |

Linh Đồng tiếp tục giữ compact `scaleX = 0.9210526316`, `offsetX = 4.25` trong metadata. Đây là calibration ngang đã tồn tại; chiều cao vẫn đi qua cùng chuẩn 310.

Ông Phở, Đình Lôi và Thầy Mo hiện là manifest standalone, **chưa có `runtime-meta.json` để đối chiếu tự động toàn bộ clip inventory**. Ba profile vẫn qua schema/measurement validation. Danh sách clip của chúng cần được kiểm cùng painter legacy khi thay asset; không được quảng bá loader hiện tại là đã chặn mọi clip legacy mới bị bỏ sót.

## Loader, runtime và nhánh dự phòng

| Owner | Trách nhiệm |
| --- | --- |
| `src/render/hero-presentation.mjs` | Chuẩn 310, registry, shared body painter và phép chiếu thân. |
| `scripts/hero-presentation-registry.mjs` | Tự tìm manifest, kiểm schema/alias/measurement và đối chiếu runtime metadata. |
| `scripts/battle-formation-scale-v1.mjs` | Đưa shared owner vào battle; viewport, home-depth, compact calibration và HUD. |
| `src/runtime/ky-van.js`, `tieu-phong.js`, `tich-dao.js`, `hong-thuong.js` | Gọi shared body painter; action/VFX vẫn do runtime tương ứng điều phối. |
| `scripts/roster-enemies-size-v1.mjs` | Đưa generic và procedural fallback về cùng chuẩn thân. |

`scripts/build-static.mjs` kiểm manifest trước khi tạo battle output. Nếu family có `runtime-meta.json`, build dừng khi thiếu manifest, clip chưa được phân loại, manifest trỏ tới clip không tồn tại, hoặc một source key bị dùng đồng thời cho character và VFX. Các trang `idle-authored-N` được đưa vào inventory. Geometry `cellW`, `cellH`, `cols`, `frames` của clip `source-body` phải là số nguyên dương; body/foot calibration phải hữu hạn và body phải dương. Chưa có gate so sánh landmark khai báo với ảnh pixel thực tế.

Generic roster dùng density của pose idle làm tham chiếu cố định cho run/attack/release, không fit lại chiều cao mỗi pose. Registration generic được build từ silhouette liên thông lớn nhất của bộ sheet hiện có; đây là fallback đã kiểm trên bộ đó, không phải thuật toán phân biệt cơ thể với vũ khí cho asset mới.

Procedural fallback dùng skeleton chung từ đỉnh sọ `-122` tới đế giày `+0.5`, cao `122.5`, rồi đưa đế về anchor. Cả hai fallback bỏ correction authored đã có ở outer transform đúng một lần, giữ viewport/depth. Vì vậy ảnh authored chưa sẵn sàng không làm nhân vật đổi sang vóc dáng nhỏ hoặc bị scale hai lần.

Thẻ S+ `splus-pending-art` là placeholder UI chưa có sprite authored. Khi chưa có profile, `projectBattleHeroBody` dùng đúng rectangle thẻ đang vẽ: cao 126, đáy ở local y `-4`, scale 1, để HUD bám thẻ. Nếu đã có profile, profile luôn được ưu tiên kể cả khi cờ pending-art cũ còn sót. Ngoại lệ này không thay chuẩn 310 của thân tướng hoặc thêm correction theo hero ID.

Build chèn shared scale/runtime trước fallback và bốn direct runtime. Patch procedural giới hạn trong `drawUnit`, sau các nhánh sprite thành công đã return; marker thiếu hoặc trùng làm build dừng.

## Khi tích hợp tướng hoặc thay bộ ảnh

1. Xác định body height tương đương tư thế đứng và landmark chân trong camera/source cell thực. Dùng source metadata hoặc đo thân có chủ đích, loại vũ khí/VFX; ghi chứng cứ. Nếu camera thay đổi giữa các clip, khai báo calibration cố định tương ứng.
2. Thêm/cập nhật `presentation.json`, aliases, mọi character clip và VFX; khai báo đủ các state. Với runtime metadata có idle phân trang, liệt kê đủ các `idle-authored-N` mà loader tổng hợp.
3. Dùng shared body painter cho `source-body`, hoặc giữ registration owner hiện có cho legacy `pre-registered`. Không thêm hệ số theo hero ID, phép sửa scale riêng từng action, hoặc phép vá chiều cao HUD riêng trong runtime/installer.
4. Chạy `node scripts/hero-presentation-registry.mjs`, các regression liên quan và xem ảnh thực ở idle/ATK/Ultimate cho hai phe. Kiểm density/feet qua chuyển state, atlas decode scale, viewport và home-depth; sau đó chạy build/browser/device phù hợp với môi trường phát hành.

Manifest vẫn cần calibration thật khi nhập asset. Chuẩn chung loại bỏ việc sửa công thức renderer cho mỗi tướng; nó không thể suy ra giải phẫu chính xác chỉ từ alpha của ảnh chứa tóc, vũ khí và hiệu ứng.

## Bằng chứng và trạng thái bàn giao

Kết quả cuối: **67 test đạt, 0 lỗi** — 50 test tập trung trong 8 file (gồm actual runtime stature) và 17 test runtime hiện có được chọn theo phần thay đổi; registry xác nhận 10 family. Các regression kiểm contract/inventory, nguồn scale chung, registration qua state, body/HUD, atlas scale, fallback và rectangle thật của thẻ pending-art trong cả ESM lẫn runtime được chèn.

Phạm vi và giới hạn chi tiết nằm trong [QA note](qa/shared-hero-scale-20261017.md); [ảnh Canvas từ sprite thật](qa/shared-hero-scale-20261017.png) là bằng chứng offline đã xem lại. Không dùng ảnh offline hoặc focused tests để khẳng định full build, browser gameplay, physical iPhone/iPad/Safari hoặc production đã được chứng minh. Full build của checkout thưa còn thiếu assets. Waiver Ticket Board/workflow đã được ghi nhận vẫn áp dụng; không tạo trạng thái claim/DONE/merge thay cho chứng cứ.
