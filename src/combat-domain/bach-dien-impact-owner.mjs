const POST_LINH_DONG_LEGACY = `    const linhImpact=usesLinhDong?actor._linhDongAction:null;
    const resolveAtImpact=!linhImpact||!linhImpact.impactResolved;
    if(linhImpact){linhImpact.clock.advance(LINH_DONG_TIMELINE[linhImpact.action].impactMs);linhImpact.impactResolved=true;}
    if(resolveAtImpact) resolveAction(actor, action, target);
    if(!usesLucAnh && !usesLinhDong) triggerImpactPresentation(actor, target, action);`;

const POST_LINH_DONG_TRACED = `    const linhImpact=usesLinhDong?actor._linhDongAction:null;
    const resolveAtImpact=!linhImpact||!linhImpact.impactResolved;
    if(linhImpact){linhImpact.clock.advance(LINH_DONG_TIMELINE[linhImpact.action].impactMs);linhImpact.impactResolved=true;}
    if(resolveAtImpact){phase1Trace?.marker('impact',{actionId:phase1ActionId,targetId:target?.id||null,position:{x:target?.x??actor.x,y:target?.y??actor.y}});resolveAction(actor, action, target, phase1ActionId);}
    if(!usesLucAnh && !usesLinhDong) triggerImpactPresentation(actor, target, action);`;

const PRE_LINH_DONG_TRACED = `    phase1Trace?.marker('impact',{actionId:phase1ActionId,targetId:target?.id||null,position:{x:target?.x??actor.x,y:target?.y??actor.y}});
    resolveAction(actor, action, target, phase1ActionId);
    if(!usesLucAnh) triggerImpactPresentation(actor, target, action);`;

const BACH_DIEN_MARKER = '    const bachImpact=usesBachDien?actor._bachDienAction:null;';

function replacement({ traced }) {
  const resolve = traced
    ? `    if(resolveAtImpact){phase1Trace?.marker('impact',{actionId:phase1ActionId,targetId:target?.id||null,position:{x:target?.x??actor.x,y:target?.y??actor.y}});resolveAction(actor, action, target, phase1ActionId);}`
    : '    if(resolveAtImpact) resolveAction(actor, action, target);';
  return `    const linhImpact=usesLinhDong?actor._linhDongAction:null;
    const bachImpact=usesBachDien?actor._bachDienAction:null;
    const spriteImpact=linhImpact||bachImpact;
    const resolveAtImpact=!spriteImpact||!spriteImpact.impactResolved;
    if(linhImpact){linhImpact.clock.advance(LINH_DONG_TIMELINE[linhImpact.action].impactMs);linhImpact.impactResolved=true;}
    if(bachImpact){bachImpact.clock.advance(BACH_DIEN_TIMELINE[bachImpact.action].impactMs);bachImpact.impactResolved=true;}
${resolve}
    if(!usesLucAnh && !usesLinhDong && !usesBachDien) triggerImpactPresentation(actor, target, action);`;
}

export function patchBachDienImpactOwner(source) {
  const input=String(source??'');
  if (input.includes(BACH_DIEN_MARKER)) return input;
  if (input.includes(POST_LINH_DONG_TRACED)) {
    return input.replace(POST_LINH_DONG_TRACED,replacement({traced:true}));
  }
  if (input.includes(POST_LINH_DONG_LEGACY)) {
    return input.replace(POST_LINH_DONG_LEGACY,replacement({traced:false}));
  }
  if (input.includes(PRE_LINH_DONG_TRACED)) {
    return input.replace(PRE_LINH_DONG_TRACED,replacement({traced:true}));
  }
  throw new Error('Bạch Diện impact owner anchor missing');
}
