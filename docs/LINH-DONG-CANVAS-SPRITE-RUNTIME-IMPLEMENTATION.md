# Implementation Spec: Canvas Sprite Runtime cho game không dùng Spine

**Mục đích:** tài liệu handoff cho coding agent triển khai hệ thống asset animation nhẹ, sắc nét và mở rộng được tới 72 tướng, trong khi vẫn giữ Canvas + `drawImage()` hiện tại.

**Ngày:** 2026-09-15  
**Baseline tham chiếu:** `bktimmy247/luc-than` · `main@7b2ca7f`  
**Phạm vi:** asset/runtime layer, không thay gameplay/domain semantics.

---

## 1. Vấn đề cần giải quyết

Game hiện dùng Canvas sprite atlas nhưng asset/runtime contract còn phân tán:

- Một số cell-size bị hard-code ở nhiều file.
- Atlas được decode thành RGBA raw; dung lượng RAM lớn hơn nhiều so với byte WebP trên đĩa.
- Nếu load toàn bộ animation của 72 tướng cùng lúc, APK và RAM sẽ phình không cần thiết.
- Asset master Blender bị nhầm với runtime asset.
- Pipeline cũ từng lấy Blender Viewer Node 256×256 rồi upscale, tạo hình nhoè.
- Asset lossless toàn bộ frame cho một tướng có thể đã khoảng 70 MB compressed và khoảng 80 MB decoded cho idle atlas.
- Runtime cần hỗ trợ loading/eviction mà không làm màn hình nhấp nháy hoặc đổi pivot.

### Quality bar

Mục tiêu là cảm giác rõ nét như một hero render lớn: mặt, tóc, vải, vũ khí và silhouette phải còn đọc được ở kích thước gameplay. Không được đánh đổi bằng cách nhồi master 1920px vào APK hoặc load cả roster vào RAM.

### Nguyên tắc bắt buộc

1. **Không dùng Spine.** Runtime là Canvas 2D + `drawImage()`.
2. **Không rewrite gameplay.** Không đổi damage, initiative, AI, skill effect, reward, persistence.
3. **Master ≠ runtime.** Blender/PNG master chỉ là input/archive; APK dùng delivery atlas đã build.
4. **Manifest-driven.** Renderer không tự đo atlas bằng `naturalWidth / 4` hoặc đoán số hàng.
5. **Một loader/cache dùng chung.** Hero mới chỉ thêm manifest + asset + test.
6. **Lazy-load.** Chỉ tải asset của màn hình/đội hình/action đang cần.
7. **Decoded-memory budget.** Tính budget bằng `atlasWidth × atlasHeight × 4`, không dùng compressed bytes.
8. **Stable pivot/crop.** Không recenter từng frame; dùng stable union crop và pivot bottom-center.
9. **Không dùng Viewer Node.** Blender output phải đi qua Composite/Group Output ở resolution thật.
10. **Mọi thay đổi phải có evidence.** Test, build, browser screenshot và memory report.

---

## 2. Kiến trúc mục tiêu

```text
Blender master scene/video
        │
        ▼
Blender compositor → PNG RGBA master frames (source resolution)
        │
        ▼
Asset build tool: stable crop + pivot + atlas pack + WebP/KTX2 delivery
        │
        ▼
manifest.json + runtime assets + checksums + decodedBytes
        │
        ▼
AssetCatalog → AssetLoader → DecodedAtlasCache
        │                  │
        │                  └── load/evict/error/loading state
        ▼
FrameClock / ActionClock
        │
        ▼
CanvasSpriteRenderer.draw(ctx, clip, pose, transform)
        │
        ├── roster/hero detail
        ├── campaign scene
        └── battle scene
```

### Ownership boundaries

| Layer | Owns | Không được sở hữu |
|---|---|---|
| Asset source | Blender scene/video, render settings | Gameplay state |
| Asset build | crop, pivot, atlas, metadata, checksum | Canvas DOM/runtime state |
| `AssetCatalog` | resolve hero/state/action/quality | Network fetch trực tiếp |
| `AssetLoader` | fetch/decode một asset | Chọn target/damage |
| `DecodedAtlasCache` | byte budget, LRU, release | Hero combat logic |
| `FrameClock` | elapsed time/frame index | DOM or combat mutation |
| `CanvasSpriteRenderer` | draw source rect → destination rect | Damage/status/turn logic |
| Battle/campaign adapter | gọi `ensure()` và `draw()` | Tự parse atlas layout |

