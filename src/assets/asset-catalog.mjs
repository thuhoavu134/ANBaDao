import linhDongMeta from '../../assets/characters/linh-dong/runtime-meta.json' with { type: 'json' };
import lucAnhRuntime from '../../assets/characters/luc-anh/canvas-sprite-runtime.json' with { type: 'json' };
import dinhLoiRuntime from '../../assets/characters/dinh-loi/canvas-sprite-runtime.json' with { type: 'json' };
import { atlasDecodedBytes } from './decoded-atlas-cache.mjs';

const HERO_ALIASES = Object.freeze({
  linh_dong: 'hero_splus_linh_dong',
  'linh-dong': 'hero_splus_linh_dong',
  hero_splus_linh_dong: 'hero_splus_linh_dong',
  luc_anh: 'luc_anh',
  'luc-anh': 'luc_anh',
  dinh_loi: 'dinh_loi',
  'dinh-loi': 'dinh_loi'
});

const CLIP_ALIASES = Object.freeze({
  idle: 'idle',
  run: 'run',
  hurt: 'hurt',
  hit: 'hurt',
  defeated: 'defeated',
  fall: 'defeated',
  attack: 'attack',
  atk: 'attack',
  basic: 'attack',
  normal: 'attack',
  skill: 'attack',
  skill1: 'attack',
  ultimate: 'ultimate',
  ult: 'ultimate',
  skill1vfx: 'skill1Vfx',
  skill1_vfx: 'skill1Vfx',
  atkvfx: 'skill1Vfx',
  vfx_atk: 'skill1Vfx',
  ultimatevfx: 'ultimateVfx',
  ultimate_vfx: 'ultimateVfx',
  ultvfx: 'ultimateVfx',
  vfx_ultimate: 'ultimateVfx'
});

const registry = new Map();
const aliasOwner = new Map();

export function normalizeHeroId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase().replace(/-/g, '_');
  if (HERO_ALIASES[raw] || HERO_ALIASES[raw.toLowerCase()]) {
    return HERO_ALIASES[raw] || HERO_ALIASES[raw.toLowerCase()];
  }
  if (HERO_ALIASES[lower]) return HERO_ALIASES[lower];
  if (raw.toLowerCase() === 'hero_splus_linh_dong') return 'hero_splus_linh_dong';
  return lower;
}

export function normalizeClipKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const compact = raw.replace(/[\s-]/g, '_');
  if (CLIP_ALIASES[compact]) return CLIP_ALIASES[compact];
  const lower = compact.toLowerCase();
  if (CLIP_ALIASES[lower]) return CLIP_ALIASES[lower];
  if (raw === 'skill1Vfx' || raw === 'ultimateVfx') return raw;
  return compact;
}

function clipErrors(key, clip) {
  const errors = [];
  if (!clip || typeof clip !== 'object') return [`${key}: missing clip`];
  const frames = Number(clip.frames);
  const cols = Number(clip.cols);
  const cellW = Number(clip.cellW ?? clip.w);
  const cellH = Number(clip.cellH ?? clip.h);
  const rows = Number(clip.rows > 0 ? clip.rows : Math.ceil(frames / cols));
  if (!(frames > 0)) errors.push(`${key}: frames must be > 0`);
  if (!(cols > 0)) errors.push(`${key}: cols must be > 0`);
  if (!Number.isInteger(cellW) || cellW <= 0) errors.push(`${key}: cellW must be a positive integer`);
  if (!Number.isInteger(cellH) || cellH <= 0) errors.push(`${key}: cellH must be a positive integer`);
  if (!(rows > 0) || rows * cols < frames) errors.push(`${key}: rows cannot hold frames`);
  const atlasWidth = Number(clip.atlasWidth ?? cols * cellW);
  const atlasHeight = Number(clip.atlasHeight ?? rows * cellH);
  if (atlasWidth !== cols * cellW) errors.push(`${key}: atlasWidth !== cols × cellW`);
  if (atlasHeight !== rows * cellH) errors.push(`${key}: atlasHeight !== rows × cellH`);
  if (!clip.file && !clip.src) errors.push(`${key}: missing file`);
  if (!clip.sha256) errors.push(`${key}: missing sha256`);
  if (clip.decodedBytes == null) errors.push(`${key}: missing decodedBytes`);
  if (!clip.pivot) errors.push(`${key}: missing pivot`);
  if (!(Number(clip.ms) > 0 || Number(clip.fps) > 0 || Number(clip.durationMs) > 0)) {
    errors.push(`${key}: missing timing`);
  }
  const expected = atlasDecodedBytes({ cellW, cellH, cols, rows, frames, atlasWidth, atlasHeight });
  if (Number(clip.decodedBytes) !== expected) errors.push(`${key}: decodedBytes ${clip.decodedBytes} != ${expected}`);
  if (clip.trimMode && clip.trimMode !== 'stable-union' && clip.frameRects) {
    errors.push(`${key}: per-frame crop is not supported`);
  }
  return errors;
}

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return { ok: false, errors: ['missing manifest'] };
  if (manifest.schema !== 'canvas-sprite-runtime/v2' && manifest.schema !== 'hon-viet-linh-dong-atlas/v1') {
    errors.push('unsupported schema');
  }
  if (!manifest.heroId) errors.push('missing heroId');
  const clips = manifest.clips || {};
  for (const [key, clip] of Object.entries(clips)) errors.push(...clipErrors(key, clip));
  return { ok: errors.length === 0, errors };
}

