import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-phase-a-v3-css">
#hvHeroRosterV3{position:fixed;left:0;right:0;top:0;bottom:74px;z-index:9999;background:linear-gradient(180deg,#bddce7 0 110px,#f7edd8 110px 100%);color:#2d251f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;overflow:auto;-webkit-overflow-scrolling:touch}
#hvHeroRosterV3[hidden]{display:none!important}
#hvHeroRosterV3 .v3-top{position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(188,220,231,.985),rgba(236,231,208,.985));border-bottom:1px solid #d7b883;box-shadow:0 2px 8px rgba(79,58,27,.14)}
#hvHeroRosterV3 .v3-profile{height:70px;display:grid;grid-template-columns:54px 1fr auto;gap:8px;align-items:center;padding:7px 10px}
#hvHeroRosterV3 .v3-avatar{width:52px;height:52px;border-radius:10px;background:linear-gradient(145deg,#4a6072,#1b222a);border:3px solid #e4b85d;color:#ffe9af;display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:18px;box-shadow:0 2px 5px rgba(77,49,11,.28)}
#hvHeroRosterV3 .v3-name{font-size:15px;font-weight:950;line-height:1}.v3-sub{font-size:10px;color:#6d5941;margin-top:5px}.v3-total{font-size:17px;font-weight:1000;color:#d58a14;margin-top:2px}
#hvHeroRosterV3 .v3-res{display:grid;grid-template-columns:1fr 1fr;gap:5px}.v3-res span{min-width:58px;padding:5px 7px;border-radius:8px;background:rgba(66,109,121,.18);font-size:10px;font-weight:900;text-align:center}
#hvHeroRosterV3 .v3-tabs{height:40px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:0 7px;align-items:end}
#hvHeroRosterV3 .v3-tab{height:33px;border:1px solid #b8844d;border-bottom:0;border-radius:7px 7px 0 0;background:linear-gradient(180deg,#956240,#75492f);color:#f5e1c5;font-size:9.5px;font-weight:900;display:flex;align-items:center;justify-content:center}
#hvHeroRosterV3 .v3-tab.active{height:39px;background:linear-gradient(180deg,#ffe8be,#f0c692);color:#9f5b35;box-shadow:inset 0 1px 0 #fff8e9}
#hvHeroRosterV3 .v3-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px 7px 58px}
#hvHeroRosterV3 .v3-card{position:relative;aspect-ratio:.68;border:3px solid #d88d17;border-radius:6px;background:linear-gradient(180deg,#fff7df,#f3c97d);box-shadow:0 2px 5px rgba(89,54,10,.25),inset 0 0 0 1px rgba(255,255,255,.8);overflow:hidden;padding:0;margin:0;color:inherit;min-width:0}
#hvHeroRosterV3 .v3-art{position:absolute;left:3px;right:3px;top:3px;bottom:31px;border-radius:4px;overflow:hidden;background:linear-gradient(180deg,#cde9df,#acd2c1);border:1px solid rgba(255,255,255,.9)}
#hvHeroRosterV3 .v3-art img{width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block}
#hvHeroRosterV3 .v3-grade{position:absolute;left:2px;top:2px;z-index:3;min-width:24px;height:24px;padding:0 4px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#be2830;border:2px solid #ffe2a5;color:#fff6da;font-size:9.5px;font-weight:1000}
#hvHeroRosterV3 .v3-level{position:absolute;right:4px;top:3px;z-index:3;color:white;font-size:9px;font-weight:1000;text-shadow:0 1px 2px #000,0 0 2px #000}
#hvHeroRosterV3 .v3-element{position:absolute;left:4px;top:29px;z-index:3;width:21px;height:21px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 1px 2px rgba(0,0,0,.2)}
#hvHeroRosterV3 .v3-power{position:absolute;left:50%;bottom:27px;transform:translateX(-50%);z-index:4;min-width:53px;padding:3px 6px;border-radius:12px;background:linear-gradient(180deg,#ffe38e,#efad2a);border:1px solid #b6740f;color:#3d2b13;font-size:8.5px;font-weight:1000;text-align:center;box-shadow:0 1px 3px rgba(72,42,0,.25)}
#hvHeroRosterV3 .v3-stars{position:absolute;left:2px;right:2px;bottom:15px;text-align:center;color:#ffd43d;font-size:9px;letter-spacing:-1px;text-shadow:0 1px 1px #8d5600;line-height:1}
#hvHeroRosterV3 .v3-cardname{position:absolute;left:3px;right:3px;bottom:3px;text-align:center;color:#2c241e;font-size:8px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #fff0cc;line-height:1.1}
#hvHeroRosterV3 .v3-filter{position:sticky;bottom:0;z-index:6;height:50px;display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(248,237,212,.98);border-top:1px solid #d7b37b;box-shadow:0 -3px 10px rgba(72,49,20,.14)}
#hvHeroRosterV3 .v3-filter button{width:31px;height:31px;border-radius:50%;border:1px solid #cda45f;background:#fff6df;font-size:13px}.v3-filter button.active{outline:2px solid #df9f27;background:#f7d477}
</style>`;

const jsBody = `
(function(){
  if(window.__HV_HERO_ROSTER_V3)return;
  window.__HV_HERO_ROSTER_V3=true;

  var HERO_NAMES=['Ông Phở','Thầy Mo','Đình Lôi','Hồng Liên Đao Nương','Thần Nỏ Sơn Nữ','Lạc Yên','Nữ Cung Thủ Tre','Cô Đào Gánh Hội','Phong Tử','Thủy Nương Rối Nước','Thạch Quyền','Lục Ảnh'];

  function visibleScreen(el){
    if(!el)return false;
    var cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;
    var r=el.getBoundingClientRect();
    return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;
  }

  function text(el){return ((el&&el.innerText)||'').split('\\n').join(' ').trim();}

  function rosterMarker(){
    var all=document.querySelectorAll('div,section,main');
    for(var i=0;i<all.length;i++){
      if(all[i].closest&&all[i].closest('#hvHeroRosterV3'))continue;
      var t=text(all[i]);
      if(visibleScreen(all[i])&&(t.indexOf('Chọn tướng theo hệ')>=0||t.indexOf('Đồ Giám Hồn Tướng')>=0))return all[i];
    }
    return null;
  }

  function cardLike(el){
    if(!el||!el.closest)return false;
    if(el.closest('#hvHeroRosterV3'))return false;
    var cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden')return false;
    var t=text(el);
    if(t.indexOf('SSR')<0||t.indexOf('Lv.1')<0)return false;
    var r=el.getBoundingClientRect();
    return r.width>=140&&r.width<=560&&r.height>=180&&r.height<=620;
  }

  function sourceCards(){
    var all=document.querySelectorAll('article,li,button,div');
    var hits=[];
    for(var i=0;i<all.length;i++)if(cardLike(all[i]))hits.push(all[i]);
    var minima=[];
    for(var a=0;a<hits.length;a++){
      var containsSmaller=false;
      for(var b=0;b<hits.length;b++)if(a!==b&&hits[a].contains(hits[b])){containsSmaller=true;break;}
      if(!containsSmaller)minima.push(hits[a]);
    }
    var unique=[], seen={};
    for(var m=0;m<minima.length;m++){
      var item=parseCard(minima[m]);
      var key=item.name;
      if(!key||key==='Tướng')key=item.raw;
      if(seen[key])continue;
      seen[key]=true;
      unique.push(minima[m]);
    }
    return unique;
  }

  function lines(el){
    var raw=((el&&el.innerText)||'').split('\\n');
    var out=[];
    for(var i=0;i<raw.length;i++){var x=raw[i].trim();if(x)out.push(x);}
    return out;
  }

  function parseCard(el){
    var ls=lines(el), joined=ls.join(' '), name='Tướng';
    for(var h=0;h<HERO_NAMES.length;h++)if(joined.indexOf(HERO_NAMES[h])>=0){name=HERO_NAMES[h];break;}
    if(name==='Tướng'){
      for(var i=0;i<ls.length;i++){
        var x=ls[i];
        if(x==='SSR'||x.indexOf('Hệ ')===0||x.indexOf('Lv.')===0||x.length<3)continue;
        if(x.indexOf('SSR ')===0)x=x.slice(4).trim();
        if(x.indexOf('/')>=0||x.indexOf('⚔')>=0)continue;
        name=x;break;
      }
    }
    var level='Lv.1';
    for(var j=0;j<ls.length;j++)if(ls[j].indexOf('Lv.')===0){level=ls[j].split(' ')[0];break;}
    var element='✦';
    if(joined.indexOf('Hệ Hỏa')>=0)element='🔥';
    else if(joined.indexOf('Hệ Kim')>=0)element='⚙️';
    else if(joined.indexOf('Hệ Mộc')>=0)element='🌿';
    else if(joined.indexOf('Hệ Thủy')>=0)element='💧';
    else if(joined.indexOf('Hệ Thổ')>=0)element='⛰️';
    else if(joined.indexOf('Hệ Phong')>=0)element='🌀';
    else if(joined.indexOf('Hệ Mộng')>=0)element='🌙';
    var nums=joined.split(' '), power=1000;
    for(var n=0;n<nums.length;n++){
      var v=Number(nums[n].split('.').join('').split(',').join(''));
      if(Number.isFinite(v)&&v>=800&&v<=99999&&v>power)power=v;
    }
    var imgs=el.querySelectorAll('img'), src='';
    for(var k=0;k<imgs.length;k++){
      var ir=imgs[k].getBoundingClientRect();
      if(ir.width>70&&ir.height>70){src=imgs[k].currentSrc||imgs[k].src||'';if(src)break;}
    }
    if(name.indexOf('Lục Ảnh')>=0)src='/assets/characters/luc-anh/card.webp';
    if(name.indexOf('Ông Phở')>=0)src='/assets/characters/ong-pho/card.png';
    return {name:name,level:level,element:element,power:power,src:src,source:el,raw:joined.toLowerCase()};
  }

  function esc(s){return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');}
  function closeOverlay(){var r=document.getElementById('hvHeroRosterV3');if(r)r.hidden=true;}

  function render(){
    var marker=rosterMarker();
    var root=document.getElementById('hvHeroRosterV3');
    if(!marker){if(root)root.hidden=true;return;}
    var cards=sourceCards();
    if(cards.length<4){if(root)root.hidden=true;return;}
    if(!root){root=document.createElement('section');root.id='hvHeroRosterV3';document.body.appendChild(root);}
    var data=[];for(var i=0;i<cards.length;i++)data.push(parseCard(cards[i]));
    var total=0;for(var t=0;t<data.length;t++)total+=data[t].power;
    root.hidden=false;
    root.innerHTML='<div class="v3-top"><div class="v3-profile"><div class="v3-avatar">HV</div><div><div class="v3-name">Hồn Việt</div><div class="v3-sub">Đồ Giám Tướng · '+data.length+' tướng</div><div class="v3-total">⚔ '+total.toLocaleString('vi-VN')+'</div></div><div class="v3-res"><span>🪙 6.682</span><span>🔴 581K</span></div></div><div class="v3-tabs"><div class="v3-tab">Công lực</div><div class="v3-tab">Thời Trang</div><div class="v3-tab">Trợ chiến</div><div class="v3-tab active">Tướng</div><div class="v3-tab">Đồ Giám</div></div></div><div class="v3-grid"></div><div class="v3-filter"><button class="active" data-f="all">▦</button><button data-f="kim">⚙️</button><button data-f="moc">🌿</button><button data-f="thuy">💧</button><button data-f="hoa">🔥</button><button data-f="tho">⛰️</button><button data-f="phong">🌀</button><button data-f="mong">🌙</button></div>';
    var grid=root.querySelector('.v3-grid');
    for(var d=0;d<data.length;d++){
      (function(item){
        var b=document.createElement('button');b.className='v3-card';b.dataset.raw=item.raw;
        var art=item.src?'<img src="'+esc(item.src)+'" alt="">':'';
        b.innerHTML='<div class="v3-art">'+art+'</div><div class="v3-grade">SSR</div><div class="v3-level">'+esc(item.level)+'</div><div class="v3-element">'+item.element+'</div><div class="v3-power">⚔ '+item.power.toLocaleString('vi-VN')+'</div><div class="v3-stars">★★★★★</div><div class="v3-cardname">'+esc(item.name)+'</div>';
        b.addEventListener('click',function(){closeOverlay();item.source.click();});
        grid.appendChild(b);
      })(data[d]);
    }
    var filter=root.querySelector('.v3-filter');
    filter.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      var bs=filter.querySelectorAll('button');for(var q=0;q<bs.length;q++)bs[q].classList.toggle('active',bs[q]===b);
      var f=b.dataset.f, list=grid.querySelectorAll('.v3-card');
      for(var z=0;z<list.length;z++){
        if(f==='all'){list[z].hidden=false;continue;}
        var term=f;if(f==='moc')term='mộc';else if(f==='thuy')term='thủy';else if(f==='hoa')term='hỏa';else if(f==='tho')term='thổ';
        list[z].hidden=(list[z].dataset.raw||'').indexOf(term)<0;
      }
    });
  }

  var timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(render,120);}
  document.addEventListener('click',schedule,true);
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
  schedule();setTimeout(render,500);setTimeout(render,1200);
})();
`;

new Function(jsBody);
const js = `<script id="hero-roster-phase-a-v3-js">${jsBody}</script>`;
if(!html.includes('hero-roster-phase-a-v3-css'))html=html.replace('</head>',css+'\n</head>');
if(!html.includes('hero-roster-phase-a-v3-js'))html=html.replace('</body>',js+'\n</body>');
writeFileSync(p,html);
console.log('Hero roster Phase A v3 applied: deduped, full-width, syntax-gated');
