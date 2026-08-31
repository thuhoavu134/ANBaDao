# Đình Lôi Golden Runtime v3.25.1

## Asset contract

14 source GIFs are converted to deterministic 8×8 PNG alpha atlases at 64 frames / 4 seconds. The runtime does not depend on browser GIF playback. Green-screen cleanup uses a per-pixel adaptive green-dominance matte, multiplies the source alpha, despills only semi-transparent edge pixels, and feathers only the alpha channel. Character, projectile, impact and shield remain separate layers.

## Runtime sequence

- Basic — Khiên Đồng Trấn Kích: home anchor → run to target-side release position → character cast → projectile → impact/damage → run home.
- Talent Skill — Hồi Văn Hộ Trận: stationary cast → target-aware wave to the lowest-HP ally → impact → animated shield on that ally and Đình Lôi → one counter-ready state.
- Ultimate — Đông Sơn Lôi Trận: stationary cast → battlefield VFX → main impact → 28% max-HP shield and one counter-ready state for every living ally, plus shock damage to every living enemy.
- Hit is an authored in-place reaction. Fall is an authored four-second defeat animation.

## QA surface

`window.__honVietBattleRuntime` exposes:

- `getDinhLoiAssets()`
- `qaForceDinhLoiAction(action)`
- `qaRunDinhLoiShowcase()`
- `qaPreviewDinhLoiHit()`
- `qaPreviewDinhLoiFall()`

The showcase runs Basic → Talent Skill → Ultimate in one existing 6v6 encounter and returns before/after HP and shield data.

## Verification status

- Static/runtime contract tests: PASS.
- Production build: PASS.
- Alpha inspection on black, white, checkerboard and battle-tone backgrounds: PASS for all 14 atlases.
- Live browser combat capture: UNVERIFIED in the current runner because the cloud browser blocks the local `127.0.0.1` preview.
