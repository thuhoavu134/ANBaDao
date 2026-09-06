import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');

const style = String.raw\`<style id="hv-hub-responsive-visibility-v1">
/* Keep all five side actions inside short phone viewports. The dock remains the only bottom tray. */
#hubScreen .art-side{z-index:18!important}
#hubScreen .art-side .art-label-action{visibility:visible!important;display:flex!important;opacity:1!important;pointer-events:auto!important}
@media(max-width:430px){
  #hubScreen .art-side{top:17%!important;bottom:23%!important;gap:0!important;justify-content:space-between!important}
  #hubScreen .art-label-action{width:64px!important;height:64px!important;min-height:64px!important;max-width:none!important}
  #hubScreen .art-label-icon,#hubScreen .art-label-icon img{width:46px!important;height:46px!important;flex-basis:46px!important}
  #hubScreen .art-label-text{font-size:7.7px!important;line-height:1!important}
}
@media(max-width:430px) and (max-height:760px){
  #hubScreen .art-side{top:15%!important;bottom:22%!important}
  #hubScreen .art-label-action{width:58px!important;height:58px!important;min-height:58px!important}
  #hubScreen .art-label-icon,#hubScreen .art-label-icon img{width:42px!important;height:42px!important;flex-basis:42px!important}
  #hubScreen .art-label-text{font-size:7.2px!important}
}
@media(min-width:431px) and (max-width:759px){
  #hubScreen .art-side{top:16%!important;bottom:23%!important;gap:0!important;justify-content:space-between!important}
  #hubScreen .art-label-action{width:74px!important;height:74px!important;min-height:74px!important}
  #hubScreen .art-label-icon,#hubScreen .art-label-icon img{width:54px!important;height:54px!important;flex-basis:54px!important}
}
@media(min-width:760px) and (max-height:820px){
  #hubScreen .art-side{top:14%!important;bottom:22%!important;gap:0!important;justify-content:space-between!important}
  #hubScreen .art-label-action{width:70px!important;height:68px!important;min-height:68px!important}
  #hubScreen .art-label-icon,#hubScreen .art-label-icon img{width:50px!important;height:50px!important;flex-basis:50px!important}
  #hubScreen .art-label-text{font-size:8.5px!important}
}
</style>\`;

if (!html.includes('id="hv-hub-responsive-visibility-v1"')) {
  if (!html.includes('</head>')) throw new Error('Hub responsive patch: head anchor missing');
  html = html.replace('</head>', style + '\\n</head>');
}

const questRemoval = String.raw\`<script id="hv-hub-main-quest-removal-v1">
(()=> {
  const removeHubQuest = () => {
    document.querySelectorAll('#hv-main-quest-hub').forEach((node) => node.remove());
  };
  const observe = () => {
    if (!document.body) return;
    removeHubQuest();
    new MutationObserver(removeHubQuest).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
</script>\`;

if (!html.includes('id="hv-hub-main-quest-removal-v1"')) {
  if (!html.includes('</body>')) throw new Error('Hub quest removal patch: body anchor missing');
  html = html.replace('</body>', questRemoval + '\\n</body>');
}

if (!html.includes('id="hv-hub-responsive-visibility-v1"') || !html.includes('id="hv-hub-main-quest-removal-v1"')) {
  throw new Error('Hub responsive/quest patch injection failed');
}

writeFileSync(indexPath, html);
console.log('Hub mobile side actions stabilized and main quest hub card removed');
