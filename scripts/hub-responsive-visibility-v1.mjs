import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');

const style = String.raw`<style id="hv-hub-responsive-visibility-v3">
/* Samkok-style upper U layout: restore the original icon scale, but reflow two compact columns so every shortcut stays above the roof. */
#hubScreen .art-side{
  z-index:18!important;
  top:10.5%!important;
  bottom:auto!important;
  height:43%!important;
  width:28%!important;
  padding:0!important;
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  grid-auto-flow:row!important;
  grid-auto-rows:max-content!important;
  align-content:start!important;
  justify-items:center!important;
  column-gap:0!important;
  row-gap:5px!important;
  background:none!important;
  box-shadow:none!important;
  pointer-events:none!important
}
#hubScreen .art-side.left{left:1.5%!important}
#hubScreen .art-side.right{right:1.5%!important}
#hubScreen .art-side .art-label-action{
  position:relative!important;
  z-index:20!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:1px!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  width:54px!important;
  height:64px!important;
  min-height:64px!important;
  max-width:54px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  background:transparent!important;
  filter:drop-shadow(0 4px 6px rgba(0,0,0,.48))!important
}
#hubScreen .art-side .art-label-icon{
  display:block!important;
  width:52px!important;
  height:52px!important;
  flex:0 0 52px!important;
  pointer-events:none!important
}
#hubScreen .art-side .art-label-icon img{
  display:block!important;
  width:52px!important;
  height:52px!important;
  flex:0 0 52px!important;
  object-fit:contain!important;
  pointer-events:none!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important
}
#hubScreen .art-side .art-label-text{
  display:block!important;
  max-width:100%!important;
  font-size:8.3px!important;
  line-height:1!important;
  white-space:nowrap!important;
  color:#fff4d5!important;
  text-align:center!important;
  text-shadow:0 2px 4px #000,0 0 6px #000!important
}
#hubScreen .art-side.left [data-art-go="friends"]{
  z-index:22!important;
  visibility:visible!important;
  display:flex!important;
  opacity:1!important;
  pointer-events:auto!important
}

/* Imagen assets replace CSS-made plastic shapes only for the player avatar and live resources. Text and values remain live HTML/CSS. */
#hubScreen .art-avatar{
  width:42px!important;
  height:42px!important;
  flex:0 0 42px!important;
  overflow:hidden!important;
  color:transparent!important;
  font-size:0!important;
  background-color:transparent!important;
  background-image:url('assets/ui/menu-v3233/icons/profile-ong-pho-imagen.png')!important;
  background-position:center!important;
  background-size:cover!important;
  background-repeat:no-repeat!important
}
#hubScreen .art-res .res-icon,
#hubScreen .art-res i.res-icon{
  display:block!important;
  width:22px!important;
  height:22px!important;
  flex:0 0 22px!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  clip-path:none!important;
  background-color:transparent!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
  background-size:contain!important;
  box-shadow:none!important;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))!important
}
#hubScreen .art-res .res-icon-gold{background-image:url('assets/ui/menu-v3233/icons/resource-gold-imagen.png')!important}
#hubScreen .art-res .res-icon-gem{background-image:url('assets/ui/menu-v3233/icons/resource-gem-imagen.png')!important}
#hubScreen .art-res .res-icon-energy{
  width:20px!important;
  flex-basis:20px!important;
  height:24px!important;
  background-image:url('assets/ui/menu-v3233/icons/resource-energy-imagen.png')!important
}
@media(max-width:430px){
  #hubScreen .art-side{
    top:11%!important;
    height:44%!important;
    width:29%!important;
    row-gap:3px!important
  }
  #hubScreen .art-side .art-label-action{
    width:50px!important;
    height:61px!important;
    min-height:61px!important;
    max-width:50px!important
  }
  #hubScreen .art-side .art-label-icon,
  #hubScreen .art-side .art-label-icon img{
    width:48px!important;
    height:48px!important;
    flex-basis:48px!important
  }
  #hubScreen .art-side .art-label-text{font-size:8px!important}
  #hubScreen .art-res .res-icon,
  #hubScreen .art-res i.res-icon{
    width:20px!important;
    height:20px!important;
    flex-basis:20px!important
  }
  #hubScreen .art-res .res-icon-energy{
    width:18px!important;
    height:22px!important;
    flex-basis:18px!important
  }
}
@media(max-width:380px){
  #hubScreen .art-side{
    top:11%!important;
    height:45%!important;
    width:32%!important;
    row-gap:2px!important
  }
  #hubScreen .art-side .art-label-action{
    width:46px!important;
    height:58px!important;
    min-height:58px!important;
    max-width:46px!important
  }
  #hubScreen .art-side .art-label-icon,
  #hubScreen .art-side .art-label-icon img{
    width:44px!important;
    height:44px!important;
    flex-basis:44px!important
  }
  #hubScreen .art-side .art-label-text{font-size:7.6px!important}
  #hubScreen .art-avatar{
    width:40px!important;
    height:40px!important;
    flex-basis:40px!important
  }
}
@media(min-width:760px){
  #hubScreen .art-side{
    top:9.5%!important;
    height:44%!important;
    width:28%!important;
    row-gap:6px!important
  }
  #hubScreen .art-side .art-label-action{
    width:58px!important;
    height:69px!important;
    min-height:69px!important;
    max-width:58px!important
  }
  #hubScreen .art-side .art-label-icon,
  #hubScreen .art-side .art-label-icon img{
    width:54px!important;
    height:54px!important;
    flex-basis:54px!important
  }
  #hubScreen .art-side .art-label-text{font-size:9px!important}
  #hubScreen .art-res .res-icon,
  #hubScreen .art-res i.res-icon{
    width:24px!important;
    height:24px!important;
    flex-basis:24px!important
  }
  #hubScreen .art-res .res-icon-energy{
    width:21px!important;
    height:27px!important;
    flex-basis:21px!important
  }
}
</style>`;

