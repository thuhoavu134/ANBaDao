import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const path = join(process.cwd(), 'dist', 'battle.html');
let html = readFileSync(path, 'utf8');
const marker = 'THAY_MO_AUTHORED_PRODUCTION_V1';
if (html.includes(marker)) throw new Error('Thay Mo authored production patch applied twice');

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`THAY_MO_PRODUCTION_ANCHOR:${label}:${count}`);
  return source.replace(from, to);
}
function replaceNth(source, needle, replacement, nth, label) {
  let from = 0, at = -1;
  for (let i = 0; i < nth; i += 1) {
    at = source.indexOf(needle, from);
    if (at < 0) throw new Error(`THAY_MO_PRODUCTION_NTH:${label}:${nth}`);
    from = at + needle.length;
  }
  return source.slice(0, at) + replacement + source.slice(at + needle.length);
}

const runtime = `
  // THAY_MO_AUTHORED_PRODUCTION_V1
  // The full Thay Mo atlases existed behind QA-only gates. Production uses the
  // same authored cells/timings; v2 Basic intentionally maps to the authored
  // Chuong Chan Phach (legacy Skill 1) presentation.
  const THAY_MO_PRODUCTION_IDS=new Set(["thay_mo","thay-mo","hero_thay_mo"]);
  function isThayMoAuthored(unit){
    return !!unit&&THAY_MO_PRODUCTION_IDS.has(String(unit.sourceId||unit.sourceHeroId||unit.id));
  }
  async function prepareThayMoAuthoredAssets(action,signal){
    const aborted=()=>Object.assign(new Error('Thay Mo asset preparation cancelled'),{name:'AbortError'});
    const getters=action==='ultimate'
      ?[THAY_MO_IDLE_IMAGE,THAY_MO_ULTIMATE_CAST_IMAGE,THAY_MO_ULTIMATE_VFX_IMAGE]
      :[THAY_MO_IDLE_IMAGE,THAY_MO_SKILL1_CAST_IMAGE,THAY_MO_SKILL1_WAVE_IMAGE,THAY_MO_SKILL1_IMPACT_IMAGE];
    // Reuse original lazy atlas images. Decode sequentially before the action
    // clock/cost, so the first cold cast cannot run past an unloaded VFX.
    for(const getImage of getters){
      if(signal?.aborted)throw aborted();
      const image=getImage();
      try{
        await new Promise((resolve,reject)=>{
          let timer;
          const finish=error=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);error?reject(error):resolve();};
          const cancel=()=>finish(aborted());
          signal?.addEventListener('abort',cancel,{once:true});
          timer=setTimeout(()=>finish(new Error('Thay Mo atlas decode timeout: '+image.src)),15000);
          Promise.resolve().then(()=>image.decode()).then(()=>{
            if(!image.complete||image.naturalWidth<2)throw new Error('Thay Mo atlas unavailable: '+image.src);
            finish();
          }).catch(finish);
        });
      }catch(error){
        if(error?.name!=='AbortError')for(const [src,cached] of BATTLE_LEGACY_LAZY_IMAGES)if(cached===image)BATTLE_LEGACY_LAZY_IMAGES.delete(src);
        throw error;
      }
    }
    if(state.sound&&window.HonVietSfx?.prepare){
      await window.HonVietSfx.prepare(action==='ultimate'?'ultimate':action==='skill'?'skill':'basic',{signal,timeoutMs:2000}).catch(()=>false);
    }
    if(signal?.aborted)throw aborted();
  }
  function waitThayMoAuthoredMarker(item,marker,battleId){
    const at=marker==='release'?item.releaseAt:marker==='impact'?item.impactAt:item.totalMs;
    return sleepVisualMilliseconds(Math.max(0,at-(performance.now()-item.started)),battleId);
  }
  function thayMoAuthoredTargetIds(actor,target,visualAction){
    if(visualAction==="ultimate")return units.filter(u=>u.team!==actor.team&&u.hp>0).map(u=>u.id);
    const row=target?thayMoSkill1RowTargets(target):[];
    return (row.length?row:(target?[target]:[])).map(u=>u.id);
  }
  function thayMoAuthoredBounds(ids){
    const list=ids.map(id=>getUnit(id)).filter(Boolean);if(!list.length)return null;
    const minX=Math.min(...list.map(u=>u.x)),maxX=Math.max(...list.map(u=>u.x));
    const minY=Math.min(...list.map(u=>u.y)),maxY=Math.max(...list.map(u=>u.y));
    return {cx:(minX+maxX)/2,cy:(minY+maxY)/2-58,w:Math.max(1,maxX-minX),h:Math.max(1,maxY-minY)};
  }
  function beginThayMoAuthoredAction(actor,action,target){
    const visualAction=action==="ultimate"?"ultimate":"skill1";
    const targetIds=thayMoAuthoredTargetIds(actor,target,visualAction);
    const impactAt=visualAction==="ultimate"?THAY_MO_ULTIMATE_MAIN_IMPACT_AT_MS:THAY_MO_SKILL1_FULL_MAIN_IMPACT_AT_MS;
    const totalMs=visualAction==="ultimate"?THAY_MO_ULTIMATE_TOTAL_MS:THAY_MO_SKILL1_FULL_TOTAL_MS;
    const releaseAt=visualAction==="ultimate"?THAY_MO_ULTIMATE_RELEASE_AT_MS:THAY_MO_SKILL1_COMBO_RELEASE_AT_MS;
    const item={visualAction,action,targetId:target?.id||null,targetIds,bounds:thayMoAuthoredBounds(targetIds),started:performance.now(),releaseAt,impactAt,totalMs};
    actor._thayMoAuthoredAction=item;
    // Request only this action's authored assets; the shared legacy atlas owner
    // remains responsible for decode pressure and reuse.
    THAY_MO_IDLE_IMAGE();
    if(visualAction==="ultimate"){THAY_MO_ULTIMATE_CAST_IMAGE();THAY_MO_ULTIMATE_VFX_IMAGE();}
    else{THAY_MO_SKILL1_CAST_IMAGE();THAY_MO_SKILL1_WAVE_IMAGE();THAY_MO_SKILL1_IMPACT_IMAGE();}
    return item;
  }
  function finishThayMoAuthoredAction(actor){
    if(actor)delete actor._thayMoAuthoredAction;
  }
  function drawThayMoAuthoredCell(context,image,frame,cols,strideW,strideH,pad,cellW,cellH,drawH=348){
    if(!image?.complete||image.naturalWidth<2)return false;
    frame=Math.max(0,Math.floor(frame)||0);
    const sx=(frame%cols)*strideW+pad,sy=Math.floor(frame/cols)*strideH+pad;
    const drawW=cellW/cellH*drawH;
    context.drawImage(image,sx,sy,cellW,cellH,-drawW*.5,-drawH+28,drawW,drawH);
    return true;
  }
  function drawThayMoAuthoredHero(context,unit,time){
    if(!isThayMoAuthored(unit)||unit.hp<=0)return false;
    context.save();context.shadowColor="rgba(239,190,90,.20)";context.shadowBlur=4;
    if(unit.state==="hurt"&&THAY_MO_HIT_IMAGE()?.complete&&THAY_MO_HIT_IMAGE().naturalWidth>1){
      const e=Math.max(0,time-(unit.stateStarted||time));
      const frame=Math.min(THAY_MO_HIT_FRAMES-1,Math.floor(e/THAY_MO_HIT_FRAME_MS));
      drawThayMoAuthoredCell(context,THAY_MO_HIT_IMAGE(),frame,THAY_MO_HIT_COLS,THAY_MO_HIT_STRIDE_W,THAY_MO_HIT_STRIDE_H,THAY_MO_HIT_PAD,THAY_MO_HIT_CELL_W,THAY_MO_HIT_CELL_H);
      context.restore();return true;
    }
    const item=unit._thayMoAuthoredAction;
    if(item){
      const e=Math.max(0,time-item.started);
      if(item.visualAction==="ultimate"&&e>=THAY_MO_ULTIMATE_IDLE_MS&&e<THAY_MO_ULTIMATE_IDLE_MS+THAY_MO_ULTIMATE_CAST_MS){
        const ce=e-THAY_MO_ULTIMATE_IDLE_MS;
        const frame=Math.min(THAY_MO_ULTIMATE_CAST_FRAMES-1,Math.floor(ce/THAY_MO_ULTIMATE_CAST_FRAME_MS));
        const ok=drawThayMoAuthoredCell(context,THAY_MO_ULTIMATE_CAST_IMAGE(),frame,THAY_MO_ULTIMATE_CAST_COLS,THAY_MO_ULTIMATE_CAST_STRIDE_W,THAY_MO_ULTIMATE_CAST_STRIDE_H,THAY_MO_ULTIMATE_CAST_PAD,THAY_MO_ULTIMATE_CAST_CELL_W,THAY_MO_ULTIMATE_CAST_CELL_H);
        context.restore();if(ok)return true;context.save();
      }else if(item.visualAction==="skill1"&&e>=THAY_MO_SKILL1_COMBO_CAST_START_MS&&e<THAY_MO_SKILL1_COMBO_CAST_END_MS){
        const ce=e-THAY_MO_SKILL1_COMBO_CAST_START_MS;
        const frame=Math.min(THAY_MO_SKILL1_CAST_FRAMES-1,Math.floor(ce/THAY_MO_SKILL1_CAST_FRAME_MS));
        const ok=drawThayMoAuthoredCell(context,THAY_MO_SKILL1_CAST_IMAGE(),frame,THAY_MO_SKILL1_CAST_COLS,THAY_MO_SKILL1_CAST_STRIDE_W,THAY_MO_SKILL1_CAST_STRIDE_H,THAY_MO_SKILL1_CAST_PAD,THAY_MO_SKILL1_CAST_CELL_W,THAY_MO_SKILL1_CAST_CELL_H);
        context.restore();if(ok)return true;context.save();
      }
    }
    const idle=THAY_MO_IDLE_IMAGE();
    const frame=thayMoIdleFrameAt(time);
    const ok=drawThayMoAuthoredCell(context,idle,frame,THAY_MO_IDLE_COLS,THAY_MO_IDLE_STRIDE_W,THAY_MO_IDLE_STRIDE_H,THAY_MO_IDLE_PAD,THAY_MO_IDLE_CELL_W,THAY_MO_IDLE_CELL_H);
    context.restore();return ok;
  }
  function drawThayMoAuthoredSkill1Fx(context,actor,item,e){
    const primary=getUnit(item.targetId),targets=item.targetIds.map(id=>getUnit(id)).filter(Boolean);
    const waveT=e-THAY_MO_SKILL1_COMBO_RELEASE_AT_MS;
    if(primary&&waveT>=0&&waveT<THAY_MO_SKILL1_WAVE_MS&&THAY_MO_SKILL1_WAVE_IMAGE()?.complete&&THAY_MO_SKILL1_WAVE_IMAGE().naturalWidth>1){
      const p=Math.max(0,Math.min(1,waveT/THAY_MO_SKILL1_WAVE_MS));
      const frame=Math.min(THAY_MO_SKILL1_WAVE_FRAMES-1,Math.floor(p*THAY_MO_SKILL1_WAVE_FRAMES));
      const sx=(frame%THAY_MO_SKILL1_WAVE_COLS)*THAY_MO_SKILL1_WAVE_STRIDE_W+THAY_MO_SKILL1_WAVE_PAD;
      const sy=Math.floor(frame/THAY_MO_SKILL1_WAVE_COLS)*THAY_MO_SKILL1_WAVE_STRIDE_H+THAY_MO_SKILL1_WAVE_PAD;
      const dir=actor.team===TEAM_ENEMY?-1:1,fromX=actor.x+64*dir,fromY=actor.y-86;
      for(const rowTarget of targets){
        const toX=rowTarget.x-16*dir,toY=rowTarget.y-72,dx=toX-fromX,dy=toY-fromY,angle=Math.atan2(dy,dx);
        const x=fromX+dx*p,y=fromY+dy*p,drawW=rowTarget.id===primary.id?300:270,drawH=THAY_MO_SKILL1_WAVE_CELL_H/THAY_MO_SKILL1_WAVE_CELL_W*drawW;
        context.save();context.translate(x,y);context.rotate(angle);context.globalCompositeOperation="source-over";
        context.drawImage(THAY_MO_SKILL1_WAVE_IMAGE(),sx,sy,THAY_MO_SKILL1_WAVE_CELL_W,THAY_MO_SKILL1_WAVE_CELL_H,-drawW*.28,-drawH*.5,drawW,drawH);context.restore();
      }
    }
    const impactT=e-THAY_MO_SKILL1_FULL_CONTACT_AT_MS;
    if(impactT>=0&&impactT<THAY_MO_SKILL1_IMPACT_MS){
      const frame=THAY_MO_SKILL1_IMPACT_START_FRAME+Math.floor(impactT/THAY_MO_SKILL1_IMPACT_FRAME_MS);
      for(const rowTarget of targets)drawThayMoSkill1ImpactFrame(context,rowTarget,frame,primary&&rowTarget.id===primary.id?1:.88);
    }
  }
  function drawThayMoAuthoredUltimateFx(context,item,e){
    const t=e-THAY_MO_ULTIMATE_RELEASE_AT_MS,bounds=item.bounds;
    if(bounds&&t>=0&&t<THAY_MO_ULTIMATE_VFX_MS&&THAY_MO_ULTIMATE_VFX_IMAGE()?.complete&&THAY_MO_ULTIMATE_VFX_IMAGE().naturalWidth>1){
      const frame=Math.min(THAY_MO_ULTIMATE_VFX_FRAMES-1,Math.floor(t/THAY_MO_ULTIMATE_VFX_FRAME_MS));
      const sx=(frame%THAY_MO_ULTIMATE_VFX_COLS)*THAY_MO_ULTIMATE_VFX_STRIDE_W+THAY_MO_ULTIMATE_VFX_PAD;
      const sy=Math.floor(frame/THAY_MO_ULTIMATE_VFX_COLS)*THAY_MO_ULTIMATE_VFX_STRIDE_H+THAY_MO_ULTIMATE_VFX_PAD;
      const drawW=Math.min(790,Math.max(710,bounds.w+270)),drawH=Math.min(430,Math.max(390,bounds.h+250));
      context.save();context.translate(bounds.cx,bounds.cy);context.globalCompositeOperation="screen";context.globalAlpha=.96;
      context.drawImage(THAY_MO_ULTIMATE_VFX_IMAGE(),sx,sy,THAY_MO_ULTIMATE_VFX_CELL_W,THAY_MO_ULTIMATE_VFX_CELL_H,-drawW*.5,-drawH*.5,drawW,drawH);context.restore();
    }
    const bind=e-THAY_MO_ULTIMATE_MAIN_IMPACT_AT_MS;
    if(bounds&&bind>=0&&bind<=THAY_MO_ULTIMATE_BIND_MS){
      const fade=Math.max(0,1-bind/THAY_MO_ULTIMATE_BIND_MS),pulse=.84+.16*Math.sin(bind*.028);
      const fieldW=Math.min(575,Math.max(445,bounds.w+350)),fieldH=Math.min(435,Math.max(355,bounds.h+350));
      context.save();context.translate(bounds.cx,bounds.cy+60);context.globalAlpha=.78*fade;context.strokeStyle="#c92d2a";context.lineWidth=5;context.shadowColor="#ff553d";context.shadowBlur=18;
      context.beginPath();context.ellipse(0,0,fieldW*.5*pulse,fieldH*.5*pulse,0,0,Math.PI*2);context.stroke();context.restore();
    }
  }
  function drawThayMoAuthoredFx(context,time){
    for(const actor of units){
      const item=actor?._thayMoAuthoredAction;if(!item)continue;
      const e=Math.max(0,time-item.started);
      if(item.visualAction==="ultimate")drawThayMoAuthoredUltimateFx(context,item,e);
      else drawThayMoAuthoredSkill1Fx(context,actor,item,e);
    }
  }
`;

