import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const indexPath = join(root, 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');
const moduleSource = readFileSync(join(root, 'src/domain/afk/afk-chest.mjs'), 'utf8')
  .replace(/^export\s+/gm, '');

new Function(moduleSource + '\nreturn { createAfkChestState, normalizeAfkChestState, accrueAfkChest, getAfkChestView, claimAfkChest, AFK_CHEST_SCHEMA, AFK_CAP_SECONDS };');

const style = `<style id="hv-afk-chest-style">
.hv-afk-panel{box-sizing:border-box;width:min(100%,760px);margin:14px auto 18px;padding:14px;border:1px solid rgba(216,178,105,.6);border-radius:22px;background:linear-gradient(145deg,rgba(19,35,57,.97),rgba(32,24,43,.96));box-shadow:0 14px 38px rgba(10,18,36,.28);color:#f8edcf;font-family:inherit;overflow:hidden}
.hv-afk-panel *{box-sizing:border-box}.hv-afk-panel__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:0 2px 12px}.hv-afk-panel__eyebrow{margin:0 0 3px;color:#e1b86d;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.hv-afk-panel h2{margin:0;color:#fff5d8;font-size:20px;line-height:1.1}.hv-afk-panel__note{max-width:390px;margin:5px 0 0;color:#b8c2c5;font-size:12px;line-height:1.4}.hv-afk-panel__cap{flex:none;padding:7px 9px;border:1px solid rgba(232,194,112,.42);border-radius:999px;color:#f7d88c;font-size:10px;font-weight:800;letter-spacing:.1em;white-space:nowrap}
.hv-afk-stage{position:relative;min-height:178px;border:1px solid rgba(237,202,128,.38);border-radius:16px;overflow:hidden;background-image:linear-gradient(90deg,rgba(7,20,35,.95) 0%,rgba(7,20,35,.18) 48%,rgba(7,20,35,.74) 100%),url('assets/battle/backgrounds-v1/01-thanh-truc-suong-lam.png');background-position:center 42%;background-size:cover}.hv-afk-stage:after{position:absolute;inset:auto 0 0;height:58%;background:linear-gradient(transparent,rgba(5,10,22,.8));content:"";pointer-events:none}.hv-afk-route{position:absolute;inset:12px 14px auto;color:rgba(255,230,163,.78);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.hv-afk-route:after{display:block;width:70%;height:1px;margin-top:10px;background:linear-gradient(90deg,rgba(255,222,137,.95),transparent);content:""}.hv-afk-party{position:absolute;z-index:1;left:18px;bottom:34px;display:flex;align-items:flex-end;gap:7px}.hv-afk-unit{display:grid;width:34px;height:34px;place-items:center;border:2px solid rgba(255,221,139,.84);border-radius:50%;background:radial-gradient(circle at 35% 25%,#f7d887,#a45736 58%,#382037);box-shadow:0 0 16px rgba(255,195,76,.36);color:#fff4d3;font-size:15px;animation:hvAfkBob 2.2s ease-in-out infinite}.hv-afk-unit:nth-child(2){width:42px;height:42px;animation-delay:-.7s}.hv-afk-unit:nth-child(3){animation-delay:-1.35s}.hv-afk-unit:nth-child(4){width:30px;height:30px;animation-delay:-1.75s}.hv-afk-unit:after{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff4bb;box-shadow:0 0 12px 4px #ffe4a1;content:"";transform:translate(22px,-18px);animation:hvAfkSpark 1.7s ease-in-out infinite}.hv-afk-chest{position:absolute;z-index:2;right:22px;bottom:27px;width:74px;height:74px;border-radius:50%;background:rgba(18,24,40,.52) url('assets/meta/economy/icon-chest.png') center/62px 62px no-repeat;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45));animation:hvAfkChestGlow 2.4s ease-in-out infinite}.hv-afk-stage__label{position:absolute;z-index:2;right:17px;bottom:11px;color:#f8e8bb;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 2px 4px #000}.hv-afk-stage__label b{color:#ffda7e}.hv-afk-progress{margin:13px 2px 8px}.hv-afk-progress__labels{display:flex;justify-content:space-between;gap:10px;color:#bfc8c5;font-size:11px;font-weight:700}.hv-afk-progress__labels strong{color:#f9db91;font-size:13px}.hv-afk-track{height:11px;margin-top:7px;border:1px solid rgba(228,195,125,.32);border-radius:99px;background:rgba(7,14,27,.78);overflow:hidden}.hv-afk-track i{display:block;height:100%;min-width:0;border-radius:inherit;background:linear-gradient(90deg,#46b993,#f1c265);box-shadow:0 0 12px rgba(245,194,96,.42);transition:width .45s ease}.hv-afk-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px;color:#aebbc0;font-size:11px}.hv-afk-meta b{color:#ffe49b}.hv-afk-rewards{display:flex;flex-wrap:wrap;gap:7px;margin:11px 2px 12px}.hv-afk-reward{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid rgba(212,181,112,.26);border-radius:10px;background:rgba(0,0,0,.2);color:#d5dddd;font-size:11px}.hv-afk-reward img{width:18px;height:18px;object-fit:contain}.hv-afk-reward b{color:#fff1bf}.hv-afk-panel__actions{display:grid;grid-template-columns:1.25fr 1fr;gap:8px}.hv-afk-panel__actions button{min-height:43px;border-radius:12px;font:800 12px/1.2 inherit;letter-spacing:.04em;cursor:pointer}.hv-afk-panel__actions button[disabled]{cursor:not-allowed;opacity:.48}.hv-afk-claim{border:1px solid #e2ad4f;background:linear-gradient(180deg,#f3c56d,#bd6a2d);color:#281a1b;box-shadow:0 5px 14px rgba(196,116,43,.26)}.hv-afk-challenge{border:1px solid rgba(229,190,112,.58);background:rgba(15,28,45,.72);color:#ffe5a2}.hv-afk-panel__foot{margin:9px 2px 0;color:#899a9f;font-size:10px;line-height:1.35}.hv-afk-panel__foot b{color:#c6d1cc}
@keyframes hvAfkBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes hvAfkSpark{0%,100%{opacity:.2;transform:translate(19px,-13px) scale(.8)}50%{opacity:1;transform:translate(25px,-21px) scale(1.2)}}@keyframes hvAfkChestGlow{0%,100%{transform:translateY(0);filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}50%{transform:translateY(-5px);filter:drop-shadow(0 5px 18px rgba(255,202,93,.68))}}
@media(max-width:560px){.hv-afk-panel{margin:10px 0 14px;padding:11px;border-radius:18px}.hv-afk-panel__head{gap:7px}.hv-afk-panel h2{font-size:17px}.hv-afk-panel__note{font-size:11px}.hv-afk-panel__cap{padding:6px 7px;font-size:9px}.hv-afk-stage{min-height:164px}.hv-afk-stage__label{font-size:9px}.hv-afk-panel__actions{grid-template-columns:1fr}.hv-afk-rewards{gap:5px}.hv-afk-reward{padding:5px 6px;font-size:10px}}
@media(prefers-reduced-motion:reduce){.hv-afk-unit,.hv-afk-unit:after,.hv-afk-chest{animation:none}.hv-afk-track i{transition:none}}
</style>`;

const script = String.raw`<script id="hv-afk-chest-runtime-v1">
(function(){
  'use strict';
  const afk=(function(){
    __HV_AFK_MODULE_SOURCE__
    return {AFK_CHEST_SCHEMA,AFK_CAP_SECONDS,createAfkChestState,normalizeAfkChestState,accrueAfkChest,getAfkChestView,claimAfkChest};
  })();
  const PANEL_ID='hvAfkChestPanel';
  let renderWrapped=false;
  let lastInitialized=false;

  function getPlayer(){
    return typeof P!=='undefined' && P && typeof P==='object' ? P : null;
  }
  function say(message){
    try{if(typeof toast==='function'){toast(message);return;}}catch(error){}
    try{console.warn('[AFK]',message);}catch(error){}
  }
  function persistSafely(){try{if(typeof persist==='function')persist();}catch(error){say('Chưa lưu được rương AFK.');}}
  function ensureState(){
    const player=getPlayer();
    if(!player)return null;
    const raw=player.hvAfkChest;
    const state=afk.normalizeAfkChestState(raw,{now:Date.now()});
    player.hvAfkChest=state;
    const first=!raw || raw.schema!==afk.AFK_CHEST_SCHEMA;
    if(first && !lastInitialized){lastInitialized=true;persistSafely();}
    return state;
  }
  function pad(value){return String(value).padStart(2,'0');}
  function clock(seconds){
    const safe=Math.max(0,Math.floor(Number(seconds)||0));
    const hours=Math.floor(safe/3600), minutes=Math.floor((safe%3600)/60), secs=safe%60;
    if(hours>0)return hours+'g '+pad(minutes)+'p';
    return minutes+'p '+pad(secs)+'s';
  }
  function amount(value){return new Intl.NumberFormat('vi-VN').format(Math.max(0,Number(value)||0));}
  function rewardItems(reward){
    const rows=[
      ['gold','assets/result-icons-art/gold-imagen.png','Vàng'],
      ['tinh','assets/result-icons-art/mastery-imagen.png','Tinh thông'],
      ['hoat','assets/ui/menu-v3233/icons/resource-energy-imagen.png','Hoạt lực']
    ];
    return rows.filter(function(row){return Number(reward&&reward[row[0]])>0;}).map(function(row){
      return '<span class="hv-afk-reward"><img src="'+row[1]+'" alt=""><b>+'+amount(reward[row[0]])+'</b><span>'+row[2]+'</span></span>';
    }).join('') || '<span class="hv-afk-reward"><span>✦</span><span>Đang gom phần thưởng...</span></span>';
  }
  function installRenderHook(){
    const original=window.renderCampaign;
    if(typeof original!=='function' || original.__hvAfkWrapped || renderWrapped)return;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      window.setTimeout(render,0);
      return result;
    };
    wrapped.__hvAfkWrapped=true;
    window.renderCampaign=wrapped;
    renderWrapped=true;
  }
  function challenge(){
    const player=getPlayer();
    if(!player || typeof startChapter!=='function'){say('Chưa sẵn sàng mở trận Khiêu chiến.');return;}
    const data=typeof DATA!=='undefined' && DATA ? DATA : {};
    const chapters=Array.isArray(data.chapters)?data.chapters:[];
    const unlocked=Array.isArray(player.unlockedChapters)?player.unlockedChapters:[];
    const cleared=Array.isArray(player.clearedChapters)?player.clearedChapters:[];
    const current=chapters.find(function(chapter){return unlocked.includes(chapter.idx) && !cleared.includes(chapter.idx);}) || chapters.find(function(chapter){return unlocked.includes(chapter.idx);}) || chapters[0];
    if(!current){say('Chưa có ải nào được mở.');return;}
    startChapter(current.idx,{fromAfkChest:true});
  }
  function grantClaim(){
    const player=getPlayer();
    const state=ensureState();
    if(!player || !state)return;
    const now=Date.now();
    const view=afk.getAfkChestView(state,{now:now});
    if(!view.claimable){say(view.storedSeconds>0?'Rương chưa có phần thưởng để nhận.':'Rương đang trống.');render();return;}
    const transaction=window.HonVietTransaction;
    if(!transaction || typeof transaction.commit!=='function'){say('Hệ thống lưu thưởng chưa sẵn sàng.');return;}
    const commandId='afk.chest.claim:'+(state.claimCount||0)+':'+(state.lastAccruedAt||now);
    let outcome=null;
    const result=transaction.commit({
      commandId:commandId,
      cost:{},
      balances:{},
      source:'afk-chest',
      reason:'claim-afk-reward',
      reward:view.pendingReward,
      applyRewardFn:function(reward){
        if(typeof applyReward!=='function')throw new Error('applyReward unavailable');
        applyReward(reward);
      },
      mutate:function(draft){
        outcome=afk.claimAfkChest(draft.hvAfkChest,{now:now});
        if(!outcome.changed)return {ok:false,code:outcome.reason};
        draft.hvAfkChest=outcome.state;
        return {ok:true,claimCount:outcome.state.claimCount};
      }
    });
    if(!result || !result.ok){say((result&&result.message)||'Chưa nhận được thưởng AFK.');render();return;}
    try{if(typeof refreshResbar==='function')refreshResbar();}catch(error){}
    if(!result.duplicate){
      const claimed=outcome&&outcome.reward ? rewardItems(outcome.reward).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim() : 'phần thưởng';
      say('Đã nhận '+claimed+'.');
    }
    render();
  }
  function render(){
    const screen=document.getElementById('campaignScreen');
    const state=ensureState();
    if(!screen || !state)return;
    const view=afk.getAfkChestView(state,{now:Date.now()});
    let panel=document.getElementById(PANEL_ID);
    if(!panel){
      panel=document.createElement('section');
      panel.id=PANEL_ID;
      panel.className='hv-afk-panel';
      const anchor=document.getElementById('worldMap') || document.getElementById('chList');
      if(anchor && anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor);
      else screen.appendChild(panel);
    }
    const pct=Math.round(view.fullness*100);
    const claimText=view.isFull?'NHẬN THƯỞNG · RƯƠNG ĐẦY':'NHẬN THƯỞNG';
    const status=view.isFull?'Rương đã đầy — nhận thưởng để tích tiếp.':'Đội vẫn đang diễn hoạt; thưởng được gom khi online hoặc offline.';
    panel.innerHTML='<div class="hv-afk-panel__head"><div><p class="hv-afk-panel__eyebrow">AFK · DIỄN HOẠT</p><h2>Đội đang hành quân</h2><p class="hv-afk-panel__note">Đây là cảnh minh họa nhận thưởng theo thời gian, chưa vào trận 6v6 thật.</p></div><span class="hv-afk-panel__cap">TỐI ĐA 15 GIỜ</span></div>'+
      '<div class="hv-afk-stage"><span class="hv-afk-route">Mộng lộ · tự động tích lũy</span><div class="hv-afk-party"><i class="hv-afk-unit">✦</i><i class="hv-afk-unit">⚔</i><i class="hv-afk-unit">◆</i><i class="hv-afk-unit">✧</i></div><span class="hv-afk-chest" aria-hidden="true"></span><span class="hv-afk-stage__label">Rương <b>'+pct+'%</b></span></div>'+
      '<div class="hv-afk-progress"><div class="hv-afk-progress__labels"><span>RƯƠNG THƯỞNG</span><strong>'+clock(view.storedSeconds)+' / 15g</strong></div><div class="hv-afk-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></div></div>'+
      '<div class="hv-afk-meta"><span>'+status+'</span><b>'+amount(view.pendingReward.gold||0)+' vàng đang chờ</b></div>'+
      '<div class="hv-afk-rewards">'+rewardItems(view.pendingReward)+'</div>'+
      '<div class="hv-afk-panel__actions"><button class="hv-afk-claim" type="button" data-hv-afk-claim '+(view.claimable?'':'disabled')+'>'+claimText+'</button><button class="hv-afk-challenge" type="button" data-hv-afk-challenge>⚔ KHIÊU CHIẾN · 6V6 THẬT</button></div>'+
      '<p class="hv-afk-panel__foot"><b>Luật:</b> chạm Nhận thưởng để giải phóng rương; thời gian vượt 15 giờ không cộng bù. Khiêu chiến mở flow trận thật riêng.</p>';
  }
  document.addEventListener('click',function(event){
    const target=event.target && event.target.closest ? event.target.closest('[data-hv-afk-claim],[data-hv-afk-challenge]') : null;
    if(!target)return;
    event.preventDefault();
    if(target.hasAttribute('data-hv-afk-claim')){target.disabled=true;grantClaim();}
    else challenge();
  });
  function boot(){
    installRenderHook();
    window.setTimeout(function(){installRenderHook();render();},0);
    window.setInterval(function(){installRenderHook();const screen=document.getElementById('campaignScreen');if(screen && screen.style.display!=='none')render();},1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  try{window.__HV_AFK_CHEST_RUNTIME_V1={module:afk,render:render,claim:grantClaim,challenge:challenge};}catch(error){}
})();
</script>`;

const renderedScript = script.replace('__HV_AFK_MODULE_SOURCE__', moduleSource);
if (!html.includes('id="hv-afk-chest-style"')) {
  if (!html.includes('</head>')) throw new Error('AFK style insertion point not found');
  html = html.replace('</head>', style + '</head>');
}
if (html.includes('id="hv-afk-chest-runtime-v1"')) throw new Error('AFK runtime already installed');
if (!html.includes('</body>')) throw new Error('AFK script insertion point not found');
html = html.replace('</body>', renderedScript + '</body>');
writeFileSync(indexPath, html);
console.log('AFK chest runtime installed: 15-hour capped accumulation, atomic claim and separate 6v6 challenge CTA');
