import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let s = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-phase-a-v2-css">
#hvRosterReferenceV2{position:fixed;z-index:88;inset:0 0 72px;background:linear-gradient(180deg,#bfe0ea 0 108px,#f7ecd7 108px 100%);color:#2d261f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;overflow:auto;-webkit-overflow-scrolling:touch;padding-bottom:18px}
#hvRosterReferenceV2[hidden]{display:none!important}
#hvRosterReferenceV2 .rr-top{position:sticky;top:0;z-index:6;background:linear-gradient(180deg,rgba(188,219,232,.98),rgba(236,232,207,.96));border-bottom:1px solid #d6b884;box-shadow:0 2px 8px rgba(86,63,28,.16)}
#hvRosterReferenceV2 .rr-player{height:72px;display:grid;grid-template-columns:54px 1fr auto;gap:8px;align-items:center;padding:7px 10px}
#hvRosterReferenceV2 .rr-avatar{width:52px;height:52px;border-radius:10px;border:3px solid #e9c171;background:linear-gradient(145deg,#3e5569,#151b25);display:flex;align-items:center;justify-content:center;color:#ffe8a8;font-weight:1000;font-size:18px;box-shadow:0 1px 4px #60400a}
#hvRosterReferenceV2 .rr-name{font-size:15px;font-weight:900;line-height:1}.rr-sub{margin-top:5px;color:#6e5b44;font-size:11px}.rr-power{color:#d88d15;font-size:18px;font-weight:1000;text-shadow:0 1px 0 #fff}
#hvRosterReferenceV2 .rr-res{display:flex;gap:5px;align-items:center;font-size:11px;font-weight:900}.rr-chip{padding:5px 7px;border-radius:8px;background:rgba(69,115,127,.22);min-width:54px;text-align:center}
#hvRosterReferenceV2 .rr-tabs{height:42px;display:grid;grid-template-columns:repeat(5,1fr);align-items:end;padding:0 8px;gap:3px}
#hvRosterReferenceV2 .rr-tab{height:34px;border:1px solid #b5844f;border-bottom:0;border-radius:7px 7px 0 0;background:linear-gradient(180deg,#9b6844,#74492f);color:#f7e6cc;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}
#hvRosterReferenceV2 .rr-tab.active{height:40px;background:linear-gradient(180deg,#ffe8bf,#efc793);color:#a35e37;box-shadow:inset 0 1px 0 #fff8ea}
#hvRosterReferenceV2 .rr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px}
#hvRosterReferenceV2 .rr-card{position:relative;aspect-ratio:.67;border:3px solid #dc9218;border-radius:6px;background:linear-gradient(180deg,#fff6de,#f3c67a);box-shadow:0 2px 5px rgba(91,56,12,.28),inset 0 0 0 1px #fff8df;overflow:hidden;padding:0}
#hvRosterReferenceV2 .rr-art{position:absolute;inset:3px 3px 27px;border-radius:4px;background:linear-gradient(180deg,#c9e9dc,#a9d1c0);overflow:hidden;border:1px solid rgba(255,255,255,.92)}
#hvRosterReferenceV2 .rr-art img{width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block}
#hvRosterReferenceV2 .rr-grade{position:absolute;top:2px;left:2px;z-index:3;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#be2630;color:#fff5d7;font-size:10px;font-weight:1000;border:2px solid #ffe2a8}
#hvRosterReferenceV2 .rr-grade.s{background:#d4870c}.rr-grade.a{background:#7e4cbb}
#hvRosterReferenceV2 .rr-lv{position:absolute;right:4px;top:3px;z-index:3;color:#fff;font-size:9px;font-weight:1000;text-shadow:0 1px 2px #000,0 0 2px #000}
#hvRosterReferenceV2 .rr-element{position:absolute;left:4px;top:29px;z-index:3;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.94);font-size:12px;box-shadow:0 1px 2px rgba(0,0,0,.2)}
#hvRosterReferenceV2 .rr-force{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:4;padding:3px 7px;min-width:55px;border-radius:12px;background:linear-gradient(180deg,#ffe28c,#efad28);border:1px solid #b8740e;color:#3d2b13;font-size:9px;font-weight:1000;text-align:center;box-shadow:0 1px 3px rgba(72,42,0,.28)}
#hvRosterReferenceV2 .rr-stars{position:absolute;bottom:14px;left:2px;right:2px;text-align:center;font-size:10px;color:#ffd33f;letter-spacing:-1px;text-shadow:0 1px 1px #8c5700}
#hvRosterReferenceV2 .rr-namecard{position:absolute;bottom:2px;left:3px;right:3px;text-align:center;color:#2f251e;font-size:8.7px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #fff2d1}
#hvRosterReferenceV2 .rr-filter{position:sticky;bottom:0;z-index:5;height:50px;display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(248,236,210,.97);border-top:1px solid #d9b47e;box-shadow:0 -3px 10px rgba(72,49,20,.15);backdrop-filter:blur(6px)}
#hvRosterReferenceV2 .rr-filter button{width:31px;height:31px;border-radius:50%;border:1px solid #cfa65f;background:#fff6df;font-size:13px}.rr-filter button.active{outline:2px solid #e1a127;background:#f7d57a}
@media(min-width:700px){#hvRosterReferenceV2{left:50%;right:auto;width:min(680px,100vw);transform:translateX(-50%);box-shadow:0 0 30px rgba(0,0,0,.18)}}
</style>`;

const js = `<script id="hero-roster-phase-a-v2-js">
(()=>{
 if(window.__HV_ROSTER_REF_V2)return;window.__HV_ROSTER_REF_V2=true;
 const HINTS=['Lục Ảnh','Ông Phở','Đình Lôi','Hồng Liên','Lạc Yên','Phong Tử','Thầy Mo','Thạch Quyền','Nữ Cung','Cô Đào'];
 const clean=t=>(t||'').replace(/\s+/g,' ').trim();
 function isHeroCard(el){const t=clean(el.innerText||el.textContent||'');const r=el.getBoundingClientRect();return r.width>150&&r.width<520&&r.height>180&&r.height<520&&(HINTS.some(x=>t.includes(x))||/\bSSR\b/.test(t));}
 function getCards(){const all=[...document.querySelectorAll('article,li,button,div')].filter(isHeroCard);return all.filter(el=>!all.some(o=>o!==el&&el.contains(o)&&isHeroCard(o)));}
 function parse(el){const raw=clean(el.innerText||el.textContent||''), lines=(el.innerText||el.textContent||'').split(/\n+/).map(clean).filter(Boolean);const grade=(raw.match(/\bSSR\b|\bS\+\b|\bS\b|\bA\b/i)||['SSR'])[0].toUpperCase();const lv=(raw.match(/Lv\.?\s*\d+/i)||['Lv.1'])[0].replace(/Lv\s*/i,'Lv.');let name=lines.find(x=>HINTS.some(h=>x.includes(h)))||lines.find(x=>x.length>3&&!/^Hệ\b|^Lv\b|^SSR$/i.test(x))||'Tướng';name=name.replace(/\bSSR\b|\bS\+?\b|\bA\b/ig,'').replace(/\s+[·•].*$/,'').trim();const nums=(raw.match(/\b\d{3,5}\b/g)||[]).map(Number);const power=nums.length?Math.max(...nums):1000;const sys=lines.find(x=>/Hệ\b/i.test(x))||'';let element='✦';if(/Hỏa/i.test(sys))element='🔥';else if(/Kim/i.test(sys))element='⚙️';else if(/Mộc/i.test(sys))element='🌿';else if(/Thủy/i.test(sys))element='💧';else if(/Thổ/i.test(sys))element='⛰️';else if(/Phong/i.test(sys))element='🌀';else if(/Mộng/i.test(sys))element='🌙';const imgs=[...el.querySelectorAll('img')].filter(im=>{const r=im.getBoundingClientRect();return r.width>80&&r.height>80;});let src=imgs.map(im=>im.currentSrc||im.src).find(Boolean)||'';if(!src){for(const n of el.querySelectorAll('*')){const bg=getComputedStyle(n).backgroundImage||'';const m=bg.match(/url\(["']?(.*?)["']?\)/);if(m&&m[1].includes('assets/')){src=m[1];break;}}}const stars=Math.max(1,Math.min(5,(raw.match(/★|⭐/g)||[]).length||1));return {grade,lv,name,power,element,src,stars,source:el};}
 function render(){const cards=getCards();let root=document.getElementById('hvRosterReferenceV2');if(cards.length<6){if(root)root.hidden=true;return;}const data=cards.map(parse);if(!root){root=document.createElement('section');root.id='hvRosterReferenceV2';document.body.appendChild(root);}root.hidden=false;root.innerHTML='<div class="rr-top"><div class="rr-player"><div class="rr-avatar">HV</div><div><div class="rr-name">Hồn Việt</div><div class="rr-sub">Đồ Giám Tướng · '+data.length+' tướng</div><div class="rr-power">⚔ '+data.reduce((a,b)=>a+b.power,0).toLocaleString('vi-VN')+'</div></div><div class="rr-res"><span class="rr-chip">🪙 6.682</span><span class="rr-chip">🔴 581K</span></div></div><div class="rr-tabs"><div class="rr-tab">Công lực</div><div class="rr-tab">Thời Trang</div><div class="rr-tab">Trợ chiến</div><div class="rr-tab active">Tướng</div><div class="rr-tab">Đồ Giám</div></div></div><div class="rr-grid"></div><div class="rr-filter"><button class="active" data-f="all">▦</button><button data-f="kim">⚙️</button><button data-f="moc">🌿</button><button data-f="thuy">💧</button><button data-f="hoa">🔥</button><button data-f="tho">⛰️</button><button data-f="phong">🌀</button><button data-f="mong">🌙</button></div>';
 const grid=root.querySelector('.rr-grid');data.forEach((d,i)=>{const b=document.createElement('button');b.className='rr-card';b.dataset.i=i;b.dataset.text=clean(d.source.innerText||d.source.textContent||'').toLowerCase();b.innerHTML='<div class="rr-art">'+(d.src?'<img src="'+d.src.replace(/"/g,'&quot;')+'" alt="">':'')+'</div><div class="rr-grade '+(d.grade==='S'?'s':d.grade==='A'?'a':'')+'">'+d.grade+'</div><div class="rr-lv">'+d.lv+'</div><div class="rr-element">'+d.element+'</div><div class="rr-force">⚔ '+d.power.toLocaleString('vi-VN')+'</div><div class="rr-stars">'+('★'.repeat(d.stars))+'</div><div class="rr-namecard">'+d.name.replace(/</g,'&lt;')+'</div>';b.addEventListener('click',()=>{root.hidden=true;d.source.click();setTimeout(render,500);});grid.appendChild(b);});
 root.querySelector('.rr-filter').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;root.querySelectorAll('.rr-filter button').forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.f;grid.querySelectorAll('.rr-card').forEach(c=>{if(f==='all'){c.hidden=false;return;}const t=c.dataset.text||'';const term=f==='moc'?'mộc':f==='thuy'?'thủy':f==='hoa'?'hỏa':f==='tho'?'thổ':f;c.hidden=!t.includes(term);});});
 }
 let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,80);};new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});schedule();setTimeout(render,400);setTimeout(render,1000);
})();
</script>`;
if(!s.includes('hero-roster-phase-a-v2-css'))s=s.replace('</head>',css+'\n</head>');
if(!s.includes('hero-roster-phase-a-v2-js'))s=s.replace('</body>',js+'\n</body>');
writeFileSync(p,s);
console.log('Hero roster Phase A v2 applied: dedicated reference-style roster screen');
