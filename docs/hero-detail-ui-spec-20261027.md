# Đặc tả giao diện hồ sơ tướng — AN Bá Đạo

**Mục đích:** dùng tài liệu này làm handoff cho mọi cuộc hội thoại và mọi PR tiếp theo khi triển khai giao diện hồ sơ cho toàn bộ tướng.

**Màn chuẩn:** hồ sơ Bạch Diện trong Draft PR #382, nhánh `ui/bach-dien-vo-cac-20261026`. Đây là màn tham chiếu về tỷ lệ, mật độ, màu, khoảng cách và luồng thao tác. Không copy nhân vật, tên, icon kỹ năng hoặc nội dung riêng của Bạch Diện sang tướng khác.

**Nguyên tắc duyệt:** giao diện phải bám ảnh mẫu theo tỷ lệ và nhịp bố cục. Mọi khác biệt do dữ liệu động, canvas animation hoặc art riêng của tướng phải được ghi rõ trong QA; không tự coi là đạt chỉ vì trang không lỗi.

## 1. Kết quả cần đạt

Mỗi tướng có một hồ sơ dọc 9:16 với một chủ thể lớn ở giữa, nền võ đường hoặc bối cảnh riêng, chữ và số dễ đọc, ba kỹ năng ở dưới chân, một hàng chỉ số, cụm nâng cấp và ba chức năng cuối màn.

Bố cục chung phải có cảm giác như một artboard game hoàn chỉnh. Các thành phần sống của game vẫn là DOM/canvas thật để số liệu, nâng cấp, animation, điều hướng và thao tác không bị biến thành ảnh tĩnh.

Các tướng dùng chung một hệ giao diện. Từng tướng chỉ thay dữ liệu, canvas, nền, màu nhấn, icon kỹ năng, tên, hệ, vai trò và nội dung chi tiết.

## 2. Những điều bắt buộc giữ nguyên

- Giữ canvas và animation gốc của từng tướng; không thay nhân vật chính bằng ảnh sinh mới.
- Giữ `renderHeroDetail`, các tab thật, các listener hiện có, các lệnh nâng cấp, thăng sao, trả mộng, trang bị, đột phá, duyên phận và tinh thông.
- Nút nâng cấp mới phải gọi lại button/handler gốc. Không viết lại giao dịch ở lớp trình bày và không clone button có ID hoặc listener.
- Số cấp, lực chiến, chỉ số, chi phí, sao, mảnh, vàng, save và phần thưởng phải lấy từ state thật.
- Không in số động, tên tướng, tên skill hoặc giá vào ảnh nền.
- Không dựng một app fixture riêng để minh họa. Preview phải chạy trên full game runtime.
- Không sửa combat math, economy, save schema hoặc roster chỉ để làm giao diện.
- Không merge `main` và không promote production nếu chưa có owner approval trên GitHub.

## 3. Artboard và tỷ lệ chuẩn

Dùng artboard tham chiếu **864 × 1536**, tỷ lệ 9:16. Trên màn hình nhỏ, scale đồng đều theo chiều rộng hoặc chiều cao nhỏ hơn; không kéo giãn riêng từng vùng.

Các mốc dọc chuẩn tính theo chiều cao artboard:

| Vùng | Vị trí chuẩn | Yêu cầu |
|---|---:|---|
| Header và tên | 0–8% | Back bên trái, tên lớn, SSR và sao dưới tên, hệ ở góc phải |
| Canvas nhân vật | khoảng 7.6–55.8% | Nhân vật lớn, chân nằm trên vòng sàn; phải đo theo visible foot, không theo ô canvas trong suốt |
| Vai trò + lực chiến | 55.53% | Hai capsule riêng, vai trò trái và lực chiến phải |
| Ba kỹ năng | 60.55–71.6% | Ba icon cùng hàng, khoảng cách đều, nhãn nằm ngay dưới icon |
| Hàng chỉ số | 72.72–78.2% | Một thanh tối mảnh, bốn chỉ số và vòng Cấp ở chính giữa |
| Bạc + ×1/×5 | khoảng 79.6–82.2% | Ô bạc có nền riêng; cụm ×1/×5 là cụm riêng, có khoảng hở, không chạm vòng Cấp |
| Nâng cấp | 82.68–88.4% | Một nút xanh ngọc lớn có viền/hoa văn; gọi handler thật |
| Trang bị / Thăng sao / Chi tiết | 89.19–97.9% | Ba icon tách đều, nhãn nằm dưới, không dùng các card lớn |