function freezeClip(clip) {
  return Object.freeze({
    ...clip,
    pivot: Object.freeze({ ...clip.pivot }),
    logicalSize: Object.freeze({ ...clip.logicalSize })
  });
}

function freezeManifest(manifest) {
  const clips = Object.fromEntries(
    Object.entries(manifest.clips).map(([key, clip]) => [key, freezeClip(clip)])
  );
  return Object.freeze({
    ...manifest,
    aliases: Object.freeze([...(manifest.aliases || [])]),
    quality: Object.freeze({ ...(manifest.quality || { desktop: 'native', mobile: 'native' }) }),
    clips: Object.freeze(clips)
  });
}

export function registerHeroManifest(manifest) {
  const report = validateManifest(manifest);
  if (!report.ok) throw new Error(report.errors.join('; '));
  const heroId = manifest.heroId;
  const aliases = [heroId, ...(manifest.aliases || [])];
  for (const alias of aliases) {
    const owner = aliasOwner.get(String(alias));
    if (owner && owner !== heroId) throw new Error(`alias ${alias} collides with ${owner}`);
  }
  const frozen = freezeManifest(manifest);
  registry.set(heroId, frozen);
  for (const alias of aliases) aliasOwner.set(String(alias), heroId);
  return frozen;
}

export function getHeroManifest(heroId, quality = 'native') {
  const id = normalizeHeroId(heroId);
  const manifest = registry.get(id) || registry.get(heroId) || null;
  if (!manifest) return null;
  if (quality && quality !== 'native' && manifest.quality && !manifest.quality[quality]) {
    return Object.freeze({ ...manifest, qualityFallback: 'native', requestedQuality: quality });
  }
  return manifest;
}

export function getClip(heroId, clipKey, quality = 'native') {
  const manifest = getHeroManifest(heroId, quality);
  if (!manifest) return null;
  const key = normalizeClipKey(clipKey);
  return manifest.clips[key] || manifest.clips[clipKey] || null;
}

function packedFor(meta, file) {
  return (meta.packed || []).find(entry => entry.file === file) || {};
}

function hydrateLinhDong(meta) {
  const base = 'assets/characters/linh-dong/';
  const remap = { hit: 'hurt', fall: 'defeated', skill1: 'attack' };
  const clips = {};
  for (const [rawKey, raw] of Object.entries(meta.clips || {})) {
    const key = remap[rawKey] || rawKey;
    if (clips[key]) continue;
    const packed = packedFor(meta, raw.file);
    const cellW = Number(raw.cellW ?? raw.w ?? packed.cellW);
    const cellH = Number(raw.cellH ?? raw.h ?? packed.cellH);
    const cols = Number(raw.cols ?? packed.cols);
    const frames = Number(raw.frames ?? packed.frames);
    const rows = Number(raw.rows ?? packed.rows ?? Math.ceil(frames / cols));
    const atlasWidth = Number(packed.atlasW ?? cols * cellW);
    const atlasHeight = Number(packed.atlasH ?? rows * cellH);
    const kind = /vfx/i.test(raw.file) || key.endsWith('Vfx') ? 'vfx' : 'character';
    const ms = Number(raw.ms);
    clips[key] = {
      file: raw.file,
      src: base + raw.file,
      kind,
      frames,
      cols,
      rows,
      cellW,
      cellH,
      w: cellW,
      h: cellH,
      fps: ms > 0 ? Math.round(1000 / ms) : 24,
      ms,
      durationMs: Number(raw.durationMs),
      loop: !!raw.loop,
      pivot: { x: Math.round(cellW / 2), y: cellH },
      logicalSize: { w: cellW, h: cellH },
      trimMode: 'stable-union',
      blendMode: kind === 'vfx' ? 'source-over' : 'source-over',
      atlasWidth,
      atlasHeight,
      decodedBytes: atlasWidth * atlasHeight * 4,
      compressedBytes: Number(packed.bytes) || undefined,
      sha256: packed.sha256
    };
  }
  return {
    schema: 'canvas-sprite-runtime/v2',
    heroId: 'hero_splus_linh_dong',
    aliases: ['linh_dong', 'linh-dong'],
    quality: { desktop: 'native', mobile: 'native' },
    sourceSchema: meta.schema,
    clips
  };
}

registerHeroManifest(hydrateLinhDong(linhDongMeta));
registerHeroManifest(lucAnhRuntime);
registerHeroManifest(dinhLoiRuntime);