---

## 3. Data contract: manifest

Mỗi hero có một manifest ổn định. Có thể đặt tại `assets/characters/<hero-id>/runtime-meta.json` hoặc gom vào `assets/runtime/manifest.json`, nhưng chỉ chọn **một nguồn canonical**.

### 3.1 Schema tối thiểu

```json
{
  "schema": "canvas-sprite-runtime/v2",
  "heroId": "hero_splus_linh_dong",
  "aliases": ["linh_dong", "linh-dong"],
  "quality": {
    "desktop": "native",
    "mobile": "mobile"
  },
  "clips": {
    "idle": {
      "file": "idle-atlas.webp",
      "kind": "character",
      "frames": 96,
      "cols": 8,
      "rows": 12,
      "cellW": 480,
      "cellH": 440,
      "fps": 24,
      "durationMs": 4000,
      "loop": true,
      "pivot": { "x": 240, "y": 440 },
      "logicalSize": { "w": 480, "h": 440 },
      "trimMode": "stable-union",
      "decodedBytes": 81100800,
      "sha256": "..."
    },
    "attack": {
      "file": "basic-atlas.webp",
      "kind": "character",
      "frames": 44,
      "cols": 8,
      "rows": 6,
      "cellW": 480,
      "cellH": 440,
      "fps": 30,
      "durationMs": 1500,
      "loop": false,
      "pivot": { "x": 240, "y": 440 },
      "logicalSize": { "w": 480, "h": 440 },
      "trimMode": "stable-union",
      "decodedBytes": 40550400,
      "sha256": "..."
    },
    "ultimateVfx": {
      "file": "ultimate_vfx-atlas.webp",
      "kind": "vfx",
      "frames": 120,
      "cols": 10,
      "rows": 12,
      "cellW": 440,
      "cellH": 248,
      "fps": 30,
      "durationMs": 4000,
      "loop": false,
      "pivot": { "x": 220, "y": 248 },
      "logicalSize": { "w": 440, "h": 248 },
      "trimMode": "stable-union",
      "blendMode": "source-over",
      "decodedBytes": 52377600,
      "sha256": "..."
    }
  }
}
```

> Các số trên là ví dụ theo bản Linh Đồng native-size hiện tại; coding agent phải lấy `decodedBytes` theo đúng atlas thực tế, không copy mù.

### 3.2 State/action canonical

Canonical keys:

- Character state: `idle`, `run`, `hurt`, `defeated`.
- Action: `attack`, `ultimate`.
- VFX: `skill1Vfx`, `ultimateVfx` hoặc tên action tương ứng.
- Alias legacy: `basic`, `normal`, `skill`, `skill1` → `attack`; `ult` → `ultimate`.

Không tạo `projectile`/`impact` riêng nếu asset contract đã là combined VFX. Một action có thể có:

```text
character clip + combined vfx clip + sfx + timing markers
```

### 3.3 Validation

Manifest validator phải reject:

- `frames <= 0`, `cols <= 0`, `rows` không đủ chứa frame.
- `cellW/cellH` không phải integer dương.
- `atlasWidth !== cols × cellW`.
- `atlasHeight !== rows × cellH`.
- thiếu `file`, `sha256`, `decodedBytes`, `pivot`, `timing`.
- frame count vượt layout.
- alias đụng hero khác.
- `decodedBytes` sai công thức.
- per-frame crop nếu renderer chưa hỗ trợ frame rect/pivot riêng.

---

## 4. Asset build pipeline

### 4.1 Blender master render

Input có thể là Blender scene hoặc video source được đưa vào Blender compositor. Bắt buộc:

- Render engine và scene resolution đúng source/master, không dùng Viewer preview.
- Blender 5.x compositor group phải có explicit `NodeGroupOutput` socket.
- Lưu PNG `RGBA`, `resolution_percentage=100`.
- Keying `Preprocess Blur Size=0`, `Postprocess Blur Size=0`, `Feather Size=0` trừ khi QA chứng minh cần khác.
- Despill chỉ dùng để loại màu nền, không blur silhouette.
- Không crop theo từng frame.
- Ghi lại Blender version, scene/source, key color, frame range, fps.

### 4.2 Stable union crop

Với mỗi clip:

