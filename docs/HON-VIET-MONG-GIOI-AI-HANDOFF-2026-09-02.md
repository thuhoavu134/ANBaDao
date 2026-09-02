# Hồn Việt: Mộng Giới — AI Handoff / Source of Truth

Updated: 2026-09-02
Repo: bktimmy247/luc-than

When user says “tiếp Hồn Việt”, continue from this document and the newest build/commit. Do not restart old pipelines.

## Locked production direction
- 2.5D Vietnamese fantasy, turn-based 6v6.
- User produces/sends character/VFX assets. AI normalizes, integrates, writes metadata/runtime and QA.
- Main animation pipeline is NOT Spine: AI video/PNG sequence -> preserve all authored frames -> cleanup/chroma/alpha -> Texture Atlas/Sprite Atlas -> JSON metadata -> runtime frame-by-frame.
- Do not drop frames merely to optimize.

## Spatial/combat standard
- Align heroes by foot/ground anchor, not PNG dimensions.
- Per-hero/skill metadata: footAnchor, displayHeight, hitAnchor, castAnchor, meleeReach, attackOffset, vfxScale, moveType.
- Ranged moveType=0/stay at slot. Melee may approach attack point.
- Projectile starts at castAnchor and ends at target hitAnchor. Impact/damage at hitAnchor.
- Team-wide VFX uses enemy-group/row anchors. VFX scale is independent from hero scale.
- x1/x2/x3 should eventually synchronize animation/VFX/projectile/tween/timers, but DO NOT replace the global combat clock. A previous shared clock patch froze Lục Ảnh and blocked turn progression.

## Skill Atlas Standard V1
Structure: Hero/Skill/{cast,projectile,impact,...}/frames.json + atlas, plus skill.json and sfx.
frames.json stores atlas layout/frame count/cell size/timing/anchor/offset/display/baseline/blend/layer.
skill.json stores heroId/kind/movement/targeting/timing/audio/effect/parts.
Generic runtime registry: HonVietSkillAtlas.get(heroId, kind), getById(id), listHero(heroId). Registry validates schema/metadata/atlas existence.

## Registry status
### Lục Ảnh
- Reference implementation: Basic + Skill1 + Ultimate.
- Basic cast -> projectile -> impact.
- Skill1 cast -> VFX at enemy hit anchors.
- Ultimate stays at home slot; large poison-cloud VFX covers enemy half/rows, not own team.
- Keep anchor spatial patch. Local speed patch only; never re-enable global clock patch.
- Ultimate voice guaranteed. iOS audio unlock on first normal user interaction; no blocking tap gate.

### Đình Lôi
- Basic cast/projectile/impact.
- Talent cast/wave/impact/shield.
- Ultimate cast/battlefield VFX/impact.
- 8x8, 64-frame / 4-second atlases; preserve real orientation/cell metadata.

### Thầy Mo
- Basic Cast/Projectile/Impact.
- Skill1 Chuông Chấn Phách: Cast/Wave/Impact, ranged/stationary.
- Ultimate Trận Ảnh Phong Môn: Cast/VFX, enemy-team coverage.
- moveType=0.

## Audio
- iOS/iPad: unlock on first real interaction, no Tap-to-Start overlay.
- BGM routes: hub / hero / combat / challenge.
- Result audio: stop/fade combat BGM -> victory or defeat track once/non-loop -> stop result track when leaving result -> next-screen BGM.
- Repo contains bgm-victory.mp3 and bgm-defeat.mp3.

## Victory/Defeat
- Victory V6, Defeat V4.
- Victory MVP runs from left to wing center, then idle loop.
- Defeat falls once then stays down.
- MVP/name/hero must be dynamic per battle.
- Result buttons have had iOS click regressions; verify runtime after changes.

## Battle background — CURRENT PRIORITY
- User explicitly wants REAL BITMAP BATTLE BACKGROUNDS PER CHAPTER, NOT CSS-DRAWN SCENERY.
- Background asset must be clean: NO hero/person/monster/animal/UI/HUD/text/logo/VFX/damage numbers/character shadows.
- 16:9 landscape, open middle/lower-middle for both teams, readable foreground, Vietnamese architecture/nature and depth.
- battle-visual-polish-v1 incorrectly used assets/hub/hub-bg-city-clean-v2571.png as Chapter 1. USER REJECTED THIS. Never use hub art as battle map.
- User is generating a clean battlefield using the supplied prompt. When received, integrate the exact file into assets/battle-maps/chapter-01 and point BATTLE_MAP_REGISTRY to it.

## Damage popup — CURRENT PRIORITY
- Reference screenshot: damage is compact, not a giant banner.
- Multi-hit damage should pop as many vertically stacked lines close to target.
- Current Arial Black/Impact 24/31 patch is too large; USER REJECTED IT.
- Next target: roughly 13–16 WORLD px normal, 16–19 crit; 5–6 lanes; 15–20 px vertical spacing; warm yellow/orange fill + dark outline; quick bounce; crit only moderately emphasized.
- Do not let “BẠO KÍCH −xx” cover characters. Consider a smaller crit label or color/scale-only crit treatment.

## Hero UI direction
- Tướng -> roster screen -> tap hero -> detail with idle + interface voice.
- Three blue skill buttons open skill detail.
- Three-dot near shield opens detailed stats.
- Gold armor button -> costumes.
- Circular arrow -> rebirth/reset.
- User wants old Hero UI removed, not layered underneath new UI.

## Voice lines
Thầy Mo approved direction:
- Interface: “Chuông còn ngân, đường âm dương còn mở.”
- Ultimate: “Chuông dẫn lối — vạn tà lui!” or “Trận khai! Hồn định! Tà khí — lui!”
Ông Phở not finalized. Candidate interface lines include “Nước dùng phải ninh lâu… bản lĩnh cũng vậy.” and “Ông chỉ bán phở thôi… nhưng đừng có quậy cái quán này.” Candidate ultimates include “Lửa lớn! Nước sôi! Đến lượt ông!”, “BẾP ĐỎ — PHỞ SÔI!”, “Nồi đã sôi — khỏi nói nhiều!”

## Safety / workflow rules
- Continue from newest accepted build; do not restart.
- Never claim runtime/visual PASS without evidence.
- Small idempotent patches with rollback; avoid brittle exact-format regex.
- Never directly replace huge index.html/battle.html.
- Do not re-enable global combat clock.
- QA x1/x2/x3 without cutting authored frames.
- User is final visual/combat-feel approver.

## Important recent milestones
- a2ade70... rollback shared combat clock regression.
- d742a485... Lục Ảnh Basic Skill Atlas Standard V1.
- e8e99f1f... Lục Ảnh Skill1 + Ultimate atlas manifests.
- 5dc43d34... generic Skill Atlas Registry V1.
- 43fd3335... Thầy Mo registry manifest fix.
- 55d1b31c... battle visual polish: build succeeded but visual FAILED because it used hub background and oversized damage typography.

## NEXT
1. Receive clean battle background from user.
2. Integrate exact asset under assets/battle-maps/chapter-01 and remove hub fallback from battle.
3. Correct damage typography/stacking to reference screenshot.
4. Runtime QA background crop, readability and multi-hit damage on mobile/iPad + desktop.
5. After visual approval, create/map distinct backgrounds per chapter.
6. Continue remaining roster migration to generic Skill Atlas Registry.

Agent instruction: Read this file first. Do not use hub art for battle. Do not enable global combat clock. First priority is the user-provided clean battle background plus compact stacked damage popups.