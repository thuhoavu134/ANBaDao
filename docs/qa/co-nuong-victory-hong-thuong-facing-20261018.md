# Victory identity and Hồng Thương rear finisher

Owner reported Cổ Nương showing generic art on Victory and Hồng Thương facing away from the victim during the final rear thrust.

- Result manifest now registers Cổ Nương's real run/idle/fall atlases and all canonical aliases. The motion factory supports her single idle atlas without changing existing paged packs. Her 18-frame run uses its authored speed rather than the legacy 0.30 run multiplier; the existing Victory entrance/idle transition remains the owner.
- Hồng Thương's ult-finisher mirrors relative to the team facing only while that module is visible. Player-side finisher faces left into the enemy's back; enemy-side finisher faces right. Other clips retain existing facing. Target choice, movement, hit timing, damage and return position are unchanged.

Validation: three regression assertions failed before the fixes (missing result registration and incorrect facing for both teams). All 31 co-nuong*.test.mjs tests pass after the fixes, including actual result descriptor construction from metadata and production Hong Thuong renderer scale checks at finale, return and idle. Both changed source files pass node --check.

Full game build/browser/device visual verification remains unavailable in the sparse checkout. The owner report is the regression evidence; unit checks do not constitute visual approval. Existing Ticket Board-unavailable waiver remains in effect. PR314 review only; no merge/deploy.
