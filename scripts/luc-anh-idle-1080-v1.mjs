import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LUC_ANH_IDLE_1080 as IDLE } from '../src/domain/character/luc-anh-idle.mjs';

const out = join(process.cwd(), 'dist');
const file = IDLE.src.split('/').pop();

function replaceOnce(source, expression, replacement, label) {
  const matches = source.match(expression) || [];
  if (matches.length !== 1) {
    throw new Error(`Lục Ảnh IDLE 1080 patch expected one ${label}, found ${matches.length}`);
  }
  return source.replace(expression, replacement);
}

function patchBattle() {
  const path = join(out, 'battle.html');
  let source = readFileSync(path, 'utf8');
  const idleExpression = /idle:\{file:"idle(?:-1080)?-atlas\.webp",frames:\d+,w:\d+,h:\d+,ms:\d+,loop:true\}/g;
  const replacement = `idle:{file:"${file}",frames:${IDLE.frames},w:${IDLE.cellW},h:${IDLE.cellH},ms:${IDLE.ms},loop:true}`;
  source = replaceOnce(source, idleExpression, replacement, 'battle idle metadata');
  if (!source.includes(`file:"${file}"`)) throw new Error('Lục Ảnh IDLE 1080 battle asset was not wired');
  writeFileSync(path, source);
}

function patchHeroDetail() {
  const path = join(out, 'index.html');
  let source = readFileSync(path, 'utf8');
  const objectStart = source.indexOf('const LUC_ANH_ANIMS=Object.freeze({');
  if (objectStart < 0) throw new Error('Lục Ảnh IDLE 1080 patch missing hero animation registry');
  const objectEnd = source.indexOf('\n});', objectStart);
  if (objectEnd < 0) throw new Error('Lục Ảnh IDLE 1080 patch missing hero animation registry end');
  const prefix = source.slice(0, objectStart);
  const block = source.slice(objectStart, objectEnd);
  const suffix = source.slice(objectEnd);
  const idleExpression = /idle:\{src:'assets\/characters\/luc-anh\/idle(?:-1080)?-atlas\.webp',frames:\d+,cols:\d+,w:\d+,h:\d+,ms:\d+,loop:true\}/g;
  const replacement = `idle:{src:'${IDLE.src}',frames:${IDLE.frames},cols:${IDLE.cols},w:${IDLE.cellW},h:${IDLE.cellH},ms:${IDLE.ms},loop:true}`;
  const patchedBlock = replaceOnce(block, idleExpression, replacement, 'hero-detail idle metadata');
  source = prefix + patchedBlock + suffix;
  const manifestExpression = /idle:'assets\/characters\/luc-anh\/idle(?:-1080)?-atlas\.webp'/g;
  source = replaceOnce(source, manifestExpression, `idle:'${IDLE.src}'`, 'character manifest idle asset');
  const masterGhostExpression = /\.hstage\.luc-anh-stage \.hsava\.hero-master\{opacity:\.18;filter:blur\(\.2px\);transform:scale\(1\.08\)\}/g;
  source = replaceOnce(
    source,
    masterGhostExpression,
    '.hstage.luc-anh-stage .hsava.hero-master{opacity:0;filter:none;transform:none}',
    'legacy master ghost layer'
  );
  if (!source.includes(`src:'${IDLE.src}'`)) throw new Error('Lục Ảnh IDLE 1080 hero-detail asset was not wired');
  writeFileSync(path, source);
}

patchBattle();
patchHeroDetail();
console.log(`Lục Ảnh IDLE 1080 wired: ${IDLE.frames} frames · ${IDLE.cellW}×${IDLE.cellH} cells`);
