import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let index = readFileSync(indexPath, 'utf8');

if (index.includes('id="samkok-r04-return-context"')) {
  throw new Error('Return context already installed');
}

const navMarker = 'function navTo(name){';
if ((index.match(new RegExp(navMarker, 'g')) || []).length !== 1) {
  throw new Error('navTo marker not found exactly once');
}
index = index.replace(navMarker, `${navMarker}
  const _hvReturnNavigation=window.HonVietReturnContext?.beforeNavigate?.({from:ST.screen,name,heroId:ST._heroDetailId});
  if(_hvReturnNavigation?.target) name=_hvReturnNavigation.target;`);

const showMarker = 'function showScreen(name){';
if ((index.match(new RegExp(showMarker, 'g')) || []).length !== 1) {
  throw new Error('showScreen marker not found exactly once');
}
index = index.replace(showMarker, `${showMarker}
  window.HonVietReturnContext?.beforeScreenChange?.({name,from:ST.screen,heroId:ST._heroDetailId});`);

const showEnd = 'ST.screen=name; playBgm(desiredBgm(name)); }';
if ((index.match(new RegExp(showEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
  throw new Error('showScreen tail marker not found exactly once');
}
index = index.replace(showEnd, 'ST.screen=name; playBgm(desiredBgm(name)); window.HonVietReturnContext?.afterScreenChange?.({name}); }');

const detailMarker = "function renderHeroDetail(id){ const _enteringHeroDetail=(ST.screen!=='heroDetail'||ST._heroDetailId!==id); ST._heroDetailId=id;";
if ((index.match(new RegExp(detailMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
  throw new Error('renderHeroDetail marker not found exactly once');
}
index = index.replace(detailMarker, "function renderHeroDetail(id){ const _enteringHeroDetail=(ST.screen!=='heroDetail'||ST._heroDetailId!==id); window.HonVietReturnContext?.enterHeroDetail?.({entering:_enteringHeroDetail,from:ST.screen,mode:ST.mode||null,encounterId:ST.battleId||ST.chapterIdx||null,heroId:id,filter:typeof heFilter==='string'?heFilter:'all'}); ST._heroDetailId=id;");

const runtime = String.raw`<script id="samkok-r04-return-context">
(()=>{
  "use strict";
  const SCHEMA="hon-viet-return-context/v1";
  const VERSION=1;
  const STORAGE_KEY="hon-viet:return-context:v1";
  const SCREEN=/^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
  const TOKEN=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
  const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
  const AVAILABLE=new Set(["hub","journey","campaign","expedition","team","heroes","heroDetail","daily","summon","tower","jobs","shop","arena","hunt","festival","forge","bag","mail","chat","guild","clan","friends","net","vault","story","battle","end"]);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const isRecord=value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  const token=(value,pattern=TOKEN)=>{
    if(value===undefined||value===null||value==="")return null;
    const result=String(value).trim();
    return pattern.test(result)?result:undefined;
  };
  const normalize=input=>{
    if(!isRecord(input)||(input.schema&&input.schema!==SCHEMA))return null;
    const route=input.sourceRoute||input.route;
    if(!isRecord(route))return null;
    const screen=String(route.screen||"").trim();
    if(!SCREEN.test(screen))return null;
    const params=route.params===undefined?{}:route.params;
    if(!isRecord(params))return null;
    const mode=token(input.mode),encounterId=token(input.encounterId,ID),heroId=token(input.heroId,ID),tab=token(input.tab),filter=token(input.filter);
    const scroll=input.scroll==null?{x:0,y:0}:input.scroll;
    if(!isRecord(scroll))return null;
    const x=Number(scroll.x||0),y=Number(scroll.y||0);
    const draftRevision=Number(input.draftRevision??input.revision??0);
    const capturedAt=Number(input.capturedAt||Date.now());
    if(mode===undefined||encounterId===undefined||heroId===undefined||tab===undefined||filter===undefined||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||!Number.isSafeInteger(draftRevision)||draftRevision<0||!Number.isFinite(capturedAt)||capturedAt<0)return null;
    return {schema:SCHEMA,schemaVersion:VERSION,sourceRoute:{screen,params:clone(params)},mode,encounterId,heroId,tab,filter,scroll:{x:Math.min(100000000,Math.round(x)),y:Math.min(100000000,Math.round(y))},draftRevision,capturedAt};
  };
  const read=()=>{try{const raw=sessionStorage.getItem(STORAGE_KEY);return raw?normalize(JSON.parse(raw)):null;}catch(_){return null;}};
  const write=value=>{try{if(value)sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value));else sessionStorage.removeItem(STORAGE_KEY);}catch(_){}};
  let context=read();
  const clear=()=>{context=null;write(null);return null;};
  const capture=input=>{
    const next=normalize(input);
    if(!next)return {ok:false,code:"INVALID_RETURN_CONTEXT"};
    context=next;write(context);return {ok:true,context:clone(context)};
  };
  const resolve=({availableScreens=AVAILABLE,currentRevision}={})=>{
    const next=normalize(context);
    const fallback="hub";
    if(!next)return {ok:false,code:"INVALID_RETURN_CONTEXT",target:fallback};
    const screens=new Set([...availableScreens].map(String));
    const target=next.sourceRoute.screen;
    if(!screens.has(target))return {ok:false,code:"RETURN_SOURCE_UNAVAILABLE",target:fallback,sourceRoute:next.sourceRoute};
    if(currentRevision!==undefined&&currentRevision!==null){
      const revision=Number(currentRevision);
      if(!Number.isSafeInteger(revision)||revision<0)return {ok:false,code:"INVALID_RETURN_REVISION",target:fallback};
      if(next.draftRevision>revision)return {ok:false,code:"RETURN_REVISION_AHEAD",target:fallback,sourceRoute:next.sourceRoute};
    }
    return {ok:true,target,sourceRoute:next.sourceRoute,context:clone(next)};
  };
  const readScroll=screen=>{
    const root=document.getElementById(screen+"Screen");
    const scroller=root?.querySelector?.(".scroll,[data-scroll-owner]")||root;
    return {x:Math.max(0,Math.round(scroller?.scrollLeft||0)),y:Math.max(0,Math.round(scroller?.scrollTop||0))};
  };
  const restoreScroll=next=>{
    const root=document.getElementById(next.sourceRoute.screen+"Screen");
    const scroller=root?.querySelector?.(".scroll,[data-scroll-owner]")||root;
    if(!scroller)return;
    if(typeof scroller.scrollTo==='function')scroller.scrollTo({left:next.scroll.x,top:next.scroll.y,behavior:"auto"});
    else{scroller.scrollLeft=next.scroll.x;scroller.scrollTop=next.scroll.y;}
  };
  const enterHeroDetail=({entering,from,mode,encounterId,heroId,filter}={})=>{
    if(!entering)return {ok:true,duplicate:true,context:context?clone(context):null};
    const sourceScreen=SCREEN.test(String(from||""))?String(from):"hub";
    return capture({sourceRoute:{screen:sourceScreen,params:encounterId?{encounterId}:{}},mode,encounterId,heroId,tab:"overview",filter:filter||"all",scroll:readScroll(sourceScreen),draftRevision:0});
  };
  const beforeNavigate=({from,name}={})=>{
    if(from!=="heroDetail"||name!=="heroes"||!context)return null;
    const result=resolve();
    if(!result.ok){clear();return {target:result.target,reason:result.code};}
    return {target:result.target,restored:result.context};
  };
  const beforeScreenChange=()=>null;
  const afterScreenChange=({name}={})=>{
    if(!context||name==="heroDetail")return null;
    const result=resolve();
    if(!result.ok||name!==result.target){clear();return null;}
    const next=result.context;
    requestAnimationFrame(()=>restoreScroll(next));
    clear();
    return next;
  };
  window.HonVietReturnContext=Object.freeze({schema:SCHEMA,schemaVersion:VERSION,capture,resolve,clear,enterHeroDetail,beforeNavigate,beforeScreenChange,afterScreenChange,snapshot:()=>context?clone(context):null});
})();
</script>`;

if (!index.includes('</body>')) throw new Error('Document body marker not found');
index = index.replace('</body>', runtime + '\n</body>');
writeFileSync(indexPath, index);
console.log('R04 return context installed: hero detail back route, session context and stale fallback');
