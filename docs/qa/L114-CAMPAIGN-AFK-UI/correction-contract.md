# TKT-0114 correction — 13/09/2026

Owner rejected floating heroes and the giant painted chest and asked Codex to take over PR108.
Remote baseline: 9ddec88ea5c98883d93ea35a400126b7b5e5dd6f. Main: d12412c.
Local source reconstructed from verified GitHub blobs; unrelated old checkout left untouched.

Scope: AC01/02/03 scene grounding and visual hierarchy; regression-check chest/party interaction.
Keep the existing popup and button flow. New environment only, no replacement hero art.
Canvas must fill its landscape explicitly; the road and feet share a coordinate plane.
Two staggered rows, stable six slot positions, depth ordering, proportional body sizes.
No animated scrolling while Run assets are missing. Run remains WAITING_ASSET.
No changes to AFK cap/rates, transaction owner, campaign progress, preparation layout or combat.

Quality: focused RED/GREEN, full build, Chrome 390x844 UI and actions; Safari NOT_RUN.
Ticket board unavailable; use ticket-file fallback already authorized in 12/09 handoff. No fabricated lease.
Release: update existing PR108 only, REVIEW. No merge or deployment. Restore touched paths from remote baseline to roll back.
