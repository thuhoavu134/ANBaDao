import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, basename } from 'node:path';

export const CAMPAIGN_MOBILE_SCALE = 1;
export const CAMPAIGN_MOBILE_SOURCES = Object.freeze([
  'assets/characters/linh-dong/campaign-lite/idle-atlas.webp',
  'assets/characters/linh-dong/campaign-lite/run-atlas.webp',
  'assets/characters/bach-dien/campaign-lite/idle-atlas.webp',
  'assets/characters/bach-dien/campaign-lite/run-atlas.webp',
  'assets/characters/luc-anh/campaign-lite/idle-atlas.webp',
  'assets/characters/dinh-loi/campaign-lite/idle-atlas.webp',
  'assets/characters/thay-mo/idle-v3193-atlas.png',
  'assets/battle-runtime/embedded-12.png'
]);

export function mobileVariantPath(src) {
  const ext = extname(src);
  const name = basename(src, ext) + '.webp';
  return join(dirname(src), 'mobile-v1', name).replaceAll('\\', '/');
}

function replaceOne(input, from, to, label) {
  if (input.split(from).length !== 2) throw new Error('Campaign mobile patch missing/ambiguous ' + label);
  return input.replace(from, () => to);
}

export function patchCampaignMobileRuntime(input, variants = {}) {
  if (input.includes('/* HV_CAMPAIGN_MOBILE_ATLAS_V1 */')) return input;
  let html = input;
  html = replaceOne(html, 'const sceneState =', `/* HV_CAMPAIGN_MOBILE_ATLAS_V1 */
const __HV_CAMPAIGN_LOW_MEMORY=(()=>{try{const n=navigator,ua=String(n?.userAgent||''),platform=String(n?.platform||''),touch=Number(n?.maxTouchPoints||0),memory=Number(n?.deviceMemory||0);return /iPad|iPhone|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1)||(memory>0&&memory<=4);}catch(_){return false;}})();
const sceneState =`, 'scene state');
  html = replaceOne(html, '      maxDecodedBytes: 96 * 1024 * 1024,', '      maxDecodedBytes: __HV_CAMPAIGN_LOW_MEMORY ? 64 * 1024 * 1024 : 96 * 1024 * 1024,', 'campaign cache bytes');
  html = replaceOne(html, '      maxLoading: 2,', '      maxLoading: __HV_CAMPAIGN_LOW_MEMORY ? 1 : 2,', 'campaign cache loading');
  html = replaceOne(
    html,
    "  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';\n  const preparing = Boolean(sceneState.draft);",
    "  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';\n  const preparing = Boolean(sceneState.draft);",
    'campaign draw smoothing'
  );
  html = replaceOne(html, '  if (time - sceneState.lastFrame >= 32) {', '  if (time - sceneState.lastFrame >= 32) {', 'frame pacing');
  html = replaceOne(html, '  const dpr = Math.min(2, window.devicePixelRatio || 1);', '  const dpr = Math.min(2, window.devicePixelRatio || 1);', 'canvas dpr');
  const anchor = 'function currentCheckpoint() {';
  // P0 quality policy: keep canonical authored atlas sources on every device.
  // Cache bytes/loading are still constrained above, so memory is bounded by
  // admission/eviction rather than by destructive resampling.
  return html;

}

export async function buildCampaignMobileAtlases(root = process.cwd()) {
  // No mobile derivatives: preserve canonical authored pixels.
  return {};
}

export async function installCampaignMobileAtlases(root = process.cwd()) {
  const variants = await buildCampaignMobileAtlases(root);
  const target = join(root, 'dist', 'index.html');
  writeFileSync(target, patchCampaignMobileRuntime(readFileSync(target, 'utf8'), variants));
  return variants;
}