Các tỷ lệ CSS đang được khóa trong bộ Bạch Diện hiện tại:

```css
--vc-w: min(100vw, calc(100dvh * 9 / 16));
--vc-h: min(100dvh, calc(100vw * 16 / 9));
--vc-u: calc(var(--vc-w) / 864);
```

Màn hình cao hơn không được kéo các control xuống ngoài artboard. Màn hình thấp phải ưu tiên giữ header, chân nhân vật, hàng chỉ số, nút nâng cấp và ba chức năng cuối cùng trong viewport.

## 4. Cấu trúc DOM dùng chung

Không đổi tên node gốc nếu không cần. Lớp trình bày phải làm việc với cấu trúc thật hiện có:

```text
#hvHeroDetailRoot[data-hero-id="<id>"]
├── .hv-hd-top
│   ├── .hv-hd-back
│   ├── [data-hd-title]
│   └── element badge
└── .hv-hd-stage
    └── #hdBody
        ├── .hstage
        │   ├── authored detail canvas
        │   ├── rarity + stars
        │   ├── role / power
        │   ├── previous / next
        │   └── .hv-scene-skills
        ├── .medalrow
        ├── .vc-overview
        │   ├── .vc-upgrade-price
        │   ├── .vc-upgrade-mode
        │   └── .vc-primary-upgrade
        ├── .vc-feature-menu
        │   ├── Trang bị
        │   ├── Thăng sao
        │   └── Chi tiết
        ├── .hv-detail-workspace
        └── .vc-detail-sheet
```

`#hvHeroDetailRoot` là lớp vỏ dùng chung. `data-hero-id` là scope bắt buộc để CSS của một tướng không làm hỏng tướng khác. Không dùng selector toàn cục cho `.medalrow`, `.upgrades`, `.hstage` hoặc `.btn` nếu selector đó có thể ảnh hưởng roster, combat hoặc màn khác.

Khi rời màn hồ sơ, phải đóng `.vc-detail-sheet[open]` trước khi ẩn root. Dialog không được giữ focus trap hoặc che màn hub/roster.

## 5. Quy tắc hình ảnh và asset

### 5.1. Nền

Mỗi tướng có một background portrait riêng, chỉ chứa bối cảnh:

- Không có chữ, số, badge, nút, icon hoặc nhân vật.
- Có khoảng sáng và khoảng trống sau thân nhân vật để canvas dễ đọc.
- Vòng sàn hoặc điểm đặt chân nằm đúng vị trí chân của tướng.
- Hạn chế núi lặp, chi tiết nhiễu, lá/hoa lấn vào text và các chi tiết trông như AI slop.
- Lưu prompt, nguồn, kích thước, cách xử lý và giới hạn của asset trong metadata.

Bản nền sạch của Bạch Diện nằm ở `assets/ui/hero-detail/reference-v3/background.webp`; nền không được dùng làm ảnh screenshot hoàn chỉnh vì ảnh screenshot sẽ làm hỏng text động và vùng chạm.

### 5.2. Khung và họa tiết

Khung, viền, huy hiệu, nút và họa tiết có thể là PNG trong suốt được cắt từ ảnh mẫu hoặc asset vector/bitmap được vẽ lại theo mẫu. Khi cắt:

- Chỉ cắt phần trang trí, loại bỏ số động và chữ động.
- Xóa sạch chữ/số bị chìm trong nền; không để bóng mờ hoặc ký tự cũ đè lên dữ liệu sống.
- Giữ alpha sạch ở mép icon và khung.
- Ghi tọa độ crop và mask trong `source-map.json`.
- Không dùng một crop có chữ Bạch Diện cho tướng khác; tên, role, element, skill label và số phải có slot riêng.

