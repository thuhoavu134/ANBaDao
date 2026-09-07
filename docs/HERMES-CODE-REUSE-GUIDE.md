# Tái sử dụng code mẫu Hermes cho Lục Thần — hướng dẫn Luna

Cập nhật **07/09/2026** theo yêu cầu của anh: **cho Luna dùng lại code phù hợp của game mẫu để phát triển Lục Thần**. Quy tắc này thay các câu cũ giới hạn “chỉ học kiến trúc” hoặc cấm toàn bộ source mẫu. Đây là hướng dẫn thực hiện các ticket L01–L20 hiện có, không mở một roadmap khác.

## 1. Quyền sử dụng và kết quả bàn giao

Luna được chọn, trích, đổi tên và chuyển đổi từng hàm/module phù hợp vào code Lục Thần trong phạm vi ticket đang làm. Không cần hỏi lại anh việc tái sử dụng code đã được yêu cầu. Đọc owner hiện tại trước: phần nào Lục Thần đã có và đáp ứng yêu cầu thì mở rộng phần đó; việc lấy code mẫu phải giải quyết một khoảng thiếu cụ thể.

Đã xác định **27 phương thức từ 10 file** và ghi đường dẫn, dependency, nơi nhận code, lỗi cần sửa và ticket liên quan ở mục 3–4. Mã gốc nằm trong bộ `fable5-tam-quoc-source.zip.001`…`.007` anh đã gửi; [manifest audit](reference/hermes-source-manifest-2026-09-07.json) ghi hash và cấu trúc archive. Repo chứa phần phân tích/hướng dẫn do agent viết, không chứa thân code mẫu.

**Trạng thái hiện tại:** đã sửa policy/plan và lập bản đồ source; các phương thức đang `NOT_PORTED`. Test 171/171 là baseline game trước đó, không chứng minh code mẫu đã được tích hợp. Việc upload nguyên thân mã gốc lên GitHub đã bị xét duyệt tự động chặn vì quyền phân phối lại chưa rõ; bản cập nhật cuối cùng chỉ đưa tài liệu do agent viết lên repo.

Giữ các quyết định sản phẩm hiện hành: 12 ID và đầu tư save cũ; sáu slot, ba trước/ba sau, 15 hiệp, không multi-wave; kit Basic + Ultimate + passive; HTML/Canvas và build hiện có. Chính sách seed/banner chưa chốt vẫn nằm ở D01/D02. Tái sử dụng thuật toán không tự đổi chỉ số, vật phẩm, tỷ lệ chiêu mộ hoặc luật chiến đấu theo mẫu.

## 2. Chọn cách dùng cho từng phần

| Loại code | Cách làm của Luna | Điều kiện đưa vào sản phẩm |
|---|---|---|
| Thuật toán dùng dữ liệu đầu vào, ít dependency | Trích/port sang hàm thuần, đặt tên dễ hiểu; ví dụ lọc tướng `heromdl.sortByClk` | Input/output rõ, giữ dữ liệu đầu vào, test hành vi và các khác biệt có chủ đích |
| Hàm đọc config hoặc số lượng vật phẩm qua global/model | Giữ phần tính/toán tra cứu; truyền catalog, inventory và policy của Lục Thần qua tham số/adapter | Không tạo catalog/save thứ hai; ID, đơn vị thời gian và tiền tệ có mapping |
| Controller/model quản lý tiến độ và request/response | Tận dụng phần dựng dữ liệu và nhánh xử lý; thay network/callback bằng command, receipt và event owner hiện có | Chi phí, thưởng, progress cùng transaction; retry/reload không nhận hai lần |
| View, prefab, cache, timer hoặc audio gắn Cocos | Port từng hành vi sang DOM/Canvas và vòng đời màn hiện có | Hủy callback cũ, dispose idempotent, chỉ một owner route/scheduler/audio |
| Trình diễn trận `bcwar` | Tận dụng cách tổ chức round/action/suborder, queue và cleanup khi làm L05 | Luật, event, RNG và settlement do Lục Thần sở hữu; replay không sinh thưởng |
| Backend, SDK nền tảng, native loader, payment/ads | Chỉ dùng phần schema cần cho ticket đã có phạm vi; backend còn phải thiết kế/viết | Archive không cung cấp backend đầy đủ; không coi protocol là service có thể deploy |

