# Hồn Việt: Mộng Giới — Asset Production Standard

Source of truth for future AI agents, artists, and runtime maintainers.

Updated: 2026-09-14
Status: LOCKED STANDARD v1
Project: Hồn Việt: Mộng Giới / Lục Thần
Current visual benchmark: Ông Phở Golden Character battle scale

Prompt tạo video Animation / VFX / SFX (chroma `#00FF00`, isolated pass): [HUONG-DAN-ANIMATION-VFX-SFX.md](./HUONG-DAN-ANIMATION-VFX-SFX.md).

---

## 1. Core Decision

The project will NOT require Spine as the default character-animation workflow.

The official workflow remains:

```text
User-produced AI video / GIF / PNG sequence
→ frame extraction
→ cleanup / alpha / chroma removal
→ atlas packing
→ runtime metadata
→ in-game QA
```

The optimization target is not to imitate Spine tooling. The target is to make frame-by-frame AI assets as sharp, consistent, reusable, and lightweight as possible.

Future AI agents must not ask the user to learn Spine unless the user explicitly requests a Spine migration.

---

## 2. Visual Scale Rule

Ông Phở is the current approved battle-size reference.

Every Golden Character must be normalized to the same perceived in-battle scale as Ông Phở.

Do not normalize characters by raw canvas size alone. Normalize by:

- visible body height,
- foot baseline,
- head/body proportion,
- weapon/accessory breathing room,
- perceived presence in the 6v6 battlefield.

### Runtime battle display target

| Item | Standard |
|---|---:|
| Perceived character height in battle | ~340–360 CSS px |
| Baseline | Fixed across every frame |
| Main body occupation in source frame | ~72–76% of frame height |
| Weapon / accessory | Fully visible, but must not make the body look smaller |
| Canvas rendering | HiDPI / Retina aware |

If a weapon is long or wide, add more source canvas breathing room, but preserve body scale.

---

## 3. Official Source Frame Sizes

### 3.1 Golden Character battle animation

Use this for Idle, Run, Basic, Skill 1 cast, Ultimate cast, Hit, Fall.

| Tier | Frame size | Use case |
|---|---:|---|
| Standard Golden | 768 × 768 px | Default for new production |
| Premium Golden / important hero | 960 × 960 px | Use when the character must stay very sharp on iPhone/iPad Retina |

Rules:

- transparent PNG source preferred;
- chroma-key source is acceptable only before cleanup;
- no visible background;
- no text, numbers, watermarks, or frame labels;
- full body must always be visible;
- full weapon / prop must be visible;
- no cropped hair, hat, weapon, wing, lantern, aura, or VFX;
- foot baseline must not move vertically between frames except deliberate jump / fall motion;
- character identity, face, costume, silhouette, and colors must stay stable across frames.

### 3.2 Character detail / hero showcase

Hero-detail UI must not enlarge a small battle frame until it becomes blurry.

| Asset | Standard |
|---|---:|
| Hero showcase idle source | 1200 × 1200 px per frame |
| Avatar | 512 × 512 px |
| Card / small portrait | 256–512 px depending on UI slot |

If there is no separate 1200 px hero-detail idle, the game may reuse battle idle, but this is a fallback, not the target standard.

### 3.3 Projectile / small VFX

| VFX type | Frame size |
|---|---:|
| Near-square projectile / magic hit | 512 × 512 px |
| Horizontal projectile / slash / wave | 640 × 320 px |

### 3.4 Impact / Skill 1 AOE / summon / clone VFX

| VFX type | Frame size |
|---|---:|
| Single-target impact | 512 × 512 px or 640 × 320 px |
| Multi-slot summon / clone / ground mark | 768 × 768 px |
| Full-row effect | 960 × 540 px or 1280 × 720 px |

### 3.5 Ultimate full-team VFX

| Ultimate shape | Frame size |
|---|---:|
| Full enemy-team / full-row effect | 1280 × 720 px |
| Circular / dome / cloud / ritual field | 1024 × 1024 px |
| Full-screen cinematic overlay | 1920 × 1080 px only if necessary |

For Lục Ảnh-style ultimate, where a dark poisonous cloud covers all 6 enemies, use 1280 × 720 px as the preferred source frame standard.

---

## 4. Atlas and Runtime Packing

Source frames may be high resolution. Runtime assets should be packed efficiently.

Recommended runtime format:

```text
source PNG frames
→ crop / normalize / baseline check
→ atlas pack
→ WebP lossless or near-lossless
→ metadata.json
```

Avoid lowering resolution first and then enlarging in CSS/canvas. This causes blur.

Optimization order:

1. crop transparent pixels safely;
2. remove duplicate or near-duplicate frames;
3. pack atlas efficiently;
4. use WebP lossless / near-lossless;
5. only then consider reducing resolution.

Quality takes priority over small file size for Golden Characters.

---

## 5. Standard Hero Folder Layout

Every production-ready character should follow this structure when possible:

```text
assets/characters/<hero-id>/
  master.webp
  avatar.webp
  card.webp
  runtime-meta.json

  idle-atlas.webp
  run-atlas.webp
  basic-atlas.webp
  skill1-atlas.webp
  ultimate-atlas.webp
  hit-atlas.webp
  fall-atlas.webp

  basic_projectile-atlas.webp
  basic_impact-atlas.webp
  skill1_vfx-atlas.webp
  ultimate_vfx-atlas.webp

  voice-hero.mp3
  voice-ultimate.mp3
  sfx-basic.mp3
  sfx-skill1.mp3
  sfx-ultimate.mp3
```

