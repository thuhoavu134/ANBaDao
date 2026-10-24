// Source-normalized eye centre and cheek width, reviewed on the actual artwork.
// These are landmarks, not independent per-hero display sizes.
export const ROSTER_PORTRAIT_STANDARD = Object.freeze({eyeX:50, eyeY:34, faceWidth:38});
export const ROSTER_PORTRAIT_LANDMARKS = Object.freeze({
  'assets/characters/bach-dien/card.webp':[55,17,13], // Authored mask; do not paint eyes onto it.
  'assets/characters/linh-dong/card.webp':[60,29,22],
  'assets/characters/luc-anh/card.webp':[69,31,17],
  'assets/characters/ong-pho/card.png':[71,35,23],
  'assets/characters/ky-van/avatar.webp':[73,25,31],
  'assets/characters/tieu-phong/avatar.webp':[71,26,29],
  'assets/characters/hong-thuong/avatar.webp':[50,41,23],
  'assets/characters/be-an/avatar.webp':[54,45,9], // Re-measured 2026-10-24 on the current 1056x672 avatar with a 1% grid: eye centre (54,45), cheek-to-cheek ~9%. The previous 23 made the card show her whole body tiny (owner: "từ bé An trở đi ảnh đại diện không đúng khuôn khổ").
  'assets/characters/khaos/avatar.webp':[71,58,17], // Measured 2026-10-19 on 512px avatar: blindfold centre (364,298), cheek width ~86px. Authored blindfold; do not paint eyes.
  'assets/characters/co-nuong/avatar.webp':[58,33,17],
  'assets/characters/tich-dao/roster-open-eyes.webp':[64,33,22],
  'assets/heroes-concept/crops/duelist-00.png':[71,21,13],
  'assets/heroes-concept/crops/guardian-00.png':[58,23,13],
  'assets/heroes-concept/crops/healer-00.png':[59,19,12],
  'assets/heroes-concept/crops/mystic-00.png':[59,22,11],
  'assets/heroes-concept/crops/ranger-00.png':[60,24,12],
  'assets/heroes-concept/crops/striker-00.png':[62,22,14],
  // Pipeline portraits (idle frame 0, full body) measured 2026-10-24 on a 1% grid of the actual file. The hash in the
  // file name changes on every re-pack while the frame geometry does not, so they are keyed by portrait-*.webp.
  // Before re-using a value after a re-pack, check the silhouette bbox is unchanged (scripts/hero/portrait-grid.mjs).
  'assets/characters/bach-y-van-phong/portrait-*.webp':[50,21,15], // Authored blindfold: centre of the band; do not paint eyes.
  'assets/characters/khaos/portrait-*.webp':[62,27,11], // Authored blindfold (same as avatar.webp rule).
  'assets/characters/nguyet-diep/portrait-*.webp':[63,24,14],
  'assets/characters/tinh-mac/portrait-*.webp':[54,30,11], // Authored blindfold, 3/4 profile.
  'assets/characters/lang-van/portrait-*.webp':[62,29,13],
  'assets/characters/lang-tieu/portrait-*.webp':[59,29,12],
  'assets/characters/lang-nguyet/portrait-*.webp':[59,30,13],
  'assets/characters/tieu-linh/portrait-*.webp':[60,31,10],
  'assets/characters/lang-chan/portrait-*.webp':[67,30,15]
});

// Exact path first, then the hash-agnostic portrait-*.webp key of the same hero folder.
export function rosterPortraitLandmark(source) {
  if (!source) return null;
  return ROSTER_PORTRAIT_LANDMARKS[source] ||
    ROSTER_PORTRAIT_LANDMARKS[String(source).replace(/portrait-[0-9a-f]+\.webp$/, 'portrait-*.webp')] || null;
}

export function rosterPortraitSource(id, source) {
  return id === 'tich_dao' ? 'assets/characters/tich-dao/roster-open-eyes.webp' : source;
}

export function rosterPortraitStyle(source) {
  const point = rosterPortraitLandmark(source);
  // Keep unreviewed art visible without inventing a face position.
  if (!point) return '';
  const [x,y,width] = point;
  return `--portrait-width:${100*ROSTER_PORTRAIT_STANDARD.faceWidth/width}%;--portrait-x:${-x}%;--portrait-y:${-y}%;`;
}
