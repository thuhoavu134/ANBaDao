import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAIN_QUEST_SCHEMA,
  claimMainQuest,
  createMainQuestState,
  getCurrentMainQuest,
  recordMainQuestBattle
} from '../src/domain/quest/main-quest.mjs';

const root = process.cwd();
const indexPath = join(root, 'dist', 'index.html');

function assertQuestContract() {
  const state = createMainQuestState();
  const quest = getCurrentMainQuest(state, {
    chapterCount: 2,
    stageCount: 2,
    battleId: 'build-quest-battle',
    title: 'Mộng Phố'
  });
  const completed = recordMainQuestBattle(state, quest, {
    win: true,
    battleId: quest.battleId,
    at: 1
  });
  const claimed = claimMainQuest(completed.state, quest, {
    chapterCount: 2,
    stageCount: 2,
    hasNextChapter: true,
    reward: { gold: 120 }
  });
  if (MAIN_QUEST_SCHEMA !== 'hon-viet-main-quest/v1') throw new Error('main quest schema drift');
  if (!completed.changed || !claimed.changed || claimed.state.stageIndex !== 1) {
    throw new Error('main quest progression contract drift');
  }
}

assertQuestContract();

function browserQuestModuleSource() {
  return readFileSync(join(root, 'src', 'domain', 'quest', 'main-quest.mjs'), 'utf8')
    .replace(/^export\s+/gm, '');
}

