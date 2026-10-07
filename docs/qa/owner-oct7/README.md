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
