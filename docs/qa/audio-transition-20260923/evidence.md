# Audio transition repair — evidence

## Baseline
- Main: `a536b194b36705acc8766aa1e1737e39fc44c4da` (PR #206 merge).
- User-observed regression: first touch starts music; entering battle and confirming results require an extra touch for BGM/SFX.

## RED → GREEN
Before the patch, the focused checks failed because the audio manager had no shared music API, the result runtime constructed a fresh `Audio()`, and the BGM route called media `.play()` after asynchronous screen transitions.

After the patch:
- `tests/battle-audio-transitions.test.mjs`: **5/5 PASS**.
- `tests/battle-audio-lifecycle.test.mjs`: **10/10 PASS**.
- JavaScript syntax checks on changed runtime/test files: **PASS**.
- Combined focused audio/lifecycle/profile selection: **15/15 PASS**.
- Broader local selection encountered 3 unrelated missing-art failures in the partial checkout.
- Local `npm run build`: **BLOCKED** because the checkout lacks `scripts/battle-phase1-trace-v1.mjs`.
- GitHub Actions CI run #694 and its retry: **FAIL before any job steps**. Step list is empty and the logs endpoint returns `BlobNotFound`; the exact cause is **UNVERIFIED**. This is not evidence of an assertion failure.
- Vercel status checks on PR #208 are red; GitHub Actions `Live check` is skipped. No merge/deploy is claimed.
- Physical iPhone/Safari: **NOT RUN**.