1. Đọc alpha của toàn bộ frame master.
2. Dùng threshold QA thấp để loại matte noise khi tính bbox, ví dụ alpha `>= 16/255`.
3. Lấy union bbox của tất cả frame.
4. Thêm padding cố định.
5. Giữ cùng crop box cho mọi frame trong clip.
6. Fit vào logical canvas/cell bằng Lanczos hoặc resampling chất lượng cao.
7. Đặt pivot bottom-center; không recenter theo silhouette từng frame.
8. Với VFX, giữ toàn bộ glow hợp lệ; không threshold cứng làm mất vệt sáng ở mép.

### 4.3 Runtime tiers

Tối thiểu nên có:

| Tier | Dùng cho | Character cell gợi ý | Mục tiêu |
|---|---|---:|---|
| `mobile` | máy yếu/viewport nhỏ | 320×294 hoặc 360×330 | nhẹ RAM/download |
| `native` | desktop/tablet | 480×440 | không upscale ở battle |
| `heroDetail` | màn chi tiết | 640×587 hoặc portrait riêng | ưu tiên nhìn đẹp |
| `master` | archive/QA | 1920×1080 PNG | không đưa vào APK |

Tất cả tier phải dùng cùng timing/pivot semantics. Không được tạo tier bằng cách crop lại ngẫu nhiên làm chân nhảy.

### 4.4 Encoding

- Battle runtime: WebP quality cao hoặc KTX2/Basis nếu target WebGL/GPU pipeline hỗ trợ.
- Master: PNG RGBA/EXR tùy pipeline, không dùng runtime.
- Lossless chỉ dùng khi quality bar thật sự cần và memory budget cho phép.
- Không lấy `Viewer Node` làm input.
- Không upscale source 256px.
- Ghi `compressedBytes` và `decodedBytes` riêng.

---

## 5. Module design

### 5.1 `AssetCatalog`

Đề xuất file: `src/assets/asset-catalog.mjs`.

API:

```js
export function normalizeHeroId(value) {}
export function normalizeClipKey(value) {}
export function getHeroManifest(heroId, quality = 'native') {}
export function getClip(heroId, clipKey, quality = 'native') {}
export function validateManifest(manifest) {}
```

Yêu cầu:

- Pure/read-only.
- Normalize alias trước lookup.
- Không tạo `Image`.
- Không đọc DOM.
- Trả `null` cho hero/clip không tồn tại.
- Không để battle/index tự khai báo registry duplicate.

### 5.2 `AssetLoader`

Đề xuất file: `src/assets/asset-loader.mjs`.

API:

```js
const handle = loader.ensure(clip, { priority: 'visible' });
handle.state;       // idle | loading | ready | failed
handle.image;       // HTMLImageElement | ImageBitmap | null
handle.promise;      // resolve ready / reject failed
loader.release(key);
loader.clearScope('battle');
```

Yêu cầu:

- Dedupe request cùng URL.
- Không retry mỗi animation frame.
- Retry có backoff hoặc explicit retry.
- Validate `naturalWidth/naturalHeight` sau load bằng manifest atlas dimensions.
- Không tạo `new Image()` trong render loop.
- Không load action atlas khi chỉ đang idle.

### 5.3 `DecodedAtlasCache`

Đề xuất file: `src/assets/decoded-atlas-cache.mjs`.

```js
const cache = createDecodedAtlasCache({
  maxBytes: 128 * 1024 * 1024,
  maxLoading: 2
});
```

Yêu cầu:

- LRU theo scope/priority.
- Reserve bytes trước khi load.
- Không evict entry đang `loading`.
- `release()` phải gỡ `onload/onerror`, clear `src` nếu là `HTMLImageElement`.
- `inspect()` trả `bytes`, `maxBytes`, `loading`, `entries`, `failed`.
- Nếu atlas không vừa budget, trả lỗi rõ ràng và dùng fallback tier nhỏ hơn; không crash render.
- Log một lần cho từng lỗi URL/dimension/budget.

Công thức:

```js
const decodedBytes = atlasWidth * atlasHeight * 4;
const atlasWidth = clip.cols * clip.cellW;
const atlasHeight = clip.rows * clip.cellH;
```

Không dùng compressed file size để quyết định RAM.

### 5.4 `FrameClock`

Đề xuất file: `src/assets/frame-clock.mjs`.

```js
const clock = createFrameClock({ now: performance.now });
const frame = clock.frameAt(clip, elapsedMs);
```

Yêu cầu:

- Một monotonic elapsed clock cho mỗi action/VFX timeline.
- `loop=true`: modulo duration.
- `loop=false`: clamp frame cuối.
- Không dùng `Date.now()` trộn với `performance.now()` trong cùng timeline.
- Replay cùng `elapsedMs` phải cho cùng frame/marker.
- Clock không mutate combat state.

