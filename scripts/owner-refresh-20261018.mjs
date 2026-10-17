import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {join,dirname,basename,extname} from 'node:path';
import {createHash} from 'node:crypto';

// Source atlases remain compact; expand into the established layouts BEFORE
// readiness, preparation, visibility-backup and result-page builders run.
export function pickSourceFrame(clip,index,count,range=[0,1]){
 const total=clip.durations.reduce((a,b)=>a+b,0);
 const t=total*(range[0]+(range[1]-range[0])*index/Math.max(1,count-1));
 let end=0;for(let i=0;i<clip.frames;i++){end+=clip.durations[i];if(t<end)return i;}
 return clip.frames-1;
}
export function makeReplacementPlan(){
 const plan=[],d='assets/characters/dinh-loi/',t='assets/characters/thay-mo/';
 const add=(output,source,extra={})=>plan.push({output,source,count:64,cols:8,w:480,h:270,pad:0,...extra});
 for(const [file,key] of Object.entries({'idle-atlas':'idle','run-atlas':'run','hit-atlas':'hit','fall-atlas':'fall-die','basic-cast-atlas':'atk','skill1-cast-atlas':'ultimate','ultimate-cast-atlas':'ultimate'}))
  add(d+file+'.png','dinh-'+key,{character:true,pivot:265,foot:258,body:233,...(key==='atk'?{releaseAtMs:1550,releaseSourceFrame:9}:key==='ultimate'?{releaseAtMs:file==='skill1-cast-atlas'?1500:1250,releaseSourceFrame:13}:{})});
 // Split one supplied continuous VFX across the existing release/contact phases.
 add(d+'basic-projectile-atlas.png','dinh-fx-vfx-atk',{range:[0,650/1450]});
 add(d+'basic-impact-atlas.png','dinh-fx-vfx-atk',{range:[650/1450,1]});
 add(d+'skill1-wave-atlas.png','dinh-fx-vfx-atk',{range:[0,700/1600]});
 add(d+'skill1-impact-atlas.png','dinh-fx-vfx-atk',{range:[700/1600,1]});
 add(d+'skill1-shield-atlas.png','dinh-shield');
 add(d+'ultimate-vfx-atlas.png','dinh-fx-vfx-ultimate',{range:[0,1900/2750]});
 add(d+'ultimate-impact-atlas.png','dinh-fx-vfx-ultimate',{range:[1900/2750,1]});
 add(t+'idle-v3193-atlas.png','thay-idle',{count:96,cols:12,w:235,h:264,pad:3,character:true,pivot:117.5,foot:260,body:250});
 add(t+'ultimate-vfx-v3212-atlas.png','thay-vfx-ultimate',{pad:4});
 return plan;
}
export function replacementFrame(c,p,i){
 if(p.releaseAtMs!=null){
  const pivot=Math.floor(p.releaseAtMs/4000*p.count),release=p.releaseSourceFrame;
  return i<=pivot?Math.floor(i/Math.max(1,pivot)*release):Math.min(c.frames-1,release+Math.floor((i-pivot)/(p.count-1-pivot)*(c.frames-1-release)));
 }
 return pickSourceFrame(c,i,p.count,p.range);
}
export async function buildOwnerRefreshAssets(root=process.cwd(),sharpImpl){
 const sharp=sharpImpl||(await import('sharp')).default;
 const input=join(root,'assets/owner-refresh-20261018'),out=join(root,'dist');
 const manifest=JSON.parse(readFileSync(join(input,'manifest.json'),'utf8'));
 const sources=new Map();
 for(const [key,c] of Object.entries(manifest.clips)){
  const frames=[];
  for(let i=0;i<c.frames;i++)frames.push(await sharp(join(input,c.file)).extract({left:i%c.cols*c.cellW,top:Math.floor(i/c.cols)*c.cellH,width:c.cellW,height:c.cellH}).png().toBuffer());
  sources.set(key,frames);
 }
 const evidence=[];
 for(const p of makeReplacementPlan()){
  const c=manifest.clips[p.source],frames=sources.get(p.source),normalized=[];
  let sourceBox={left:0,top:0,width:c.cellW,height:c.cellH};
  if(p.character){
   const {data,info}=await sharp(frames[0]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let top=info.height,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
   p.sourceBody=bottom-top;p.sourceFoot=bottom;
  }else if(c.sourceMetadata?.crop){
   const crop=c.sourceMetadata.crop;sourceBox={left:crop.contentOffset[0],top:crop.contentOffset[1],width:crop.contentSizeNoUpscale[0],height:crop.contentSizeNoUpscale[1]};
  }
  for(const frame of frames){
   const scale=p.character?p.body/p.sourceBody:Math.min((p.w-8)/sourceBox.width,(p.h-8)/sourceBox.height);
   const w=Math.max(1,Math.round(sourceBox.width*scale)),h=Math.max(1,Math.round(sourceBox.height*scale));
   const left=Math.round(p.character?p.pivot-c.cellW*scale/2:(p.w-w)/2);
   const top=Math.round(p.character?p.foot-p.sourceFoot*scale:(p.h-h)/2);
   const resized=await sharp(frame).extract(sourceBox).resize(w,h).png().toBuffer();
   // Fixed clip transform, then fixed cell clipping; no per-frame fit/jitter.
   const l=Math.max(0,-left),u=Math.max(0,-top),rw=Math.min(w-l,p.w-Math.max(0,left)),rh=Math.min(h-u,p.h-Math.max(0,top));
   const cell=await sharp({create:{width:p.w,height:p.h,channels:4,background:'#00000000'}}).composite([{input:await sharp(resized).extract({left:l,top:u,width:rw,height:rh}).toBuffer(),left:Math.max(0,left),top:Math.max(0,top)}]).png().toBuffer();
   normalized.push(cell);
  }
  const sw=p.w+2*p.pad,sh=p.h+2*p.pad;
  const inputs=Array.from({length:p.count},(_,i)=>({input:normalized[replacementFrame(c,p,i)],left:i%p.cols*sw+p.pad,top:Math.floor(i/p.cols)*sh+p.pad}));
  const dest=join(out,p.output);mkdirSync(dirname(dest),{recursive:true});
  await sharp({create:{width:p.cols*sw,height:Math.ceil(p.count/p.cols)*sh,channels:4,background:'#00000000'}}).composite(inputs).png({compressionLevel:9}).toFile(dest);
  evidence.push({...p,atlasW:p.cols*sw,atlasH:Math.ceil(p.count/p.cols)*sh});
 }
 // Campaign's canonical half-density atlas is separately referenced by its
 // existing metadata; replace it before preparation pages are generated.
 const lite=join(out,'assets/characters/dinh-loi/campaign-lite/idle-atlas.webp');mkdirSync(dirname(lite),{recursive:true});
 await sharp(join(out,'assets/characters/dinh-loi/idle-atlas.png')).resize(1920,1080).webp({quality:94}).toFile(lite);
 const portrait=join(out,'assets/characters/dinh-loi/owner-portrait.webp');
 await sharp(sources.get('dinh-idle')[0]).webp({quality:95}).toFile(portrait);
 writeFileSync(join(out,'assets/owner-refresh-20261018/build-manifest.json'),JSON.stringify(evidence,null,2)+'\n');
 return evidence;
}
function once(s,a,b){if(s.split(a).length!==2)throw new Error('Owner refresh owner missing/ambiguous: '+a.slice(0,90));return s.replace(a,()=>b);}
export function patchDinhOpening(s){
  // Basic owns both the enemy contact and the existing received-shield rules.
  const guardStart=s.indexOf('    if(isDinhLoi(actor)&&action==="skill"){');
  const guardEnd=s.indexOf('    if(isDinhLoi(actor)&&action==="ultimate"){',guardStart);
  if(guardStart<0||guardEnd<0)throw new Error('Dinh guard settlement owner missing');
  const guard=s.slice(guardStart,guardEnd);
  const basic=guard.replace('action==="skill"','action==="basic"')
   .replace('      const protectedAlly=', '      if(!target||target.hp<=0||target.team===actor.team)return;\n      applyDamage(actor,target,multiplier);\n      gainEnergy(actor,15);\n      const protectedAlly=');
  s=once(s,'    if (action === "basic" && !(isVersionedSkillKit(actor) && isOngPhoCarry(actor))) {',basic+'    if (action === "basic" && !(isVersionedSkillKit(actor) && isOngPhoCarry(actor))) {');
  s=once(s,'  async function performAction(actor, action, target) {', '  async function performAction(actor, action, target) {\n    if(isDinhLoi(actor)&&action==="skill"){action="basic";target=preferredTargetFor(actor,action);}');
  return s;
}
export function patchOwnerRefresh(input,kind){
 if(input.includes('/* OWNER_REFRESH_20261018 */'))return input;
 let s=input;
 if(kind==='battle'){
  const event="const event=eventOverride||(action==='ultimate'?'ultimate':action==='skill'?'skill':'basic');";
  s=once(s,event,"const event=eventOverride||ownerRefreshSoundEvent(actor,action)||(action==='ultimate'?'ultimate':action==='skill'?'skill':'basic'); /* OWNER_REFRESH_20261018 */");
  // This final installer runs AFTER battle-instant-skip-v1, which wraps every
  // readiness await. Bind to that production owner and share its cancellation.
  const ready='__hvActionAssets=await __hvSkipVisualAssets(()=>__hvBattleAssets.prepare(actor,action,target,battleId),battleId);';
  s=once(s,ready,ready+`\n      const ownerCue=ownerRefreshSoundEvent(actor,action);
      if(ownerCue&&state.sound)await __hvSkipVisualAssets(()=>window.HonVietSfx?.prepare(ownerCue,{signal:__hvActionAssets.signal,timeoutMs:2000}),battleId);`);
  const visualRuntime=readFileSync(new URL('../src/runtime/owner-visual-review.js',import.meta.url),'utf8');
  s=once(s,'function drawDinhLoiFx(',visualRuntime+'\nfunction drawDinhLoiFx(');
  // Patch the final descriptor before any action can prepare these new cells.
  s=once(s,'function dinhLoiImage(key){',`for(const key of ['ultimateVfx','ultimateImpact']){const c=DINH_LOI_CLIPS[key];const scale=c.cellW/270;c.cellW=480*scale;c.cellH=270*scale;c.atlasWidth=c.cellW*8;c.atlasHeight=c.cellH*8;}
  function dinhLoiImage(key){`);
  s=once(s,'const protectedAlly=target&&target.team===actor.team?target:Core.lowestHealth(friends)||actor;',
   'const protectedAlly=ownerDinhProtectedAlly(actor,target,friends);');
  s=patchDinhOpening(s);
  const attackStart=s.indexOf('    if(fx.kind==="basicProjectile"&&target)');
  const attackEnd=s.indexOf('    else if(fx.kind==="skill1Wave"',attackStart);
  if(attackStart<0||attackEnd<0)throw new Error('Owner ATK phase owner missing');
  s=s.slice(0,attackStart)+`    if((fx.kind==="basicProjectile"||fx.kind==="basicImpact")&&target)drawOwnerDinhAttack(context,DINH_LOI_IMAGES[fx.kind],frame,actor,target);
`+s.slice(attackEnd);
  // The authored contact is sufficient: do not add a generic impact ring.
  const genericImpact=s.match(/if\(([^\n]*!usesLucAnh[^\n]*)\) triggerImpactPresentation\(actor, target, action\);/g)||[];
  if(genericImpact.length!==1)throw new Error('Owner generic impact guard missing');
  s=s.replace(genericImpact[0],genericImpact[0].replace('if(','if(!usesDinhLoi && '));

  for(const [x,y,pad] of [[170,45,340],[120,10,240]]){
   s=once(s,`context.drawImage(image,sx,sy,cellW,cellH,${x},${y},WORLD.width-${pad},WORLD.height-${y*2})`,
    'drawOwnerDinhUltimate(context,image,sx,sy,cellW,cellH,actor)');
  }
  s=once(s,"__hvPersistentPages.draw(context,'dinh-shield',frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82})",
   'drawOwnerDinhShield(context,unit,frame)');
  s=once(s,'drawW=Math.min(790,Math.max(710,bounds.w+270)),drawH=Math.min(430,Math.max(390,bounds.h+250))','drawW=Math.min(790,Math.max(710,bounds.w+270)),drawH=drawW*270/480');
  s=s.replaceAll("dinh_loi:'assets/heroes-concept/crops/guardian-00.png'","dinh_loi:'assets/characters/dinh-loi/owner-portrait.webp'");
  s=once(s,"${base}${victory?'victory-text-clean-smooth-v5.apng':'defeat-clean-loop.apng'}","assets/owner-refresh-20261018/${victory?'result-victory-animated.webp':'result-defeat-animated.webp'}");
  s=once(s,'<div class="irv-hero-wrap">',`<img class="irv-word" alt="\${victory?'Victory':'Defeat'}" src="assets/owner-refresh-20261018/result-\${victory?'victory':'defeat'}-word.svg"><div class="irv-hero-wrap">`);
  s=once(s,'</head>',`<style>
/* Keep animated wings, remove only the old raster lettering above them. */
.irv-victory .irv-title{clip-path:polygon(0 0,18% 0,18% 33%,82% 33%,82% 0,100% 0,100% 100%,0 100%)}
.irv-defeat .irv-title{clip-path:polygon(0 0,27% 0,27% 28%,73% 28%,73% 0,100% 0,100% 100%,0 100%)}
.irv-word{position:absolute;left:50%;transform:translateX(-50%);width:100%;top:0;z-index:2;pointer-events:none;aspect-ratio:16/9;object-fit:contain}
.irv-defeat .irv-word{top:1.5%}
</style></head>`);

 }else{
  const art={slug:'dinh-loi',displayName:'Đình Lôi — Vệ Binh Trống Đồng',identityVersion:'owner-20261018',reference:{master:'assets/characters/dinh-loi/owner-portrait.webp',runtime:true},assets:Object.fromEntries(['master','avatar','card','dialogue','icon'].map(k=>[k,'assets/characters/dinh-loi/owner-portrait.webp']))};
  s=once(s,'let P=null, MEMORY_ONLY=false;',`/* OWNER_REFRESH_20261018 */\nCHARACTER_MANIFEST.dinh_loi=${JSON.stringify(art)};\nlet P=null, MEMORY_ONLY=false;`);
  s=once(s,"  if(id==='bach_dien'){ startBachDienDetailIdle(); }","  if(id==='bach_dien'){ startBachDienDetailIdle(); }\n  if(id==='dinh_loi'||id==='thay_mo')startOwnerRefreshDetailIdle(id);");
  const runtime=readFileSync(new URL('../src/ui/owner-refresh-detail.js',import.meta.url),'utf8');
  s=once(s,'function startBachDienDetailIdle(){',runtime+'\nfunction startBachDienDetailIdle(){');
 }
 return s;
}
export function installOwnerRefresh(root=process.cwd()){
 for(const [file,kind] of [['index.html','host'],['battle.html','battle']]){const p=join(root,'dist',file);writeFileSync(p,patchOwnerRefresh(readFileSync(p,'utf8'),kind));}
 fingerprintOwnerAssets(root);
}


// These legacy asset URLs are served immutable for a year. Keep old files for
// compatibility, but point every final host/battle consumer at content hashes.
export function fingerprintOwnerAssets(root,paths){
 const out=join(root,'dist'),mapping={};
 paths=paths||[...makeReplacementPlan().map(p=>p.output),
  'assets/characters/dinh-loi/campaign-lite/idle-atlas.webp',
  ...['atk','skill','ultimate'].map(k=>'assets/audio/sfx/dinh-loi/'+k+'.m4a'),
  'assets/audio/sfx/thay-mo/ultimate.m4a'];
 for(const source of paths){
  if(!existsSync(join(out,source)))throw new Error('Owner asset missing: '+source);
  const hash=createHash('sha256').update(readFileSync(join(out,source))).digest('hex').slice(0,16);
  const ext=extname(source),dest=source.slice(0,-ext.length)+'.'+hash+ext;
  copyFileSync(join(out,source),join(out,dest));mapping[source]=dest;
 }
 for(const file of ['index.html','battle.html']){
  const path=join(out,file);let html=readFileSync(path,'utf8');
  for(const [source,dest] of Object.entries(mapping)){
   html=html.replaceAll(source,dest);
   if(source.startsWith('assets/audio/sfx/'))html=html.replaceAll(source.slice(17),dest.slice(17));
   if(dirname(source)==='assets/characters/dinh-loi'){
    // Dinh's lazy owner concatenates a base directory and bare filenames.
    html=html.replace(/const DINH_LOI_ASSET_NAMES=Object.freeze\(\{[^\n]*\}\);/,block=>block.replaceAll('"'+basename(source)+'"','"'+basename(dest)+'"'));
   }
  }
  writeFileSync(path,html);
 }
 return mapping;
}
