import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let index = readFileSync(indexPath, 'utf8');
const moduleSource = readFileSync(
  join(process.cwd(), 'src/domain/quest/opening-loop-contract.mjs'),
  'utf8'
).replace(/^export\s+/gm, '');

new Function(moduleSource);

const moduleMarker = '/* Hồn Việt R10: opening loop core */';
if (index.includes(moduleMarker)) throw new Error('Opening loop core already installed');
const heroMarker = 'function levelUpHero(';
if (!index.includes(heroMarker)) throw new Error('Hero upgrade marker not found');
const exposedCore = [
  '/* Hồn Việt R10: opening loop core */',
  'window.HonVietOpeningLoopCore=Object.freeze({',
  '  OPENING_LOOP_CONTRACT_SCHEMA,OPENING_LOOP_SCHEMA_VERSION,OPENING_EVENT_LIMIT,',
  '  OPENING_STEP_STATUSES,OPENING_LOOP_STATUSES,OPENING_COUNT_MODES,',
  '  validateOpeningStep,validateOpeningGraph,buildOpeningEventKey,',
  '  createOpeningLoopState,advanceOpeningLoop,claimOpeningStep,',
  '  validateOpeningResume,getOpeningLoopView,skipOpeningLoop',
  '});'
].join('\n');
index = index.replace(heroMarker, moduleSource + '\n' + exposedCore + '\n' + heroMarker);

const battleMarker = 'if (!transaction.duplicate && typeof questProgress === "function") {';
if (!index.includes(battleMarker)) throw new Error('R08 settlement hook marker not found');
index = index.replace(
  battleMarker,
  'if (!transaction.duplicate) {\n      window.__HV_MAIN_QUEST_RUNTIME_V1?.onBattleResult?.(payload);\n      window.HonVietOpeningLoop?.record?.("campaign.win",{sourceId:safeText(payload.battleId,"battle"),periodKey:"permanent",route:{screen:"campaign"}});\n    }\n    ' + battleMarker
);

const upgradeMarker = "if(!tx.duplicate) questProgress('level',1);";
if (!index.includes(upgradeMarker)) throw new Error('R07 upgrade success marker not found');
index = index.replace(
  upgradeMarker,
  "if(!tx.duplicate){ window.HonVietOpeningLoop?.record?.('hero.upgrade',{sourceId:id,periodKey:'permanent',route:{screen:'heroes'}}); questProgress('level',1); }"
);

const journeyStart = index.indexOf("b.querySelectorAll('.jmclaim')");
const journeyEnd = index.indexOf('function journeyTutorial', journeyStart);
const journeySlice = journeyStart >= 0 && journeyEnd > journeyStart
  ? index.slice(journeyStart, journeyEnd)
  : '';
if (!journeySlice.includes('claimJourneyMilestone')) throw new Error('Journey render marker not found');
const journeyClose = index.lastIndexOf('}', journeyEnd);
if (journeyClose < journeyStart) throw new Error('Journey render close marker not found');
index = index.slice(0, journeyClose) +
  ' window.HonVietOpeningLoop?.renderJourney?.(b);' +
  index.slice(journeyClose);

