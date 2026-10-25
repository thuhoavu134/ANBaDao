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

  // Hero ids that differ from their asset folder (DATA.heroes key vs assets/characters/<slug>).
  const ALIASES = {bach_y_van_phong: 'van_phong', ong_pho: 'ong_hang_pho'};
  for (const [from, to] of Object.entries(ALIASES)) {
    if (attacks[from] && !attacks[to]) attacks[to] = attacks[from];
    if (vfx[from] && !vfx[to]) vfx[to] = vfx[from];
  }
  const file = join(root, 'dist', 'index.html');
  const html = readFileSync(file, 'utf8');
  const anchor = 'function sampleCampaignFarm(';
  if (!html.includes(anchor)) throw new Error('FARM_SPECS: anchor not found');
  if (html.includes('/* farm-attack-specs */')) return html;      // idempotent
  const inject = '/* farm-attack-specs */Object.assign(farmAttackSpecs,' + JSON.stringify(attacks) + ');\n'
    + 'Object.assign(farmBasicVfxSpecs,' + JSON.stringify(vfx) + ');\n';
  let out = html.replace(anchor, inject + anchor);
  // campaign-resource-lifecycle-v1 removed the attack prefetch (it used untracked Images), so an atlas was only
  // requested once its hero had started swinging and then queued behind six heroes' idle pages - only the first
  // hero ever got to attack. Request every squad member's attack page through the budgeted cache once the march
  // is over (spawn phase, ~1.2 s before the first swing): during the march the run pages need that room.
  const pre = '    // Attack atlases are requested with their spec only by the attacking actor.';
  if (out.split(pre).length !== 2) throw new Error('FARM_SPECS: prefetch anchor not found');
  out = out.replace(pre, pre + '\n    if(farm.phase!==\'march\')for(const actor of farm.actors){const k=campaignActorArtId(actor.id),a=farmAttackSpecs[k];'
    + 'if(a){const first=campaignPagedSprite(a,farmAttackPacks[k],0).spec;imageForScene(first.src,first);}}');
  // Six idle pages + run pages + six attack pages do not fit the old scene budget (64 MiB on phones, 96 MiB on
  // desktop): the later heroes' attacks were refused every round. 128 MiB on both - still below the 144 MiB the
  // battle already runs at on phones, and the scene releases its pages when a battle opens.
  const budget = 'maxDecodedBytes: __HV_CAMPAIGN_LOW_MEMORY ? 64 * 1024 * 1024 : 96 * 1024 * 1024,';
  if (out.split(budget).length !== 2) throw new Error('FARM_SPECS: campaign budget anchor not found');
  out = out.replace(budget, 'maxDecodedBytes: 128 * 1024 * 1024,');
  writeFileSync(file, out);
  console.log(`AFK farm: ${Object.keys(attacks).length} hero attacks, ${Object.keys(vfx).length} VFX pages`);
  return null;
}
