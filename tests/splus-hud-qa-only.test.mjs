import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function makeHarness(search, { existingPanel = false } = {}) {
  const created = [], appended = [], removed = [];
  const el = (tag) => {
    const node = {
      tag, id: '', className: '', textContent: '', dataset: {}, childElementCount: 0,
      children: [], setAttribute() {}, append(...kids) { this.children.push(...kids); this.childElementCount = this.children.length; },
      replaceChildren(...kids) { this.children = kids; this.childElementCount = kids.length; },
      remove() { removed.push(tag + ':' + this.id); }
    };
    created.push(node);
    return node;
  };
  const context = {
    state: { mode: 'battle', round: 2, currentId: 'p:0' },
    getUnit: () => null,
    HEROES: [{ id: 'p:0', sourceId: 'hero_splus_test' }],
    units: [{ id: 'p:0', sourceId: 'hero_splus_test', team: 'player', slot: 0, hp: 100, maxHp: 100, energy: 30, shield: 0, name: 'Test' }],
    TEAM_PLAYER: 'player',
    location: { search },
    URLSearchParams,
    console: { warn: () => {} },
    document: {
      querySelector: () => null,
      getElementById: (id) => {
        if (id !== 'splus-status-panel') return null;
        return existingPanel ? {
          id, children: [], childElementCount: 0,
          append(...kids) { this.children.push(...kids); this.childElementCount = this.children.length; },
          replaceChildren(...kids) { this.children = kids; this.childElementCount = kids.length; },
          remove() { removed.push('panel'); }
        } : null;
      },
      createElement: (tag) => el(tag),
      body: {
        append(...kids) { appended.push(...kids); },
        classList: { add() {}, remove() {} }
      }
    },
    SPLUS42: {
      catalog: [{ id: 'hero_splus_test' }],
      create: () => ({ round: 2, start() {}, hud: () => [], events: [] })
    }
  };
  context.globalThis = context;
  const source = readFileSync(new URL('../src/runtime/splus-battle-bridge.js', import.meta.url), 'utf8');
  vm.createContext(context);
  vm.runInContext(source + '\nglobalThis.__view = splusStateView;', context);
  return { context, created, appended, removed, call: () => context.__view() };
}

test('production battle never renders the seals status panel', () => {
  const h = makeHarness('', { existingPanel: true });
  assert.equal(h.call(), true);
  const panels = h.created.filter(n => n.tag === 'section' && n.id === 'splus-status-panel');
  assert.equal(panels.length, 0, 'panel must not be created without ?qaSplus42');
  assert.equal(h.appended.filter(n => n.id === 'splus-status-panel').length, 0);
  assert.deepEqual(h.removed, ['panel'], 'stale panel must be removed');
});

test('?qaSplus42 keeps the QA seals panel with round heading and evidence', () => {
  const h = makeHarness('?qaSplus42=1');
  assert.equal(h.call(), true);
  const panel = h.appended.find(n => n.id === 'splus-status-panel');
  assert.ok(panel, 'QA mode must mount the panel');
  const heading = panel.children.find(n => n.tag === 'h2');
  assert.match(heading.textContent, /Ấn ký trận đấu · Hiệp 2/);
});

test('the audio-sync marker is an HTML comment, never visible page text', () => {
  const patch = readFileSync(new URL('../scripts/combat-authored-audio-sync-v1.mjs', import.meta.url), 'utf8');
  assert.match(patch, /<!-- HV_COMBAT_AUTHORED_AUDIO_SYNC_V1 -->/);
  if (!existsSync(join(root, 'dist/battle.html'))) return;
  const dist = readFileSync(join(root, 'dist/battle.html'), 'utf8');
  assert.doesNotMatch(dist, /\/\* HV_COMBAT_AUTHORED_AUDIO_SYNC_V1 \*\//, 'JS-comment marker leaked into the document');
  assert.match(dist, /<!-- HV_COMBAT_AUTHORED_AUDIO_SYNC_V1 -->/);
});
