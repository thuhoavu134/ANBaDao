import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch {}
  try { return require('/workspace/node_modules/playwright'); } catch {}
  throw new Error('playwright missing');
})();
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const origin = process.env.BBR_QA_ORIGIN || 'http://127.0.0.1:8080';
const out = join(process.cwd(), 'docs/qa/L158-BATTLE-ENTER-AUDIO');
mkdirSync(out, { recursive: true });

const distIndex = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8');
const distBattle = readFileSync(join(process.cwd(), 'dist', 'battle.html'), 'utf8');
const open = distIndex.slice(
  distIndex.indexOf('function openIntegratedBattle'),
  distIndex.indexOf('function syncResultIntoMongGioi')
);
const fallback = distIndex.slice(
  distIndex.indexOf('activeBattle.enterFallback = setTimeout'),
  distIndex.indexOf('activeBattle.enterFallback = setTimeout') + 420
);
const begin = distBattle.slice(
  distBattle.indexOf('function beginBattle()'),
  distBattle.indexOf('function beginBattle()') + 900
);
const hush = distIndex.slice(
  distIndex.indexOf('function hushParentBgm()'),
  distIndex.indexOf('function hushParentBgm()') + 220
);

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', err => errors.push(String(err)));
page.on('crash', () => errors.push('page-crash'));

await page.goto(origin + '/?qa=unlock-all', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(800);
const btn = page.locator('#hvLoginContinue');
if (await btn.count()) await btn.click({ force: true }).catch(() => {});
await page.evaluate(() => {
  const root = document.getElementById('hvLoginRoot');
  if (root) { root.hidden = true; root.classList.remove('is-open'); }
  document.getElementById('__mgDiag')?.remove();
});
await page.mouse.click(200, 420);
await page.evaluate(() => {
  try { window.HonVietSfx?.unlock?.(); } catch (_) {}
  try { window.HonVietAudio?.unlock?.(); } catch (_) {}
  try { window.HonVietSfx?.setCombatEnabled?.(true); } catch (_) {}
  try { if (typeof playBgm === 'function') playBgm('combat'); } catch (_) {}
});
await page.waitForTimeout(600);

const snap = await page.evaluate(() => {
  const player = typeof bgmPlayer !== 'undefined' ? bgmPlayer : window.__MG_BGM?.player;
  return {
    title: document.title,
    audioUnlocked: document.documentElement.dataset.audioUnlocked || '',
    sfxState: document.documentElement.dataset.sfxState || '',
    sfxCombat: document.documentElement.dataset.sfxCombatEnabled || '',
    hasSfx: typeof window.HonVietSfx?.play === 'function',
    hasPlayBgm: typeof playBgm === 'function',
    bgmSrc: window.HonVietAudio?.music?.()?.url || player?.currentSrc || player?.src || '',
    bgmPaused: window.HonVietAudio?.music?.() ? window.HonVietAudio.context().state !== 'running' : player ? player.paused : null,
    ctxState: window.HonVietAudio?.context?.()?.state || window.__HV_EARLY_CTX?.state || ''
  };
});

await page.screenshot({ path: join(out, 'host-combat-bgm-390x844.png'), fullPage: true });
await browser.close();

const evidence = {
  schema: 'hon-viet-l158-battle-enter-audio/v1',
  origin,
  viewport: '390x844',
  errors,
  snap,
  dist: {
    hostUnlockBeforeSrc: /HonVietSfx\?\.unlock/.test(open) && /playBgm\('combat'\)/.test(open),
    enterFallbackAssign: /location\.assign\(url\)/.test(fallback),
    beginParentBgm: /parentBgm\('combat'\)/.test(begin),
    hushPauses: /bgmPlayer\.pause/.test(hush)
  },
  pass: errors.filter(text => !/extension|favicon|Failed to load resource/i.test(text)).length === 0
    && snap.hasSfx
    && snap.hasPlayBgm
    && /bgm-combat/.test(snap.bgmSrc)
    && /HonVietSfx\?\.unlock/.test(open)
    && /playBgm\('combat'\)/.test(open)
    && !/location\.assign\(url\)/.test(fallback)
    && /parentBgm\('combat'\)/.test(begin)
    && !/bgmPlayer\.pause/.test(hush)
};

writeFileSync(join(out, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
writeFileSync(join(out, 'README.md'), `# L158 — battle enter audio

Chrome 390×844 host \`/?qa=unlock-all\`.
BGM src \`${snap.bgmSrc}\`. unlocked=${snap.audioUnlocked} ctx=${snap.ctxState} paused=${snap.bgmPaused}.
Safari/iPhone NOT_RUN.
`);

if (!evidence.pass) {
  console.error(evidence);
  process.exit(1);
}
console.log('L158 QA PASS', snap);

