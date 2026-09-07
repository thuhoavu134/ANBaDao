# L02a — Catalog validator evidence

Status: DONE for the L02a implementation slice. Full L02 remains open until
the reward/scene decisions in L02b and any migration work in L02c are approved.

## Scope

- Source owner: index.html active runtime catalog.
- Validator owner: src/domain/catalog/validate-catalog.mjs.
- Extractor boundary: src/domain/catalog/extract-catalog.mjs.
- Reproducible audit: scripts/audit-catalog-v1.mjs.
- Behavior tests: tests/catalog-validator.test.mjs and
  tests/catalog-active-source.test.mjs.
- Hermes provenance: the guide's basemdl.getConfig,
  basemdl.getCompCfg, mainlinemdl.getNextGuardInfo and
  mainlinemdl.getCurCityCfg mapping informed the boundary and missing-edge
  classifications. The supplied Hermes archive is not available in this
  session: SOURCE_NOT_AVAILABLE. No Hermes source body was reconstructed or
  ported.

The validator accepts plain data only. It has no DOM, storage, network, save,
balance, seed, reward mutation, or migration side effect. The extractor
evaluates only the catalog/config bindings in an isolated VM:
DATA, OFFICIAL_ROSTER_12_IDS, CHARACTER_MANIFEST, ROLE_ART_SHEETS,
ROLE_ART_CROPS, and ROLE_ART_ALIAS.

## Active catalog result

The report was generated from index.html at runtime SHA-256
e4f79d41e3bf7bb225ff878729d71e72be9ad94bac962f5e41cffc98148680b9.

| Classification | Count |
|---|---:|
| Playable hero IDs | 12 |
| Existing non-playable hero IDs | 11 |
| NPC/lore scene speakers | 3 |
| Encounter enemy IDs | 11 |
| Chapters | 6 |
| Scenes | 21 |
| Asset references checked | 32 |
| Negative/invalid prices | 0 |

The active report contains 16 actionable issues:

- MISSING_SCENE_REF: 5 — ch02_intro_01 through ch06_intro_01 are
  referenced by chapter starts but are not present in the active scene catalog.
- LEGACY_REWARD_HERO: 11 references — chapter reward/unlock fields point to
  existing hero IDs outside the locked 12 playable roster. The validator
  distinguishes these from unknown IDs and does not change them.

No active SCENE_CYCLE, UNREACHABLE_SCENE, UNREACHABLE_ENCOUNTER,
UNKNOWN_ENCOUNTER_ID, MISSING_ASSET, NEGATIVE_PRICE, or INVALID_PRICE
was hidden by the report. The full JSON is in
docs/qa/L02a/catalog-report.json.

## Tests and actual result

~~~text
node --test tests/catalog-validator.test.mjs tests/catalog-active-source.test.mjs
4 passed, 0 failed
~~~

The audit command used to write the report was:

~~~text
node scripts/audit-catalog-v1.mjs --allow-errors --write docs/qa/L02a/catalog-report.json
~~~

--allow-errors only permits writing an evidence report for the known active
catalog findings; it does not turn the report ok. Without that flag the
validator exits non-zero while those findings remain.

The repository-wide npm test was not run in this connector-only session:
the private GitHub repository could be read/written through the connected
GitHub API, but a credentialed local clone was unavailable. The focused
L02a tests and the active-source audit did run against the exact main
index.html blob and asset paths. Build, browser, Safari-device and
production-deployment evidence are not claimed for this domain-only change.

## Preservation and next step

This slice does not change index.html, defaultPlayer, migrateSave,
seed/banner policy, rewards, balance, save migration, runtime build patches,
or the battle-audio exit hotfix. L02b should review the five missing chapter
scene starts and produce the reward mapping table (old ID, proposed ID,
save impact) before any data or migration edit is made.
