# Hồn Việt v3.21.9 — Clean Runtime Packaging

## Goal
Tách runtime game khỏi production/QA archive để không tích lũy video, screenshots, intermediate atlases và backup files vào mỗi ZIP.

## Result
- Previous ZIP: **415.9 MiB**
- Clean runtime ZIP: **61.0 MiB**
- Reduction: **354.9 MiB (85.3%)**
- Runtime asset references found: **92**
- Existing referenced assets copied: **79 / 79**
- New missing references introduced by cleanup: **0**

## Excluded from runtime ZIP
- artifacts/
- tmp/
- qa/ and regression/
- tools/
- QA videos/screenshots/contact sheets
- backup HTML
- design/QA markdown and reports
- old/intermediate animation atlases and source assets that current runtime HTML does not reference

## Known inherited missing references
The source build already references 13 files that are absent. Cleanup preserves the same warning set and does not invent replacement art.

## Verification
- index.html present: PASS
- battle.html present: PASS
- every referenced asset that exists in source was copied: PASS
- cleanup introduced no new missing asset path: PASS
- fresh browser smoke in this container: **UNVERIFIED** because headless Chromium hung in the environment; no browser-runtime PASS is claimed for the clean package.