### 5.3. Icon

Ba icon kỹ năng và ba icon chức năng cuối màn phải có silhouette đúng nghĩa, kích thước đồng đều và không bị nhốt thêm vào card CSS nếu mẫu không có card.

Với tướng đã có icon authored trong game, ưu tiên dùng icon đó. Chỉ dùng crop từ ảnh mẫu khi owner đã duyệt và crop không chứa dữ liệu sai. Mọi icon phải có `alt`/aria label phù hợp dù chữ nhìn thấy có thể là raster.

## 6. Typography và màu

- Tên, nhãn, số và chữ tiếng Việt phải không vỡ dấu.
- Ưu tiên `Noto Serif`, `Times New Roman` hoặc font đã có trong game; không dùng Georgia cho khối tiếng Việt vì có thể tách dấu.
- Số động và label sống phải là DOM để thay đổi theo state.
- Header dùng chữ sáng trên gỗ tối; vàng đồng dùng cho viền, SSR, sao và điểm nhấn.
- Thanh chỉ số và cụm bạc/×1/×5 dùng nền nâu đen bán trong suốt, có viền mảnh.
- Nút primary dùng xanh ngọc, chữ sáng, viền vàng và họa tiết nhẹ.
- Không phủ một panel nâu đặc kín toàn màn; nền bối cảnh phải còn nhìn thấy.

## 7. Quy tắc component hóa cho toàn bộ tướng

Tách UI thành hai lớp:

### Lớp dùng chung

- Artboard 9:16 và safe-area handling.
- Header, back, element badge, rarity/stars.
- Vị trí canvas, role/power, skill row, stat row, level rim.
- Cụm bạc, selector ×1/×5 và primary upgrade.
- Ba feature actions.
- Native detail sheet, sáu tab, close/Escape/outside click và route cleanup.
- Token màu, typography, touch target và responsive rules.

### Lớp cấu hình theo tướng

Mỗi tướng cần một record hoặc manifest tương đương:

```js
{
  id: 'bach_dien',
  name: 'Bạch Diện',
  rarity: 'SSR',
  element: 'hoa',
  role: 'Sát thủ phép',
  background: 'assets/ui/hero-detail/<id>-showcase-bg.webp',
  detailCanvas: { src, cellW, cellH, aspectRatio, foot, pivot },
  skillIcons: { basic, ultimate, passive },
  featureIcons: { equipment, star, details },
  accent: { gold, jade, fire },
  cropSet: null,
  presentationVersion: 1
}
```

Không đưa logic kinh tế hoặc handler vào manifest. Manifest chỉ mô tả presentation và asset. `hero-detail-tabs.js` lấy tên, hệ, role, power, stats, skill data và state từ runtime hiện có.

Đối với hero chưa có background hoặc detail canvas đạt chuẩn, tạo asset và QA trước rồi mới bật layout mới cho hero đó. Không để fallback sai nghĩa hoặc ảnh placeholder lọt vào production.

## 8. Luồng tương tác bắt buộc

- Back về roster bằng handler/router hiện có.
- Previous/next đổi đúng hero và cập nhật background, canvas, tên, hệ, sao, skill và dữ liệu.
- Bấm từng skill shortcut mở đúng tab Kỹ năng, scroll tới đúng skill và hiển thị nội dung thật.
- Trang bị mở tab Trang bị; Thăng sao mở vùng sao và các button gốc; Chi tiết mở sheet tổng hợp.
- Close, Escape, click backdrop và chuyển route đều đóng sheet.
- ×1 gọi đúng level-up handler một lần.
- ×5 gọi đúng handler batch hiện có, hiển thị giá khởi điểm dạng `Từ … bạc/cấp` nếu giá các level thay đổi.
- Nâng cấp bị disable khi button nguồn bị disable.
- Không có double-spend, double listener, clone transaction hoặc state giả.
- Touch target thực tế tối thiểu 44px kể cả khi phần hình nhìn nhỏ hơn.

