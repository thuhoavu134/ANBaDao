import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const MAIN_CITY_ART = 'assets/hub/an-ba-dao/main-city-tower-cranes-v1.webp';
export function patchMainCityArt(html) {
  if (html.includes('id="hv-main-city-art-v1"')) return html;
  const background = /assets\/hub\/background-v3240\/vietnamese-cloud-citadel(?:\.lossless-v1\.webp|\.png)/g;
  const foreground = /<img class="hub-foreground-depth" src="assets\/hub\/foreground-v3240\/vietnamese-gateway-foreground(?:\.lossless-v1\.webp|\.png)" alt="" draggable="false">/g;
  if (!background.test(html) || !foreground.test(html) || !html.includes('</head>')) {
    throw new Error('Main city art: expected hub background/foreground anchors missing');
  }
  // The approved preview already includes the gateway and stairs.
  // Remove only the old decorative image, retaining live controls and handlers.
  return html.replace(background, MAIN_CITY_ART).replace(foreground, '').replace('</head>', `<style id="hv-main-city-art-v1">
#hubScreen .hv-parallax-layer.hv-daylight-base{filter:none!important;object-position:50% 50%!important}
</style>\n</head>`);
}

export function installMainCityArt(root) {
  if (!existsSync(join(root, 'dist', MAIN_CITY_ART))) throw new Error('Main city art asset missing');
  const file = join(root, 'dist/index.html');
  writeFileSync(file, patchMainCityArt(readFileSync(file, 'utf8')));
}
