# First-action media repair
Baseline main 32cbbf1; separate branch fix/first-action-vfx-sfx-20261007, no merge approval. PR287 entry work remains separate.
A1: first AFK cast paints authored VFX even with cold pages; visual farm clock may wait, AFK reward accrual stays unchanged.
A2: both teams' first battle SFX decode before cast, with valid device-clock mapping; no late cross-action sound.
A3: bounded cache/readiness and existing cancel/mute/skip behavior retained; build/full tests and real desktop/mobile browser QA.
RED: first AFK tests failed (clock advanced 7000→7040 on missing VFX); cold SFX readiness returned at 2s before decode; cold output timestamps scheduled a cue due in 500ms at context10.5/8.6 instead of1.5.
GREEN focused: 7/7 after patch. Complete clean verification pending.
Browser baseline normal local network: sounds already succeed, AFK loses some VFX pages; not a claim of reproducing physical Safari. Slow real asset response QA adds 900ms VFX delay and6.5s sound delay.
Ticket Board unavailable under existing owner-approved waiver; gate20261007-224804-cjz2pvl. Physical Safari NOT_RUN.
