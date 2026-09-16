import { summarizeRosterCapacity } from './roster-plan.mjs';

export const LINH_DONG_ROSTER_PREVIEW = Object.freeze({
  id: 'linh_dong',
  name: 'Linh Đồng',
  shortName: 'Linh Đồng',
  element: 'mong',
  role: 'Pháp sư / Khống chế',
  rarity: 'SSR',
  owned: true,
  level: 1,
  stars: 1,
  power: 0,
  portrait: 'assets/characters/linh-dong/card.webp',
  inSquad: false,
  preview: true
});

export const BACH_DIEN_ROSTER_PREVIEW = Object.freeze({
  id: 'bach_dien',
  name: 'Bạch Diện',
  shortName: 'Bạch Diện',
  element: 'soul',
  role: 'Sát thủ phép',
  rarity: 'S+',
  owned: true,
  level: 1,
  stars: 1,
  power: 0,
  portrait: 'assets/characters/bach-dien/card.webp',
  inSquad: false,
  preview: true
});

function normalizeExtra(card, portraitFor) {
  if (!card || !card.id) return null;
  const portrait = card.portrait || (portraitFor ? portraitFor(card.id) : '');
  return {
    id: card.id,
    name: card.name,
    shortName: card.shortName || String(card.name || '').split(' — ')[0],
    element: card.element,
    role: card.role,
    rarity: String(card.rarity || 'SSR').toUpperCase(),
    owned: card.owned === true,
    level: card.owned === true ? (card.level || 1) : null,
    stars: card.owned === true ? (card.stars || 1) : 0,
    power: card.owned === true ? (Number(card.power) || 0) : 0,
    portrait,
    inSquad: false,
    preview: true
  };
}

// A read model, not a second save. Every visible number comes from the player.
export function buildRosterView({ ids, heroes, player, powerFor, portraitFor,
  element = 'all', scope = 'owned', sort = 'default', extras = [] }) {
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
  const extraCards = (Array.isArray(extras) ? extras : [])
    .map(card => normalizeExtra(card, portraitFor))
    .filter(Boolean)
    .filter(card => !official.includes(card.id));
  const combined = extraCards.concat(cards);
  const visible = combined.filter(card => (scope !== 'owned' || card.owned) &&
    (element === 'all' || card.element === element));
  if (sort === 'power') visible.sort((a, b) => b.power - a.power);
  if (sort === 'level') visible.sort((a, b) => (b.level || 0) - (a.level || 0));
  if (sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const catalog = summarizeRosterCapacity({ ids, heroes });
  return { cards: visible, total: combined.length,
    owned: combined.filter(card => card.owned).length,
    squadPower: cards.filter(card => card.inSquad).reduce((sum, card) => sum + card.power, 0),
    gold: player.gold, gems: player.gems, catalog };
}