function runtimeSource() {
  const moduleSource = browserQuestModuleSource();
  return `/* hv-main-quest-v1-runtime */\n(()=>{\n  const __hvMainQuestModule=(()=>{\n${moduleSource}\n    return {MAIN_QUEST_SCHEMA,createMainQuestState,normalizeMainQuestState,mainQuestId,getCurrentMainQuest,recordMainQuestBattle,claimMainQuest};\n  })();\n  window.__HV_MAIN_QUEST_MODULE_V1=__hvMainQuestModule;\n\n  const chapterCount=()=>Array.isArray(DATA?.chapters)?DATA.chapters.length:0;\n  const sequenceFor=(chapterIndex)=>{\n    try{ const seq=typeof chapterBattleSequence==='function'?chapterBattleSequence(chapterIndex):[]; return Array.isArray(seq)&&seq.length?seq:['']; }catch(_){ return ['']; }\n  };\n  const ensure=()=>{\n    const existing=(P.hvMainQuest&&typeof P.hvMainQuest==='object')?P.hvMainQuest:((P.mainQuest&&typeof P.mainQuest==='object')?P.mainQuest:{});\n    const normalized=__hvMainQuestModule.normalizeMainQuestState(existing,{\n      chapterCount:chapterCount(),\n      stageCount:(idx)=>sequenceFor(idx).length\n    });\n    P.hvMainQuest=normalized;\n    return normalized;\n  };\n  const current=()=>{\n    const state=ensure();\n    if(state.allComplete)return __hvMainQuestModule.getCurrentMainQuest(state,{chapterCount:chapterCount(),stageCount:1,battleId:null,title:'Biên Niên Hồn Việt',objective:'Đã hoàn thành tuyến nhiệm vụ'});\n    const sequence=sequenceFor(state.chapterIndex);\n    const ch=DATA.chapters?.[state.chapterIndex]||{};\n    return __hvMainQuestModule.getCurrentMainQuest(state,{\n      chapterCount:chapterCount(),\n      stageCount:sequence.length,\n      battleId:sequence[state.stageIndex]||null,\n      title:ch.name||('Chương '+(state.chapterIndex+1)),\n      objective:'Vượt ải '+(state.chapterIndex+1)+'-'+(state.stageIndex+1)\n    });\n  };\n  const rewardFor=(quest)=>({\n    gold:120+(quest.chapterIndex*30)+(quest.stageIndex*15),\n    gems:quest.stageNumber%3===0?5:0\n  });\n  const rewardItems=(reward)=>Object.entries(reward).filter(([,value])=>Number(value)>0).map(([key,value])=>({icon:key==='gold'?'🪙':'💎',label:key==='gold'?'Vàng':'Ngọc',value}));\n  const persistQuest=()=>{ if(typeof persist==='function')persist(); if(typeof refreshResbar==='function')refreshResbar(); };\n  const showQuestReward=(quest,reward)=>{\n    const desc='Đã vượt '+(quest.objective||('ải '+quest.stageNumber))+' · tuyến nhiệm vụ tự mở ải kế tiếp.';\n    if(typeof showRewardCeremony==='function')showRewardCeremony('NHIỆM VỤ CHÍNH TUYẾN',desc,rewardItems(reward),'📜','Phần thưởng nhiệm vụ');\n    else if(typeof toast==='function')toast('📜 Hoàn thành '+(quest.objective||'nhiệm vụ chính tuyến'));\n  };\n  const claimReady=()=>{\n    const state=ensure(), quest=current();\n    if(!quest.ready)return false;\n    const sequence=sequenceFor(state.chapterIndex);\n    const out=__hvMainQuestModule.claimMainQuest(state,quest,{\n      chapterCount:chapterCount(),stageCount:sequence.length,\n      hasNextChapter:state.chapterIndex+1<chapterCount(),reward:rewardFor(quest)\n    });\n    if(!out.changed)return false;\n    P.hvMainQuest=out.state;\n    applyReward(out.reward||{});\n    persistQuest();\n    showQuestReward(quest,out.reward||{});\n    renderQuestSurfaces();\n    return true;\n  };\n  const onBattleResult=(payload={})=>{\n    if(!payload?.win)return false;\n    const state=ensure(), quest=current();\n    if(!quest.battleId)return false;\n    const out=__hvMainQuestModule.recordMainQuestBattle(state,quest,{win:true,battleId:payload.battleId,at:Date.now()});\n    if(!out.changed){\n      persistQuest();\n      return false;\n    }\n    P.hvMainQuest=out.state;\n    /* The continuous campaign already advances after the result. Claim the\n       small 3Q-style mission reward here so the next encounter is the next\n       quest instead of leaving the player on a stale (1/1) task. */\n    const sequence=sequenceFor(state.chapterIndex);\n    const claimed=__hvMainQuestModule.claimMainQuest(out.state,quest,{\n      chapterCount:chapterCount(),stageCount:sequence.length,\n      hasNextChapter:state.chapterIndex+1<chapterCount(),reward:rewardFor(quest)\n    });\n    P.hvMainQuest=claimed.changed?claimed.state:out.state;\n    const reward=claimed.reward||rewardFor(quest);\n    applyReward(reward);\n    persistQuest();\n    if(typeof showProgressBurst==='function')showProgressBurst('Nhiệm vụ hoàn thành',quest.objective+' · tự mở nhiệm vụ kế tiếp');\n    else if(typeof toast==='function')toast('📜 Hoàn thành '+quest.objective);\n    renderQuestSurfaces();\n    return true;\n  };\n  const go=()=>{\n    const quest=current();\n    if(quest.complete){ navTo('daily'); return; }\n    if(quest.ready&&claimReady())return;\n    const state=ensure();\n    if(typeof startChapter==='function'){\n      startChapter(state.chapterIndex,{fromMainQuest:true});\n    }else navTo('campaign');\n  };\n  const panelHtml=(compact=false)=>{\n    const quest=current();\n    if(quest.complete)return '<div class="hv-main-quest-complete"><b>🌅 Đã hoàn thành tuyến nhiệm vụ</b><small>Biên Niên hiện tại đã đi hết.</small></div>';\n    const state=ensure();\n    const total=sequenceFor(state.chapterIndex).length;\n    const label=quest.ready?'NHẬN THƯỞNG':'ĐẾN NGAY';\n    return '<div class="hv-main-quest-kicker">NHIỆM VỤ CHÍNH TUYẾN</div>'\n      +'<div class="hv-main-quest-title">Chương '+quest.chapterNumber+' · '+esc(quest.title)+'</div>'\n      +'<div class="hv-main-quest-objective">'+esc(quest.objective)+' · ('+quest.progress+'/1)</div>'\n      +'<div class="hv-main-quest-progress"><i style="width:'+Math.round(quest.progress*100)+'%"></i></div>'\n      +'<div class="hv-main-quest-meta">Ải '+quest.stageNumber+'/'+Math.max(1,total)+' · 6v6 tự động · -'+(DATA.daily?.costCampaign||6)+'⚡</div>'\n      +'<button type="button" class="btn gold sm hv-main-quest-cta" data-hv-main-quest-cta="1">'+label+'</button>';\n  };\n  const bindCta=(rootEl)=>{\n    rootEl?.querySelectorAll?.('[data-hv-main-quest-cta]').forEach((button)=>{\n      button.addEventListener('click',(event)=>{event.preventDefault();event.stopPropagation();go();});\n    });\n  };\n  const renderHubPanel=(rootEl)=>{\n    if(!rootEl)return;\n    rootEl.querySelector('#hv-main-quest-hub')?.remove();\n    const card=document.createElement('section');\n    card.id='hv-main-quest-hub';\n    card.className='hv-main-quest-hub';\n    card.setAttribute('data-testid','main-quest-hub');\n    card.innerHTML=panelHtml(true);\n    rootEl.querySelector('.art-hub')?.appendChild(card);\n    bindCta(card);\n  };\n  const renderDailyPanel=(rootEl)=>{\n    if(!rootEl)return;\n    rootEl.querySelector('#hv-main-quest-daily')?.remove();\n    const section=document.createElement('section');\n    section.id='hv-main-quest-daily';\n    section.className='section hv-main-quest-daily';\n    section.setAttribute('data-testid','main-quest-daily');\n    section.innerHTML=panelHtml(false)+'<small class="hv-main-quest-hint">Tuyến nhiệm vụ nối thẳng bản đồ ải; thưởng nhận ngay sau mỗi trận thắng.</small>';\n    rootEl.prepend(section);\n    bindCta(section);\n  };\n  const renderQuestSurfaces=()=>{\n    if(ST?.screen==='hub'){ const stage=document.getElementById('mainStage'); if(stage)renderHubPanel(stage); }\n    if(ST?.screen==='daily'){ const body=document.getElementById('dailyBody'); if(body)renderDailyPanel(body); }\n  };\n  window.__HV_MAIN_QUEST_RUNTIME_V1=Object.freeze({schema:__hvMainQuestModule.MAIN_QUEST_SCHEMA,ensure,current,onBattleResult,claimReady,go,renderHubPanel,renderDailyPanel,renderQuestSurfaces});\n  ensure();\n  persistQuest();\n  renderQuestSurfaces();\n})();`;
}

