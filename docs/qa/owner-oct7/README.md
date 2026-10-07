# Oct7 verified review checkpoint — runtime 5a2baf3
Preview: https://luc-than-jgkwuhr8t-nyto1.vercel.app — Vercel READY, deployed host HTTP200 with assist route guard.
Audit: https://github.com/bktimmy247/luc-than/actions/runs/37600017304 — SUCCESS.
1657/1657 full tests, full build, actual roster→assist hit-test, authored result Run→Idle (Linh Đồng explicit QA snapshot), real guest AFK, formation geometry, host entry/return and all-screen inventory passed.
Responsive Chrome: 390×844, 430×932 and desktop where applicable. Runtime/asset errors empty in owner flows. Physical Safari NOT_RUN.
Reviewed screenshots: assist is visibly on top; Linh Đồng visible at left during Run and centered at Idle; actual AFK actors stay next to the pack between casts.

A first runtime 3296f50 browser route-state check was insufficient: screenshot showed Trận Hình above assist. Fixed team-3d owner to honor ST.hvAssistOpen, cleared on normal navigation/formation, strengthened browser checks with formationHidden and actual elementFromPoint hit-testing.
Delayed-idle regression now waits past 1.77s entrance before loading the held atlas; 3/3 motion harness tests passed.
Q1/Q3/Q4 implemented. Q2 PARTIAL: Thầy Mo still has no authored Run; existing idle-translation explicitly retained. Need original approved Run clip/atlas. No replacement character or claim of true Run for Thầy Mo.
General CI/CD 37600022507 still running broader browser jobs at handoff; full UI audit above is green. Owner visual acceptance pending. Draft PR285 only; no merge or production promotion.

# Owner corrections — 2026-10-07 (PR285 only)
Baseline 748b549; current main remains 0cf636a. User screenshots IMG_7704/7705/7706/7703.

Q1: A=anhDan (Ảnh Đạn), MH=joyMask (Mặt Hỷ), CB=buffBan (Cấm buff). Added semantic SVGs for these plus rageMask, generic non-letter status glyph. Removed initials drawing entirely, including cold image-loading fallback. Existing statuses/mechanics unchanged.
Q2 PARTIAL: result entry starts fully beyond left viewport edge, travels to center over 1.6s, then Idle; Run/Idle waits for decoded assets. Actual authored Run remains used for supported heroes. Thầy Mo has NO Run asset in repository: retained explicitly identified idle-translation, never another hero or fabricated Run. Need owner-supplied/approved Thầy Mo Run clip to complete this criterion. QA now exposes entryMotion.
Q3: accountGearNavTo invokes existing showScreen('team') before opening wheel/board; roster wrapper closes the heroes overlay. Normal formation bypass remains intact. No new global input listener.
Q4: cosmetic AFK actor holds engagement point between casts. Regroup begins only after ALL mobs die AND final cast finishes. Same event/damage/loot/reward clocks and squad identities; no game economy change.

RED: four focused failures on prior owners. GREEN: 22 focused tests, including movement/return bounds, current AFK regression, status registration/fallback, roster route owner and result entrance; generated result script parse passes. Local checkout sparse, no full build claim.
Added actual browser script: real login → Tướng → Trợ trận click, real result renderer + authored Linh Đồng snapshot on390/430/desktop. Explicit QA snapshot only in test, not player preview.
Previous full audit GitHub job111957306150 cancelled before any steps; not passed. New CI and Vercel preview results pending commit. Physical Safari NOT_RUN. Broader every-screen UI audit still unfinished.
Existing documented board waiver retained, no claim/lease fabricated. Draft review only, no main merge/production promotion. New status SVGs original code-authored presentation assets, not owner aesthetic approval.
