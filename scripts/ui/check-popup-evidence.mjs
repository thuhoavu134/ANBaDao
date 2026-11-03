import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const file=process.argv[2];assert(file,'Usage: node scripts/ui/check-popup-evidence.mjs <manifest.json>');
const root=process.cwd(),m=JSON.parse(fs.readFileSync(file,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(m.status,'PASS','Failed capture cannot be presented as passing evidence');
assert.equal(hash(path.join(root,'dist/index.html')),m.buildSha256,'Build changed after capture');
for(const [p,h] of Object.entries(m.sourceHashes))assert.equal(hash(path.join(root,p)),h,'Source changed: '+p);
assert(m.images.length>=9,'Expected 3 screens at 3 widths');
for(const i of m.images){assert.equal(hash(path.join(root,i.file)),i.sha256,'Stale/changed image: '+i.file);assert(Date.parse(i.capturedAt)>=Date.parse(m.startedAt),'Image predates run');}
assert(m.checks.every(c=>c.ok),'Failed checks');
console.log('PASS: current build, sources, screenshots and checks match manifest. Visual approval and physical Safari remain separate.');