Lấy từng phần vào source đích có adapter và test. Không nạp nguyên `System.register`/Cocos bundle hoặc chép ZIP đè repo. Nếu code mẫu cần một framework mới chỉ để dùng một hàm nhỏ, tách thuật toán khỏi framework. Nếu vẫn đắt hơn mở rộng owner hiện có, ghi lý do chọn cách hiện có; không buộc copy để đạt số lượng.

Code và mỹ thuật là hai lựa chọn riêng. Giữ hình tướng/animation đã duyệt. Khi màn thiếu background, icon, map hoặc khung UI, Luna chủ động imagegen, QC và tích hợp trong ticket đó; CSS làm bố trí/tương tác, chữ và số vẫn là dữ liệu sống. Tái sử dụng code không tự nhập art, balance table hoặc branding Tam Quốc vào game.

## 3. Bản đồ source → ticket → nơi nhận code

Đây là nhóm hướng dẫn tái sử dụng, không phải ticket mới. Tên trước dấu chấm trong cột nguồn là file trong `modules/`, riêng `bcwar` ở `decrypted-js/assets/src/assets/war/bcwar.js`. Dùng tên file và phương thức để đọc đúng đoạn trong archive; tên dạng `heromdl.sortByClk` chỉ định vị hàm, không phải API đã tồn tại trong Lục Thần.

| Nhóm / ticket | Phương thức trong archive mẫu | Nơi nhận ở Lục Thần | Việc chuyển đổi và bằng chứng cần có |
|---|---|---|---|
| Catalog / **L02a** | `basemdl.getConfig`, `getCompCfg`; `mainlinemdl.getNextGuardInfo`, `getCurCityCfg` | Adapter DATA hiện hành; `src/domain/catalog/validate-catalog.mjs` **mới đề xuất** | Thay số section/ID mặc định bằng catalog Lục Thần; kiểm missing/duplicate/cycle/legacy. Validator graph cần viết thêm, mẫu không cung cấp sẵn |
| Roster / L06 | `heromdl.sortByClk`; `herobagv.refSortList` | `src/domain/hero/roster-view.mjs`, `src/ui/hero-roster-runtime.js` | Map trường hệ/nghề/sao vào read model đang có; giữ selected hero theo ID, filter/scroll/back; không thay danh sách 12 ID bằng danh sách mẫu |
| Điều kiện mở / L04, L09, L12 | `jumpmgr.checkCond` | Guard/router trong `index.html`, opening quest owner; helper thuần nếu cần | Tách `isShow` và `isUnlock`; inject predicate đọc snapshot đã commit; CTA giải thích điều kiện. Check lại khi command chạy |
| Chi phí / L03, L11 | `heromdl.jsfChkCost` | Transaction owner; `src/domain/equipment/forge-commands.mjs`, loadout/upgrade command hiện có | Thay `getItemCount` bằng inventory snapshot; gộp dòng vật liệu trùng, validate số, kiểm và debit cùng transaction |
| AFK / L13 | `mainlinemdl.getFixedHangIncome`, `receHangUpData`; `mainlinectrl.n16401` | `src/domain/afk/afk-chest.mjs`, `scripts/afk-chest-runtime-v1.mjs`, campaign scene | Chuyển rate/reward DTO, giữ cap 15 giờ và chính sách rate hiện hành. Claim qua receipt Lục Thần; không lấy `sum_goods` từ client làm authority online |
| Scene/tab / L04 | `baseview.release`, `delMes`; `basemdl.regMes`, `delMes`; `herodownv.loadTabPf`, `loadPfBk`, `release` | Route/scene owner, `src/ui/hero-detail-tabs.js`; `src/ui/scene-lifetime.js` **mới đề xuất** nếu cần | Thay prefab/refcount bằng tài nguyên DOM/Canvas; guard callback bằng scene/session; đổi tab không khởi động lại Idle; lần dispose thứ hai an toàn |
| Audio / L01, L16 | `herodownv.playTalk`, `stopTalk`, `release`; `bcwar.cleanRound`, `clearUp` | Bus `src/ui/audio-sfx-runtime.js` và các patch voice/result/lifecycle hiện có | Học quyền sở hữu handle/cancel nhưng giữ hotfix đã deploy. Thoát khi đang decode/thoại phải dừng; iframe cũ không mute trận mới. L01 chủ yếu VERIFY |
| Badge / L12 | `redpointmgr.setRedPointFlagByName`, `removeRedPoint` | Badge consumer của daily/weekly/mail/feature state; module thuần chỉ tạo khi đã tìm owner | Aggregate từ child có hành động thật; dedupe subscription, tháo listener và công việc trì hoãn khi leave; claim commit xong mới đổi badge |
| Receipt/reveal / L03, L08, L12, L13 | `mainlinectrl.n16401` | Transaction/save và UI nhận thưởng đang có | Dùng cách nhận kết quả rồi cập nhật UI; dùng receipt Lục Thần thay response code mẫu. Reveal/skip/retry không tự roll hoặc cộng thưởng |
| Combat presentation / L05 | `bcwar.exeRound`, `exeAction`, `checkActQueue`, `cleanRound`, `clearUp` | `battle.html`, `src/domain/combat/*`, combat adapter, settlement owner | Map suborder → event/subActionIndex, theo scheduler hiện tại; đủ multi-hit/DoT/death/counter; cùng seed ở ×1/×2/×3 cho cùng outcome |

