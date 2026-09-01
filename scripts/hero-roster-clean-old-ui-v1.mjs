import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const jsBody = `
(function(){
  if(window.__HV_ROSTER_CLEAN_OLD_UI_V1)return;
  window.__HV_ROSTER_CLEAN_OLD_UI_V1=true;
  var hidden=[];

  function txt(el){return ((el&&el.innerText)||'').split('\\n').join(' ').trim();}
  function hideLegacy(){
    var root=document.getElementById('hvHeroRosterV3');
    if(!root||root.hidden)return;
    restoreLegacy();
    var all=document.querySelectorAll('div,section,main,article');
    for(var i=0;i<all.length;i++){
      var el=all[i];
      if(el.closest&&el.closest('#hvHeroRosterV3'))continue;
      var t=txt(el);
      if(t.indexOf('Đồ Giám Hồn Tướng')<0&&t.indexOf('Chọn tướng theo hệ')<0)continue;
      var r=el.getBoundingClientRect();
      if(r.width<innerWidth*.45||r.height<180)continue;
      hidden.push({el:el,display:el.style.display,pointer:el.style.pointerEvents,visibility:el.style.visibility});
      el.style.visibility='hidden';
      el.style.pointerEvents='none';
      break;
    }
    document.body.classList.add('hv-roster-clean-active');
  }
  function restoreLegacy(){
    for(var i=0;i<hidden.length;i++){
      var x=hidden[i];
      if(!x.el||!x.el.style)continue;
      x.el.style.display=x.display;
      x.el.style.pointerEvents=x.pointer;
      x.el.style.visibility=x.visibility;
    }
    hidden=[];
    document.body.classList.remove('hv-roster-clean-active');
  }
  function sync(){
    var root=document.getElementById('hvHeroRosterV3');
    if(root&&!root.hidden)hideLegacy(); else restoreLegacy();
  }
  new MutationObserver(function(){setTimeout(sync,0);}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});
  document.addEventListener('click',function(){setTimeout(sync,40);},true);
  setTimeout(sync,200);
})();
`;

new Function(jsBody);
const css = `<style id="hero-roster-clean-old-ui-v1-css">body.hv-roster-clean-active{overflow:hidden!important}#hvHeroRosterV3{background:linear-gradient(180deg,#bddce7 0 110px,#f7edd8 110px 100%)!important}</style>`;
const js = `<script id="hero-roster-clean-old-ui-v1-js">${jsBody}</script>`;
if(!html.includes('hero-roster-clean-old-ui-v1-css'))html=html.replace('</head>',css+'\n</head>');
if(!html.includes('hero-roster-clean-old-ui-v1-js'))html=html.replace('</body>',js+'\n</body>');
writeFileSync(p,html);
console.log('Legacy hero roster UI hidden while new roster is active');
