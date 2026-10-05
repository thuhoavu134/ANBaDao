import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import sharp from 'sharp';
import { registrationFromCrop } from '../src/assets/sprite-registration.mjs';

export const PREPARATION_PAGE_FRAMES = 8;

// Read the final build's descriptors, including earlier authored asset patches.
// Frames, timing and pivots continue to have a single source in campaign-scene.
export function preparationSourceSpecs(html, descriptor = 'spriteSpecs') {
  const declarations = ['LUC_ANH_IDLE_1080', 'AFK_THAY_MO_IDLE_DURATIONS', descriptor].map(name => {
    const start = html.indexOf('const ' + name + ' =');
    if (start < 0) throw new Error('Preparation idle descriptor: ' + name);
    // A comment in a descriptor may itself contain a semicolon.
    let end = start;
    while ((end = html.indexOf(';', end + 1)) >= 0) {
      const source = html.slice(start, end + 1);
      try { new vm.Script(source); return source; } catch (_) {}
    }
    throw new Error('Unterminated preparation idle descriptor: ' + name);
  });
  return vm.runInNewContext(declarations.join('\n') + '\n'+descriptor, {}, { timeout: 1000 });
}

export async function buildPreparationIdlePages(root, specs, { pageFrames = PREPARATION_PAGE_FRAMES, outputBase = 'assets/characters/preparation-idle-v1', includePoster = true } = {}) {
  const packs = {};
  for (const [id, spec] of Object.entries(specs)) {
    const { data, info } = await sharp(join(root, 'dist', spec.src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { cellW, cellH, frames } = spec;
    const outputDir = outputBase + '/' + id;
    mkdirSync(join(root, 'dist', outputDir), { recursive: true });
    const framePixels = index => {
      const x = index % spec.cols * (spec.strideW || cellW) + (spec.pad || 0);
      const y = Math.floor(index / spec.cols) * (spec.strideH || cellH) + (spec.pad || 0);
      if (x + cellW > info.width || y + cellH > info.height) throw new Error('Preparation idle source bounds: ' + id);
      const frame = Buffer.alloc(cellW * cellH * 4);
      for (let row = 0; row < cellH; row++) {
        const from = ((y + row) * info.width + x) * 4;
        data.copy(frame, row * cellW * 4, from, from + cellW * 4);
      }
      return frame;
    };
    const save = async (pixels, cols, count, name) => {
      const width = cols * cellW, height = Math.ceil(count / cols) * cellH;
      const digest = createHash('sha256').update(pixels).digest('hex').slice(0, 12);
      const src = `${outputDir}/${name}-${digest}.webp`;
      await sharp(pixels, { raw: { width, height, channels: 4 } }).webp({ lossless: true, effort: 2 }).toFile(join(root, 'dist', src));
      return { src, cols, rows: Math.ceil(count / cols), frames: count, atlasWidth: width, atlasHeight: height,
        strideW: cellW, strideH: cellH, pad: 0 };
    };
    const poster = includePoster ? await save(framePixels(0), 1, 1, 'idle') : null;
    const pages = [];
    for (let start = 0; start < frames; start += pageFrames) {
      const count = Math.min(pageFrames, frames - start), cols = Math.min(8, count);
      const width = cols * cellW, pixels = Buffer.alloc(width * Math.ceil(count / cols) * cellH * 4);
      for (let index = 0; index < count; index++) {
        const frame = framePixels(start + index), x = index % cols * cellW, y = Math.floor(index / cols) * cellH;
        for (let row = 0; row < cellH; row++) frame.copy(pixels, ((y + row) * width + x) * 4, row * cellW * 4, (row + 1) * cellW * 4);
      }
      pages.push(await save(pixels, cols, count, 'page-' + pages.length));
    }
    packs[id] = { pageFrames, poster, pages };
  }
  return packs;
}

export async function installCampaignPreparationIdle(root) {
  const file = join(root, 'dist', 'index.html');
  let html = readFileSync(file, 'utf8');
  const anchor = 'const preparationIdlePacks = {};';
  if (html.split(anchor).length !== 2) throw new Error('Preparation idle pack anchor');
  const packs = await buildPreparationIdlePages(root, preparationSourceSpecs(html));
  const attacks=preparationSourceSpecs(html,'farmAttackSpecs');
  const bach=JSON.parse(readFileSync(join(root,'assets/characters/bach-dien/runtime-meta.json'),'utf8'));
  const linh=JSON.parse(readFileSync(join(root,'assets/characters/linh-dong/runtime-meta.json'),'utf8'));
  attacks.bach_dien.registration=bach.clips.attack.registration;
  attacks.linh_dong.registration=registrationFromCrop(linh.packed.find(c=>c.file==='basic-atlas.webp').cropBox,linh.packed.find(c=>c.file==='idle-atlas.webp').cropBox,480,440);
  const attackPacks=await buildPreparationIdlePages(root,attacks,{pageFrames:8,outputBase:'assets/characters/campaign-atk-v1',includePoster:false});
  const runs=preparationSourceSpecs(html,'runSpecs');
  const runPacks=await buildPreparationIdlePages(root,runs,{pageFrames:8,outputBase:'assets/characters/campaign-run-v1',includePoster:false});
  const vfx=preparationSourceSpecs(html,'farmBasicVfxSpecs');
  const vfxPacks=await buildPreparationIdlePages(root,vfx,{pageFrames:8,outputBase:'assets/characters/campaign-vfx-v1',includePoster:false});
  html=html.replace(anchor, () => 'const preparationIdlePacks = ' + JSON.stringify(packs) + ';');
  for(const [name,value] of [['farmAttackPacks',attackPacks],['farmVfxPacks',vfxPacks],['farmRunPacks',runPacks]]){
    const token='const '+name+' = {};';if(html.split(token).length!==2)throw new Error('Campaign pack anchor '+name);
    html=html.replace(token,()=> 'const '+name+' = '+JSON.stringify(value)+';');
  }
  const descriptor='const farmAttackSpecs =';
  const start=html.indexOf(descriptor),end=html.indexOf(';',start);
  html=html.slice(0,start)+descriptor+' '+JSON.stringify(attacks)+';'+html.slice(end+1);
  writeFileSync(file,html);
  writeFileSync(join(root, 'dist', 'preparation-idle-packs.json'), JSON.stringify(packs));
  console.log('Preparation idle + campaign ATK/VFX: canonical RGBA pages, authored registration.');
  return packs;
}
