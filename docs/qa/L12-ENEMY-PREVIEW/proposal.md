# Enemy preparation preview — proposed bounded correction, 2026-09-10

Status: AWAITING OWNER VISUAL APPROVAL, no runtime edits. Main a6b5de61ebb4d1b136b5595766aa86b3a11fff29. Work head0282c2d3fab406aab85ddb172267b8f00540a064. Browser inspected preview code235c666 in QA sandbox.

## Confirmed
- Bày trận current UI shows own power976 for one Ông Phở; four Quái KM50% labels, no enemy-power field. Do not describe own header as falsely labeled enemy power.
- preparationEnemies reads static arrays only; function-valued encounter returns []. This is a conditional unsupported case, not evidence a current campaign factory was executed or a live stage was empty.
- drawScene sends unknown enemy IDs through portraitSrc(id,master). resolvedRoleArt reads DATA.heroes and falls back to striker, so km_a/b/c/d use the same striker-00 crop.
- Actual battle drawGeneratedHero uses archetype pose atlas enemy row for first appearance, enemy team atlas embedded-04 per slot for repeated archetypes. Therefore preparation and actual battle do not share the same visual resolver.
- First stage stats and existing heroPower formula hp/8+atk*4+def*3+spd*2 give758,742,739,727 =>2966. Calculated solely from encounter stats. This is a proposed displayed score, not a balance adjustment. The existing catalog extractor only extracts initial DATA (3 entries), not all later Object.assign extensions; no complete dynamic factory audit claimed.

## Proposed visual change for owner approval
1. Keep battlefield, bench, headers, controls and slot locations. Replace only the enemy image selection with the existing combat art mapping at idle, preserving aspect/pivot and no new generated assets.
2. Keep own score, label it Ta; add a compact Địch2.966 score to the existing power area. Mobile fit must be checked on preview; no new panel or layout redesign.

## Implementation boundary after approval
Create ticket/claim/contract and RED for read-only encounter preview, art mapping parity and score independent of player level/equipment. Reuse actual combat ownership. Do not call unknown encounter factories during rendering; require a side-effect-free shared read model or explicit preview provider. No RNG, stamina, reward or save mutation during preview. If no safe provider, display unavailable state rather than fabricated opponent data.
Do not restore rejected74b3976/reverted0bac75d. No main/production release.
