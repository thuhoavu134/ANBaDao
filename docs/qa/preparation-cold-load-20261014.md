# Preparation first-body loading

Baseline main ebe7b8596f91a9846822d144330d5b345eb9d19f. User screenshot shows a six-slot formation with Kỷ Vân, Tiêu Phong, Linh Đồng and Bạch Diện bodies missing while labels and bench portraits are present. User says bodies eventually appear.

Reproduced scheduling problem: the renderer requests each hero's poster, current animation page and next page before moving to the next hero; cold animation clocks continue to request different pages. The two-decoder FIFO also lets previously queued AFK animation delay first-body posters.

Fix: request all canonical single-frame body posters in a first pass. Until those bodies are loaded, display the available posters and defer preparation animation pages. Poster jobs precede queued animation in the existing bounded cache; active decodes are not preempted. Once ready, original idle timing/pages/pivots resume. No portrait substitution, new art, raised memory cap, combat or save changes.

RED: cold render requested only two posters among its first six requests, and an old queued page started before the later body. GREEN: focused tests cover request order, no page churn while bodies load, six actual body draws, transition to pages, bounded decoder priority and generated owner priority propagation.

Scoped CI runs the full normal build/test suite and actual preparation UI at 390x844 and 1280x800, with browser cache disabled and real animation-image requests delayed 1800 ms. It measures first draws for the user's six heroes, verifies six visible bodies in one frame, waits for all idle animations, checks back/reopen and runtime/asset errors, and emits screenshots to logs. This is a controlled scheduling regression, not a physical Safari/network performance guarantee. Physical device and deployment remain unverified. No merge authorization assumed.
