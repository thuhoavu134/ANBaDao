// Live A/B of the word-mark geometry inside the REAL result screen.
// One battle, several candidate CSS configs, one screenshot each.
import { mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Serve the new word marks through the same static dist the page already uses.
cpSync(join(ROOT, 'assets/result-art/result-word-v2'), join(ROOT, 'dist/assets/result-art/result-word-v2'), { recursive: true });

const CANDIDATES = [
  { name: 'a-52vw-top30', width: 'min(52vw,290px)', top: 'calc(min(100vw,56.25vh) * 0.30)' },
  { name: 'b-62vw-top26', width: 'min(62vw,340px)', top: 'calc(min(100vw,56.25vh) * 0.24)' },
  { name: 'c-70vw-top22', width: 'min(70vw,380px)', top: 'calc(min(100vw,56.25vh) * 0.20)' },
  { name: 'd-58vw-top34', width: 'min(58vw,320px)', top: 'calc(min(100vw,56.25vh) * 0.34)' },
];

function cssFor(c) {
  return `
  .irv-word{width:${c.width}!important;top:${c.top}!important;aspect-ratio:auto!important;height:auto!important;
    left:50%!important;transform:translateX(-50%)!important;object-fit:contain!important;
    filter:drop-shadow(0 5px 9px rgba(30,13,3,.55))}
  .irv-defeat .irv-word{width:${c.width}!important;top:calc(${c.top} + min(100vw,56.25vh) * 0.01)!important}`;
}

async function openResult(p, { result, chapter, stage, level, stars }) {
  await p.send('Page.navigate', { url: browserOrigin + '/' });
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
  const skip = await p.evaluate('(()=>{const f=document.getElementById("hvBattleFrame"),d=f?.contentDocument||document,b=d.querySelector("#embeddedSkipButton");const r=f?f.getBoundingClientRect():{x:0,y:0},q=b.getBoundingClientRect();return {x:r.x+q.x+q.width/2,y:r.y+q.y+q.height/2,w:q.width};})()');
  await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.wait(f + '.__HON_VIET__.getState().mode==="result"', 60000);
  await p.wait(f + '.document.querySelector("#integratedResultV6.show")', 30000);
  await sleep(1200);
  return f;
}

const browser = await startBrowser();
const browserOrigin = browser.origin;
const report = { when: new Date().toISOString(), shots: [] };
try {
  for (const cfg of [
    { result: 'victory', chapter: 5, stage: 1, level: 120, stars: 6 },
    { result: 'defeat', chapter: 5, stage: 1, level: 1, stars: 1 },
  ]) {
    for (const [width, height] of [[375, 812], [430, 932]]) {
      const p = await browser.page(width, height, 2);
      try {
        const f = await openResult(p, cfg);
        // point the word at the vector mark, once per page
        await p.evaluate(`(()=>{const d=document.getElementById('hvBattleFrame').contentDocument;
          const img=d.querySelector('.irv-word');if(!img)return 'no-word';
          img.src='assets/result-art/result-word-v2/'+(d.getElementById('integratedResultV6').classList.contains('irv-defeat')?'defeat':'victory')+'.svg';
          return img.src;})()`);
        await sleep(500);
        for (const c of CANDIDATES) {
          await p.evaluate(`(()=>{const d=document.getElementById('hvBattleFrame').contentDocument;
            let s=d.getElementById('word-preview');if(!s){s=d.createElement('style');s.id='word-preview';d.head.appendChild(s);}
            s.textContent=${JSON.stringify(cssFor(c))};return true;})()`);
          await sleep(450);
          const file = join(OUT, `preview-${cfg.result}-${width}-${c.name}.png`);
          try { await p.screenshot(file); report.shots.push({ file, result: cfg.result, width, cfg: c, ok: true }); }
          catch (e) { report.shots.push({ file, result: cfg.result, width, cfg: c, ok: false, error: String(e).slice(0, 120) }); }
        }
        report.shots.push({ result: cfg.result, width, geometry: await p.evaluate(`(()=>{const d=document.getElementById('hvBattleFrame').contentDocument;
          const w=d.querySelector('.irv-word').getBoundingClientRect();const t=d.querySelector('.irv-title').getBoundingClientRect();
          const st=d.querySelector('.irv-stage').getBoundingClientRect();
          return {word:[Math.round(w.x),Math.round(w.y),Math.round(w.width),Math.round(w.height)],
                  wings:[Math.round(t.x),Math.round(t.y),Math.round(t.width),Math.round(t.height)],
                  stage:[Math.round(st.y),Math.round(st.height)]};})()`) });
      } catch (error) {
        report.shots.push({ result: cfg.result, width, error: String(error.stack || error).split('\n').slice(0, 2).join(' | ') });
      } finally { await p.close(); }
    }
  }
} finally {
  writeFileSync(join(OUT, 'preview-words.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('PREVIEW:' + JSON.stringify(report.shots.filter(s => s.error || s.geometry).map(s => s.error || s.geometry)));
  await browser.close();
}