Các nhóm giao diện chiêu mộ/shop, nhiệm vụ, tháp/boss/viễn chinh và online vẫn dùng phạm vi trong audit và L08/L12/L14–L20. Bản đồ 27 phương thức này không bao phủ toàn bộ code của các hệ đó; không đánh dấu chúng đã port chỉ vì có module trong archive. Đọc thêm function/dependency tương ứng khi mở ticket, bổ sung provenance như quy trình dưới đây.

## 4. Những khác biệt và lỗi phải xử lý khi port

1. **`heromdl.sortByClk` chỉ lọc**, không sắp xếp thứ tự. Trường hợp không filter còn trả cùng mảng đầu vào. Port có thể trả bản sao để tránh caller sort làm đổi catalog; phải ghi thay đổi này. Sort ổn định và tie-break theo ID do read model Lục Thần quyết định.
2. **`baseview.delMes` dùng `findIndex > 0`**, nên bỏ sót entry ở index 0. Port phải xử lý index 0, unknown key, remove hai lần và callback đang chờ. Không sao chép lỗi này.
3. **`basemdl.regMes` lưu một callback cho mỗi key** và lần sau ghi đè lần trước. Nếu consumer cần nhiều subscriber, dùng owner/subscription token hiện có hoặc cơ chế unsubscribe rõ; không giữ giả định một callback rồi gọi đó là event bus tổng.
4. **`mainlinemdl.getNextGuardInfo` có ID đầu `101001`**, phụ thuộc thứ tự chương và không kiểm `e[i]` trước khi đọc field. Biến tính vị trí `a` không được dùng khi gán `guard_index`. Port dùng ID/next edge của catalog Lục Thần, phân biệt encounter ID và vị trí hiển thị; missing next phải trả lỗi có path thay vì crash. Phát hiện cycle là phần phải viết mới.
5. **`jumpmgr.checkCond` có hai nhóm điều kiện và chế độ AND/OR.** Mẫu dùng mode mặc định/1 là AND, truthy khác 1 là OR; nhóm rỗng cho true ở AND và false ở OR. Helper đích nên dùng enum rõ, giữ semantics tương ứng với schema đã chốt. Input thiếu hoặc key lạ phải có kết quả lỗi rõ, không vô tình mở tính năng; không tự copy nguyên `checkOneCondi` cùng controller/global mẫu.
6. **`heromdl.jsfChkCost` chỉ kiểm từng dòng**, không debit/persist, không validate số và không gộp dòng cùng vật liệu. Hai dòng mỗi dòng 6 với inventory 10 phải thiếu tổng 12. Kiểm âm/NaN/ID lạ và duplicate ở command Lục Thần trước commit.
7. **AFK mẫu có server time, item ID 2/3/4/5, rate privilege và đổi `max_time/60`.** Không lấy trực tiếp đơn vị hoặc paid bonus này làm luật Lục Thần. Rate/cap/checkpoint phải giữ đúng hợp đồng AFK hiện có, test sát cap và claim/reload; đổi rate cần policy rõ.
8. **`loadPfBk` kiểm node còn sống và tab đang chọn**, nhưng port vẫn phải kiểm generation/hero ID để callback của lần mở cũ không gắn sang lần mới. Trong `loadTabPf` excerpt không thấy xóa key khi load thất bại: test retry failure/cancel, không giả có cơ chế đó ở nơi khác.
9. **Badge mẫu có cập nhật parent trì hoãn.** Port cần hủy/kiểm epoch của công việc đó; parent đã bị remove hoặc scene mới không được nhận callback cũ. Thử remove node không tồn tại và parent-child không nhất quán; không để `splice(-1,1)` gỡ nhầm sibling.
10. **`bcwar` đang trình diễn kết quả trong `rdinfos/acts`.** `sort(U)` rồi `pop()` cần đọc comparator nếu port thứ tự; comparator và nhiều helper nằm ngoài các phương thức đã liệt kê, cần đọc thêm từ archive. Lục Thần tự định nghĩa/test thứ tự event, luật damage, RNG và settlement. Ẩn `warVis` không đồng nghĩa dispose; không copy reset/multi-wave hoặc global speed sang luật 15 hiệp của Lục Thần.

