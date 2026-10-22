// Compare the FAILING tests of two `node --test` logs (spec reporter).
// Identity is the ASCII "test at <file>:<line>:<col>" anchor, NOT the test name: a log written through
// PowerShell mangles the Vietnamese glyphs ("Đình Lôi" -> "─É├¼nh L├┤i"), so comparing names would report the
// same test as both new and fixed. Line numbers are stable per file, and a hero integration never edits an
// existing test file (it only adds new ones), so the anchor is a safe identity.
//   node scripts/hero/compare-test-fails.mjs <baseline.log> <candidate.log>   -> exit 1 on any new failing test
import { readFileSync } from 'node:fs';

// PowerShell `>` writes UTF-16LE; node writes UTF-8. Accept both.
export function readLog(file) {
  const buf = readFileSync(file);
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.slice(2).toString('utf16le');
  if (buf.length > 3 && buf[1] === 0 && buf[3] === 0) return buf.toString('utf16le');
  return buf.toString('utf8').replace(/^\uFEFF/, '');
}

/** Readable form of a name that may have been mangled by a shell (display only, never an identity). */
export function plain(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim();
}

// Spec reporter: after "failing tests:" every failure is "test at <file>:<l>:<c>" followed by "<mark> <name> (<ms>ms)".
// The mark (✖) and the summary glyph (ℹ) get mangled when a shell re-encodes the output, so only ASCII anchors are used.
export function failingTests(log) {
  const out = new Map();
  const lines = log.split(/\r?\n/);
  const start = lines.findIndex(l => /failing tests:\s*$/.test(l));
  if (start < 0) return out;
  let at = null;
  const seen = new Map();
  for (const line of lines.slice(start + 1)) {
    const hit = /^test at (.+?):(\d+):(\d+)\s*$/.exec(line);
    if (hit) { at = { file: hit[1].replace(/\\/g, '/'), line: +hit[2], col: +hit[3] }; continue; }
    if (!at) continue;
    const m = /^\S{1,6} (.+) \(\d+(?:\.\d+)?ms\)\s*$/.exec(line);
    if (m) {
      // Several subtests of one `test()` share the declaration anchor; the occurrence index keeps them distinct
      // so a newly failing subtest cannot hide behind a sibling that was already failing.
      const base = `${at.file}:${at.line}:${at.col}`;
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      const id = `${base}#${n}`;
      out.set(id, { id, ...at, name: m[1].trim() });
      at = null;
    }
  }
  return out;
}

export function totals(log) {
  const num = k => Number((new RegExp(`^\\S{1,6} ${k} (\\d+)\\s*$`, 'm').exec(log) || [])[1]);
  return { tests: num('tests'), pass: num('pass'), fail: num('fail') };
}

export function compare(before, after) {
  const added = [...after.values()].filter(t => !before.has(t.id));
  const fixed = [...before.values()].filter(t => !after.has(t.id));
  return { added, fixed };
}

if (process.argv[1] && /compare-test-fails\.mjs$/.test(process.argv[1])) {
  const [a, b] = process.argv.slice(2);
  const la = readLog(a), lb = readLog(b);
  const before = failingTests(la), after = failingTests(lb);
  const { added, fixed } = compare(before, after);
  const ta = totals(la), tb = totals(lb);
  console.log(`baseline ${ta.pass}/${ta.fail} (names ${before.size}) -> candidate ${tb.pass}/${tb.fail} (names ${after.size}); new ${added.length}, fixed ${fixed.length}`);
  for (const t of added) console.log(`  NEW FAIL: ${t.id} :: ${plain(t.name)}`);
  for (const t of fixed) console.log(`  fixed:    ${t.id} :: ${plain(t.name)}`);
  const bad = added.length > 0 || !(tb.fail <= ta.fail);
  console.log(bad ? 'TEST GATE FAIL' : 'TEST GATE PASS');
  process.exit(bad ? 1 : 0);
}
