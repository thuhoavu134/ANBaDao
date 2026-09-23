# Audio transition repair — evidence

## Baseline
- Main: `a536b194b36705acc8766aa1e1737e39fc44c4da` (PR #206 merge).
- Regression observed by owner: the first gesture starts music; entering battle and confirming the result each require another tap to recover BGM/SFX.

## RED → GREEN
Before the patch, the new focused checks failed because:
1. the audio manager had no shared music transition API;
2. the result runtime created a fresh `Audio()` player;
3. the BGM route called `HTMLAudioElement.play()` after asynchronous screen transitions.

After the patch:
- `tests/battle-audio-transitions.test.mjs`: **5/5 PASS** (shared hub → combat → result bus, latest decode wins, result bus handoff, volume/pause owners, route bus contract).
- `tests/battle-audio-lifecycle.test.mjs`: **10/10 PASS**.
- JavaScript syntax checks for all changed runtime/test files: **PASS**.
- Combined audio/lifecycle/profile focused selection: **15/15 PASS**.
- A broader local partial-checkout selection hit **3 unrelated missing-art failures**; the audio assertions in that run passed.
- Local `npm run build`: **BLOCKED** because this checkout lacks `scripts/battle-phase1-trace-v1.mjs`; this is a missing local source file, not a build assertion.
- Full CI/browser on the PR revision: **PENDING**.
- Physical iPhone/Safari: **NOT RUN**.
