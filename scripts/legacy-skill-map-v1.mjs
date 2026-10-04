import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';import{mapLegacyCombatSkill}from'../src/domain/combat/legacy-skill-map.mjs';
export function patchLegacySkillMap(host){
 if(host.includes('/* HV_LEGACY_SKILL_MAP_V1 */'))return host;
 const start=host.indexOf('  function mapSkill(combatant) {'),end=host.indexOf('  function combatRarityValue',start);
 if(start<0||end<0||host.indexOf('  function mapSkill(combatant) {',start+1)>=0)throw new Error('Legacy skill bridge owner anchor missing or ambiguous');
 return host.slice(0,start)+'  /* HV_LEGACY_SKILL_MAP_V1 */\n'+mapLegacyCombatSkill.toString()+'\n  function mapSkill(combatant) { return mapLegacyCombatSkill(combatant); }\n\n'+host.slice(end);
}
export function installLegacySkillMap(root){const p=join(root,'dist','index.html');writeFileSync(p,patchLegacySkillMap(readFileSync(p,'utf8')));}
