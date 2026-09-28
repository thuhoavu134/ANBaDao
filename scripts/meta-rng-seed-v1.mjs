import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Meta-roll RNG seeding — Gọi Mộng (summon) first.
//
// The battle engine is fully seeded (L05c adapter: rule + presentation sites go
// through __hvRuleRandom3qAdapter/__hvPresentationRandom3qAdapter with the
// seeded combat session). The hub's meta rolls still used bare Math.random(),
// so a gacha result could never be reproduced or audited after the fact.
//
// This patch seeds the live summon roll (tier roll + hero pick inside a pull)
// with a per-pull seed that is recorded in a dedicated localStorage ring
// (hv_pull_seeds_v1, last 20 pulls). The save contract is untouched: the ring
// lives outside P so old saves stay valid.
//
// Replay: reseed __HV_META_RNG_V1 with the recorded seed and replay the same
// pull sequence given the same pity state.

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

if (html.includes('hv-meta-rng-seed-v1')) throw new Error('Meta RNG seed patch already installed');

// 1) The seeded meta-RNG owner. mulberry32 stream, per-pull reseed, site-tagged.
const bootstrap = `<script id="hv-meta-rng-seed-v1">
(() => {
  "use strict";
  if (window.__HV_META_RNG_V1) return;
  const RING_KEY = 'hv_pull_seeds_v1', RING_MAX = 20;
  const readRing = () => { try { const v = JSON.parse(localStorage.getItem(RING_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const writeRing = (ring) => { try { localStorage.setItem(RING_KEY, JSON.stringify(ring.slice(-RING_MAX))); } catch {} };
  let state = 0, cursor = 0, pullId = null;
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let stream = null;
  window.__HV_META_RNG_V1 = Object.freeze({
    beginPull(player, n, free) {
      let entropy;
      try { entropy = crypto.getRandomValues(new Uint32Array(1))[0]; } catch { entropy = (Math.random() * 4294967296) >>> 0; }
      pullId = 'pull-' + Date.now().toString(36) + '-' + entropy.toString(36);
      state = entropy >>> 0; cursor = 0; stream = mulberry32(state);
      const ring = readRing();
      ring.push({ id: pullId, seed: state, n: n || 1, free: !!free, at: Date.now(), pity: (player && player.pity) || 0 });
      writeRing(ring);
      return pullId;
    },
    random(site) {
      if (!stream) return Math.random();
      cursor += 1;
      return stream();
    },
    cursor() { return cursor; },
    pullId() { return pullId; },
    lastPulls: readRing
  });
})();
</script>`;

if (!html.includes('</body>')) throw new Error('Meta RNG bootstrap missing body anchor');
html = html.replace('</body>', bootstrap + '\n</body>');

// 2) Seed per pull at the top of doSummon.
const summonAnchor = 'function doSummon(n,free){ const cost=free?0:(n===10?GACHA.cost10:GACHA.cost1);';
if (html.split(summonAnchor).length !== 2) throw new Error('Meta RNG seed anchor missing or ambiguous: doSummon');
html = html.replace(summonAnchor, 'function doSummon(n,free){ const cost=free?0:(n===10?GACHA.cost10:GACHA.cost1);\n  window.__HV_META_RNG_V1.beginPull(P, n, free);');

// 3) Seed the two rule sites inside the live summon roll — scoped to the
// rollTier/doSummon bodies: the same Math.random() shapes also appear in other
// meta UIs (festival wheel, expedition) which are out of scope for this patch.
const tierSite = ['const r=Math.random()*100;', "const r=window.__HV_META_RNG_V1.random('summon.tier')*100;"];
const pickSite = ['const id=pool[(Math.random()*pool.length)|0];', "const id=pool[(window.__HV_META_RNG_V1.random('summon.pick')*pool.length)|0];"];
const rollStart = html.indexOf('function rollTier(){');
const rollEnd = html.indexOf('function poolOf(t)', rollStart);
if (rollStart < 0 || rollEnd < rollStart) throw new Error('Meta RNG seed: rollTier body anchor missing');
let rollBody = html.slice(rollStart, rollEnd);
if (rollBody.split(tierSite[0]).length !== 2) throw new Error('Meta RNG site missing or ambiguous in rollTier: ' + tierSite[0]);
rollBody = rollBody.replace(tierSite[0], tierSite[1]);
html = html.slice(0, rollStart) + rollBody + html.slice(rollEnd);

const sumStart = html.indexOf('function doSummon(n,free){');
const sumEnd = html.indexOf('function doSummonUI(', sumStart);
if (sumStart < 0 || sumEnd < sumStart) throw new Error('Meta RNG seed: doSummon body anchor missing');
let sumBody = html.slice(sumStart, sumEnd);
if (sumBody.split(pickSite[0]).length !== 2) throw new Error('Meta RNG site missing or ambiguous in doSummon: ' + pickSite[0]);
sumBody = sumBody.replace(pickSite[0], pickSite[1]);
html = html.slice(0, sumStart) + sumBody + html.slice(sumEnd);

writeFileSync(p, html);
console.log('Meta RNG seeded: summon tier + pick rolls recorded per pull (hv_pull_seeds_v1)');
