// One presentation owner for every landed hit and every battlefield foot shadow.
// Combat/animation owners decide WHEN and HOW MUCH; this module never settles HP.
function battleFeedbackBody(unit,time=performance.now()){
  const body=typeof battleCharacterBody==='function'?battleCharacterBody(unit):
    {centerX:unit.x,topY:unit.y-140,footY:unit.y,height:140};
  let position=null,visible=true;
  // These authored actors move their painted body without mutating tactical slots.
  // Reuse their pose/phase functions, rather than painting shadows at the home slot.
  const spear=unit._hongThuongAction,shadow=unit._tichDaoAction;
  if(unit.hp>0&&spear&&spear.battleId===state.battleId&&typeof hongThuongBodyPos==='function'){
    const hurt=['hurt','hit'].includes(unit.state)&&time-unit.stateStarted<HONG_THUONG_META.clips.hit.durationMs;
    if(!hurt)position=hongThuongBodyPos(unit,hongThuongElapsed(spear),spear.action);
  }
  if(unit.hp>0&&shadow&&shadow.battleId===state.battleId&&typeof tichDaoBodyPos==='function'){
    const hurt=['hurt','hit'].includes(unit.state)&&time-unit.stateStarted<TICH_DAO_META.clips.hit.durationMs;
    if(!hurt){
      let elapsed=tichDaoElapsed(shadow);
      if(shadow.rainDelay&&elapsed>=3150)elapsed-=Math.min(elapsed-3150,shadow.rainDelay);
      position=tichDaoBodyPos(unit,elapsed,shadow.action);
      if(shadow.action==='ultimate')visible=Boolean(tichDaoPhaseAt(elapsed)?.visible);
    }
  }
  const dx=position?position.x-unit.x:0,dy=position?position.y-unit.y:0;
  return {...body,centerX:body.centerX+dx,topY:body.topY+dy,footY:body.footY+dy,visible};
}
function addBattleHitFloater(unit,text,color,large=false){
  if(!unit)return;
  const raw=String(text??'');
  const critical=raw.match(/^(?:BẠO KÍCH|BAO KICH|CRIT)\s*([−-]?\d[\d.,]*)$/i);
  const damage=critical||raw.match(/^(?:[−-]\s*\d[\d.,]*|(?:PHẢN|VIỆN KÍCH|BIẾN CỐ|⚗)\s*[−-]?\s*\d[\d.,]*)$/i);
  const isDamage=Boolean(damage),isCrit=Boolean(critical),now=performance.now();
  const body=battleFeedbackBody(unit),x=body.centerX,y=body.topY-20;
  // Compact overlapping staircase: newest at the head, earlier hits above/outward.
  // Reflow on contact, including rows that have already risen, so slow hits do not
  // leave holes. Preserve each row's lifetime and value; never aggregate damage.
  const rows=floaters.filter(f=>f.unitId===unit.id&&f.isDamage===isDamage&&f.life>0);
  // The visible queue is capped, not the combat/event history.
  if(isDamage)while(rows.length>2){
    const retired=rows.shift(),index=floaters.indexOf(retired);
    if(index>=0)floaters.splice(index,1);
  }
  const gap=isDamage?14:22;
  const inward=typeof TEAM_ENEMY!=='undefined'&&unit.team===TEAM_ENEMY?-1:1;
  let ceiling=y-gap;
  for(let i=rows.length-1;i>=0;i--){
    const row=rows[i],rank=rows.length-i;
    row.y=isDamage?y-rank*gap:Math.min(row.y,ceiling);
    if(isDamage){
      row.x=x-inward*rank*3;
      row.anchorX=x;row.anchorY=body.topY;
    }
    ceiling=row.y-gap;
  }
  const normalized=critical?'BẠO KÍCH '+critical[1]:isDamage?'−'+raw.match(/\d[\d.,]*$/)[0]:raw;
  floaters.push({unitId:unit.id,createdAt:now,x,y,text:normalized,color,large,isDamage,isCrit,
    life:isDamage?1.05:1,drift:0,anchorX:x,anchorY:body.topY,followVictim:true});
}
function updateBattleHitFloater(floater,delta){
  const target=getUnit(floater.unitId);
  if(floater.followVictim&&target){
    const body=battleFeedbackBody(target);
    floater.x+=body.centerX-floater.anchorX;
    floater.y+=body.topY-floater.anchorY;
    floater.anchorX=body.centerX;floater.anchorY=body.topY;
  }
  floater.life-=delta*(floater.isDamage?.78:.82);
  floater.y-=delta*(floater.isDamage?27:42);
  floater.x+=(floater.drift||0)*delta;
}
function drawBattleFootShadow(context,unit,time){
  if(!unit)return;
  const defeat=unit.hp>0?{visible:true,alpha:1}:defeatState(unit,time);
  if(!defeat.visible)return;
  const body=battleFeedbackBody(unit,time);
  if(!body.visible)return;
  const radius=Math.max(16,Math.min(48,body.height*.25));
  context.save();
  context.globalAlpha=(defeat.alpha??1)*(unit.splusAirborneUntil>time?.65:1);
  context.shadowBlur=0;
  context.fillStyle='rgba(24,20,29,0.18)';
  context.beginPath();
  context.ellipse(body.centerX,body.footY+2,radius,radius*.22,0,0,Math.PI*2);
  context.fill();context.restore();
}
