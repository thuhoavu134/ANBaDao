// Reads only selected data/stat functions from the freshly generated host.
// Deliberately not a battle simulator: no invented legacy skill resolution.
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {mapLegacyCombatSkill} from '../src/domain/combat/legacy-skill-map.mjs';
import {rosterEnemy} from '../src/domain/combat/roster-enemies.mjs';
const between=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);if(start<0||end<0)throw new Error('Canonical host anchor missing: '+a);return s.slice(start,end);};
export function loadCampaignContent(host=readFileSync('dist/index.html','utf8'),lore=readFileSync('src/ui/lore-luc-than-runtime.js','utf8')){
 const ctx=vm.createContext({window:{}});
 vm.runInContext(between(host,'const DATA={','const NPC=')+'\nconst SCENES=DATA.scenes;',ctx,{timeout:1000});
 const assignments=host.matchAll(/Object\.assign\((?:DATA\.(?:heroes|encounters)|SCENES),\{/g);
 for(const m of assignments){const end=host.indexOf('\n});',m.index);if(end<0)throw new Error('Unclosed canonical data assignment');vm.runInContext(host.slice(m.index,end+4),ctx,{timeout:1000});}
 vm.runInContext(between(host,'function chapterBattleSequence(idx){','function startChapter('),ctx,{timeout:1000});

 vm.runInContext(between(host,'const OFFICIAL_ROSTER_12_IDS=','\n'),ctx,{timeout:1000});
 // A declaration returns undefined; read its value explicitly.
 const rosterIds=vm.runInContext('OFFICIAL_ROSTER_12_IDS.slice()',ctx);

 const zero=()=>({hp:0,atk:0,def:0,spd:0,mp:0});
 Object.assign(ctx,{P:{heroes:{},squad:Array.from(rosterIds).slice(0,6).map(id=>({id}))},heroEquipBonus:zero,setPcts:()=>({pct:0,spd:0}),forgeMoldBonus:zero,guildPct:()=>({stat:null,pct:0}),clanPct:()=>0,awakeningRank:()=>0});
 // SSR base-star helpers (HERO_RARITY_STARS_V1) live before SAVE_KEY; heroStars() depends on them.
 if(host.includes('/* HERO_RARITY_STARS_V1 */'))vm.runInContext(between(host,'/* HERO_RARITY_STARS_V1 */','const SAVE_KEY='),ctx,{timeout:1000});
 vm.runInContext(between(host,'function heroLevel(id){','const TRANSACTION_CONTRACT_SCHEMA'),ctx,{timeout:1000});
 vm.runInContext('const CHAPTERS=Array(6);\n'+between(lore,'  const SEAL_STAGES','  function pickShardHero')+'\nexpandSeals();globalThis.DATA=DATA;globalThis.sequence=chapterBattleSequence;globalThis.loot=stageLoot;',ctx,{timeout:1000});
 return {data:ctx.DATA,ids:Array.from(rosterIds),sequence:ch=>Array.from(ctx.sequence(ch)),loot:(ch,s)=>({...ctx.loot(ch,s)}),baseStars:id=>(typeof ctx.rarityBaseStars==='function'?ctx.rarityBaseStars(ctx.DATA.heroes[id]):1),heroStats:(id,level=1,stars=null)=>{if(!ctx.DATA.heroes[id])throw new Error('Unknown roster hero '+id);if(stars==null)stars=typeof ctx.rarityBaseStars==='function'?ctx.rarityBaseStars(ctx.DATA.heroes[id]):1;if(!Number.isInteger(level)||level<1||!Number.isInteger(stars)||stars<1||stars>6)throw new Error('Invalid progression');ctx.P.heroes[id]={level,stars};return {...ctx.heroStats(id)};},levelCost:(id,level)=>{ctx.P.heroes[id]={level};return ctx.levelCost(id);}};
}
export function campaignProgressionAudit(content=loadCampaignContent()){
 const roster=Object.fromEntries(content.ids.map(id=>[id,content.data.heroes[id]]));
 if(content.ids.some(id=>!roster[id]?.stats))throw new Error('Incomplete canonical roster');
 const chapters=Array.from({length:6},(_,chapter)=>({chapter:chapter+1,stages:content.sequence(chapter).map((battleId,index)=>{
   const raw=content.data.encounters[battleId];if(!Array.isArray(raw)||!raw.length||raw.length>6)throw new Error('Invalid canonical wave '+battleId);
   const foes=raw.map(def=>rosterEnemy(def,roster));return{stage:index+1,battleId,boss:(index+1)%6===0,enemies:foes.map((f,slot)=>({slot:slot+1,sourceId:f.sourceHeroId||f.id,stats:{...f.stats},skillMapping:mapLegacyCombatSkill({...f,side:"foe"})})),duplicateRosterInstances:foes.length-new Set(foes.map(f=>f.sourceHeroId||f.id)).size,sealLoot:content.loot(chapter,index)};
 })}));
 // SSR khởi đầu 5 sao thật (owner 2026-10-27): profile dùng sao gốc theo độ hiếm.
const profiles=[1,5,10].map(level=>({level,stars:'rarity-base',heroes:content.ids.map(id=>({id,stars:content.baseStars(id),stats:content.heroStats(id,level),skillMapping:mapLegacyCombatSkill({...content.data.heroes[id],side:"ally"}),goldFromLevel1:Array.from({length:level-1},(_,i)=>content.levelCost(id,i+1)).reduce((a,b)=>a+b,0)}))}));
 return{mirrorBossSquad:content.ids.slice(0,6),scope:'Canonical generated-host content and bare hero-stat audit; NOT a win-rate or campaign combat simulation. Gear, guild, clan, awakening, relationship and mastery bonuses explicitly zero. Profiles are comparisons, not ownership or affordability claims. Seal loot excludes base battle, first-clear, quest, chapter, world, daily and AFK rewards.',chapters,profiles};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(campaignProgressionAudit(),null,2));
