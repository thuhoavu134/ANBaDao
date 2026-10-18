# Bé An — integration review, 18 October 2026

Base: `45cdecb553cabc0a5b53ad3a3ef8f7a07aba572e`, branch `feat/be-an-authored-20261018`.
Canonical ID `hero_splus_be_an`; host/save key `be_an`; alias `be-an`.
Status: source implementation and asset choreography REVIEW. Not merged, deployed, or certified in the full game.

## Source and conversion

Owner supplied four ZIP packs, then nine original MP4s. The original videos are authoritative for this import. All nine are 1920×1080, 24 fps. Six body clips and special have 96 frames each; two projectile clips have 144 each. File names and SHA-256 are in `assets/characters/be-an/runtime-meta.json`. Source videos remain in the owner's uploaded files; no replacement identity was generated.

`scripts/be-an-convert.py` keys green, neutralizes green spill, removes the disconnected lower-right watermark, applies one fixed registration per clip, and exports 24-frame WebP pages. Released detached seals are removed from Basic/Ultimate body cells starting at source frames 43/76: the projectile layer owns the thrown seal. Hat decoration stays attached. The special clip contains the girl and replaces the normal body, avoiding a duplicate girl.

The shield is `SKILLPACK/vfx/cuiyan/cy_50_bhcs_a`, 25 original PNG frames at 60 ms, from `KIEMTHE-VFX-SFX-FULL-20261017.zip`. Original offsets are retained on a padded canvas; screen blending retains the source black glow pixels. It is derived from live shield state, not an arbitrary visual timeout. Source archive hash/info are in metadata.

Rebuild with Python NumPy/SciPy/Pillow, ffmpeg and the repo's Sharp:

```sh
python3 scripts/be-an-convert.py /path/to/nine-videos
python3 scripts/be-an-finalize.py /path/to/KIEMTHE-VFX-SFX-FULL-20261017.zip
node scripts/qa-be-an-render.mjs /path/to/temporary-frames
```

Runtime audio is AAC/M4A, derived from the actual video's audio through the shared audio bus. Converter WAVs are intermediates, not shipped assets. Basic uses a 4× source-time compression; Ultimate audio uses the same three source segments as its VFX. Playback speed then follows the action's captured x1/x2/x3 rate. Mid-action speed changes take effect next action (snapshot contract).

## Kit and timing

- Basic: two 70% ATK hits, one seal mark on the final landed hit; 15 rage once per action. Four basics from zero enable the 60-rage Ultimate.
- Ultimate: three 100% ATK AoE hits; each adds a mark. Final hit includes +40% ATK per mark and 40% armor penetration, consumes marks, freezes targets reaching three marks for one turn. Marks max three and expire through the common two-turn status owner.
- Passive: once per damaging incoming enemy action, gain one Dỗi. At three, counter for 180% ATK, apply a mark and gain a 15% max-HP shield. Secondary counter damage cannot recursively trigger another counter.
- Special: one lethal prevention per battle; 35% max HP, cleanse, full rage and control immunity through the next completed turn. No automatic extra turn.

Basic source release is frame 43 / 1791.67 ms. Contacts are 2104.17 and 2947.92 ms; recovery is 4000 ms. Ultimate release is frame 76 / 3166.67 ms. Three contacts are 3802.38, 4412.82 and 5212.82 ms; recovery is 6650 ms. All runtime hit markers read the shared metadata. The source giant-seal movie contains one slam: its rise/contact/rebound section is reused three times. The source girl does not contain the prompt's three command gestures; the empty-hand pose is held during the sequence and an authored reverse throw segment restores the held seal. This choreography needs full-game visual review; do not describe it as three newly authored gestures.

## Integration matrix

| Surface | Status and evidence |
|---|---|
| Tướng / Đồ Giám / detail | ĐÃ KIỂM — source/unit: catalog, shared skill payload, host registration and animated detail installer. Browser CHƯA KIỂM. Open-eyed idle frame 0 is the avatar; portrait landmarks use the shared standard. |
| Bày trận / saved team | ĐÃ KIỂM — source/unit: one-time ownership migration preserves existing heroes, gold and squad. Idle descriptor registered. Browser CHƯA KIỂM. |
| AFK / campaign | ĐÃ KIỂM — source composition: Idle/Run/Basic descriptors, full 96-frame campaign derivatives. Live transitions CHƯA KIỂM. |
| Battle | ĐÃ KIỂM — domain and production-runtime VM tests, exact contacts and totals at x1/x2/x3, cancellation. Full game BỊ CHẶN. |
| Victory | ĐÃ KIỂM — unit: shared result owner resolves all paged Run/Idle frames and aliases. Full Run→Idle scene/cache behavior CHƯA KIỂM. |
| Defeat | ĐÃ KIỂM — source/unit: real Fall pages, last-frame clamp and authored hide duration. Result interaction CHƯA KIỂM. |
| VFX | ĐÃ KIỂM — offline production-renderer asset fixture: foreground contact, three reused slam sections, special body replacement. Full 6v6 readability CHƯA KIỂM. |
| SFX | ĐÃ KIỂM — encoded tracks and runtime cue calls/speed. Real device listening, unlock/mute/interrupt CHƯA KIỂM. |
| Skill / HUD | ĐÃ KIỂM — domain tests: rage, marks, shield, lethal prevention, duplicate marker rejection. Paw icon and stack wiring present; browser CHƯA KIỂM. |
| Both teams | ĐÃ KIỂM — VM mirror once and offline character fixture. All formation positions CHƯA KIỂM. |
| Clock / lifecycle | ĐÃ KIỂM — action snapshot x1/x2/x3 and new-battle cancellation. Full skip/reset/audio lifecycle CHƯA KIỂM. |
| Desktop/mobile/device | BỊ CHẶN — full build missing existing Lục Ảnh source asset. Physical Safari/iPhone CHƯA KIỂM. |

## Evidence and blockers

44 targeted tests passed; log in `be-an-20261018/test-results.txt`. The actual base battle + S+ + Bé An installers produce five parseable scripts and retain one advanceTurn owner. The real host text composes after Kỷ Vân, Tiêu Phong, Tịch Dao, Hồng Thương and Cổ Nương. This is source composition evidence, not a complete production build.

`be-an-20261018/asset-review.mp4` is explicitly an asset fixture using the production Bé An renderer, with original-derived audio. It is not a replacement application or full-game preview. Reviewed frames show the two-hit splash over the target, giant seal centered on the target, and the special hug replacing the caster body. In the initial review the giant seal extended off-screen; its scale/anchor were corrected and the render repeated. The source girl's clothing is mirrored with her body on the enemy side, including the authored SO lettering.

`npm run build` is BỊ CHẶN at the pre-existing missing file `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01` in this sparse workspace. No placeholders were added and no build/test gate was disabled. A full build, normal battle from zero rage to Ultimate, cold-cache result screens, sound listening and desktop/mobile browser checks remain required. The workflow forbids claiming complete integration while those are unverified. No merge or deployment is included.
