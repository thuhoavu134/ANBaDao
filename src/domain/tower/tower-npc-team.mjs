export const TOWER_NPC_ROSTER_12 = Object.freeze([
  'ong_hang_pho',
  'thay_mo',
  'lac_yen',
  'cung_thu_tre',
  'co_dao_ganh_hoi',
  'phong_tu',
  'thuy_nuong_roi_nuoc',
  'hong_lien_dao_nuong',
  'thach_quyen',
  'dinh_loi',
  'luc_anh',
  'to_diep'
]);

export const TOWER_NPC_HM = 0.12;
export const TOWER_NPC_AM = 0.09;
export const TOWER_NPC_DM = 0.05;

function npcInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export function uniqueTowerNpcCombatants(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter(unit => {
    const id = String(unit?.sourceHeroId || unit?.id || unit?.uid || '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildTowerNpcTeam({ floor = 1, rosterIds, heroes = {} } = {}) {
  const f = Math.max(1, npcInt(floor, 1));
  const raw = Array.isArray(rosterIds) && rosterIds.length ? rosterIds : TOWER_NPC_ROSTER_12;
  const unique = [...new Set(raw.map(id => String(id || '')).filter(Boolean))];
  if (unique.length < 6) {
    throw new Error('tower npc roster needs 6 unique ids');
  }
  const start = (f - 1) % unique.length;
  const picked = [];
  for (let i = 0; i < 6; i++) picked.push(unique[(start + i) % unique.length]);
  const hm = 1 + (f - 1) * TOWER_NPC_HM;
  const am = 1 + (f - 1) * TOWER_NPC_AM;
  const dm = 1 + (f - 1) * TOWER_NPC_DM;
  const bossFloor = f % 5 === 0;
  const units = picked.map((heroId, i) => {
    const hero = heroes[heroId] && typeof heroes[heroId] === 'object' ? heroes[heroId] : {};
    const st = hero.stats && typeof hero.stats === 'object' ? hero.stats : { hp: 620, atk: 96, def: 44, spd: 90 };
    const isBoss = bossFloor && i === 0;
    return {
      id: 'tw' + (i + 1) + '_' + heroId,
      sourceHeroId: heroId,
      name: isBoss ? ('Chúa Tầng ' + f) : (hero.name ? ('Bóng ' + hero.name) : ('Bóng Tầng ' + f)),
      col: hero.col || '#7a7fb0',
      row: i < 3 ? 'front' : 'back',
      role: hero.role || 'NPC',
      he: hero.he || 'vo',
      skill: hero.skill || null,
      ultimate: hero.ultimate || null,
      stats: {
        hp: Math.round(npcInt(st.hp, 620) * hm * (isBoss ? 2.2 : 1)),
        atk: Math.round(npcInt(st.atk, 96) * am * (isBoss ? 1.2 : 1)),
        def: Math.round(npcInt(st.def, 44) * dm * (isBoss ? 1.15 : 1)),
        spd: npcInt(st.spd, 90) + Math.min(30, f)
      }
    };
  });
  return uniqueTowerNpcCombatants(units);
}
