# L05a — fixture quan sát combat

Trạng thái: **IN_PROGRESS**. Fixture đã được nối vào build owner và đã thu
được một trận thật trên Chrome production với trạng thái `finished`; chưa đánh
dấu DONE vì các case heal, DoT tick riêng, combo nhiều impact và round cap 15
chưa được engine capture riêng, đồng thời chưa có Safari/device evidence.

## Phạm vi đã làm

- Thêm pure contract `src/domain/combat/action-observation.mjs` với schema
  `hon-viet-combat-observation/v1`: session/seed/mode/round cap, action sequence,
  snapshot `before`/`after`, typed result, RNG site và known gaps.
- `scripts/combat-domain-3q-adapter-v1.mjs` là build owner: bundle observer vào
  `battle.html`, record tại `resolveAction.finally`, expose report ẩn cho QA và
  chỉ tự bật khi URL có query allowlist `qaCombatFixture=l05a`. Shell production
  chỉ forward đúng query này; source `index.html` không bị đổi.
- Fixture tự đóng trong `endBattle`, nên report kết thúc là `finished` và không
  còn mở sau khi UI đã vào màn kết quả.
- Giữ scheduler, combat rule, settlement, seed, reward, balance, save migration,
  asset, audio và hotfix âm thanh thoát trận. Không đưa archive Hermes vào runtime;
  archive/source mẫu không khả dụng trong phiên này, nên phần port từ archive là
  `SOURCE_NOT_AVAILABLE`; contract observer là phần viết/adapt trong repo hiện tại.

## Test chạy thật

```text
node --check scripts/combat-domain-3q-adapter-v1.mjs
node --test tests/*.mjs
sha256sum index.html
```

Kết quả: **31/31 pass, 0 fail**; hash source shell vẫn là
`e4f79d41e3bf7bb225ff878729d71e72be9ad94bac962f5e41cffc98148680b9`.

## Chrome production fixture

- Deployment `dpl_BimpTPBQCkrNkg6JYhVDyUhHqEgZ` từ commit
  `d1c10ce00b5c1ad0b8589a9bb650f932bddb231b` đạt **READY**; CI Vercel báo
  `success`. Build log xác nhận patch combat 3Q, hotfix close audio và embedded
  battle `918363 bytes`.
- URL kiểm thử: `https://luc-than.vercel.app/?qaCombatFixture=l05a`.
  Thao tác UI: Chinh chiến → Khiêu chiến → Xuất chiến; sau đó tăng tốc trong
  iframe từ ×1 lên ×3 để hoàn tất tự nhiên. Iframe thực sự nhận
  `battle.html?...&qaCombatFixture=l05a`.
- Encounter thật là Ải 1–2 / Mộng Phố: 6 chiến binh đấu 3 địch. Report cuối:
  `status=finished`, 8 hiệp, 51 action, 125 typed result, `impactCount=0`;
  UI kết quả đồng thời hiển thị phe ta `6/6`, phe địch `0/3`, `Hạng S`.
- Action kinds đã quan sát: `stun` 6, `damage` 28, `guardAll` 2,
  `aoeBurn` 3, `aoe` 6, `aoeDebuff` 2, `execute` 4.
- Result types đã quan sát: `damage` 49, `miss` 10, `buffAdd` 36,
  `barrier` 28, `death` 2.
- RNG site đã biết và ghi trên action: `applyDamage.hit`,
  `applyDamage.variance`, `applyDamage.crit`, `burst.angle`, `burst.speed`,
  `burst.life`, `burst.size`, `burst.spin`. Giá trị RNG vẫn chưa capture;
  target selector hiện hành dùng hash deterministic thay vì `Math.random`.

## Gap còn mở

Report giữ nguyên ba gap có mã: `resolve-action-final-snapshot`,
`per-impact-boundary-missing` tại `applyDamage/applyHeal/status/energy`, và
`rng-value-not-captured` tại inline `Math.random`. Trận production có `aoeBurn`
và status trong snapshot nhưng chưa chứng minh một DoT tick là result riêng;
không có heal, combo hai nhịp/đuổi đánh với `subActionIndex`, hoặc trận đủ 15
hiệp. Vì vậy unit fixture synthetic không được dùng thay cho engine evidence.

Các lần bấm encounter QA đã tiêu thể lực/nhận reward theo gameplay hiện hành;
đó là tác động của thao tác kiểm thử, không phải thay đổi source seed/balance/
reward/save. Không lưu snapshot đầy đủ hay save người chơi vào repo.

Commit code: `d1c10ce00b5c1ad0b8589a9bb650f932bddb231b`.