if (index.includes('id="samkok-r10-opening-loop"')) throw new Error('Opening loop runtime already installed');
const runtime = [
'<script id="samkok-r10-opening-loop">',
'(()=>{',
'  "use strict";',
'  const core=window.HonVietOpeningLoopCore;',
'  if(!core){window.__hvOpeningLoopError="CORE_MISSING";return;}',
'  const DEFINITIONS=Object.freeze([',
'    {id:"opening.campaign.stage-1",label:"Vượt ải đầu Chương 1",description:"Đánh xuyên Chương 1 bằng route chiến dịch hiện tại.",eventId:"campaign.win",target:1,route:{screen:"campaign",anchorId:"chapter-0-stage-1"},next:"opening.campaign.stage-2"},',
'    {id:"opening.campaign.stage-2",label:"Hoàn tất ải boss Chương 1",description:"Giữ auto-chain tới trận kết chương.",eventId:"campaign.win",target:1,prerequisite:["opening.campaign.stage-1"],route:{screen:"campaign",anchorId:"chapter-0-stage-2"},next:"opening.formation"},',
'    {id:"opening.formation",label:"Lưu đội hình 6 tướng",description:"Xếp đội và lưu snapshot đội hình trước khi nuôi tiếp.",eventId:"formation.save",target:1,prerequisite:["opening.campaign.stage-2"],route:{screen:"team",anchorId:"starter-formation"},next:"opening.hero.upgrade"},',
'    {id:"opening.hero.upgrade",label:"Nâng một tướng",description:"Dùng lệnh nâng cấp hiện có; không phát sinh seed hay giá trị mới.",eventId:"hero.upgrade",target:1,prerequisite:["opening.formation"],route:{screen:"heroes",anchorId:"starter-upgrade"},next:"opening.hero.equip"},',
'    {id:"opening.hero.equip",label:"Mặc một trang bị",description:"Mặc một món từ kho hiện tại rồi kết thúc lát cắt.",eventId:"hero.equip",target:1,prerequisite:["opening.hero.upgrade"],route:{screen:"forge",anchorId:"starter-equipment"},next:null,terminal:true}',
'  ]);',
'  const GRAPH=core.validateOpeningGraph({entryId:"opening.campaign.stage-1",steps:DEFINITIONS});',
'  if(!GRAPH.ok){window.__hvOpeningLoopError=GRAPH.code;return;}',
'  const safeScreens=new Set(["campaign","team","heroes","forge","hub","summon"]);',
'  const ensureState=(profile=P)=>{',
'    if(!profile)return null;',
'    if(!profile.openingLoop){',
'      const created=core.createOpeningLoopState({entryId:GRAPH.entryId,steps:DEFINITIONS});',
'      if(!created.ok){window.__hvOpeningLoopError=created.code;return null;}',
'      profile.openingLoop=created.state;',
'    }',
'    const check=core.validateOpeningResume(profile.openingLoop,{entryId:GRAPH.entryId,steps:DEFINITIONS});',
'    if(!check.ok){window.__hvOpeningLoopError=check.code;return null;}',
'    return profile.openingLoop;',
'  };',
'  const applyToState=(profile,eventId,detail={})=>{',
'    const state=ensureState(profile);',
'    if(!state)return {ok:false,code:window.__hvOpeningLoopError||"OPENING_STATE_UNAVAILABLE"};',
'    const result=core.advanceOpeningLoop(state,{entryId:GRAPH.entryId,steps:DEFINITIONS},{...detail,eventId});',
'    if(result.ok&&!result.duplicate)profile.openingLoop=result.state;',
'    return result;',
'  };',
'  const saveState=(state,previous)=>{',
'    P.openingLoop=state;',
'    const saved=typeof persist==="function"?persist():false;',
'    if(saved)return {ok:true};',
'    P.openingLoop=previous;',
'    return {ok:false,code:"SAVE_WRITE_FAILED",message:"Không thể lưu opening loop."};',
'  };',
'  const record=(eventId,detail={})=>{',
'    const state=ensureState();',
'    if(!state)return {ok:false,code:window.__hvOpeningLoopError||"OPENING_STATE_UNAVAILABLE"};',
'    const result=core.advanceOpeningLoop(state,{entryId:GRAPH.entryId,steps:DEFINITIONS},{...detail,eventId});',
'    if(!result.ok||result.duplicate)return result;',
'    const saved=saveState(result.state,state);',
'    return saved.ok?result:saved;',
'  };',
'  const view=()=>{',
'    const state=ensureState();',
'    return state?core.getOpeningLoopView(state,{entryId:GRAPH.entryId,steps:DEFINITIONS}):{ok:false,code:window.__hvOpeningLoopError||"OPENING_STATE_UNAVAILABLE"};',
'  };',
'  const go=(stepId)=>{',
'    const current=view();',
'    if(!current.ok)return current;',
'    const wanted=stepId?DEFINITIONS.find(step=>step.id===stepId):current.current;',
'    if(!wanted)return {ok:false,code:"UNKNOWN_OPENING_ROUTE"};',
'    if(!safeScreens.has(wanted.route.screen))return {ok:false,code:"UNSAFE_OPENING_ROUTE"};',
'    if(typeof navTo!=="function")return {ok:false,code:"NAVIGATION_UNAVAILABLE"};',
'    navTo(wanted.route.screen);',
'    return {ok:true,screen:wanted.route.screen,anchorId:wanted.route.anchorId||null,stepId:wanted.id};',
'  };',
'  const renderJourney=(root)=>{',
'    if(!root||root.querySelector("[data-hv-opening-loop]"))return;',
'    const current=view();',
'    if(!current.ok)return;',
'    const step=current.current;',
'    const status=current.status==="terminal"?"Đã hoàn tất":step?(step.label+" · "+current.currentProgress+"/"+step.target):"Đã dừng";',
'    const button=step&&current.canResume?("<button class=\\"btn sm\\" data-hv-opening-go=\\""+step.id+"\\">Đến ngay</button>"):"";',
'    root.insertAdjacentHTML("beforeend","<div class=\\"section\\" data-hv-opening-loop><h3>🌙 Vòng mở đầu Hồn Việt</h3><div style=\\"font-size:13px;line-height:1.6;color:#c5cee9\\"><b>"+status+"</b><br><span style=\\"color:#8b95bd\\">Hoàn thành từng bước để sẵn sàng cho những trận tiếp theo.</span></div><div style=\\"margin-top:10px\\">"+button+"</div></div>");',
'    const goButton=root.querySelector("[data-hv-opening-go]");',
'    if(goButton)goButton.addEventListener("click",()=>go(goButton.dataset.hvOpeningGo));',
'  };',
'  window.HonVietOpeningLoop=Object.freeze({definitions:DEFINITIONS,view,record,applyToState,go,renderJourney});',
'})();',
'</script>'
].join('\n');
index=index.replace('</body>',runtime+'\n</body>');

writeFileSync(indexPath,index);
console.log('R10 opening loop installed: event/route/prerequisite contract and safe journey CTA');

