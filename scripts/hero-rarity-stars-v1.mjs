import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
export function buildStarUpResultView({hero,beforeStars,afterStars,portrait}={}){
  const before=Number(beforeStars),after=Number(afterStars),name=String(hero?.name||'').trim(),image=String(portrait||'');
  if(!name||!Number.isInteger(before)||!Number.isInteger(after)||before<1||after<=before||after>6)return null;
  return Object.freeze({kind:'star-up',kicker:'TƯỚNG TINH',title:'THĂNG SAO',
    description:name+' tăng từ '+before+'★ lên '+after+'★.',heroName:name,portrait:image,
    beforeStars:before,afterStars:after,starLine:'★'.repeat(before)+' → '+'★'.repeat(after)});
}
export function runStarUpOnce({id,button,readStars,performStarUp,showResult,toast,refresh,render}={}){
  if(!button||button.disabled)return {ok:false,duplicate:true,code:'PRESENTATION_ALREADY_HANDLED'};
  button.disabled=true;
  const beforeStars=readStars(id),result=performStarUp(id);
  if(!result?.ok){button.disabled=false;toast?.(result?.msg||'Thăng sao chưa hoàn tất.');refresh?.();render?.(id);return result;}
  showResult(id,beforeStars,result);refresh?.();render?.(id);return result;
}

