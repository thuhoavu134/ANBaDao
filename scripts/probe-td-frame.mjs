import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser();
try{
  const page=await browser.page(1280,800,1);
  await page.send('Page.navigate',{url:browser.origin+'/tich-dao-test.html'});
  await new Promise(r=>setTimeout(r,16000));
  const s=await page.evaluate(`(()=>{
    const f=document.getElementById('battleFrame'),w=f&&f.contentWindow;
    return {
      frameSrc:(f&&f.src||'').slice(-50),
      hasApi:!!(w&&w.__HON_VIET__),
      mode:w&&w.__HON_VIET__&&w.__HON_VIET__.getState?w.__HON_VIET__.getState().mode:'?',
      unitCount:w&&w.__HON_VIET__?w.__HON_VIET__.getUnits().length:0,
      unitIds:w&&w.__HON_VIET__?w.__HON_VIET__.getUnits().map(u=>u.id).slice(0,12):[],
      errs:w?Array.from(w.__errs||[]).slice(0,5):[],
      qaErrs:(window.__SKILL_TEST_QA__?.errors||[]).map(x=>String(x).slice(0,300))
    };
  })()`);
  console.log(JSON.stringify(s,null,1).slice(0,3000));
}catch(e){console.log('probe fail',String(e).slice(0,300));}
finally{await browser.close();}
