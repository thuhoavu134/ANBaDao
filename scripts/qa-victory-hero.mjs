// QA: show the Victory overlay for one hero in headless Chrome, sample the motion state and screenshot.
// Usage: node scripts/qa-victory-hero.mjs be_an "Bé An" [tag]
import { launch, attach } from './qa-run.mjs';
import { mkdirSync, copyFileSync } from 'node:fs';

const [id = 'be_an', name = 'Bé An', tag = 'now'] = process.argv.slice(2);
const OUT = 'docs/qa/BD-UI-FIX';
const PUB = 'C:/Users/Admin/aicoworker/openclaw/workspace-main/outputs/qa';
mkdirSync(OUT, { recursive: true }); mkdirSync(PUB, { recursive: true });
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find(t => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/battle.html', 4500);
await c.eval(`window.__showIntegratedResultV6(true,{player:[{id:${JSON.stringify(id)},sourceId:${JSON.stringify(id)},name:${JSON.stringify(name)},damage:4200,kills:3,hp:100,maxHp:100,alive:true,slot:0}],enemy:[],rewards:[]}),1`);
for (const ms of [700, 1500, 3200]) {
  await new Promise(r => setTimeout(r, ms === 700 ? 700 : ms - (ms === 1500 ? 700 : 1500)));
  const st = await c.eval(`(()=>{const q=window.__HV_RESULT_MOTION_QA?.state?.()||{};const w=document.querySelector('#integratedResultV6 .irv-hero-wrap');const r=w?.getBoundingClientRect();return {hero:q.hero,phase:q.phase,generic:q.generic,runFrames:q.runFrames,idleFrames:q.idleFrames,src:q.source,wrap:r?[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]:null};})()`);
  console.log(ms, JSON.stringify(st));
  const file = `${OUT}/victory-${id}-${tag}-${ms}.png`;
  await c.shot(file); copyFileSync(file, `${PUB}/victory-${id}-${tag}-${ms}.png`);
}
await b.kill();
