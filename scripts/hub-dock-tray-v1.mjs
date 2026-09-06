import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');

if (html.includes('id="hv-hub-dock-tray-v1"')) {
  throw new Error('Hub dock tray patch already installed');
}

const style = [
  '<style id="hv-hub-dock-tray-v1">',
  '#hubScreen .art-dock{',
  '  overflow:visible!important;',
  '  background:transparent!important;',
  '  border:0!important;',
  '  box-shadow:none!important;',
  '  isolation:isolate!important;',
  '}',
  '#hubScreen .art-dock::before{',
  '  content:"";',
  '  position:absolute;',
  '  z-index:0;',
  '  left:0;',
  '  right:0;',
  '  top:42px;',
  '  bottom:0;',
  '  border-top:1px solid rgba(255,223,155,.46);',
  '  background:linear-gradient(180deg,rgba(45,32,29,.91),rgba(30,21,21,.98) 44%,rgba(19,16,19,1) 100%);',
  '  box-shadow:0 -8px 20px rgba(10,19,18,.28);',
  '  pointer-events:none;',
  '}',
  '#hubScreen .art-dock .art-action{',
  '  position:relative!important;',
  '  z-index:1!important;',
  '}',
  '@media(max-width:430px){',
  '  #hubScreen .art-dock::before{top:38px;}',
  '}',
  '@media(min-width:760px){',
  '  #hubScreen .art-dock::before{top:46px;}',
  '}',
  '</style>'
].join('\n');

if (!html.includes('</head>')) throw new Error('Document head marker not found');
html = html.replace('</head>', style + '\n</head>');
writeFileSync(indexPath, html);
console.log('Hub dock tray installed: tray begins at button midpoints and buttons stay above it');
