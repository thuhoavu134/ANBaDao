import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { applyBattleFormationScale, battleCharacterBodyForViewport, BATTLE_WORLD, DESKTOP_FORMATION } from '../scripts/battle-formation-scale-v1.mjs';
import { patchKyVanBattle } from '../scripts/ky-van-runtime-v1.mjs';
import { patchTieuPhongBattle } from '../scripts/tieu-phong-runtime-v1.mjs';
import { patchTichDaoBattle } from '../scripts/tich-dao-runtime-v1.mjs';
import { patchHongThuongBattle } from '../scripts/hong-thuong-runtime-v1.mjs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const patched = applyBattleFormationScale(read('battle.html') + '\n' + read('src/runtime/splus-battle-bridge.js'));
const start = patched.indexOf('const PORTRAIT_FORMATION=');
const helpers = patched.slice(start, patched.indexOf('/* hv-battle-scale-helpers-end */', start));

function recordingContext() {
  let matrix = { a: 1, d: 1, x: 0, y: 0 };
  const stack = [], draws = [];
  return {
    draws,
    save() { stack.push({ ...matrix }); }, restore() { matrix = stack.pop(); },
    translate(x, y) { matrix.x += x * matrix.a; matrix.y += y * matrix.d; },
    scale(x, y) { matrix.a *= x; matrix.d *= y; },
    drawImage(image, sx, sy, sw, sh, x, y, width, height) {
      draws.push({ image, sx, sy, sw, sh, x, y, width, height, matrix: { ...matrix } });
    }
  };
}
const close = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-7, `${message}: ${a} != ${b}`);

for (const [slug, name, prefix] of [
  ['ky-van', 'KyVan', 'KY_VAN'], ['tieu-phong', 'TieuPhong', 'TIEU_PHONG'],
  ['tich-dao', 'TichDao', 'TICH_DAO'], ['hong-thuong', 'HongThuong', 'HONG_THUONG']
]) {
  test(`${slug}: production helper + actor renderer keep one body scale through idle/ATK/ultimate on both teams`, () => {
    const meta = JSON.parse(read(`assets/characters/${slug}/runtime-meta.json`));
    const profile = JSON.parse(read(`assets/characters/${slug}/presentation.json`));
    const source = read(`src/runtime/${slug}.js`);
    for (const [width, height, viewport] of [[390, 739, .34], [1280, 528, .74]]) {
      for (const team of ['player', 'enemy']) {
        const unit = { sourceId: 'temporary-slot', sourceHeroId: profile.heroId, id: 'actor', team, x: 535, y: 520, baseY: 520, hp: 100, state: 'idle' };
        const context = {
          WORLD: BATTLE_WORLD, POSITIONS: DESKTOP_FORMATION, view: { width, height }, innerWidth: width, innerHeight: height,
          dom: {}, [prefix + '_META']: meta, state: { battleId: 1 }, TEAM_ENEMY: 'enemy', performance: { now: () => 0 }, getUnit: () => null,
          drawUnitHud() {}, __hvHeroVisibility: { finish: (_c, _h, _u, _t, drawn) => drawn },
          BACH_DIEN_LOADER: { ensure: clip => ({ image: { src: clip.src, naturalWidth: clip.cols * clip.cellW, complete: true } }) }
        };
        vm.createContext(context); vm.runInContext(helpers + '\n' + source, context);
        const property = '_' + name[0].toLowerCase() + name.slice(1) + 'Action';
        for (const action of ['idle', 'basic', 'ultimate']) {
          delete unit[property];
          if (action !== 'idle') unit[property] = { action, actor: unit, battleId: 1, startedAt: 0, speed: 1, targets: [], groundY: unit.y };
          const ctx = recordingContext();
          assert.equal(context[`draw${name}Hero`](ctx, unit, 0), true);
          assert.equal(ctx.draws.length, 1, 'one live body; no second scaled fallback');
          const d = ctx.draws[0], key = action === 'idle' ? 'idle-authored-0' : action === 'ultimate' && slug === 'hong-thuong' ? 'ult-prep' : action;
          const body = profile.clips[key];
          const cell = meta.clips[key] || meta.idleVisual;
          const sourceDensity = d.height / cell.cellH;
          close(body.bodyHeight * sourceDensity * d.matrix.d, 310 * viewport * (.83 + (520 - 290) / 1500), 'world reference height');
          close(d.width / cell.cellW, sourceDensity, 'no aspect distortion');
          close((d.y + body.footY * sourceDensity) * d.matrix.d + d.matrix.y,
            unit.y + profile.footOffsetY * d.matrix.d, 'shared foot registration');
          close((d.x + body.footX * sourceDensity) * d.matrix.a + d.matrix.x, unit.x, 'single centered enemy mirror');
          assert.equal(Math.sign(d.matrix.a), team === 'enemy' ? -1 : 1);
          close(context.battleCharacterBody(unit).height, 310 * viewport * (.83 + (520 - 290) / 1500), 'HUD/body height');
        }
      }
    }
  });
}

