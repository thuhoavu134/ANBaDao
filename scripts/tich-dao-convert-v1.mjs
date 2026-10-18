// One-shot converter for the owner-approved Tích Đạo six-state pack
// (tich-dao-six-state-phase-aware.zip, SHA-256
// 3a4c6a63418cbb41eda7554368c890a3d0e6f16278ae4e57e5833ad3e64a2eab).
// Usage: node scripts/tich-dao-convert-v1.mjs <extracted-pack-root> [assets/characters/tich-dao]
// Battle clips keep the authored 480x440 Kỷ Vân cell grid. The 77-frame idle
// loop is repaginated losslessly into 3x3 pages of nine frames so one decoded
// page stays under the 14 MiB mobile idle budget (an 8x8 page would decode 54 MiB).
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';

const packRoot=resolve(process.argv[2]||'C:/Users/Admin/.zcode/workspace/tich-dao-intake/extracted/kiemthe-animation-assets-20261015-152253-phase-aware');
const outRoot=resolve(process.argv[3]||'assets/characters/tich-dao');
const packSha='3a4c6a63418cbb41eda7554368c890a3d0e6f16278ae4e57e5833ad3e64a2eab';
const {default:sharp}=await import('sharp');

mkdirSync(outRoot,{recursive:true});
mkdirSync(join(outRoot,'campaign'),{recursive:true});

const CELL=480,CELLH=440;
const sha256=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const readMeta=state=>JSON.parse(readFileSync(join(packRoot,state,'metadata.json'),'utf8'));

// ---- action clips: verify the 6x3 grid then re-encode losslessly tiled webp
const actionStates={basic:'atk',ultimate:'ultimate',hit:'hit',run:'run','fall-die':'fall-die'};
const clips={};
for(const [key,state] of Object.entries(actionStates)){
  const meta=readMeta(state);
  const page=meta.atlasPages[0];
  if(page.columns!==6||page.frameCount!==18)throw new Error(state+': expected 18 frames on a 6-column sheet');
  const file=key+'.webp';
  await sharp(join(packRoot,state,page.file)).webp({quality:90,alphaQuality:100}).toFile(join(outRoot,file));
  clips[key]={file,cols:6,rows:3,frames:18,cellW:CELL,cellH:CELLH,
    durationMs:0,frameDurationsMs:[]};
}
// Authored battle clocks (Tiêu Phong precedent): basic/hit/run are retimed to
// readable battle lengths, fall-die keeps source length and is compressed by
// the runtime defeat clock, ultimate keeps the exact 4s phase timeline.
const uniform=(ms,n=18)=>Array.from({length:n},()=>ms);
clips.basic.durationMs=900;clips.basic.frameDurationsMs=uniform(50);
clips.basic.releaseMs=300;clips.basic.impactMs=450;
clips.hit.durationMs=350;clips.hit.frameDurationsMs=uniform(350/18);
clips.run.durationMs=750;clips.run.frameDurationsMs=uniform(750/18);
clips['fall-die'].durationMs=4000;clips['fall-die'].frameDurationsMs=uniform(4000/18);

// ---- ultimate phase map (source PTS are the display contract)
const segments=JSON.parse(readFileSync(join(packRoot,'ultimate','phases','phase-segments.json'),'utf8'));
const ultimateMeta=readMeta('ultimate');
const phases=segments.phases.map(p=>({
  id:p.id,label:p.label,
  startMs:p.startPtsSeconds*1000,endMs:p.endPtsSecondsExclusive*1000,
  sourceFrames:[p.start,p.end],
  visible:p.kind!=='invisible',
  cells:(p.atlasRefs||[]).map(ref=>ref.atlasCellIndex)
}));
clips.ultimate.durationMs=4000;
clips.ultimate.frameDurationsMs=Array.from({length:18},()=>4000/18);
clips.ultimate.strikeMs=phases.filter(p=>/strike|combo/.test(p.id)).map(p=>Math.round(p.startMs));
// Phase-04 strike 1, phase-06 combo strike 2, phase-08 final strike 3.
const strikeIds=['phase-04-reappear-strike-1','phase-06-reappear-combo','phase-08-final-strike'];
clips.ultimate.strikeMs=strikeIds.map(id=>Math.round(phases.find(p=>p.id===id).startMs));
clips.ultimate.releaseMs=clips.ultimate.strikeMs[0];
clips.ultimate.impactMs=clips.ultimate.strikeMs[0];

// ---- idle: repaginate 77 frames into nine-frame 3x3 pages
const idleMeta=readMeta('idle');
const idleCells=[];
for(const page of idleMeta.atlasPages){
  const image=sharp(join(packRoot,'idle',page.file));
  for(let i=0;i<page.frameCount;i++){
    const col=i%page.columns,row=Math.floor(i/page.columns);
    const buf=await image.clone().extract({left:col*CELL,top:row*CELLH,width:CELL,height:CELLH}).png().toBuffer();
    idleCells.push(buf);
  }
}
if(idleCells.length!==77)throw new Error('idle: expected 77 sampled frames, got '+idleCells.length);
const IDLE_PAGE_FRAMES=9,IDLE_COLS=3;
clips['standing']={file:'standing.webp',cols:1,rows:1,frames:1,cellW:CELL,cellH:CELLH,durationMs:0,frameDurationsMs:[0]};
await sharp(idleCells[0]).webp({quality:90,alphaQuality:100}).toFile(join(outRoot,'standing.webp'));
for(let p=0;p<Math.ceil(77/IDLE_PAGE_FRAMES);p++){
  const cells=idleCells.slice(p*IDLE_PAGE_FRAMES,(p+1)*IDLE_PAGE_FRAMES);
  const rows=Math.ceil(cells.length/IDLE_COLS),width=IDLE_COLS*CELL,height=rows*CELLH;
  await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(cells.map((buf,i)=>({input:buf,left:(i%IDLE_COLS)*CELL,top:Math.floor(i/IDLE_COLS)*CELLH})))
    .webp({quality:90,alphaQuality:100}).toFile(join(outRoot,'idle-authored-'+p+'.webp'));
  clips['idle-authored-'+p]={file:'idle-authored-'+p+'.webp',cols:IDLE_COLS,rows,frames:cells.length,cellW:CELL,cellH:CELLH,
    durationMs:cells.length*1000/24,frameDurationsMs:uniform(1000/24,cells.length)};
}