html = replaceOnce(
  html,
  '  function drawThayMoIdleQa(context, unit) {',
  runtime + '\n  function drawThayMoIdleQa(context, unit) {',
  'runtime'
);

html = replaceOnce(
  html,
  '|| drawBachDienHero(context,unit,time) || drawThayMoIdleQa(context, unit)',
  '|| drawBachDienHero(context,unit,time) || drawThayMoAuthoredHero(context,unit,time) || drawThayMoIdleQa(context, unit)',
  'character-owner'
);

html = replaceOnce(
  html,
  '    drawBachDienFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);',
  '    drawBachDienFx(ctx,time);\n    drawThayMoAuthoredFx(ctx,time);\n    drawThayMoRangedFx(ctx,time);',
  'vfx-owner'
);

const performStart = html.indexOf('  async function performAction(actor, action, target) {');
const performEnd = html.indexOf('\n  function statusLabel(status)', performStart);
if (performStart < 0 || performEnd < 0) throw new Error('THAY_MO_PRODUCTION performAction boundary missing');
let perform = html.slice(performStart, performEnd);

perform = replaceOnce(perform,
  '__hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);',
  `__hvActionAssets=await __hvBattleAssets.prepare(actor,action,target,battleId);
      if(isThayMoAuthored(actor)){
        try{await prepareThayMoAuthoredAssets(action,__hvActionAssets.signal);}
        catch(error){__hvActionAssets.release();throw error;}
      }`, 'pre-cast-readiness');

