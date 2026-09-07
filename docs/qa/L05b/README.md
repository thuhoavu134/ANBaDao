# L05b — capture ranh giới sub-action combat

Cập nhật: **07/09/2026**. Ticket này chỉ bổ sung quan sát tại build owner; không thay luật combat, seed, phần thưởng, balance, save migration, asset, audio hoặc hotfix âm thanh thoát trận.

## Phạm vi đã làm

- `src/domain/combat/action-observation.mjs` lưu `amount`, `flags` và `rngCursor` cho từng impact, vẫn giữ schema reader cũ `hon-viet-combat-observation/v1`.
- `scripts/combat-domain-3q-adapter-v1.mjs` mở context `actionId`/`subActionIndex`, buffer impact trước khi `resolveAction` ghi action, rồi nối wrapper tại `applyDamage`, `applyHeal`, `addStatus`, `gainEnergy`, `markDefeated`, drain energy và `performAction`.
- `tests/combat-observation.test.mjs` kiểm tra immutability/field mới và marker của đúng build owner. Không sửa `dist/` trực tiếp.

Archive/source mẫu vẫn không truy cập được trong phiên này (`SOURCE_NOT_AVAILABLE`), nên chưa port method archive nào; phần L05b là instrumentation viết/adapt từ source Lục Thần hiện có.

## Kiểm thử source/build

```text
node --check scripts/combat-domain-3q-adapter-v1.mjs  PASS
node --check src/domain/combat/action-observation.mjs PASS
node --test tests/*.mjs                              31/31 pass, 0 fail
```

Đã chạy thêm static build-owner validation trên `battle.html` active: 5 inline script body compile được, marker wrapper/fixture/query forwarding có đủ.

## Chrome production evidence

- Code: [`fbb6f8137c98fcb25a99d308547cc2768de23a06`](https://github.com/bktimmy247/luc-than/commit/fbb6f8137c98fcb25a99d308547cc2768de23a06).
- Deployment: `dpl_FkVnkvQ6QBRzUf5a6rrazvhuw1YN`, **READY**, CI Vercel **success**.
- URL: [`https://luc-than.vercel.app/?qaCombatFixture=l05a`](https://luc-than.vercel.app/?qaCombatFixture=l05a).
- Luồng UI thật: Chinh chiến → Khiêu chiến → Xuất chiến; iframe nhận query `qaCombatFixture=l05a`, encounter Ải 1–2 / Mộng Phố, kết quả hiển thị Hồn Việt khải hoàn, 6 chiến binh còn sống và phe địch 0 chiến binh.
- Report `status=finished`, `rounds=1..7`, `action=51`, `result=141`, `impact=281`; không có console error/warn.

### Invariant đã đối chiếu từ report

| Kiểm tra | Kết quả |
|---|---:|
| Action ID duy nhất | 51/51 |
| Counter khớp số action/result/impact | PASS |
| Impact gắn vào action tồn tại | 281/281 |
| Impact có before/after snapshot | 281/281 |
| `subActionIndex` liên tục từ 0 trong từng action | PASS |
| Action có nhiều impact | 51/51 |
| Histogram số impact/action | 3×13, 4×28, 5×1, 7×1, 8×1, 9×1, 12×1, 13×1, 19×4 |

Impact types thực tế: `energy=158`, `damage=71`, `miss=9`, `status=40`, `death=3`. Action kinds: `stun=6`, `damage=28`, `execute=4`, `guardAll=2`, `aoeBurn=4`, `aoe=5`, `aoeDebuff=2`; action type là `basic=34`, `ultimate=17`. RNG rule sites của damage được liên kết 80 lần cho từng site `applyDamage.hit`, `applyDamage.variance`, `applyDamage.crit`; giá trị RNG vẫn chưa được capture.

Một action Ultimate đã ghi 19 impact với index `0..18`, chứng minh context được giữ qua chuỗi multi-hit; thứ tự hiện là raw call-boundary của engine, chưa phải semantic event canonical.

## Chưa thể đánh dấu DONE

Report vẫn giữ các gap:

- `resolve-action-final-snapshot`: snapshot action hiện chụp ở `resolveAction.finally`.
- `per-impact-boundary-missing`: direct status removal/DoT tick và actor energy-cost assignment chưa đi qua wrapper; heal/DoT/đòn Ông Phở hai nhịp chưa có fixture riêng.
- `rng-value-not-captured`: mới biết rule call site, chưa lưu giá trị/cursor seeded tách presentation RNG.

Chưa có bằng chứng trận đủ 15 hiệp, speed/replay parity hoặc Safari/iPhone/iPad. Bước kế tiếp là L05c: tách seeded RNG luật khỏi presentation, sau đó bổ sung fixture/case cho heal, DoT tick, chase/two-hit, round cap và replay parity.
