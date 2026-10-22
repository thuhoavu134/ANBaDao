// Pure parts of SFX sourcing: which role comes from which clip, the source priority, keyword matching for the
// local Pixabay library, and the todo list for sounds nothing could supply. scripts/hero/sfx-source.mjs does the I/O.
//
// Priority per role (owner decision 22/10/2026): the owner's own clip audio wins; then the Kiếm Thế SKILLPACK;
// then the local Pixabay library (downloaded by the agent through the browser, since the pipeline has no browser);
// then a todo row so nothing is silently dropped.

export const ROLES = [
  { role: 'basic', label: 'atk', hints: ['danh thuong', 'chem', 'kiem', 'dao'] },
  { role: 'basic-hit', label: 'vfx-basic', hints: ['trung', 'va cham', 'impact'] },
  { role: 'ultimate', label: 'ultimate', hints: ['tuyet ky', 'tuyet chieu', 'no'] },
  { role: 'ultimate-vfx', label: 'vfx-ultimate', hints: ['bung no', 'explosion', 'no'] },
  { role: 'ultimate-hit', label: 'vfx-ultimate', hints: ['trung', 'impact'] },
  { role: 'hit', label: 'hit', hints: ['trung don', 'dau', 'impact'] },
  { role: 'passive', label: 'vfx-passive', hints: ['noi tai', 'passive', 'buff'] },
];

export const ELEMENT_HANH = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
export const ROLE_SUFFIX = { basic: 'c', ultimate: 'c', 'basic-hit': 'f', 'ultimate-hit': 'f', 'ultimate-vfx': 'f', passive: 'c' };

const strip = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** The section the hero belongs to: an explicit brief pin, else the sect whose element matches `he`, else public. */
export function sectFor(brief, sects = {}) {
  if (brief?.sfx?.sect) return String(brief.sfx.sect);
  const hanh = ELEMENT_HANH[String(brief?.he || '').toLowerCase()];
  if (hanh) for (const [code, info] of Object.entries(sects)) if (strip(info?.hanh) === strip(hanh)) return code;
  return 'public';
}

/** Codes pinned in the brief win: `sfx.<role>` then `kit.<slot>.sfx` (basic -> kit.basic, ultimate -> kit.ultimate). */
export function pinnedCode(brief, role) {
  const direct = brief?.sfx?.[role];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const slot = role.startsWith('ultimate') ? 'ultimate' : role.startsWith('basic') ? 'basic' : role === 'passive' ? 'passive' : null;
  const fromKit = slot && brief?.kit?.[slot]?.sfx;
  return typeof fromKit === 'string' && fromKit.trim() ? fromKit.trim() : null;
}

/** Search words for one role: the brief's own names first (they describe the sound), then the role hints. */
export function keywordsFor(brief, role) {
  const r = ROLES.find(x => x.role === role);
  const words = [];
  for (const slot of ['passive', 'basic', 'ultimate']) {
    const name = brief?.kit?.[slot]?.name;
    if (name && (slot === 'passive') === (role === 'passive')) words.push(name);
    else if (name && role.startsWith(slot)) words.push(name);
  }
  if (brief?.name) words.push(brief.name);
  return [...new Set([...words, ...(r?.hints || []), role].map(strip).filter(Boolean))];
}

/** Skillpack SFX codes for a sect, best first: exact role suffix, then any code of that sect, then public. */
export function kiemtheCandidates(skillpack, { sect, role }) {
  const list = (skillpack?.sfx || []).filter(e => e?.ma);
  const suffix = ROLE_SUFFIX[role] || 'c';
  const rank = e => (e.phai === sect ? 0 : e.phai === 'public' ? 1 : 2);
  return list
    .filter(e => e.phai === sect || e.phai === 'public')
    .sort((a, b) => rank(a) - rank(b)
      || Number(b.ma.endsWith('_' + suffix)) - Number(a.ma.endsWith('_' + suffix))
      || a.ma.localeCompare(b.ma));
}

/** Best entry in the local Pixabay library ({items:[{file, tags:[...]}]}) for these keywords, or null. */
export function pickFromPixabay(index, keywords) {
  const items = index?.items || [];
  let best = null;
  for (const it of items) {
    if (!it?.file || !Array.isArray(it.tags)) continue;
    const tags = it.tags.map(strip);
    const score = keywords.reduce((n, k) => n + (tags.some(t => t === k) ? 2 : tags.some(t => t.includes(k) || k.includes(t)) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score || (score === best.score && it.file < best.file))) best = { ...it, score };
  }
  return best;
}

/**
 * Decide one role. `have` = a file already produced from the clip (kept). Returns
 * {action:'keep'|'kiemthe'|'pixabay'|'todo', ...}. Deterministic: same inputs, same choice.
 */
export function planRole(role, { have, brief, sects, skillpack, pixabayIndex, used = new Set() } = {}) {
  if (have) return { action: 'keep', file: have };
  const pinned = pinnedCode(brief, role);
  if (pinned) return { action: 'kiemthe', code: pinned, why: 'ghim trong brief' };
  const sect = sectFor(brief, sects);
  const cand = kiemtheCandidates(skillpack, { sect, role }).find(e => !used.has(e.ma));
  if (cand) return { action: 'kiemthe', code: cand.ma, sect, why: `kho Kiếm Thế, phái ${sect}` };
  const hit = pickFromPixabay(pixabayIndex, keywordsFor(brief, role));
  if (hit) return { action: 'pixabay', file: hit.file, why: `thư viện Pixabay, khớp ${hit.tags.join('/')}` };
  return { action: 'todo', keywords: keywordsFor(brief, role).slice(0, 4), why: 'không nguồn nào có' };
}

/** Rows for C:/lt/packs/<slug>/sfx-todo.json — what the agent must download through the browser. */
export function todoRows(plans) {
  return Object.entries(plans).filter(([, p]) => p.action === 'todo')
    .map(([role, p]) => ({ role, search: p.keywords, target: `assets/audio/sfx/_pixabay/ (rồi ghi index.json với tags)`, why: p.why }));
}

/** hero-doctor needs at least one cue for basic and one for ultimate. */
export function coverage(cues) {
  const keys = Object.keys(cues || {});
  const basic = keys.some(c => c.endsWith('-basic') || c.endsWith('-basic-hit'));
  const ultimate = keys.some(c => c.endsWith('-ultimate') || c.endsWith('-ultimate-vfx') || c.endsWith('-ultimate-hit'));
  return { basic, ultimate, ok: basic && ultimate };
}
