import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EQUIPMENT_ASSET_REGISTRY } from '../src/domain/equipment/item-assets.mjs';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let index = readFileSync(indexPath, 'utf8');
const QA_EQUIPMENT_CATALOG = Object.values(EQUIPMENT_ASSET_REGISTRY).flatMap(slot => Object.values(slot).map(item => ({ slot: item.slot, rar: item.rarity })));
if (QA_EQUIPMENT_CATALOG.length !== 20) throw new Error('QA equipment catalog expected 20 entries');

if (index.includes('id="hv-qa-full-access-v1"')) {
  throw new Error('QA full access runtime already installed');
}

const runtime = String.raw`<style id="hv-qa-full-access-v1-style">
#hvQaFullAccess{position:fixed;z-index:10000;top:max(8px,env(safe-area-inset-top));left:8px;display:flex;align-items:center;gap:7px;max-width:calc(100vw - 16px);padding:6px 9px;border:1px solid rgba(242,205,111,.72);border-radius:999px;background:rgba(21,25,35,.9);box-shadow:0 7px 20px rgba(0,0,0,.24);color:#ffe6a0;font:800 10px/1.2 system-ui,sans-serif;letter-spacing:.02em;backdrop-filter:blur(8px);pointer-events:auto}
#hvQaFullAccess small{color:#d6dfdc;font-weight:600;white-space:nowrap}
#hvQaFullAccess [data-qa-persist-fault]{color:#ffe6a0;font-weight:800;white-space:nowrap}
#hvQaFullAccess button{border:0;border-radius:999px;padding:3px 7px;background:rgba(255,255,255,.12);color:#fff2c4;font:800 10px/1 system-ui,sans-serif;cursor:pointer}
#hvQaFullAccess button:hover{background:rgba(255,255,255,.2)}
#hvQaFullAccess button:focus-visible{outline:2px solid #fff0a8;outline-offset:2px}
[data-testid="qa-full-access-panel"]{border-color:rgba(230,183,84,.76)!important;background:linear-gradient(145deg,rgba(31,28,42,.96),rgba(13,40,39,.94))!important}
[data-testid="qa-full-access-panel"] .qa-full-access-note{color:#b7c6c1;font-size:11.5px;line-height:1.5;margin:5px 0 10px}
[data-testid="qa-full-access-panel"] .qa-full-access-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
[data-testid="qa-full-access-panel"] .qa-full-access-grid button{min-height:38px;padding:6px 8px;text-align:left}
[data-testid="qa-full-access-panel"] .qa-full-access-grid small{display:block;margin-top:2px;color:#a9b8b3;font-size:10px}
@media(max-width:520px){#hvQaFullAccess{right:8px;left:8px;justify-content:center}#hvQaFullAccess small{overflow:hidden;text-overflow:ellipsis}[data-testid="qa-full-access-panel"] .qa-full-access-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
<script id="hv-qa-full-access-v1">
(()=>{
  "use strict";
  const QA_EQUIPMENT_CATALOG=[{"slot":"weapon","rar":"b"},{"slot":"weapon","rar":"a"},{"slot":"weapon","rar":"s"},{"slot":"weapon","rar":"ss"},{"slot":"weapon","rar":"ssr"},{"slot":"armor","rar":"b"},{"slot":"armor","rar":"a"},{"slot":"armor","rar":"s"},{"slot":"armor","rar":"ss"},{"slot":"armor","rar":"ssr"},{"slot":"charm","rar":"b"},{"slot":"charm","rar":"a"},{"slot":"charm","rar":"s"},{"slot":"charm","rar":"ss"},{"slot":"charm","rar":"ssr"},{"slot":"boots","rar":"b"},{"slot":"boots","rar":"a"},{"slot":"boots","rar":"s"},{"slot":"boots","rar":"ss"},{"slot":"boots","rar":"ssr"}];
  const params=new URLSearchParams(window.location.search);
  const token=String(params.get("qa")||params.get("debug")||"").trim().toLowerCase();
  const active=["unlock-all","full-access","all"].includes(token);
  if(!active||typeof P!=='object'||!P||typeof DATA!=='object'||!DATA)return;
  const persistFailureToken=String(params.get("qaPersistFail")||"").trim().toLowerCase();
  let persistFailureArmed=["once","1","true"].includes(persistFailureToken);
  let persistFailureCount=0;
  let persistFailureLast=persistFailureArmed?"ARMED_BY_QUERY":"IDLE";
  let updateQaFaultStatus=()=>{};
  const persistFailureSnapshot=()=>({armed:persistFailureArmed,count:persistFailureCount,last:persistFailureLast});
  const armPersistFailure=()=>{
    persistFailureArmed=true;
    persistFailureLast="ARMED";
    updateQaFaultStatus();
  };
  const failPersistOnce=()=>{
    if(!persistFailureArmed)return false;
    persistFailureArmed=false;
    persistFailureCount++;
    persistFailureLast="SAVE_WRITE_FAILED";
    updateQaFaultStatus();
    return true;
  };

  const clone=value=>{
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(_){return value;}
  };
  const PROGRESS_KEYS=["clearedChapters","unlockedChapters","campaignStages","routes","world","hvMainQuest","openingLoop"];
  const snapshot=profile=>Object.fromEntries(PROGRESS_KEYS.map(key=>[key,clone(profile?.[key])]));
  const restore=(profile,state)=>{
    for(const key of PROGRESS_KEYS){
      if(state[key]===undefined)delete profile[key];
      else profile[key]=clone(state[key]);
    }
  };

  const savedProgress=snapshot(P);
  const savedState=clone(P);
  const restoreState=(profile,state)=>{
    const nextState=clone(state)||{};
    Object.keys(profile).forEach(key=>{
      if(!Object.prototype.hasOwnProperty.call(nextState,key))delete profile[key];
    });
    Object.assign(profile,nextState);
  };
  const allChapters=Array.isArray(DATA.chapters)?DATA.chapters.map((_,index)=>index):[];
  const qaMolds=['strike','ward','tempo'];
  const qaInventory=QA_EQUIPMENT_CATALOG.map((entry,index)=>({uid:index+1,slot:entry.slot,rar:entry.rar,lvl:0,mold:qaMolds[index%qaMolds.length],locked:false}));
  P.inventory=qaInventory.map(item=>({...item}));
  P.itemSeq=qaInventory.length;
  P.equip={};
  P.unlockedChapters=allChapters;
  document.documentElement.dataset.hvQaFullAccess="1";

  if(typeof featLocked==='function'){
    featLocked=()=>false;
  }

  const baseCampaignGate=typeof hvCampaignGate==='function'?hvCampaignGate:null;
  if(baseCampaignGate){
    hvCampaignGate=function qaCampaignGate(player,chapter,stage){
      const base=baseCampaignGate(player,chapter,stage);
      if(!active||!baseCampaignGate)return baseCampaignGate?baseCampaignGate.apply(this,arguments):{ok:false,code:'QA_GATE_UNAVAILABLE'};
      if(base?.code==='INVALID_STAGE')return base;
      return {...base,ok:true,code:'OPEN',qaBypass:true};
    };
  }

  // QA actions are fully sandboxed: chapter/quest, roster/equipment, forge
  // inventory, currencies and every other player field return to the saved
  // state for the real write, then the test-session state is restored.
  if(typeof persist==='function'){
    const basePersist=persist;
    let writing=false;
    persist=function qaSafePersist(){
      if(writing)return basePersist();
      if(failPersistOnce())return false;
      const runtimeState=clone(P);
      writing=true;
      try{
        restoreState(P,savedState);
        return basePersist();
      }finally{
        restoreState(P,runtimeState);
        writing=false;
      }
    };
  }

  const qaBanner=document.createElement('aside');
  qaBanner.id='hvQaFullAccess';
  qaBanner.setAttribute('role','status');
  qaBanner.style.display='none';
  qaBanner.innerHTML='<span>🧪 QA</span><small>Đã mở chức năng + 20 item · sandbox không lưu</small><span data-qa-persist-fault aria-live="polite">Lưu bình thường</span><button type="button" data-qa-arm-persist-fail aria-label="Mô phỏng lỗi lưu">Arm lỗi lưu</button><button type="button" data-qa-exit aria-label="Thoát chế độ QA">Thoát</button>';
  updateQaFaultStatus=()=>{
    const status=qaBanner.querySelector('[data-qa-persist-fault]');
    if(!status)return;
    const state=persistFailureArmed?'armed':persistFailureLast==='SAVE_WRITE_FAILED'?'failed':'idle';
    status.textContent=state==='armed'?'Lỗi lưu: sẵn sàng':state==='failed'?'Lỗi lưu: đã mô phỏng':'Lưu bình thường';
    status.dataset.state=state;
  };
  qaBanner.querySelector('[data-qa-arm-persist-fail]').addEventListener('click',()=>{
    armPersistFailure();
    if(typeof toast==='function')toast('QA: lần lưu kế tiếp sẽ thất bại.');
  });
  qaBanner.querySelector('[data-qa-exit]').addEventListener('click',()=>{
    const clean=new URL(window.location.href);
    clean.searchParams.delete('qa');
    clean.searchParams.delete('debug');
    clean.searchParams.delete('qaPersistFail');
    window.location.assign(clean.pathname+clean.search+clean.hash);
  });
  document.body.appendChild(qaBanner);
  updateQaFaultStatus();

  const featureLinks=[
    ['heroes','Tướng'],['team','Trợ trận'],['daily','Lịch Luyện'],['summon','Chiêu Mộ'],
    ['forge','Rèn'],['bag','Túi đồ'],['tower','Tháp'],['expedition','Hành Tẩu'],
    ['hunt','Săn Boss'],['arena','Đấu Trường'],['shop','Hắc Thị'],['festival','Lễ Hội'],
    ['jobs','Giao việc'],['guild','Bang Hội'],['clan','Gia Tộc'],['friends','Bạn bè'],
    ['chat','Trò chuyện'],['net','Online']
  ];
  const baseRenderCampaign=typeof renderCampaign==='function'?renderCampaign:null;
  const appendPanel=()=>{
    const list=document.getElementById('chList');
    if(!list||list.querySelector('[data-testid="qa-full-access-panel"]'))return;
    const panel=document.createElement('section');
    panel.className='section';
    panel.dataset.testid='qa-full-access-panel';
    const chapterButtons=allChapters.map(index=>{
      const chapter=DATA.chapters[index]||{};
      const sequence=typeof chapterBattleSequence==='function'?chapterBattleSequence(index):[];
      return '<button class="btn ghost sm" type="button" data-qa-start-chapter="'+index+'"><b>⚔ Chương '+(index+1)+'</b><small>'+String(chapter.name||'Giang Hồ')+' · '+sequence.length+' ải</small></button>';
    }).join('');
    const modeButtons=featureLinks.map(([id,label])=>'<button class="btn ghost sm" type="button" data-qa-nav="'+id+'">'+label+'</button>').join('');
    panel.innerHTML='<h3>🧪 Bảng kiểm QA · mở toàn quyền</h3><div class="qa-full-access-note">Chế độ này chỉ có khi URL chứa <b>?qa=unlock-all</b>. Kho QA đã seed đủ 20 item (4 loại × 5 phẩm chất); tiến độ, vật phẩm và tài nguyên test không ghi vào bản lưu thật.</div><div class="qa-full-access-grid">'+chapterButtons+modeButtons+'</div>';
    list.appendChild(panel);
    panel.querySelectorAll('[data-qa-start-chapter]').forEach(button=>button.addEventListener('click',()=>{
      const index=Number(button.dataset.qaStartChapter);
      if(typeof startChapter==='function')startChapter(index,{qaFullAccess:true});
    }));
    panel.querySelectorAll('[data-qa-nav]').forEach(button=>button.addEventListener('click',()=>{
      if(typeof navTo==='function')navTo(button.dataset.qaNav);
    }));
  };
  if(baseRenderCampaign){
    renderCampaign=function qaRenderCampaign(){
      baseRenderCampaign.apply(this,arguments);
      appendPanel();
    };
  }
  window.HonVietQA=Object.freeze({
    fullAccess:true,
    chapters:allChapters.slice(),
    savedProgress:clone(savedProgress),
    equipmentCatalog:qaInventory.map(item=>({...item})),
    persistFailure:Object.freeze({arm:armPersistFailure,get:persistFailureSnapshot}),
    exit:()=>{
      const clean=new URL(window.location.href);
      clean.searchParams.delete('qa');
      clean.searchParams.delete('debug');
      clean.searchParams.delete('qaPersistFail');
      window.location.assign(clean.pathname+clean.search+clean.hash);
    }
  });

  // The initial Hub render happens before this opt-in patch runs. Repaint
  // the active screen so QA users do not see stale locked affordances.
  const rerenderActiveScreen=()=>{
    try{
      if(typeof ST==='object'&&ST&&ST.screen==='hub'&&typeof renderHub==='function')renderHub();
      else if(typeof ST==='object'&&ST&&ST.screen==='campaign'&&typeof renderCampaign==='function')renderCampaign();
      else if(typeof ST==='object'&&ST&&ST.screen==='journey'&&typeof renderJourney==='function')renderJourney();
    }catch(_){}
  };
  rerenderActiveScreen();
})();
</script>`;

index = index.replace('</body>', runtime + '\n</body>');
writeFileSync(indexPath, index);

const battlePath = join(process.cwd(), 'dist', 'battle.html');
let battle = readFileSync(battlePath, 'utf8');
const directReturn = '      location.replace("index.html?hvBattleReturn=1");';
const qaDirectReturn = `      const qaReturnToken=new URLSearchParams(location.search).get("qa")||"";
      const qaReturnSuffix=qaReturnToken==="unlock-all"?"&qa=unlock-all":"";
      location.replace("index.html?hvBattleReturn=1"+qaReturnSuffix);`;
if (battle.split(directReturn).length !== 2) throw new Error('QA full access direct battle return owner missing or ambiguous');
battle = battle.replace(directReturn, qaDirectReturn);
writeFileSync(battlePath, battle);

console.log('QA full access v1 installed: opt-in feature/chapter unlock with save-safe progression sandbox');