### 5.5 `CanvasSpriteRenderer`

Đề xuất file: `src/render/canvas-sprite-renderer.mjs`.

API:

```js
renderer.draw(ctx, {
  image,
  clip,
  frame,
  x,
  y,
  width,
  height,
  flip: false,
  alpha: 1,
  blendMode: 'source-over',
  baseline: clip.pivot.y
});
```

Implementation bắt buộc:

```js
const sx = (frame % clip.cols) * clip.cellW;
const sy = Math.floor(frame / clip.cols) * clip.cellH;
ctx.save();
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
if (flip) ctx.scale(-1, 1);
ctx.globalAlpha = alpha;
ctx.globalCompositeOperation = blendMode;
ctx.drawImage(
  image,
  sx, sy, clip.cellW, clip.cellH,
  -width / 2, -height + baseline,
  width, height
);
ctx.restore();
```

Không được:

- hard-code `347`, `320`, `694`, `640` trong renderer;
- tính cell bằng `naturalWidth / 4`;
- gọi `new Image()` hoặc `fetch()` trong `draw()`;
- đổi destination width/height theo `naturalWidth` một cách tùy ý;
- áp dụng `imageSmoothingEnabled=false` toàn cục để che blur;
- dùng `screen` cho VFX nếu manifest yêu cầu `source-over`.

---

## 6. Lifecycle và loading policy

### 6.1 Roster/hero detail

- Roster card: dùng portrait/card tĩnh hoặc mobile tier nhỏ.
- Khi mở hero detail: `ensure(idle, { priority: 'visible' })`.
- Khi rời hero detail: `releaseScope('hero-detail')`.
- Không prefetch cả 72 hero nếu người dùng chỉ xem một hero.

### 6.2 Campaign

- Chỉ load idle/run cho 6 hero đang nằm trong scene.
- Attack clip chỉ load khi farm actor sắp tấn công.
- Khi action xong, giữ ngắn trong LRU; evict khi scope đổi hoặc budget đầy.
- Dùng cùng `pivot` và `logicalSize` để chân không nhảy.

### 6.3 Battle

- Khi battle boot: load idle cho hero đang visible, tối đa `maxLoading=2`.
- Khi action bắt đầu: preload character action + combined VFX theo priority.
- Action phải có loading fallback: tiếp tục idle hoặc hold frame; không vẽ atlas chưa ready.
- Khi battle kết thúc: clear battle scope sau khi result transition dùng xong.
- VFX Ultimate không được giữ trong cache nếu đã hết action và budget cần cho hero khác.

### 6.4 Quality fallback

```text
native unavailable/budget full
        ↓
mobile tier
        ↓
static portrait/placeholder có cùng pivot
```

Fallback phải quan sát được trong QA, không im lặng đổi sang hero khác.

---

## 7. Memory/download budget cho 72 tướng

### Không nhân bản sai

Không lấy `69.7 MB × 72` làm target APK bắt buộc. Con số đó là bộ Linh Đồng lossless/native đầy đủ. Production phải:

- tách master và runtime;
- giảm frame/dimensions hợp lý theo gameplay footprint;
- lazy-load theo scene/action;
- dùng asset pack/streaming nếu APK quá lớn;
- chỉ giữ vài atlas decoded trong RAM;
- có mobile tier;
- dùng shared renderer/cache, không shared visual nếu làm mất nhận dạng.

### Gate đề xuất

| Gate | Desktop | Mobile |
|---|---:|---:|
| Initial JS + shell không có animation atlas | pass | pass |
| Idle atlas visible cùng lúc | ≤ 2 | ≤ 1–2 |
| Decoded cache | ≤ 128–192 MiB | ≤ 96–128 MiB |
| Loading request đồng thời | ≤ 2 | ≤ 1–2 |
| Atlas load retry/frame | 0 | 0 |
| Frame crop/pivot drift | 0 px logical | 0 px logical |
| Empty frame do lazy load | chỉ fallback có chủ đích | chỉ fallback có chủ đích |

Các số phải đo theo atlas thực tế; không đánh dấu pass chỉ vì compressed WebP nhỏ.

---

## 8. Migration plan

### Phase A — Contract và catalog

1. Freeze baseline test/build.
2. Tạo schema validator.
3. Di chuyển Linh Đồng registry vào catalog canonical.
4. Giữ adapter alias cho code cũ.
5. Thêm test manifest/dimensions/hash.

