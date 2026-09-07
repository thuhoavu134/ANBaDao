import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('L04a roster route owns a full viewport surface for card hit targets', () => {
  const css = read('../scripts/hero-roster-phase-a-v4.mjs');
  const runtime = read('../src/ui/hero-roster-runtime.js');

  assert.match(
    css,
    /#hvHeroRosterV4\{[^}]*height:100vh!important;[^}]*height:100dvh!important;/,
    'the source-owned roster portal must reserve the browser viewport'
  );
  assert.match(css, /#hvHeroRosterV4 \.v4-grid\{[^}]*min-height:0/);
  assert.match(runtime, /renderHeroDetail\(id\); showScreen\('heroDetail'\)/);
  assert.match(runtime, /back\.dataset\.nav = 'heroes'/);
  assert.doesNotMatch(runtime, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});
