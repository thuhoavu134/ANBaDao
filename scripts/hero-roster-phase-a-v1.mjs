import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let s = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-phase-a-v1-css">
body.hv-roster-phase-a{background:#f3ecd9!important;color:#2c241d!important}
.hv-roster-phase-a .hv-roster-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;align-items:start!important;padding:6px 4px 118px!important}
.hv-roster-phase-a .hv-roster-card{position:relative!important;min-width:0!important;aspect-ratio:.69!important;padding:0!important;margin:0!important;border-radius:7px!important;border:2px solid #d58d18!important;background:linear-gradient(180deg,#fff8e7 0%,#f6dba9 100%)!important;box-shadow:0 2px 5px rgba(91,51,9,.22),inset 0 0 0 1px rgba(255,255,255,.82)!important;overflow:hidden!important;cursor:pointer!important}
.hv-roster-phase-a .hv-roster-card>.hv-roster-original{position:absolute!important;inset:0!important;opacity:0!important;pointer-events:none!important}
.hv-roster-card-ui{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.hv-roster-card-art{position:absolute;left:3px;right:3px;top:3px;height:72%;border-radius:5px;overflow:hidden;background:linear-gradient(180deg,#d7efe4,#b8dbc8);border:1px solid rgba(255,255,255,.85)}
.hv-roster-card-art img{width:100%;height:100%;display:block;object-fit:contain;object-position:center bottom;filter:saturate(1.03) contrast(1.02)}
.hv-roster-rarity{position:absolute;left:4px;top:4px;z-index:3;min-width:23px;height:22px;padding:0 4px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:#b6292f;color:#fff6d4;font-size:10px;font-weight:1000;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.hv-roster-rarity[data-rarity="SSR"]{background:#c0292f}.hv-roster-rarity[data-rarity="S"]{background:#d68d0c}.hv-roster-rarity[data-rarity="A"]{background:#7e4cba}
.hv-roster-level{position:absolute;right:5px;top:4px;z-index:3;color:#fff;font-size:9px;font-weight:900;text-shadow:0 1px 2px #000,0 0 2px #000}
.hv-roster-element{position:absolute;left:5px;top:27px;z-index:3;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.9);font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.22)}
.hv-roster-power{position:absolute;left:50%;top:65%;transform:translate(-50%,-50%);z-index:4;min-width:54px;padding:3px 6px;border-radius:13px;text-align:center;background:linear-gradient(180deg,#ffe59b,#f1b638);border:1px solid #c9850f;color:#3d2b11;font-size:9px;font-weight:950;box-shadow:0 1px 3px rgba(76,42,0,.3)}
.hv-roster-stars{position:absolute;left:3px;right:3px;bottom:24px;text-align:center;color:#ffd541;font-size:10px;letter-spacing:-1px;text-shadow:0 1px 1px #8d5700}
.hv-roster-name{position:absolute;left:3px;right:3px;bottom:4px;height:18px;display:flex;align-items:center;justify-content:center;text-align:center;color:#2a2420;font-size:9px;font-weight:900;line-height:1.05;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 0 rgba(255,255,255,.7)}
.hv-roster-tabs{display:flex;align-items:end;gap:4px;margin:2px 4px 4px;padding-top:4px;border-bottom:1px solid #dbc49b}
.hv-roster-tab{flex:1;min-width:0;padding:8px 2px 7px;border:1px solid #bd9364;border-bottom:none;border-radius:7px 7px 0 0;background:linear-gradient(180deg,#8e5e3c,#70462e);color:#f4dfbf;text-align:center;font-size:10px;font-weight:800;opacity:.85}
.hv-roster-tab.active{background:linear-gradient(180deg,#ffe7bc,#f2c68e);color:#9e5833;opacity:1;box-shadow:inset 0 1px 0 #fff7e8}
.hv-roster-filter{position:sticky;bottom:72px;z-index:80;margin:0 -2px;padding:7px 8px;display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(246,237,213,.96);border-top:1px solid #dec49b;box-shadow:0 -4px 12px rgba(75,52,23,.12);backdrop-filter:blur(7px)}
.hv-roster-filter button{width:30px;height:30px;border-radius:50%;border:1px solid #d2aa68;background:#fff8e8;color:#715538;font-size:13px;font-weight:900;box-shadow:inset 0 1px 0 #fff,0 1px 2px rgba(0,0,0,.12)}
.hv-roster-filter button.active{outline:2px solid #e6a92e;background:#f8db83}
@media(max-width:360px){.hv-roster-phase-a .hv-roster-grid{gap:4px!important}.hv-roster-name{font-size:8px}.hv-roster-power{font-size:8px;min-width:48px}.hv-roster-tab{font-size:9px}}
</style>`;

const js = `<script id="hero-roster-phase-a-v1-js">
(()=>{
 if(window.__HV_HERO_ROSTER_PHASE_A_V1)return;window.__HV_HERO_ROSTER_PHASE_A_V1=true;
 const NAMES_HINT=['Lục Ảnh','Ông Phở','Đình Lôi','Hồng Liên','Lạc Yên','Phong Tử','Thầy Mo','Thạch Quyền'];
 const clean=t=>(t||'').replace(/\s+/g,' ').trim();
 const cardText=el=>clean(el.innerText||el.textContent||'');
 function cardCandidate(el){
   const t=cardText(el); if(t.length<8||t.length>420)return false;
   const hasHero=NAMES_HINT.some(n=>t.includes(n));
   const hasMeta=/\bSSR\b|\bS\+?\b|\bLv\.?\s*\d+/i.test(t);
   const r=el.getBoundingClientRect();
   return (hasHero||hasMeta)&&r.width>110&&r.width<380&&r.height>150&&r.height<520;
 }
 function findCards(){
   const nodes=[...document.querySelectorAll('article,li,button,div')].filter(cardCandidate);
   const minima=nodes.filter(el=>!nodes.some(other=>other!==el&&el.contains(other)&&cardCandidate(other)));
   const groups=new Map();
   for(const c of minima){const p=c.parentElement;if(!p)continue;if(!groups.has(p))groups.set(p,[]);groups.get(p).push(c);}
   return [...groups.entries()].sort((a,b)=>b[1].length-a[1].length)[0]||[null,[]];
 }
 function parseCard(card){
   const raw=cardText(card), lines=(card.innerText||card.textContent||'').split(/\n+/).map(clean).filter(Boolean);
   const rarity=(raw.match(/\bSSR\b|\bS\+\b|\bS\b|\bA\b/i)||['SSR'])[0].toUpperCase();
   const level=((raw.match(/Lv\.?\s*\d+/i)||['Lv.1'])[0]).replace(/Lv\s*/i,'Lv.');
   let name='Tướng';
   for(const line of lines){const x=line.replace(/\bSSR\b|\bS\+?\b|\bA\b/ig,'').trim();if(x&&x.length>=3&&!/^Hệ\b|^Lv\b|^[⭐★]/i.test(x)){name=x.replace(/\s+[·•].*$/,'').trim();break;}}
   const power=(raw.match(/\b\d{3,5}\b/g)||[]).map(Number).sort((a,b)=>b-a)[0]||1000;
   const systemLine=lines.find(x=>/Hệ\b/i.test(x))||'';
   let element='✦';
   if(/Hỏa/i.test(systemLine))element='🔥'; else if(/Kim/i.test(systemLine))element='⚙️'; else if(/Thủy/i.test(systemLine))element='💧'; else if(/Mộc/i.test(systemLine))element='🌿'; else if(/Thổ/i.test(systemLine))element='⛰️'; else if(/Phong/i.test(systemLine))element='🌀'; else if(/Mộng/i.test(systemLine))element='🌙';
   const imgs=[...card.querySelectorAll('img')].filter(im=>{const r=im.getBoundingClientRect();return r.width>70&&r.height>70;});
   let src=imgs.map(im=>im.currentSrc||im.src).find(Boolean)||'';
   if(!src){for(const el of card.querySelectorAll('*')){const bg=getComputedStyle(el).backgroundImage||'';const m=bg.match(/url\(["']?(.*?)["']?\)/);if(m&&/assets\//.test(m[1])){src=m[1];break;}}}
   const starCount=Math.max(1,Math.min(5,(raw.match(/★|⭐/g)||[]).length||1));
   return {rarity,level,name,power,element,src,starCount};
 }
 function makeUI(card){
   if(card.querySelector(':scope > .hv-roster-card-ui'))return;
   const d=parseCard(card);
   [...card.children].forEach(ch=>{if(!ch.classList.contains('hv-roster-card-ui'))ch.classList.add('hv-roster-original');});
   const ui=document.createElement('div');ui.className='hv-roster-card-ui';
   ui.innerHTML='<div class="hv-roster-card-art">'+(d.src?'<img alt="" src="'+d.src.replace(/"/g,'&quot;')+'">':'')+'</div><div class="hv-roster-rarity" data-rarity="'+d.rarity+'">'+d.rarity+'</div><div class="hv-roster-level">'+d.level+'</div><div class="hv-roster-element">'+d.element+'</div><div class="hv-roster-power">⚔ '+Number(d.power).toLocaleString('vi-VN')+'</div><div class="hv-roster-stars">'+('★'.repeat(d.starCount))+'</div><div class="hv-roster-name">'+d.name.replace(/</g,'&lt;')+'</div>';
   card.appendChild(ui);
 }
 function ensureTabs(grid){
   if(document.querySelector('.hv-roster-tabs'))return;
   const tabs=document.createElement('div');tabs.className='hv-roster-tabs';tabs.innerHTML='<div class="hv-roster-tab">Công lực</div><div class="hv-roster-tab">Thời Trang</div><div class="hv-roster-tab">Trợ chiến</div><div class="hv-roster-tab active">Tướng</div><div class="hv-roster-tab">Đồ Giám</div>';
   grid.parentElement?.insertBefore(tabs,grid);
 }
 function ensureFilter(grid){
   if(document.querySelector('.hv-roster-filter'))return;
   const bar=document.createElement('div');bar.className='hv-roster-filter';bar.innerHTML='<button class="active" data-f="all">▦</button><button data-f="kim">⚙️</button><button data-f="moc">🌿</button><button data-f="thuy">💧</button><button data-f="hoa">🔥</button><button data-f="tho">⛰️</button><button data-f="mong">🌙</button>';
   grid.parentElement?.appendChild(bar);
   bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.f;grid.querySelectorAll('.hv-roster-card').forEach(c=>{if(f==='all'){c.style.display='';return;}const t=cardText(c).toLowerCase();c.style.display=t.includes(f==='moc'?'mộc':f==='thuy'?'thủy':f==='hoa'?'hỏa':f==='tho'?'thổ':f)===''?'none':'';});});
 }
 function apply(){
   const [grid,cards]=findCards(); if(!grid||cards.length<6)return;
   document.body.classList.add('hv-roster-phase-a');grid.classList.add('hv-roster-grid');
   cards.forEach(c=>{c.classList.add('hv-roster-card');makeUI(c);});
   ensureTabs(grid);ensureFilter(grid);
 }
 const schedule=()=>requestAnimationFrame(apply);
 schedule();setTimeout(apply,200);setTimeout(apply,700);setTimeout(apply,1600);
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});
})();
</script>`;

if(!s.includes('hero-roster-phase-a-v1-css')) s=s.replace('</head>',css+'\n</head>');
if(!s.includes('hero-roster-phase-a-v1-js')) s=s.replace('</body>',js+'\n</body>');
writeFileSync(p,s);
console.log('Hero roster Phase A v1 applied: four-column sample-style roster, tabs, filters, compact gacha cards');
