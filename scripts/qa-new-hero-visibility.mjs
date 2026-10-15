import assert from 'node:assert/strict';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(),runs=[];
try {
  for(const [width,height] of [[390,844],[1280,800]]) for(const slug of ['ky-van','tieu-phong']) {
    const page=await browser.page(width,height,1);
    try {
      await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`
        window.__bodyQA={blocked:false,live:0,backup:0};
        window.__vfxQA={bolt:[],wind:[]};
        const natural=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'naturalWidth');
        Object.defineProperty(HTMLImageElement.prototype,'naturalWidth',{configurable:true,get(){
          return window.__bodyQA.blocked&&this.src.includes('/${slug}/')?0:natural.get.call(this);
        }});
        const draw=CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
          const src=image?.src||'';
          if(src.endsWith('/ky-van/bolt.webp'))window.__vfxQA.bolt.push({width:args.at(-2),height:args.at(-1)});
          if(src.includes('/tieu-phong/wind-'))window.__vfxQA.wind.push({width:args.at(-2),height:args.at(-1)});
          if(image instanceof HTMLImageElement&&image.src.includes('/${slug}/')){
            this.canvas.__heroBody=true;window.__bodyQA.live++;
          }
          if(image instanceof HTMLCanvasElement&&image.__heroBody)window.__bodyQA.backup++;
          return draw.call(this,image,...args);
        };`});
      await page.send('Page.navigate',{url:browser.origin+'/'+slug+'-test.html'});
      await page.wait('window.__SKILL_TEST_QA__?.ready');
      const state="document.getElementById('battleFrame').contentWindow.__bodyQA";
      await page.wait(state+'.live>12');
      const visible=await page.evaluate(`(()=>{const w=document.getElementById('battleFrame').contentWindow,c=w.document.querySelector('canvas'),r=c.getBoundingClientRect();return r.width>0&&r.height>0&&w.getComputedStyle(c).visibility!=='hidden'&&w.getComputedStyle(c).display!=='none';})()`);
      assert.equal(visible,true,'battle canvas must be visible before image-loss evidence');
      await page.evaluate(state+'.blocked=true');
      await page.wait(state+'.backup>12');
      const blocked=await page.evaluate('JSON.parse(JSON.stringify('+state+'))');
      const shot=await page.send('Page.captureScreenshot',{format:'jpeg',quality:65});
      console.log('HERO_VISIBILITY_IMAGE:'+slug+'-'+width+':'+shot.data);
      await page.evaluate(state+'.blocked=false');
      await page.wait(state+'.live>'+ (blocked.live+12));
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
      const captureVfx=async action=>{
        await page.evaluate("document.getElementById('battleFrame').contentWindow.__vfxQA={bolt:[],wind:[]}");
        await page.click('[data-action="'+action+'"]');
        const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
        const readVfx=()=>page.evaluate('JSON.parse(JSON.stringify(document.getElementById("battleFrame").contentWindow.__vfxQA))');
        const hasBurst=vfx=>slug==='ky-van'?vfx.bolt.length>=5:vfx.wind.length>=3;
        let vfx={bolt:[],wind:[]};const deadline=Date.now()+6000;
        // Wait on observed canvas draws so x1/x2/x3 and page load variance cannot
        // make a fixed screenshot delay miss the short authored VFX window.
        while(Date.now()<deadline&&!hasBurst(vfx)){await pause(35);vfx=await readVfx();}
        const shot=await page.send('Page.captureScreenshot',{format:'jpeg',quality:70});
        console.log('HERO_VFX_IMAGE:'+slug+'-'+action+'-'+width+':'+shot.data);
        if(slug==='ky-van'){
          assert.ok(vfx.bolt.length>=5,slug+' '+action+' must paint its five-branch lightning burst: '+JSON.stringify(vfx.bolt));
          assert.ok(Math.max(...vfx.bolt.map(x=>x.height))>=280,slug+' '+action+' lightning must use the enlarged sprite: '+JSON.stringify(vfx.bolt));
        }else{
          assert.ok(vfx.wind.length>=3,slug+' '+action+' must paint the three-layer tornado: '+JSON.stringify(vfx.wind));
          // The game scales sprites to the formation depth and mobile canvas; at that
          // scale an enlarged whirlwind is >90px (the unamplified sprite is smaller).
          assert.ok(Math.max(...vfx.wind.map(x=>x.height))>=90,slug+' '+action+' tornado must be enlarged: '+JSON.stringify(vfx.wind));
        }
        await page.wait('window.__SKILL_TEST_QA__?.lastRun?.phase==="complete"',30000);
        return vfx;
      };
      await page.click('[data-action="ultimate"]');
      // Reset this first cast and capture a clean, timed VFX sample for both actions.
      await page.wait('window.__SKILL_TEST_QA__?.lastRun?.phase==="complete"',30000);
      const session=await page.evaluate('window.__SKILL_TEST_QA__.sessionIndex');
      await page.click('#resetBattle');
      await page.wait('window.__SKILL_TEST_QA__?.ready&&window.__SKILL_TEST_QA__.sessionIndex>'+session);
      await page.wait(state+'.live>12');
      const ultimateVfx=await captureVfx('ultimate');
      await page.wait('window.__SKILL_TEST_QA__?.lastRun?.phase==="complete"',30000);
      const secondSession=await page.evaluate('window.__SKILL_TEST_QA__.sessionIndex');
      await page.click('#resetBattle');
      await page.wait('window.__SKILL_TEST_QA__?.ready&&window.__SKILL_TEST_QA__.sessionIndex>'+secondSession);
      await page.wait(state+'.live>12');
      const basicVfx=await captureVfx('basic');
      await page.wait('window.__SKILL_TEST_QA__?.lastRun?.phase==="complete"',30000);
      const exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown');
      const assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&e.params.response.url.includes('/assets/'));
      assert.equal(exceptions.length,0);assert.equal(assetErrors.length,0);
      runs.push({slug,width,height,blocked,ultimate:'complete',basic:'complete',ultimateVfx,basicVfx,exceptions:0,assetErrors:0});
    } finally {await page.close();}
  }
} finally {await browser.close();}
console.log('HERO_VISIBILITY_REPORT:'+JSON.stringify({runs,physicalIOS:'NOT_RUN'}));
