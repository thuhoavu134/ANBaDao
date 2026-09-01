import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(p, 'utf8');

function mustReplace(from, to, label) {
  if (!s.includes(from)) throw new Error(`combat-spatial-clock-v1 missing ${label}`);
  s = s.replace(from, to);
}

if (!s.includes('const COMBAT_CLOCK_STANDARD=')) {
  mustReplace(
`  function motionDuration(milliseconds) {
    const playbackRate = QA_SLOW_MOTION ? 0.05 : state.speed;
    const scaled = milliseconds * EMBED_TIMING_SCALE;
    return REDUCED_MOTION && !QA_SLOW_MOTION ? Math.min(80, scaled) : scaled / playbackRate;
  }`,
`  const COMBAT_CLOCK_STANDARD=Object.freeze({
    speeds:[1,2,3],
    approachMs:100,
    returnMs:100,
    postReturnBufferMs:300
  });
  function combatClockRate(){
    if(state.skipAnimations)return 999;
    if(QA_SLOW_MOTION)return 0.05;
    const v=Number(state.speed)||1;
    return COMBAT_CLOCK_STANDARD.speeds.includes(v)?v:1;
  }
  function combatClockDuration(milliseconds){
    const scaled=Math.max(0,Number(milliseconds)||0)*EMBED_TIMING_SCALE;
    if(state.skipAnimations)return 1;
    if(REDUCED_MOTION&&!QA_SLOW_MOTION)return Math.min(80,scaled);
    return scaled/combatClockRate();
  }
  function motionDuration(milliseconds){return combatClockDuration(milliseconds);}
  window.__HV_COMBAT_CLOCK=Object.freeze({standard:COMBAT_CLOCK_STANDARD,rate:()=>combatClockRate(),duration:(ms)=>combatClockDuration(ms)});`,
  'common combat clock'
  );
}

mustReplace(
`  function sleepVisualMilliseconds(milliseconds, battleId = state.battleId) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(battleId === state.battleId), Math.max(0, Number(milliseconds) || 0));
    });
  }`,
`  function sleepVisualMilliseconds(milliseconds, battleId = state.battleId) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(battleId === state.battleId), combatClockDuration(milliseconds));
    });
  }`,
  'visual timer uses shared clock'
);

if (!s.includes('const COMBAT_SLOT_STANDARD=')) {
  mustReplace(
`  const FORMATION_SLOTS = Object.freeze([0, 1, 2, 3, 4, 5]);`,
`  const FORMATION_SLOTS = Object.freeze([0, 1, 2, 3, 4, 5]);
  const COMBAT_SLOT_STANDARD=Object.freeze({
    baseline:'foot-anchor',
    slots:FORMATION_SLOTS,
    defaultMeleeReach:150,
    moveType:Object.freeze({STAY:0,GROUP_CENTER:1,TARGET_ROW:2,FIXED_OFFSET:3}),
    drawRule:'back-to-front-by-y'
  });
  function combatHomeAnchor(unit){return {x:Number(unit?.baseX??unit?.x??0),y:Number(unit?.baseY??unit?.y??0)};}
  function combatAttackPoint(actor,target,{moveType=0,meleeReach=150,offset={x:0,y:0}}={}){
    const home=combatHomeAnchor(actor),dir=actor?.team===TEAM_PLAYER?1:-1;
    if(moveType===0||!target)return {x:home.x+(offset.x||0)*dir,y:home.y+(offset.y||0)};
    if(moveType===2)return {x:Number(target.x)-dir*meleeReach+(offset.x||0)*dir,y:Number(target.y)+(offset.y||0)};
    if(moveType===1){const enemies=units.filter(u=>u.team!==actor.team&&u.hp>0),cx=enemies.length?enemies.reduce((a,u)=>a+u.x,0)/enemies.length:Number(target.x),cy=enemies.length?enemies.reduce((a,u)=>a+u.y,0)/enemies.length:Number(target.y);return {x:cx-dir*meleeReach+(offset.x||0)*dir,y:cy+(offset.y||0)};}
    return {x:WORLD.width/2+(offset.x||0)*dir,y:WORLD.height/2+(offset.y||0)};
  }
  window.__HV_COMBAT_SPATIAL=Object.freeze({standard:COMBAT_SLOT_STANDARD,home:(u)=>combatHomeAnchor(u),attackPoint:(a,t,o)=>combatAttackPoint(a,t,o)});`,
  'slot standard'
  );
}

if (s.includes('function startLucAnhFx(kind,actor,target=null,duration=1000){lucAnhFx.push({kind,actorId:actor?.id,targetId:target?.id||null,team:actor?.team,started:performance.now(),duration});}')) {
  s=s.replace(
    'function startLucAnhFx(kind,actor,target=null,duration=1000){lucAnhFx.push({kind,actorId:actor?.id,targetId:target?.id||null,team:actor?.team,started:performance.now(),duration});}',
    'function startLucAnhFx(kind,actor,target=null,duration=1000){lucAnhFx.push({kind,actorId:actor?.id,targetId:target?.id||null,team:actor?.team,started:performance.now(),duration:combatClockDuration(duration)});}'
  );
}

if (s.includes('const meta=LUC_ANH_META[key],elapsed=key==="idle"?time:Math.max(0,time-(unit.stateStarted||time)),frame=lucAnhFrame(key,elapsed,loop);')) {
  s=s.replace(
    'const meta=LUC_ANH_META[key],elapsed=key==="idle"?time:Math.max(0,time-(unit.stateStarted||time)),frame=lucAnhFrame(key,elapsed,loop);',
    'const meta=LUC_ANH_META[key],rawElapsed=key==="idle"?time:Math.max(0,time-(unit.stateStarted||time)),elapsed=rawElapsed*combatClockRate(),frame=lucAnhFrame(key,elapsed,loop);'
  );
}

if (s.includes('if(usesLucAnh){\n      actor.x=actor.baseX;actor.y=actor.baseY;')) {
  s=s.replace(
`if(usesLucAnh){
      actor.x=actor.baseX;actor.y=actor.baseY;`,
`if(usesLucAnh){
      const lucMoveType=LUC_ANH_SPATIAL.moveType[action==='skill'?'skill1':action]??0;
      const lucOffset=LUC_ANH_SPATIAL.attackOffset[action==='skill'?'skill1':action]||{x:0,y:0};
      const lucAttackPoint=combatAttackPoint(actor,target,{moveType:lucMoveType,meleeReach:LUC_ANH_SPATIAL.meleeReach,offset:lucOffset});
      actor.x=actor.baseX;actor.y=actor.baseY;
      if(lucMoveType!==0){setUnitState(actor,'run',COMBAT_CLOCK_STANDARD.approachMs);if(!await tweenUnit(actor,lucAttackPoint.x,lucAttackPoint.y,COMBAT_CLOCK_STANDARD.approachMs,battleId))return;}`
  );
}

writeFileSync(p,s);
console.log('Shared combat clock + slot/movement standard applied');
