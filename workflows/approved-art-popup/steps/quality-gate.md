---
type: decision
title: Evidence gate
max_attempts: 3
---

Run node scripts/ui/check-popup-evidence.mjs <manifest>. Require real current screenshots, successful interactions and no visible defects. Retry at most twice; record cause and return to implementation only with a source-backed fix. Otherwise block and request guidance.

## Output
```json
{"type":"object","required":["route","reason"],"additionalProperties":false,"properties":{"route":{"enum":["owner-review","implement","blocked"]},"reason":{"type":"string"}}}
```

## Next
- [[owner-review]] — when: current evidence passes and visual review finds no defect
- [[implement]] — when: a known fix exists and fewer than two repair attempts were made
- [[blocked]] — when: evidence is unavailable or two repair attempts failed
