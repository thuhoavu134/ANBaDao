import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-phase-a-v4-css">
#hvHeroRosterV4{position:fixed;inset:0 0 74px;z-index:99999;background:linear-gradient(180deg,#bddce7 0 110px,#f7edd8 110px 100%);color:#2d251f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;overflow:auto;-webkit-overflow-scrolling:touch}
#hvHeroRosterV4[hidden]{display:none!important}
#hvHeroRosterV4 .v4-top{position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(188,220,231,.985),rgba(236,231,208,.985));border-bottom:1px solid #d7b883;box-shadow:0 2px 8px rgba(79,58,27,.14)}
#hvHeroRosterV4 .v4-profile{height:70px;display:grid;grid-template-columns:54px 1fr auto;gap:8px;align-items:center;padding:7px 10px}
#hvHeroRosterV4 .v4-avatar{width:52px;height:52px;border-radius:10px;background:linear-gradient(145deg,#4a6072,#1b222a);border:3px solid #e4b85d;color:#ffe9af;display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:18px;box-shadow:0 2px 5px rgba(77,49,11,.28)}
#hvHeroRosterV4 .v4-name{font-size:15px;font-weight:950;line-height:1}.v4-sub{font-size:10px;color:#6d5941;margin-top:5px}.v4-total{font-size:17px;font-weight:1000;color:#d58a14;margin-top:2px}
#hvHeroRosterV4 .v4-res{display:grid;grid-template-columns:1fr 1fr;gap:5px}.v4-res span{min-width:58px;padding:5px 7px;border-radius:8px;background:rgba(66,109,121,.18);font-size:10px;font-weight:900;text-align:center}
#hvHeroRosterV4 .v4-tabs{height:40px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:0 7px;align-items:end}
#hvHeroRosterV4 .v4-tab{height:33px;border:1px solid #b8844d;border-bottom:0;border-radius:7px 7px 0 0;background:linear-gradient(180deg,#956240,#75492f);color:#f5e1c5;font-size:9.5px;font-weight:900;display:flex;align-items:center;justify-content:center}
#hvHeroRosterV4 .v4-tab.active{height:39px;background:linear-gradient(180deg,#ffe8be,#f0c692);color:#9f5b35;box-shadow:inset 0 1px 0 #fff8e9}
#hvHeroRosterV4 .v4-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px 7px 58px}
#hvHeroRosterV4 .v4-card{position:relative;aspect-ratio:.68;border:3px solid #d88d17;border-radius:6px;background:linear-gradient(180deg,#fff7df,#f3c97d);box-shadow:0 2px 5px rgba(89,54,10,.25),inset 0 0 0 1px rgba(255,255,255,.8);overflow:hidden;padding:0;margin:0;color:inherit;min-width:0;touch-action:manipulation}
#hvHeroRosterV4 .v4-art{position:absolute;left:3px;right:3px;top:3px;bottom:31px;border-radius:4px;overflow:hidden;background:linear-gradient(180deg,#cde9df,#acd2c1);border:1px solid rgba(255,255,255,.9)}
#hvHeroRosterV4 .v4-art img{width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block}
#hvHeroRosterV4 .v4-grade{position:absolute;left:2px;top:2px;z-index:3;min-width:24px;height:24px;padding:0 4px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#be2830;border:2px solid #ffe2a5;color:#fff6da;font-size:9.5px;font-weight:1000}
#hvHeroRosterV4 .v4-level{position:absolute;right:4px;top:3px;z-index:3;color:white;font-size:9px;font-weight:1000;text-shadow:0 1px 2px #000,0 0 2px #000}
#hvHeroRosterV4 .v4-element{position:absolute;left:4px;top:29px;z-index:3;width:21px;height:21px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 1px 2px rgba(0,0,0,.2)}
#hvHeroRosterV4 .v4-power{position:absolute;left:50%;bottom:27px;transform:translateX(-50%);z-index:4;min-width:53px;padding:3px 6px;border-radius:12px;background:linear-gradient(180deg,#ffe38e,#efad2a);border:1px solid #b6740f;color:#3d2b13;font-size:8.5px;font-weight:1000;text-align:center;box-shadow:0 1px 3px rgba(72,42,0,.25)}
#hvHeroRosterV4 .v4-stars{position:absolute;left:2px;right:2px;bottom:15px;text-align:center;color:#ffd43d;font-size:9px;letter-spacing:-1px;text-shadow:0 1px 1px #8d5600;line-height:1}
#hvHeroRosterV4 .v4-cardname{position:absolute;left:3px;right:3px;bottom:3px;text-align:center;color:#2c241e;font-size:8px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #fff0cc;line-height:1.1}
#hvHeroRosterV4 .v4-filter{position:sticky;bottom:0;z-index:6;height:50px;display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(248,237,212,.98);border-top:1px solid #d7b37b;box-shadow:0 -3px 10px rgba(72,49,20,.14)}
#hvHeroRosterV4 .v4-filter button{width:31px;height:31px;border-radius:50%;border:1px solid #cda45f;background:#fff6df;font-size:13px}.v4-filter button.active{outline:2px solid #df9f27;background:#f7d477}
</style>`;

const jsBody = `
(function(){
  if(window.__HV_HERO_ROSTER_V4)return;
  window.__HV_HERO_ROSTER_V4=true;
  var HERO_NAMES=['Ông Phở','Thầy Mo','Đình Lôi','Hồng Liên Đao Nương','Thần Nỏ Sơn Nữ','Lạc Yên','Nữ Cung Thủ Tre','Cô Đào Gánh Hội','Phong Tử','Thủy Nương Rối Nước','Thạch Quyền','Lục Ảnh'];
  var parked=null,parkedStyle=null,openingDetail=false;

  function clean(s){return String(s||'').split('\\n').join(' ').trim();}
  function esc(s){return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
  function lines(el){var a=((el&&el.innerText)||'').split('\\n'),o=[];for(var i=0;i<a.length;i++){var x=a[i].trim();if(x)o.push(x);}return o;}

  function cardLike(el){
    if(!el||!el.closest||el.closest('#hvHeroRosterV4'))return false;
    var t=clean(el.innerText||el.textContent||'');
    if(t.indexOf('SSR')<0||t.indexOf('Lv.1')<0)return false;
    var r=el.getBoundingClientRect();
    return r.width>=140&&r.width<=560&&r.height>=180&&r.height<=650;
  }

  function parseCard(el){
    var ls=lines(el),joined=ls.join(' '),name='Tướng';
    for(var h=0;h<HERO_NAMES.length;h++)if(joined.indexOf(HERO_NAMES[h])>=0){name=HERO_NAMES[h];break;}
    var level='Lv.1';for(var i=0;i<ls.length;i++)if(ls[i].indexOf('Lv.')===0){level=ls[i].split(' ')[0];break;}
    var element='✦';if(joined.indexOf('Hệ Hỏa')>=0)element='🔥';else if(joined.indexOf('Hệ Kim')>=0)element='⚙️';else if(joined.indexOf('Hệ Mộc')>=0)element='🌿';else if(joined.indexOf('Hệ Thủy')>=0)element='💧';else if(joined.indexOf('Hệ Thổ')>=0)element='⛰️';else if(joined.indexOf('Hệ Phong')>=0)element='🌀';else if(joined.indexOf('Hệ Mộng')>=0)element='🌙';
    var parts=joined.split(' '),power=1000;for(var n=0;n<parts.length;n++){var v=Number(parts[n].split('.').join('').split(',').join(''));if(Number.isFinite(v)&&v>=800&&v<=99999&&v>power)power=v;}
    var imgs=el.querySelectorAll('img'),src='';for(var k=0;k<imgs.length;k++){var r=imgs[k].getBoundingClientRect();if(r.width>70&&r.height>70){src=imgs[k].currentSrc||imgs[k].src||'';if(src)break;}}
    if(name.indexOf('Lục Ảnh')>=0)src='/assets/characters/luc-anh/card.webp';
    if(name.indexOf('Ông Phở')>=0)src='/assets/characters/ong-pho/card.png';
    return {name:name,level:level,element:element,power:power,src:src,source:el,raw:joined.toLowerCase()};
  }

  function collectCards(){
    var all=document.querySelectorAll('article,li,button,div'),hits=[];
    for(var i=0;i<all.length;i++)if(cardLike(all[i]))hits.push(all[i]);
    var minima=[];for(var a=0;a<hits.length;a++){var nested=false;for(var b=0;b<hits.length;b++)if(a!==b&&hits[a].contains(hits[b])){nested=true;break;}if(!nested)minima.push(hits[a]);}
    var out=[],seen={};for(var m=0;m<minima.length;m++){var item=parseCard(minima[m]),key=item.name;if(!key||key==='Tướng')continue;if(seen[key])continue;seen[key]=true;out.push(item);}
    return out;
  }

  function findLegacyContainer(){
    var all=document.querySelectorAll('section,main,div'),best=null,bestArea=Infinity;
    for(var i=0;i<all.length;i++){
      var el=all[i];if(el.closest&&el.closest('#hvHeroRosterV4'))continue;
      var t=clean(el.innerText||el.textContent||'');
      if(t.indexOf('Đồ Giám Hồn Tướng')<0&&t.indexOf('Chọn tướng theo hệ')<0)continue;
      var r=el.getBoundingClientRect(),area=r.width*r.height;if(r.width<innerWidth*.45||r.height<300)continue;
      if(area<bestArea){best=el;bestArea=area;}
    }
    return best;
  }

  function parkLegacy(){
    if(parked)return;
    parked=findLegacyContainer();if(!parked)return;
    parkedStyle={position:parked.style.position,left:parked.style.left,top:parked.style.top,width:parked.style.width,pointerEvents:parked.style.pointerEvents,zIndex:parked.style.zIndex};
    parked.style.position='fixed';parked.style.left='-300vw';parked.style.top='0';parked.style.width='100vw';parked.style.pointerEvents='none';parked.style.zIndex='-1';
  }
  function unparkLegacy(){
    if(!parked||!parkedStyle)return;
    parked.style.position=parkedStyle.position;parked.style.left=parkedStyle.left;parked.style.top=parkedStyle.top;parked.style.width=parkedStyle.width;parked.style.pointerEvents=parkedStyle.pointerEvents;parked.style.zIndex=parkedStyle.zIndex;parked=null;parkedStyle=null;
  }

  function build(data){
    var root=document.getElementById('hvHeroRosterV4');if(!root){root=document.createElement('section');root.id='hvHeroRosterV4';document.body.appendChild(root);}
    var total=0;for(var i=0;i<data.length;i++)total+=data[i].power;
    root.innerHTML='<div class="v4-top"><div class="v4-profile"><div class="v4-avatar">HV</div><div><div class="v4-name">Hồn Việt</div><div class="v4-sub">Đồ Giám Tướng · '+data.length+' tướng</div><div class="v4-total">⚔ '+total.toLocaleString('vi-VN')+'</div></div><div class="v4-res"><span>🪙 6.682</span><span>🔴 581K</span></div></div><div class="v4-tabs"><div class="v4-tab">Công lực</div><div class="v4-tab">Thời Trang</div><div class="v4-tab">Trợ chiến</div><div class="v4-tab active">Tướng</div><div class="v4-tab">Đồ Giám</div></div></div><div class="v4-grid"></div><div class="v4-filter"><button class="active" data-f="all">▦</button><button data-f="kim">⚙️</button><button data-f="moc">🌿</button><button data-f="thuy">💧</button><button data-f="hoa">🔥</button><button data-f="tho">⛰️</button><button data-f="phong">🌀</button><button data-f="mong">🌙</button></div>';
    var grid=root.querySelector('.v4-grid');
    for(var d=0;d<data.length;d++)(function(item){var b=document.createElement('button');b.className='v4-card';b.dataset.raw=item.raw;var art=item.src?'<img src="'+esc(item.src)+'" alt="">':'';b.innerHTML='<div class="v4-art">'+art+'</div><div class="v4-grade">SSR</div><div class="v4-level">'+esc(item.level)+'</div><div class="v4-element">'+item.element+'</div><div class="v4-power">⚔ '+item.power.toLocaleString('vi-VN')+'</div><div class="v4-stars">★★★★★</div><div class="v4-cardname">'+esc(item.name)+'</div>';b.addEventListener('pointerdown',function(ev){ev.preventDefault();ev.stopPropagation();if(openingDetail)return;openingDetail=true;unparkLegacy();try{item.source.click();}catch(_e){}setTimeout(function(){root.hidden=true;openingDetail=false;},80);},{capture:true});grid.appendChild(b);})(data[d]);
    var filter=root.querySelector('.v4-filter');filter.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var bs=filter.querySelectorAll('button');for(var q=0;q<bs.length;q++)bs[q].classList.toggle('active',bs[q]===b);var f=b.dataset.f,list=grid.querySelectorAll('.v4-card');for(var z=0;z<list.length;z++){if(f==='all'){list[z].hidden=false;continue;}var term=f;if(f==='moc')term='mộc';else if(f==='thuy')term='thủy';else if(f==='hoa')term='hỏa';else if(f==='tho')term='thổ';list[z].hidden=(list[z].dataset.raw||'').indexOf(term)<0;}});
    root.hidden=false;parkLegacy();
  }

  function openRoster(){
    if(openingDetail)return;
    var data=collectCards();
    if(data.length<4){setTimeout(function(){var retry=collectCards();if(retry.length>=4)build(retry);},120);return;}
    build(data);
  }

  function isHeroNavClick(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('button,a,[role="button"]'):null;
    if(!el||el.closest('#hvHeroRosterV4'))return false;
    var t=clean(el.textContent||el.innerText||'');
    return t==='Tướng';
  }

  document.addEventListener('pointerdown',function(ev){if(isHeroNavClick(ev))setTimeout(openRoster,90);},true);
  document.addEventListener('click',function(ev){if(isHeroNavClick(ev))setTimeout(openRoster,90);},true);

  // If the user reloads while already on the legacy Tướng screen, replace it once automatically.
  setTimeout(function(){var body=clean(document.body.innerText||'');if(body.indexOf('Đồ Giám Hồn Tướng')>=0&&body.indexOf('Chọn tướng theo hệ')>=0)openRoster();},350);
})();
`;

new Function(jsBody);
const js = `<script id="hero-roster-phase-a-v4-js">${jsBody}</script>`;
if(!html.includes('hero-roster-phase-a-v4-css'))html=html.replace('</head>',css+'\n</head>');
if(!html.includes('hero-roster-phase-a-v4-js'))html=html.replace('</body>',js+'\n</body>');
writeFileSync(p,html);
console.log('Hero roster Phase A v4 applied: direct activation, legacy roster parked offscreen');
