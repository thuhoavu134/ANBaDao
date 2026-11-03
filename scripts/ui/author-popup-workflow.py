from pathlib import Path
R=Path(__file__).resolve().parents[2]
w=R/'workflows/approved-art-popup'; (w/'steps').mkdir(parents=True,exist_ok=True)
(w/'description.md').write_text('sửa triệt để làm thành quy trình chuẩn 1 lần áp dụng mãi\n',encoding='utf-8')
(w/'workflow.md').write_text('---\nname: Approved-art popup\ndescription: Prepare approved art, implement a real modal, verify fresh evidence and request owner review.\nstart: "[[contract]]"\nmax_events: 80\n---\nProposed standard for owner review; not executed automatically.\n',encoding='utf-8')
steps={
'contract':('task','Freeze contract','Read docs/shop-popup-repair.md and project memory. Confirm approved concept, screen data and hooks. Record immutable inputs/hashes and preserve a local checkpoint. Never change economy or merge. Produce a bounded change brief.','- [[prepare-art]]'),
'prepare-art':('task','Prepare immutable art','Use source images, never a previously patched output. Record source pixel rectangles, transformations and hashes. For these shops use scripts/ui/prepare-shop-frames.py with the project Python environment. Review alpha on checkerboard/light/dark. One complete close sprite lives outside frame art. No global erosion or repeated generative patching.','- [[implement]]'),
'implement':('task','Implement real modal','Use one owner for modal state and one close control per visible panel. Keep actual hub DOM behind translucent backdrop. Preserve transaction hooks. Replace conflicting rules instead of appending overrides. Measure text/button/pill bounds, min-height and line-height.','- [[verify]]'),
'verify':('task','Capture fresh evidence','Run focused tests first. Build once and stop on nonzero. Verify served build hash matches disk. Run node scripts/ui/verify-shop-popup.cjs; evidence goes into a unique directory, never reused screenshot names. Inspect all images directly using read. Record visual defects separately from numeric tests. Test short viewport and available browser engines; physical Safari cannot be inferred from Chromium.','- [[quality-gate]]'),
'quality-gate':('decision','Evidence gate','Run node scripts/ui/check-popup-evidence.mjs <manifest>. Require real current screenshots, successful interactions and no visible defects. Retry at most twice; record cause and return to implementation only with a source-backed fix. Otherwise block and request guidance.\n\n## Output\n```json\n{"type":"object","required":["route","reason"],"additionalProperties":false,"properties":{"route":{"enum":["owner-review","implement","blocked"]},"reason":{"type":"string"}}}\n```','- [[owner-review]] — when: current evidence passes and visual review finds no defect\n- [[implement]] — when: a known fix exists and fewer than two repair attempts were made\n- [[blocked]] — when: evidence is unavailable or two repair attempts failed'),
'owner-review':('human','Owner visual approval','Show actual revision-specific screenshots and QA link. State limitations and baseline failures. Wait for approval; this workflow never merges automatically. Update project memory and help with result.','- [[end]]'),
'blocked':('end','Blocked','Report precise blocker and preserve ledger/checkpoint. Do not report usable or merge.',''),
'end':('end','Review complete','Record owner response and evidence path. Any merge requires a separate explicit owner request.','')}
for slug,(kind,title,body,nxt) in steps.items():
 text=f'---\ntype: {kind}\ntitle: {title}\nmax_attempts: 3\n---\n\n{body}\n'
 if nxt:text+='\n## Next\n'+nxt+'\n'
 (w/'steps'/f'{slug}.md').write_text(text,encoding='utf-8')
print(w)
