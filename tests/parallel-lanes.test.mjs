import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

const LANES = [
  ['TKT-0037', 'bag'],
  ['TKT-0038', 'mail'],
  ['TKT-0039', 'jobs'],
  ['TKT-0040', 'guild'],
  ['TKT-0041', 'friends'],
  ['TKT-0042', 'chat'],
  ['TKT-0043', 'clan'],
  ['TKT-0044', 'vault']
];

const WAVE_C = [
  ['TKT-0046', 'tower'],
  ['TKT-0047', 'expedition'],
  ['TKT-0048', 'shop'],
  ['TKT-0049', 'summon'],
  ['TKT-0050', 'arena'],
  ['TKT-0051', 'hunt'],
  ['TKT-0052', 'festival']
];

const WAVE_D = [
  ['TKT-0053', 'hero-detail']
];

const WAVE_E = [
  ['TKT-0054', 'daily'],
  ['TKT-0055', 'campaign']
];

const WAVE_F = [
  ['TKT-0056', 'journey'],
  ['TKT-0057', 'end']
];

const WAVE_G_HALLS = [
  ['TKT-0058', 'story'],
  ['TKT-0059', 'net'],
  ['TKT-0060', 'team']
];

const WAVE_G_SEALS = [
  ['TKT-0061', 'skill-seals-a'],
  ['TKT-0062', 'skill-seals-b'],
  ['TKT-0063', 'skill-seals-c']
];

const WAVE_I = [
  ['TKT-0074', 'auth']
];

const WAVE_H_READY = [
  ['TKT-0065', 'tower-battle'],
  ['TKT-0066', 'hub-back'],
  ['TKT-0067', 'train'],
  ['TKT-0068', 'skill-seals-d'],
  ['TKT-0069', 'challenge']
];

const WAVE_H_WAITING = [
  ['TKT-0070', 'campaign-foes-a'],
  ['TKT-0071', 'campaign-foes-b'],
  ['TKT-0072', 'campaign-foes-c'],
  ['TKT-0073', 'npc-busts']
];

test('lane stubs exist and are imported once from build-static', () => {
  const build = read('scripts/build-static.mjs');
  for (const [id, slug] of LANES) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled = new RegExp("await import\\(['\"]\\.\\./" + slug + "-hall-v1\\.mjs['\"]\\)").test(stub);
    const filled3d = new RegExp("await import\\(['\"]\\.\\./" + slug + "-3d-v1\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled || filled3d || reserved, true, id + ' stub must keep LANE or load hall/3d');
  }
  for (const [id, slug] of WAVE_C) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled3d = new RegExp("await import\\(['\"]\\.\\./" + slug + "-3d-v1\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled3d || reserved, true, id + ' wave C stub');
  }
  for (const [id, slug] of WAVE_D) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filledHall = /await import\(['"]\.\.\/hero-detail-hall-v1\.mjs['"]\)/.test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filledHall || reserved, true, id + ' wave D stub');
  }
  for (const [id, slug] of WAVE_E) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled3d = new RegExp("await import\\(['\"]\\.\\./" + slug + "-3d-v1\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled3d || reserved, true, id + ' wave E stub');
  }
  for (const [id, slug] of WAVE_F) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled3d = new RegExp("await import\\(['\"]\\.\\./" + slug + "-3d-v1\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled3d || reserved, true, id + ' wave F stub');
  }
  for (const [id, slug] of WAVE_G_HALLS) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled3d = new RegExp("await import\\(['\"]\\.\\./" + slug + "-3d-v1\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled3d || reserved, true, id + ' wave G hall stub');
  }
  for (const [id, slug] of WAVE_G_SEALS) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled = new RegExp("await import\\(['\"]\\.\\./" + slug + "-v1\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled || reserved, true, id + ' wave G seals stub');
  }
  assert.match(build, /daily-runtime-v1\.mjs[\s\S]*lanes\/tkt-0037-bag\.mjs/);
  assert.match(build, /lanes\/tkt-0044-vault\.mjs[\s\S]*lanes\/tkt-0046-tower\.mjs/);
  assert.match(build, /lanes\/tkt-0052-festival\.mjs[\s\S]*lanes\/tkt-0053-hero-detail\.mjs/);
  assert.match(build, /lanes\/tkt-0053-hero-detail\.mjs[\s\S]*lanes\/tkt-0054-daily\.mjs/);
  assert.match(build, /lanes\/tkt-0054-daily\.mjs[\s\S]*lanes\/tkt-0055-campaign\.mjs/);
  assert.match(build, /lanes\/tkt-0055-campaign\.mjs[\s\S]*lanes\/tkt-0056-journey\.mjs/);
  assert.match(build, /lanes\/tkt-0056-journey\.mjs[\s\S]*lanes\/tkt-0057-end\.mjs/);
  assert.match(build, /WAVE-G 2026-09-12 TKT-0058/);
  assert.match(build, /lanes\/tkt-0057-end\.mjs[\s\S]*lanes\/tkt-0058-story\.mjs/);
  assert.match(build, /lanes\/tkt-0058-story\.mjs[\s\S]*lanes\/tkt-0059-net\.mjs/);
  assert.match(build, /lanes\/tkt-0059-net\.mjs[\s\S]*lanes\/tkt-0060-team\.mjs/);
  assert.match(build, /lanes\/tkt-0060-team\.mjs[\s\S]*lanes\/tkt-0061-skill-seals-a\.mjs/);
  assert.match(build, /lanes\/tkt-0061-skill-seals-a\.mjs[\s\S]*lanes\/tkt-0062-skill-seals-b\.mjs/);
  assert.match(build, /lanes\/tkt-0062-skill-seals-b\.mjs[\s\S]*lanes\/tkt-0063-skill-seals-c\.mjs/);
  const waveH = WAVE_H_READY.concat(WAVE_H_WAITING);
  for (const [id, slug] of waveH) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled = new RegExp("await import\\(['\"]\\.\\./" + slug + "(?:-v1|-3d-v1|-hall-v1)\\.mjs['\"]\\)").test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled || reserved, true, id + ' wave H stub');
  }
  assert.match(build, /WAVE-H 2026-09-12 TKT-0065/);
  assert.match(build, /overlay-safari-hotfix-v1\.mjs[\s\S]*lanes\/tkt-0065-tower-battle\.mjs/);
  assert.match(build, /lanes\/tkt-0065-tower-battle\.mjs[\s\S]*lanes\/tkt-0066-hub-back\.mjs/);
  assert.match(build, /lanes\/tkt-0069-challenge\.mjs[\s\S]*lanes\/tkt-0070-campaign-foes-a\.mjs/);
  assert.match(build, /lanes\/tkt-0072-campaign-foes-c\.mjs[\s\S]*lanes\/tkt-0073-npc-busts\.mjs/);
  for (const [id, slug] of WAVE_I) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    const filled = /await import\(['"]\.\.\/net-auth-v1\.mjs['"]\)/.test(stub);
    const reserved = new RegExp("LANE = '" + id + "'").test(stub);
    assert.equal(filled || reserved, true, id + ' wave I stub');
  }
  assert.match(build, /WAVE-I 2026-09-12 TKT-0074/);
  assert.match(build, /overlay-safari-hotfix-v1\.mjs[\s\S]*lanes\/tkt-0074-auth\.mjs/);
});

