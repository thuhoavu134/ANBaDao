// Convert a concept PNG to webp for Lục Thần UI art.
// Usage: node scripts/hero/concept-to-webp.mjs <input.png> <output.webp> [quality]
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const [input, output, q] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/hero/concept-to-webp.mjs <input.png> <output.webp> [quality]');
  process.exit(1);
}
const quality = Number(q) || 88;
if (!fs.existsSync(input)) {
  console.error('missing input: ' + input);
  process.exit(1);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
const info = await sharp(input).webp({ quality, effort: 6 }).toFile(output);
console.log(JSON.stringify({
  output,
  width: info.width,
  height: info.height,
  size: info.size,
  quality
}));
