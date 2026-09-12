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

await import('./luc-anh-runtime-patch.mjs');
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
// WAVE-G 2026-09-12 TKT-0058…0063 — fill stubs; do not add imports.
// If Wave F (0056/0057) lands first, keep this block AFTER tkt-0057-end.mjs.
await import('./lanes/tkt-0058-story.mjs');
await import('./lanes/tkt-0059-net.mjs');
await import('./lanes/tkt-0060-team.mjs');
await import('./lanes/tkt-0061-skill-seals-a.mjs');
await import('./lanes/tkt-0062-skill-seals-b.mjs');
await import('./lanes/tkt-0063-skill-seals-c.mjs');

// The integrated battle is loaded from this embedded payload in production.
// Keep it byte-identical to the patched battle.html; otherwise the visible
// preview and the iframe can silently run different engines.
const embeddedBattle = readFileSync(join(out, 'battle.html'));
let embeddedIndex = readFileSync(join(out, 'index.html'), 'utf8');
const encodedBattle = Buffer.from(embeddedBattle, 'utf8').toString('base64');
const embeddedExpression = /const BATTLE_HTML_BASE64 = "[A-Za-z0-9+/=]+";/;
if (!embeddedExpression.test(embeddedIndex)) throw new Error('Embedded battle payload marker not found');
embeddedIndex = embeddedIndex.replace(embeddedExpression, `const BATTLE_HTML_BASE64 = "${encodedBattle}";`);
writeFileSync(join(out, 'index.html'), embeddedIndex);
console.log(`Embedded battle payload synced: ${embeddedBattle.length} bytes`);
console.log(`Static preview written to ${out}`);
