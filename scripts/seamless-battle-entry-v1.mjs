import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

export function primeBattleEntry(env){
 const params=new URLSearchParams(env.location.search);
 if(params.get('qa')==='status-icons')return false;
 let config={};
 try{
  const raw=env.frameElement?.dataset?.config;
  if(raw)config=JSON.parse(raw);
  else if(String(env.name||'').startsWith('hvBattleConfig:'))config=JSON.parse(decodeURIComponent(env.name.slice(15)));
  else if(params.get('session'))config=JSON.parse(env.sessionStorage.getItem('hvBattleConfig:'+params.get('session'))||'{}');
 }catch{}
 if(!(params.get('embedded')==='1'||config.embedded))return false;
 const root=env.document.documentElement;
 root.classList.add('hv-auto-entry','hv-entry-boot');
 if(typeof config.entryBackdrop==='string')root.style.setProperty('--hv-entry-backdrop',config.entryBackdrop);
 // Fail open to the existing battlefield/back controls if bootstrap itself fails.
 env.setTimeout?.(()=>root.classList.remove('hv-entry-boot'),8000);
 return true;
}
function once(html,from,to){if(html.split(from).length!==2)throw Error('Seamless entry anchor: '+from.slice(0,90));return html.replace(from,()=>to);}
export function patchBattleEntryHost(input){
 let html=input;
 html=once(html,'    const serializedBattleConfig = JSON.stringify(battleConfig);',`    const entryField=document.querySelector('#hvCampaignScene .cs-battlefield');
    battleConfig.entryBackdrop=entryField?getComputedStyle(entryField).backgroundImage:'none';
    overlay.style.backgroundImage=battleConfig.entryBackdrop;
    const serializedBattleConfig = JSON.stringify(battleConfig);`);
 html=html.replaceAll('Đang vào trận…','Đang tải…').replaceAll('Đội hình vừa bày sẽ ra sân ngay.','');
 html=html.replaceAll('Safari đang giữ nhạc trận — nếu iframe chưa sẵn sàng, trận sẽ tự mở trực tiếp.','Đang tải chiến trường…').replaceAll('Chiến trường đang khởi tạo — loa trận giữ trên màn hình này.','Đang tải chiến trường…');
 return once(html,'</head>',`<style id="hv-seamless-entry-host">
#hvBattleOverlay{background-position:center;background-size:cover;background-repeat:no-repeat}
#hvBattleOverlay.is-loading #hvBattleFrame{visibility:hidden}
#hvBattleLoading{inset:auto 16px max(28px,env(safe-area-inset-bottom));display:block;padding:8px 12px;background:transparent;font-size:13px;text-shadow:0 1px 3px #000;opacity:0;animation:hv-entry-label .1s .5s forwards}
#hvBattleLoading[hidden]{display:none}#hvBattleLoading span{display:none}
@keyframes hv-entry-label{to{opacity:1}}
</style></head>`);
}
export function patchBattleEntryDocument(input){
 let html=once(input,'<head>',`<head><script id="hv-seamless-entry-prime">(${primeBattleEntry.toString()})(window);</script>
<style id="hv-seamless-entry-document">
html.hv-auto-entry #introPanel{display:none!important}
html.hv-entry-boot,html.hv-entry-boot body{background:#061516 var(--hv-entry-backdrop,none) center/cover no-repeat!important}
html.hv-entry-boot .app-shell{visibility:hidden!important}
</style>`);
 const ready=/  if \(EMBEDDED\) \{\n    (parent\.postMessage\(\{schema:[\s\S]+?\}, "\*"\);)\n    if \(EMBED_CONFIG.autoStart \|\| EMBEDDED\) \{/;
 if(!ready.test(html))throw Error('Seamless entry ready owner missing');
 html=html.replace(ready,(_m,message)=>`  let __hvEntryReadySent=false;
  function __hvNotifyBattleReady(){
    if(__hvEntryReadySent)return;
    __hvEntryReadySent=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.documentElement.classList.remove('hv-entry-boot');
      ${message}
    }));
  }
  if (EMBEDDED) {
    if(STATUS_ICON_QA)__hvNotifyBattleReady();
    if (EMBED_CONFIG.autoStart || EMBEDDED) {`);
 html=once(html,'try { beginBattle(); }','try { beginBattle(); if(state.mode==="battle")__hvNotifyBattleReady(); }');
 return html;
}
export function installSeamlessBattleEntry(root){
 for(const [name,patch] of [['index.html',patchBattleEntryHost],['battle.html',patchBattleEntryDocument]]){
  const file=join(root,'dist',name);writeFileSync(file,patch(readFileSync(file,'utf8')));
 }
}
