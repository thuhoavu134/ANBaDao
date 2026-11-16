import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('L04a roster route owns a full viewport surface for card hit targets', () => {
  const css = read('../scripts/hero-roster-phase-a-v4.mjs');
  const runtime = read('../src/ui/hero-roster-runtime.js');

  assert.match(
    css,
    /#hvHeroRosterV4\{[^}]*position:fixed;[^}]*inset:0;/,
    'roster portal must fill the viewport like Trợ trận #hvGearRoot'
  );
  assert.match(css, /#hvHeroRosterV4 \.v4-card\{[^}]*min-height:150px/);
  assert.match(runtime, /renderHeroDetail\(id\); showScreen\('heroDetail'\)/);
  assert.match(css, /#hvHeroRosterV4 \.v4-art img\{[^}]*width:var\(--portrait-width,100%\);max-width:none/);
  assert.match(css, /transform:translate\(var\(--portrait-x,-50%\),var\(--portrait-y,-34%\)\)/);
  assert.match(css, /v4-veil/);
  assert.match(runtime, /v4-veil/);
  assert.match(runtime, /S\+/);
  assert.match(runtime, /class="v4-grade">\$\{esc\(card\.rarity\)\}/, 'rarity grade stays visible as text on the card');
  assert.match(css, /v4-element\{[^}]*width:14px/);
  assert.match(runtime, /back\.dataset\.nav = 'heroes'/);
  assert.doesNotMatch(runtime, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L24-T1: roster mounts on document.body like Trợ trận, not inside .wrap', () => {
  const runtime = read('../src/ui/hero-roster-runtime.js');
  assert.match(runtime, /document\.body\.append\(root\)/);
  assert.match(runtime, /root\.hidden = ST\.screen !== 'heroes'/);
  assert.match(runtime, /classList\.toggle\(['"]is-open['"]/);
});

test('L24-T2: active roster must not hide #heroesScreen', () => {
  const css = read('../scripts/hero-roster-phase-a-v4.mjs');
  assert.doesNotMatch(css, /body\.hero-roster-active #heroesScreen\{display:none/);
});

test('L24-T3: roster is a body overlay with overflow auto and cards that cannot collapse', () => {
  const css = read('../scripts/hero-roster-phase-a-v4.mjs');
  assert.match(css, /#hvHeroRosterV4\.is-open\{display:flex/);
  assert.match(css, /#hvHeroRosterV4\{[^}]*overflow:hidden/);
  assert.match(css, /#hvHeroRosterV4 \.v4-grid\{[^}]*overflow(?:-y)?:auto/);
  assert.doesNotMatch(css, /#hvHeroRosterV4 \.v4-grid\{[^}]*overflow:visible/);
  assert.doesNotMatch(css, /#hvHeroRosterV4\{[^}]*height:auto!important/);
  assert.match(css, /#hvHeroRosterV4 \.v4-card\{[^}]*min-height:150px/);
});
test('L148-T2: grid is the only scroll surface; dock stays below the cards', () => {
  const css = read('../scripts/hero-roster-phase-a-v4.mjs');
  const runtime = read('../src/ui/hero-roster-runtime.js');
  assert.match(css, /#hvHeroRosterV4 \.v4-grid\{[^}]*overflow(?:-y)?:auto/);
  assert.match(css, /#hvHeroRosterV4 \.v4-dock\{[^}]*flex:0 0 auto/);
  assert.match(css, /#hvHeroRosterV4 \.v4-dock\{[^}]*position:relative/);
  assert.match(runtime, /scrollSurface = \(\) => root\.querySelector\('\.v4-grid'\)/);
  assert.doesNotMatch(runtime, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L24-T4: one route owner still wraps showScreen without a second document listener', () => {
  const runtime = read('../src/ui/hero-roster-runtime.js');
  assert.match(runtime, /const baseShowScreen = showScreen;/);
  assert.match(runtime, /root\.hidden = ST\.screen !== 'heroes'/);
  assert.match(runtime, /back\.dataset\.nav = 'heroes'/);
  assert.doesNotMatch(runtime, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});
