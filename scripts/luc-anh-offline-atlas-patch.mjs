import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const generated = join(root, '.generated', 'luc-anh-2x');
const distAssets = join(root, 'dist', 'assets', 'characters', 'luc-anh');
const names = [
  'idle-atlas.webp','run-atlas.webp','hit-atlas.webp','fall-atlas.webp',
  'basic-atlas.webp','skill1-atlas.webp','ultimate-atlas.webp',
  'basic_projectile-atlas.webp','basic_impact-atlas.webp','skill1_vfx-atlas.webp','ultimate_vfx-atlas.webp'
];

for (const name of names) {
  const src = join(generated, name);
  if (!existsSync(src)) throw new Error(`Generated Lục Ảnh atlas missing: ${name}`);
  copyFileSync(src, join(distAssets, name));
}

const generatedMeta = join(generated, 'runtime-meta.json');
if (existsSync(generatedMeta)) copyFileSync(generatedMeta, join(distAssets, 'runtime-meta.json'));

function patchFile(path, replacements) {
  let s = readFileSync(path, 'utf8');
  for (const [from,to,label] of replacements) {
    if (!s.includes(from)) throw new Error(`Lục Ảnh offline atlas patch missing ${label}`);
    s = s.replace(from,to);
  }
  writeFileSync(path,s);
}

patchFile(join(root,'dist','battle.html'), [
  ['const LUC_ANH_ID="luc_anh", LUC_ANH_COLS=8, LUC_ANH_CELL_W=240, LUC_ANH_CELL_H=240;', 'const LUC_ANH_ID="luc_anh", LUC_ANH_COLS=8, LUC_ANH_CELL_W=480, LUC_ANH_CELL_H=480;', 'battle cell constants'],
  ['idle:{file:"idle-atlas.webp",frames:64,w:240,h:240,ms:72,loop:true},run:{file:"run-atlas.webp",frames:61,w:240,h:240,ms:42,loop:true},hurt:{file:"hit-atlas.webp",frames:54,w:240,h:240,ms:42},defeated:{file:"fall-atlas.webp",frames:64,w:240,h:240,ms:42},', 'idle:{file:"idle-atlas.webp",frames:64,w:480,h:480,ms:72,loop:true},run:{file:"run-atlas.webp",frames:61,w:480,h:480,ms:42,loop:true},hurt:{file:"hit-atlas.webp",frames:54,w:480,h:480,ms:42},defeated:{file:"fall-atlas.webp",frames:64,w:480,h:480,ms:42},', 'battle passive anim metadata'],
  ['attack:{file:"basic-atlas.webp",frames:64,w:240,h:240,ms:38},skill1:{file:"skill1-atlas.webp",frames:59,w:240,h:240,ms:42},ultimate:{file:"ultimate-atlas.webp",frames:64,w:240,h:240,ms:44},', 'attack:{file:"basic-atlas.webp",frames:64,w:480,h:480,ms:38},skill1:{file:"skill1-atlas.webp",frames:59,w:480,h:480,ms:42},ultimate:{file:"ultimate-atlas.webp",frames:64,w:480,h:480,ms:44},', 'battle skill metadata'],
  ['basicProjectile:{file:"basic_projectile-atlas.webp",frames:64,w:320,h:220,ms:28},basicImpact:{file:"basic_impact-atlas.webp",frames:62,w:320,h:220,ms:28},skill1Vfx:{file:"skill1_vfx-atlas.webp",frames:64,w:320,h:220,ms:30},ultimateVfx:{file:"ultimate_vfx-atlas.webp",frames:64,w:320,h:220,ms:34}', 'basicProjectile:{file:"basic_projectile-atlas.webp",frames:64,w:640,h:440,ms:28},basicImpact:{file:"basic_impact-atlas.webp",frames:62,w:640,h:440,ms:28},skill1Vfx:{file:"skill1_vfx-atlas.webp",frames:64,w:640,h:440,ms:30},ultimateVfx:{file:"ultimate_vfx-atlas.webp",frames:64,w:640,h:440,ms:34}', 'battle VFX metadata']
]);

patchFile(join(root,'dist','index.html'), [
  ["w:240,h:240", "w:480,h:480", 'first hero atlas metadata'],
]);

// index.html contains several Lục Ảnh 240x240 and 320x220 metadata entries.
// Restrict replacements to the LUC_ANH_ANIMS object only.
const indexPath = join(root,'dist','index.html');
let index = readFileSync(indexPath,'utf8');
const start = index.indexOf('const LUC_ANH_ANIMS={');
const end = index.indexOf('};', start);
if (start < 0 || end < 0) throw new Error('LUC_ANH_ANIMS block not found');
let block = index.slice(start,end+2);
block = block.replaceAll('w:240,h:240','w:480,h:480').replaceAll('w:320,h:220','w:640,h:440');
index = index.slice(0,start)+block+index.slice(end+2);
writeFileSync(indexPath,index);

console.log('Lục Ảnh generated 2x atlases wired into dist; frame counts/timing preserved');
