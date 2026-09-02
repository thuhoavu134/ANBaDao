import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root=process.cwd();
const battlePath=join(root,'dist','battle.html');
const base=join(root,'assets','characters','luc-anh');
const readJson=(...parts)=>JSON.parse(readFileSync(join(base,...parts),'utf8'));

function loadSkill(folder,parts){
  const skill=readJson(folder,'skill.json');
  const loaded={};
  for(const name of parts) loaded[name]=readJson(folder,...skill.parts[name].split('/'));
  for(const [name,m] of Object.entries(loaded)){
    if(m.schema!=='hon-viet-vfx-atlas/v1') throw new Error(`skill atlas invalid ${folder}.${name} schema`);
    if(!m.layout?.frameCount||!m.layout?.cellWidth||!m.layout?.cellHeight) throw new Error(`skill atlas invalid ${folder}.${name} layout`);
  }
  if(skill.schema!=='hon-viet-skill/v1') throw new Error(`skill manifest invalid ${folder}`);
  return {skill,...loaded};
}

const basic=loadSkill('basic',['cast','projectile','impact']);
const skill1=loadSkill('skill1',['cast','vfx']);
const ultimate=loadSkill('ultimate',['cast','vfx']);
if(basic.skill.id!=='luc-anh.basic'||skill1.skill.id!=='luc-anh.skill1'||ultimate.skill.id!=='luc-anh.ultimate') throw new Error('Luc Anh skill manifest id mismatch');

function runtimeOf(bundle){
  const {skill,...parts}=bundle;
  return {id:skill.id,movement:skill.movement,targeting:skill.targeting||null,effect:skill.effect||null,anchors:skill.anchors||null,timing:skill.timing,audio:skill.audio||null,runtime:skill.runtime||null,...parts};
}
const runtimes={basic:runtimeOf(basic),skill1:runtimeOf(skill1),ultimate:runtimeOf(ultimate)};
const js=Object.fromEntries(Object.entries(runtimes).map(([k,v])=>[k,JSON.stringify(v).replace(/</g,'\\u003c')]));

let s=readFileSync(battlePath,'utf8');
if(!s.includes('window.__HV_SKILL_ATLAS_V1')){
  const hook='const LUC_ANH_SPATIAL=Object.freeze({';
  if(!s.includes(hook)) throw new Error('skill atlas runtime missing Luc Anh spatial hook');
  s=s.replace(hook,`window.__HV_SKILL_ATLAS_V1=window.__HV_SKILL_ATLAS_V1||Object.create(null);\n  window.__HV_SKILL_ATLAS_V1['luc-anh.basic']=Object.freeze(${js.basic});\n  window.__HV_SKILL_ATLAS_V1['luc-anh.skill1']=Object.freeze(${js.skill1});\n  window.__HV_SKILL_ATLAS_V1['luc-anh.ultimate']=Object.freeze(${js.ultimate});\n  const LUC_ANH_BASIC_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.basic'];\n  const LUC_ANH_SKILL1_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.skill1'];\n  const LUC_ANH_ULTIMATE_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.ultimate'];\n  ${hook}`);
}

// Data migration only: keep the proven battle/turn flow and replace its authored constants
// with manifest values. No global clock or new combat scheduler is introduced here.
s=s.replace('castAnchor:{x:72,y:-104},',`castAnchor:{x:LUC_ANH_BASIC_ASSET.anchors.castAnchor.x,y:LUC_ANH_BASIC_ASSET.anchors.castAnchor.y},`);
s=s.replace('hitAnchor:{x:0,y:-80},',`hitAnchor:{x:LUC_ANH_BASIC_ASSET.anchors.hitAnchor.x,y:LUC_ANH_BASIC_ASSET.anchors.hitAnchor.y},`);
s=s.replace('basic:{castDelay:900,projectileTravel:760,impactVfxDuration:720},',`basic:{castDelay:LUC_ANH_BASIC_ASSET.timing.castDelayMs,projectileTravel:LUC_ANH_BASIC_ASSET.timing.projectileTravelMs,impactVfxDuration:LUC_ANH_BASIC_ASSET.timing.impactDurationMs},`);
s=s.replace('skill1:{castDelay:900,settleDelay:700,vfxDuration:1650},',`skill1:{castDelay:LUC_ANH_SKILL1_ASSET.timing.castDelayMs,settleDelay:LUC_ANH_SKILL1_ASSET.timing.settleDelayMs,vfxDuration:LUC_ANH_SKILL1_ASSET.timing.vfxDurationMs},`);
s=s.replace('ultimate:{voiceLead:260,vfxDelay:760,impactHold:1850,vfxDuration:3200}',`ultimate:{voiceLead:LUC_ANH_ULTIMATE_ASSET.timing.voiceLeadMs,vfxDelay:LUC_ANH_ULTIMATE_ASSET.timing.vfxDelayMs,impactHold:LUC_ANH_ULTIMATE_ASSET.timing.impactHoldMs,vfxDuration:LUC_ANH_ULTIMATE_ASSET.timing.vfxDurationMs}`);

for(const marker of [
  "LUC_ANH_BASIC_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.basic']",
  "LUC_ANH_SKILL1_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.skill1']",
  "LUC_ANH_ULTIMATE_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.ultimate']"
]) if(!s.includes(marker)) throw new Error(`skill atlas runtime verification failed: ${marker}`);

writeFileSync(battlePath,s);
console.log('Skill Atlas Runtime v1: Luc Anh Basic + Skill1 + Ultimate manifests wired to proven battle flow');
