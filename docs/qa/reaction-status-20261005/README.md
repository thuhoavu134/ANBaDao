# Reaction status QA — 2026-10-05

See contract.md for scope. red.tap captures the initial failing native reaction cases; preview-red.tap captures blocked-regen preview inconsistency. regression-final.tap is the final 97/97 focused PASS run, including 13 new cases. Earlier green.tap and regression.tap are intermediate passing checkpoints.

The generated battle fixture uses the existing dead-recipient guard and a minimal index shell for the sparse adapter. Five inline scripts parse. This is not a full build or device/browser acceptance. Full CI evidence will be attached to PR #281 after pushing the continuation. Physical Safari and production deployment NOT_RUN.
