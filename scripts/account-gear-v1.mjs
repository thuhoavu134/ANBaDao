import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const domain = readFileSync(join(process.cwd(), 'src/domain/equipment/account-board.mjs'), 'utf8')
  .replace(/^export /gm, '');
const relics = readFileSync(join(process.cwd(), 'src/domain/equipment/account-relics.mjs'), 'utf8')
  .replace(/^export /gm, '');
const pets = readFileSync(join(process.cwd(), 'src/domain/equipment/account-pets.mjs'), 'utf8')
  .replace(/^export /gm, '');
const spirits = readFileSync(join(process.cwd(), 'src/domain/equipment/account-spirits.mjs'), 'utf8')
  .replace(/^export /gm, '');
const divines = readFileSync(join(process.cwd(), 'src/domain/equipment/account-divines.mjs'), 'utf8')
  .replace(/^export /gm, '');
const stars = readFileSync(join(process.cwd(), 'src/domain/hero/account-stars.mjs'), 'utf8')
  .replace(/^export /gm, '');
const antiques = readFileSync(join(process.cwd(), 'src/domain/equipment/account-antiques.mjs'), 'utf8')
  .replace(/^export /gm, '');
const luck = readFileSync(join(process.cwd(), 'src/domain/equipment/account-luck.mjs'), 'utf8')
  .replace(/^export /gm, '');
const illusions = readFileSync(join(process.cwd(), 'src/domain/equipment/account-illusions.mjs'), 'utf8')
  .replace(/^export /gm, '');
const fish = readFileSync(join(process.cwd(), 'src/domain/equipment/account-fish.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/account-gear-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/account-gear-board.css'), 'utf8');
new Function(domain);
new Function(relics);
new Function(pets);
new Function(spirits);
new Function(divines);
new Function(stars);
new Function(antiques);
new Function(luck);
new Function(illusions);
new Function(fish);
new Function(runtime);

let html = readFileSync(target, 'utf8');
if (html.includes('id="hv-account-gear-js"')) throw new Error('Account gear runtime already installed');
html = html.replace('</head>', `<style id="hv-account-gear-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Account gear shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-account-gear-js">(()=>{\n${domain}\n${relics}\n${pets}\n${spirits}\n${divines}\n${stars}\n${antiques}\n${luck}\n${illusions}\n${fish}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Account gear board installed: Trợ trận wheel complete');
