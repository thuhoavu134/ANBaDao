# Result identity correction — 2026-10-14

PR306 follow-up at f8c8816e45f42fa2195361050f7f3f510ce9be43. User screenshot: Tiêu Phong MVP was painted with the generic female mystic. Cause: both new heroes were absent from the authored result manifest and fell through to archetype art. Existing result motion owner now uses each hero's actual Run, all six Idle pages with original fractional durations, and Fall; sourceHeroId is also recognized. No reward/settlement/combat/UI layout change.

RED: two generated-manifest identity tests fail before implementation. GREEN: four focused tests pass, including mapping every frame in 83/87-frame Idle loops to its correct page/cell. New hero result identity review run 38550768527 / job115807886587 SUCCESS: full normal build and1753/1753 Node tests; four Chromium cases (390x844/1280x800, both heroes) verify only correct hero source images were drawn, all six idle pages, authored Run, one Fall to final frame, and Confirm returning from Victory/Defeat. Zero runtime exceptions and asset HTTP errors. Four Victory screenshots inspected: correct chibi fan wielder and silver-haired Ky Van in wing focus; desktop uses centered portrait result layout. Result snapshots are controlled QA inputs with empty rewards; no full campaign/economy certification claimed.

No merge or production deployment. Existing nyto1 preview cannot be updated via this session: Vercel scope query returns403, no local CLI available, Git integrations report blocked deployment. Do not tell owner their old preview already contains this commit. Physical Safari NOT_RUN. Previous flicker repair retained.

---

