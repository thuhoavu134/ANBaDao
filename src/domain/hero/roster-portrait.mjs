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
  'assets/characters/be-an/avatar.webp':[51,45,23], // FIX 20261018: was 12 (~316% zoom on a low-res source); re-measured against the hi-res 3x avatar re-export, matches hong-thuong's cheek-width scale.
  'assets/characters/khaos/avatar.webp':[71,58,17], // Measured 2026-10-19 on 512px avatar: blindfold centre (364,298), cheek width ~86px. Authored blindfold; do not paint eyes.
  'assets/characters/co-nuong/avatar.webp':[58,33,17],
  'assets/characters/tich-dao/roster-open-eyes.webp':[64,33,22],
  'assets/heroes-concept/crops/duelist-00.png':[71,21,13],
  'assets/heroes-concept/crops/guardian-00.png':[58,23,13],
  'assets/heroes-concept/crops/healer-00.png':[59,19,12],
  'assets/heroes-concept/crops/mystic-00.png':[59,22,11],
  'assets/heroes-concept/crops/ranger-00.png':[60,24,12],
  'assets/heroes-concept/crops/striker-00.png':[62,22,14]
});

export function rosterPortraitSource(id, source) {
  return id === 'tich_dao' ? 'assets/characters/tich-dao/roster-open-eyes.webp' : source;
}

export function rosterPortraitStyle(source) {
  const point = ROSTER_PORTRAIT_LANDMARKS[source];
  // Keep unreviewed art visible without inventing a face position.
  if (!point) return '';
  const [x,y,width] = point;
  return `--portrait-width:${100*ROSTER_PORTRAIT_STANDARD.faceWidth/width}%;--portrait-x:${-x}%;--portrait-y:${-y}%;`;
}
