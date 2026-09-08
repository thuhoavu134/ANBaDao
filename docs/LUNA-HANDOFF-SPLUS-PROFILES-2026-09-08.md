# Bàn giao L11 cho Luna — 08/09/2026

Chủ dự án yêu cầu chốt tiến độ và bàn giao ngay khi đang làm L11. **Trạng thái: REVIEW / IN_PROGRESS; combat V2 chưa GREEN.** Checkpoint này lưu công việc để Luna tiếp tục, không phải bản phát hành gameplay V2.

> **Cập nhật tiếp nối `20bda88b` — đọc trước khi tiếp tục.** Phần lịch sử bên dưới giữ nguyên để truy vết, nhưng các số liệu/checklist cũ trong đó không còn là trạng thái hiện tại. Source-of-truth mới là [`docs/L11-CONTINUATION-2026-09-08.md`](L11-CONTINUATION-2026-09-08.md) và machine evidence [`continuation-scope-crop-restart-20260908.json`](qa/L11-SPLUS-PROFILES/continuation-scope-crop-restart-20260908.json).
>
> - Code follow-up: `e1f0b964bc657cd0914bbcfc6a00c9c4eb5221ec`; docs/evidence follow-up: `20bda88b78273fa2a6bd8ded4f255e6a4230527f`.
> - Full source suite: **414/414 PASS**; focused crop/target/restart/dialog slice: **10/10 PASS**.
> - Đã sửa: crop inset `{x:3,y:5}`, target picker theo phạm vi authored, restart sạch; UI combat giữ layout đã thiết kế.
> - Còn mở: full visual atlas matrix, mobile/Safari/device (backend không có viewport emulation), và các quyết định duration phân số/giá trị chưa định lượng. Không tự làm tròn, không tự coi là DONE.
> - Main/production vẫn ở `03d4fdf`; Combat V2 chưa promote. Preview isolated chỉ là QA host, không phải release evidence.

## 1. Lấy đúng công việc

