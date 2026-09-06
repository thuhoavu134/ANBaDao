import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const battlePath = join(out, 'battle.html');
let battle = readFileSync(battlePath, 'utf8');

const marker = '/* hv-patch:dinh-loi-retina-portrait-v1 */';
if (!battle.includes(marker)) {
  const retinaDeclaration = 'const DINH_LOI_ID="dinh_loi", DINH_LOI_FRAMES=64, DINH_LOI_COLS=8, DINH_LOI_CELL_W=240, DINH_LOI_CELL_H=135;';
  const occurrences = (source, needle) => source.split(needle).length - 1;
  if (occurrences(battle, retinaDeclaration) !== 1) {
    throw new Error('Đình Lôi retina declaration boundary not found exactly once');
  }
  battle = battle.replace(
    retinaDeclaration,
    `// v3.26.1 — ${marker} — source atlases are committed at 2x density\n  const DINH_LOI_ID="dinh_loi", DINH_LOI_FRAMES=64, DINH_LOI_COLS=8, DINH_LOI_CELL_W=480, DINH_LOI_CELL_H=270;`
  );

  const verticalCellDeclaration = 'const cellW=135,cellH=240,sx=(frame%8)*cellW,sy=Math.floor(frame/8)*cellH;';
  const verticalCount = occurrences(battle, verticalCellDeclaration);
  if (verticalCount !== 2) throw new Error(`Đình Lôi vertical VFX cell boundary expected twice, found ${verticalCount}`);
  battle = battle.replaceAll(
    verticalCellDeclaration,
    'const cellW=Math.round(image.naturalWidth/8),cellH=Math.round(image.naturalHeight/8),sx=(frame%8)*cellW,sy=Math.floor(frame/8)*cellH;'
  );

  const portraitStart = battle.indexOf('function drawReportPortrait(canvas,entry){');
  const portraitEnd = battle.indexOf('  function reportTeamSnapshotFromResult', portraitStart);
  if (portraitStart < 0 || portraitEnd < 0) throw new Error('Result portrait function boundary not found');
  const portrait = `// v3.26.1 — ${marker} — cache authored portrait art before result reveal.
  const RESULT_PORTRAIT_SOURCES=Object.freeze({ong_hang_pho:'assets/characters/ong-pho/card.png','ong-pho-gif-test':'assets/characters/ong-pho/card.png'});
  const RESULT_PORTRAIT_CACHE=new Map();
  function resultPortraitKey(entry){
    const unit=entry?.unit||{}; const hero=entry?.hero||{};
    const explicit=String(unit.sourceId||unit.sourceHeroId||hero.sourceId||hero.id||unit.id||'');
    return RESULT_PORTRAIT_SOURCES[explicit] ? explicit : (String(unit.name||hero.name||'')==='Ông Phở' ? 'ong_hang_pho' : explicit);
  }
  function resultPortraitRecord(key,redraw){
    const source=RESULT_PORTRAIT_SOURCES[key]; if(!source)return null;
    let record=RESULT_PORTRAIT_CACHE.get(key);
    if(!record){
      const image=new Image(); image.decoding='async';
      record={image,ready:false,error:false,waiters:new Set()}; RESULT_PORTRAIT_CACHE.set(key,record);
      image.onload=()=>{record.ready=true;const waiters=[...record.waiters];record.waiters.clear();waiters.forEach(fn=>{try{fn()}catch(_e){}});};
      image.onerror=()=>{record.error=true;record.waiters.clear();}; image.src=source;
      if(image.complete&&image.naturalWidth>1)record.ready=true;
    }
    if(record.ready)return record.image;
    if(!record.error&&redraw)record.waiters.add(redraw);
    return null;
  }
  function resultPortraitBackground(context,unit,width,height){
    const bg=context.createLinearGradient(0,0,0,height); bg.addColorStop(0,unit.team===TEAM_PLAYER?'#1d4b43':'#4b2525'); bg.addColorStop(1,'#110d0a'); context.fillStyle=bg; context.fillRect(0,0,width,height);
  }
  function drawReportPortrait(canvas,entry){
    if(!canvas||!entry)return; const unit=entry.unit||{}, context=canvas.getContext('2d'); if(!context)return;
    const paint=()=>{if(!canvas.isConnected)return;const width=canvas.width,height=canvas.height;context.clearRect(0,0,width,height);resultPortraitBackground(context,unit,width,height);
      const key=resultPortraitKey(entry),image=resultPortraitRecord(key,paint);
      if(image?.complete&&image.naturalWidth>1){const pad=4,innerW=Math.max(1,width-pad*2),innerH=Math.max(1,height-pad*2),scale=Math.min(innerW/image.naturalWidth,innerH/image.naturalHeight),drawW=image.naturalWidth*scale,drawH=image.naturalHeight*scale;context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,(width-drawW)/2,(height-drawH)/2,drawW,drawH);return;}
      // Keep an authored portrait from flashing a text placeholder while its cache entry resolves.
      if(RESULT_PORTRAIT_SOURCES[key])return;
      const sameBefore=units.some(candidate=>candidate!==unit&&candidate.team===unit.team&&candidate.archetype===unit.archetype&&candidate.slot<unit.slot);
      const pose=!sameBefore?POSE_ATLASES[unit.archetype]:null; const atlas=(pose?.complete&&pose.naturalWidth>1)?pose:HERO_ATLASES[unit.team];
      if(atlas?.complete&&atlas.naturalWidth>1){let sw,sh,sx,sy;if(atlas===pose){sw=atlas.naturalWidth/4;sh=atlas.naturalHeight/2;sx=0;sy=(unit.team===TEAM_PLAYER?0:1)*sh;}else{sw=atlas.naturalWidth/3;sh=atlas.naturalHeight/2;sx=(unit.slot%3)*sw;sy=Math.floor(unit.slot/3)*sh;}const scale=Math.max(width/sw,height/sh),drawW=sw*scale,drawH=sh*scale;context.drawImage(atlas,sx,sy,sw,sh,(width-drawW)/2,height-drawH,drawW,drawH);return;}
      context.fillStyle=unit.accent||'#d7aa57';context.font='700 42px Georgia';context.textAlign='center';context.textBaseline='middle';context.fillText(String(unit.name||'?').charAt(0),width/2,height/2);
    }; paint();
  }
  resultPortraitRecord('ong_hang_pho',()=>{});
`;
  battle = battle.slice(0, portraitStart) + portrait + battle.slice(portraitEnd);
  const integratedMarker='/* hv-patch:integrated-mvp-portrait-v1 */';
  const integratedStart=battle.indexOf(' function paintHero(canvas,m){');
  const integratedEnd=battle.indexOf(' function nav(target){',integratedStart);
  if (integratedStart<0||integratedEnd<0) throw new Error('Integrated result MVP painter boundary not found');
  if (battle.includes(integratedMarker)) throw new Error('Integrated result MVP portrait patch already present');
  const integratedPainter = ` // v3.26.1 — ${integratedMarker} — render authored MVP portrait art in the integrated result canvas.
 const MVP_PORTRAIT_SOURCES=Object.freeze({ong_hang_pho:'assets/characters/ong-pho/card.png','ong-pho-gif-test':'assets/characters/ong-pho/card.png'});
 const MVP_PORTRAIT_CACHE=new Map();
 function mvpPortraitKey(m){
  const explicit=String(m?.sourceId||m?.id||'');
  return MVP_PORTRAIT_SOURCES[explicit] ? explicit : (String(m?.name||'')==='Ông Phở' ? 'ong_hang_pho' : '');
 }
 function mvpPortraitRecord(key,redraw){
  const source=MVP_PORTRAIT_SOURCES[key];if(!source)return null;
  let record=MVP_PORTRAIT_CACHE.get(key);
  if(!record){
   const image=new Image();image.decoding='async';
   record={image,ready:false,error:false,waiters:new Set()};MVP_PORTRAIT_CACHE.set(key,record);
   image.onload=()=>{record.ready=true;const waiters=[...record.waiters];record.waiters.clear();waiters.forEach(fn=>{try{fn()}catch(_e){}});};
   image.onerror=()=>{record.error=true;record.waiters.clear();};image.src=source;
   if(image.complete&&image.naturalWidth>1)record.ready=true;
  }
  if(record.ready)return record;
  if(!record.error&&redraw)record.waiters.add(redraw);
  return record;
 }
 function paintAuthoredMvpPortrait(canvas,m){
  const key=mvpPortraitKey(m);if(!key)return false;
  const ctx=canvas.getContext('2d');if(!ctx)return true;
  const width=canvas.width,height=canvas.height;ctx.clearRect(0,0,width,height);
  const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,'#1d4b43');bg.addColorStop(1,'#110d0a');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
  const record=mvpPortraitRecord(key,()=>paintHero(canvas,m));
  if(record?.ready&&record.image.complete&&record.image.naturalWidth>1){
   const pad=4,innerW=Math.max(1,width-pad*2),innerH=Math.max(1,height-pad*2),scale=Math.min(innerW/record.image.naturalWidth,innerH/record.image.naturalHeight),drawW=record.image.naturalWidth*scale,drawH=record.image.naturalHeight*scale;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(record.image,0,0,record.image.naturalWidth,record.image.naturalHeight,(width-drawW)/2,(height-drawH)/2,drawW,drawH);
  }else if(record?.error){
   ctx.fillStyle='#f5df9a';ctx.font='900 28px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(m?.name||'Chiến tướng').slice(0,2),width/2,height/2);
  }
  return true;
 }
 mvpPortraitRecord('ong_hang_pho',()=>{});
 function paintHero(canvas,m){
  if(!canvas)return;
  const id=String(m?.sourceId||m?.id||'');
  if(id==='luc_anh'){drawLucAnhIdle(canvas);return;}
  if(paintAuthoredMvpPortrait(canvas,m))return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const bg=ctx.createLinearGradient(0,0,0,canvas.height);bg.addColorStop(0,'#1d4b43');bg.addColorStop(1,'#110d0a');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#f5df9a';ctx.font='900 28px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(m?.name||'Chiến tướng').slice(0,2),canvas.width/2,canvas.height/2);
 }
`;
  battle=battle.slice(0,integratedStart)+integratedPainter+battle.slice(integratedEnd);
  writeFileSync(battlePath, battle);
  console.log('Dinh Lôi retina source cells and result portrait cache patched');
}
