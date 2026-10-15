# Thầy Mo auto Basic rage — 2026-10-15

Baseline main 47f14558d713f05ee806dbe4c39e4223f73aaf69 (owner-approved PR306 merge). Scope: auto action selection only; no asset, damage, timing, manual skill, free talent, resource amount or Ultimate threshold/cost changes.

R1: Thay Mo cannot auto-buy a legacy 25-rage Skill disguised by the Basic animation. R2: Basic remains free and gains existing +15 rage, reaching Ultimate without incoming hits. R3: other heroes keep paid skills; free talents and silence behavior stay unchanged.

Cause: auto-skill-cadence-v1 inserts a generic paid Skill before talent/planned/Basic selection. The authored Thay Mo owner paints both basic and skill using skill1 and labels them Basic, masking the 25-rage cost. Exclude authored Thay Mo from that paid auto branch via the existing identity owner; the normal Basic, free talent and Ultimate branches remain.

RED: all three canonical identity aliases fail, selecting skill instead of basic at 30 rage. GREEN: 10/10 focused tests pass (4 new + 2 auto rage + 4 authored production). Generated AI/debit, real Core costs and Basic gainEnergy/settlement branch exercised on both teams: 30 ->45 ->60 ->75; Ultimate costs existing 60 ->15. Test damage sink is stubbed; no full fight claim. Cold asset readiness, cancellation and release sound tests also pass. Generated inline scripts parse in authored production tests.

Sparse workspace lacks package.json/full assets: full normal build, entire Node suite and browser NOT_RUN locally. PR CI pending. Physical Safari and deployment NOT_RUN. Existing Ticket Board exception retained; no ticket claim fabricated. No authorization inferred to merge this new PR; owner specifically requested merging PR306 first.
