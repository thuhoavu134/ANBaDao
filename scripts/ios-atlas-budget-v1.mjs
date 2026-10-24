// Owner 2026-10-25: full-quality idle in battle, no downscaled atlases.
//
// A phone draws a hero at ~290 DEVICE pixels (canvas 1170 px wide for a 390 px viewport at DPR 3), so a half-size idle
// page is visibly soft - that idea is dropped. The real constraint was the decoded-image budget: iOS got
// 64 MiB - 19.3 MiB reserve = 44.7 MiB, while six full idle pages are ~39 MiB, so an action page always evicted an idle
// one and the hero blinked for a frame. 144 MiB (- the same reserve) holds the six idle pages plus the action working set
// with room to spare, and it is well inside what an iPhone keeps for decoded images.
//
// This runs LAST, after every other patch has matched its own anchor on the original text.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const FROM = 'maxBytes=(__hvNativeLowMemoryIOS?64*1024*1024:128*1024*1024)-20275200';
const TO = 'maxBytes=(__hvNativeLowMemoryIOS?144*1024*1024:128*1024*1024)-20275200';

export function raiseIosAtlasBudget(root) {
  let touched = 0;
  for (const file of ['battle.html']) {
    const path = join(root, 'dist', file);
    if (!existsSync(path)) continue;
    const html = readFileSync(path, 'utf8');
    if (!html.includes(FROM)) continue;
    writeFileSync(path, html.split(FROM).join(TO));
    touched++;
  }
  if (!touched) throw new Error('IOS_ATLAS_BUDGET: anchor not found in dist');
  console.log('iOS atlas budget raised to 144 MiB (full-quality idle, no flicker)');
  return touched;
}
