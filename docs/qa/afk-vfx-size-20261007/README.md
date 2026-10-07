# AFK VFX sizing — 2026-10-07
Runtime8b5c9b1, parent7c20dd7, owner clarified AFK ONLY.
Changed only campaign drawCampaignBasicVfx: uniform scale bounded by 0.8×hero body height, width1.6×body height and22% viewport. Long shallow Thay Mo projectile no longer gets giant width from height-only scaling. Preserves aspect, authored frames/timing, direction, pivots, Run/ATK behavior. Battle VFX unchanged.
RED: actual draw width exceeded cap. GREEN18/18 focused (sparse local test import uses existing HV_SKIP_BATTLE_FORMATION_SCALE_PATCH=1); full clean CI build and1660/1660 tests passed.
Actual guest AFK390×844,430×932,1280×800 passed, ATK/VFX and next-pack Run present,0runtime/asset errors; screenshots reviewed including reduced Dinh Loi effect. Browser report attached.
Audit37612639112: AFK/geometry/host/all-screen steps passed; owner result step failed on browser cleanup ENOTEMPTY in /tmp Chrome profile after screenshots, not a game assertion. Overall audit is NOT green; no blanket gate claim. Source scope deliberately remains AFK only.
Preview https://luc-than-ote3e2vis-nyto1.vercel.app READY; HTTP200 and deployed scale verified. Physical Safari NOT_RUN. PR285 review only, no merge/promotion. Owner size approval pending.

