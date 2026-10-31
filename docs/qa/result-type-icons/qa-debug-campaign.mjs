// One-shot DOM probe: what does the campaign scene actually offer?
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

const browser = await startBrowser();
const p = await browser.page(375, 812, 3);
const log = {};
try {
  await p.send('Page.navigate', { url: browser.origin + '/' });
  await p.wait('!!document.getElementById("hvLoginContinue")', 20000);
  await p.click('#hvLoginContinue');
  await p.wait('document.getElementById("hvLoginRoot").hidden===true', 20000);
  await p.wait('!!document.querySelector("#hubScreen [data-art-go=\\"campaign\\"]")', 20000);
  await p.click('#hubScreen [data-art-go="campaign"]');
  await new Promise(r => setTimeout(r, 2500));
  log.afterCampaign = await p.evaluate(`(()=>{
    const scene=document.getElementById('hvCampaignScene');
    const btns=[...(scene?.querySelectorAll('button')||[])].map(b=>({cls:b.className,txt:(b.textContent||'').trim().slice(0,44),disabled:b.disabled}));
    return {hidden:scene?.hidden,cls:scene?.className,
      interesting:[...document.querySelectorAll('[class*=mission],[class*=chrow],[class*=primary]')].slice(0,10).map(e=>e.className),
      chList:document.getElementById('chList')?.innerHTML?.slice(0,400)||null,
      buttons:btns.slice(0,18)};})()`);
  await p.screenshot(join(OUT, 'debug-campaign.png'));
} catch (error) {
  log.error = String(error.stack || error);
} finally {
  writeFileSync(join(OUT, 'debug-campaign.json'), JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log, null, 2).slice(0, 4000));
  await browser.close();
}
