import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  LINH_DONG_ASSET_BASE, LINH_DONG_AUDIO_BASE, LINH_DONG_CHAR, LINH_DONG_VFX,
  LINH_DONG_CLIPS, LINH_DONG_STILLS, linhDongMeta
} from '../src/domain/character/linh-dong.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function pythonExtract(source, destDir) {
  const script = `
import sys
from pathlib import Path
from PIL import Image
src, dest = Path(sys.argv[1]), Path(sys.argv[2])
dest.mkdir(parents=True, exist_ok=True)
im = Image.open(src)
n = getattr(im, 'n_frames', 1)
for i in range(n):
    im.seek(i)
    frame = im.convert('RGBA')
    if frame.mode != 'RGBA':
        raise SystemExit('expected RGBA')
    frame.save(dest / f'{i+1:04d}.png', 'PNG')
print(n)
`;
  return new Promise((ok, err) => {
    const child = spawn('python3', ['-c', script, source, destDir], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', fail = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { fail += d; });
    child.on('close', code => {
      if (code !== 0) err(new Error(`extract failed ${source}: ${fail || out}`));
      else ok(Number(out.trim()));
    });
  });
}

async function placeCharFrame(input, srcW, srcH) {
  const { scale, cellW, cellH } = LINH_DONG_CHAR;
  const rw = Math.round(srcW * scale);
  const rh = Math.round(srcH * scale);
  const left = Math.round((cellW - rw) / 2);
  const top = cellH - rh;
  const resized = await sharp(input)
    .ensureAlpha()
    .resize(rw, rh, { kernel: 'lanczos3', fit: 'fill' })
    .png()
    .toBuffer();
  return sharp({ create: { width: cellW, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left, top }])
    .raw()
    .toBuffer();
}

async function placeVfxFrame(input) {
  const { cellW, cellH } = LINH_DONG_VFX;
  return sharp(input)
    .ensureAlpha()
    .resize(cellW, cellH, { kernel: 'lanczos3', fit: 'fill' })
    .raw()
    .toBuffer();
}

async function packClip(clip, sourceRoot, outDir, workRoot) {
  const geom = clip.kind === 'vfx' ? LINH_DONG_VFX : LINH_DONG_CHAR;
  const cols = geom.cols;
  const rows = Math.ceil(clip.frames / cols);
  const atlasW = cols * geom.cellW;
  const atlasH = rows * geom.cellH;
  const extractDir = join(workRoot, clip.file.replace(/-atlas\.webp$/, ''));
  const count = await pythonExtract(join(sourceRoot, clip.source), extractDir);
  if (count !== clip.frames) throw new Error(`${clip.source}: expected ${clip.frames} frames, got ${count}`);
  const rgba = Buffer.alloc(atlasW * atlasH * 4);
  for (let i = 0; i < clip.frames; i++) {
    const png = join(extractDir, `${String(i + 1).padStart(4, '0')}.png`);
    const pixels = clip.kind === 'vfx'
      ? await placeVfxFrame(png)
      : await placeCharFrame(png, clip.sourceW, clip.sourceH);
    const x = (i % cols) * geom.cellW;
    const y = Math.floor(i / cols) * geom.cellH;
    for (let row = 0; row < geom.cellH; row++) {
      pixels.copy(rgba, ((y + row) * atlasW + x) * 4, row * geom.cellW * 4, (row + 1) * geom.cellW * 4);
    }
  }
  const encoded = await sharp(rgba, { raw: { width: atlasW, height: atlasH, channels: 4 } })
    .webp({ lossless: true, effort: 4 })
    .toBuffer();
  const out = join(outDir, clip.file);
  await writeFile(out, encoded);
  return {
    file: clip.file,
    frames: clip.frames,
    cols,
    rows,
    cellW: geom.cellW,
    cellH: geom.cellH,
    atlasW,
    atlasH,
    bytes: encoded.length,
    sha256: sha256(encoded)
  };
}

function framesJson(id, atlasFile, clip, geom, extra = {}) {
  return {
    schema: 'hon-viet-vfx-atlas/v1',
    id,
    atlas: `../../${atlasFile}`,
    layout: {
      type: 'grid',
      columns: geom.cols,
      rows: Math.ceil(clip.frames / geom.cols),
      frameCount: clip.frames,
      cellWidth: geom.cellW,
      cellHeight: geom.cellH
    },
    timeline: { durationMs: clip.durationMs, loop: !!clip.loop, playAllFrames: true },
    ...extra
  };
}

