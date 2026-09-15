import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();

const origin = process.env.BBR_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L146-LINH-DONG-SPLUS-CLOCK');
mkdirSync(out, { recursive: true });
const chrome = process.env.HV_CHROME || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

const browser = await chromium.launch({
  executablePath: chrome,
  args: ['--no-sandbox', '--disable-web-security']
});
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));

await page.goto(`${origin}/battle.html?qaSplus42=hero_splus_linh_dong`, {
  waitUntil: 'domcontentloaded',
  timeout: 45000
});
await page.waitForSelector('#gameCanvas', { timeout: 20000 });
await page.waitForFunction(() => {
  const qa = window.__HV_LINH_DONG_QA;
  return qa && typeof qa === 'object' && typeof qa.force === 'function' && typeof qa.snapshot === 'function';
}, { timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: join(out, 'idle-390x844.png') });

const probe = await page.evaluate(async () => {
  const qa = window.__HV_LINH_DONG_QA;
  const qaKind = qa == null ? String(qa) : Array.isArray(qa) ? 'array' : typeof qa;
  const keys = qa && typeof qa === 'object' ? Object.keys(qa).sort() : [];
  const timeline = typeof qa?.timeline === 'function' ? qa.timeline('atk') : qa?.timeline;
  const src = document.documentElement.innerHTML;
  const sourceHasTwoSlotBar = /isLinhDong\(actor\)\?\['passive','ultimate'\]/.test(src);
  const sourceHasClock = /waitLinhDongMarker\(linhAction,'release'/.test(src)
    && /emitLinhDongRelease\(linhAction\)/.test(src)
    && /waitLinhDongMarker\(linhAction,'impact'/.test(src)
    && /waitLinhDongMarker\(linhAction,'recovery:end'/.test(src)
    && !/sleep\(linh\?linhDur/.test(src);
  const readStrip = () => ({
    actorId: document.getElementById('splus-battle-skills')?.dataset.actorId || null,
    slots: [...document.querySelectorAll('#splus-battle-skills [data-splus-skill]')].map(node => node.dataset.splusSkill)
  });
  const samples = [];
  const timer = setInterval(() => samples.push(readStrip()), 40);
  const t0 = performance.now();
  const started = await qa.force('atk');
  const wallMs = performance.now() - t0;
  clearInterval(timer);
  samples.push(readStrip());
  const linhStrip = samples.find(sample => String(sample.actorId || '').includes('linh_dong')) || null;
  return {
    qaKind,
    keys,
    started,
    wallMs,
    sourceHasTwoSlotBar,
    sourceHasClock,
    idleStrip: samples[0] || readStrip(),
    linhStrip,
    afterStrip: samples.at(-1) || readStrip(),
    atkRelease: timeline?.releaseMs ?? null,
    atkImpact: timeline?.impactMs ?? null,
    atkRecovery: timeline?.recoveryEndMs ?? null
  };
});
await page.screenshot({ path: join(out, 'atk-390x844.png') });
await browser.close();

const appErrors = errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text));
const atkNotScaled = probe.wallMs > 1200 && probe.wallMs < 2200;
const qaObject = probe.qaKind === 'object'
  && probe.keys.includes('force')
  && probe.keys.includes('snapshot')
  && probe.keys.includes('timeline');
const noSkill1 = probe.sourceHasTwoSlotBar && Array.isArray(probe.linhStrip?.slots)
  && probe.linhStrip.slots.includes('passive')
  && probe.linhStrip.slots.includes('ultimate')
  && !probe.linhStrip.slots.includes('skill');
const ok = qaObject && atkNotScaled && noSkill1 && probe.sourceHasClock && appErrors.length === 0
  && probe.atkRelease === 420 && probe.atkImpact === 1320 && probe.atkRecovery === 1496;

const evidence = {
  ticket: 'TKT-0146',
  viewport: '390x844',
  url: '/battle.html?qaSplus42=hero_splus_linh_dong',
  probe,
  appErrors,
  atkNotScaled,
  qaObject,
  noSkill1,
  ok,
  safariIphone: 'NOT_RUN',
  ts: new Date().toISOString()
};
writeFileSync(join(out, 'browser-390.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(ok ? 'PASS' : 'FAIL', 'L146-P1', JSON.stringify({
  wallMs: Math.round(probe.wallMs),
  qaKind: probe.qaKind,
  keys: probe.keys,
  linhStrip: probe.linhStrip,
  sourceBar: probe.sourceHasTwoSlotBar,
  err: appErrors[0] || ''
}));
process.exit(ok ? 0 : 1);
