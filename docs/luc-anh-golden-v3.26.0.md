# v3.26.0 — Lục Ảnh Golden Complete

## Character surfaces
- Lục Ảnh card/avatar/master art are bound to roster, formation and hero detail.
- Hero detail plays the authored Idle atlas and exactly one supplied hero-detail voice line on entry.
- Battle runtime binds authored Idle, Run, Hit, Fall, Basic, Basic Projectile, Basic Impact, Skill 1, Skill 1 VFX, Ultimate and Ultimate VFX atlases.
- Exactly two authored Lục Ảnh voice files are used: hero-detail entry and Ultimate.

## Combat contract
- Basic: stationary cast -> separate projectile -> impact.
- Skill 1 — `Kéo Đèn Lục Ảnh`: automatic Talent Skill under the existing 12-hero runtime standard; the VFX is rendered at all six enemy slot positions and applies damage + 20% Speed Down for 2 turns.
- Ultimate — `Độc Vân Phủ Thế`: lantern cast remains on the home slot; black toxic cloud VFX is rendered at exact 3x source-cell size (320x220 -> 960x660) centered over the opposing six-slot formation.
- Ultimate applies direct impact plus Poison for 3 turns. Poison power is calculated per target as 6% of that target's max HP per tick.

## Audio routing
- `bgm-lac-than-hub.mp3`: lobby and ordinary feature screens.
- `bgm-combat.mp3`: every battle screen.
- `bgm-challenge.mp3`: journey/campaign/expedition/tower feature screens before battle.
- `voice-luc-anh-hero.mp3`: hero detail entry.
- `voice-luc-anh-ultimate.mp3`: Ultimate cast.

## Verification
- `npm test`: 29/29 automated checks PASS, including three Lục Ảnh/BGM integration checks.
- `npm run build`: PASS; static preview emitted to `dist/`.
- Visual browser QA is not marked PASS in this environment: the available headless Chromium smoke attempt did not exit reliably. Runtime visual acceptance still requires an actual-play video/screenshot review.

## Source-SFX note
The supplied RARs contain a small number of FLAC entries compressed with a RAR method that the available extractor cannot decode. These original FLAC bytes are therefore not bound. The live runtime still has its existing synthesized action/impact SFX, while all readable authored visuals plus both supplied voices and all three supplied BGM tracks are integrated.
