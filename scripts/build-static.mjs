import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assembleLucAnhIdle } from './luc-anh-idle-asset.mjs';

const root = process.cwd();
await assembleLucAnhIdle(root);
const out = join(root, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const entries = [
  'index.html',
  'battle.html',
  'qa-dinh-loi-spacing.html',
  'qa-runtime.html',
  'skill-test.html',
  'skill-test-evidence.js',
  'splus-lab.html',
  'assets'
];

for (const entry of entries) {
  const src = join(root, entry);
  if (!existsSync(src)) continue;
  const dest = join(out, entry);
  const stats = statSync(src);
  if (stats.isDirectory()) cpSync(src, dest, { recursive: true });
  else { mkdirSync(join(dest, '..'), { recursive: true }); copyFileSync(src, dest); }
}

const { buildOngPhoPngRecovery } = await import('./ong-pho-original-png-recovery.mjs');
buildOngPhoPngRecovery(out);
// TKT-0161: HonVietCore single-source. Keep FIRST among battle.html patches —
// it verifies the inline core equals src/domain/combat/hon-viet-core.mjs and
// stamps the block id. Do not edit rules inside battle.html; edit the module.
await import('./combat-core-module-v1.mjs');
await import('./luc-anh-runtime-patch.mjs');
await import('./lanes/tkt-0088-skip.mjs');
await import('./runtime-safety-hotfix.mjs');
await import('./bgm-runtime-patch.mjs');
await import('./ios-audio-unlock-patch.mjs');
await import('./result-audio-runtime-v1.mjs');
await import('./luc-anh-retina-sharpness-patch.mjs');
await import('./runtime-qa-polish-v2.mjs');
await import('./runtime-qa-polish-v4.mjs');
await import('./runtime-qa-polish-v5.mjs');
await import('./luc-anh-spatial-pipeline-v1.mjs');
await import('./luc-anh-idle-1080-v1.mjs');
await import('./skill-atlas-runtime-v1.mjs');
await import('./skill-atlas-registry-v1.mjs');
await import('./luc-anh-local-speed-v1.mjs');
await import('./battle-visual-polish-v1.mjs');
await import('./battle-backgrounds-20-v1.mjs');
await import('./combat-domain-3q-adapter-v1.mjs');
await import('./quest-system-3q-v1.mjs');
await import('./runtime-result-actions-v5.mjs');
await import('./m0-p0-runtime-repair-v1.mjs');
await import('./summon-pool-guard-v1.mjs');
// 2026-09-28 meta-roll RNG seeding (Gọi Mộng tier + pick). Keep AFTER
// summon-pool-guard (anchors on the live doSummon body). Do not edit index.html.
await import('./meta-rng-seed-v1.mjs');
// 2026-09-28 meta-roll RNG seeding v2 (festival/bbr/forge/loot). Keep AFTER v1.
await import('./meta-rng-seed-v2.mjs');
await import('./hero-roster-phase-a-v4.mjs');
await import('./hero-detail-tabs.mjs');
await import('./runtime-mobile-render-sfx-v1.mjs');
await import('./dinh-loi-retina-portrait-v1.mjs');
await import('./skill-kit-runtime-v1.mjs');
await import('./save-contract-v1.mjs');
await import('./transaction-contract-v1.mjs');
await import('./afk-chest-runtime-v1.mjs');
await import('./forge-item-assets-v1.mjs');
await import('./settlement-navigation-v1.mjs');
await import('./return-context-v1.mjs');
await import('./opening-loop-v1.mjs');
await import('./qa-full-access-v1.mjs');
await import('./hub-dock-tray-v1.mjs');
await import('./hub-responsive-visibility-v1.mjs');
await import('./hub-icon-alpha-hotfix-v1.mjs');
await import('./battle-responsive-luc-anh-audio-v1.mjs');
await import('./battle-audio-lifecycle-v1.mjs');
await import('./battle-phase1-trace-v1.mjs');
const { buildSplusRuntime } = await import('./splus-runtime-v1.mjs');
buildSplusRuntime(root);
await import('./campaign-reference-flow-v1.mjs');
await import('./campaign-fixed-slots-v1.mjs');
await import('./account-gear-v1.mjs');
await import('./tower-runtime-v1.mjs');
await import('./expedition-runtime-v1.mjs');
await import('./shop-runtime-v1.mjs');
await import('./summon-runtime-v1.mjs');
await import('./arena-runtime-v1.mjs');
await import('./hunt-runtime-v1.mjs');
await import('./festival-runtime-v1.mjs');
await import('./daily-runtime-v1.mjs');
await import('./forge-hall-v1.mjs');
await import('./preview-journey-unlock-v1.mjs');
await import('./lanes/tkt-0037-bag.mjs');
await import('./lanes/tkt-0038-mail.mjs');
await import('./lanes/tkt-0039-jobs.mjs');
await import('./lanes/tkt-0040-guild.mjs');
await import('./lanes/tkt-0041-friends.mjs');
await import('./lanes/tkt-0042-chat.mjs');
await import('./lanes/tkt-0043-clan.mjs');
await import('./lanes/tkt-0044-vault.mjs');
await import('./lanes/tkt-0046-tower.mjs');
await import('./lanes/tkt-0047-expedition.mjs');
await import('./lanes/tkt-0048-shop.mjs');
await import('./lanes/tkt-0049-summon.mjs');
await import('./lanes/tkt-0050-arena.mjs');
await import('./lanes/tkt-0051-hunt.mjs');
await import('./lanes/tkt-0052-festival.mjs');
await import('./lanes/tkt-0053-hero-detail.mjs');
await import('./lanes/tkt-0054-daily.mjs');
await import('./lanes/tkt-0055-campaign.mjs');
await import('./lanes/tkt-0056-journey.mjs');
await import('./lanes/tkt-0057-end.mjs');
// WAVE-G 2026-09-12 TKT-0058…0063 — fill stubs; do not add imports.
// Keep AFTER tkt-0057-end.mjs.
await import('./lanes/tkt-0058-story.mjs');
await import('./lanes/tkt-0059-net.mjs');
await import('./lanes/tkt-0060-team.mjs');
await import('./lanes/tkt-0061-skill-seals-a.mjs');
await import('./lanes/tkt-0062-skill-seals-b.mjs');
await import('./lanes/tkt-0063-skill-seals-c.mjs');

// SAFARI 2026-09-12 overlay pin — visualViewport + drop body.night containing-block.
// Keep AFTER Wave G stubs. Do not restyle .cs-prepare.
await import('./overlay-safari-hotfix-v1.mjs');

// WAVE-H 2026-09-12 TKT-0065…0073 — fill stubs; do not add imports.
// Keep AFTER overlay-safari-hotfix-v1.mjs. Do not touch journey-3d / end-3d.
await import('./lanes/tkt-0065-tower-battle.mjs');
await import('./lanes/tkt-0066-hub-back.mjs');
await import('./lanes/tkt-0067-train.mjs');
await import('./lanes/tkt-0068-skill-seals-d.mjs');
await import('./lanes/tkt-0069-challenge.mjs');
await import('./lanes/tkt-0070-campaign-foes-a.mjs');
await import('./lanes/tkt-0071-campaign-foes-b.mjs');
await import('./lanes/tkt-0072-campaign-foes-c.mjs');
await import('./lanes/tkt-0073-npc-busts.mjs');

// WAVE-I 2026-09-12 TKT-0074 Auth API — fill stub; do not add imports.
// Same-origin /api on this Vercel project. Keep AFTER safari. Do not edit index.html.
await import('./lanes/tkt-0074-auth.mjs');
// 2026-09-27 login-gate modal stacking + battle-return route preservation.
// Keep AFTER tkt-0074 (anchors on the inlined gate runtime). Do not edit index.html.
await import('./login-gate-modal-topmost-v1.mjs');

// WAVE-K 2026-09-12 TKT-0083 hồ sơ avatar / giftcode / cài đặt.
// Keep AFTER auth. Capture #hubScreen .art-avatar. Do not edit index.html.
await import('./lanes/tkt-0083-profile.mjs');

// WAVE-S 2026-09-13 TKT-0108 Lục Thần lore — Chinh chiến sáu ấn. Keep AFTER profile.
await import('./lanes/tkt-0108-lore.mjs');

// WAVE-S 2026-09-13 TKT-0109 Bách Bảo Rương Kiếm Thế. Keep AFTER lore.
await import('./lanes/tkt-0109-bbr.mjs');

// WAVE-S 2026-09-13 TKT-0111 economy drip Tinh/Hoạt + nhãn B/A/S/S+.
await import('./lanes/tkt-0111-econ.mjs');

// TKT-0118 — player EXP and level gates; after all campaign/reward owners.
await import('./player-progress-v1.mjs');

// Bound Linh Đồng texture memory in both documents before syncing the iframe payload.
const { installLinhDongMemory } = await import('./linh-dong-memory-v1.mjs');
installLinhDongMemory(root);

// TKT-0145: patch the current main battle/index after memory binding so the
// canonical Linh Đồng bridge owns the final rendered payload.
await import('./linh-dong-timing-main-v1.mjs');
await import('./bach-dien-canvas-runtime-v1.mjs');

// Bạch Diện Extreme v6 must be injected after legacy battle patch owners so
// a later Linh Đồng/S+ patch cannot silently remove its closure-local helpers.
await import('./bach-dien-runtime-v6.mjs');

// TKT-0158 — host owns combat BGM on Xuất chiến; do not autoplay iframe HTMLAudio.
await import('./battle-enter-audio-v1.mjs');

// iPhone/iPadOS: release host images while preserving shared audio; retain stalled-entry recovery.
await import('./ios-battle-direct-enter-v1.mjs');

// Per-skill movement must follow canonical hero branches and precede iframe sync.
await import('./battle-skill-movement-v1.mjs');

// Readiness and build-sized atlases must precede the single iframe synchronization.
const { buildBattleReadiness } = await import('./battle-asset-readiness-v1.mjs');
await buildBattleReadiness(root);

// Result-screen motion runs after readiness so large authored atlases can reuse
// any build-sized variants before the final iframe payload is synchronized.
await import('./result-character-motion-v1.mjs');
const { installResultScreenContract } = await import('./result-screen-contract-v1.mjs');
installResultScreenContract(root);

// Final battle visual profile: keep authored clocks, but lower iOS canvas/atlas pressure.
const { buildBattleMobilePressure } = await import('./battle-mobile-pressure-v1.mjs');
await buildBattleMobilePressure(root);

// Low-memory campaign derivatives are generated before lifetime ownership is finalized.
const { installCampaignMobileAtlases } = await import('./campaign-mobile-atlas-v1.mjs');
await installCampaignMobileAtlases(root);

// Full-quality idle pages fit the preparation squad into the mobile cache.
const { installCampaignPreparationIdle } = await import('./campaign-preparation-idle-v1.mjs');
await installCampaignPreparationIdle(root);

// Repair campaign image ownership after all late host patch owners.
const { installCampaignResourceLifecycle } = await import('./campaign-resource-lifecycle-v1.mjs');
installCampaignResourceLifecycle(root);

// P0 iOS entry: battle state must start even when AudioContext fails.
await import('./battle-entry-fail-open-v1.mjs');

// Final battle-only presentation patch. Keep after every owner that rewrites battle.html.
await import('./combat-reference-presentation-v1.mjs');
await import('./battle-formation-scale-v1.mjs');
await import('./thay-mo-authored-production-v1.mjs');
await import('./authored-vfx-clock-v1.mjs');
await import('./legacy-authored-readiness-v1.mjs');
await import('./combat-authored-qa-v1.mjs');
await import('./combat-authored-audio-sync-v1.mjs');
// Keep visible authored bodies when atlas eviction temporarily interrupts idle/hit.
const { patchBattleCharacterVisibility } = await import('./battle-character-visibility-v1.mjs');
const visibilityBattlePath = join(out, 'battle.html');
writeFileSync(visibilityBattlePath, patchBattleCharacterVisibility(readFileSync(visibilityBattlePath, 'utf8')));
// 2026-09-28 auto-battle skill cadence. Keep AFTER the authored owners (anchors
// on the final decideAi text). Do not edit battle.html.
await import('./auto-skill-cadence-v1.mjs');
const { installBattleFormationTargeting } = await import('./battle-formation-targeting-v1.mjs');
installBattleFormationTargeting(root);

// Looping bodies/shields must not compete with temporary action leases.
const { installBattlePersistentPages } = await import('./battle-persistent-pages-v1.mjs');
await installBattlePersistentPages(root);
const { installBattleAiProgress } = await import('./battle-ai-progress-v1.mjs');
installBattleAiProgress(root);
// Scheduler handoff pacing only; preserve all authored action clocks/recovery.
const { installBattleTurnPacing } = await import('./battle-turn-pacing-v1.mjs');
installBattleTurnPacing(root);
// Every battlefield painter must stop after a defeated hero's fall ends.
const { installBattleDefeatExit } = await import('./battle-defeat-exit-v1.mjs');
installBattleDefeatExit(root);
const { installBattleEnemyCellCleanup } = await import('./battle-enemy-cell-cleanup-v1.mjs');
await installBattleEnemyCellCleanup(root);
const { installRosterEnemiesSize } = await import('./roster-enemies-size-v1.mjs');
await installRosterEnemiesSize(root);
const { installBattleLivingTargets } = await import('./battle-living-targets-v1.mjs');
installBattleLivingTargets(root);
const { installBattleSettlementConsistency } = await import('./battle-settlement-consistency-v1.mjs');
installBattleSettlementConsistency(root);
const { installCampaignChapterSettlement } = await import('./campaign-chapter-settlement-v1.mjs');
installCampaignChapterSettlement(root);
const { installLegacySkillMap } = await import('./legacy-skill-map-v1.mjs');
installLegacySkillMap(root);
const { installMixedCombatHealing } = await import('./mixed-combat-healing-v1.mjs');
installMixedCombatHealing(root);
const { installMixedStatusTick } = await import('./mixed-status-tick-v1.mjs');
installMixedStatusTick(root);
const { installMixedStatModifiers } = await import('./mixed-stat-modifiers-v1.mjs');
installMixedStatModifiers(root);
const { installLegacyHitDetail } = await import('./legacy-hit-detail-v1.mjs');
installLegacyHitDetail(root);
const { installMixedDamageSettlement } = await import('./mixed-damage-settlement-v1.mjs');
installMixedDamageSettlement(root);
const { installCompactDamageFloaters } = await import('./compact-damage-floaters-v1.mjs');
installCompactDamageFloaters(root);
const { installBattleVfxDirection } = await import('./battle-vfx-direction-v1.mjs');
installBattleVfxDirection(root);

// Restore versioned Basic action dispatch after authored runtime owners.
const { installVersionedBasicDispatch } = await import('./versioned-basic-dispatch-v1.mjs');
installVersionedBasicDispatch(root);

const { installBattleInstantSkip } = await import('./battle-instant-skip-v1.mjs');
installBattleInstantSkip(root);

// Kỷ Vân joins the final production owners, including skip and mixed status settlement.
const { installKyVan } = await import('./ky-van-runtime-v1.mjs');
await installKyVan(root);
const {installTieuPhong}=await import('./tieu-phong-runtime-v1.mjs');
await installTieuPhong(root);
// Tích Đạo anchors on the Kỷ Vân + Tiêu Phong patched battle text.
const {installTichDao}=await import('./tich-dao-runtime-v1.mjs');
await installTichDao(root);

// Scale the final authored clocks after the instant-skip owner has installed
// its marker short-circuit. Both paths continue sharing the same controller.
const { patchAuthoredBattleSpeed } = await import('./authored-battle-speed-v1.mjs');
writeFileSync(join(out, 'battle.html'), patchAuthoredBattleSpeed(readFileSync(join(out, 'battle.html'), 'utf8')));

// battle.html is now the single runtime source for iframe and iOS full-page combat.
// Do not duplicate ~1.5 MB of battle markup as base64 inside index.html; on mobile
// that keeps two copies alive exactly when the battle document starts parsing.
let embeddedIndex = readFileSync(join(out, 'index.html'), 'utf8');
const embeddedExpression = /const BATTLE_HTML_BASE64 = "[A-Za-z0-9+/=]*";/;
if (!embeddedExpression.test(embeddedIndex)) throw new Error('Embedded battle payload marker not found');
embeddedIndex = embeddedIndex.replace(embeddedExpression, 'const BATTLE_HTML_BASE64 = "";');
writeFileSync(join(out, 'index.html'), embeddedIndex);
console.log('Battle runtime served from battle.html; embedded base64 payload disabled.');
const { installSeamlessBattleEntry } = await import('./seamless-battle-entry-v1.mjs');
installSeamlessBattleEntry(root);
const { installCoreScreenPolish } = await import('./core-screen-polish-v1.mjs');
installCoreScreenPolish(root);
const { buildLoadingLossless } = await import('./loading-lossless-v1.mjs');
await buildLoadingLossless(root);
console.log(`Static preview written to ${out}`);





const { finalizeSummonShowcase } = await import('./summon-showcase-assets-v1.mjs');
await finalizeSummonShowcase(root);
