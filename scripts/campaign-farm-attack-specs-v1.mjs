// Owner 2026-10-25: 'màn afk e cho nhân vật diễn hoạt đánh quái đi chứ hiện tại các nhân vật trong đó ... các tướng ko
// đánh quái'. In the AFK/preparation farm only a handful of heroes had a farm attack spec, so everybody else stood still
// and never swung: sampleCampaignFarm leaves approachMs 0 and draws no cast when `farmAttackSpecs[hero.id]` is missing.
//
// This build step fills that table for every authored hero from the atlas they already ship for battle (runtime-meta
// basic clip), plus the basic VFX page when there is one, so the whole squad runs in and attacks.
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

export function installFarmAttackSpecs(root) {
  const chars = join(root, 'assets', 'characters');
  const attacks = {}, vfx = {};
  for (const dir of readdirSync(chars, {withFileTypes: true})) {
    if (!dir.isDirectory()) continue;
    const metaPath = join(chars, dir.name, 'runtime-meta.json');
    if (!existsSync(metaPath)) continue;
    let meta;
    try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); } catch { continue; }
    const key = dir.name.replace(/-/g, '_');
    const basic = meta.clips?.basic;
    if (basic?.pages?.length) {
      const page = basic.pages[0];
      const frames = basic.frames ?? page.frames ?? 1;
      attacks[key] = {
        src: `assets/characters/${dir.name}/${page.file}`,
        frames,
        cols: page.cols || basic.cols || 8,
        cellW: basic.cellW,
        cellH: basic.cellH,
        ms: Math.max(16, (basic.durationMs || frames * 60) / Math.max(1, frames)),
        pivot: basic.pivot ?? Math.round(basic.cellW / 2),
        foot: basic.foot ?? basic.cellH,
        body: basic.body ?? basic.cellH,
        moveToTarget: true,
      };
    }
    const provPath = join(root, 'assets', 'vfx', dir.name, 'provenance.json');
    if (existsSync(provPath)) {
      try {
        const prov = JSON.parse(readFileSync(provPath, 'utf8'));
        const clip = prov.clips?.['vfx-basic'];
        if (clip?.file) {
          vfx[key] = {
            src: `assets/vfx/${dir.name}/${clip.file}`,
            frames: clip.frames ?? 1,
            cols: clip.cols ?? 8,
            cellW: clip.cellW, cellH: clip.cellH,
            ms: Math.max(16, (clip.durationMs || (clip.frames ?? 1) * 60) / Math.max(1, clip.frames ?? 1)),
            pivot: Math.round((clip.cellW || 1) / 2),
            foot: Math.round((clip.cellH || 1) / 2),
            body: clip.cellH || 1,
          };
        }
      } catch { /* provenance is optional */ }
    }
  }

  const file = join(root, 'dist', 'index.html');
  const html = readFileSync(file, 'utf8');
  const anchor = 'function sampleCampaignFarm(';
  if (!html.includes(anchor)) throw new Error('FARM_SPECS: anchor not found');
  if (html.includes('/* farm-attack-specs */')) return html;      // idempotent
  const inject = '/* farm-attack-specs */Object.assign(farmAttackSpecs,' + JSON.stringify(attacks) + ');\n'
    + 'Object.assign(farmBasicVfxSpecs,' + JSON.stringify(vfx) + ');\n';
  writeFileSync(file, html.replace(anchor, inject + anchor));
  console.log(`AFK farm: ${Object.keys(attacks).length} hero attacks, ${Object.keys(vfx).length} VFX pages`);
  return null;
}
