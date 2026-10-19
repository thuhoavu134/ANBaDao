import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {BE_AN_HERO} from '../src/domain/hero/be-an.mjs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('BE_AN_ANCHOR '+a.slice(0,90));return s.replace(a,()=>b);};
export function patchBeAnBattle(input,runtime,meta){
 if(input.includes('/* BE_AN_RUNTIME_V1 */'))return input;
 let s=once(input,'async function performSplusAction(actor, action, target) {','/* BE_AN_RUNTIME_V1 */\nconst BE_AN_META='+JSON.stringify(meta)+';\n'+runtime+'\nasync function performSplusAction(actor, action, target) {');
 s=once(s,'  const e=splusCombat(),battleId=state.battleId;','  const e=splusCombat(),battleId=state.battleId;\n  if(isBeAn(actor))return performBeAnAction(actor,action,target,e,battleId);');
 s=once(s,'function drawSplusToken(context, unit, time) {','function drawSplusToken(context, unit, time) {\n  if(isBeAn(unit))return drawBeAnHero(context,unit,time);');
 s=once(s,'  async function advanceTurn() {','  async function advanceTurn() {\n    if(!await waitBeAnReactions(state.battleId))return;');
 s=once(s,'function splusReset(){','function splusReset(){cancelBeAn();');
 s=once(s,'function splusEvent(event) {','function splusEvent(event) {beAnEvent(event);');
 s=once(s,'function splusHeroConfig(raw, index) {',"function splusHeroConfig(raw, index) {\n if(/^(?:be_an|be-an)$/.test(raw?.sourceId||raw?.id||''))raw={...raw,sourceId:'hero_splus_be_an'};");
 s=once(s,"visualSource:kit.key==='linh_dong'?","visualSource:kit.key==='be_an'?'be-an-authored':kit.key==='linh_dong'?");
 s=once(s,'    drawEffects(ctx, time);','    drawEffects(ctx, time);\n    drawBeAnVfx(ctx,time);');
 // Preserve existing slot branch so previous installers retain their anchors.
 const slots=s.match(/const slots=([^;]+)\?\['passive','ultimate'\]:\['passive','skill','ultimate'\];/g);if(slots?.length!==1)throw Error('BE_AN_SKILL_SLOTS');s=once(s,slots[0],slots[0].replace('const slots=','const slots=isBeAn(actor)||'));
 s=once(s,'const authoredFallMs=',"const authoredFallMs=isBeAn(unit)?4000/Math.max(1,state.speed):");
 s=once(s,'unit.defeatHideDuration = ',"unit.defeatHideDuration = isBeAn(unit)?authoredFallMs+120/Math.max(1,state.speed):");
 s=once(s,'const STATUS_ICON_SOURCES = Object.freeze({','const STATUS_ICON_SOURCES = Object.freeze({\n sealPaw:"assets/ui/status/seal-paw.svg",sealSulks:"assets/ui/status/seal-paw.svg",');
 s=once(s,'      if(isNemVi){',`      if(status.type==='sealPaw'||status.type==='sealSulks'){context.fillStyle='#fff';context.font='bold 11px sans-serif';context.textAlign='center';context.fillText(String(status.stacks||1),sx+size*.3,sy+size*.4);}
      if(isNemVi){`);
 return s;
}
export function beAnCampaignDescriptor(meta,key){const c=meta.clips[key];return {src:'assets/characters/be-an/'+c.pages[0].file,frames:c.frames,cols:c.cols,cellW:c.cellW,cellH:c.cellH,ms:1000/24,pivot:c.pivot,foot:c.foot,body:c.body,playbackRate:1};}
export function beAnIdlePages(meta){const c=meta.clips.idle;return {pageFrames:c.pageFrames,poster:null,pages:c.pages.map(p=>({src:'assets/characters/be-an/'+p.file,cols:p.cols,cellW:c.cellW,cellH:c.cellH,pivot:c.pivot,foot:c.foot,body:c.body,rows:p.rows||Math.ceil(p.frames/p.cols)||5}))};}
export function patchBeAnHost(input,meta){
 if(input.includes('/* BE_AN_HOST_V1 */'))return input;
 const h=BE_AN_HERO,hero={he:h.element,faction:'hu_mong',archetype:h.role,rarity:'ssr',name:h.name,role:'Hải cẩu / Phản kích / Hộ mệnh',col:'#e8dfc6',stats:{hp:1050,mp:60,atk:145,def:55,spd:112},passive:{name:h.passive.name,desc:h.passive.description},skill:{name:h.actions.basic.name,cost:0,desc:h.actions.basic.description,fx:{kind:'damage',target:'enemy',power:1.4}},ultimate:{name:h.actions.ultimate.name,cost:60,desc:h.actions.ultimate.description,fx:{kind:'damage',target:'aoe_enemy',power:3}}};
 const art={slug:'be-an',displayName:h.name,identityVersion:'source24-20261018',reference:{master:h.art.portrait,runtime:true},assets:Object.fromEntries(['master','avatar','card','dialogue','icon'].map(k=>[k,h.art.portrait]).concat([['idle','assets/characters/be-an/idle-0-35de8825.webp']])),surfaces:['roster','formation','hero-detail','battle']};
 let s=once(input,'let P=null, MEMORY_ONLY=false;','/* BE_AN_HOST_V1 */\nDATA.heroes.be_an='+JSON.stringify(hero)+';\nCHARACTER_MANIFEST.be_an='+JSON.stringify(art)+';\nlet P=null, MEMORY_ONLY=false;');
 const init='const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};';
 s=once(s,init,init+'\nheroes.be_an.owned=true;');
 const mig='for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};';
 s=once(s,mig,mig+'\nif(!p.flags?.beAnStarter20261018){p.heroes.be_an.owned=true;p.flags=p.flags||{};p.flags.beAnStarter20261018=true;}');
 // JS array literals only: the old pattern also rewrote CSS [data-hero-id="hong_thuong"] selectors.
 s=s.replace(/\[((?:"[a-z0-9_]+",)*"hong_thuong"(?:,"co_nuong")?)\]/g,'[$1,"be_an"]');
 s=once(s,"const id=String(value||'').replace(/-/g,'_');","const id=String(value||'').replace(/-/g,'_');if(id==='hero_splus_be_an')return 'be_an';");
 s=once(s,'function preparationSpriteFor(pick, time) {','Object.assign(spriteSpecs,{be_an:'+JSON.stringify(beAnCampaignDescriptor(meta,'idle'))+'});\nObject.assign(preparationIdlePacks,{be_an:'+JSON.stringify(beAnIdlePages(meta))+'});\nfunction preparationSpriteFor(pick, time) {');
 s=once(s,'function frameAt(spec, time) {','Object.assign(runSpecs,{be_an:'+JSON.stringify(beAnCampaignDescriptor(meta,'run'))+'});\nObject.assign(farmAttackSpecs,{be_an:'+JSON.stringify(beAnCampaignDescriptor(meta,'basic'))+'});\nfunction frameAt(spec, time) {');
 s=once(s,"if(id==='bach_dien'){ startBachDienDetailIdle(); }","if(id==='bach_dien'){ startBachDienDetailIdle(); }\nif(id==='be_an')startBeAnDetailIdle();");
 s=once(s,"id==='bach_dien'?'<canvas id=","id==='be_an'?'<canvas id=\"beAnDetailIdle\" width=\""+(meta.detail||meta.clips.idle).cellW+"\" height=\""+(meta.detail||meta.clips.idle).cellH+"\" aria-label=\"Bé An idle\"></canvas>':id==='bach_dien'?'<canvas id=");
 s=once(s,'function startBachDienDetailIdle(){',`const BE_AN_META_DETAIL=${JSON.stringify(meta.detail?{cellW:meta.detail.cellW,cellH:meta.detail.cellH,cols:meta.detail.cols,frames:meta.detail.frames,durationMs:meta.detail.durationMs,src:'assets/characters/be-an/'+meta.detail.file}:{cellW:meta.clips.idle.cellW,cellH:meta.clips.idle.cellH,cols:meta.clips.idle.pages[0].cols||meta.clips.idle.cols,frames:meta.clips.idle.frames,durationMs:meta.clips.idle.durationMs,src:'assets/characters/be-an/'+meta.clips.idle.pages[0].file})};
 function startBeAnDetailIdle(){
 cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('beAnDetailIdle');if(!cv)return;
 const cellW=BE_AN_META_DETAIL.cellW,cellH=BE_AN_META_DETAIL.cellH,ctx=cv.getContext('2d');
 const image=new Image();image.decoding='async';image.src=BE_AN_META_DETAIL.src;
 const start=performance.now();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const rate=BE_AN_META_DETAIL.frames/BE_AN_META_DETAIL.durationMs,cols=BE_AN_META_DETAIL.cols;
 function tick(){if(!cv.isConnected){image.src='';return;}const frame=Math.floor((performance.now()-start)*rate)%BE_AN_META_DETAIL.frames;if(image.complete&&image.naturalWidth){ctx.clearRect(0,0,cellW,cellH);ctx.imageSmoothingQuality='high';ctx.drawImage(image,(frame%cols)*cellW,Math.floor(frame/cols)*cellH,cellW,cellH,0,0,cellW,cellH);}_lucDetailRaf=requestAnimationFrame(tick);}tick();
 }
 function startBachDienDetailIdle(){`);
 s=once(s,'</head>','<style>#hdBody .hstage[data-hero-id="be_an"]{position:relative!important;padding-top:420px!important}#hdBody .hstage[data-hero-id="be_an"]>.hsava{display:none!important}#beAnDetailIdle{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:600px;height:auto;aspect-ratio:11/7;max-width:none;pointer-events:none}</style></head>');
 return s;
}
export function installBeAn(root){
 const meta=JSON.parse(readFileSync(join(root,'assets/characters/be-an/runtime-meta.json'),'utf8'));
 const battle=join(root,'dist/battle.html'),host=join(root,'dist/index.html');
 writeFileSync(battle,patchBeAnBattle(readFileSync(battle,'utf8'),readFileSync(join(root,'src/runtime/be-an.js'),'utf8'),meta));
 writeFileSync(host,patchBeAnHost(readFileSync(host,'utf8'),meta));
}