perform = replaceOnce(
  perform,
  '    const usesThayMoBasicQa = isThayMoBasicQa(actor) && action === "basic";',
  '    const usesThayMoAuthored = isThayMoAuthored(actor);\n    const usesThayMoBasicQa = isThayMoBasicQa(actor) && action === "basic";',
  'action-identity'
);

const qaBranch = '    } else if (usesThayMoBasicQa) {';
const qCount = perform.split(qaBranch).length - 1;
if (qCount !== 2) throw new Error(`THAY_MO_PRODUCTION expected 2 final QA branches, found ${qCount}`);

perform = replaceNth(perform, qaBranch,
`    } else if (usesThayMoAuthored) {
      actor.x=actor.baseX;actor.y=actor.baseY;
      const thayMoAction=beginThayMoAuthoredAction(actor,action,target);
      setStatus(actor.name+' '+(action==='ultimate'?'khai Trận Ảnh Phong Môn':'rung Chuông Chấn Phách'));
      dom.phaseLabel.textContent=action==='ultimate'?'Tuyệt kỹ • Trận Ảnh Phong Môn':'Basic • Chuông Chấn Phách';
      setUnitState(actor,action==='ultimate'?'ultimate':'skill1',thayMoAction.totalMs);
      if(!await waitThayMoAuthoredMarker(thayMoAction,'release',battleId))return;
      phase1Trace?.marker('release',{actionId:phase1ActionId,position:{x:actor.x,y:actor.y}});
      playActionSound(actor,action);
      if(!await waitThayMoAuthoredMarker(thayMoAction,'impact',battleId))return;
` + qaBranch, 1, 'cast-branch');