**Exit:** catalog resolve được Linh Đồng và ít nhất 2 hero cũ mà không tạo `Image`.

### Phase B — Cache/loader

1. Tách loader khỏi battle/index.
2. Implement dedupe/loading/error/eviction.
3. Thêm decoded byte budget.
4. Chỉ migrate một hero pilot: Linh Đồng.
5. Chạy memory harness.

**Exit:** Linh Đồng boot không eager-load tất cả clip; budget test pass; no retry loop.

### Phase C — Renderer

1. Renderer nhận clip metadata, không nhận magic numbers.
2. Giữ destination footprint hiện tại.
3. So sánh screenshot trước/sau ở DPR 1, 2, 3.
4. Kiểm tra flip, baseline, VFX blend.

**Exit:** Linh Đồng render native-size, không crop sai, không blur do upscale cell nhỏ.

### Phase D — Screen lifecycle

1. Migrate roster/hero detail.
2. Migrate campaign.
3. Migrate battle.
4. Clear scope đúng route.
5. Add mobile fallback.

**Exit:** vào/rời mỗi màn không giữ atlas thừa; browser memory report nằm trong gate.

### Phase E — Rollout 72 heroes

1. Migrate từng archetype/hero theo manifest.
2. Không đổi gameplay contract.
3. Mỗi batch có test + screenshot + memory report.
4. Chỉ bật hero khi manifest/asset QA pass.

**Exit:** mọi hero selectable có manifest hợp lệ; không có duplicate loader/registry.

---

## 9. File touchpoints trong repo hiện tại

Coding agent phải kiểm tra đường dẫn thực tế trước khi sửa, nhưng baseline hiện có các điểm sau:

### Runtime/source

- `battle.html` — battle canvas/legacy presentation; phải giảm hard-code và gọi renderer/catalog.
- `index.html` — hero detail/campaign embedded runtime; không duplicate manifest.
- `src/domain/character/linh-dong.mjs` — canonical metadata/pivot/timing adapter.
- `src/domain/character/atlas-image-cache.mjs` — decoded budget/lazy cache hiện có.
- `src/ui/campaign-scene.js` — sprite specs/pivot/cell dimensions.
- `src/combat-domain/linh-dong-presentation.mjs` — action clock/marker contract.
- `scripts/linh-dong-timing-main-v1.mjs` — build-time runtime bridge.
- `scripts/build-static.mjs` — copy/build/fingerprint pipeline.
- `assets/characters/linh-dong/runtime-meta.json` — runtime asset metadata.
- `assets/characters/<hero>/...` — per-hero delivery.

### Tests

- `tests/linh-dong-atlas.test.mjs`
- `tests/linh-dong-battle-scale.test.mjs`
- `tests/linh-dong-memory.test.mjs`
- `tests/linh-dong-presentation.test.mjs`
- `tests/linh-dong-static.test.mjs`
- `tests/linh-dong-rekey.test.mjs`
- Add `tests/asset-catalog.test.mjs`
- Add `tests/asset-loader.test.mjs`
- Add `tests/decoded-atlas-cache.test.mjs`
- Add `tests/canvas-sprite-renderer.test.mjs`

### Build evidence

- `dist/assets/characters/<hero>/static-fingerprint.json`
- Build log with asset bytes + decoded bytes.
- Browser screenshot at desktop/mobile.
- Console/network evidence.
- `git diff --check`.

---

## 10. Test matrix

### Unit

- alias normalization;
- unknown hero/clip returns null;
- manifest schema validation;
- atlas dimensions match `cols × cellW` and `rows × cellH`;
- frame index first/middle/last/loop/clamp;
- stable pivot values;
- decoded byte formula;
- cache LRU and eviction;
- loading dedupe;
- error does not retry every frame;
- stale callback after release is harmless;
- renderer source rect for first/middle/last frame;
- renderer destination aspect ratio;
- enemy flip and `source-over` blend;
- timing replay determinism.

### Integration

- battle boots with no action atlas eager load;
- idle load for visible heroes only;
- ATK load occurs when action begins;
- Ultimate VFX load occurs once;
- action completion releases transient assets;
- route exit clears scope;
- mobile tier selected by viewport/device policy;
- existing hero fallback still renders;
- combat result numbers/statuses unchanged.

### Browser QA

At least:

