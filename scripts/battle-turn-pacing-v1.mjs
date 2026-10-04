import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function patchBattleTurnPacing(html) {
  if (html.includes('/* HV_BATTLE_TURN_PACING_V1 */')) return html;
  const once = (from, to) => {
    if (html.split(from).length !== 2) throw new Error('Turn pacing anchor: ' + from.slice(0, 100));
    html = html.replace(from, () => to);
  };
  // Only scheduler dead time changes. Character/VFX/SFX clocks and recovery
  // completion still own when the current action is allowed to finish.
  once('  const TIMING = Object.freeze({', '  /* HV_BATTLE_TURN_PACING_V1 */\n  const TIMING = Object.freeze({');
  once('    turnReveal: 360,', '    turnReveal: 40,');
  once('    enemyThink: 300,', '    enemyThink: 0,');
  once('    actionAnnounce: 300,', '    actionAnnounce: 60,');
  once('    turnRest: 480', '    turnRest: 80');
  once('const ongPhoSkillAnnounce = isOngPho(actor) && (action === "skill" || action === "ultimate") ? 140 : TIMING.actionAnnounce;',
    'const ongPhoSkillAnnounce = TIMING.actionAnnounce;');
  once('        // v3.16.9: small post-action breathing room prevents the next turn from visually\n        // stepping on the last recovery pose/VFX without changing combat math.\n        if(!await sleepVisualMilliseconds(120,battleId))return;',
    '        // Authored recovery has completed; the scheduler owns the next-turn gap.');
  return html;
}

export function installBattleTurnPacing(root) {
  const file = join(root, 'dist', 'battle.html');
  writeFileSync(file, patchBattleTurnPacing(readFileSync(file, 'utf8')));
}
