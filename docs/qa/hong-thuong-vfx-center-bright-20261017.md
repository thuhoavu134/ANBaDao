# Spear impact center/density/brightness follow-up

Anchor now uses target body midpoint: target x, target feet y minus half the scaled body height (419 authored heroine benchmark, 310 generic). Previously an unused waistY was calculated but drawing still used caller y near feet. Rendering centers the atlas at the anchor rather than subtracting 60% of its height.

Two simultaneous layers have offsets (-8,+5) and (+8,-5), opacity 1/.85. One impact event, one SFX, unchanged damage. Run remains 30% in AFK/victory.

Source sample22 cells are independently flattened on black for screen blending, resized 128→512 with Lanczos3, brightness factor1.18, saturation1.04, mild sharpening; lossless WebP output impact-4x-bright.webp (2560×1536, 920638 bytes, decoded 15MiB). Flattening before processing prevents transparent-pixel color artifacts; black is neutral in screen blending. This is resampling, not recovered source detail. Generation script retained.

9/9 runtime regressions pass, including averaged layer centers on an enemy torso. Output atlas visually inspected; uploaded blob hash verified. Full battle/iPhone not verified. No merge; existing workflow-tool waiver applies.
