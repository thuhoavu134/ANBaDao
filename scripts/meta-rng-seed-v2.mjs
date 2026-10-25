import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Meta-roll RNG seeding v2 — festival (hoa đăng + Bách Bảo wheel), forge
// rarity, and the hub economy rolls (sweep/job/tower/shop).
//
// Companion to meta-rng-seed-v1 (summon). Same design: a scoped seeded stream
// (mulberry32, per-action reseed from crypto entropy, site-tagged draws) whose
// seed is recorded in a dedicated localStorage ring so any reward roll can be
// replayed and audited. The save contract is untouched.
//
// Scope strategy: every replacement is applied INSIDE the owning top-level
// function body (slice from `function NAME(` to the next `\nfunction `), and
// each site must occur exactly once inside that slice. Cosmetic rolls (chat
// flavor, voice lines, star fields, the legacy inline battle stub) stay out of
// scope on purpose.

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

if (html.includes('hv-meta-rng-seed-v2')) throw new Error('Meta RNG v2 patch already installed');

// 1) The scoped seeded-RNG owner.
const bootstrap = `<script id="hv-meta-rng-seed-v2">
(() => {
  "use strict";
  if (window.__HV_SCOPE_RNG_V2) return;
  const RING_KEY = 'hv_scope_seeds_v1', RING_MAX = 40;
  const readRing = () => { try { const v = JSON.parse(localStorage.getItem(RING_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const writeRing = (ring) => { try { localStorage.setItem(RING_KEY, JSON.stringify(ring.slice(-RING_MAX))); } catch {} };
  let stream = null, scope = null, seed = 0;
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  window.__HV_SCOPE_RNG_V2 = Object.freeze({
    beginRoll(name, detail) {
      let entropy;
      try { entropy = crypto.getRandomValues(new Uint32Array(1))[0]; } catch { entropy = (Math.random() * 4294967296) >>> 0; }
      scope = String(name); seed = entropy >>> 0; stream = mulberry32(seed);
      const ring = readRing();
      ring.push({ scope, seed, at: Date.now(), ...(detail && typeof detail === 'object' ? detail : {}) });
      writeRing(ring);
      return seed;
    },
    random(site) {
      if (!stream) return Math.random();
      return stream();
    },
    scope() { return scope; },
    lastRolls: readRing
  });
})();
</script>`;

if (!html.includes('</body>')) throw new Error('Meta RNG v2 bootstrap missing body anchor');
html = html.replace('</body>', bootstrap + '\n</body>');

// 2) Per-function seeding. For each top-level function: slice its body, rewire
// each Math.random() site exactly once, and prepend a beginRoll call. Every
// injected reference uses optional chaining with a Math.random() fallback so
// harnesses that extract these functions without the bootstrap keep working.
const R = (site) => `(window.__HV_SCOPE_RNG_V2?.random?.('${site}') ?? Math.random())`;
const FUNCTIONS = [
  {
    name: 'sweepRun',
    scope: 'loot.sweep',
    sites: [
      ['let sh=(Math.random()<0.3)?2:0;', `let sh=(${R('loot.sweepShard')}<0.3)?2:0;`],
      ['const hid=pool[(Math.random()*pool.length)|0];', `const hid=pool[(${R('loot.sweepPick')}*pool.length)|0];`]
    ]
  },
  {
    name: 'claimJob',
    scope: 'loot.claimJob',
    sites: [
      ['const hid=pool[(Math.random()*pool.length)|0];', `const hid=pool[(${R('loot.jobPick')}*pool.length)|0];`]
    ]
  },
  {
    name: 'towerReward',
    scope: 'loot.tower',
    sites: [
      ['shId=pool[(Math.random()*pool.length)|0];', `shId=pool[(${R('loot.towerShard')}*pool.length)|0];`]
    ]
  },
  {
    name: 'ensureShop',
    scope: 'shop.pick',
    sites: [
      ['const pick=a=>a[(Math.random()*a.length)|0];', `const pick=a=>a[(${R('shop.pick')}*a.length)|0];`]
    ]
  },
  {
    name: 'lanternGrant',
    scope: 'festival.lantern',
    sites: [
      ['let r=Math.random()*total, pick=arr[0];', `let r=${R('festival.lantern')}*total, pick=arr[0];`]
    ]
  },
  {
    name: 'releaseLantern',
    scope: 'festival.wish',
    sites: [
      ['const wish=HOADANG.wishes[(Math.random()*HOADANG.wishes.length)|0];', `const wish=HOADANG.wishes[(${R('festival.wish')}*HOADANG.wishes.length)|0];`]
    ]
  },
  {
    name: 'pickBachBaoIndex',
    scope: 'festival.bachBao',
    sites: [
      ['return Math.floor(Math.random()*BACH_BAO.slots.length);', `return Math.floor(${R('festival.bachBaoIndex')}*BACH_BAO.slots.length);`]
    ]
  },
  {
    name: 'openBachBaoChest',
    scope: 'festival.wheel',
    sites: [
      ["const r=Math.random()*100; let msg='',ic='✨';", `const r=${R('festival.wheelPrize')}*100; let msg='',ic='✨';`]
    ]
  },
  {
    name: 'rollForgeRarity',
    scope: 'forge.rarity',
    sites: [
      ["econ().craftPity++; let r=Math.random()*100,acc=0,rar='s';", `econ().craftPity++; let r=${R('forge.rarity')}*100,acc=0,rar='s';`]
    ]
  }
];

for (const fn of FUNCTIONS) {
  const startAnchor = 'function ' + fn.name + '(';
  const start = html.indexOf(startAnchor);
  if (start < 0) throw new Error('Meta RNG v2: function anchor missing: ' + fn.name);
  const end = html.indexOf('\nfunction ', start + 1);
  if (end < start) throw new Error('Meta RNG v2: function end anchor missing: ' + fn.name);
  let body = html.slice(start, end);
  for (const [from, to] of fn.sites) {
    if (body.split(from).length !== 2) throw new Error('Meta RNG v2 site missing or ambiguous in ' + fn.name + ': ' + from);
    body = body.replace(from, to);
  }
  const begin = 'window.__HV_SCOPE_RNG_V2?.beginRoll?.(' + JSON.stringify(fn.scope) + ');';
  const brace = body.indexOf('{');
  if (brace < 0) throw new Error('Meta RNG v2: opening brace missing in ' + fn.name);
  body = body.slice(0, brace + 1) + ' ' + begin + body.slice(brace + 1);
  html = html.slice(0, start) + body + html.slice(end);
}

writeFileSync(p, html);
console.log('Meta RNG v2 seeded: festival lantern/wheel/bach-bao, forge rarity, sweep/job/tower/shop rolls (ring hv_scope_seeds_v1)');