## 9. Sao và SSR

Quy tắc hiện hành của game: SSR bắt đầu ở **5 sao thật**, không chỉ sơn năm ngôi sao trên UI. Cap hiện có vẫn giữ nguyên.

Khi áp dụng cho các tướng khác:

- Tướng SSR mới khởi tạo với `stars: 5`.
- Tướng SSR cũ 1–4 sao migrate lên 5; tướng 6 sao giữ nguyên.
- Tướng không phải SSR và trạng thái sở hữu không bị đổi.
- Mảnh đã chi trước đó phải được xử lý bằng credit hoàn một lần; sao miễn phí từ mốc SSR không được hoàn thành mảnh.
- Nâng 5→6 dùng đúng cost hiện có của hệ thống; Trả Mộng đưa về 5 và chỉ hoàn phần đã đầu tư.
- Reset lặp lại không được tạo mảnh.
- UI đọc `heroStars(id)` hoặc domain reader tương đương, không đọc field sai như `.star`.

Nếu PR mới đụng vào save/migration/star domain, phải chạy riêng test policy và browser transaction, không chỉ nhìn số sao trên màn hình.

## 10. Quy trình triển khai cho từng tướng

1. Đọc `AGENTS.md`, handoff và `docs/ui-ux-reference-parity.md`; refresh main và PR head.
2. Audit hero hiện tại: ID, rarity, element, role, canvas/atlas, background, skill data, feature handlers, save state và tab nodes.
3. Chụp before ở 390×844 và 320×700; ghi kích thước canvas, chân visible và vị trí các node.
4. Chuẩn bị manifest, nền sạch, icon skill, icon feature và metadata. Không chỉnh main lúc asset còn chưa có evidence.
5. Dùng layout chung; chỉ thêm CSS override theo `[data-hero-id="<id>"]` khi thật sự cần vì canvas hoặc art khác tỷ lệ.
6. Bật hero vào preview, kiểm tra background, canvas, feet, role/power, skills, stats, cost, upgrade và footer.
7. Kiểm tra mọi skill, sáu tab, equipment, star-up, reset, previous/next, back và route transition.
8. Chụp after và ảnh so sánh; đọc ảnh bằng mắt, không chỉ dựa vào DOM assertions.
9. Chạy test Node, syntax, browser responsive và asset/error audit.
10. Tách mỗi nhóm hero thành PR nhỏ hoặc commit có phạm vi rõ; owner review trước merge.

Không triển khai cả roster bằng một rewrite lớn. Làm một hero đại diện, khóa component chung, sau đó migrate theo nhóm có cùng tỷ lệ canvas và phong cách bối cảnh.

## 11. QA bắt buộc

### Viewport

| Viewport | Mục tiêu |
|---|---|
| 320×700 | Không mất footer, không tràn ngang, touch target vẫn bấm được |
| 390×664 | Kiểm tra màn thấp, khoảng cách vòng Cấp–bạc–toggle |
| 390×844 | Kiểm tra bố cục chuẩn và mở sheet |
| 414×715 | Kiểm tra iPhone rộng nhưng thấp |
| 1280×800 | Artboard nằm giữa, không stretch, không overflow |

### Assertions

- `scrollWidth <= clientWidth`.
- Footer nằm trong viewport ở trạng thái chính.
- Canvas có pixel alpha thật và visible feet nằm trên vòng sàn.
- Ba skill image và ba feature image decode thành công.
- Không có page exception, asset 404 ngoài danh sách đã biết và console error mới.
- Khoảng cách level rim–silver, silver–toggle, toggle–upgrade đều dương và không chạm nhau.
- Dữ liệu động đổi đúng khi nâng cấp hoặc đổi hero.
- Sheet mở/đóng đúng, không giữ focus trap khi chuyển route.
- Tướng khác không bị ảnh hưởng bởi CSS scope.

### Browser flow tối thiểu