Các mục trên là kết quả đọc code tĩnh và yêu cầu cho bản port; không phải lời khẳng định đã tái hiện toàn bộ lỗi trong game mẫu.

## 5. Quy trình một bản port nhỏ

1. **Chọn ticket và owner.** Ghi khoảng thiếu đang giải quyết. Đọc main hiện tại, source Lục Thần và đoạn mẫu theo ID; không cần chạy APK hoặc server mẫu.
2. **Khóa input/output trước khi dịch.** Liệt kê state đọc/ghi, dependency, error, ID map, đơn vị, thời gian, async và side effect. Đánh dấu `PORT` (thuật toán), `ADAPT` (đổi dependency/caller), hoặc `KEEP_EXISTING` (owner hiện tại đủ tốt).
3. **Ghi nguồn để đối chiếu.** Ghi archive hash, đường dẫn và method, SHA-256 file nguồn, phạm vi đọc cùng dependency trong evidence. Giữ bản gốc để đối chiếu tại workspace phân tích; không coi bước này là yêu cầu upload lại thân source đã bị chặn. Giữ thông tin nguồn/license có sẵn trong thành phần được lấy; không suy cả bộ do một tác giả chỉ từ tên Hermes.
4. **Đổi tên và thay dependency ở boundary.** Dùng input plain data, module owner hiện hành hoặc adapter nhỏ. Đánh dấu API/đường dẫn mới là đề xuất tới khi thực sự tạo. Không để global của Cocos, numeric route ID, server URL hay hidden default của mẫu đi vào sản phẩm ngoài chủ đích.
5. **Tách quyết định khác biệt khỏi bản chép.** Ghi rõ bug đã sửa, fallback, rounding, sort order, mutation và các luật giữ riêng. Mỗi khác biệt có expected result; phần đúng có thể dùng lại trực tiếp sau khi test.
6. **Kiểm hành vi có ý nghĩa.** Hàm thuần dùng fixture happy path + boundary + failure từ mục 4. Khi phù hợp, so expected độc lập với đoạn gốc trên input hợp lệ; không dùng đoạn có bug làm oracle. Không chạy toàn bundle mẫu để kiểm một hàm.
7. **Nối caller và commit đúng một lần.** Đưa module vào pipeline khi cần; caller cũ chuyển sang owner mới tại đúng boundary. Với tiền/thưởng, persistence thất bại phải rollback cả state/progress; render/âm/reveal chỉ sau commit.
8. **Nghiệm thu và cập nhật tiến độ.** Thay runtime thì chạy `npm test` và thao tác UI có liên quan. Ghi riêng thiết bị, deployment và phần chưa thử. Chỉ đổi trạng thái port khi có file/caller/test/commit; giữ thông tin nguồn và khác biệt để đối chiếu.

Không viết test chỉ để tìm tên method trong source. Thay đổi chỉ ở tài liệu thì kiểm links, tính nhất quán của map/ticket và phạm vi thay đổi; không dùng việc chạy lại toàn suite làm bằng chứng đã port.

## 6. Tìm source đầu vào và bắt đầu L02a

### Lấy đúng bộ source đã nhận

