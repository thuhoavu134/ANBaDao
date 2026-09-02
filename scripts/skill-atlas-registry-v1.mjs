import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';

const root=process.cwd();
const charactersRoot=join(root,'assets','characters');
const battlePath=join(root,'dist','battle.html');

function walk(dir,out=[]){
  if(!existsSync(dir)) return out;
  for(const name of readdirSync(dir)){
    const p=join(dir,name),st=statSync(p);
    if(st.isDirectory()) walk(p,out);
    else if(name==='skill.json') out.push(p);
  }
  return out;
}
function readJson(p){return JSON.parse(readFileSync(p,'utf8'));}
function normalizeAtlasPart(skillPath,partPath){
  const p=resolve(dirname(skillPath),partPath);
  if(!existsSync(p)) throw new Error(`Skill Registry: missing metadata ${relative(root,p)}`);
  const meta=readJson(p);
  if(meta.schema!=='hon-viet-vfx-atlas/v1') throw new Error(`Skill Registry: bad atlas schema ${relative(root,p)}`);
  if(!meta.layout?.frameCount||!meta.layout?.cellWidth||!meta.layout?.cellHeight) throw new Error(`Skill Registry: invalid layout ${relative(root,p)}`);
  const atlasPath=resolve(dirname(p),meta.atlas);
  if(!existsSync(atlasPath)) throw new Error(`Skill Registry: missing atlas ${relative(root,atlasPath)}`);
  return {...meta,atlasPath:relative(join(root,'dist'),atlasPath).split('\\').join('/')};
}

const registry={schema:'hon-viet-skill-registry/v1',heroes:{},skills:{}};
for(const skillPath of walk(charactersRoot)){
  const skill=readJson(skillPath);
  if(skill.schema!=='hon-viet-skill/v1') throw new Error(`Skill Registry: bad skill schema ${relative(root,skillPath)}`);
  if(!skill.id||!skill.heroId||!skill.kind) throw new Error(`Skill Registry: incomplete skill ${relative(root,skillPath)}`);
  if(registry.skills[skill.id]) throw new Error(`Skill Registry: duplicate id ${skill.id}`);
  const parts={};
  for(const [name,partPath] of Object.entries(skill.parts||{})) parts[name]=normalizeAtlasPart(skillPath,partPath);
  const entry={
    id:skill.id,heroId:skill.heroId,kind:skill.kind,name:skill.name||skill.id,
    movement:skill.movement||{moveType:0,stationary:true},targeting:skill.targeting||null,
    anchors:skill.anchors||null,timing:skill.timing||{},audio:skill.audio||{},effect:skill.effect||null,
    runtime:skill.runtime||{},parts,manifestPath:relative(root,skillPath).split('\\').join('/')
  };
  registry.skills[skill.id]=entry;
  registry.heroes[skill.heroId]=registry.heroes[skill.heroId]||{};
  registry.heroes[skill.heroId][skill.kind]=skill.id;
}

if(!registry.skills['luc-anh.basic']||!registry.skills['luc-anh.skill1']||!registry.skills['luc-anh.ultimate']){
  throw new Error('Skill Registry: Lục Ảnh reference skills missing');
}

let s=readFileSync(battlePath,'utf8');
const payload=JSON.stringify(registry).replace(/</g,'\\u003c');
const marker='window.__HV_SKILL_REGISTRY_V1=';
if(!s.includes(marker)){
  const script=`<script id="hv-skill-atlas-registry-v1">\n(()=>{\n  const registry=Object.freeze(${payload});\n  window.__HV_SKILL_REGISTRY_V1=registry;\n  window.HonVietSkillAtlas=Object.freeze({\n    registry,\n    getById:(id)=>registry.skills[id]||null,\n    get:(heroId,kind)=>{const id=registry.heroes?.[heroId]?.[kind];return id?registry.skills[id]||null:null;},\n    listHero:(heroId)=>Object.values(registry.heroes?.[heroId]||{}).map(id=>registry.skills[id]).filter(Boolean),\n    listAll:()=>Object.values(registry.skills)\n  });\n})();\n</script>`;
  s=s.replace('</body>',script+'\n</body>');
}
writeFileSync(battlePath,s);
console.log(`Skill Atlas Registry v1: ${Object.keys(registry.skills).length} skills / ${Object.keys(registry.heroes).length} heroes`);
