import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, basename } from 'node:path';

export const CAMPAIGN_MOBILE_SCALE = 0.5;
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
    "  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = __HV_CAMPAIGN_LOW_MEMORY ? 'medium' : 'high';\n  const preparing = Boolean(sceneState.draft);",
    'campaign draw smoothing'
  );
  html = replaceOne(html, '  if (time - sceneState.lastFrame >= 32) {', '  if (time - sceneState.lastFrame >= (__HV_CAMPAIGN_LOW_MEMORY ? 50 : 32)) {', 'frame pacing');
  html = replaceOne(html, '  const dpr = Math.min(2, window.devicePixelRatio || 1);', '  const dpr = __HV_CAMPAIGN_LOW_MEMORY ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1);', 'canvas dpr');
  const anchor = 'function currentCheckpoint() {';
  const runtime = `const __HV_CAMPAIGN_MOBILE_ATLASES=${JSON.stringify(variants)};
if(__HV_CAMPAIGN_LOW_MEMORY){
  for(const group of [spriteSpecs,runSpecs])for(const spec of Object.values(group)){
    const asset=__HV_CAMPAIGN_MOBILE_ATLASES[spec?.src];if(!asset)continue;
    const scale=Number(asset.scale)||1;
    for(const key of ['cellW','cellH','strideW','strideH','pad','pivot','foot','body','w','h'])if(Number.isFinite(Number(spec[key])))spec[key]=Number(spec[key])*scale;
    spec.src=asset.src;spec.atlasWidth=asset.width;spec.atlasHeight=asset.height;
  }
}
`;
  html = replaceOne(html, anchor, runtime + anchor, 'mobile spec remap');
  return html;
}

export async function buildCampaignMobileAtlases(root = process.cwd()) {
  const { default: sharp } = await import('sharp');
  sharp.cache(false); sharp.concurrency(1);
  const out = join(root, 'dist');
  const variants = {};
  for (const src of CAMPAIGN_MOBILE_SOURCES) {
    const source = join(out, src);
    if (!existsSync(source)) throw new Error('Missing campaign atlas: ' + src);
    const targetSrc = mobileVariantPath(src), target = join(out, targetSrc);
    mkdirSync(dirname(target), { recursive: true });
    try {
      if (existsSync(target)) {
        const existing = await sharp(target).metadata();
        if (Number(existing.width) > 0 && Number(existing.height) > 0) {
          variants[src] = { src: targetSrc, width: Number(existing.width), height: Number(existing.height), scale: CAMPAIGN_MOBILE_SCALE };
          continue;
        }
      }
      const meta = await sharp(source).metadata();
      const width = Math.max(1, Math.round(Number(meta.width) * CAMPAIGN_MOBILE_SCALE));
      const height = Math.max(1, Math.round(Number(meta.height) * CAMPAIGN_MOBILE_SCALE));
      await sharp(source).resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
        .webp({ quality: 84, alphaQuality: 90, effort: 2 }).toFile(target);
      variants[src] = { src: targetSrc, width, height, scale: CAMPAIGN_MOBILE_SCALE };
    } catch (error) {
      console.warn('Campaign mobile derivative skipped:', src, error?.message || error);
    }
  }
  return variants;
}

export async function installCampaignMobileAtlases(root = process.cwd()) {
  const variants = await buildCampaignMobileAtlases(root);
  const target = join(root, 'dist', 'index.html');
  writeFileSync(target, patchCampaignMobileRuntime(readFileSync(target, 'utf8'), variants));
  return variants;
}