perform = replaceNth(perform, qaBranch,
`    } else if (usesThayMoAuthored) {
      const thayMoAction=actor._thayMoAuthoredAction;
      const elapsed=thayMoAction?performance.now()-thayMoAction.started:0;
      if(thayMoAction&&!await sleepVisualMilliseconds(Math.max(0,thayMoAction.totalMs-elapsed),battleId))return;
      finishThayMoAuthoredAction(actor);
      actor.x=origin.x;actor.y=origin.y;setUnitState(actor,'idle',800);
` + qaBranch, 2, 'recovery-branch');

// The final movement owner already consolidates return-home into one branch.
// Thay Mo stays at its existing origin; do not reinsert a removed QA return arm.

// The final Linh Dong/Bach Dien owners extend this guard. Match that final
// shape too; a silent string replacement used to leave the generic overlay on.
const impactGuard=perform.match(/    if\((!usesLucAnh[^\n]*)\) triggerImpactPresentation\(actor, target, action\);/g)||[];
if(impactGuard.length!==1)throw new Error('THAY_MO_PRODUCTION_ANCHOR:impact-owner:'+impactGuard.length);
perform=perform.replace(impactGuard[0],impactGuard[0].replace('if(', 'if(!usesThayMoAuthored && '));
const release="    phase1Trace?.marker('release',{actionId:phase1ActionId,position:{x:actor.x,y:actor.y}});";
// Only the common impact-time marker has four spaces; the authored marker
// above has six. Keep exactly one release event at the authored release time.
perform=replaceOnce(perform,'\n'+release,'\n    if(!usesThayMoAuthored)'+release.trim(),'release-marker-owner');
perform=replaceOnce(perform,
  '      if(actor._hvAssetLease===__hvActionAssets)delete actor._hvAssetLease;',
  '      if(isThayMoAuthored(actor))finishThayMoAuthoredAction(actor);\n      if(actor._hvAssetLease===__hvActionAssets)delete actor._hvAssetLease;',
  'cancel-cleanup');

html = html.slice(0, performStart) + perform + html.slice(performEnd);
writeFileSync(path, html);
console.log('Thay Mo authored production VFX restored: v2 Basic uses Skill1 cast/wave/impact; Ultimate uses cast/full-team VFX.');

