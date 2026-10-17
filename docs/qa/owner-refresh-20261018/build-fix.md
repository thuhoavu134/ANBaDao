# PR315 build correction

Owner supplied a Vercel log for commit `2ebc794`. Installation and asset builders succeeded, but the final installer failed at the readiness anchor in `owner-refresh-20261018.mjs:91`. This is a code failure; earlier access-blocked deployment statuses do not explain this run.

Root cause: `battle-instant-skip-v1.mjs` wraps the readiness await with `__hvSkipVisualAssets` before `installOwnerRefresh` runs. The new installer incorrectly expected the pre-skip statement. Bind to the final wrapped statement, retain the exactly-one assertion, and route the new sound preparation through the same skip owner.

RED: `node --test tests/owner-refresh-build.test.mjs` reproduced the exact missing readiness anchor (1 failed, 2 passed).

GREEN: `node --test tests/owner-refresh*.test.mjs tests/co-nuong*.test.mjs`: 42 passed, 0 failed. Coverage includes final wrapped readiness, missing/duplicate rejection, build order, existing Cổ Nương timelines/audio and result/facing regressions. Host and battle source-fragment inline scripts also parse; this is not a full generated-game build.

Full build and in-game visual/audio QA remain unverified locally because the sparse checkout lacks earlier build dependencies. A new remote deployment must validate the complete pipeline. No merge or production promotion is claimed.