test('wave A tickets are exclusive and freeze hub wiring', () => {
  const locks = new Set();
  const paths = new Map();
  for (const [id] of LANES) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock), false, 'duplicate lock ' + lock);
    locks.add(lock);
    const listed = md.match(/affected_paths: \[([^\]]+)\]/)[1];
    for (const p of listed.match(/[\w./-]+\.(?:js|css|mjs|jpg)|docs\/qa\/[\w./-]+/g) || []) {
      if (paths.has(p) && paths.get(p) !== id) assert.fail(p + ' shared by ' + paths.get(p) + ' and ' + id);
      paths.set(p, id);
    }
  }
  const kit = read('tickets/TKT-0045/ticket.md');
  assert.match(kit, /hero-kits-v2/);
  assert.doesNotMatch(kit, /lanes\/tkt-/);
  const locksC = new Set();
  for (const [id] of WAVE_C) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock) || locksC.has(lock), false, 'duplicate lock ' + lock);
    locksC.add(lock);
  }
  for (const [id] of WAVE_D) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
  }
  for (const [id] of WAVE_E) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
  }
  for (const [id] of WAVE_F) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
  }
  const locksG = new Set();
  const pathsG = new Map();
  for (const [id] of WAVE_G_HALLS) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock) || locksC.has(lock) || locksG.has(lock), false, 'duplicate lock ' + lock);
    locksG.add(lock);
    const listed = md.match(/affected_paths: \[([^\]]+)\]/)[1];
    for (const p of listed.match(/[\w./-]+\.(?:js|css|mjs|jpg)|docs\/qa\/[\w./-]+/g) || []) {
      if (pathsG.has(p) && pathsG.get(p) !== id) assert.fail(p + ' shared by ' + pathsG.get(p) + ' and ' + id);
      pathsG.set(p, id);
    }
  }
  const heroes = new Set();
  for (const [id] of WAVE_G_SEALS) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /wrap `renderHeroDetail`/);
    assert.match(md, /Không sửa `campaign-scene\.js`/);
    assert.doesNotMatch(md, /document\.body\.append/);
    assert.match(md, /battle\.html/);
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock) || locksC.has(lock) || locksG.has(lock), false, 'duplicate lock ' + lock);
    locksG.add(lock);
    const listed = md.match(/affected_paths: \[([^\]]+)\]/)[1];
    for (const p of listed.match(/[\w./-]+\.(?:js|css|mjs|jpg)|docs\/qa\/[\w./-]+/g) || []) {
      if (pathsG.has(p) && pathsG.get(p) !== id) assert.fail(p + ' shared by ' + pathsG.get(p) + ' and ' + id);
      pathsG.set(p, id);
    }
    const block = md.match(/## Heroes \(exclusive\)[\s\S]*?(?=\n## )/)[0];
    const ids = [...block.matchAll(/^- `([a-z_]+)`/gm)].map(m => m[1]);
    const unique = [...new Set(ids)];
    assert.equal(unique.length, 3, id + ' must name exactly 3 exclusive heroes');
    for (const hid of unique) {
      assert.equal(heroes.has(hid), false, hid + ' claimed twice');
      heroes.add(hid);
    }
  }
  assert.equal(heroes.size, 9, 'Wave G seals cover 9 heroes');
});

