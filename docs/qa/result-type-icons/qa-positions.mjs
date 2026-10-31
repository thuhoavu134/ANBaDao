// Placement A/B on the REAL result screen (no rebuild): try 2 geometries per word.
import { join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CAND = {
  victory: [
    { name: 'v1-top10-66', css: '.irv-word{width:min(66vw,304px)!important;top:calc(min(100vw,56.25vh) * .10)!important}' },
    { name: 'v2-top13-60', css: '.irv-word{width:min(60vw,276px)!important;top:calc(min(100vw,56.25vh) * .13)!important}' },
  ],
  defeat: [
    { name: 'd1-top05-52', css: '#integratedResultV6.irv-defeat .irv-word{width:min(52vw,240px)!important;top:calc(min(100vw,56.25vh) * .05)!important}' },
    { name: 'd2-top09-46', css: '#integratedResultV6.irv-defeat .irv-word{width:min(46vw,212px)!important;top:calc(min(100vw,56.25vh) * .09)!important}' },
  ],
};

async function open(p, { chapter, stage, level, stars }) {
  await p.send('Page.navigate', { url: origin + '/' });
  await p.wait('!!document.getElementById("hvLoginContinue")', 20000);
  await p.click('#hvLoginContinue');
  await p.wait('document.getElementById("hvLoginRoot").hidden===true', 20000);
  await p.wait('!!document.querySelector("#hubScreen [data-art-go=\\"campaign\\"]")', 20000);
  await p.evaluate(`(()=>{P.clearedChapters=[...Array(${chapter}).keys()];P.unlockedChapters=[...Array(${chapter + 1}).keys()];
    P.campaignStages=P.campaignStages||{};P.campaignStages[${chapter}]=${stage};
    for(const s of P.squad){const h=P.heroes&&P.heroes[s.id];if(h){h.level=${level};h.stars=${stars};h.owned=true;}}
    try{persist();}catch(e){} return true;})()`);
  await p.click('#hubScreen [data-art-go="campaign"]');
  await p.wait('!document.getElementById("hvCampaignScene").hidden', 20000);
  await p.wait('!!document.querySelector("#hvCampaignScene .cs-primary.cs-challenge")', 20000);
  await p.click('#hvCampaignScene .cs-primary.cs-challenge');
  await p.wait('!!document.querySelector(".cs-prepare") && !document.querySelector(".cs-prepare").hidden', 25000);
  await p.click('[data-scene-action="launch"]');
  const f = '(document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?document.getElementById("hvBattleFrame").contentWindow:window)';
  await p.wait(f + '.__HON_VIET__?.getState().mode==="battle"', 90000);
  await p.wait(f + '.__HON_VIET__.getState().actionCount>=1', 120000);
  const skip = await p.evaluate('(()=>{const f=document.getElementById("hvBattleFrame"),d=f?.contentDocument||document,b=d.querySelector("#embeddedSkipButton");const r=f?f.getBoundingClientRect():{x:0,y:0},q=b.getBoundingClientRect();return {x:r.x+q.x+q.width/2,y:r.y+q.y+q.height/2};})()');
  await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.wait(f + '.__HON_VIET__.getState().mode==="result"', 60000);
  await p.wait(f + '.querySelector("#integratedResultV6.show")', 30000);
  await sleep(1000);
}

const browser = await startBrowser();
const origin = browser.origin;
const shots = [];
try {
  for (const cfg of [
    { result: 'victory', chapter: 5, stage: 1, level: 120, stars: 6 },
    { result: 'defeat', chapter: 5, stage: 1, level: 1, stars: 1 },
  ]) {
    const p = await browser.page(375, 812, 2);
    try {
      await open(p, cfg);
      for (const c of CAND[cfg.result]) {
        await p.evaluate(`(()=>{const d=document.getElementById('hvBattleFrame').contentDocument;
          let s=d.getElementById('word-pos');if(!s){s=d.createElement('style');s.id='word-pos';d.head.appendChild(s);}
          s.textContent=${JSON.stringify(c.css)};return true;})()`);
        await sleep(400);
        const file = join(OUT, `pos-${cfg.result}-${c.name}.png`);
        await p.screenshot(file);
        const box = await p.evaluate(`(()=>{const d=document.getElementById('hvBattleFrame').contentDocument;
          const w=d.querySelector('.irv-word').getBoundingClientRect();const h=d.querySelector('.irv-hero-wrap').getBoundingClientRect();
          return {word:[Math.round(w.top),Math.round(w.bottom)],hero:[Math.round(h.top),Math.round(h.bottom)],w:[innerWidth,innerHeight]};})()`);
        shots.push({ file, ...c, box });
      }
    } catch (e) { shots.push({ result: cfg.result, error: String(e).slice(0, 140) }); }
    finally { await p.close(); }
  }
} finally {
  writeFileSync(join(OUT, 'positions.json'), JSON.stringify(shots, null, 2));
  console.log(JSON.stringify(shots.map(s => s.error || `${s.name} ${JSON.stringify(s.box)}`)));
  await browser.close();
}
