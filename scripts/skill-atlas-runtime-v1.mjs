import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root=process.cwd();
const battlePath=join(root,'dist','battle.html');
const manifest=JSON.parse(readFileSync(join(root,'assets','characters','luc-anh','basic','skill.json'),'utf8'));
const cast=JSON.parse(readFileSync(join(root,'assets','characters','luc-anh','basic','cast','frames.json'),'utf8'));
const projectile=JSON.parse(readFileSync(join(root,'assets','characters','luc-anh','basic','projectile','frames.json'),'utf8'));
const impact=JSON.parse(readFileSync(join(root,'assets','characters','luc-anh','basic','impact','frames.json'),'utf8'));

for(const [name,m] of Object.entries({cast,projectile,impact})){
  if(m.schema!=='hon-viet-vfx-atlas/v1') throw new Error(`skill atlas invalid ${name} schema`);
  if(!m.layout?.frameCount||!m.layout?.cellWidth||!m.layout?.cellHeight) throw new Error(`skill atlas invalid ${name} layout`);
}
if(manifest.schema!=='hon-viet-skill/v1'||manifest.id!=='luc-anh.basic') throw new Error('Luc Anh Basic manifest invalid');

let s=readFileSync(battlePath,'utf8');
const runtime={
  id:manifest.id,
  movement:manifest.movement,
  anchors:manifest.anchors,
  timing:manifest.timing,
  cast,
  projectile,
  impact
};
const js=JSON.stringify(runtime).replace(/</g,'\\u003c');
if(!s.includes('window.__HV_SKILL_ATLAS_V1')){
  const hook='const LUC_ANH_SPATIAL=Object.freeze({';
  if(!s.includes(hook)) throw new Error('skill atlas runtime missing Luc Anh spatial hook');
  s=s.replace(hook,`window.__HV_SKILL_ATLAS_V1=window.__HV_SKILL_ATLAS_V1||Object.create(null);\n  window.__HV_SKILL_ATLAS_V1['luc-anh.basic']=Object.freeze(${js});\n  const LUC_ANH_BASIC_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.basic'];\n  ${hook}`);
}

// Make the existing proven runtime consume the manifest's anchors/timing while keeping its
// battle/turn flow intact. This is intentionally data migration, not a new combat engine.
s=s.replace('castAnchor:{x:72,y:-104},',`castAnchor:{x:LUC_ANH_BASIC_ASSET.anchors.castAnchor.x,y:LUC_ANH_BASIC_ASSET.anchors.castAnchor.y},`);
s=s.replace('hitAnchor:{x:0,y:-80},',`hitAnchor:{x:LUC_ANH_BASIC_ASSET.anchors.hitAnchor.x,y:LUC_ANH_BASIC_ASSET.anchors.hitAnchor.y},`);
s=s.replace('basic:{castDelay:900,projectileTravel:760,impactVfxDuration:720},',`basic:{castDelay:LUC_ANH_BASIC_ASSET.timing.castDelayMs,projectileTravel:LUC_ANH_BASIC_ASSET.timing.projectileTravelMs,impactVfxDuration:LUC_ANH_BASIC_ASSET.timing.impactDurationMs},`);

if(!s.includes("LUC_ANH_BASIC_ASSET=window.__HV_SKILL_ATLAS_V1['luc-anh.basic']")) throw new Error('skill atlas runtime verification failed');
writeFileSync(battlePath,s);
console.log('Skill Atlas Runtime v1: Luc Anh Basic manifest wired to proven battle flow');