const style = `<style id="hv-main-quest-v1-style">
.hv-main-quest-hub{position:absolute;left:clamp(10px,3.4vw,42px);bottom:clamp(88px,15vh,142px);z-index:35;width:min(310px,calc(100% - 20px));padding:13px 14px 12px;border:1px solid rgba(220,178,81,.78);border-radius:15px;background:linear-gradient(145deg,rgba(25,18,29,.96),rgba(13,28,31,.94));box-shadow:0 10px 28px rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,239,170,.08);color:#f4e7c2;backdrop-filter:blur(5px)}
.hv-main-quest-kicker{font-size:10px;letter-spacing:.12em;font-weight:900;color:#f2c75c}.hv-main-quest-title{margin-top:3px;font-size:15px;font-weight:900;color:#fff0bf}.hv-main-quest-objective{margin-top:3px;font-size:12px;color:#e3d1ae}.hv-main-quest-progress{height:5px;margin:9px 0 6px;border-radius:99px;background:rgba(255,255,255,.13);overflow:hidden}.hv-main-quest-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#d49b38,#f4df88)}.hv-main-quest-meta{font-size:10px;color:#aab7b0}.hv-main-quest-cta{margin-top:9px;min-width:98px;font-size:11px;letter-spacing:.04em}.hv-main-quest-complete b{display:block;font-size:14px;color:#ffe59a}.hv-main-quest-complete small{display:block;margin-top:3px;color:#b3c0b9;font-size:11px}.hv-main-quest-daily{border-color:rgba(218,177,80,.7)!important;background:linear-gradient(145deg,rgba(28,21,32,.96),rgba(12,31,33,.94))!important}.hv-main-quest-daily .hv-main-quest-meta{font-size:11px}.hv-main-quest-hint{display:block;margin-top:8px;color:#9eb1aa;font-size:11px;line-height:1.45}.hv-main-quest-daily .hv-main-quest-cta{min-height:40px;padding-inline:18px}
@media(max-width:640px){.hv-main-quest-hub{left:10px;right:10px;bottom:87px;width:auto;padding:10px 12px}.hv-main-quest-hub .hv-main-quest-meta{font-size:9px}.hv-main-quest-hub .hv-main-quest-cta{margin-top:6px}.hv-main-quest-daily{margin-inline:8px!important}}
</style>`;

