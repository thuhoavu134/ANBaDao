// Bạch Diện's approved battle stature, before viewport and home-slot depth.
// Cell dimensions, weapons and the current pose's alpha bounds are not stature.
export const BATTLE_HERO_BODY_HEIGHT = 310;
// Shared vector fallback: skull top -122, shoe sole +0.5. Hair, hats and
// weapons may extend beyond this body reference without changing its scale.
export const PROCEDURAL_HERO_BODY = Object.freeze({ height: 122.5, footOffsetY: 0.5 });
// The pending-art S+ renderer is an unscaled UI card, not a character sprite.
// Its HUD follows the actual card rectangle until authored art is registered.
const PENDING_HERO_CARD = Object.freeze({ referenceBodyHeight: 126, footOffsetY: -4 });

function presentationId(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function createHeroPresentationRegistry(manifests) {
  const profiles = Object.create(null), aliases = Object.create(null);
  const scales = Object.assign(Object.create(null), { default: 1 });
  const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  for (const raw of manifests) {
    const id = presentationId(raw.heroId), label = id || '(missing heroId)';
    const fail = message => { throw new Error(`Hero presentation ${label}: ${message}`); };
    if (raw.schema !== 'battle-hero-presentation/v1') fail('unsupported schema');
    if (!/^[a-z][a-z0-9_-]*$/.test(id) || ['default', '__proto__', 'constructor', 'prototype'].includes(id)) fail('invalid heroId');
    if (Object.hasOwn(profiles, id)) fail('duplicate heroId');
    if (!positive(raw.referenceBodyHeight)) fail('reference body height must be a finite positive number');
    if (!finite(raw.footOffsetY)) fail('footOffsetY must be finite in registered local coordinates');
    if (!['source-body', 'pre-registered'].includes(raw.registration)) fail('unsupported registration');
    if (!Array.isArray(raw.aliases)) fail('aliases must be an array');
    if (!raw.evidence || typeof raw.evidence !== 'string') fail('measurement evidence is required');
    const clips = raw.clips || {}, vfx = raw.vfxClips || [];
    if (!Array.isArray(vfx)) fail('vfxClips must be an array');
    for (const [key, clip] of Object.entries(clips)) {
      if (vfx.includes(key)) fail(`${key} cannot be both character and VFX`);
      if (raw.registration === 'source-body') {
        if (!positive(clip.bodyHeight)) fail(`${key} body height must be finite and positive`);
        if (!finite(clip.footX) || !finite(clip.footY)) fail(`${key} requires fixed source foot coordinates`);
      }
    }
    for (const state of ['idle', 'attack', 'ultimate']) {
      const keys = raw.states?.[state];
      if (!Array.isArray(keys) || keys.length === 0) fail(`${state} must declare its character clips`);
      for (const key of keys) if (!Object.hasOwn(clips, key)) fail(`${state} clip ${key} is missing character registration`);
    }
    if (raw.compact && (!positive(raw.compact.scaleX) || !finite(raw.compact.offsetX))) fail('invalid compact presentation');
    const profile = Object.freeze({ ...raw, heroId: id, clips: Object.freeze({ ...clips }) });
    profiles[id] = profile;
    scales[id] = BATTLE_HERO_BODY_HEIGHT / profile.referenceBodyHeight;
    for (const value of [id, ...raw.aliases]) {
      const alias = presentationId(value);
      if (!/^[a-z][a-z0-9_-]*$/.test(alias)) fail(`invalid alias ${value}`);
      if (Object.hasOwn(aliases, alias) && aliases[alias] !== id) fail(`duplicate alias ${alias}`);
      aliases[alias] = id;
    }
  }
  return Object.freeze({ profiles: Object.freeze(profiles), aliases: Object.freeze(aliases), scales: Object.freeze(scales) });
}

export function heroPresentationFor(registry, unitOrId) {
  const ids = typeof unitOrId === 'object' && unitOrId
    ? [unitOrId.sourceId, unitOrId.sourceHeroId, unitOrId.id] : [unitOrId];
  for (const value of ids) {
    const alias = String(value ?? '').trim().toLowerCase();
    if (Object.hasOwn(registry.aliases, alias)) return registry.profiles[registry.aliases[alias]];
  }
  return null;
}

export function heroSpriteRect(profile, key, clip) {
  if (profile?.registration !== 'source-body' || !Object.hasOwn(profile.clips, key)) return null;
  if (!clip || !Number.isFinite(clip.cellW) || clip.cellW <= 0 || !Number.isFinite(clip.cellH) || clip.cellH <= 0) return null;
  const body = profile.clips[key];
  const scale = profile.referenceBodyHeight / body.bodyHeight;
  return {
    x: -body.footX * scale,
    y: profile.footOffsetY - body.footY * scale,
    width: clip.cellW * scale, height: clip.cellH * scale, scale
  };
}

export function paintHeroSprite(ctx, image, clip, frame, profile, key, x = 0, y = 0) {
  if (!image || image.complete === false || image.naturalWidth === 0) return false;
  if (!clip || !Number.isInteger(clip.cols) || clip.cols <= 0 || !Number.isInteger(clip.frames) || clip.frames <= 0 || clip.kind === 'vfx') return false;
  const rect = heroSpriteRect(profile, key, clip);
  if (!rect) return false; // VFX must use its independent world rectangle.
  const f = Math.max(0, Math.min((clip.frames || 1) - 1, Math.floor(Number(frame) || 0)));
  const atlasScale = Number(image.__hvAtlasScale) > 0 ? Number(image.__hvAtlasScale) : 1;
  ctx.save();
  ctx.globalCompositeOperation = clip.blendMode || 'source-over';
  ctx.drawImage(image,
    (f % clip.cols) * clip.cellW * atlasScale,
    Math.floor(f / clip.cols) * clip.cellH * atlasScale,
    clip.cellW * atlasScale, clip.cellH * atlasScale,
    x + rect.x, y + rect.y, rect.width, rect.height);
  ctx.restore();
  return true;
}

export function projectHeroBody(profile, anchor, scale) {
  const nativeHeight = profile?.referenceBodyHeight ?? BATTLE_HERO_BODY_HEIGHT;
  const footOffset = profile?.footOffsetY ?? 0;
  const height = nativeHeight * scale;
  const footY = (Number(anchor?.y) || 0) + footOffset * scale;
  return { height, footY, topY: footY - height, centerY: footY - height / 2, centerX: Number(anchor?.x) || 0 };
}

export function projectBattleHeroBody(registry, unit, scale, offsetX = 0) {
  const profile = heroPresentationFor(registry, unit);
  if (!profile && unit?.visualSource === 'splus-pending-art') return projectHeroBody(PENDING_HERO_CARD, unit, 1);
  const anchor = { ...unit, x: (Number(unit?.x) || 0) + offsetX };
  return projectHeroBody(profile, anchor, scale);
}

// Serialize these exact pure owners into the existing non-module battle closure.
// Tests execute that bundle as well as the ESM functions to catch drift.
export function heroPresentationRuntimeSource(registry) {
  return `const BATTLE_HERO_BODY_HEIGHT=${BATTLE_HERO_BODY_HEIGHT};\n` +
    `const PROCEDURAL_HERO_BODY=${JSON.stringify(PROCEDURAL_HERO_BODY)};\n` +
    `const PENDING_HERO_CARD=${JSON.stringify(PENDING_HERO_CARD)};\n` +
    `const HERO_PRESENTATIONS=${JSON.stringify(registry)};\n` +
    [heroPresentationFor, heroSpriteRect, paintHeroSprite, projectHeroBody, projectBattleHeroBody].map(fn => fn.toString()).join('\n');
}
