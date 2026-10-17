import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHeroPresentationRegistry } from '../src/render/hero-presentation.mjs';

export function loadHeroPresentations(root = fileURLToPath(new URL('..', import.meta.url))) {
  const directory = join(root, 'assets/characters');
  const manifests = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const base = join(directory, entry.name), presentationPath = join(base, 'presentation.json');
    const runtimePath = join(base, 'runtime-meta.json');
    if (!existsSync(presentationPath)) {
      if (existsSync(runtimePath)) throw new Error(`${entry.name}: missing presentation.json for battle hero size`);
      continue;
    }
    const profile = JSON.parse(readFileSync(presentationPath, 'utf8'));
    // Validate the standalone manifest before inspecting the source inventory.
    createHeroPresentationRegistry([profile]);
    if (existsSync(runtimePath)) {
      const meta = JSON.parse(readFileSync(runtimePath, 'utf8'));
      for (const key of Object.keys(meta.vfx?.clips || {})) {
        if (Object.hasOwn(meta.clips || {}, key)) throw new Error(`${entry.name}: duplicate character/VFX source clip ${key}`);
        if (!profile.vfxClips?.includes(key)) throw new Error(`${entry.name}: nested VFX ${key} cannot use character registration`);
      }
      const sourceClips = { ...(meta.clips || meta), ...(meta.vfx?.clips || {}) };
      if (meta.idleVisual?.pages) {
        for (let page = 0; page < meta.idleVisual.pages; page++) sourceClips[`idle-authored-${page}`] ||= meta.idleVisual;
      }
      for (const key of Object.keys(sourceClips)) {
        if (!Object.hasOwn(profile.clips, key) && !profile.vfxClips?.includes(key)) {
          throw new Error(`${entry.name}: clip ${key} has no character registration or explicit VFX classification`);
        }
        if (profile.registration === 'source-body' && Object.hasOwn(profile.clips, key)) {
          const clip = sourceClips[key];
          if (clip.kind === 'vfx') throw new Error(`${entry.name}: VFX ${key} cannot use character registration`);
          for (const dimension of ['cellW', 'cellH', 'cols', 'frames']) {
            if (!Number.isInteger(clip[dimension]) || clip[dimension] <= 0) throw new Error(`${entry.name}: clip ${key} requires positive integer ${dimension}`);
          }
        }
      }
      for (const key of [...Object.keys(profile.clips), ...(profile.vfxClips || [])]) {
        if (!Object.hasOwn(sourceClips, key)) throw new Error(`${entry.name}: presentation references missing clip ${key}`);
      }
    }
    manifests.push(profile);
  }
  return createHeroPresentationRegistry(manifests);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const registry = loadHeroPresentations();
  console.log(`Hero presentation contracts valid: ${Object.keys(registry.profiles).length} families`);
}