if (!html.includes('id="hv-hub-responsive-visibility-v3"')) {
  if (!html.includes('</head>')) throw new Error('Hub responsive patch: head anchor missing');
  html = html.replace('</head>', style + '\n</head>');
}

const questRemoval = String.raw`<script id="hv-hub-main-quest-removal-v2">
(()=> {
  const removeHubQuest = () => {
    document.querySelectorAll('#hv-main-quest-hub').forEach((node) => node.remove());
  };
  const stabilizeHubActions = () => {
    removeHubQuest();
    const setIcon = (selector, src) => {
      document.querySelectorAll(selector).forEach((img) => {
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      });
    };
    setIcon('#hubScreen .art-side.left [data-art-go="daily"] img', 'assets/ui/menu-v3233/icons/quests.png');
    setIcon('#hubScreen .art-side.left [data-art-go="friends"] img', 'assets/ui/menu-v3233/icons/friends-v2.png');
    const friend = document.querySelector('#hubScreen .art-side.left [data-art-go="friends"]');
    if (!friend) return;
    friend.style.visibility = 'visible';
    friend.style.display = 'flex';
    friend.style.opacity = '1';
    friend.style.pointerEvents = 'auto';
    friend.style.zIndex = '22';
  };
  const observe = () => {
    if (!document.body) return;
    stabilizeHubActions();
    new MutationObserver(stabilizeHubActions).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
</script>`;

if (!html.includes('id="hv-hub-main-quest-removal-v2"')) {
  if (!html.includes('</body>')) throw new Error('Hub quest removal patch: body anchor missing');
  html = html.replace('</body>', questRemoval + '\n</body>');
}

if (!html.includes('id="hv-hub-responsive-visibility-v3"') || !html.includes('id="hv-hub-main-quest-removal-v2"')) {
  throw new Error('Hub responsive/quest patch injection failed');
}

writeFileSync(indexPath, html);
console.log('Hub mobile side actions stabilized and main quest hub card removed');
