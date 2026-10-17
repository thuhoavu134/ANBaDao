import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function patchBattleDefeatExit(html) {
  if (html.includes('/* HV_BATTLE_DEFEAT_EXIT_V1 */')) return html;
  const once = (from, to) => {
    if (html.split(from).length !== 2) throw new Error('Defeat exit anchor: ' + from.slice(0,100));
    html = html.replace(from, () => to);
  };
  once('  function drawUnit(context, unit, time) {', `  /* HV_BATTLE_DEFEAT_EXIT_V1 */
  function drawUnit(context, unit, time) {
    if (!unit || (unit.hp <= 0 && !defeatState(unit, time).visible)) return;`);
  once(`    return Core.defeatAnimation(
      Math.max(0, time - unit.defeatedAt),
      unit.defeatHideDuration || defeatDuration(DEFEAT_HIDE_MS),
      unit.defeatFallDuration || defeatDuration(DEFEAT_FALL_MS)
    );`, `    const elapsed = Math.max(0, time - unit.defeatedAt);
    const duration = unit.defeatFallDuration || defeatDuration(DEFEAT_FALL_MS);
    // Play the fall once at full opacity, then remove the battlefield body.
    return { visible: elapsed < duration, fallProgress: Core.clamp(elapsed / duration, 0, 1), alpha: 1 };`);
  once("    const authoredFallMs=isOngPho(unit)?ONG_PHO_FALL_MS:isDinhLoi(unit)?DINH_LOI_FALL_MS:isLinhDong(unit)?linhDongActionMs('fall'):isBachDien(unit)?bachDienActionMs('fall'):DEFEAT_FALL_MS;", `    unit.defeatFallPlaybackRate = isLucAnh(unit) ? lucAnhPlaybackRate() : 1;
    const authoredFallMs=isOngPho(unit)?ONG_PHO_FALL_MS:isDinhLoi(unit)?DINH_LOI_FALL_MS:isLinhDong(unit)?linhDongActionMs('fall'):isBachDien(unit)?bachDienActionMs('fall'):isThayMoAuthored(unit)?4000:isLucAnh(unit)?LUC_ANH_META.defeated.frames*LUC_ANH_META.defeated.ms/unit.defeatFallPlaybackRate:DEFEAT_FALL_MS;`);
  once('    unit.defeatHideDuration = defeatDuration((isOngPho(unit)||isDinhLoi(unit)) ? authoredFallMs + 180 : DEFEAT_HIDE_MS);',
    '    unit.defeatHideDuration = defeatDuration(authoredFallMs);');
  // Lục Ảnh's painter uses a speed multiplier. Freeze it for this fall so a
  // speed-toggle cannot leave a final-frame corpse or cut the clip short.
  once('elapsed=rawElapsed*lucAnhPlaybackRate(),frame=lucAnhFrame(key,elapsed,loop);',
    'elapsed=rawElapsed*(unit.hp<=0?(unit.defeatFallPlaybackRate||lucAnhPlaybackRate()):lucAnhPlaybackRate()),frame=lucAnhFrame(key,elapsed,loop);');
  return html;
}

export function installBattleDefeatExit(root) {
  const file = join(root, 'dist', 'battle.html');
  writeFileSync(file, patchBattleDefeatExit(readFileSync(file, 'utf8')));
}

