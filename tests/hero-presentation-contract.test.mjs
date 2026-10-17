import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BATTLE_HERO_BODY_HEIGHT, createHeroPresentationRegistry, heroPresentationFor,
  heroSpriteRect, paintHeroSprite, projectHeroBody
} from '../src/render/hero-presentation.mjs';
import { loadHeroPresentations } from '../scripts/hero-presentation-registry.mjs';

function futureHero() {
  return {
    schema: 'battle-hero-presentation/v1', heroId: 'future_hero', aliases: ['future-hero'],
    registration: 'source-body', referenceBodyHeight: 500, footOffsetY: -8,
    clips: {
      idle: { bodyHeight: 800, footX: 220, footY: 840 },
      attack: { bodyHeight: 400, footX: 130, footY: 420 },
      ultimate: { bodyHeight: 400, footX: 600, footY: 420 }
    },
    states: { idle: ['idle'], attack: ['attack'], ultimate: ['ultimate'] },
    vfxClips: ['impact'], evidence: 'Synthetic fixed source-camera measurements.'
  };
}

test('a future hero gets the standard from metadata without an ID table change', () => {
  const registry = createHeroPresentationRegistry([futureHero()]);
  for (const identity of ['future_hero', 'FUTURE-HERO', { sourceId: 'arena-7', sourceHeroId: 'future-hero' }]) {
    const profile = heroPresentationFor(registry, identity);
    assert.equal(profile.heroId, 'future_hero');
    assert.equal(profile.referenceBodyHeight * registry.scales.future_hero, BATTLE_HERO_BODY_HEIGHT);
  }
  assert.equal(heroPresentationFor(registry, 'unregistered'), null);
});

test('padding, weapon width and source resolution do not change registered stature or feet', () => {
  const p = futureHero();
  for (const [key, cellW, cellH] of [['idle', 440, 900], ['attack', 640, 450], ['ultimate', 1400, 800]]) {
    const r = heroSpriteRect(p, key, { cellW, cellH });
    const body = p.clips[key];
    assert.equal(body.bodyHeight * r.scale, 500);
    assert.equal(r.y + body.footY * r.scale, -8);
    assert.equal(r.x + body.footX * r.scale, 0);
    assert.equal(r.width / r.height, cellW / cellH);
  }
  assert.equal(heroSpriteRect(p, 'impact', { cellW: 900, cellH: 900 }), null, 'VFX has no body registration');
});

test('decoded half-atlases only change source sampling; all animation frames retain one projection', () => {
  const draws = [], ctx = { save() {}, restore() {}, drawImage(...a) { draws.push(a); } };
  const clip = { cellW: 440, cellH: 900, cols: 2, frames: 4 };
  for (const atlasScale of [1, .5]) {
    for (const frame of [0, 1, 2, 3]) {
      paintHeroSprite(ctx, { complete: true, naturalWidth: 880 * atlasScale, __hvAtlasScale: atlasScale }, clip, frame, futureHero(), 'idle');
    }
  }
  assert.deepEqual(draws[0].slice(-4), draws[7].slice(-4));
  assert.deepEqual(draws[3].slice(1, 5), [440, 900, 440, 900]);
  assert.deepEqual(draws[7].slice(1, 5), [220, 450, 220, 450]);
  assert.equal(paintHeroSprite(ctx, { complete: false }, clip, 0, futureHero(), 'idle'), false);
  for (const invalid of [null,{}, {...clip,cellW:0}, {...clip,cols:NaN}]) assert.equal(paintHeroSprite(ctx,{complete:true,naturalWidth:880},invalid,0,futureHero(),'idle'),false);
  assert.equal(draws.length,8,'invalid geometry never counts as drawn');
});

test('body center and top include the registered foot offset used by the actor', () => {
  const result = projectHeroBody({ referenceBodyHeight: 395, footOffsetY: 39 }, { x: 535, y: 520 }, .5);
  assert.equal(result.height, 197.5);
  assert.equal(result.footY, 539.5);
  assert.equal(result.centerY, 440.75);
  assert.equal(result.topY, 342);
});

test('invalid measurements, duplicate aliases and absent action registration fail before runtime', () => {
  for (const badHeight of [0, -1, NaN, Infinity, '500']) {
    assert.throws(() => createHeroPresentationRegistry([{ ...futureHero(), referenceBodyHeight: badHeight }]), /body height/i);
  }
  assert.throws(() => createHeroPresentationRegistry([futureHero(), { ...futureHero(), heroId: 'another' }]), /alias|duplicate/i);
  const missing = futureHero(); delete missing.clips.ultimate;
  assert.throws(() => createHeroPresentationRegistry([missing]), /ultimate/i);
  const weapon = futureHero(); weapon.states.attack = ['impact'];
  assert.throws(() => createHeroPresentationRegistry([weapon]), /impact|VFX/i);
});

test('discovery rejects a new runtime directory or character clip without the size contract', () => {
  const root = mkdtempSync(join(tmpdir(), 'hv-presentation-'));
  try {
    const dir = join(root, 'assets/characters/future-hero'); mkdirSync(dir, { recursive: true });
    const meta = { clips: Object.fromEntries(['idle','attack','ultimate','impact'].map(key => [key,{cellW:440,cellH:900,cols:2,frames:4}])) };
    writeFileSync(join(dir, 'runtime-meta.json'), JSON.stringify(meta));
    assert.throws(() => loadHeroPresentations(root), /future-hero.*presentation/i);
    writeFileSync(join(dir, 'presentation.json'), JSON.stringify(futureHero()));
    const registry = loadHeroPresentations(root);
    assert.equal(registry.profiles.future_hero.referenceBodyHeight, 500);
    meta.clips.idle.cellW=0;
    writeFileSync(join(dir, 'runtime-meta.json'), JSON.stringify(meta));
    assert.throws(() => loadHeroPresentations(root), /idle.*cellW/);
    meta.clips.idle.cellW=440;
    meta.clips['new-attack'] = {};
    writeFileSync(join(dir, 'runtime-meta.json'), JSON.stringify(meta));
    assert.throws(() => loadHeroPresentations(root), /new-attack/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