test('legacy source dimensions remain the independent reference behind their asset contracts', () => {
  const battle = read('battle.html'), thayMo = read('scripts/thay-mo-authored-production-v1.mjs');
  assert.match(battle, /const THAY_MO_IDLE_CELL_H = 264/);
  assert.match(thayMo, /drawH=348/);
  const profile = JSON.parse(read('assets/characters/thay-mo/presentation.json'));
  close(profile.referenceBodyHeight, 348 * 250 / 264, 'legacy local space, not raw250');
  assert.match(battle, /620,348,\{baseline:42\}/);
  assert.match(battle, /drawHeight\+42,drawWidth,drawHeight/);
});

test('pending-art HUD follows the real card rectangle without overriding registered heroes', () => {
  const bridge = read('src/runtime/splus-battle-bridge.js');
  const [, x, y, w, h] = bridge.match(/roundRect\((-?\d+),(-?\d+),(\d+),(\d+),16\)/).map(Number);
  const unit = { id: 'future-card', visualSource: 'splus-pending-art', x: 730, y: 520, baseY: 520, team: 'player' };
  for (const [width, height] of [[390, 739], [1280, 528]]) {
    const context = { WORLD: BATTLE_WORLD, POSITIONS: DESKTOP_FORMATION, view: { width, height } };
    vm.createContext(context); vm.runInContext(helpers, context);
    const actual = context.battleCharacterBody(unit);
    close(actual.height, h, 'card height');
    close(actual.topY, unit.y + y, 'HUD at card top');
    close(actual.centerX, unit.x + x + w / 2, 'card horizontal center');
    assert.equal(JSON.stringify(actual), JSON.stringify(battleCharacterBodyForViewport(unit, width, height)), 'ESM and injected helper agree');
    const registered = context.battleCharacterBody({ ...unit, sourceHeroId: 'hong_thuong' });
    assert.notEqual(registered.height, h, 'authored source wins over the older pending-art flag');
  }
});

test('the four late hero installers compose with one shared HUD and character helper', () => {
  // The Bạch Diện installer normally adds this effects-pass call earlier in
  // build-static. Seed that unrelated hook explicitly in this composition
  // fixture; this is not a claim to have executed the full asset build.
  let html = patched + '\nfunction finalEffects(ctx,time){\n    drawBachDienFx(ctx,time);\n}';
  for (const [slug, patch] of [
    ['ky-van', patchKyVanBattle], ['tieu-phong', patchTieuPhongBattle],
    ['tich-dao', patchTichDaoBattle], ['hong-thuong', patchHongThuongBattle]
  ]) {
    const source = read(`src/runtime/${slug}.js`), meta = JSON.parse(read(`assets/characters/${slug}/runtime-meta.json`));
    html = patch(html, source, meta);
    assert.equal(patch(html, source, meta), html, `${slug} installer is idempotent`);
  }
  assert.equal((html.match(/function battlePaintCharacter\(/g) || []).length, 1);
  assert.equal((html.match(/const y = battleCharacterBody\(unit\)\.topY - 18/g) || []).length, 1);
  assert.ok(!html.includes('battleCharacterScale(unit)*419'), 'no hero-specific HUD formula survives');
});
