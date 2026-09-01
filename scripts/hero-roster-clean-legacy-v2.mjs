import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const jsBody = `
(function(){
  if(window.__HV_ROSTER_CLEAN_LEGACY_V2)return;
  window.__HV_ROSTER_CLEAN_LEGACY_V2=true;
  var legacy=null, saved=null;

  function txt(el){return ((el&&el.innerText)||'').split('\\n').join(' ').trim();}

  function findLegacy(){
    if(legacy&&document.body.contains(legacy))return legacy;
    var all=document.querySelectorAll('section,main,div');
    var best=null,bestArea=0;
    for(var i=0;i<all.length;i++){
      var el=all[i];
      if(el.closest&&el.closest('#hvHeroRosterV3'))continue;
      var t=txt(el);
      if(t.indexOf('Đồ Giám Hồn Tướng')<0&&t.indexOf('Chọn tướng theo hệ')<0)continue;
      var r=el.getBoundingClientRect(), area=r.width*r.height;
      if(r.width<innerWidth*.45||r.height<180)continue;
      if(area>bestArea){best=el;bestArea=area;}
    }
    legacy=best;
    return legacy;
  }

  function clean(){
    var root=document.getElementById('hvHeroRosterV3');
    var el=findLegacy();
    if(!root||root.hidden||!el){restore();return;}
    if(!saved){saved={clipPath:el.style.clipPath,webkitClipPath:el.style.webkitClipPath,pointerEvents:el.style.pointerEvents,userSelect:el.style.userSelect};}
    // Hide pixels only. Bounding box + computed visibility remain intact, so V3 can still detect the legacy roster marker.
    el.style.clipPath='inset(50%)';
    el.style.webkitClipPath='inset(50%)';
    el.style.pointerEvents='none';
    el.style.userSelect='none';
    document.body.classList.add('hv-roster-v2-clean');
  }

  function restore(){
    if(legacy&&saved){
      legacy.style.clipPath=saved.clipPath;
      legacy.style.webkitClipPath=saved.webkitClipPath;
      legacy.style.pointerEvents=saved.pointerEvents;
      legacy.style.userSelect=saved.userSelect;
    }
    saved=null;
    document.body.classList.remove('hv-roster-v2-clean');
  }

  function sync(){setTimeout(clean,0);}
  new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});
  document.addEventListener('click',sync,true);
  document.addEventListener('pointerdown',sync,true);
  setTimeout(clean,180);setTimeout(clean,700);
})();
`;

new Function(jsBody);
const css = `<style id="hero-roster-clean-legacy-v2-css">
body.hv-roster-v2-clean{overflow:hidden!important;background:#f7edd8!important}
body.hv-roster-v2-clean #hvHeroRosterV3{z-index:99999!important;left:0!important;right:0!important;width:auto!important;transform:none!important;background:linear-gradient(180deg,#bddce7 0 110px,#f7edd8 110px 100%)!important}
</style>`;
const js = `<script id="hero-roster-clean-legacy-v2-js">${jsBody}</script>`;
if(!html.includes('hero-roster-clean-legacy-v2-css'))html=html.replace('</head>',css+'\n</head>');
if(!html.includes('hero-roster-clean-legacy-v2-js'))html=html.replace('</body>',js+'\n</body>');
writeFileSync(p,html);
console.log('Legacy hero UI visually clipped while preserving roster marker logic');
