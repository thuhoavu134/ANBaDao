import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p=join(process.cwd(),'dist','battle.html');
let s=readFileSync(p,'utf8');
if(!s.includes('window.__HV_SKILL_MANIFESTS')){
  const manifest=`<script id="hv-skill-manifest-luc-anh-basic">\n(()=>{\n  const root='assets/characters/luc-anh/basic/';\n  const cache=new Map();\n  async function loadJson(path){if(cache.has(path))return cache.get(path);const value=await fetch(root+path,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('manifest '+r.status+' '+path);return r.json();});cache.set(path,value);return value;}\n  const api={\n    id:'luc-anh.basic',\n    load:async()=>{const skill=await loadJson('skill.json');const [cast,projectile,impact]=await Promise.all([loadJson(skill.parts.cast),loadJson(skill.parts.projectile),loadJson(skill.parts.impact)]);return Object.freeze({skill,cast,projectile,impact});}\n  };\n  window.__HV_SKILL_MANIFESTS=window.__HV_SKILL_MANIFESTS||{};\n  window.__HV_SKILL_MANIFESTS[api.id]=api;\n  api.load().then(v=>{window.__HV_LUC_ANH_BASIC_MANIFEST=v;}).catch(e=>console.warn('[Hồn Việt] Lục Ảnh Basic manifest fallback to embedded runtime',e));\n})();\n</script>`;
  s=s.replace('</body>',manifest+'\n</body>');
}
writeFileSync(p,s);
console.log('Luc Anh Basic atlas manifest loader exposed with safe runtime fallback');
