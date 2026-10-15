const starFail = (code, message) => ({ ok: false, code, message });

export const STAR_ROSTER_IDS = Object.freeze([
  'ong_hang_pho', 'thay_mo', 'lac_yen', 'cung_thu_tre',
  'co_dao_ganh_hoi', 'phong_tu', 'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong',
  'thach_quyen', 'dinh_loi', 'luc_anh', 'to_diep', 'linh_dong', 'bach_dien', 'ky_van', 'tieu_phong', 'tich_dao'
]);

export const STAR_MAX = 6;

export function starUpCost(stars) {
  const n = Math.max(1, Math.floor(Number(stars) || 1));
  return 20 * Math.min(STAR_MAX, n);
}

export function heroStarCount(player, id) {
  const hero = player?.heroes?.[id];
  if (!hero?.owned) return 0;
  const n = Math.floor(Number(hero.stars) || 1);
  return Math.max(1, Math.min(STAR_MAX, n));
}

export function accountStarMasterLevel(player, ids = STAR_ROSTER_IDS) {
  let min = Infinity;
  for (const id of ids) {
    const hero = player?.heroes?.[id];
    if (!hero?.owned) return 0;
    min = Math.min(min, heroStarCount(player, id));
  }
  return min === Infinity ? 0 : min;
}

export function accountStarMasterProgress(player, ids = STAR_ROSTER_IDS) {
  const level = accountStarMasterLevel(player, ids);
  const next = level >= STAR_MAX ? STAR_MAX : Math.max(1, level + 1);
  let ready = 0;
  for (const id of ids) {
    if (heroStarCount(player, id) >= next) ready++;
  }
  return { level, next, ready, need: ids.length, max: STAR_MAX, active: level > 0 };
}

export function prepareStarUp(player, { id } = {}) {
  if (!STAR_ROSTER_IDS.includes(id) && !(player?.heroes && Object.prototype.hasOwnProperty.call(player.heroes, id))) {
    return starFail('INVALID_HERO', 'Tướng không hợp lệ.');
  }
  const hero = player?.heroes?.[id];
  if (!hero) return starFail('INVALID_HERO', 'Tướng không hợp lệ.');
  if (!hero.owned) return starFail('HERO_NOT_OWNED', 'Chưa sở hữu tướng này.');
  const stars = heroStarCount(player, id);
  if (stars >= STAR_MAX) return starFail('STAR_MAX', 'Đã đạt sao tối đa (6★).');
  const cost = starUpCost(stars);
  const have = Math.max(0, Number(player?.shards?.[id]) || 0);
  if (have < cost) return starFail('INSUFFICIENT_SHARDS', 'Không đủ mảnh hồn.');
  const heroes = { ...player.heroes, [id]: { ...hero, stars: stars + 1 } };
  const shards = { ...(player.shards || {}), [id]: have - cost };
  return { ok: true, heroes, shards, id, stars: stars + 1, spent: cost };
}