A hero does not need every file at prototype stage, but production Golden Characters should converge toward this structure.

---

## 6. Runtime Metadata Requirements

Each animation needs metadata, not hardcoded guesses.

Minimum metadata per animation:

```json
{
  "file": "idle-atlas.webp",
  "frames": 64,
  "frameWidth": 768,
  "frameHeight": 768,
  "cols": 8,
  "frameMs": 42,
  "loop": true,
  "baselineY": 690,
  "bodyScaleRef": "ong-pho"
}
```

For attacks and skills, metadata should also define:

- `releaseFrame`,
- `impactFrame`,
- `damageFrame`,
- `returnFrame`,
- `projectileSpawnFrame`,
- `voiceFrame`,
- `sfxFrame`,
- target-awareness rules.

Do not hardcode Slot 1 behavior. All attacks must be target-aware.

---

## 7. FPS and Timing Standard

The asset should be authored around 24 fps unless there is a clear reason not to.

| Animation type | Recommended FPS |
|---|---:|
| Idle | 18–24 fps |
| Basic | 20–24 fps |
| Skill 1 | 24 fps |
| Ultimate | 24 fps |
| Hit | 18–24 fps |
| Fall | 18–24 fps |

Do not make animation faster by deleting key poses.

Make animation faster by:

- reducing frame duration,
- adjusting action timeline,
- using runtime playback speed only when appropriate.

---

## 8. Layering Rule

Separate asset layers whenever possible.

Preferred combat asset split:

```text
Character cast / body motion
+ projectile or wave
+ impact VFX
+ lingering status / ground mark
+ SFX / voice
```

Do not bake long-range projectile travel into the character body animation if the projectile must travel to different target slots.

Ranged characters must be target-aware:

- character stays in correct slot;
- projectile travels from caster to selected target;
- impact spawns on selected target;
- damage number appears at impact timing.

Melee characters may dash, jump, lunge, or teleport, but must return to the correct slot unless the skill intentionally changes position.

---

## 9. Chroma / Alpha Cleanup Rule

If AI generation outputs chroma key, use flat green `#00FF00` only.

Rules:

- background must be uniform;
- no gradients;
- no shadows merged into chroma;
- no green spill on hair, costume, weapon, or VFX;
- cleanup must produce transparent alpha before atlas packing.

Preferred final runtime assets should be alpha WebP/PNG atlases, not raw chroma-key videos.

---

## 10. Quality Gates

A character animation is not PASS unless it satisfies these checks:

### Visual consistency

- no identity drift;
- no face drift;
- no costume drift;
- no weapon transformation errors;
- no sudden scale jump;
- no baseline jump;
- no cropped body parts;
- no text/number artifacts;
- no blur caused by unsafe upscaling.

### Runtime consistency

- correct team facing direction;
- correct slot position;
- correct target selection;
- correct release/impact timing;
- damage/heal/status appears on correct frame;
- SFX/voice is synchronized;
- animation returns to idle or fall correctly.

### Mobile sharpness

- iPhone/iPad Retina must not visibly blur the character;
- canvas must be HiDPI-aware;
- source frame must not be enlarged beyond safe limits;
- hero-detail UI must not stretch battle frames excessively.

Do not claim PASS without actual runtime evidence.

---

## 11. Prompt Requirements for User-Generated AI Assets

When asking an image/video model to create frames or animation, include these requirements:

```text
Full body always visible.
Entire weapon/prop visible.
Consistent character identity across all frames.
Fixed camera.
Fixed framing.
Fixed scale.
Fixed ground baseline.
Character faces right unless specified otherwise.
Transparent background preferred; if not possible, flat #00FF00 chroma key.
No text, no numbers, no frame labels, no watermark.
No crop.
No zoom.
No camera pan.
No change of costume, face, hairstyle, or weapon.
Output at 768x768 or 960x960 per frame for battle animation.
Output at 1200x1200 per frame for hero-detail idle/showcase.
```

For VFX prompts, request synchronized sound effect when possible so the audio can later be extracted as SFX.

---

## 12. Current Known Issue and Resolution Direction

Current Lục Ảnh runtime atlases use relatively small per-frame cells compared with the desired Retina standard. Runtime patches can improve canvas DPR, smoothing, and sub-pixel alignment, but they cannot fully restore detail that is missing from low-resolution source cells.

For future production or repack:

- regenerate or repack Lục Ảnh battle character frames at 768 × 768 or 960 × 960;
- regenerate hero-detail idle at 1200 × 1200;
- keep perceived size equal to Ông Phở;
- use runtime scaling down from a larger clean source, not scaling up from 240 px cells.

---

## 13. Final Rule

The user may continue producing and sending assets exactly as before.

The assistant / future AI agent is responsible for:

- normalizing size,
- preserving sharpness,
- cleaning frames,
- packing atlases,
- generating metadata,
- integrating runtime,
- performing QA.

The user should not be required to learn Spine, rigging, or manual game-animation tooling unless they explicitly choose to.