async function writeSkillKit(outDir) {
  const attack = LINH_DONG_CLIPS.attack;
  const skillVfx = LINH_DONG_CLIPS.skill1Vfx;
  const ult = LINH_DONG_CLIPS.ultimate;
  const ultVfx = LINH_DONG_CLIPS.ultimateVfx;
  const kits = [
    {
      folder: 'basic',
      skill: {
        schema: 'hon-viet-skill/v1',
        id: 'linh-dong.basic',
        heroId: 'linh-dong',
        kind: 'basic',
        name: 'Lạc Hồn Tiếng Chuông',
        movement: { moveType: 0, stationary: true },
        targeting: { type: 'singleEnemy' },
        anchors: { castAnchor: { x: 0, y: -96 }, hitAnchor: { x: 0, y: -80 } },
        timing: { castDelayMs: 420, projectileTravelMs: 900, impactDurationMs: 1500, vfxDurationMs: 4000 },
        parts: { cast: 'cast/frames.json', vfx: 'vfx/frames.json' },
        audio: { cast: 'assets/audio/sfx/linh-dong/atk.wav', impact: null, profile: 'linh-dong-atk-v1' },
        runtime: { speedModes: [1, 2, 3], preserveAllFrames: true, lockCharacterScale: true }
      },
      files: {
        'cast/frames.json': framesJson('linh-dong.basic.cast', 'basic-atlas.webp', attack, LINH_DONG_CHAR, {
          timeline: { frameDurationMs: attack.ms, loop: false },
          anchor: { type: 'footAnchor', offsetX: 0, offsetY: 0 },
          display: { width: LINH_DONG_CHAR.cellW, height: LINH_DONG_CHAR.cellH, baseline: 48, scale: 1, layer: 'character', blendMode: 'normal' }
        }),
        'vfx/frames.json': framesJson('linh-dong.basic.vfx', 'skill1_vfx-atlas.webp', skillVfx, LINH_DONG_VFX, {
          motion: { type: 'projectile', startAnchor: 'castAnchor', targetAnchor: 'hitAnchor', interpolation: 'linear' },
          display: { width: 320, height: 180, baseline: 90, scale: 1, layer: 'front', blendMode: 'source-over', alpha: 0.96 }
        })
      }
    },
    {
      folder: 'skill1',
      skill: {
        schema: 'hon-viet-skill/v1',
        id: 'linh-dong.skill1',
        heroId: 'linh-dong',
        kind: 'skill1',
        name: 'Nhiễu Loạn Âm Ty',
        movement: { moveType: 0, stationary: true },
        targeting: { type: 'singleEnemy' },
        anchors: { castAnchor: { x: 0, y: -96 }, hitAnchor: { x: 0, y: -80 } },
        timing: { castDelayMs: 420, vfxDurationMs: 4000 },
        parts: { cast: 'cast/frames.json', vfx: 'vfx/frames.json' },
        audio: { cast: 'assets/audio/sfx/linh-dong/atk.wav', impact: null, profile: 'linh-dong-atk-v1' },
        runtime: { speedModes: [1, 2, 3], preserveAllFrames: true, lockCharacterScale: true }
      },
      files: {
        'cast/frames.json': framesJson('linh-dong.skill1.cast', 'basic-atlas.webp', attack, LINH_DONG_CHAR, {
          timeline: { frameDurationMs: attack.ms, loop: false },
          anchor: { type: 'footAnchor', offsetX: 0, offsetY: 0 },
          display: { width: LINH_DONG_CHAR.cellW, height: LINH_DONG_CHAR.cellH, baseline: 48, scale: 1, layer: 'character', blendMode: 'normal' }
        }),
        'vfx/frames.json': framesJson('linh-dong.skill1.vfx', 'skill1_vfx-atlas.webp', skillVfx, LINH_DONG_VFX, {
          spawn: { type: 'singleTarget', team: 'enemy', anchor: 'hitAnchor' },
          display: { width: 360, height: 202, baseline: 101, scale: 1, layer: 'front', blendMode: 'source-over', alpha: 0.94 }
        })
      }
    },
    {
      folder: 'ultimate',
      skill: {
        schema: 'hon-viet-skill/v1',
        id: 'linh-dong.ultimate',
        heroId: 'linh-dong',
        kind: 'ultimate',
        name: 'Bách Quỷ Dạ Hành',
        movement: { moveType: 0, stationary: true },
        targeting: { type: 'allEnemies', maxTargets: 6 },
        timing: { voiceLeadMs: 200, vfxDelayMs: 400, impactHoldMs: 1600, vfxDurationMs: 4000 },
        parts: { cast: 'cast/frames.json', vfx: 'vfx/frames.json' },
        audio: { cast: 'assets/audio/sfx/linh-dong/ult.wav', impact: null, profile: 'linh-dong-ult-v1' },
        runtime: { speedModes: [1, 2, 3], preserveAllFrames: true, lockCharacterScale: true }
      },
      files: {
        'cast/frames.json': framesJson('linh-dong.ultimate.cast', 'ultimate-atlas.webp', ult, LINH_DONG_CHAR, {
          timeline: { frameDurationMs: ult.ms, loop: false },
          anchor: { type: 'footAnchor', offsetX: 0, offsetY: 0 },
          display: { width: LINH_DONG_CHAR.cellW, height: LINH_DONG_CHAR.cellH, baseline: 48, scale: 1, layer: 'character', blendMode: 'normal' }
        }),
        'vfx/frames.json': framesJson('linh-dong.ultimate.vfx', 'ultimate_vfx-atlas.webp', ultVfx, LINH_DONG_VFX, {
          spawn: { type: 'enemyGroup', coverage: 'allEnemies', maxTargets: 6 },
          display: { width: 720, height: 405, baseline: 202, scale: 1, layer: 'front', blendMode: 'source-over', alpha: 0.96 }
        })
      }
    }
  ];
  for (const kit of kits) {
    const skillPath = join(outDir, kit.folder, 'skill.json');
    await mkdir(dirname(skillPath), { recursive: true });
    await writeFile(skillPath, `${JSON.stringify(kit.skill, null, 2)}\n`);
    for (const [rel, json] of Object.entries(kit.files)) {
      const p = join(outDir, kit.folder, rel);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, `${JSON.stringify(json, null, 2)}\n`);
    }
  }
}

