import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const economy = readFileSync(join(process.cwd(), 'src/domain/economy/balance.mjs'), 'utf8')
  .replace(/^export \{ fail \};$/m, '').replace(/^export /gm, '');
const domain = economy + '\n' + readFileSync(join(process.cwd(), 'src/domain/daily/daily-run.mjs'), 'utf8')
  .replace(/^import \{ DAILY_DRIP, WEEKLY_DRIP, applyDripTable \} from '\.\.\/economy\/balance\.mjs';\n/m, '')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/daily-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/daily-screen.css'), 'utf8');
new Function(domain);
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-daily-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-daily-js">[\s\S]*?<\/script>\n?/, '');
// Progress counters and hub badges must use the same saved assignment as claim.
// Keep the existing counter functions/transaction owner; only resolve their data.
if (!html.includes('/* HV_DAILY_DEFINITION_OWNER_V1 */')) {
  if (!html.includes('function questProgress(') || !html.includes('function weeklyProgress(')) {
    throw new Error('Daily/weekly progress owners missing');
  }
  html = html.replaceAll('DATA.daily.quests.find(x=>x.id===q.id)',
    '(window.HonVietDailyQuests?.daily(P,q.id)||DATA.daily.quests.find(x=>x.id===q.id))');
  html = html.replaceAll('WEEKLY_QUESTS.find(x=>x.id===q.id)',
    '(window.HonVietDailyQuests?.weekly(P,q.id)||WEEKLY_QUESTS.find(x=>x.id===q.id))');
  html = html.replace('function questProgress(', '/* HV_DAILY_DEFINITION_OWNER_V1 */\nfunction questProgress(');
}
html = html.replace('</head>', `<style id="hv-daily-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Daily shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-daily-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Daily lacquer screen installed');
