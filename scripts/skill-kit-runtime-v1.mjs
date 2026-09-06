import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  HERO_SKILL_KIT_REGISTRY,
  HERO_SKILL_KIT_SCHEMA,
  HERO_SKILL_KIT_VERSION
} from '../src/domain/hero/skill-kit.mjs';

const out = join(process.cwd(), 'dist');
const registryJson = JSON.stringify(HERO_SKILL_KIT_REGISTRY);
const versionJson = JSON.stringify(HERO_SKILL_KIT_VERSION);
const schemaJson = JSON.stringify(HERO_SKILL_KIT_SCHEMA);

const runtime = `<script id="hero-skill-kit-runtime-v1">
(()=>{
  const registry=${registryJson};
  const version=${versionJson};
  const schema=${schemaJson};
  const level=value=>Math.max(1,Math.min(5,Math.round(Number(value)||1)));
  globalThis.HON_VIET_SKILL_KIT_SCHEMA=schema;
  globalThis.HON_VIET_SKILL_KIT_VERSION=version;
  globalThis.HON_VIET_SKILL_KIT_REGISTRY=registry;
  globalThis.honVietSkillKitFor=id=>registry[String(id||'')]||null;
  globalThis.honVietSkillProgressionFor=(heroId,progression={})=>{
    const raw=progression?.skillLevels||{};
    const legacySkillLevels={basic:level(raw.basic),skill:level(raw.skill),ultimate:level(raw.ultimate)};
    const kit=registry[String(heroId||'')];
    if(!kit)return {kitVersion:'legacy-v1',mapped:false,legacySkillLevels,skillLevels:{...legacySkillLevels}};
    return {kitVersion:kit.kitVersion,mapped:true,sourceKitVersion:progression?.kitVersion||'legacy-v1',legacySkillLevels,skillLevels:{basic:Math.max(legacySkillLevels.basic,legacySkillLevels.skill),skill:legacySkillLevels.skill,ultimate:legacySkillLevels.ultimate},mapping:{...kit.legacySkillMap}};
  };
})();
</script>
`;

function injectRuntime(html, file) {
  if (html.includes('id="hero-skill-kit-runtime-v1"')) throw new Error(`${file} already has skill kit runtime`);
  const matches = html.match(/<\/head>/g) || [];
  if (matches.length !== 1) throw new Error(`${file} expected one head end, found ${matches.length}`);
  return html.replace('</head>', `${runtime}</head>`);
}

function patchIndex(html) {
  const detailStart = html.indexOf('  function heroBattleProgression(heroId){');
  const detailEnd = html.indexOf('\n  function normalizeCombatant', detailStart);
  if (detailStart < 0 || detailEnd < 0) throw new Error('Skill kit progression boundary missing');
  const progression = `  function heroBattleProgression(heroId){
    const h=P.heroes?.[heroId]||{}; const build=P.heroBuilds?.[heroId]||{}; const level=Math.max(1,h.level||1);
    const ms=typeof masteryState==='function'?masteryState(heroId):{xp:0,path:null};
    const defaultSkillLevels={basic:Math.min(5,1+Math.floor(level/10)),skill:Math.min(5,1+Math.floor((level+4)/8)),ultimate:Math.min(5,1+Math.floor((level+1)/10))};
    const skillProgression=globalThis.honVietSkillProgressionFor?.(heroId,{skillLevels:defaultSkillLevels});
    return {level,stars:Math.max(1,h.stars||1),rarity:combatRarityValue(DATA.heroes?.[heroId]?.rarity),preset:build.preset||'assault',specialization:(typeof relState==='function'?(relState(heroId).choice||null):null),mastery:{xp:ms.xp||0,path:ms.path||null,rank:(typeof masteryRank==='function'?masteryRank(heroId).name:'Tập Sự')},talentPoints:Math.min(12,Math.floor(level/5)),kitVersion:skillProgression?.kitVersion||'legacy-v1',legacySkillLevels:skillProgression?.legacySkillLevels||defaultSkillLevels,skillMapping:skillProgression?.mapping||null,skillLevels:skillProgression?.skillLevels||defaultSkillLevels,equipment:battleEquipmentSummary(heroId)};
  }
`;
  html = html.slice(0, detailStart) + progression + html.slice(detailEnd);

  const combatantMarker = '      vfxSetId: `vfx:${sourceId}`,\n      team,';
  if (!html.includes(combatantMarker)) throw new Error('Skill kit combatant marker missing');
  html = html.replace(combatantMarker, '      vfxSetId: `vfx:${sourceId}`,\n      skillKit: globalThis.honVietSkillKitFor?.(sourceId) || null,\n      team,');

  const poolMarker = '      id:`pool-${sourceId}`,sourceId,visualSource:"hon-viet",team:"player",slot:index%6,';
  if (!html.includes(poolMarker)) throw new Error('Skill kit pool marker missing');
  html = html.replace(poolMarker, '      id:`pool-${sourceId}`,sourceId,visualSource:"hon-viet",skillKit:globalThis.honVietSkillKitFor?.(sourceId)||null,team:"player",slot:index%6,');
  return html;
}

let index = readFileSync(join(out, 'index.html'), 'utf8');
index = patchIndex(injectRuntime(index, 'dist/index.html'));
writeFileSync(join(out, 'index.html'), index);

let battle = readFileSync(join(out, 'battle.html'), 'utf8');
battle = injectRuntime(battle, 'dist/battle.html');
writeFileSync(join(out, 'battle.html'), battle);
console.log('Versioned hero skill kit runtime installed: Basic / Ultimate / passive mapping');
