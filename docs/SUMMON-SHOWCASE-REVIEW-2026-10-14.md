# Gọi Mộng showcase review

Baseline main: 512e461994a09b48d67bc562b19c56eb94f5c1e1. User rejected the Đồ Giám placement and approved trying the concept on Gọi Mộng. PR299 is not included. Full normal game build; no main merge or production promotion authorized.

Contract: three editorial scenes, one main hero and two supporting heroes, explicit scene buttons and swipe; retain original summon/free/pity/spark/save/return owners and probabilities. Scene choice never filters the pull pool or implies rate-up. Existing official art only; static canonical preparation posters with transparent-margin trim, no source RGBA changes or animation registration changes. CSS decorative motion only; reduced motion disables it. Current posters may appear soft enlarged.

Runtime owner: src/ui/summon-runtime.js. Existing body-overlay mount remains in summon-3d-runtime.js. Remove the previous hoisted root before re-render to prevent duplicate live roots and stale actions. Spark choices remain available in an expandable section.

Acceptance: scene switching via buttons and touch; loaded canonical art; no horizontal overflow; 44px targets; browsing preserves save; actual free/1/10 transaction if current banner valid, otherwise existing guard and disabled buttons retained; one root after rerenders and reentry; back; reduced motion; no exceptions/missing assets. Verify mobile390x844, reference620x930, desktop1280x800. Physical iOS NOT RUN.

RED: local test failed with missing showcase.mjs. GREEN: 2 focused domain tests pass. Full build, Node suite, browser snapshots and interactions pending remote CI. Before screenshot captured from baseline source by review workflow, then candidate source restored and full build rerun. Images/reports emitted to CI logs because existing artifact quota blocks upload.

Missing Vibe Builder/VibeLab/ticket-board waiver was explicitly granted earlier and persists. No invented ticket claim/lock. User aesthetic approval remains final.

Review at e3d0637: full build and1733 tests PASS. CI38495379652 captured baseline and candidate, all3viewports passed button/swipe/back/reentry/save/reduced-motion checks, no missing assets or exceptions. Actual banner is already locked on main: all16 official heroes are SSR but rates require five tiers. No pull can execute; existing lock retained and no claim of successful pull transactions. Screenshot inspection found full hero names overflow on mobile; candidate correction uses short names and tests label bounds. Decorative motion remains static poster bobbing, not authored idle. Full suite and browser rerun pending for correction. Temporary unauthenticated Vercel share-link request was rejected by automatic approval review; use existing protected preview access, do not disable protection.
