import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');

if (html.includes('id="hv-hub-icon-alpha-hotfix-v1"')) {
  throw new Error('Hub icon alpha hotfix already installed');
}

const style = `<style id="hv-hub-icon-alpha-hotfix-v1">
/* Transparent Imagen/PNG menu art must not inherit the old plastic disc or dark halo. */
#hubScreen .art-side .art-label-action,
#hubScreen .art-side .art-label-icon,
#hubScreen .art-side .art-label-icon img{
  background:transparent!important;
  background-color:transparent!important;
  border:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  filter:none!important;
  mix-blend-mode:normal!important;
  opacity:1!important;
}
#hubScreen .art-side .art-label-action::before,
#hubScreen .art-side .art-label-action::after,
#hubScreen .art-side .art-label-icon::before,
#hubScreen .art-side .art-label-icon::after,
#hubScreen .art-side .art-label-icon img::before,
#hubScreen .art-side .art-label-icon img::after{
  display:none!important;
  content:none!important;
  background:transparent!important;
  box-shadow:none!important;
}
#hubScreen .art-side .art-label-icon img{
  object-fit:contain!important;
  -webkit-mask-image:none!important;
  mask-image:none!important;
}
</style>`;

if (!html.includes('</head>')) throw new Error('Hub icon alpha hotfix: head marker not found');
html = html.replace('</head>', style + '\n</head>');
writeFileSync(indexPath, html);
console.log('Hub icon alpha hotfix installed: removed legacy disc background and stacked dark filters');

