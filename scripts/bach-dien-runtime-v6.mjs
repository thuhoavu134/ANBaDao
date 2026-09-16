import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const target = readFileSync(join(root, 'dist', 'battle.html'), 'utf8');
const marker = '/* TKT-0154 Bạch Diện Canvas Sprite Runtime */';
if (!target.includes(marker)) {
  throw new Error('Canonical Bạch Diện runtime owner missing from generated battle');
}
console.log('Bạch Diện Extreme v6 uses canonical Canvas Sprite Runtime owner');
