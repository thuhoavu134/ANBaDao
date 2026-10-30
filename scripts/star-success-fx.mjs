import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const runtime = readFileSync(join(process.cwd(), 'src/ui/star-success-fx.js'), 'utf8');
new Function(runtime);
let html = readFileSync(target, 'utf8');
if (html.includes('id="star-success-fx-js"')) throw new Error('Star success FX installed twice');
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('body end missing');
html = html.slice(0, end) + `<script id="star-success-fx-js">${runtime}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Star success FX installed: gold stars light up one by one, reward card suppressed for upgrades');
