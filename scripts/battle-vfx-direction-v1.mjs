import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
// Source convention is right-facing. Explicit choreography facing overrides
// team facing; sourceFacing=-1 supports imported left-facing packs exactly once.
export function battleVfxMirror(actor,sourceFacing=1){
 const override=actor?.visualFacing??actor?.facing;
 const facing=override==='left'||override===-1?-1:override==='right'||override===1?1:actor?.team==='enemy'?-1:1;
 return facing!==sourceFacing;
}
export function patchBattleVfxDirection(input){
 if(input.includes('/* HV_ENEMY_VFX_DIRECTION_V1 */'))return input;
 let html=input;
 for(const name of ['DinhLoi','LucAnh','LinhDong','BachDien']){
  const start=html.indexOf('function draw'+name+'Fx(');
  if(start<0)throw new Error('VFX direction owner missing '+name);
  let cursor=html.indexOf('{',start),depth=1;
  // These renderer bodies contain no brace-bearing strings or comments.
  for(cursor++;depth&&cursor<html.length;cursor++){if(html[cursor]==='{')depth++;else if(html[cursor]==='}')depth--;}
  const body=html.slice(start,cursor);
  const changed=body.replace(/\{baseline:([^{}]*?)\}/g,(all,options)=>options.includes('flip:')?all:'{baseline:'+options+',flip:battleVfxMirror(actor)}');
  if(!changed.includes('flip:battleVfxMirror(actor)'))throw new Error('VFX direction blitter missing '+name);
  html=html.slice(0,start)+changed+html.slice(cursor);
 }
 html=html.replace('const fromX=actor.x+58, fromY=actor.y-83, toX=target.x-10, toY=target.y-72;', 'const dir=actor.team===TEAM_ENEMY?-1:1,fromX=actor.x+58*dir,fromY=actor.y-83,toX=target.x-10*dir,toY=target.y-72;');
 return html.replace('function drawDinhLoiFx(', '/* HV_ENEMY_VFX_DIRECTION_V1 */\n'+battleVfxMirror.toString()+'\n  function drawDinhLoiFx(');
}
export function installBattleVfxDirection(root){const file=join(root,'dist','battle.html');writeFileSync(file,patchBattleVfxDirection(readFileSync(file,'utf8')));}

