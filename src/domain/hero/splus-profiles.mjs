import {BE_AN_HERO} from './be-an.mjs';
import { SPLUS_HEROES } from './splus-catalog.mjs';
import { SPLUS_PROFILE_VERSION } from './splus-profile-data.mjs';
import { SPLUS_BUTTON_BRIEFS } from './splus-skill-art.mjs';

export const SPLUS_ATLASES=Object.freeze(Object.fromEntries(Object.entries({
  metal:[0,250,492,733,976,1216,1459,1710],soul:[0,251,506,758,1011,1265,1522,1868],
  water:[0,251,500,748,997,1250,1503,1765],fire:[0,254,497,740,984,1228,1471,1740],
  wood:[0,259,511,766,1020,1274,1529,1800],dream:[0,255,512,775,1035,1294,1555,1865]
}).map(([element,rows])=>[element,Object.freeze({src:`/assets/skill-buttons/splus-v2/${element}.webp`,source:`assets/skill-buttons/splus-v2/${element}.png`,width:821,height:element==='water'?1915:1916,rows})])));
const slots=['passive','skill','ultimate'];
const frames={passive:'circle-silver-bronze',skill:'octagon-gold-cooldown',ultimate:'lotus-dragon-gold-rage'};
// The generated atlas has touching alpha-fringed ornaments between rows and
// columns. Keep the source rect inset before it is exposed as an SVG viewBox;
// CSS overflow cannot hide pixels that are still inside that viewBox.
const crop=Object.freeze({x:12,y:12});
export const SPLUS_SKILL_ICONS=Object.freeze(SPLUS_HEROES.flatMap(h=>{
  const row=SPLUS_HEROES.filter(x=>x.element===h.element).findIndex(x=>x.id===h.id),atlas=SPLUS_ATLASES[h.element];
  return slots.map((slot,column)=>Object.freeze({id:`splus.button.${h.key}.${slot}`,heroId:h.id,slot,element:h.element,
    ...SPLUS_BUTTON_BRIEFS[h.key][column],frame:frames[slot],atlas:atlas.src,width:atlas.width,height:atlas.height,
    crop,
    rect:[column*274+crop.x,atlas.rows[row]+crop.y,(column===2?273:274)-crop.x*2,atlas.rows[row+1]-atlas.rows[row]-crop.y*2],
    generation:'imagegen-atlas/2026-09-08',status:'generated-review'}));
}));
export const SPLUS_PROFILES=Object.freeze(SPLUS_HEROES.map(h=>Object.freeze({...h,hudIconId:h.iconId,version:SPLUS_PROFILE_VERSION,
  skills:Object.freeze(Object.fromEntries(slots.map(slot=>[slot,Object.freeze({...(slot==='passive'?h.passive:h.actions[slot]),
    id:`splus.skill.${h.key}.${slot}`,heroId:h.id,slot,iconId:`splus.button.${h.key}.${slot}`})])))
})));
const profiles=new Map(SPLUS_PROFILES.map(p=>[p.id,p]));
export function getSplusSkill(heroId,slot){return slots.includes(slot)?profiles.get(heroId)?.skills[slot]??null:null;}
// Runtime needs descriptions and UVs, not artist prompts or source paths.
export function splusProfilePayload(){return {version:SPLUS_PROFILE_VERSION,profiles:[...SPLUS_PROFILES,{...BE_AN_HERO,skills:Object.fromEntries(slots.map(slot=>{const skill=slot==='passive'?BE_AN_HERO.passive:BE_AN_HERO.actions[slot];return [slot,{...skill,shortName:skill.name,effects:skill.effects||[],slot,iconId:'splus.button.be_an.'+slot}];}))}],
  skillIcons:[...slots.map(slot=>({id:'splus.button.be_an.'+slot,heroId:BE_AN_HERO.id,slot,atlas:'assets/characters/be-an/avatar.webp',width:352,height:224,rect:[90,40,172,166]})),...SPLUS_SKILL_ICONS.map(({prompt,description,generation,status,...icon})=>icon)]};}

