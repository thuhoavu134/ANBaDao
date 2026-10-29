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
function showHeroStarUpResult(id,beforeStars){
  const hero=DATA.heroes[id]||{},portrait=typeof portraitSrc==='function'?(portraitSrc(id,'card')||portraitSrc(id,'master')):'';
  const view=buildStarUpResultView({hero,beforeStars,afterStars:heroStars(id),portrait}),veil=document.getElementById('rewardVeil');
  if(!view||!veil){if(typeof toast==='function')toast(view?.description||'Thăng sao đã hoàn tất.');return;}
  showRewardCeremony(view.title,view.description,[],'',view.kicker);
  veil.dataset.rewardKind=view.kind;
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
  const runtimeHelpers=[buildStarUpResultView.toString(),runStarUpOnce.toString(),showHeroStarUpResult.toString()].join('\n');
  once('const SAVE_KEY="mong_gioi_save_v1";', MARK + '\n' + domain.replace(/^export\s+/gm, '') + '\n' + runtimeHelpers + "\nconst __HV_QA_STARUP__=(()=>{try{return new URLSearchParams(location.search).get('qa')==='star-up'&&location.hostname.endsWith('.vercel.app')&&location.hostname.includes('-git-');}catch(_){return false;}})();\nconst SAVE_KEY=__HV_QA_STARUP__?'mong_gioi_qa_star_up_v1':'mong_gioi_save_v1';");
  once('function netOnline(){ return !!(NET.server&&NET.token); }', 'function netOnline(){ return !__HV_QA_STARUP__&&!!(NET.server&&NET.token); }');
  once('async function netAuth(kind){', `async function netAuth(kind){\n  if(__HV_QA_STARUP__){toast('QA chỉ dùng hồ sơ khách cục bộ.');return;}`);
  once('  <script src=\"assets/qa/qa-gear-seed.js\"></script>', '  <script src=\"assets/qa/qa-gear-seed.js\"></script>\n  <script src=\"assets/qa/qa-star-up-seed.js\"></script>');
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
    "const v=document.getElementById('rewardVeil'); if(!v)return toast(title); v.removeAttribute('data-reward-kind'); const burst=document.getElementById('rewardBurst'); burst.replaceChildren(); burst.hidden=false; burst.removeAttribute('aria-label'); burst.textContent=icon; const close=document.getElementById('rewardClose'); if(close)close.textContent='Thu nhận';");
  const starClickMarker="document.getElementById('stBtn').addEventListener('click',()=>{ const r=starUpHero(id); if(r.ok)showRewardCeremony('THĂNG SAO','Sức mạnh cốt lõi đã được nâng lên.',[{icon:'★',label:DATA.heroes[id].name,value:'★'.repeat(P.heroes[id]?.star||1)}],'★','Đột phá'); else toast(r.msg); refreshResbar(); renderHeroDetail(id); });";
  once(starClickMarker,"document.getElementById('stBtn').addEventListener('click',(event)=>{ const button=event.currentTarget; runStarUpOnce({id,button,readStars:heroStars,performStarUp:starUpHero,showResult:showHeroStarUpResult,toast,refresh:refreshResbar,render:renderHeroDetail}); });");
  return html;
}
export function installHeroRarityStars(root) {
  const path = join(root, 'dist/index.html');
  const domain = readFileSync(join(root, 'src/domain/hero/rarity-stars.mjs'), 'utf8');
  writeFileSync(path, patchHeroRarityStars(readFileSync(path, 'utf8'), domain));
}

