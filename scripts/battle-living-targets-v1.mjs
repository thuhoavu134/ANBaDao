import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function patchBattleLivingTargets(html) {
  if (html.includes('/* HV_BATTLE_LIVING_TARGETS_V1 */')) return html;
  const once=(from,to)=>{
    if(html.split(from).length!==2)throw new Error('Living targets anchor: '+from.slice(0,100));
    html=html.replace(from,to);
  };
  // Damage/healing and the S+ engine already reject dead units. Match that
  // contract for generic follow-up statuses after a lethal first hit.
  once('  function __hvAddStatus3qAdapter(unit, status) {',
    '  function __hvAddStatus3qAdapter(unit, status) {\n    /* HV_BATTLE_LIVING_TARGETS_V1 */\n    if (!unit || unit.hp <= 0) return;');
  once('units.filter(u=>u.team===enemyTeam).forEach(u=>{const hit=lucAnhAnchor(u,"hitAnchor");',
    'units.filter(u=>u.team===enemyTeam&&u.hp>0).forEach(u=>{const hit=lucAnhAnchor(u,"hitAnchor");');
  const start=html.indexOf('    else if(key==="ultimateVfx"){const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER,slots=');
  const end=html.indexOf('\n    return true;});}',start);
  if(start<0||end<0)throw new Error('Luc Anh group VFX boundary missing');
  html=html.slice(0,start)+`    else if(key==="ultimateVfx"){
      const enemyTeam=actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER;
      const slots=units.filter(u=>u.team===enemyTeam&&u.hp>0).sort((a,b)=>Number(a.slot)-Number(b.slot));
      if(!slots.length)return false;
      // Pick a living slot when the effect begins. Keep its world anchor so
      // another death cannot teleport the same cloud during its authored clip.
      const primary=slots.find(u=>Number(u.slot)===1)||slots[0];
      const anchor=fx.anchor||(fx.anchor={x:primary.x,y:primary.y});
      context.save();context.globalCompositeOperation='source-over';
      drawLucAnhAtlas(context,key,frame,anchor.x,anchor.y,960,660,{baseline:330,screen:false,alpha:1});
      context.restore();
    }`+html.slice(end);
  once('  function ongPhoFollowUp(actor,target,multiplier,label,{forceCrit=false,addTaste=false}={}){',
    '  function ongPhoFollowUp(actor,target,multiplier,label,{forceCrit=false,addTaste=false}={}){\n    if(!actor || actor.hp<=0)return 0;');
  once('      if(secondTarget?.hp>0){\n        secondDamage=ongPhoFollowUp',
    '      if(secondTarget?.hp>0 && actor.hp>0){\n        secondDamage=ongPhoFollowUp');
  return html;
}
export function installBattleLivingTargets(root) {
  const path=join(root,'dist','battle.html');
  writeFileSync(path,patchBattleLivingTargets(readFileSync(path,'utf8')));
}