const MARK = '/* HERO_RARITY_STARS_V1 */';
function installStarUpCeremonySkin(){
  if(document.getElementById('hv-star-up-ceremony-skin'))return;
  const style=document.createElement('style');
  style.id='hv-star-up-ceremony-skin';
  style.textContent=`
#rewardVeil[data-reward-kind="star-up"]{background:rgba(4,5,6,.76);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:18px}
#rewardVeil[data-reward-kind="star-up"] .rewardcard{position:relative;width:min(88vw,680px);max-height:min(78vh,760px);overflow:auto;padding:20px 22px 22px;border:1px solid #b88a45;border-radius:10px;background:linear-gradient(180deg,rgba(43,32,22,.98),rgba(25,19,15,.99));box-shadow:inset 0 0 0 1px rgba(255,221,156,.12),0 0 0 2px #120e0b,0 18px 44px rgba(0,0,0,.72);text-align:center}
#rewardVeil[data-reward-kind="star-up"] .rewardcard:before{display:none}
#rewardVeil[data-reward-kind="star-up"] .rewardburst{width:112px;height:112px;margin:2px auto 13px;border-radius:12px;background:#17120e;border:1px solid #bd8d43;box-shadow:0 0 0 4px rgba(0,0,0,.42),0 8px 22px rgba(0,0,0,.46);font-size:0;animation:none}
#rewardVeil[data-reward-kind="star-up"] .rewardburst:after{display:none}
#rewardVeil[data-reward-kind="star-up"] .reward-star-portrait{display:block;width:100%;height:100%;object-fit:contain;border-radius:10px}
#rewardVeil[data-reward-kind="star-up"] .rewardkicker{margin-top:2px;color:#b99455;font:800 11px/1.3 Georgia,serif;letter-spacing:.2em}
#rewardVeil[data-reward-kind="star-up"] .rewardtitle{margin-top:6px;color:#ecd29a;font:900 28px/1.1 Georgia,serif;letter-spacing:.06em;text-shadow:0 2px 4px #000}
#rewardVeil[data-reward-kind="star-up"] .rewarddesc{margin:12px auto 0;max-width:520px;color:#e6d5b5;font:400 15px/1.55 Georgia,serif}
#rewardVeil[data-reward-kind="star-up"] .rewarditems{display:block;margin:18px 0 20px}
#rewardVeil[data-reward-kind="star-up"] .star-up-result{display:flex;flex-direction:column;align-items:center;gap:9px;padding:16px 12px 18px;border:1px solid #76562f;border-radius:7px;background:linear-gradient(180deg,#302319,#211811);box-shadow:inset 0 1px rgba(255,235,184,.08)}
#rewardVeil[data-reward-kind="star-up"] .star-up-result strong{color:#ead09a;font:800 18px/1.2 Georgia,serif}
#rewardVeil[data-reward-kind="star-up"] .star-up-result-stars{color:#f1c75e;font:900 25px/1.2 Georgia,serif;letter-spacing:.05em;text-shadow:0 1px 3px #000}
#rewardVeil[data-reward-kind="star-up"] .rewardbtn{min-width:260px;border:1px solid #b99452;border-radius:5px;background:linear-gradient(180deg,#42735a,#234b3a);box-shadow:inset 0 1px rgba(255,255,255,.18),0 3px 0 #142e25,0 8px 16px #0007;color:#f0dfb1;font:800 16px/1.2 Georgia,serif}
#rewardVeil[data-reward-kind="star-up"] .star-up-close{position:absolute;top:0;right:0;width:58px;height:58px;border:0;border-left:1px solid #b88a45;border-bottom:1px solid #b88a45;background:transparent;color:#d8b16a;font:400 30px/1 Georgia,serif;cursor:pointer}
#rewardVeil[data-reward-kind="star-up"] .star-up-close:active{background:rgba(211,161,78,.16)}
@media(max-width:520px){#rewardVeil[data-reward-kind="star-up"] .rewardcard{width:calc(100vw - 28px);padding:18px 14px 18px}#rewardVeil[data-reward-kind="star-up"] .rewardtitle{font-size:24px}#rewardVeil[data-reward-kind="star-up"] .rewardbtn{min-width:220px}}
`;
  (document.head||document.documentElement).appendChild(style);
}
function showHeroStarUpResult(id,beforeStars){
  const hero=DATA.heroes[id]||{},portrait=typeof portraitSrc==='function'?(portraitSrc(id,'card')||portraitSrc(id,'master')):'';
  const view=buildStarUpResultView({hero,beforeStars,afterStars:heroStars(id),portrait}),veil=document.getElementById('rewardVeil');
  if(!view||!veil){if(typeof toast==='function')toast(view?.description||'Thăng sao đã hoàn tất.');return;}
  installStarUpCeremonySkin();
  showRewardCeremony(view.title,view.description,[],'',view.kicker);
  veil.dataset.rewardKind=view.kind;
  const card=veil.querySelector('.rewardcard');
  if(card){
    card.classList.add('star-up-ceremony');
    let closeX=card.querySelector('.star-up-close');
    if(!closeX){closeX=document.createElement('button');closeX.type='button';closeX.className='star-up-close';closeX.setAttribute('aria-label','Đóng');closeX.textContent='×';closeX.addEventListener('click',closeRewardCeremony);card.appendChild(closeX);}
  }
  const burst=document.getElementById('rewardBurst');
  if(burst){burst.replaceChildren();burst.hidden=!view.portrait;burst.setAttribute('aria-label',view.heroName);
    if(view.portrait){const image=document.createElement('img');image.className='reward-star-portrait';image.src=view.portrait;image.alt=view.heroName;burst.appendChild(image);}}
  const box=document.getElementById('rewardItems');
  if(box){box.replaceChildren();const result=document.createElement('div');result.className='star-up-result';
    const name=document.createElement('strong');name.textContent=view.heroName;
    const stars=document.createElement('span');stars.className='star-up-result-stars';stars.textContent=view.starLine;
    result.append(name,stars);box.appendChild(result);}
  const close=document.getElementById('rewardClose');if(close){close.textContent='Xác nhận';close.focus();}
}
export function patchHeroRarityStars(html, domain) {
  if (html.includes(MARK)) return html;
  const once = (anchor, replacement) => {
    if (html.split(anchor).length !== 2) throw new Error('RARITY_STARS_ANCHOR: ' + anchor);
    html = html.replace(anchor, () => replacement);
  };
  const runtimeHelpers=[buildStarUpResultView.toString(),runStarUpOnce.toString(),installStarUpCeremonySkin.toString(),showHeroStarUpResult.toString()].join('\n');
  once('const SAVE_KEY="mong_gioi_save_v1";', MARK + '\n' + domain.replace(/^export\s+/gm, '') + '\n' + runtimeHelpers + "\nconst __HV_QA_STARUP__=(()=>{try{return new URLSearchParams(location.search).get('qa')==='star-up'&&location.hostname.endsWith('.vercel.app')&&location.hostname.includes('-git-');}catch(_){return false;}})();\nconst SAVE_KEY=__HV_QA_STARUP__?'mong_gioi_qa_star_up_v1':'mong_gioi_save_v1';");
  once('function netOnline(){ return !!(NET.server&&NET.token); }', 'function netOnline(){ return !__HV_QA_STARUP__&&!!(NET.server&&NET.token); }');
  once('async function netAuth(kind){', `async function netAuth(kind){\n  if(__HV_QA_STARUP__){toast('QA chỉ dùng hồ sơ khách cục bộ.');return;}`);
  once('function netLogout(){', `function netLogout(){\n  if(__HV_QA_STARUP__){toast('Phiên máy thật được giữ nguyên trong QA.');return;}`);
  once('  <script src=\"assets/qa/qa-gear-seed.js\"></script>', '  <script src=\"assets/qa/qa-gear-seed.js\"></script>\n  <script src=\"assets/qa/qa-star-up-seed.js?v=3ac1d14-2\"></script>');
  once('const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};',
    'const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,...initialHeroStars(DATA.heroes[id])};');
  once('for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};',
    'for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,...initialHeroStars(DATA.heroes[id])};');
  once('  p.squad=normalizeSquad(p.squad,p,true);\n  return p; }',
    '  normalizeRarityStars(p,DATA.heroes);\n  p.squad=normalizeSquad(p.squad,p,true);\n  return p; }');
  // Guard: transaction tests run persist() alone in a sandbox; the real build always defines it.
  once('function persist(){', 'function persist(){\n  if(typeof normalizeRarityStars==="function")normalizeRarityStars(P,DATA.heroes);');
  once('function heroStars(id){ return (P.heroes[id]&&P.heroes[id].stars)||1; }',
    'function heroStars(id){ return Math.max(rarityBaseStars(DATA.heroes[id]), (P.heroes[id]&&P.heroes[id].stars)||1); }');
  once('shards:10*S2*(S2-1)', 'shards:refundableHeroStarShards(P.heroes[id],DATA.heroes[id])');
  once('hh.level=1; hh.stars=1;', 'hh.level=1; hh.stars=rarityBaseStars(DATA.heroes[id]); if(hh.rarityStarsVersion===1)hh.legacyStarRefund=0;');
  once('P.heroes[id].stars++; persist(); return {ok:true};', 'P.heroes[id].stars=heroStars(id)+1; persist(); return {ok:true};');
  // Keep the generic reward flow's label and icon clean for later ceremonies.
  once("const v=document.getElementById('rewardVeil'); if(!v)return toast(title); document.getElementById('rewardBurst').textContent=icon;",
    "const v=document.getElementById('rewardVeil'); if(!v)return toast(title); v.removeAttribute('data-reward-kind'); const card=v.querySelector('.rewardcard'); if(card){card.classList.remove('star-up-ceremony');card.querySelector('.star-up-close')?.remove();} const burst=document.getElementById('rewardBurst'); burst.replaceChildren(); burst.hidden=false; burst.removeAttribute('aria-label'); burst.textContent=icon; const close=document.getElementById('rewardClose'); if(close)close.textContent='Thu nhận';");
  const starClickMarker="document.getElementById('stBtn').addEventListener('click',()=>{ const r=starUpHero(id); if(r.ok)showRewardCeremony('THĂNG SAO','Sức mạnh cốt lõi đã được nâng lên.',[{icon:'★',label:DATA.heroes[id].name,value:'★'.repeat(P.heroes[id]?.star||1)}],'★','Đột phá'); else toast(r.msg); refreshResbar(); renderHeroDetail(id); });";
  once(starClickMarker,"document.getElementById('stBtn').addEventListener('click',(event)=>{ const button=event.currentTarget; runStarUpOnce({id,button,readStars:heroStars,performStarUp:starUpHero,showResult:showHeroStarUpResult,toast,refresh:refreshResbar,render:renderHeroDetail}); });");
  return html;
}
export function installHeroRarityStars(root) {
  const path = join(root, 'dist/index.html');
  const domain = readFileSync(join(root, 'src/domain/hero/rarity-stars.mjs'), 'utf8');
  writeFileSync(path, patchHeroRarityStars(readFileSync(path, 'utf8'), domain));
}


