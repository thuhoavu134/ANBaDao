# X1 presentation timing — owner review

Requested 2026-10-18 (Asia/Saigon). PR314 applies the concrete refinement to Cổ Nương. Other heroes are not retimed in this patch; the following roster-wide budgets are proposed for review.

Measure from action start through movement, release, impacts and recovery until the next turn can proceed. Asset duration alone is not total action duration. Asset readiness is tracked separately.

| Action | Target x1 | Maximum x1 |
|---|---|---|
| Simple basic | 1200–1600 ms | 1800 ms |
| Combo/projectile basic | 1600–2000 ms | 2200 ms |
| Standard ultimate | 2800–3600 ms | 4000 ms |
| Three-wave/special ultimate | 3600–4200 ms | 4500 ms |
| Inter-turn gap | 80–120 ms | Avoid stacked waits |

These are project design proposals, not measured industry benchmarks. Preserve authored poses, invisible phases and impact order. Release must align with the actual hand/weapon pose; never blindly use a fixed frame percentage for every hero. Use one captured clock for character, VFX, audio and combat markers at x1/x2/x3. Keep damage and status rules unchanged. Approved hero choreography requires separate visual review before retiming.

## Cổ Nương implementation in this PR

- Character ATK 720 ms; release600 ms at frame16/18, impact991 ms. Three swords, stagger102 ms, flight306 ms, four170 ms traversal legs per sword (two round trips), fade102 ms. Last sword ends1892 ms; action completes2000 ms.
- Ultimate release1060 ms; one domain action at1380 ms; VFX/audio wave starts1380/2280/3180 ms. Each900 ms, final wave ends4080 ms, action completes4200 ms.
- Source character pose still needs full-game visual confirmation; see refinement QA limitations.
