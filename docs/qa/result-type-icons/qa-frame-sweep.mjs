// Sweep the whole result timeline on the REAL flow and record every visible
// image / background-image element per frame, to find ghost legacy art.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const DPR = Number(process.env.QA_DPR || 2);

const SWEEP = `(()=>{
  const bf=document.getElementById('hvBattleFrame');
  const d=(bf&&bf.contentWindow&&bf.contentWindow.__HON_VIET__)?bf.contentWindow.document:document;
  const out=[];
  const roots=['#integratedResultV6','.v151-art-result','#endScreen','#hvEndRoot'];
  for(const sel of roots){
    for(const root of d.querySelectorAll(sel)){
      const cs0=getComputedStyle(root);
      const vis0=cs0.display!=='none'&&cs0.visibility!=='hidden'&&Number(cs0.opacity)>0.01;
      out.push({sel,kind:'root',visible:vis0,opacity:cs0.opacity,phase:root.getAttribute('data-phase')||'',z:cs0.zIndex});
      for(const el of root.querySelectorAll('*')){
        const cs=getComputedStyle(el);
        const rect=el.getBoundingClientRect();
        const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)>0.01&&rect.width>4&&rect.height>4;
        if(!visible)continue;
        const src=el.tagName==='IMG'?el.getAttribute('src'):null;
        const bg=(cs.backgroundImage&&cs.backgroundImage!=='none'&&cs.backgroundImage.includes('url('))?cs.backgroundImage:null;
        if(!src&&!bg)continue;
        out.push({sel,kind:el.tagName.toLowerCase(),cls:(el.className&&String(el.className).slice(0,60))||'',
          src:src?src.split('/').pop():null,bg:bg?bg.replace(/^url\\("?|"?\\)$/g,'').split('/').pop():null,
          opacity:cs.opacity,z:cs.zIndex,w:Math.round(rect.width),h:Math.round(rect.height)});
      }
    }
  }
  return {phase:[...d.querySelectorAll('.v151-art-result')].map(e=>e.getAttribute('data-phase')),items:out};
})()`;

async function run(browser, result, width, height) {
  const p = await browser.page(width, height, DPR);
  await p.send('Page.navigate', { url: browser.origin + '/' });
  await p.wait('!!document.getElementById("hvLoginContinue")', 20000);
  await p.click('#hvLoginContinue');
  await p.wait('document.getElementById("hvLoginRoot").hidden===true', 20000);
  await p.wait('!!document.querySelector("#hubScreen [data-art-go=\\"campaign\\"]")', 20000);
  await p.evaluate(`(()=>{if(typeof P==='undefined'||!P)return 0;P.clearedChapters=[...Array(5).keys()];P.unlockedChapters=[...Array(6).keys()];P.campaignStages=P.campaignStages||{};P.campaignStages[5]=1;if(P.squad)P.squad=P.squad.slice(0,6);const lv=${result === 'victory' ? 120 : 1},st=${result === 'victory' ? 6 : 1};for(const s of P.squad){const h=P.heroes&&P.heroes[s.id];if(h){h.level=lv;h.stars=st;h.owned=true;}}try{persist();}catch(e){}return 1;})()`);
  await p.click('#hubScreen [data-art-go="campaign"]');
  await p.wait('!document.getElementById("hvCampaignScene").hidden', 20000);
  await p.wait('!!document.querySelector("#hvCampaignScene .cs-primary.cs-challenge")', 20000);
  await p.click('#hvCampaignScene .cs-primary.cs-challenge');
  await p.wait('!!document.querySelector(".cs-prepare") && !document.querySelector(".cs-prepare").hidden', 25000);
  await p.wait('!!document.querySelector("[data-scene-action=\\"launch\\"]")', 20000);
  await p.click('[data-scene-action="launch"]');
  const f = '(document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?document.getElementById("hvBattleFrame").contentWindow:window)';
  await p.wait(f + '.__HON_VIET__?.getState().mode==="battle"', 90000);
  await p.wait(f + '.__HON_VIET__.getState().actionCount>=1', 120000);
  const skip = await p.evaluate('(()=>{const f=document.getElementById("hvBattleFrame"),d=f?.contentDocument||document,b=d.querySelector("#embeddedSkipButton");if(!b)return null;const r=f?f.getBoundingClientRect():{x:0,y:0},q=b.getBoundingClientRect();return {x:r.x+q.x+q.width/2,y:r.y+q.y+q.height/2,w:q.width,h:q.height};})()');
  if (!skip?.w) throw new Error('skip button not visible');
  await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: skip.x, y: skip.y, button: 'left', clickCount: 1 });
  await p.wait(f + '.__HON_VIET__.getState().mode==="result"', 60000);
  await p.wait(f + '.document.querySelector("#integratedResultV6.show")', 30000);

  const frames = [];
  for (let i = 0; i < 40; i++) {
    const snap = await p.evaluate(SWEEP).catch(() => null);
    if (snap) frames.push({ t: i * 90, ...snap });
    if (i === 3 || i === 6 || i === 9) {
      const shot = await p.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(OUT, `sweep-${result}-${i}.png`), Buffer.from(shot.data, 'base64'));
    }
    await sleep(90);
  }
  return { result, width, frames };
}

const browser = await startBrowser();
const all = [];
try {
  for (const r of ['victory', 'defeat']) all.push(await run(browser, r, 375, 812));
} finally {
  writeFileSync(join(OUT, 'sweep.json'), JSON.stringify(all, null, 1));
  await browser.close();
}
const summary = all.map(a => {
  const seen = new Map();
  for (const fr of a.frames) for (const it of fr.items) {
    if (it.kind === 'root') continue;
    const key = it.src || it.bg;
    if (!seen.has(key)) seen.set(key, { key, z: it.z, opacity: it.opacity, frames: 0 });
    seen.get(key).frames++;
  }
  return { result: a.result, frames: a.frames.length, assets: [...seen.values()] };
});
console.log('SWEEP:' + JSON.stringify(summary));
