import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BATTLE_BACKGROUND_ENTRIES,
  BATTLE_BACKGROUND_BY_BATTLE_ID
} from '../src/domain/battle/background-registry.mjs';

const outputPath = join(process.cwd(), 'dist', 'battle.html');
let html = readFileSync(outputPath, 'utf8');

const blockStart = 'const BATTLE_MAP_REGISTRY=Object.freeze({';
const blockEnd = 'window.__HV_BATTLE_MAPS=Object.freeze({registry:BATTLE_MAP_REGISTRY,chapter:()=>battleChapterNumber(),source:()=>VIETNAM_HORIZON.src});';
const start = html.indexOf(blockStart);
const endAt = start < 0 ? -1 : html.indexOf(blockEnd, start);
if (start < 0 || endAt < 0) {
  throw new Error('battle-backgrounds-20-v2 missing battle map block');
}
const end = endAt + blockEnd.length;

const entriesSource = JSON.stringify(BATTLE_BACKGROUND_ENTRIES);
const byBattleIdSource = JSON.stringify(Object.fromEntries(
  Object.entries(BATTLE_BACKGROUND_BY_BATTLE_ID).map(([battleId, entry]) => [battleId, entry.index])
));

const replacement = [
  'const BATTLE_MAP_ENTRIES=Object.freeze(' + entriesSource + ');',
  '  const BATTLE_MAP_BY_BATTLE_ID=Object.freeze(' + byBattleIdSource + ');',
  '  const BATTLE_MAP_REGISTRY=Object.freeze(Object.assign(',
  '    {default:BATTLE_MAP_ENTRIES[BATTLE_MAP_ENTRIES.length-1].source},',
  '    Object.fromEntries(BATTLE_MAP_ENTRIES.map((entry,index)=>[index+1,entry.source])),',
  '    {entries:BATTLE_MAP_ENTRIES,byBattleId:BATTLE_MAP_BY_BATTLE_ID}',
  '  ));',
  '  function battleChapterNumber(){',
  '    const raw=String(EMBED_CONFIG.chapterId||EMBED_CONFIG.chapter||EMBED_CONFIG.chapterTitle||\'1\');',
  '    const m=raw.match(/\\d+/); return m?Math.max(1,Number(m[0])||1):1;',
  '  }',
  '  function battleBackgroundEntry(){',
  '    const battleId=String(EMBED_CONFIG.battleId||EMBED_CONFIG.encounterId||\'\').trim();',
  '    const exactIndex=BATTLE_MAP_REGISTRY.byBattleId[battleId];',
  '    if(Number.isInteger(exactIndex)&&BATTLE_MAP_REGISTRY.entries[exactIndex-1]) return BATTLE_MAP_REGISTRY.entries[exactIndex-1];',
  '    if(!battleId) return BATTLE_MAP_REGISTRY.entries[BATTLE_MAP_REGISTRY.entries.length-1];',
  '    let hash=17;',
  '    for(const character of battleId) hash=((hash*31)+character.codePointAt(0))>>>0;',
  '    return BATTLE_MAP_REGISTRY.entries[hash%BATTLE_MAP_REGISTRY.entries.length];',
  '  }',
  '  const VIETNAM_HORIZON = new Image();',
  '  VIETNAM_HORIZON.decoding = "async";',
  '  VIETNAM_HORIZON.src=battleBackgroundEntry().source;',
  '  window.__HV_BATTLE_MAPS=Object.freeze({registry:BATTLE_MAP_REGISTRY,chapter:()=>battleChapterNumber(),battleId:()=>String(EMBED_CONFIG.battleId||EMBED_CONFIG.encounterId||\'\'),entry:battleBackgroundEntry,source:()=>VIETNAM_HORIZON.src});'
].join('\n');

html = html.slice(0, start) + replacement + html.slice(end);

// One authored image owns the entire battlefield. Do not fit a portrait panel
// in the middle and do not draw the legacy painted arena behind it.
const backgroundStart = html.indexOf('  function drawBackground(context, time) {');
const backgroundEnd = backgroundStart < 0 ? -1 : html.indexOf('\n  function drawWeapon', backgroundStart);
if (backgroundStart < 0 || backgroundEnd < 0) {
  throw new Error('battle-backgrounds-20-v2 missing drawBackground block');
}
const backgroundFn = [
  '  function drawBackground(context,time) {',
  '    const source=VIETNAM_HORIZON;',
  '    if(source.complete&&source.naturalWidth>1){',
  '      const sw=source.naturalWidth,sh=source.naturalHeight;',
  '      const scale=Math.max(WORLD.width/sw,WORLD.height/sh);',
  '      const dw=sw*scale,dh=sh*scale;',
  '      context.save();',
  "      context.globalCompositeOperation='source-over';",
  '      context.globalAlpha=1;',
  "      context.filter='none';",
  '      context.imageSmoothingEnabled=true;',
  "      context.imageSmoothingQuality='high';",
  '      context.drawImage(source,0,0,sw,sh,(WORLD.width-dw)/2,(WORLD.height-dh)/2,dw,dh);',
  '      context.restore();',
  '      const shade=context.createLinearGradient(0,0,0,WORLD.height);',
  "      shade.addColorStop(0,'rgba(0,0,0,.02)');",
  "      shade.addColorStop(.7,'rgba(0,0,0,.04)');",
  "      shade.addColorStop(1,'rgba(0,0,0,.14)');",
  '      context.fillStyle=shade;',
  '      context.fillRect(0,0,WORLD.width,WORLD.height);',
  '      return;',
  '    }',
  "    context.fillStyle='#081416';",
  '    context.fillRect(0,0,WORLD.width,WORLD.height);',
  '    const loadingShade=context.createLinearGradient(0,0,0,WORLD.height);',
  "    loadingShade.addColorStop(0,'rgba(13,43,40,.32)');",
  "    loadingShade.addColorStop(1,'rgba(3,10,12,.72)');",
  '    context.fillStyle=loadingShade;',
  '    context.fillRect(0,0,WORLD.width,WORLD.height);',
  '  }',
  ''
].join('\n');
html = html.slice(0, backgroundStart) + backgroundFn + html.slice(backgroundEnd);

const cssMarker = '<style id="hv-image-map-override-v2">#gameCanvas,.game-viewport{background:#081416!important}.embedded-battle.reference-simple #gameCanvas{background:transparent!important}</style>';
if (!html.includes('hv-image-map-override-v2')) {
  html = html.replace('</head>', cssMarker + '\n</head>');
}
writeFileSync(outputPath, html);
console.log('Battle backgrounds v2 applied: ' + BATTLE_BACKGROUND_ENTRIES.length + ' authored stages · single full-bleed layer');
