import { summarizeRosterCapacity } from './roster-plan.mjs';

// A read model, not a second save. Every visible number comes from the player.
export function buildRosterView({ ids, heroes, player, powerFor, portraitFor,
  element = 'all', scope = 'owned', sort = 'default' }) {
  const official = [...new Set(ids)].filter(id => heroes[id]);
  const squad = new Set((player.squad || []).map(slot => slot && slot.id));
  const cards = official.map(id => {
    const hero = heroes[id], saved = player.heroes?.[id];
    const owned = saved?.owned === true;
    return { id, name: hero.name, shortName: hero.name.split(' — ')[0],
      element: hero.he, role: hero.role, rarity: hero.rarity.toUpperCase(),
      owned, level: owned ? (saved.level || 1) : null,
      stars: owned ? (saved.stars || 1) : 0,
      power: owned ? powerFor(id) : 0,
      portrait: portraitFor(id), inSquad: owned && squad.has(id) };
  });
  const visible = cards.filter(card => (scope !== 'owned' || card.owned) &&
    (element === 'all' || card.element === element));
  if (sort === 'power') visible.sort((a, b) => b.power - a.power);
  if (sort === 'level') visible.sort((a, b) => (b.level || 0) - (a.level || 0));
  if (sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const catalog = summarizeRosterCapacity({ ids, heroes });
  return { cards: visible, total: cards.length,
    owned: cards.filter(card => card.owned).length,
    squadPower: cards.filter(card => card.inSquad).reduce((sum, card) => sum + card.power, 0),
    gold: player.gold, gems: player.gems, catalog };
}
