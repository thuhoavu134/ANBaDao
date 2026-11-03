---
type: task
title: Capture fresh evidence
max_attempts: 3
---

Run focused tests first. Build once and stop on nonzero. Verify served build hash matches disk. Run node scripts/ui/verify-shop-popup.cjs; evidence goes into a unique directory, never reused screenshot names. Inspect all images directly using read. Record visual defects separately from numeric tests. Test short viewport and available browser engines; physical Safari cannot be inferred from Chromium.

## Next
- [[quality-gate]]