- Nhánh source đang làm: [`handoff/l11-splus-profiles-v2-20260908`](https://github.com/bktimmy247/luc-than/tree/handoff/l11-splus-profiles-v2-20260908).
- Baseline thực trên GitHub trước bàn giao: `f3dc071a82ead9851bd4495fe92296f7c8c6fe1f`.
- Main nhận tài liệu tiến độ, contract và evidence; source, UI, tests mới và artwork L11 được lưu trên nhánh trên. **Không gộp nguyên checkpoint vào production khi các gate dưới đây chưa đạt.**
- [Contract L11](SPLUS42-PROFILE-V2-CONTRACT.md), [kết quả hiện tại](../tests/results/latest.md), [machine checkpoint](qa/L11-SPLUS-PROFILES/handoff-checkpoint.json).

Trên một checkout GitHub đầy đủ, bảo toàn thay đổi riêng rồi lấy nhánh:

```sh
git fetch origin main handoff/l11-splus-profiles-v2-20260908
git switch --track origin/handoff/l11-splus-profiles-v2-20260908
node --test --test-reporter=tap tests/splus-profiles.test.mjs tests/splus-v2.test.mjs
node --test --test-reporter=tap tests/splus-combat.test.mjs tests/splus-kits.test.mjs tests/splus-runtime.test.mjs
npm test
```

Nếu nhánh local đã tồn tại, switch nhánh đó và kiểm tra SHA trước khi sửa. Main sẽ có bản bàn giao cập nhật mới hơn bản nằm trong checkpoint source. Đọc bản trên main trước. Không dùng các commit local tổng hợp từ workspace bàn giao làm parent của main; checkpoint đã được tạo từ parent GitHub thực.

## 2. Yêu cầu mới nhất của chủ dự án

Chủ dự án gửi hồ sơ gameplay đầy đủ 42 tướng S+ và bộ 126 nút chiêu. Hồ sơ đầy đủ mới thay số liệu bản tóm tắt ban đầu. Dữ liệu đã nhập trong nhánh source để Luna không phải tìm lại cuộc hội thoại:

- `src/domain/hero/splus-profiles/{metal,soul,water,fire,wood,dream}.mjs`: 7 tướng/hệ, tên chiêu đầy đủ/tên ngắn, mô tả cơ chế tiếng Việt, target, rules, giới tính/tuổi, giới thiệu và câu thoại lobby/ultimate dạng text.
- `src/domain/hero/splus-skill-art.mjs`: 126 mô tả/prompt nút từ chủ dự án.
- `src/domain/hero/splus-profiles.mjs`: liên kết 42 hồ sơ, 126 nút, atlas/rect và payload UI.

Hồ sơ gameplay là nguồn cho cơ chế. Hình icon không đổi luật: ví dụ tranh Hỏa Khiêu vẽ 3 bóng chiến binh nhưng Ultimate chỉ gọi **2 đồng minh**. Có **42 icon HUD trạng thái** và **126 icon nút chiêu**, dùng namespace riêng. Ba nút P/S1/Ult mở popup khi chạm ở danh sách tướng, trang giới thiệu và trận S+; popup phải đọc được tên, mô tả đầy đủ, mục tiêu, chỉ số, giới hạn, cooldown và Nộ thực tế.

Khung P tròn bạc/đồng không viền năng lượng; S1 bát giác/khiên vàng có vị trí cooldown; Ult thoi/hoa sen rồng vàng có rãnh Nộ, glow ở 100. Chữ, cooldown và Nộ là DOM sống. Giữ giá S1 **25**, Ult **60**, trần Nộ **100** vì hồ sơ không đổi giá. Không tự sinh audio từ câu thoại, không thay art tướng chính thức. Giữ seed, reward, roster cũ, quyền sở hữu và save migration. Thay luật chỉ trong phạm vi bộ kỹ năng S+ được chủ dự án chỉ định.

## 3. Đã viết gì, mức xác minh đến đâu

| Phần | Đã có trong source checkpoint | Giới hạn xác minh |
| --- | --- | --- |
| Hồ sơ | 42 profiles, 126 skills, tên đầy đủ/tên ngắn, số liệu và câu thoại | 3/3 test dữ liệu/contract đạt; chưa phải kiểm chứng mọi tooltip với combat |
| Artwork | 6 atlas × 21 vùng icon; cả PNG gốc và WebP, prompt gốc và prompt tạo ảnh | Đã tạo ảnh thật; chưa QA crop/alpha trên trình duyệt, chưa nghiệm thu art |
| Danh sách/giới thiệu | Tìm kiếm, lọc hệ/vai trò, thẻ tướng, chi tiết và 3 nút chiêu | Source đã viết, chưa build/browser QA V2 |
| Popup | Dialog tiếng Việt, target/effects, live cooldown/Nộ, Escape/close/focus restore, tùy chọn tung chiêu | Chưa xác minh bằng thao tác browser thật |
| Runtime bridge | Gắn thanh 3 icon, chuyển nút cũ sang inspect/cast, nối beginTurn | Chưa chạy qua build owner và browser; phải kiểm tra restart/cleanup |
| Combat dùng chung | Sửa stack, giảm thương, phản đòn, shield, DoT/HoT, đầu lượt/đầu hiệp, Nộ, clone, cứu tử và freeze | 14/20 test hành vi V2 đạt; còn 6 fail; nhiều skillHandlers vẫn V1 |
| Toàn bộ 84 S1/Ult | Dữ liệu mô tả đã nhập | **Resolver chưa đồng bộ hết; không được công bố 42 bộ kỹ năng V2 hoàn thành** |

Các thay đổi dùng chung hiện có gồm: Cơ Trọng 3% giáp/tầng tối đa 10; Lạc An 8 tầng; Cường Đồng giảm đòn xa; Thạch Kinh ngưỡng sát thương 10% HP; Vọng Cơ chọn địch công cao nhất; Cổ Nương hút Trùng Hồn; Thủy Cơ cùng hàng; Hải Phong chỉ chặn đòn bạo kích vượt ngưỡng; Nung dùng max HP nguồn khi phản burn; Hắc Đao bleed theo công nguồn; Bột Lửa theo ô; Miên Nương đầu lượt đồng minh; Tằm Nương tái tạo kén; Mãng Xà lây độc khi nạn nhân hành động; Kính Nương phản đòn thường thành công thì chặn đòn gốc; Cửu Triều tích theo hành động hai phe và tự hao máu hiện tại; Tố Linh freeze khóa hành động/Nộ/nội tại. Đây là phạm vi đã sửa, không phải chứng nhận hoàn tất từng tướng.

## 4. RED / GREEN / REFACTOR và test thật

Workflow `vibe-gate`, run `20260907-233350-enmzoby`; timestamp trong trace là **08/09/2026 UTC**. Contract và ticket guard đã ghi evidence; bước đang mở là **red-green-refactor**. Không sửa trace để tạo completion giả.

| Kiểm tra checkpoint | Kết quả | Evidence |
| --- | --- | --- |
| RED profiles | Test lỗi trước khi có module hồ sơ | `profiles-red.tap` |
| GREEN profiles | 3/3 đạt | `profiles-green.tap` |
| RED combat V2 | 20/20 fail trước sửa common mechanics | `combat-red.tap` |
| Profiles + combat V2 hiện tại | **17/23 đạt; 6 fail** | `handoff-targeted.tap` |
| Bộ S+ cũ chạy trên WIP mới | **117/133 đạt; 16 fail** | `handoff-existing-splus.tap` |
| Syntax JS/MJS thay đổi | **17/17 đạt** | `handoff-syntax.json` |
| `git diff --check` | Đạt tại checkpoint | `handoff-syntax.json` |
| `npm test` (gồm build) | Exit 1 tại bước assemble asset, chưa tới full test suite | `handoff-npm-test.log` |
| Browser V2 | **NOT_RUN** | Không có browser PASS cho checkpoint này |
| Device/Safari V2 | **NOT_RUN / backend unavailable** | Capability device lần trước là `[]`, không có lần đo device mới |
| Production V2 | **NOT_DEPLOYED** | Nhánh WIP không được promote production |

Các file evidence nằm trong [`docs/qa/L11-SPLUS-PROFILES/`](qa/L11-SPLUS-PROFILES/). File RED/GREEN trước checkpoint giữ nguyên nội dung reporter thực tế; file `handoff-*.tap` được chạy với `--test-reporter=tap`. Node tại checkpoint: `v24.19.0`.

**GREEN mới đạt một phần; REFACTOR chưa hoàn tất; evidence/review gate cuối chưa chạy.** 16 fail của bộ cũ bao gồm assertions số liệu V1 đã thay theo hồ sơ mới (5% gear, Thủy Cơ adjacent, Nung mọi đòn...). Luna phải phân loại từng fail thành thay đổi yêu cầu hay regression thật; không đổi tất cả assertion chỉ để xanh. Các số 133/151 PASS và browser production trong các mục L10 cũ là lịch sử, không áp dụng cho L11.

### Sáu test V2 đang fail — bắt đầu tại đây

| Test / tướng | Assertion thực tế | Chỗ tiếp tục |
| --- | --- | --- |
| Cơ Trọng | shield `5000`, mong đợi `7400` | S1 vẫn dùng handler cũ; 2 hàng trước, 22% max HP Cơ Trọng và resist 20% trong 2 hiệp |
| Tiêu Hồn | nhận thêm Nộ `30`, mong đợi `0` | S1 chưa gắn rageBan 2 hiệp vào hàng sau có Nộ cao nhất |
| Trầm Châu | shield `0`, mong đợi `2500` | S1 phải cấp lớp khiên thật 25% max HP nguồn; crit/bleed immunity theo thời gian lớp bóng tồn tại |
| Tuệ Y | tướng mới chết vẫn HP `0`, mong đợi `5000` | Ultimate đang chọn thứ tự tử trận cũ; hồi sinh người gục gần nhất |
| Khaos | HP mục tiêu không giảm khi có khiên | Ultimate chưa bypass shield theo hồ sơ mới |
| Hồi Ảnh | đồng đội của mục tiêu không mất HP ngay | S1 còn xếp confusion cho lượt sau, phải cưỡng ép một đòn thường ngay |

Một test có nhiều assertion; fail đầu tiên có thể che lỗi phía sau, đặc biệt Trầm Châu, Tuệ Y và Hồi Ảnh/Vân Pháp. **Sáu fail không phải tổng số cơ chế còn thiếu.**

## 5. Rà soát 42 tướng trước khi đưa V2 ra production

Bảng dưới là các điểm handler cần sửa/đối chiếu, không phải checklist đã nghiệm thu. Mở dữ liệu V2 theo `key` và đối chiếu toàn bộ passive/S1/Ult. `skillHandlers` trong `src/domain/combat/splus-mechanics.mjs` còn phần lớn S1/Ult cũ.

| Tướng | Việc tiếp theo trong resolver / test |
| --- | --- |
| Cơ Trọng | S1 khiên 22% max HP nguồn + resist20 cho 2 front; Ult reflect **vật lý25%** +40 Nộ; test shield ở mốc10 tầng chỉ phát đúng lần |
| Cường Đồng | S1 một front đối diện, physical15% max HP nguồn, stun1, armor-30/2; Ult taunt6/2, armor60, miễn hard CC |
| Lạc An | S1 weakest back, pierce40, anti-stealth2; Ult7 hit tăng15% từng mũi, retarget highestATK khi chết; không tự forcecrit mọi mũi |
| Hạc Phá | Ult phá shield front, stun mục tiêu giữa **1.5 hiệp**; phải chốt cách biểu diễn half-round |
| Thiết Lãnh | S1 disarm cả basic và weapon-skill; xác minh Ult front shieldbreak100/stun1 |
| Minh Tỏa | S1 opposite front shieldbreak/noShield2; Ult highestRage back, hardSilence2, -50 Nộ, noExtraTurn2 |
| Thiềm Ngân | S1 heal22% max HP nguồn, armor20 trong3; Ult35heal/resist30/2/ward1 lần mỗi tướng; overheal shield2 |
| Linh Đồng | S1 confusion50% đánh nhầm trong1 hiệp; không còn root đơn thuần; Ult silence toàn phe1 |
| Tiêu Hồn | S1 highestRage back +rageBan2; Ult emptyRage+silence1; full100 Nộ tăng crit damage đòn kế |
| Thạch Kinh | Ult magicResist50 toàn đội2 + khiên front25% max HP nguồn; kiểm tra tiêu thụ tầng/threshold |
| Hàn Nương | S1 2front strip1 buff ngẫu nhiên mỗi người +buffBan1; Ult physical/magic armor-40/2 |
| Vọng Cơ | S1 trừ25 Nộ; Ult đưa **2 highestRage** về0, giảm30% damage phe địch2 |
| Cổ Nương | S1 12% HP **hiện tại** mục tiêu front +armor-40/2; Ult nổ parasite, chia30% tổngdamage cho5 đồng minh khác; rà cap parasite chưa do owner định lượng |
| Mục Chiêu | S1 20% max HP nguồn cho3 thấp máu +curse cleanse; Ult35heal/team, xóa silence, cân bằng5 đồng minh khác |
| Thủy Cơ | S1 front thấp máu18heal +cleanse1 burn/poison; Ult20heal/cleanseall/haste25/2 |
| Hà Lãng | S1 một front +push1ô; splash30% từ cả basic và skill, không tạo vòng splash lặp |
| Giang Quân | Ult front root2 phải cấm melee attack theo mô tả; knockup1giây phải nối scheduler có chủ quản |
| Thủy Ngọc | S1 backcarry khiên20% max HP nguồn, vỡ nổ2targets; Ult backheal20/rage30/rageRate20/2 |
| Hải Phong | Test critical-only cap20% max HP; S1 kéo backcarry về trước mặt/stun1, Ult armor-40/2 |
| Trầm Châu | S1 khiên25% nguồn +crit/bleed immune khi bubble còn; Ult shield30, đổi50% damage sang Nộ chỉ1 hiệp, enemy crit-35/2 |
| Dạ Xoa | Ult bỏ guard/share damage theo hồ sơ; không tự thêm bypass khiên cá nhân ngoài yêu cầu; kill stealth1 và anti-stealth tương tác |
| Nung | S1 single stun+nổlan; Ult armor40 **bản thân**, burn front nguồnHP2; basic retaliatory chỉ melee |
| Hỏa Tiêu | S1 backcarry blind35/2; Ult burn detonation thêm20%, xác định base damage và consumption trong contract |
| Hỏa Khiêu | S1 2 cùng hàng atk20/lifesteal15/2; Ult2 assist không tốn lượt; chốt assist có tính sự kiện action cho cadence/gear hay không |
| Cửu Tính | Debt5 nổ/stun, Ult nổ mọi debt và selfheal20%; không giữ tầng rồi kích nổ lặp vô hạn |
| Hỏa Bài | S1 front blind30/2, hồ sơ mới không còn armorbreak; Ult3nhịp/zone detonation/stun burning1; zone expiry và vị trí |
| Hắc Đao | S1 armor-40/noShield2; Ult damage lan4 ô và antiHeal100/2; test external heal inversion khi antiheal cùng tồn tại |
| Hỏa Dực | S1 2back atk20/rage20; Ult30heal/crit25/2 +burn conversion; giữ base DoT theo nguồn, không nhân đôi tick |
| Miên Nương | S1 2front heal15 +cleanse1random; Ult25heal/resist20/regen6 trong2, phải đủ2 tick |
| Trầm Tuệ | S1 sleep không gây damage đánh thức ngay; Ult atk-30/actionSlow40/2; direct damage mới thức giấc |
| Hạc Hoa | S1 disarm thay entangle; Ult antiHeal100/2 +root1; xác minh bleed4 và healReduction20 |
| Tằm Nương | Ult AoE damage/front paralysis1/teamheal25; không thêm root toàn phe ngoài mô tả; kén battle-start/2rounds chặn đúng2hit |
| Sơn Cương | S1 xuyên cùng cột, crit40, heavybleed2 cần base rõ; Ult bleed detonation, hạ gục tái dùng chỉ1lần |
| Tuệ Y | S1 20% max HP nguồn/3lowest +HoT6×2; Ult40heal+cleanse+revive mostRecent 50HP/50Rage once; emergency CD chung2 |
| Mãng Xà | S1 3random distinct, shieldbreak/armor-25; Ult detonate poison, miss40% **đòn kế** tối đa2hiệp; spread khi victim hành động |
| Khaos | S1 random front-back swap; Ult true+bypassshield+moveSlow30/2; clone explode/respawn3 đã có common nhưng cần battle QA |
| Kính Nương | S1 blind100% next attack một charge; Ult35% skill reflect true/1, không phản vòng lặp |
| Hồi Ảnh | S1 forced friendly basic ngay; Ult thêm AoE damage cùngshuffle/stun2random/1; giữ seeded RNG |
| Vân Pháp | S1 2front damage, steal atk/armor buff cho2 ally ngẫu nhiên; ward35% từ hành động, cleanse mỗi debuff5%HP |
| Cửu Triều | S1 true damage/cone/strip1/rage25; Ult9hits bonus40% dưới40HP, extra turn≤1/hiệp; CC halfstacks/rescue vô hiệu đúng lúc |
| Thạch Mộng | Ult khiên35% max HP **Thạch Mộng** toàn đội2 +30% intercepted damage true AoE; meter20%HP push1nhịp |
| Tố Linh | S1 push nửaô/slow30/2; Ult freeze1 cấm hành động/Nộ/nội tại; test cả rescue/passive triggers và hết hiệu lực |

## 6. Các rủi ro kỹ thuật cần xử lý sau sáu fail

1. **Data/resolver version chưa thống nhất:** `SPLUS_SCHEMA` và `kitVersion` bridge còn V1, common mechanics trả V2. `rules()` mới dùng một phần; tránh tooltip một số, hardcode handler một số khác.
2. **HoT vòng cuối:** `beginRound` tăng round rồi gọi `statuses()` có thể lọc entry vừa hết hạn trước tick cuối. Test regen6%/2hiệp phải nhận đúng2 tick, không chỉ một.
3. **Popup/scheduler lifetime:** `splusSkillBar` chỉ rebuild khi actor ID đổi; restart dùng cùng ID có thể giữ closure actor cũ. Đóng dialog khi exit/restart, không nhân listener, trả focus vào node còn sống. Rà close event khi mở liên tiếp.
4. **Build adapters:** chạy owner `scripts/build-static.mjs`, kiểm tra fail-closed anchors của `scripts/splus-runtime-v1.mjs`, cả `battle.html` độc lập lẫn battle nhúng. Chưa có build thành công từ source mới.
5. **Đầu lượt:** host gọi `beginTurn` trước energy và có thể bị DoT giết actor. Kiểm tra không cấp action/Nộ cho actor đã chết, không gọi Miên Nương/zone tick hai lần.
6. **Phản đòn/cứu tử:** vòng reflect, damage interception, external-heal inversion, emergency-heal cần bounded interaction. Không mặc nhiên coi depth guard là đủ test.
7. **Thời lượng chưa rõ:** 1.5hiệp, 1giây knockup, half-slot push; thống nhất với scheduler hiện hữu và ghi quyết định. Không âm thầm làm tròn hoặc đổi clock.
8. **Review defaults:** chọn thấp máu theo %HP, cộng dồn parasite chưa được owner chốt cap, tỷ lệ damage chưa định lượng, thứ tự80%antiheal/50%heal inversion, ai được tính là ally trong từng chiêu. Phân biệt số được owner chỉ định với tạm chọn.
9. **Art cropping:** rect hàng/cột đang ước lượng thủ công, có padding dưới không đều giữa atlas. Kiểm tra trọn126 vùng ở kích thước HUD/mobile, alpha fringe, không hiện icon hàng bên cạnh.
10. **Mã cần refactor:** biểu thức `focusTarget?.25:0` parse được nhưng phải viết rõ toán tử ba ngôi; tách các rules/shared hooks hợp lý sau GREEN, giữ tests hành vi.

## 7. Bản đồ file và asset

| File / thư mục | Chủ quản |
| --- | --- |
| `src/domain/hero/splus-profile-data.mjs` và `splus-profiles/*.mjs` | Nguồn mô tả/rules 42 tướng V2 |
| `src/domain/hero/splus-catalog.mjs` | Catalog ID/role/slot/weapon/status giữ liên kết hồ sơ |
| `src/domain/hero/splus-profiles.mjs`, `splus-skill-art.mjs` | 126 button IDs, payload, prompt, atlas rectangles |
| `src/domain/combat/splus-mechanics.mjs` | Resolver; ưu tiên common hooks + 84 S1/Ult handlers |
| `splus-lab.html`, `src/ui/splus-encyclopedia.js` | Danh sách, bộ lọc, màn giới thiệu tướng |
| `src/ui/splus-skill-details.js`, `.css` | Popup/nút P/S1/Ult dùng chung catalog và battle |
| `src/runtime/splus-battle-bridge.js` | Đọc trạng thái live và nối UI với combat/scheduler |
| `scripts/splus-runtime-v1.mjs` | Build owner adapter, copy assets UI/payload và patch runtime |
| `tests/splus-profiles.test.mjs`, `tests/splus-v2.test.mjs` | 23 test mới; 6 lỗi ban đầu cần xử lý |
| `assets/skill-buttons/splus-v2/` | 6PNG gốc + 6WebP, `atlas-prompts.json`, `provenance.json` |

Art dùng image generation thật. Mỗi atlas 3 cột P/S1/Ult ×7 hàng tướng; tổng126 **vùng**, không phải126 file ảnh riêng. PNG kích thước821×1916, riêng water821×1915; WebP giữ kích thước, ImageMagick quality85. `provenance.json` ghi SHA256, Git blob SHA1, kích thước, thứ tự hero hàng, nguồn/prompt và trạng thái `GENERATED_REVIEW_REQUIRED`. Hai bộ HUD/status và button không được tráo ID.

## 8. Blocker và production baseline

- **Build checkout:** thiếu `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`, `ENOENT` tại `scripts/luc-anh-idle-asset.mjs:29`. Đã kiểm tra GitHub tại baseline: part01 có thật (11.534.336 bytes, blob `022b30410989f42d8e5115634586144d2c08dc69`), part02 cũng có. Đây là thiếu asset của checkout local; dùng clone đầy đủ/khôi phục asset gốc qua GitHub rồi chạy build lại. Không tạo ảnh giả hay bỏ assembler để né lỗi. `npm test` chưa chạy full suite do build dừng sớm.
- **Ticket Board:** không có tool Board/claim-lock; claim/lease null, locks rỗng. `boot/doctor/smoke`, `ticketctl`, `agent-browser`, `game-dev` chưa khả dụng trong session này. Không giả claim hoặc trạng thái Board.
- **Device:** backend chưa khả dụng; capability lịch sử `[]`. Browser Chrome trước đây có nhưng không thay thế Safari/device thật; lần này chưa QA V2 bằng browser.
- **Production hiện hành trước bàn giao:** L10 code `2314c2e` + fix `889426a`, docs `f3dc071`; Vercel docs deployment `dpl_Dgn15PFd2Qaf4Pd71r5TKHgXugHB` đã READY ở lượt trước. Đây là mốc lịch sử, không phải deployment của L11.
- **L10 QA lịch sử:** 151 focused+legacy PASS, 6 battle/951 action/9718 event/42 hero actors, app-origin errors0. Không tái dùng như bằng chứng L11. Xem evidence L10 trong repo.
- Main docs push có thể tự tạo Vercel production deployment cùng runtime L10. Nhánh WIP có thể tự có preview theo Git integration; không promote nó. Deployment READY riêng lẻ không chứng minh V2 đúng.

## 9. Trình tự Luna tiếp tục

1. Đọc `AGENTS.md`, các tài liệu entrypoint mới trên main, contract L11 và file này; áp dụng **vibe-builder** (code source trực tiếp) + **vibe-lab**. Tiếp tục/ghi run mới nối run đang dở, không đóng giả gate cũ. Có Board thì claim thật; thiếu Board/device tiếp tục phần source/test được owner cho phép, ghi blocker.
2. Checkout nhánh WIP đúng baseline. Chạy lại23 test mới để tái hiện6 fail, ghi evidence mới theo SHA. Sửa sáu handler trước, rồi rà đủ42 bộ kỹ năng theo bảng trên; thêm test cho hành vi thiếu và tương tác có rủi ro.
3. Phân loại16 fail bộ cũ theo yêu cầu V2; giữ test regressions của old roster/save/reward và seeded determinism. Đồng bộ profileVersion/rules/resolver; sau GREEN mới REFACTOR.
4. Khôi phục asset checkout, chạy `npm test`/build đầy đủ. Không chỉ sửa dist, không bỏ gate. Kiểm tra source-to-runtime anchors, battle nhúng và độc lập.
5. Browser QA thực tế: 42 thẻ/126 nút; filter/search/detail/back; tap P/S1/Ult popup; keyboard/Escape/focus; mobile scroll; Nộ/cooldown/cast cập nhật live; restart cùng hero; vào/ra lặp kiểm tra cleanup. QA crop126 vùng + snapshot/console errors. Test mỗi hệ và các interaction mới trong battle. Device/Safari báo riêng.
6. Khi đủ gate mới tích hợp source đúng phạm vi lên main theo quyền owner, kiểm tra Vercel deployment theo SHA, production QA và runtime logs. Cập nhật handoff/progress/execution-plan/brief/changelog/results/machine evidence. Giữ **REVIEW / IN_PROGRESS** tới khi người có thẩm quyền kết luận; không tự DONE/MERGED.

## 10. Nghiệm thu còn mở

| Acceptance L11 | Checkpoint |
| --- | --- |
| P2-A1 — 42 profiles/126 chiêu và dữ liệu tiếng Việt | Data tests đạt; cần kiểm tra đầy đủ nội dung và parity với resolver |
| P2-A2 — tap popup từ 3 ngữ cảnh, accessibility/lifetime | Source có; browser NOT_RUN |
| P2-A3 — artwork/metadata/live overlays | Artwork và provenance có; crop/UI QA còn mở |
| P2-A4 — cơ chế mới có test, cùng version | IN_PROGRESS, 6 fail V2 +84handler audit +16fail bộ cũ |
| P2-A5 — source/build/test/browser/device/evidence/release | Build blocked local asset; browser/device/V2 production chưa chạy |

Checkpoint bàn giao không đóng L04a/L05b hoặc các acceptance lịch sử chưa chạy. L04b đã hoàn tất từ trước, không làm lại chỉ vì có nhánh mới.