test('wave H tickets are exclusive and freeze combat visual', () => {
  const locks = new Set();
  const paths = new Map();
  const takeLock = (md, id) => {
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock), false, 'duplicate lock ' + lock);
    locks.add(lock);
    const listed = md.match(/affected_paths: \[([^\]]+)\]/)[1];
    for (const p of listed.match(/[\w./-]+\.(?:js|css|mjs|jpg)|docs\/qa\/[\w./-]+/g) || []) {
      if (paths.has(p) && paths.get(p) !== id) assert.fail(p + ' shared by ' + paths.get(p) + ' and ' + id);
      paths.set(p, id);
    }
    return lock;
  };

  const tower = read('tickets/TKT-0065/ticket.md');
  assert.match(tower, /status: (READY|REVIEW|LIVE)/);
  assert.match(tower, /Không sửa `index\.html`/);
  assert.match(tower, /Không sửa `campaign-scene\.js`/);
  assert.match(tower, /battle\.html/);
  assert.match(tower, /wrap `startTower`/);
  assert.match(tower, /runBattle\('__tower'\)/);
  assert.match(tower, /6 NPC|đúng 6/);
  assert.doesNotMatch(tower, /document\.body\.append/);
  takeLock(tower, 'TKT-0065');

  const hub = read('tickets/TKT-0066/ticket.md');
  assert.match(hub, /status: (READY|REVIEW|LIVE)/);
  assert.match(hub, /Không sửa `index\.html`/);
  assert.match(hub, /Không sửa `campaign-scene\.js`/);
  assert.match(hub, /navTo\('hub'\)/);
  assert.match(hub, /Thành Chính/);
  assert.match(hub, /journey-3d/);
  assert.match(hub, /end-3d/);
  takeLock(hub, 'TKT-0066');

  for (const [id] of [['TKT-0067', 'train'], ['TKT-0069', 'challenge']]) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: (READY|REVIEW|LIVE)/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
    assert.match(md, /Không sửa `campaign-scene\.js`/);
    assert.match(md, /battle\.html/);
    takeLock(md, id);
  }

  const seals = read('tickets/TKT-0068/ticket.md');
  assert.match(seals, /status: (READY|REVIEW|LIVE)/);
  assert.match(seals, /Không sửa `index\.html`/);
  assert.match(seals, /wrap `renderHeroDetail`/);
  assert.match(seals, /Không sửa `campaign-scene\.js`/);
  assert.doesNotMatch(seals, /document\.body\.append/);
  assert.match(seals, /battle\.html/);
  takeLock(seals, 'TKT-0068');
  const block = seals.match(/## Heroes \(exclusive\)[\s\S]*?(?=\n## )/)[0];
  const ids = [...block.matchAll(/^- `([a-z_]+)`/gm)].map(m => m[1]);
  assert.deepEqual(ids, ['ong_hang_pho', 'luc_anh', 'thay_mo']);
});

test('wave H waiting-asset tickets are plug-only', () => {
  const locks = new Set();
  for (const [id] of WAVE_H_WAITING) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: WAITING_ASSET/);
    assert.doesNotMatch(md, /status: READY/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /Không sửa `campaign-scene\.js`/);
    assert.match(md, /battle\.html/);
    assert.match(md, /Plug|plug|ghép/);
    assert.doesNotMatch(md, /splus-lab|Combat V2 vào roster|go:null combat/);
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock), false, 'duplicate lock ' + lock);
    locks.add(lock);
  }
});

test('wave I auth ticket is exclusive and freezes combat shells', () => {
  const md = read('tickets/TKT-0074/ticket.md');
  assert.match(md, /status: (READY|REVIEW|LIVE)/);
  assert.match(md, /Không sửa `index\.html`/);
  assert.match(md, /Không sửa `campaign-scene\.js`/);
  assert.match(md, /battle\.html/);
  assert.match(md, /wrap `renderNet`/);
  assert.match(md, /oauth|Google/i);
  assert.match(md, /\/api\/login/);
  assert.match(md, /resource_locks: \["auth-api"\]/);
  assert.doesNotMatch(md, /splus-lab|Combat V2 vào roster|go:null combat/);
});

test('forbidden work is not ticketed as READY hall', () => {
  const ids = readdirSync(join(root, 'tickets')).filter(n => n.startsWith('TKT-'));
  for (const id of ids) {
    if (id < 'TKT-0037') continue;
    const md = read('tickets/' + id + '/ticket.md');
    assert.doesNotMatch(md, /splus-lab|Combat V2 vào roster|go:null combat/);
  }
});