// Reviewed representative pose: frame 0 has open eyes; alpha area does not detect blinking.
const avatarFrame=0;
const idleMeta0=idleMeta.frames?idleMeta.frames[avatarFrame]:null;
const avatarImage=sharp(idleCells[avatarFrame]).trim({threshold:8});
const avatarInfo=await avatarImage.toBuffer({resolveWithObject:true});
await sharp(avatarInfo.data).webp({quality:90,alphaQuality:100}).toFile(join(outRoot,'avatar.webp'));

const idleFrameDurations=uniform(1000/24,77);
const idleVisual={
  schema:'honviet.authored-idle/v1',
  sourcePack:'tich-dao-six-state-phase-aware.zip',sourcePackSha256:packSha,
  frames:77,durationMs:77*1000/24,frameDurationsMs:idleFrameDurations,
  pageFrames:IDLE_PAGE_FRAMES,pages:Math.ceil(77/IDLE_PAGE_FRAMES),
  cols:IDLE_COLS,cellW:CELL,cellH:CELLH,pivot:'bottom-center',
  contentOffset:idleMeta.crop.contentOffset,contentSize:idleMeta.crop.contentSizeNoUpscale,
  avatar:'avatar.webp',avatarFrame,
  fitPolicy:'contain, centered horizontally, bottom anchored'
};

// ---- campaign derivatives (half-size 240x220 cells) for roster/preparation
for(const key of ['idle-authored-0','idle-authored-1','idle-authored-2','idle-authored-3','idle-authored-4','idle-authored-5','idle-authored-6','idle-authored-7','idle-authored-8','run','basic']){
  const source=sharp(join(outRoot,clips[key].file)),info=await source.metadata();
  await source.resize(Math.round(info.width/2),Math.round(info.height/2)).webp({quality:90,alphaQuality:100}).toFile(join(outRoot,'campaign',clips[key].file));
}
await sharp(join(outRoot,'idle-authored-0.webp')).extract({left:0,top:0,width:CELL,height:CELLH}).resize(240,220).webp({quality:90,alphaQuality:100}).toFile(join(outRoot,'campaign','idle-poster.webp'));

const artifacts={};
for(const file of ['basic.webp','ultimate.webp','hit.webp','run.webp','fall-die.webp','standing.webp','avatar.webp',...Array.from({length:9},(_,i)=>'idle-authored-'+i+'.webp')])artifacts[file]=sha256(join(outRoot,file));
idleVisual.runtimeArtifactSha256=artifacts;
idleVisual.avatarFileSha256=artifacts['avatar.webp'];

const meta={
  schema:'tich-dao-authored/v1',
  sourceCharacter:'tich-dao-six-state-phase-aware.zip',sourcePackSha256:packSha,
  sourceVfx:null,
  pending:[
    'avatar.webp cắt từ idle frame '+avatarFrame+' mở mắt; bố cục thẻ dùng roster portrait owner',
    'chưa có SFX authored cho basic/ultimate/hit'
  ],
  clips,
  idle:{frames:77,durationMs:77*1000/24,frameDurationsMs:idleFrameDurations},
  idleVisual,
  ultimateTimeline:{sourceFps:segments.sourceFps,sourceFrameCount:segments.sourceFrameCount,sourceDurationSeconds:segments.sourceDurationSeconds,boundaryConvention:segments.boundaryConvention,phases}
};
writeFileSync(join(outRoot,'runtime-meta.json'),JSON.stringify(meta,null,1));

// contact sheet for human review of the repaginated idle pages
for(let p=0;p<meta.idleVisual.pages;p++){
  const cells=idleCells.slice(p*IDLE_PAGE_FRAMES,(p+1)*IDLE_PAGE_FRAMES);
  const rows=Math.ceil(cells.length/IDLE_COLS);
  await sharp({create:{width:IDLE_COLS*CELL,height:rows*CELLH,channels:4,background:{r:24,g:24,b:32,alpha:1}}})
    .composite(cells.map((buf,i)=>({input:buf,left:(i%IDLE_COLS)*CELL,top:Math.floor(i/IDLE_COLS)*CELLH})))
    .png().toFile(join(outRoot,'review-idle-page-'+p+'.png'));
}
console.log('TICH_DAO_CONVERT_OK avatarFrame='+avatarFrame+' avatar='+(avatarInfo.info.width+'x'+avatarInfo.info.height)+' pages='+meta.idleVisual.pages+' strikes='+JSON.stringify(clips.ultimate.strikeMs));