```text
open roster
→ open hero
→ inspect idle and feet
→ click Basic / Ultimate / Passive
→ open Trang bị
→ open Thăng sao
→ open Chi tiết
→ Escape / Close / backdrop
→ click ×1 and verify level + cost
→ click ×5 and verify batch + cost
→ previous / next
→ Back to roster
→ reopen hero
```

Safari/iPhone thật phải được ghi riêng là `NOT_RUN` nếu chưa có thiết bị. Chromium pass không được ghi thành physical Safari pass.

## 12. Những lỗi đã từng xảy ra cần tránh

- Nền bạc gộp thành một dải liền với ×1/×5; chuẩn là ô bạc và cụm toggle riêng, có khoảng hở.
- Vòng Cấp bị grid kéo xuống và chạm ô bạc; vòng phải overflow đều quanh hàng stat cố định.
- Nền vòng Cấp còn sót số `0`; phải làm sạch toàn bộ inner disk trước khi đặt số live.
- Dùng ảnh screenshot hoàn chỉnh làm background khiến số, chữ và nút bị đè hoặc không bấm được.
- Dùng khung lớn và panel dày làm mất cảm giác bối cảnh.
- Dùng icon emoji/glyph thay cho asset có silhouette đã duyệt.
- Dùng font không hỗ trợ dấu tiếng Việt.
- Đổi tên tướng hoặc chữ trên ảnh nhưng không đổi dữ liệu thật.
- Chỉ đổi số sao nhìn thấy mà không đổi save/migration/domain.
- Test một viewport duy nhất rồi kết luận responsive đạt.

## 13. Prompt mở cuộc hội thoại mới

Dán đoạn sau vào cuộc hội thoại mới:

> Đọc `docs/hero-detail-ui-spec-20261027.md`, `AGENTS.md` và `docs/ui-ux-reference-parity.md` trước khi sửa. Dùng giao diện Bạch Diện trong PR #382 làm golden reference để triển khai cùng layout cho các tướng khác. Giữ canvas/animation, data, save, economy và handler thật của từng tướng. Tách layout chung khỏi manifest presentation theo từng hero; không dùng screenshot làm background hoàn chỉnh, không hardcode số động và không dựng fixture app. Làm từng hero theo nhóm, kiểm tra 320×700, 390×664, 390×844, 414×715 và 1280×800. Mỗi hero phải có nền sạch, canvas visible feet, ba skill icon, stat row, bạc + ×1/×5 tách riêng, nút Nâng cấp và ba feature actions giống artboard 864×1536. Chạy test, browser interaction, screenshot review và báo rõ Safari/deployment nếu chưa chạy. Giữ Draft và chờ owner duyệt, không merge main.

**Điểm bắt đầu đề xuất:** refactor phần Bạch Diện thành component/layout dùng chung, sau đó migrate tướng có canvas và tỷ lệ gần nhau trước. Không copy crop chữ hoặc icon riêng của Bạch Diện sang tướng khác.

## 14. Trạng thái triển khai (27/10/2026)

Mẫu đã bật cho **cả 21 tướng** qua manifest `VC_HERO_PROFILES` (`src/ui/hero-detail-tabs.js`); CSS dùng scope chung
`#hvHeroDetailRoot[data-vc-layout]`, hệ gắn qua `data-vc-element`. Thêm tướng mới = thêm một dòng manifest:

```js
new_hero: { idleShiftU: 0, idleScale: 1, job: 'Nhãn nghề ngắn', skillIcons: { basic, ultimate, passive } }
```

- `idleShiftU`: dịch canvas theo đơn vị artboard để chân visible chạm vòng sàn (đo alpha thật, mốc Bạch Diện).
- `idleScale`: chỉ dùng khi canvas quá cao, đầu chạm vùng tên/sao (Kỷ Vân, Tiêu Phong = 0.84).
- `skillIcons: null` → ấn chữ tạm theo màu hệ, chờ icon thật. Không dùng emoji.
- Tướng không có canvas idle dùng ảnh toàn thân tĩnh của `.hsava` trong đúng khung sân khấu.
- QA: `docs/qa/hero-detail-all-21-20261027/README.md`.
