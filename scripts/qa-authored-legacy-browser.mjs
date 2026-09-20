import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const HERO_SPECS = [
  {
    key: 'luc-anh',
    id: 'qa-luc-anh',
    sourceId: 'luc_anh',
    name: 'Lục Ảnh',
    force: action => `void __HON_VIET__.qaForceLucAnhAction(${JSON.stringify(action)});true`,
    assets: '__HON_VIET__.getLucAnhAuthoredAssets()',
    required: ['idle','run','attack','skill1','ultimate','basicProjectile','basicImpact','skill1Vfx','ultimateVfx']
  },
  {
    key: 'dinh-loi',
    id: 'qa-dinh-loi',
    sourceId: 'dinh_loi',
    name: 'Đình Lôi',
    force: action => `void __HON_VIET__.qaForceDinhLoiAction(${JSON.stringify(action)});true`,
    assets: '__HON_VIET__.getDinhLoiAssets()',
    required: ['idle','run','attack','skill1','ultimate','basicProjectile','basicImpact','skill1Wave','skill1Impact','skill1Shield','ultimateVfx','ultimateImpact']
  },
  {
    key: 'ong-pho',
    id: 'ong-pho-gif-test',
    sourceId: 'ong_hang_pho',
    name: 'Ông Phở',
    force: action => `__HON_VIET__.qaForceOngPhoAction(${JSON.stringify(action)})`,
    assets: '__HON_VIET__.getOngPhoAuthoredAssets()',
    required: ['idle','attack','skill1','ultimate']
  }
];

const EXPECTED_STATE = { basic: 'attack', skill: 'skill1', ultimate: 'ultimate' };

function hero(id, sourceId, name, team, slot, extra={}) {
  return {
    id, sourceId, name, team, slot,
    hp: extra.hp || 500000,
    atk: extra.atk || 220,
    def: extra.def || 80,
    speed: extra.speed || 120,
    accuracy: 10000,
    evasion: 0,
    crit: 0,
    energy: 100,
    level: 30,
    stars: 6,
    rarity: 5
  };
}

function battleConfig() {
  return {
    referenceSimple: true,
    heroes: [
      hero('qa-luc-anh','luc_anh','Lục Ảnh','player',0,{speed:180}),
      hero('qa-dinh-loi','dinh_loi','Đình Lôi','player',1,{speed:170}),
      hero('ong-pho-gif-test','ong_hang_pho','Ông Phở','player',2,{speed:160}),
      hero('qa-player-3','dong_quan','Đồng Quân','player',3),
      hero('qa-player-4','lam_vu','Lâm Vũ','player',4),
      hero('qa-player-5','moc_an','Mộc An','player',5),
      hero('qa-enemy-0','qa_enemy_0','Địch 1','enemy',0,{hp:999999,def:200}),
      hero('qa-enemy-1','qa_enemy_1','Địch 2','enemy',1,{hp:999999,def:200}),
      hero('qa-enemy-2','qa_enemy_2','Địch 3','enemy',2,{hp:999999,def:200}),
      hero('qa-enemy-3','qa_enemy_3','Địch 4','enemy',3,{hp:999999,def:200}),
      hero('qa-enemy-4','qa_enemy_4','Địch 5','enemy',4,{hp:999999,def:200}),
      hero('qa-enemy-5','qa_enemy_5','Địch 6','enemy',5,{hp:999999,def:200})
    ]
  };
}

const unitExpr = id => `__HON_VIET__.getUnits().find(u=>u.id===${JSON.stringify(id)})`;

