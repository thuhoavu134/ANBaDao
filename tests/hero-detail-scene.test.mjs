import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui = readFileSync(new URL('../src/ui/hero-detail-tabs.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/hero-detail-tabs.css', import.meta.url), 'utf8');
test('showcase keeps live stats and existing upgrade nodes outside tab panels', () => {
  assert.match(ui, /assigned = new Set\(\[stage, oldTabs, medals, upgrades/);
  assert.match(ui, /body.replaceChildren\(stage, dock, workspace\)/);
  assert.match(ui, /dock.append\(medals, upgrades\)/);
});
test('skill shortcuts disclose authored descriptions through the existing tabs', () => {
  assert.match(ui, /className = 'hv-scene-skills'/);
  assert.match(ui, /activate\('skills', true\)/);
  assert.doesNotMatch(ui, /requestAnimationFrame|levelUpHero\(|starUpHero\(/);
  new Function(ui);
});
test('portrait showcase is bounded on desktop with mobile-safe sizing', () => {
  assert.match(css, /max-width:560px/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /hv-scene-skills/);
});