- desktop DPR 1;
- desktop DPR 2;
- mobile viewport 390×844;
- roster → hero detail → back;
- campaign scene with six heroes;
- battle idle → ATK → Ultimate → result;
- cold cache and warm cache;
- throttled network;
- console has no asset errors;
- no repeated failed requests;
- screenshot shows sharp silhouette and stable feet.

### Performance QA

Record:

```text
compressedBytes per clip
atlasWidth × atlasHeight
decodedBytes per clip
cache bytes peak
cache entry count peak
concurrent loads peak
first visible frame latency
number of fallback frames
```

Do not report “small APK” without reporting decoded RAM separately.

---

## 11. Rollout/rollback

### Rollout

1. Create one feature branch.
2. Commit catalog/cache/renderer separately from hero migration where practical.
3. Attach test/build/screenshot evidence to PR.
4. Deploy preview.
5. Verify asset fingerprint in preview.
6. Only then merge production.

### Rollback

- Keep previous asset hashes in manifest/backup.
- Roll back one commit for runtime code.
- Roll back asset-only commit without deleting source/master.
- Never force-push.
- If high-res cache causes mobile pressure, switch manifest quality tier first; do not delete master.

---

## 12. Definition of Done

A coding agent may claim this task complete only when all are true:

- [ ] No Spine dependency introduced.
- [ ] No combat/domain semantics changed.
- [ ] Renderer no longer hard-codes hero-specific cell sizes.
- [ ] Asset catalog/manifest is canonical and validates.
- [ ] Loader dedupes and cache evicts under measured decoded budget.
- [ ] Linh Đồng uses source generated from Blender master, not Viewer 256px output.
- [ ] Runtime uses appropriate cell dimensions and fixed pivot.
- [ ] Idle/action/VFX loading policy is lazy and scoped.
- [ ] Existing heroes still render.
- [ ] Unit/integration tests pass.
- [ ] Build generates dist and fingerprints.
- [ ] Browser desktop/mobile smoke passes.
- [ ] Peak decoded RAM is recorded.
- [ ] ZIP/APK compressed size is recorded separately.
- [ ] Diff contains no unrelated gameplay changes.
- [ ] Rollback hash is recorded.

---

## 13. Copy-paste brief giao cho coding agent

> Implement the Canvas Sprite Runtime described in `LINH-DONG-CANVAS-SPRITE-RUNTIME-IMPLEMENTATION.md`.
>
> Work from the latest `main`. Do not introduce Spine and do not rewrite gameplay. First inspect the existing catalog, battle/index renderers, `atlas-image-cache`, build scripts and Linh Đồng tests. Then implement a manifest-driven `AssetCatalog`, lazy `AssetLoader`, decoded-byte LRU cache and metadata-driven Canvas renderer. The renderer must receive `cellW`, `cellH`, `cols`, `rows`, `frames`, `pivot`, `logicalSize` and timing from manifest; never divide `naturalWidth` by a guessed number and never create images in the draw loop.
>
> Migrate Linh Đồng first using the Blender-generated runtime atlases. Use native-size cells that fit the measured memory budget; keep gameplay destination footprint unchanged so source is downscaled, not upscaled. Load idle only for visible heroes; load ATK/Ultimate/VFX on demand; release route/action scopes. Keep aliases and timing/replay behavior stable. Preserve combined VFX and `source-over` semantics where required.
>
> Add tests for manifest validation, alias lookup, dimensions, decoded bytes, lazy loading, dedupe, LRU eviction, failed-load behavior, stale callbacks, frame rects, pivot/aspect and clock determinism. Run targeted tests, full test, build, static fingerprint smoke and browser QA at desktop/mobile. Report compressed bytes, decoded bytes, cache peak, concurrency, screenshot evidence and exact files changed. Do not modify damage, initiative, AI, rewards, persistence or unrelated UI. Do not claim done if build/CI/browser evidence is missing.

---

## 14. Current Linh Đồng decision record

- Master Blender render: 1920×1080 RGBA.
- Old bad path: Viewer Node 256×256 → upscale blur.
- High-res 2× candidate: 694×640 character / 640×360 VFX; visually strong but too expensive decoded.
- Chosen native runtime candidate: 480×440 character / 440×248 VFX; keeps display footprint and avoids the old upscale bottleneck.
- Runtime cache: 128 MiB cap after measuring idle + action/VFX decoded cost.
- Current production main after integration: `7b2ca7f`.
- This document is a plan/spec only; future agents must re-measure after changing the asset set.
