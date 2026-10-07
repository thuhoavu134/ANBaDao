# AFK travel Run — 2026-10-07

Runtime b3980fadceaa45851a7acd7601d8d31d162b64d2, baseline0875c1b, PR285 review only.
- Added canonical paged Run descriptors for Luc Anh, Dinh Loi and Ong Pho. Existing Linh Dong/Bach Dien clips retained. Ong Pho uses only authored source frames28–36 (9-frame loop); page builder honors source startFrame.
- Canonicalized external Run aliases; parked fallback uses Idle. March/approach/regroup use Run; ATK and hold-until-pack-clear unchanged. No save, reward or combat changes.
- Thay Mo has no authored Run; retained honest Idle fallback. No invented/replacement character animation.
- RED2/2, GREEN10/10, syntax3/3; full build +1659 tests pass. Full UI audit37609416517 success; normal guest AFK on390×844,430×932,1280×800 observed Ong Pho and Dinh Loi Run drawing after24.5s, with ATK/VFX retained and0runtime/asset errors. Screenshots reviewed: characters visible and contained during next-pack movement.
- Preview https://luc-than-7p35pp3nj-nyto1.vercel.app READY; deployed Run pages verified: Luc Anh61, Dinh Loi64, Ong Pho9, Linh Dong96, Bach Dien45 frames.
- General CI37609421064 failed solely at artifact upload: GitHub storage quota exhausted; later CI jobs skipped. Audit uses inline logs and completed. Physical Safari NOT_RUN, owner approval pending. No merge/promotion.

