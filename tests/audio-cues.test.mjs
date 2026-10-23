// Guards the two ways a hero's sound goes silent: a cue that points at a missing file, and a cue that no code
// ever triggers. Both happened in shipped heroes (Bé An's cues pointed at .m4a that Chromium could not decode;
// Tịnh Mặc registered four cues nothing played).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SFX = join(ROOT, 'assets', 'audio', 'sfx');

const runtimeMap = () => {
  const src = readFileSync(join(ROOT, 'src', 'ui', 'audio-sfx-runtime.js'), 'utf8');
  const out = {};
  for (const m of src.matchAll(/'([\w-]+)'\s*:\s*'([^']+\.(?:wav|mp3|m4a|ogg))'/g)) out[m[1]] = m[2];
  return out;
};

test('audio: every cue in the runtime map points at a file that exists', () => {
  const map = runtimeMap();
  assert.ok(Object.keys(map).length > 30, 'the map is populated');
  const missing = Object.entries(map).filter(([, f]) => !existsSync(join(SFX, f)));
  assert.deepEqual(missing, [], `missing files: ${JSON.stringify(missing)}`);
});

test('audio: a cue may point at .m4a only when that file really exists', () => {
  // Kỳ Vân ships AAC mixes on purpose (tests/ky-van-audio.test.mjs validates the mp4a payload), so the rule is not
  // "no m4a" but "the file you point at must be there" — that is what left Bé An silent.
  const bad = Object.entries(runtimeMap()).filter(([, f]) => f.endsWith('.m4a') && !existsSync(join(SFX, f)));
  assert.deepEqual(bad, [], `m4a cues without a file: ${JSON.stringify(bad)}`);
});

test('audio: every authored hero cue is triggered by something', () => {
  const dirs = readdirSync(join(ROOT, 'assets', 'characters'), { withFileTypes: true }).filter(d => d.isDirectory());
  const problems = [];
  for (const d of dirs) {
    const p = join(ROOT, 'assets', 'characters', d.name, 'hero.json');
    if (!existsSync(p)) continue;
    const hero = JSON.parse(readFileSync(p, 'utf8'));
    const b = hero.battle || {};
    const used = new Set();
    for (const a of Object.values(b.actions || {})) for (const e of a.sfx || []) used.add(e.cue);
    for (const v of Object.values(b.events || {})) if (v && v.sfx) used.add(v.sfx);
    if (b.reactions && b.reactions.hitCue) used.add(b.reactions.hitCue);
    const dead = Object.keys(hero.sfx || {}).filter(c => !used.has(c));
    if (dead.length) problems.push(`${d.name}: ${dead.join(', ')}`);
    for (const [cue, file] of Object.entries(hero.sfx || {})) {
      if (!existsSync(join(SFX, file))) problems.push(`${d.name}: ${cue} file missing (${file})`);
    }
  }
  assert.deepEqual(problems, [], problems.join(' | '));
});
