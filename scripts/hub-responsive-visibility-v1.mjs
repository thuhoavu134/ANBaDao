import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');

const style = String.raw`<style id="hv-hub-responsive-visibility-v2">
/* Samkok-style upper U layout: side actions stay around the roof, never in the lower gateway. */
#hubScreen .art-side{z-index:18!important;top:12%!important;bottom:48%!important;gap:0!important;justify-content:space-between!important;pointer-events:none!important}
#hubScreen .art-side .art-label-action{position:relative!important;z-index:20!important;visibility:visible!important;display:flex!important;opacity:1!important;pointer-events:auto!important;width:58px!important;height:58px!important;min-height:58px!important;max-width:none!important}
#hubScreen .art-side .art-label-icon,#hubScreen .art-side .art-label-icon img{width:44px!important;height:44px!important;flex-basis:44px!important;object-fit:contain!important;pointer-events:none!important}
#hubScreen .art-side .art-label-text{font-size:8px!important;line-height:1!important;text-shadow:0 2px 3px rgba(0,0,0,.9)!important}
#hubScreen .art-side.left [data-art-go="friends"]{z-index:22!important;visibility:visible!important;display:flex!important;opacity:1!important;pointer-events:auto!important}
@media(max-width:430px){
  #hubScreen .art-side{top:12%!important;bottom:52%!important}
  #hubScreen .art-side .art-label-action{width:46px!important;height:46px!important;min-height:46px!important}
  #hubScreen .art-side .art-label-icon,#hubScreen .art-side .art-label-icon img{width:34px!important;height:34px!important;flex-basis:34px!important}
  #hubScreen .art-side .art-label-text{font-size:7.2px!important}
}
@media(max-width:430px) and (max-height:760px){
  #hubScreen .art-side{top:14%!important;bottom:52%!important}
  #hubScreen .art-side .art-label-action{width:42px!important;height:38px!important;min-height:38px!important}
  #hubScreen .art-side .art-label-icon,#hubScreen .art-side .art-label-icon img{width:30px!important;height:30px!important;flex-basis:30px!important}
  #hubScreen .art-side .art-label-text{font-size:6.8px!important}
}
@media(min-width:431px) and (max-width:759px){
  #hubScreen .art-side{top:11%!important;bottom:50%!important}
  #hubScreen .art-side .art-label-action{width:52px!important;height:52px!important;min-height:52px!important}
  #hubScreen .art-side .art-label-icon,#hubScreen .art-side .art-label-icon img{width:40px!important;height:40px!important;flex-basis:40px!important}
  #hubScreen .art-side .art-label-text{font-size:7.4px!important}
}
@media(min-width:760px) and (max-height:820px){
  #hubScreen .art-side{top:10%!important;bottom:46%!important}
  #hubScreen .art-side .art-label-action{width:54px!important;height:54px!important;min-height:54px!important}
  #hubScreen .art-side .art-label-icon,#hubScreen .art-side .art-label-icon img{width:42px!important;height:42px!important;flex-basis:42px!important}
  #hubScreen .art-side .art-label-text{font-size:7.7px!important}
}
</style>`;

if (!html.includes('id="hv-hub-responsive-visibility-v2"')) {
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

if (!html.includes('id="hv-hub-responsive-visibility-v2"') || !html.includes('id="hv-hub-main-quest-removal-v2"')) {
  throw new Error('Hub responsive/quest patch injection failed');
}

writeFileSync(indexPath, html);
console.log('Hub mobile side actions stabilized and main quest hub card removed');
