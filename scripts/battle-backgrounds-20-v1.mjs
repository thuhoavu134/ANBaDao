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
  throw new Error('battle-backgrounds-20-v1 missing battle map block');
}
const end = endAt + blockEnd.length;

const entriesSource = JSON.stringify(BATTLE_BACKGROUND_ENTRIES);
const byBattleIdSource = JSON.stringify(Object.fromEntries(
  Object.entries(BATTLE_BACKGROUND_BY_BATTLE_ID).map(([battleId, entry]) => [battleId, entry.index])
));

const replacement = `const BATTLE_MAP_ENTRIES=Object.freeze(${entriesSource});
  const BATTLE_MAP_BY_BATTLE_ID=Object.freeze(${byBattleIdSource});
  const BATTLE_MAP_REGISTRY=Object.freeze(Object.assign(
    {default:BATTLE_MAP_ENTRIES[BATTLE_MAP_ENTRIES.length-1].source},
    Object.fromEntries(BATTLE_MAP_ENTRIES.map((entry,index)=>[index+1,entry.source])),
    {entries:BATTLE_MAP_ENTRIES,byBattleId:BATTLE_MAP_BY_BATTLE_ID}
  ));
  function battleChapterNumber(){
    const raw=String(EMBED_CONFIG.chapterId||EMBED_CONFIG.chapter||EMBED_CONFIG.chapterTitle||'1');
    const m=raw.match(/\\d+/); return m?Math.max(1,Number(m[0])||1):1;
  }
  function battleBackgroundEntry(){
    const battleId=String(EMBED_CONFIG.battleId||EMBED_CONFIG.encounterId||'').trim();
    const exactIndex=BATTLE_MAP_REGISTRY.byBattleId[battleId];
    if(Number.isInteger(exactIndex)&&BATTLE_MAP_REGISTRY.entries[exactIndex-1]) return BATTLE_MAP_REGISTRY.entries[exactIndex-1];
    if(!battleId) return BATTLE_MAP_REGISTRY.entries[BATTLE_MAP_REGISTRY.entries.length-1];
    let hash=17;
    for(const character of battleId) hash=((hash*31)+character.codePointAt(0))>>>0;
    return BATTLE_MAP_REGISTRY.entries[hash%BATTLE_MAP_REGISTRY.entries.length];
  }
  const VIETNAM_HORIZON = new Image();
  VIETNAM_HORIZON.decoding = "async";
  VIETNAM_HORIZON.src=battleBackgroundEntry().source;
  window.__HV_BATTLE_MAPS=Object.freeze({registry:BATTLE_MAP_REGISTRY,chapter:()=>battleChapterNumber(),battleId:()=>String(EMBED_CONFIG.battleId||EMBED_CONFIG.encounterId||''),entry:battleBackgroundEntry,source:()=>VIETNAM_HORIZON.src});`;

html = html.slice(0, start) + replacement + html.slice(end);

if (!html.includes('id="hv-image-map-override-v1"')) {
  throw new Error('battle-backgrounds-20-v1 expected image map override marker');
}

writeFileSync(outputPath, html);
console.log(`Battle backgrounds v1 applied: ${BATTLE_BACKGROUND_ENTRIES.length} authored stages`);
