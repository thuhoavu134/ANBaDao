import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const slotHonor = 'list.forEach(c=>{ const s=Number(c.slot); if(Number.isInteger(s)&&s>=0&&s<6&&!slots[s]) slots[s]=c; else spill.push(c); });';
const squadHonor = 'if(Number.isInteger(slot)&&slot>=0&&slot<6&&!usedSlots.has(slot)){ pick.slot=slot; usedSlots.add(slot); }';
if (!html.includes(slotHonor)) throw new Error('Campaign fixed slots: assignFormationSlots must honor unique saved slots');
if (!html.includes(squadHonor)) throw new Error('Campaign fixed slots: normalizeSquad must keep unique saved slots');
writeFileSync('dist/index.html', html);
console.log('Campaign fixed slots: unique saved slots kept through formation layout and save');
