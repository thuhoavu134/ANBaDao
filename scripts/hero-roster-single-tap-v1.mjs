import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const jsBody = `
(function(){
  if(window.__HV_ROSTER_SINGLE_TAP_V1)return;
  window.__HV_ROSTER_SINGLE_TAP_V1=true;
  var locked=false;

  function clean(s){return String(s||'').split('\\n').join(' ').trim();}

  function findSourceByName(name){
    var all=document.querySelectorAll('article,li,button,div');
    var best=null,bestArea=Infinity;
    for(var i=0;i<all.length;i++){
      var el=all[i];
      if(el.closest&&el.closest('#hvHeroRosterV3'))continue;
      var t=clean(el.innerText||el.textContent||'');
      if(!t||t.indexOf(name)<0||t.indexOf('SSR')<0)continue;
      var r=el.getBoundingClientRect();
      if(r.width<120||r.height<160)continue;
      var area=r.width*r.height;
      if(area<bestArea){best=el;bestArea=area;}
    }
    return best;
  }

  function activate(ev){
    var card=ev.target&&ev.target.closest?ev.target.closest('#hvHeroRosterV3 .v3-card'):null;
    if(!card||locked)return;
    var nameEl=card.querySelector('.v3-cardname');
    var name=clean(nameEl&&nameEl.textContent);
    if(!name)return;
    locked=true;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    card.style.transform='scale(.985)';
    var root=document.getElementById('hvHeroRosterV3');
    if(root)root.hidden=true;
    setTimeout(function(){
      var src=findSourceByName(name);
      if(src){
        try{src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch'}));}catch(_e){}
        setTimeout(function(){try{src.click();}catch(_e){}},20);
      }
      setTimeout(function(){locked=false;},500);
    },35);
  }

  document.addEventListener('pointerdown',activate,true);
  document.addEventListener('touchstart',activate,{capture:true,passive:false});
})();
`;

new Function(jsBody);
const js = `<script id="hero-roster-single-tap-v1-js">${jsBody}</script>`;
if(!html.includes('hero-roster-single-tap-v1-js'))html=html.replace('</body>',js+'\n</body>');
writeFileSync(p,html);
console.log('Hero roster single-tap fix applied');