async function runViewport(browser, out, name, width, height, dpr) {
  const page = await browser.page(width,height,dpr);
  const run = { name,width,height,dpr,heroes:{},screenshots:[],errors:[] };
  try {
    const config = battleConfig();
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.name='hvBattleConfig:'+encodeURIComponent(${JSON.stringify(JSON.stringify(config))});`
    });
    await page.send('Page.navigate',{url:browser.origin+'/battle.html?qaPhase01=1'});
    await page.wait('!!window.__HON_VIET__ && !!window.__HV_BATTLE_PHASE1_TRACE');
    await page.wait('__HON_VIET__.getUnits().length===12');
    await page.click('#startBattle');
    await page.wait('__HON_VIET__.getState().mode==="battle"');
    run.initial = await page.evaluate('({state:__HON_VIET__.getState(),units:__HON_VIET__.getUnits()})');
    await page.screenshot(resolve(out,name+'-initial.png'));
    run.screenshots.push(name+'-initial.png');

    for (const spec of HERO_SPECS) {
      const item = { actions:{}, screenshots:[], requiredAssets:spec.required };
      run.heroes[spec.key] = item;
      await page.wait(`!!${unitExpr(spec.id)} && ${unitExpr(spec.id)}.hp>0`);

      for (const action of ['basic','skill','ultimate']) {
        const row = { action };
        item.actions[action] = row;
        const beforeCount = await page.evaluate('__HV_BATTLE_PHASE1_TRACE.events().length');
        const before = await page.evaluate(unitExpr(spec.id));
        row.before = before;
        row.beforeUnits = await page.evaluate('__HON_VIET__.getUnits()');
        row.enemyHpBefore = row.beforeUnits.filter(u=>u.team==='enemy').reduce((sum,u)=>sum+Number(u.hp||0),0);
        row.playerShieldBefore = row.beforeUnits.filter(u=>u.team==='player').reduce((sum,u)=>sum+Number(u.shield||0),0);

        const triggered = await page.evaluate(spec.force(action));
        if (!triggered) throw new Error(spec.name+' '+action+' QA trigger returned false');

        await page.wait(`__HV_BATTLE_PHASE1_TRACE.events().slice(${beforeCount}).some(e=>e.type==="action:start"&&e.actorId===${JSON.stringify(spec.id)})`,12000);
        row.actionId = await page.evaluate(`(()=>{const rows=__HV_BATTLE_PHASE1_TRACE.events().slice(${beforeCount}).filter(e=>e.type==="action:start"&&e.actorId===${JSON.stringify(spec.id)});return rows.at(-1)?.actionId||"";})()`);

        const expectedState = EXPECTED_STATE[action];
        await page.wait(`(()=>{const u=${unitExpr(spec.id)};return !!u && (u.state===${JSON.stringify(expectedState)} || __HV_BATTLE_PHASE1_TRACE.events().some(e=>e.actionId===${JSON.stringify(row.actionId)}&&e.type==="marker:impact"));})()`,15000);
        row.active = await page.evaluate(`({unit:${unitExpr(spec.id)},effects:__HON_VIET__.getEffects(),trace:__HV_BATTLE_PHASE1_TRACE.events().filter(e=>e.actionId===${JSON.stringify(row.actionId)})})`);
        const shot=name+'-'+spec.key+'-'+action+'.png';
        await page.screenshot(resolve(out,shot));
        run.screenshots.push(shot);item.screenshots.push(shot);

        await page.wait(`__HV_BATTLE_PHASE1_TRACE.events().some(e=>e.type==="action:complete"&&e.actionId===${JSON.stringify(row.actionId)})`,25000);
        await page.wait(`(()=>{const u=${unitExpr(spec.id)};return !!u && u.hp>0 && Math.hypot(u.x-u.baseX,u.y-u.baseY)<=2;})()`,12000);
        row.after = await page.evaluate(unitExpr(spec.id));
        row.afterUnits = await page.evaluate('__HON_VIET__.getUnits()');
        row.enemyHpAfter = row.afterUnits.filter(u=>u.team==='enemy').reduce((sum,u)=>sum+Number(u.hp||0),0);
        row.playerShieldAfter = row.afterUnits.filter(u=>u.team==='player').reduce((sum,u)=>sum+Number(u.shield||0),0);
        row.trace = await page.evaluate(`__HV_BATTLE_PHASE1_TRACE.events().filter(e=>e.actionId===${JSON.stringify(row.actionId)})`);
        row.effectResolved = spec.key==='dinh-loi' && action==='skill'
          ? row.playerShieldAfter > row.playerShieldBefore
          : row.enemyHpAfter < row.enemyHpBefore;
        row.ok =
          row.actionId.length>0 &&
          row.trace.some(e=>e.type==='action:start') &&
          row.trace.some(e=>e.type==='marker:impact') &&
          row.trace.some(e=>e.type==='action:complete') &&
          row.effectResolved &&
          Math.hypot(row.after.x-row.after.baseX,row.after.y-row.after.baseY)<=2 &&
          row.after.hp>0;
        if (!row.ok) throw new Error(spec.name+' '+action+' action/impact/return acceptance failed');
        await sleep(120);
      }

      await page.wait(`(()=>{const a=${spec.assets};return ${JSON.stringify(spec.required)}.every(k=>a[k]===true);})()`,15000);
      item.assets = await page.evaluate(spec.assets);
      item.ok = Object.values(item.actions).every(row=>row.ok) && spec.required.every(key=>item.assets[key]===true);
      if (!item.ok) throw new Error(spec.name+' authored asset acceptance failed: '+JSON.stringify(item.assets));
    }

    run.exceptions = page.events.filter(event => event.method==='Runtime.exceptionThrown');
    run.httpErrors = page.events.filter(event => event.method==='Network.responseReceived' && event.params.response.status>=400)
      .map(event=>({url:event.params.response.url,status:event.params.response.status}));
    run.assetHttpErrors = run.httpErrors.filter(item=>/characters|battle-runtime/.test(item.url));
    run.networkFailures = page.events.filter(event=>event.method==='Network.loadingFailed').map(event=>event.params);
    run.ok =
      Object.values(run.heroes).every(item=>item.ok) &&
      run.exceptions.length===0 &&
      run.assetHttpErrors.length===0 &&
      run.networkFailures.length===0;
    await page.screenshot(resolve(out,name+'-final.png'));
    run.screenshots.push(name+'-final.png');
    if (!run.ok) run.errors.push('Authored hero browser acceptance failed; inspect report/screenshots.');
  } catch (error) {
    run.ok=false;
    run.errors.push(String(error.stack||error));
    run.exceptions = page.events.filter(event=>event.method==='Runtime.exceptionThrown');
    try {
      await page.screenshot(resolve(out,name+'-failure.png'));
      run.screenshots.push(name+'-failure.png');
    } catch {}
  } finally {
    await page.close();
  }
  return run;
}

export async function run() {
  const out=resolve('evidence/authored-legacy');
  mkdirSync(out,{recursive:true});
  const browser=await startBrowser();
  const report={
    scope:'Real generated battle; deterministic QA hooks invoke the production performAction path for authored Lục Ảnh, Đình Lôi and Ông Phở Basic/Skill/Ultimate. Chromium only; not physical iPhone.',
    revision:process.env.GITHUB_SHA||'local',
    runs:[],
    ok:false
  };
  try {
    for (const viewport of [['desktop',1280,800,1],['mobile',390,844,2]]) {
      const runResult=await runViewport(browser,out,...viewport);
      report.runs.push(runResult);
      writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
    }
    report.ok=report.runs.every(run=>run.ok);
    writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({
      ok:report.ok,
      runs:report.runs.map(run=>({
        name:run.name,ok:run.ok,
        heroes:Object.fromEntries(Object.entries(run.heroes).map(([key,item])=>[key,{ok:item.ok,assets:item.assets,actions:Object.fromEntries(Object.entries(item.actions).map(([action,row])=>[action,{ok:row.ok,actionId:row.actionId,effectResolved:row.effectResolved,enemyHpDelta:Number(row.enemyHpAfter)-Number(row.enemyHpBefore),playerShieldDelta:Number(row.playerShieldAfter)-Number(row.playerShieldBefore)}]))}])),
        errors:run.errors,
        exceptions:run.exceptions?.length,
        assetHttpErrors:run.assetHttpErrors?.length
      }))
    },null,2));
    if(!report.ok) process.exitCode=1;
  } finally {
    await browser.close();
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