export async function packLinhDong(sourceRoot, outDir = join(root, LINH_DONG_ASSET_BASE)) {
  await mkdir(outDir, { recursive: true });
  const workRoot = join(root, 'tmp', 'linh-dong-pack');
  const packed = [];
  const seen = new Set();
  for (const clip of Object.values(LINH_DONG_CLIPS)) {
    if (seen.has(clip.file)) continue;
    seen.add(clip.file);
    packed.push(await packClip(clip, sourceRoot, outDir, workRoot));
    console.log(`packed ${clip.file}`);
  }
  const portrait = join(sourceRoot, LINH_DONG_STILLS.portrait.source);
  const square = join(sourceRoot, LINH_DONG_STILLS.square.source);
  await sharp(portrait).webp({ lossless: true, effort: 4 }).toFile(join(outDir, LINH_DONG_STILLS.portrait.file));
  await sharp(portrait).resize(720, 670, { fit: 'inside' }).webp({ lossless: true, effort: 4 }).toFile(join(outDir, LINH_DONG_STILLS.master.file));
  await sharp(square).png().toFile(join(outDir, LINH_DONG_STILLS.square.file));
  await sharp(square).resize(512, 512).webp({ lossless: true, effort: 4 }).toFile(join(outDir, LINH_DONG_STILLS.card.file));
  const audioOut = join(root, LINH_DONG_AUDIO_BASE);
  await mkdir(audioOut, { recursive: true });
  await copyFile(join(sourceRoot, 'vfx_sfx_atk/ld_atk_sfx.wav'), join(audioOut, 'atk.wav'));
  await copyFile(join(sourceRoot, 'vfx_sfx_atk/ld_atk_sfx.ogg'), join(audioOut, 'atk.ogg'));
  await copyFile(join(sourceRoot, 'vfx_sfx_ult/ld_ult_sfx.wav'), join(audioOut, 'ult.wav'));
  await copyFile(join(sourceRoot, 'vfx_sfx_ult/ld_ult_sfx.ogg'), join(audioOut, 'ult.ogg'));
  await writeSkillKit(outDir);
  const report = {
    schema: 'hon-viet-linh-dong-atlas/v1',
    source: 'Drive pack 14/09/2026 blender compositor keying RGBA',
    encoding: 'webp-lossless-rgba',
    char: LINH_DONG_CHAR,
    vfx: LINH_DONG_VFX,
    clips: Object.fromEntries(Object.keys(LINH_DONG_CLIPS).map(k => [k, linhDongMeta(k)])),
    packed,
    uniformScale: true,
    perFrameCrop: false,
    blackKeyForbidden: true
  };
  await writeFile(join(outDir, 'runtime-meta.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(outDir, 'ASSET.md'), `# Linh Đồng — authored combat kit

Nguồn: Google Drive pack 14/09/2026 (Blender Compositor Keying RGBA, isolated character vs VFX).
Pack: \`node scripts/pack-linh-dong-rgba.mjs <extracted-pack-dir>\`

- Character: scale ${LINH_DONG_CHAR.scale} vào cell ${LINH_DONG_CHAR.cellW}×${LINH_DONG_CHAR.cellH}, chân đáy-giữa. Không crop từng frame.
- VFX: ${LINH_DONG_VFX.cellW}×${LINH_DONG_VFX.cellH} lưới 10 cột.
- ATK char + VFX/SFX dùng cho đánh thường và kỹ năng 1. ULT char + VFX/SFX cho tuyệt kỹ.
- Encode: WebP lossless RGBA. Không key màu đen.
`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const source = process.argv[2] || '/tmp/linh-dong';
  const result = await packLinhDong(source);
  console.log(JSON.stringify({ files: result.packed.map(p => ({ file: p.file, bytes: p.bytes, frames: p.frames })) }, null, 2));
}
