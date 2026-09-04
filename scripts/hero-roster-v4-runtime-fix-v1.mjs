import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-v4-runtime-fix-v1-css">
#hvHeroRosterV4{height:calc(100vh - 74px)!important;height:calc(100dvh - 74px)!important;min-height:0!important;max-height:none!important;bottom:auto!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;padding-bottom:50px!important}
#hvHeroRosterV4 .v4-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:clamp(136px,36vw,366px)!important;align-content:start!important;align-items:stretch!important;padding:8px 7px 18px!important;min-height:0!important}
#hvHeroRosterV4 .v4-card{height:100%!important;min-height:136px!important;aspect-ratio:auto!important}
#hvHeroRosterV4 .v4-filter{position:sticky!important;left:auto!important;right:auto!important;bottom:0!important;z-index:100002!important;height:50px!important;margin:0!important}
@media (max-width:430px){#hvHeroRosterV4 .v4-grid{grid-auto-rows:clamp(132px,36vw,160px)!important;gap:4px!important}}
</style>`;

const jsBody = `
(function(){
  if(window.__HV_ROSTER_V4_RUNTIME_FIX_V1)return;
  window.__HV_ROSTER_V4_RUNTIME_FIX_V1=true;
  var busy=false,lastVisible=false;
  function clean(s){return String(s||'').split('\\n').join(' ').replace(/\\s+/g,' ').trim();}
  function esc(s){return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
  function lines(el){var a=((el&&el.innerText)||'').split('\\n'),o=[];for(var i=0;i<a.length;i++){var x=a[i].trim();if(x)o.push(x);}return o;}
  function heroIdForName(name){
    if(name==='Lục Ảnh')return 'luc_anh';
    try{if(typeof DATA!=='undefined'&&DATA.heroes){for(var key in DATA.heroes)if(DATA.heroes[key]&&DATA.heroes[key].name===name)return key;}}catch(_e){}
    return '';
  }
  function candidate(el){if(!el||!el.closest||el.closest('#hvHeroRosterV4'))return false;var t=clean(el.innerText||el.textContent||'');if(t.indexOf('SSR')<0||t.indexOf('Lv.1')<0)return false;var r=el.getBoundingClientRect();return r.width>=120&&r.width<=600&&r.height>=150&&r.height<=700;}
  function sourceCards(){var all=document.querySelectorAll('article,li,button,div'),hits=[];for(var i=0;i<all.length;i++)if(candidate(all[i]))hits.push(all[i]);var out=[];for(var a=0;a<hits.length;a++){var nested=false;for(var b=0;b<hits.length;b++)if(a!==b&&hits[a].contains(hits[b])){nested=true;break;}if(!nested)out.push(hits[a]);}return out;}
  function heroName(el){var ls=lines(el);for(var i=0;i<ls.length;i++){var x=ls[i].replace('SSR','').trim();if(!x||x==='S'||x==='S+'||x==='A')continue;if(x.indexOf('Lv.')===0||x.indexOf('Hệ ')===0||x.indexOf('⚔')>=0||x.indexOf('/')>=0)continue;if(x.indexOf('★')>=0||x.indexOf('⭐')>=0)continue;var first=x.split(' — ')[0].split(' - ')[0].trim();if(first.length>=3&&first.length<=36)return first;}return '';}
  function elementFor(t){if(t.indexOf('Hệ Hỏa')>=0)return '🔥';if(t.indexOf('Hệ Kim')>=0)return '⚙️';if(t.indexOf('Hệ Mộc')>=0)return '🌿';if(t.indexOf('Hệ Thủy')>=0)return '💧';if(t.indexOf('Hệ Thổ')>=0)return '⛰️';if(t.indexOf('Hệ Phong')>=0)return '🌀';if(t.indexOf('Hệ Mộng')>=0)return '🌙';return '✦';}
  function powerFor(t){var p=t.split(' '),best=1000;for(var i=0;i<p.length;i++){var v=Number(p[i].split('.').join('').split(',').join(''));if(Number.isFinite(v)&&v>=800&&v<=99999&&v>best)best=v;}return best;}
  function imageFor(el){var imgs=el.querySelectorAll('img');for(var i=0;i<imgs.length;i++){var src=imgs[i].currentSrc||imgs[i].src||'';if(src)return src;}return '';}
  function recoverTwelfth(root){if(!root||root.hidden)return;var grid=root.querySelector('.v4-grid');if(!grid)return;var cards=grid.querySelectorAll('.v4-card');if(cards.length>=12)return;var existing={};for(var i=0;i<cards.length;i++){var n=clean(cards[i].querySelector('.v4-cardname')&&cards[i].querySelector('.v4-cardname').textContent);if(n)existing[n]=true;}var sources=sourceCards();for(var s=0;s<sources.length&&grid.querySelectorAll('.v4-card').length<12;s++){var srcEl=sources[s],name=heroName(srcEl);if(!name||existing[name])continue;var raw=clean(srcEl.innerText||srcEl.textContent||''),img=imageFor(srcEl),power=powerFor(raw),element=elementFor(raw);var b=document.createElement('button');b.className='v4-card';b.dataset.raw=raw.toLowerCase();b.dataset.heroId=heroIdForName(name);b.innerHTML='<div class="v4-art">'+(img?'<img src="'+esc(img)+'" alt="">':'')+'</div><div class="v4-grade">SSR</div><div class="v4-level">Lv.1</div><div class="v4-element">'+element+'</div><div class="v4-power">⚔ '+power.toLocaleString('vi-VN')+'</div><div class="v4-stars">★★★★★</div><div class="v4-cardname">'+esc(name)+'</div>';b.addEventListener('pointerdown',function(ev){ev.preventDefault();ev.stopPropagation();var source=this.__source;if(!source)return;var r=document.getElementById('hvHeroRosterV4');if(r)r.hidden=true;setTimeout(function(){try{source.click();}catch(_e){}},20);},{capture:true});b.__source=srcEl;grid.appendChild(b);existing[name]=true;}var count=grid.querySelectorAll('.v4-card').length;var sub=root.querySelector('.v4-sub');if(sub)sub.textContent='Đồ Giám Tướng · '+count+' tướng';}
  function apply(){if(busy)return;busy=true;requestAnimationFrame(function(){var root=document.getElementById('hvHeroRosterV4');var visible=!!(root&&!root.hidden);if(visible&&!lastVisible)root.scrollTop=0;if(visible)recoverTwelfth(root);lastVisible=visible;busy=false;});}
  var detailBusy=false,lastDetailAt=0;
  function openV4Detail(ev){
    var card=ev.target&&ev.target.closest?ev.target.closest('#hvHeroRosterV4 .v4-card'):null;
    if(!card)return;
    var now=Date.now();
    if(detailBusy||now-lastDetailAt<500){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();return;}
    var name=clean(card.querySelector('.v4-cardname')&&card.querySelector('.v4-cardname').textContent);
    var id=card.dataset.heroId||heroIdForName(name);
    if(!id||typeof renderHeroDetail!=='function'||typeof showScreen!=='function')return;
    detailBusy=true;lastDetailAt=now;ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    var root=document.getElementById('hvHeroRosterV4');if(root)root.hidden=true;
    try{renderHeroDetail(id);showScreen('heroDetail');}catch(_e){}
    setTimeout(function(){detailBusy=false;},220);
  }
  document.addEventListener('pointerdown',openV4Detail,true);
  document.addEventListener('pointerup',openV4Detail,true);
  document.addEventListener('click',openV4Detail,true);
  document.addEventListener('touchstart',openV4Detail,{capture:true,passive:false});
  new MutationObserver(apply).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  setTimeout(apply,250);setTimeout(apply,700);
})();
`;
new Function(jsBody);
const js = `<script id="hero-roster-v4-runtime-fix-v1-js">${jsBody}</script>`;
if(!html.includes('hero-roster-v4-runtime-fix-v1-css'))html=html.replace('</head>',css+'\n</head>');
if(!html.includes('hero-roster-v4-runtime-fix-v1-js'))html=html.replace('</body>',js+'\n</body>');
writeFileSync(p,html);
console.log('Hero roster V4 runtime fix applied: stable grid, natural scroll, 12-hero recovery');
