// Owner 2026-10-25: 'khi Đình Lôi team địch atk thì nhân vật slot 2,3,4,5 quân ta bị chớp nháy'.
//
// Đình Lôi ships 14 atlases of 3840x2160 - 31.6 MiB each once decoded, 443 MiB in total. One of his actions pulls in
// idle + cast + projectile + impact + shield (~158 MiB), more than the whole iPhone atlas budget, so the shared cache
// evicts the idle pages of every hero on our side and they blink until re-decoded. The battle already had a phone path
// for him (__HV_DINH_LOI_MOBILE_ATLASES) but the table was empty and the draw call hard-coded the 480x270 cell, so it
// could never have worked.
//
// Here (last build step, after every anchor-based patch): on phones the seven GLOW sheets (projectile, impacts, wave,
// shield, ultimate field + impact) use half-size copies (assets/characters/dinh-loi/mobile, 7.9 MiB each). His BODY
// sheets stay full size - the owner does not accept softer heroes in battle. The draw reads the cell from the image
// actually loaded, so both sizes draw identically.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

export function installDinhLoiMobileAtlases(root) {
  const tablePath = join(root, 'assets', 'characters', 'dinh-loi', 'mobile', 'mobile-atlases.json');
  if (!existsSync(tablePath)) throw new Error('DINH_LOI_MOBILE: ' + tablePath + ' missing');
  const table = JSON.parse(readFileSync(tablePath, 'utf8'));
  const file = join(root, 'dist', 'battle.html');
  let html = readFileSync(file, 'utf8');
  if (html.includes('/* dinh-loi-mobile-v1 */')) return;
  // The asset step renames files with a content hash (basic-impact-atlas.0090860713c81885.png) and the battle looks
  // the phone copy up by that exact source, so key the table by the names the build actually wrote.
  const names = /DINH_LOI_ASSET_NAMES=Object\.freeze\((\{[^}]*\})\)/.exec(html);
  if (!names) throw new Error('DINH_LOI_MOBILE: DINH_LOI_ASSET_NAMES not found');
  const hashed = Object.values(JSON.parse(names[1].replace(/(\w+):/g, '"$1":')));
  const byHash = {};
  for (const [plain, entry] of Object.entries(table)) {
    const base = plain.split('/').pop().replace(/\.png$/, '');
    const file = hashed.find(f => f === base + '.png' || f.startsWith(base + '.'));
    if (!file) throw new Error('DINH_LOI_MOBILE: no built name for ' + base);
    byHash['assets/characters/dinh-loi/' + file] = entry;
  }
  const swaps = [
    ['__HV_DINH_LOI_MOBILE_ATLASES={};', '__HV_DINH_LOI_MOBILE_ATLASES=/* dinh-loi-mobile-v1 */' + JSON.stringify(byHash) + ';'],
    ['const sx=(frame%DINH_LOI_COLS)*DINH_LOI_CELL_W,sy=Math.floor(frame/DINH_LOI_COLS)*DINH_LOI_CELL_H;',
      'const cw=image.naturalWidth/DINH_LOI_COLS,ch=image.naturalHeight/8,sx=(frame%DINH_LOI_COLS)*cw,sy=Math.floor(frame/DINH_LOI_COLS)*ch;'],
    ['context.drawImage(image,sx,sy,DINH_LOI_CELL_W,DINH_LOI_CELL_H,', 'context.drawImage(image,sx,sy,cw,ch,'],
  ];
  for (const [from, to] of swaps) {
    const n = html.split(from).length - 1;
    if (n !== 1) throw new Error(`DINH_LOI_MOBILE: anchor found ${n}x: ${from.slice(0, 60)}`);
    html = html.replace(from, to);
  }
  writeFileSync(file, html);
  console.log(`Dinh Loi phone atlases: ${Object.keys(table).length} glow sheets at half size, body sheets untouched`);
}