function patchIndex() {
  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes('/* hv-main-quest-v1-runtime */')) {
    const mainClose = html.indexOf('</script>');
    if (mainClose < 0) throw new Error('main quest runtime missing primary script anchor');
    html = html.slice(0, mainClose) + runtimeSource() + '\n' + html.slice(mainClose);
  }
  if (!html.includes('id="hv-main-quest-v1-style"')) {
    if (!html.includes('</head>')) throw new Error('main quest style missing head anchor');
    html = html.replace('</head>', style + '\n</head>');
  }

  if (!html.includes('window.__HV_MAIN_QUEST_RUNTIME_V1?.onBattleResult?.(payload);')) {
    const battleHook = /(if\s*\(!payload\.win\)\s*return;)/;
    if (!battleHook.test(html)) throw new Error('main quest battle hook anchor missing');
    html = html.replace(battleHook, '$1\n    window.__HV_MAIN_QUEST_RUNTIME_V1?.onBattleResult?.(payload);');
  }
  if (!html.includes('window.__HV_MAIN_QUEST_RUNTIME_V1?.renderDailyPanel?.(b);')) {
    const dailyAnchor = '  const ql=document.getElementById(\'questList\');';
    if (!html.includes(dailyAnchor)) throw new Error('main quest daily render anchor missing');
    html = html.replace(dailyAnchor, '  window.__HV_MAIN_QUEST_RUNTIME_V1?.renderDailyPanel?.(b);\n' + dailyAnchor);
  }

  /* The two adapters below keep the source functions readable while routing
     the UI through the runtime object injected into the primary script. */
  if (!html.includes('window.__HV_MAIN_QUEST_RUNTIME_V1?.renderHubPanel?.(st);')) {
    const hubAnchor = "  st.querySelectorAll('[data-art-go]').forEach(b=>{";
    if (!html.includes(hubAnchor)) throw new Error('main quest hub render anchor missing');
    html = html.replace(hubAnchor, '  window.__HV_MAIN_QUEST_RUNTIME_V1?.renderHubPanel?.(st);\n' + hubAnchor);
  }

  if (!html.includes('/* hv-main-quest-v1-runtime */') || !html.includes("setAttribute('data-testid','main-quest-hub')")) {
    throw new Error('main quest runtime injection failed');
  }
  writeFileSync(indexPath, html);
  console.log('3Q-style main quest v1 wired: sequential ải → auto-battle → reward → next quest');
}

patchIndex();
