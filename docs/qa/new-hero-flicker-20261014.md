# Kỷ Vân / Tiêu Phong battle flicker

Baseline: 0c5603d9e4d95fce320a03c2f45903c0f902a309. Branch: fix/ky-van-tieu-phong-flicker-20261014. No merge/deployment.

Carries forward the reviewed but unmerged PR301 body visibility repair onto current main, retaining PR305 preparation scheduling. Additionally request/paint the current idle page before speculative next-page admission; next pages use prefetch priority instead of visible priority. The shared six-entry snapshot owner retains canonical body pixels while the atlas reloads. No art, timing, size, combat or save changes.

Acceptance: F1 visible body survives image loss on both teams; F2 cold/dead units do not produce false living-body success; F3 current page precedes speculative next page; F4 actual Chromium desktop/mobile action, image loss, recovery and Reset.

Local RED: original body-loss regressions fail on main. Additional two request-order cases fail after applying PR301 alone. GREEN: 21 focused tests pass including both new request-order cases. Full normal build and browser checks delegated to the existing GitHub Actions runner, not a substitute app. Review workflow emits screenshots and reports in logs because repository artifact upload quota is exhausted.

Vibe Builder/VibeLab skills read; existing unavailable ticket-board exception retained. No board claim or completion fabricated. Physical Safari/iPhone and production are unverified. Runtime CI results must be checked on the actual PR head before acceptance.


## Verified runtime revision

Head 94f044e76dea6268eda896eae7de09465b5ffdb1, tested PR merge 8e70f6af87a02c44f3b9c1efed76b9632c6c47c1. Hero visibility review run 38547610199 / job 115797440048 SUCCESS. Full normal npm test build and 1749/1749 Node tests pass. Browser four cases (Ky Van/Tieu Phong x 390x844/1280x800) pass forced image unavailability, real snapshot draws, reload recovery, Ultimate, Reset and Basic; runtime exceptions=0 and asset HTTP errors=0. Four emitted screenshots inspected: correct hero bodies persist in the battlefield. Mobile test controller leaves bottom row partially below viewport and a tooltip covers lower field; desktop has a scrollbar. No blanket layout approval. These controlled image-loss cases do not certify physical low-memory WebKit or a full campaign settlement loop. Physical Safari and production remain NOT_RUN.

Local RED: 10/10 body-visibility tests failed on main; two additional ordering tests failed on PR301-only code. GREEN: 21 focused tests pass. General CI status is separate from this successful scoped review; repository artifact quota remains an existing issue.
