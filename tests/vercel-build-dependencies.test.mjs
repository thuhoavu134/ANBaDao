import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Vercel installs development build tools even with NODE_ENV=production', () => {
  const args = config.installCommand.trim().split(/\s+/);
  assert.equal(args[0], 'npm');
  assert.ok(['install', 'ci'].includes(args[1]));
  assert.ok(pkg.devDependencies?.sharp, 'the asset build depends on sharp');
  assert.ok(args.includes('--include=dev'), 'Vercel must explicitly include development build tools');
  assert.ok(!args.includes('--omit=dev'), 'do not omit sharp before the asset build');
  assert.ok(!args.includes('--omit=optional'), 'sharp native platform binaries must remain installable');
});

test('installed sharp can resize and encode/decode a WebP atlas sample', async () => {
  const { default: sharp } = await import('sharp');
  const sample = await sharp({
    create: { width: 16, height: 12, channels: 4, background: { r: 20, g: 100, b: 70, alpha: 0.5 } }
  }).resize(8, 6, { fit: 'fill', kernel: 'lanczos3' })
    .webp({ lossless: true, effort: 4 }).toBuffer();
  const metadata = await sharp(sample).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 8);
  assert.equal(metadata.height, 6);
  assert.equal(metadata.hasAlpha, true);
});