1. Tìm archive/extracted source trong workspace bằng `rg --files` và công cụ truy cập tệp đính kèm sẵn có của phiên. Điểm nhận diện: bảy part tên `fable5-tam-quoc-source.zip.001` đến `.007`; thư mục giải nén có `modules/`, `decoded-config-vi/`, `decrypted-js/`. Không yêu cầu anh giải nén hộ khi agent có thể tự làm.
2. Nếu đã có `modules/` và `bcwar.js`, đối chiếu file/hash với manifest audit trước khi đọc. Nếu chỉ có part, nối byte theo thứ tự 001→007 thành ZIP; SHA-256 cần khớp `68aea5208f55adf4c6e7d5103c911dbe45f569c8b768a21ab29a6ceec4423115`. Kiểm CRC rồi chỉ giải nén các file cần đọc; từ chối path tuyệt đối, `..` hoặc symlink trong archive.
3. Các file `.ts` là JavaScript bundle/minify. Tìm đúng method và phần `setters` để hiểu alias; không chạy APK, loader native, `System.register` hoặc kết nối server mẫu chỉ để đọc code. Với `bcwar.js`, đọc thêm helper/comparator ở cùng bundle khi cần.
4. Nếu phiên chỉ có quyền đọc GitHub và không truy cập được archive đã gửi, ghi `SOURCE_NOT_AVAILABLE` cho phần port; vẫn làm được L02a validator hoặc sửa owner Lục Thần từ spec. Không dựng lại “code gốc” từ trí nhớ, không báo đã port. Quyền dùng code đã được anh chốt không đồng nghĩa mọi phiên tự có file gốc.

### Lát cắt code đầu tiên

1. Đọc bốn đoạn `basemdl.getConfig`, `basemdl.getCompCfg`, `mainlinemdl.getNextGuardInfo`, `mainlinemdl.getCurCityCfg` và mục lỗi tương ứng.
2. Theo owner trong L02a, lấy DATA/catalog đang active qua một adapter. Tận dụng cách tra config/next edge nếu giúp code rõ hơn; thay section/số ID mẫu bằng field Lục Thần. Không tạo bản sao DATA.
3. Viết validator thuần và report ID playable/NPC/legacy, reward ref, missing edge, cycle, giá âm và asset thiếu. Đây là phần mới phải bổ sung cho Lục Thần, không tuyên bố có sẵn trong source mẫu.
4. Kiểm report tái tạo được với fixture valid, unknown ID, non-playable reward và cycle; ghi nguồn nào đã port hoặc chỉ tham khảo. Chưa thay seed/reward/rate và chưa migrate save trong L02a.
5. Cập nhật L02a cùng [progress](HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md), rồi nhận L03a/L04a theo [execution plan](LUNA-EXECUTION-PLAN-2026-09-07.md). D01/D02 không chặn các việc này.

## 7. Mẫu ghi lại quyết định tái sử dụng trong mỗi ticket

Lưu trong phần evidence của ticket, chẳng hạn `docs/qa/L02a/README.md` khi tạo ticket đó; không cần một hệ thống quản lý khác. Chỉ ghi nguồn/mapping và code đích đã port đúng phạm vi; không upload nguyên thân mã gốc đã bị auto-review chặn.

```text
Ticket/subtask:
Source method + archive path + SHA-256 file nguồn:
Quyết định: PORT / ADAPT / KEEP_EXISTING; lý do:
File/function Lục Thần nhận code; caller/build owner:
Dependency đã thay và input/output:
Hành vi giữ nguyên; bug/luật/đơn vị đã đổi có chủ đích:
Save/transaction/scene lifetime ảnh hưởng:
Test hành vi và actual result; UI/device evidence nếu liên quan:
Commit/PR; deployment chỉ ghi khi xác minh:
Trạng thái: NOT_PORTED / SOURCE_NOT_AVAILABLE / IN_PROGRESS / VERIFIED_PORT:
Phần còn thiếu và bước kế tiếp:
```

`VERIFIED_PORT` chỉ xác nhận phạm vi đoạn đã nối và kiểm, không tự đóng toàn ticket hoặc cả hệ thống. `KEEP_EXISTING` phải ghi cách owner hiện hành đáp ứng mục tiêu để model sau không port lại vô ích.
