import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const S = '#hvHeroDetailRoot\\[data-hero-id="bach_dien"\\]';

test('owner-locked Bạch Diện layout: stage → stats → upgrade → three features', () => {
  const css = read('src/ui/hero-detail-vo-cac.css');
  const order = ['hstage', 'medalrow', 'vc-overview', 'vc-feature-menu', 'hv-detail-workspace'];
  order.forEach((cls, index) =>
    assert.match(css, new RegExp(S + ' #hdBody>\\.' + cls + '\\{order:' + index + '[;}]')));
  assert.match(css, /\.vc-coin\{/);
  assert.match(css, /\.vc-stat-ico svg\{/);
  assert.match(css, new RegExp(S + ' \\.hsepi\\{display:none!important\\}'));
  assert.match(css, new RegExp(S + ' \\.vc-primary-upgrade\\{'));
  assert.doesNotMatch(css.slice(css.indexOf('Owner-locked layout')), /Georgia/,
    'Georgia splits Vietnamese diacritics; keep the Noto/Times stack');
});

test('skill seals and feature menu use the six shipped Bạch Diện icons', () => {
  const tabs = read('src/ui/hero-detail-tabs.js');
  assert.match(tabs, /assets\/ui\/hero-detail\/bach-dien-icons\//);
  for (const name of ['basic', 'ultimate', 'passive', 'equipment', 'star', 'details'])
    assert.ok(existsSync(new URL('../assets/ui/hero-detail/bach-dien-icons/' + name + '.png', import.meta.url)), name);
  for (const name of ["'equipment'", "'star'", "'details'"]) assert.ok(tabs.includes(name), name);
  // Upgrade still delegates to the original live button.
  assert.match(tabs, /source\.click\(\)/);
});
