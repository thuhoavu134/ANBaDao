# UI polish review — 2026-10-08

Status: REVIEW, owner aesthetic approval pending. PR #290. No main merge.
Baseline: fef053e42a2b044dc61bd3408b4c73cf6c003ecb (includes merged #288/#289).
Tested runtime: 5f677ad3670b6870d779873c043907f88a53c6a4.
Preview: https://luc-than-lsqtxhayh-nyto1.vercel.app — READY, HTTP200, exact stylesheet/row-height/hidden-marker verified.

## Scope and ownership
Four existing screens: Thành Chính, Tướng, Trợ trận, Chinh chiến. Preserve art, icon assets, game routes, combat clocks, save, rewards and roster. No new hero. Final source CSS owner: src/ui/core-screen-polish.css, installed once before lossless packaging. One existing roster bridge emits an HTML comment instead of raw visible metadata. No new runtime listener, animation loop, image or dependency.

## Changes
- Warm parchment/brass headers, jade tabs and consistent roster/campaign dock.
- Roster controls >=44px, scrollable element filter, two-line names, four columns contained and non-overlapping rows; 620px desktop frame.
- Assist labels readable and clickable; existing local Back is no longer covered by global Home chip.
- Campaign wallet/readable dock, larger dialog close target and consistent sheets/preparation buttons.
- Hub label legibility, keyboard focus and press feedback; original layout/assets retained.

## RED / GREEN / visual iteration
- RED run37661699517 at1db394b: roster tabs39/33px, sort27px, filters32x34px. Existing navigation passed.
- Actual screenshots exposed internal grid clipping despite page overflow=false, then desktop row overlap. Extended browser checks now assert card bounds and non-overlapping rows.
- Captured dock colors yielded1.1407:1 contrast (assertion failed); final rendered gradient yields minimum5.876:1.
- Local markup test failed with visible TKT-0145 comment, then passed after HTML-comment wrapping; idempotence retained.
- Final workflow37665868908: build,1684/1684 tests, four-screen browser checks320x740/390x844/620x930/1280x800, actual roster/result flow and campaign entry/return all PASS. Zero runtime exceptions in four-screen audit.
- Photos reviewed from final logs: mobile roster fully inside viewport; desktop rows separated; original hub art retained; assist labels wrap without the earlier long vertical stack; campaign dock readable.
- CI/CD37665880417: failed only Upload battle VFX evidence; existing artifact quota. No checks disabled. Screenshots remain in workflow logs (UI_POLISH_IMAGE markers).

## Review assessment
Internal provisional scores, not owner aesthetic approval. Axes: standalone appearance / hierarchy / asset identity / color / feedback / flow / Vietnamese identity.
Hub:2/2/2/2/1/1/2=12. Heroes:2/2/2/2/1/2/2=13. Assist:2/2/2/2/1/2/2=13. Campaign:2/2/2/2/1/2/2=13.
Before images at320/390/1280; final also620. Exact620 before comparison was NOT_RUN. Physical iPhone/Safari and OS safe-area capture NOT_RUN. Reduced-motion protection is source-reviewed; no new autoplay motion. Broad product redesign/other screens outside this trial. Existing coaching toasts remain.

## Workflow
Vibe Builder + VibeLab run20261008-004315-cmbsfhy. Existing owner-approved unavailable Ticket Board waiver retained; no invented ticket claim/lease or DONE transition. Selective fresh GitHub tree; dirty local legacy checkout untouched. Next: owner plays preview and gives aesthetic feedback; merge only on explicit approval.
