# First AFK VFX and early battle SFX — 2026-10-07

Status: REVIEW after validation; Draft PR288, no merge approved. Baseline main32cbbf1; runtime25df23ba69374fb46c575646d6fc5e829b8ebc45. Branch fix/first-action-vfx-sfx-20261007. PR287 remains separate and unmerged.

## Root causes and repair
- AFK requested VFX pages only during their short release window, but advanced farmTime on missing pages. Warm the first small VFX page during casting, and hold only the existing visual farm clock while the active attack/VFX page is unready. Preserve actual AFK accrual/rewards and existing memory/renderer ownership.
- Both readiness owners stopped waiting for audio after2s even when the cold decode was still pending. The action could finish and cancel the unheard sound. Use the existing15s resource budget (remaining time for legacy) before the cast clock; retain bounded failure/mute/cancellation behavior.
- Zero/stale WebAudio output timestamps could map a500ms cue9s into the future. Use fresh output timestamps when available, otherwise the existing currentTime mapping. No new audio owner or replay.

## RED → GREEN
Focused tests: two AFK failures (missing page failed to stop visual time), two cold-clock failures (source start10.5/8.6 rather than1.5), two cold-decode failures (cast gate released at2s). Seven focused tests pass after the patch, including a valid-device-clock control.
Browser normal baseline79741a2: both teams' sounds already work with fast local downloads; this alone did not reproduce the mobile symptom.
Browser cold baseline4c11181, run37649127556: desktop real VFX responses delayed900ms -> first Đình Lôi/Thầy Mo VFX only at15082/16266 visual ms (second attacks, release8580/9760). Direct iPhone code path with real SFX responses delayed6.5s -> first Ông Phở sound returned false on a running AudioContext. This is controlled latency, not simulated audio/gameplay.

## Limitations
Chromium mobile routing emulation is not physical Safari/WebKit. Actual device listening remains NOT_RUN. No blanket latency/memory claim. Existing Ticket Board unavailable waiver applies; no ticket status fabricated. Asset art, target rules, damage, formation, reward, and AFK wall-clock accrual are unchanged.

## Final evidence
- Actions37649454732 SUCCESS at runtime25df23ba: clean build and1680/1680 Node tests; all three browser cases PASS.
- Under900ms real VFX response delay, first effects now paint at8583/9783 visual ms versus release8580/9760 (previously only second casts15082/16266).
- Desktop, direct iPhone routing and6.5s cold SFX download cases each progressed10 actions, with9 first actor SFX requests successful across both teams. Real nonzero PCM buffers started on running contexts; scheduled combat audio was not cancelled before audible onset. No runtime exceptions or asset HTTP errors.
- Screenshots inspected: desktop and390px AFK keep the original map/UI/party;390px battle shows the running fight and intact dock. These end-of-sample screenshots do not independently prove transient first VFX; timestamped drawImage evidence does.
- General CI37649655545: build,1680 tests and Battle VFX browser QA passed; Upload battle VFX evidence failed because existing GitHub artifact storage quota is full. Not claimed green CI. Dedicated media workflow holds its reports/screenshots directly in logs and passed.
- Preview READY: https://luc-than-5mn2alu0a-nyto1.vercel.app. Host and battle fetched HTTP200; verified exact farm gate, clock validation and bounded readiness in deployed source.
- Review PR: https://github.com/bktimmy247/luc-than/pull/288. Owner device review next; no merge.
