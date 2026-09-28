import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// TKT-0161: HonVietCore (the pure combat rule core) lives in
// src/domain/combat/hon-viet-core.mjs as the single source of truth. The
// source battle.html carries only a placeholder script tag; this patch
// injects the module body into the built battle.html. Rules are edited in
// the module — never inline.

const p = join(process.cwd(), 'dist', 'battle.html');
let html = readFileSync(p, 'utf8');

const moduleSource = readFileSync(join(process.cwd(), 'src', 'domain', 'combat', 'hon-viet-core.mjs'), 'utf8');
const umdStart = moduleSource.indexOf('// __HV_CORE_UMD_START\n');
const umdEnd = moduleSource.indexOf('\n// __HV_CORE_UMD_END');
if (umdStart < 0 || umdEnd < umdStart) throw new Error('Core module UMD markers missing');
const moduleUmd = moduleSource.slice(umdStart + '// __HV_CORE_UMD_START\n'.length, umdEnd);
if (!moduleUmd.startsWith('(function attachHonVietCore(root, factory) {')) throw new Error('Core module UMD shape unexpected');

// If a stale inline core ever reappears in the source (copy/paste from an old
// branch), fail the build and point at the module instead.
const staleMarker = '<script>(function attachHonVietCore(root, factory) {';
if (html.includes(staleMarker)) {
  throw new Error('battle.html carries an inline HonVietCore block; remove it — the core is built from src/domain/combat/hon-viet-core.mjs');
}

const placeholder = '<script id="hon-viet-core-umd-v1">/* HonVietCore injected at build from src/domain/combat/hon-viet-core.mjs — do not edit rules here. */</script>';
if (html.split(placeholder).length !== 2) throw new Error('Core placeholder missing or ambiguous in battle.html');
html = html.replace(placeholder, '<script id="hon-viet-core-umd-v1">' + moduleUmd + '</script>');

writeFileSync(p, html);
console.log('HonVietCore injected from src/domain/combat/hon-viet-core.mjs (' + moduleUmd.length + ' chars)');
