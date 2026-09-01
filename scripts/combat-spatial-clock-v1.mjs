import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(p, 'utf8');

function replaceRegex(re, to, label, required=true){
  if(!re.test(s)){
    if(required) throw new Error(`combat-spatial-clock-v1 missing ${label}`);
    console.warn(`[combat-spatial-clock] skip ${label}`);
    return;
  }
  s=s.replace(re,to);
}

if(!s.includes('const COMBAT_CLOCK_STANDARD=')){
  const clockBlock=`  const COMBAT_CLOCK_STANDARD=Object.freeze({\n    speeds:[1,2,3],\n    approachMs:100,\n    returnMs:100,\n    postReturnBufferMs:300\n  });\n  function combatClockRate(){\n    if(state.skipAnimations)return 999;\n    if(typeof QA_SLOW_MOTION!==\"undefined\"&&QA_SLOW_MOTION)return 0.05;\n    const v=Number(state.speed)||1;\n    return COMBAT_CLOCK_STANDARD.speeds.includes(v)?v:1;\n  }\n  function combatClockDuration(milliseconds){\n    const scale=typeof EMBED_TIMING_SCALE===\"number\"?EMBED_TIMING_SCALE:1;\n    const scaled=Math.max(0,Number(milliseconds)||0)*scale;\n    if(state.skipAnimations)return 1;\n    if(typeof REDUCED_MOTION!==\"undefined\"&&REDUCED_MOTION&&!(typeof QA_SLOW_MOTION!==\"undefined\"&&QA_SLOW_MOTION))return Math.min(80,scaled);\n    return scaled/combatClockRate();\n  }\n  function motionDuration(milliseconds){return combatClockDuration(milliseconds);}\n  window.__HV_COMBAT_CLOCK=Object.freeze({standard:COMBAT_CLOCK_STANDARD,rate:()=>combatClockRate(),duration:(ms)=>combatClockDuration(ms)});`;

  const motionRe=/  function motionDuration\(milliseconds\) \{[\s\S]*?\n  \}/;
  if(motionRe.test(s)) s=s.replace(motionRe,clockBlock);
  else {
    const visualHook=/  function sleepVisualMilliseconds\(milliseconds, battleId = state\.battleId\) \{/;
    if(!visualHook.test(s)) throw new Error('combat-spatial-clock-v1 missing clock insertion hook');
    s=s.replace(visualHook,clockBlock+'\n\n  function sleepVisualMilliseconds(milliseconds, battleId = state.battleId) {');
  }
}

if(!s.includes('setTimeout(() => resolve(battleId === state.battleId), combatClockDuration(milliseconds));')){
  const sleepRe=/  function sleepVisualMilliseconds\(milliseconds, battleId = state\.battleId\) \{[\s\S]*?\n  \}/;
  replaceRegex(sleepRe,`  function sleepVisualMilliseconds(milliseconds, battleId = state.battleId) {\n    return new Promise((resolve) => {\n      setTimeout(() => resolve(battleId === state.battleId), combatClockDuration(milliseconds));\n    });\n  }`,'visual timer uses shared clock');
}

if(!s.includes('const COMBAT_SLOT_STANDARD=')){
  const slotRe=/  const FORMATION_SLOTS = Object\.freeze\(\[0, 1, 2, 3, 4, 5\]\);/;
  replaceRegex(slotRe,`  const FORMATION_SLOTS = Object.freeze([0, 1, 2, 3, 4, 5]);\n  const COMBAT_SLOT_STANDARD=Object.freeze({\n    baseline:'foot-anchor',\n    slots:FORMATION_SLOTS,\n    defaultMeleeReach:150,\n    moveType:Object.freeze({STAY:0,GROUP_CENTER:1,TARGET_ROW:2,FIXED_OFFSET:3}),\n    drawRule:'back-to-front-by-y'\n  });\n  function combatHomeAnchor(unit){return {x:Number(unit?.baseX??unit?.x??0),y:Number(unit?.baseY??unit?.y??0)};}\n  function combatAttackPoint(actor,target,{moveType=0,meleeReach=150,offset={x:0,y:0}}={}){\n    const home=combatHomeAnchor(actor),dir=actor?.team===TEAM_PLAYER?1:-1;\n    if(moveType===0||!target)return {x:home.x+(offset.x||0)*dir,y:home.y+(offset.y||0)};\n    if(moveType===2)return {x:Number(target.x)-dir*meleeReach+(offset.x||0)*dir,y:Number(target.y)+(offset.y||0)};\n    if(moveType===1){const enemies=units.filter(u=>u.team!==actor.team&&u.hp>0),cx=enemies.length?enemies.reduce((a,u)=>a+u.x,0)/enemies.length:Number(target.x),cy=enemies.length?enemies.reduce((a,u)=>a+u.y,0)/enemies.length:Number(target.y);return {x:cx-dir*meleeReach+(offset.x||0)*dir,y:cy+(offset.y||0)};}\n    return {x:WORLD.width/2+(offset.x||0)*dir,y:WORLD.height/2+(offset.y||0)};\n  }\n  window.__HV_COMBAT_SPATIAL=Object.freeze({standard:COMBAT_SLOT_STANDARD,home:(u)=>combatHomeAnchor(u),attackPoint:(a,t,o)=>combatAttackPoint(a,t,o)});`,'slot standard');
}

if(!s.includes('duration:combatClockDuration(duration)')){
  replaceRegex(/function startLucAnhFx\(kind,actor,target=null,duration=1000\)\{lucAnhFx\.push\(\{kind,actorId:actor\?\.id,targetId:target\?\.id\|\|null,team:actor\?\.team,started:performance\.now\(\),duration\}\);\}/,
    'function startLucAnhFx(kind,actor,target=null,duration=1000){lucAnhFx.push({kind,actorId:actor?.id,targetId:target?.id||null,team:actor?.team,started:performance.now(),duration:combatClockDuration(duration)});}',
    'Luc Anh VFX duration clock',false);
}

if(!s.includes('rawElapsed*combatClockRate()')){
  replaceRegex(/const meta=LUC_ANH_META\[key\],elapsed=key==="idle"\?time:Math\.max\(0,time-\(unit\.stateStarted\|\|time\)\),frame=lucAnhFrame\(key,elapsed,loop\);/,
    'const meta=LUC_ANH_META[key],rawElapsed=key==="idle"?time:Math.max(0,time-(unit.stateStarted||time)),elapsed=rawElapsed*combatClockRate(),frame=lucAnhFrame(key,elapsed,loop);',
    'Luc Anh frame clock',false);
}

if(!s.includes('const lucMoveType=LUC_ANH_SPATIAL.moveType')){
  replaceRegex(/if\(usesLucAnh\)\{\n\s*actor\.x=actor\.baseX;actor\.y=actor\.baseY;/,
`if(usesLucAnh){\n      const lucMoveType=LUC_ANH_SPATIAL.moveType[action==='skill'?'skill1':action]??0;\n      const lucOffset=LUC_ANH_SPATIAL.attackOffset[action==='skill'?'skill1':action]||{x:0,y:0};\n      const lucAttackPoint=combatAttackPoint(actor,target,{moveType:lucMoveType,meleeReach:LUC_ANH_SPATIAL.meleeReach,offset:lucOffset});\n      actor.x=actor.baseX;actor.y=actor.baseY;\n      if(lucMoveType!==0){setUnitState(actor,'run',COMBAT_CLOCK_STANDARD.approachMs);if(!await tweenUnit(actor,lucAttackPoint.x,lucAttackPoint.y,COMBAT_CLOCK_STANDARD.approachMs,battleId))return;}`,
    'Luc Anh movement standard',false);
}

if(!s.includes('const COMBAT_CLOCK_STANDARD=')||!s.includes('const COMBAT_SLOT_STANDARD=')) throw new Error('combat-spatial-clock-v1 verification failed');
writeFileSync(p,s);
console.log('Shared combat clock + slot/movement standard applied (runtime-compatible)');
