import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd(), path = join(root, 'dist/index.html');
let html = readFileSync(path, 'utf8');
const freeMarker = 'P.freePullDay=today();persist();doSummonUI(1,true);renderSummon();';
if (!html.includes(freeMarker)) throw new Error('Free summon debit marker missing');
html = html.replace(freeMarker, 'if(!window.__HV_SUMMON_BANNER_READY())return; ' + freeMarker);
const domain = readFileSync(join(root, 'src/domain/summon/banner-validation.mjs'), 'utf8').replace(/^export\s+/gm, '');
const runtime = String.raw`
(() => {
  const validate = () => validateSummonBanner(GACHA.rates, poolOf);
  const message = 'Chiêu Mộ tạm khóa: danh sách tướng chưa khớp cấu hình triệu hồi. Ngọc, bảo hiểm và lượt miễn phí được giữ nguyên.';
  window.__HV_SUMMON_BANNER_READY = () => { const ok = validate().ok; if (!ok) toast(message); return ok; };
  doSummon = guardSummonCommand(doSummon, validate, () => toast(message));
  const baseFree = freePullAvailable;
  freePullAvailable = () => validate().ok && baseFree();
  const baseRender = renderSummon;
  renderSummon = function renderValidatedSummon() {
    baseRender();
    if (validate().ok) return;
    const body = document.getElementById('summonBody');
    const note = document.createElement('div');
    note.className = 'econ-panel'; note.id = 'summonConfigNotice'; note.setAttribute('role', 'status');
    note.textContent = message; body.prepend(note);
    body.querySelectorAll('#sum1,#sum10,#sumFree').forEach(button => {
      button.disabled = true; button.setAttribute('aria-describedby', note.id);
    });
    const freeBar = body.querySelector('#freeBar');
    if (freeBar) freeBar.textContent = 'Trạng thái lượt miễn phí được giữ nguyên.';
    body.querySelectorAll('.econ-hero .econ-copy,.econ-chips .econ-chip:nth-child(-n+2),.econ-grid > .econ-panel:first-child').forEach(el => { el.hidden = true; });
  };
  if (ST.screen === 'summon') renderSummon();
  else if (ST.screen === 'hub') renderHub();
})();`;
const body = '(()=>{\n' + domain + '\n' + runtime + '\n})();';
new Function(body);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Summon shell body end missing');
html = html.slice(0, end) + '<script id="summon-pool-guard-v1">' + body + '</script>\n' + html.slice(end);
writeFileSync(path, html);
console.log('Summon pool guard installed before paid/free debit; no economy changes');
