import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const indexPath = join(root, 'dist/index.html');
let html = readFileSync(indexPath, 'utf8');
const read = path => readFileSync(join(root, path), 'utf8');
const moduleSource = read('src/domain/afk/afk-chest.mjs').replace(/^export\s+/gm, '');
const campaignSource = read('src/domain/campaign/campaign-view.mjs').replace(/^export\s+/gm, '');
const backgroundSource = read('src/domain/battle/background-registry.mjs').replace(/^export\s+/gm, '');
const idleSource = read('src/domain/character/luc-anh-idle.mjs').replace(/^export\s+/gm, '');
const lifetimeSource = read('src/ui/scene-lifetime.js').replace(/^export\s+/gm, '');
const resourcePackCacheSource = read('src/assets/campaign-resource-pack-cache.mjs').replace(/^export\s+/gm, '');
const thayMoTiming = read('battle.html').match(/const THAY_MO_IDLE_DURATIONS = (\[[^;]+\]);/);
if (!thayMoTiming) throw new Error('Campaign scene: authored Thầy Mo timing missing');
const runtime = 'const AFK_THAY_MO_IDLE_DURATIONS = ' + thayMoTiming[1] + ';\n' + read('src/ui/campaign-scene.js');
const css = read('src/ui/campaign-scene.css');
const script = `(function(){'use strict';\n${moduleSource}\n${campaignSource}\n${backgroundSource}\n${idleSource}\n${lifetimeSource}\n${resourcePackCacheSource}\n${runtime}\n})();`;
new Function(script);

// Let the existing router own entry/exit. No screen polling or second router.
const routeEnd = 'ST.screen=name; playBgm(desiredBgm(name)); }';
if (html.split(routeEnd).length !== 2) throw new Error('Campaign scene: router boundary must occur once');
html = html.replace(routeEnd, 'ST.screen=name; playBgm(desiredBgm(name)); window.HonVietCampaignScene?.onRoute(name); }');
if (html.includes('id="hv-afk-chest-runtime-v1"')) throw new Error('Campaign scene already installed');
if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Campaign scene insertion boundary missing');
html = html.replace('</head>', `<style id="hv-afk-chest-style">${css}</style></head>`);
html = html.replace('</body>', `<script id="hv-afk-chest-runtime-v1">${script}</script></body>`);
writeFileSync(indexPath, html);
console.log('Campaign scene: live squad, preparation, capped AFK claim, router-owned lifecycle');
