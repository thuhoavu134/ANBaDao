// Real Chromium + CDP. No gameplay functions are mocked; source assets are served
// from dist. Runs locally and on Linux GitHub Actions without an npm dependency.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function startBrowser() {
  const root=resolve('dist'),requestLog=[];
  const server=createServer((req,res)=>{
    let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
    const file=resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
    if(!file.startsWith(root+sep)||!existsSync(file)||!statSync(file).isFile()){
      requestLog.push({url:name,status:404});res.writeHead(404).end('not found');return;
    }
    const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.wav':'audio/wav','.mp3':'audio/mpeg','.css':'text/css'}[extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});res.end(readFileSync(file));
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin='http://127.0.0.1:'+server.address().port;
  const executable=process.env.CHROME_PATH||['/usr/bin/chromium','/usr/bin/google-chrome','/opt/google/chrome/chrome'].find(existsSync);
  if(!executable){server.close();throw new Error('Chromium/Chrome not installed');}
  const profile=mkdtempSync(join(tmpdir(),'hv-browser-'));
  const chrome=spawn(executable,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','about:blank'],{stdio:['ignore','ignore','pipe']});
  let errors='';chrome.stderr.on('data',chunk=>{errors+=chunk;});
  const active=join(profile,'DevToolsActivePort');
  for(let n=0;n<450&&!existsSync(active);n++){if(chrome.exitCode!==null)break;await sleep(100);}
  if(!existsSync(active)){mkdirSync('evidence/browser',{recursive:true});writeFileSync('evidence/browser/chrome-startup.log',errors);chrome.kill();server.close();throw new Error('Chromium startup failed; see evidence/browser/chrome-startup.log');}
  const port=readFileSync(active,'utf8').split('\n')[0];
  async function page(width=1280,height=800,dpr=1) {
    const target=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
    const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map(),events=[];let seq=0;
    await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
    ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}else events.push(m);};
    function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},45000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:width<600});
    async function evaluate(expression,awaitPromise=true){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;}
    async function wait(expression,timeoutMs=20000){const end=Date.now()+timeoutMs;while(Date.now()<end){try{if(await evaluate(expression))return;}catch{}await sleep(80);}throw new Error('Browser condition timed out: '+expression);}
    async function screenshot(path){const image=await send('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(image.data,'base64'));}
    async function click(selector){const rect=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};})()`);if(!rect||!rect.w||!rect.h)throw new Error('Not clickable: '+selector);await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});}
    return {send,evaluate,wait,screenshot,click,events,close:async()=>{ws.close();await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id);}};
  }
  async function closeBrowser(){
    const exited=chrome.exitCode!==null||chrome.signalCode!==null?Promise.resolve():once(chrome,'exit');
    // Browser.close flushes profiles and shuts down renderer children; SIGTERM
    // alone can leave them writing while the temporary profile is removed.
    try{
      const version=await fetch('http://127.0.0.1:'+port+'/json/version',{signal:AbortSignal.timeout(1000)}).then(r=>r.json());
      await new Promise(resolve=>{const socket=new WebSocket(version.webSocketDebuggerUrl);const timer=setTimeout(()=>{socket.close();resolve();},3000);const done=()=>{clearTimeout(timer);resolve();};socket.onopen=()=>socket.send(JSON.stringify({id:1,method:'Browser.close'}));socket.onclose=done;socket.onerror=done;});
    }catch{chrome.kill();}
    let timer;await Promise.race([exited,new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);
    if(chrome.exitCode===null&&chrome.signalCode===null){chrome.kill('SIGKILL');await exited;}
    server.close();rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  }
  return {origin,page,requestLog,close:closeBrowser};
}
const snapshotExpression=`(()=>{const s=__HON_VIET__.getState();return {state:{mode:s.mode,battleId:s.battleId,round:s.round,actionCount:s.actionCount,currentId:s.currentId,auto:s.auto,speed:s.speed,sound:s.sound},units:__HON_VIET__.getUnits(),dataset:{...document.documentElement.dataset},paints:__HV_BATTLE_ASSET_QA.paints(),cache:__HV_BATTLE_ASSET_QA.inspect(),events:__HV_BATTLE_ASSET_QA.events(),movement:window.__HV_SKILL_MOVEMENT_QA?.events?.()||[],audio:window.__qaAudio||[]};})()`;
export async function run(){
  const out=resolve('evidence/browser');mkdirSync(out,{recursive:true});
  const browser=await startBrowser();
  const report={scope:'Real generated 6v6; canonical heroes selected via existing QA roster flags. No mocked images/audio. Not physical iOS.',runs:[],errors:[],revision:process.env.GITHUB_SHA||'local'};
  try{
    for(const [name,width,height,dpr] of [['desktop',1280,800,1],['mobile',390,844,2]]){
      const page=await browser.page(width,height,dpr),run={name,width,height,dpr,samples:[],screenshots:[],coverage:{},errors:[]};
      report.runs.push(run);
      try{
        await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.name='hvBattleConfig:'+encodeURIComponent(JSON.stringify({referenceSimple:true}));window.__qaAudio=[];const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const result=original.apply(this,args);let peak=0;const data=this.buffer?.getChannelData(0);if(data)for(let i=0;i<data.length;i+=Math.max(1,Math.floor(data.length/3000)))peak=Math.max(peak,Math.abs(data[i]));__qaAudio.push({at:Date.now(),state:this.context.state,duration:this.buffer?.duration,peak});return result;};`});
        await page.send('Page.navigate',{url:browser.origin+'/battle.html?linhDongQa=1&bachDienQa=1&qaPhase01=1'});
        await page.wait('!!window.__HON_VIET__ && !!window.__HV_BATTLE_ASSET_QA');
        await page.wait('Object.values(__HV_BATTLE_ASSET_QA.paints()).some(n=>n>0)');
        await page.screenshot(join(out,name+'-initial.png'));run.screenshots.push(name+'-initial.png');
        run.initial=await page.evaluate(snapshotExpression);
        await page.click('#startBattle');
        await page.wait('__HON_VIET__.getState().mode === "battle"');
        await page.click('#autoButton');
        const began=Date.now();let nextSpeed=1;
        const wanted=['linh-dong:atkVfx','linh-dong:ultimateVfx','bach-dien:atkVfx','bach-dien:ultimateVfx'];
        while(Date.now()-began<115000){
          const sample=await page.evaluate(snapshotExpression);
          run.samples.push({at:Date.now(),...sample});
          for(const key of wanted)if((sample.paints[key]||0)>=5&&!run.coverage[key]){
            const file=name+'-'+key.replace(':','-')+'.png';await page.screenshot(join(out,file));run.screenshots.push(file);run.coverage[key]=sample.paints[key];
          }
          if(sample.events.some(e=>e.type==='assets:failed'))throw new Error('Action assets failed: '+JSON.stringify(sample.events.filter(e=>e.type==='assets:failed')));
          if(sample.cache.bytes>sample.cache.maxBytes)throw new Error('Decoded reservation budget exceeded');
          const elapsed=Date.now()-began;
          if(nextSpeed===1&&elapsed>20000){await page.click('#speedButton');nextSpeed=2;}
          if(nextSpeed===2&&elapsed>40000){await page.click('#speedButton');nextSpeed=3;}
          if(Object.keys(run.coverage).length===wanted.length&&elapsed>41000)break;
          if(sample.state.mode!=='battle')break;
          await sleep(250);
        }
        run.final=await page.evaluate(snapshotExpression);
        await page.screenshot(join(out,name+'-final.png'));run.screenshots.push(name+'-final.png');
        run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown');
        run.httpErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400).map(e=>({url:e.params.response.url,status:e.params.response.status}));
        run.networkFailures=page.events.filter(e=>e.method==='Network.loadingFailed').map(e=>e.params);
        const movementStarts=(run.final.movement||[]).filter(e=>e.type==='approach:start'&&Math.hypot(e.destination.x-e.home.x,e.destination.y-e.home.y)>1);
        const targetTeamStarts=movementStarts.filter(e=>e.mode==='target-team');
        const movementInsideCorridor=movementStarts.every(e=>{
          const actor=run.final.units.find(unit=>unit.id===e.actorId);
          const opponents=actor?run.final.units.filter(unit=>unit.team!==actor.team):[];
          if(!actor||!opponents.length)return false;
          const enemyCenterX=opponents.reduce((sum,unit)=>sum+(unit.baseX??unit.x),0)/opponents.length;
          const dir=Math.sign(enemyCenterX-e.home.x)||1;
          // Event snapshots do not carry event-time HP. A dead former frontline
          // must not make a later legal advance look like a penetration failure.
          // Unit tests lock the live-frontline rule; browser QA only verifies
          // that real movement advances toward, but not through, enemy formation.
          return dir*(e.destination.x-e.home.x)>=-1&&dir*(enemyCenterX-e.destination.x)>0;
        });
        run.movement={movedStarts:movementStarts.length,targetTeamStarts:targetTeamStarts.length,insideCombatCorridor:movementInsideCorridor};
        run.ok=Object.keys(run.coverage).length===wanted.length&&run.exceptions.length===0&&run.final.audio.some(a=>a.state==='running'&&a.peak>0)&&run.samples.some(s=>s.events.some(e=>e.type==='sfx:played'))&&movementStarts.length>0&&targetTeamStarts.length>0&&movementInsideCorridor;
        if(!run.ok)run.errors.push('Coverage, runtime/audio, or target-driven movement check failed; inspect captured evidence.');
      }catch(error){run.ok=false;run.errors.push(String(error.stack||error));try{await page.screenshot(join(out,name+'-failure.png'));run.failure=await page.evaluate('({url:location.href,title:document.title,text:document.body.innerText.slice(0,1000)})');}catch{}run.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown');}
      finally{await page.close();writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));}
    }
    report.requests=browser.requestLog;
    report.ok=report.runs.every(run=>run.ok);
    writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({ok:report.ok,runs:report.runs.map(r=>({name:r.name,ok:r.ok,coverage:r.coverage,errors:r.errors,exceptions:r.exceptions?.length,final:r.final?.state}))},null,2));
    if(!report.ok)process.exitCode=1;
  }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
