# Kỷ Vân integration — REVIEW work in progress

Baseline main: 3a8cab7fee6d32da476811652669e1ab7214a468.
Owner approved supplied 18-frame ATK/Ultimate and three lightning bolts per target location with SFX. Requested a chance of stun and no healing for one recipient turn. Owner subsequently supplied kiemthe-four-states-v1.1.zip: idle has 83 native poses with authored variable durations and 3.466667s loop; run/hit/fall-die each have 18 poses over 3.900024s. All six actions now have supplied artwork. Standing pose remains a cold-cache fallback only.

Contract: register in normal roster without replacing any hero; keep fixed 42-grid; use real battle scheduler/cache/audio; apply one proc per living enemy, respecting immunity/resistance; one skipped action, healing restored after that turn; preserve three visual waves, three staggered bolts at each point, screen blending and source pivots. Damage 120% ATK, 60 rage and proc 30% are review defaults, not approved balance. Anti-heal accompanies a successfully applied stun.

Source provenance: character kiemthe-green-screen-assets-v2.5.zip file1403/1405; VFX SKILLPACK.zip kunlun kl_10_klzd_c/d; approved sound mix kl_hff_c, kl_qff_h, kl_axxf_c plus generated low thunder. WebP q90 runtime derivatives keep alpha; original supplied RGBA ZIPs and full metadata are retained. Idle is repacked into six pages of at most 16 frames (<14 MB decoded/page). No new character art or fabricated animation. Sprite duration 3900.024ms, 18 poses, 480×440 cells, bottom-center. SFX variants x1/x2/x3 pre-baked and use existing shared bus. Cast speed is captured at start.

RED: four failures and one pass before implementation (red.txt). Focused domain tests subsequently 5/5 pass. Complete fresh build/full suite and browser evidence pending; sparse local source recovery is not a full checkout. No device/Safari or production certification.

The handoff's existing owner workflow-gate waiver is retained; Ticket Board unavailable, no claim or ticket state invented. New October owner direction requires approval before merging. Branch only; do not merge or promote production without explicit approval.

Owner authorized merge in chat on 2026-10-09; uploading complete source/assets first. Full build/CI must still be inspected. Host registration is installed by the checked source build owner rather than uploading a second 2 MB host file.
