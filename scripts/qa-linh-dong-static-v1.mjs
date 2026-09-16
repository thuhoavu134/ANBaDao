import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = Object.freeze([
  'assets/characters/linh-dong/idle-atlas.webp',
  'assets/characters/linh-dong/run-atlas.webp',
  'assets/characters/linh-dong/hit-atlas.webp',
  'assets/characters/linh-dong/fall-atlas.webp',
  'assets/characters/linh-dong/basic-atlas.webp',
  'assets/characters/linh-dong/ultimate-atlas.webp',
  'assets/characters/linh-dong/skill1_vfx-atlas.webp',
  'assets/characters/linh-dong/ultimate_vfx-atlas.webp',
  'assets/audio/sfx/linh-dong/atk.wav',
  'assets/audio/sfx/linh-dong/ult.wav'
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function inspectLinhDongStatic(root = process.cwd()) {
  const dist = join(root, 'dist');
  const battle = readFileSync(join(dist, 'battle.html'), 'utf8');
  const index = readFileSync(join(dist, 'index.html'), 'utf8');
  const fingerprintPath = join(dist, 'assets', 'characters', 'linh-dong', 'static-fingerprint.json');
  assert(existsSync(fingerprintPath), 'static fingerprint is missing; HTTP 200 alone is not evidence');
  const fingerprint = JSON.parse(readFileSync(fingerprintPath, 'utf8'));
  const files = {};
  for (const relativePath of REQUIRED) {
    const assetPath = join(dist, relativePath);
    assert(existsSync(assetPath), `missing Linh Đồng runtime asset: ${relativePath}`);
    const bytes = readFileSync(assetPath);
    assert(bytes.length > 32, `asset is empty or placeholder: ${relativePath}`);
    files[relativePath] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    assert(fingerprint.files?.[relativePath]?.bytes === bytes.length, `byte fingerprint mismatch: ${relativePath}`);
    assert(fingerprint.files?.[relativePath]?.sha256 === files[relativePath].sha256, `content fingerprint mismatch: ${relativePath}`);
  }

  assert(battle.includes('hero_splus_linh_dong'), 'battle does not contain the canonical hero id');
  assert(battle.includes('combinedVfx'), 'battle registry does not expose combined VFX');
  assert(battle.includes('waitLinhDongMarker'), 'battle does not use the shared Linh Đồng marker clock');
  assert(/if\(!usesLucAnh && !usesLinhDong(?: && !usesBachDien)?\) triggerImpactPresentation/.test(battle), 'separate impact VFX is still wired to Linh Đồng');
  assert(!battle.includes('tone(critical ? 105 : 135, critical ? 0.16 : 0.09, "square", 0.035);') || /if\(!isLinhDong\(actor\)(?:&&!isBachDien\(actor\))?\) tone/.test(battle), 'separate impact SFX is still wired to Linh Đồng damage');
  assert(/if\(!isLinhDong\(actor\)(?:&&!isBachDien\(actor\))?\) burst/.test(battle), 'separate impact VFX burst is still wired to Linh Đồng damage');
  assert(!battle.includes('if(isLinhDong(actor)&&action==="skill")'), 'Skill 1 still has a Linh Đồng runtime resolve branch');
  assert(!battle.includes('} else if(usesLinhDong){'), 'legacy Linh Đồng action branch still runs');
  const fxStart = battle.indexOf('function startLinhDongFx(');
  const fxEnd = battle.indexOf('function drawLinhDongFx(', fxStart);
  assert(fxStart >= 0 && fxEnd > fxStart, 'combined VFX start/renderer markers are missing');
  const fxSource = battle.slice(fxStart, fxEnd);
  assert(!/duration(?:Ms)?\s*[:=]\s*4000/.test(fxSource), 'combined VFX still uses the four-second runtime duration');
  assert(!/impactVfx|impactSfx|projectile/.test(battle.slice(battle.indexOf('const LINH_DONG_REGISTRY'), fxStart)), 'registry contains a forbidden split channel');

  assert(index.includes('hero_splus_linh_dong'), 'index does not expose the canonical Linh Đồng identity bridge');
  const splusStart = battle.indexOf('async function performSplusAction');
  const splusEnd = battle.indexOf('function drawSplusToken', splusStart);
  assert(splusStart >= 0 && splusEnd > splusStart, 'S+ action owner is missing from battle');
  const splusSource = battle.slice(splusStart, splusEnd);
  assert(splusSource.includes('beginLinhDongAction(actor,action,target,battleId)'), 'S+ Linh Đồng does not start the shared clock');
  assert(/waitLinhDongMarker\([^,]+,\s*['"]release['"]/.test(splusSource), 'S+ Linh Đồng does not wait for release');
  assert(splusSource.includes('emitLinhDongRelease'), 'S+ Linh Đồng does not emit release on the shared clock');
  assert(/waitLinhDongMarker\([^,]+,\s*['"]impact['"]/.test(splusSource), 'S+ Linh Đồng does not wait for impact');
  assert(/waitLinhDongMarker\([^,]+,\s*['"]recovery:end['"]/.test(splusSource), 'S+ Linh Đồng does not wait for recovery');
  assert(splusSource.split('e.act(').length === 2, 'S+ Linh Đồng damage is not resolved once');
  assert(!/sleep\(linh\?linhDur/.test(splusSource) && !splusSource.includes('sleep(linhDur'), 'S+ Linh Đồng still sleeps the scaled clip duration');
  assert(battle.includes("['passive','ultimate']"), 'S+ Linh Đồng skill bar still exposes Skill 1');
  const embedded = index.match(/const BATTLE_HTML_BASE64 = "([A-Za-z0-9+/=]+)";/);
  assert(embedded, 'embedded battle payload marker is missing');
  const embeddedBattle = Buffer.from(embedded[1], 'base64').toString('utf8');
  assert(embeddedBattle.includes('TKT-0145 canonical Linh Dong combat bridge'), 'embedded battle is stale and misses the Linh Đồng bridge');
  return { schema: 'hon-viet-linh-dong-static-qa/v1', ok: true, required: REQUIRED.length, files };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(JSON.stringify(inspectLinhDongStatic(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ schema: 'hon-viet-linh-dong-static-qa/v1', ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
}
