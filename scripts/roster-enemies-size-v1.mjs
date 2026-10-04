import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export function replaceOne(text, before, after) {
  if (text.split(before).length !== 2) throw new Error('Roster enemy/size anchor missing or ambiguous: ' + before.slice(0, 80));
  return text.replace(before, after);
}
export async function poseRegistration(bytes) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cellW = info.width / 4, cellH = info.height / 2;
  if (cellW < 1 || cellH < 1) throw new Error('Roster pose grid changed');
  const poses = Array.from({ length: 4 }, (_, column) => {
    // Largest connected silhouette excludes fragments of neighbouring sheet cells.
    const left=Math.ceil(column*cellW),width=Math.floor((column+1)*cellW)-left,height=Math.floor(cellH);
    const visited=new Uint8Array(width*height);let largest=0,top=height,bottom=-1;
    const opaque=(x,y)=>data[(y*info.width+left+x)*4+3]>100;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const index=y*width+x;if(visited[index]||!opaque(x,y))continue;
      const stack=[index];visited[index]=1;let count=0,lo=y,hi=y;
      while(stack.length){const n=stack.pop(),cy=Math.floor(n/width),cx=n%width;count++;lo=Math.min(lo,cy);hi=Math.max(hi,cy);
        for(const [nx,ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]){
          if(nx<0||nx>=width||ny<0||ny>=height)continue;const next=ny*width+nx;
          if(!visited[next]&&opaque(nx,ny)){visited[next]=1;stack.push(next);}
        }
      }
      if(count>largest){largest=count;top=lo;bottom=hi;}
    }
    if (bottom < top) throw new Error('Empty roster pose');
    return { body: bottom - top + 1, foot: bottom + 1 };
  });
  return { cellW, cellH, poses };
}
export function patchRosterBattle(html, registrations) {
  if (html.includes('/* HV_ROSTER_ENEMIES_SIZE_V1 */')) return html;
  const start = html.indexOf('  function drawGeneratedHero(context, unit, time, progress) {');
  let end = html.indexOf('  function drawUnit(context, unit, time) {', start);
  const defeatMarker = html.lastIndexOf('  /* HV_BATTLE_DEFEAT_EXIT_V1 */', end);
  if(defeatMarker>start)end=defeatMarker;
  if (start < 0 || end < 0) throw new Error('Generated roster renderer boundary missing');
  const runtime = `  /* HV_ROSTER_ENEMIES_SIZE_V1 */
  const ROSTER_POSE_REGISTRATION=${JSON.stringify(registrations)};
  function drawGeneratedHero(context,unit,time,progress){
    // Always use our roster row. Slot, side and duplicate role do not change identity.
    const image=POSE_ATLASES[unit.archetype],pack=ROSTER_POSE_REGISTRATION[unit.archetype];
    if(!pack||!image?.complete||image.naturalWidth<1)return false;
    const column=unit.state==='run'?1:unit.state==='attack'?2:0;
    const release=unit.state==='attack'?Core.clamp((progress-.4)/.14,0,1):0;
    const paint=(col,alpha)=>{if(alpha<=0)return;const pose=pack.poses[col],scale=310/pose.body;
      context.save();context.globalAlpha*=alpha;
      context.drawImage(image,col*pack.cellW,0,pack.cellW,pose.foot,-pack.cellW*scale/2,-pose.foot*scale,pack.cellW*scale,pose.foot*scale);
      context.restore();};
    if(release>0){paint(column,1-release);paint(3,release);}else paint(column,1);
    return true;
  }

`;
  html = html.slice(0, start) + runtime + html.slice(end);
  // Old hunt inferencer can recognize legacy instance IDs even after roster conversion.
  html = replaceOne(html, 'if (unit && typeof honVietDrawHuntUnit === "function") {',
    'if (unit && !unit.sourceId && typeof honVietDrawHuntUnit === "function") {');
  return html;
}
export async function installRosterEnemiesSize(root) {
  const out = join(root, 'dist'), registrations = {};
  const roles = { guardian:'05',ranger:'06',healer:'07',striker:'08',duelist:'09',mystic:'10' };
  for (const [role, id] of Object.entries(roles)) registrations[role] = await poseRegistration(readFileSync(join(out, 'assets/battle-runtime/embedded-' + id + '.webp')));
  const battlePath = join(out, 'battle.html');
  writeFileSync(battlePath, patchRosterBattle(readFileSync(battlePath, 'utf8'), registrations));
  const hostPath = join(out, 'index.html'); let host = readFileSync(hostPath, 'utf8');
  const domain = readFileSync(join(root, 'src/domain/combat/roster-enemies.mjs'), 'utf8').replace(/^export /gm, '');
  const rosterRuntime = `\n/* HV_ROSTER_ENEMIES_V1 */\n${domain}\nfunction gameRosterEnemy(def,seed){return rosterEnemy(def,Object.fromEntries(OFFICIAL_ROSTER_12_IDS.filter(id=>DATA.heroes[id]).map(id=>[id,DATA.heroes[id]])),seed);}\n`;
  host = replaceOne(host, 'function makeCombatant(def, side, isHero){ const st=def.stats;', rosterRuntime + 'function makeCombatant(def, side, isHero){ if(side===\'foe\')def=gameRosterEnemy(def); const st=def.stats;');
  host = replaceOne(host, 'sourceHeroId:def.sourceHeroId||def.heroId||def.id, name:def.name,', 'sourceHeroId:def.sourceHeroId||def.heroId||def.id, rosterEnemy:!!def.rosterEnemy, name:def.name,');
  host = replaceOne(host, 'progression: heroBattleProgression(sourceId),', 'progression: team === "enemy" && combatant.rosterEnemy ? null : heroBattleProgression(sourceId),');
  host = replaceOne(host, 'huntForm: combatant.huntForm || null,', 'huntForm: null,');
  host = replaceOne(host, 'level: combatant.lv||heroLevel(sourceId)||1,', 'level: combatant.lv||(combatant.rosterEnemy?1:heroLevel(sourceId))||1,');
  host = replaceOne(host, 'stars: combatant.stars||heroStars(sourceId)||1,', 'stars: combatant.stars||(combatant.rosterEnemy?1:heroStars(sourceId))||1,');
  host = replaceOne(host, 'const enemies = encounter.map(enemy => ({', 'const enemies = encounter.map((enemy,index) => gameRosterEnemy(enemy,sceneState.checkpoint.battleId+\':\'+index)).map(enemy => ({');
  // Repeated roster identities are still separate enemy slots, not one deduplicated hero.
  const filterStart = host.indexOf('archetype: inferArchetype(enemy), enemy: true })).filter(enemy => {');
  const filterEnd = host.indexOf('}).slice(0, 6);', filterStart);
  if(filterStart<0||filterEnd<0)throw new Error('Preparation dedup boundary missing');
  host = host.slice(0,filterStart) + 'archetype: inferArchetype(enemy), enemy: true })).slice(0, 6);' + host.slice(filterEnd + '}).slice(0, 6);'.length);
  // Preparation and battle select the same identity seed.
  host = host.replace('gameRosterEnemy(enemy,sceneState.checkpoint.battleId+\':\'+index)', 'gameRosterEnemy(enemy)');
  const specs = {};
  const roleIds = {lac_yen:'ranger',cung_thu_tre:'ranger',co_dao_ganh_hoi:'duelist',phong_tu:'duelist',thuy_nuong_roi_nuoc:'mystic',hong_lien_dao_nuong:'striker',thach_quyen:'striker',to_diep:'duelist'};
  for(const [id,role] of Object.entries(roleIds)){const pack=registrations[role],pose=pack.poses[0];specs[id]={src:'assets/battle-runtime/embedded-'+roles[role]+'.webp',frames:1,cols:4,cellW:pack.cellW,cellH:pose.foot,ms:1000,pivot:pack.cellW/2,foot:pose.foot,body:pose.body};}
  host = replaceOne(host, 'function preparationSpriteFor(pick, time) {', 'Object.assign(spriteSpecs,'+JSON.stringify(specs)+');\nfunction preparationSpriteFor(pick, time) {');
  host = replaceOne(host, "function drawCampaignFarm(ctx, farm, w, h, layer = 'effects') {", `
// Ambient enemies use the same roster bodies as formation/combat.
CAMPAIGN_CHAPTER_WORLDS.forEach((world,index)=>{const id=['lac_yen','co_dao_ganh_hoi','thuy_nuong_roi_nuoc','hong_lien_dao_nuong','to_diep','cung_thu_tre'][index],spec=spriteSpecs[id];world.monster={...spec,heroId:id,width:spec.cellW,height:spec.cellH,motion:'step'};});
function drawCampaignFarm(ctx, farm, w, h, layer = 'effects') {`);
  host = replaceOne(host, 'ctx.drawImage(image,-monster.pivot*scale,-monster.foot*scale,monster.width*scale,monster.height*scale);ctx.restore();', 'ctx.drawImage(image,0,0,monster.cellW,monster.cellH,-monster.pivot*scale,-monster.foot*scale,monster.width*scale,monster.height*scale);ctx.restore();');
  writeFileSync(hostPath, host);
}
