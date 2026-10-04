// Encounter stats own difficulty; roster definitions own identity and skills.
export function rosterEnemy(def, roster, seed = '') {
  const ids = Object.keys(roster || {});
  if (!def || !ids.length) return def;
  const source = def.sourceHeroId || def.heroId || def.id;
  if (roster[source]) return def;
  let hash = 0;
  for (const char of String(seed || def.id || def.name || 'enemy')) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const heroId = ids[hash % ids.length], hero = roster[heroId];
  return { ...def, sourceHeroId: heroId, heroId, name: 'Tàn Ảnh · ' + hero.name,
    col: hero.col, he: hero.he, archetype: hero.archetype, role: hero.role,
    skill: hero.skill, ultimate: hero.ultimate, stats: { ...def.stats },
    huntForm: null, huntScale: 1, rosterEnemy: true };
}
