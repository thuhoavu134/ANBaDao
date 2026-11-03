const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {createRequire}=require('node:module');
const {chromium}=createRequire('C:/lt/tools/pw/pts-flow.cjs')('playwright-core');
const root=path.resolve(__dirname,'../..');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rev=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const run=new Date().toISOString().replace(/[:.]/g,'-');
const out=path.join(root,'docs/qa/shop-popup',run);fs.mkdirSync(out,{recursive:true});
const evidence={run,revision:rev,startedAt:new Date().toISOString(),buildSha256:sha(path.join(root,'dist/index.html')),sourceHashes:{},checks:[],images:[],errors:[],physicalSafari:'NOT_TESTED'};
for(const rel of ['src/ui/shop-screen.css','src/ui/shop-3d-runtime.js','src/ui/shop-runtime.js','src/ui/bach-bao-ruong-runtime.js','assets/ui/shop/frame-manifest.json']) evidence.sourceHashes[rel]=sha(path.join(root,rel));
const check=(name,ok,detail)=>{evidence.checks.push({name,ok,detail}); if(!ok)throw Error(name+': '+JSON.stringify(detail));};
(async()=>{let browser;
try{
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 for(const width of [360,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:2});
  page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.goto('http://127.0.0.1:18161/index.html?qa=unlock-all&proof='+run,{waitUntil:'load'});
  const actual=await page.evaluate(async()=>{const r=await fetch(location.href,{cache:'no-store'});const b=await r.arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('')});
  check('served build matches disk '+width,actual===evidence.buildSha256,actual);
  const login=page.locator('#hvLoginContinue'); if(await login.isVisible())await login.click();
  await page.waitForFunction(()=>typeof navTo==='function'&&typeof P==='object');
  await page.evaluate(()=>{P.bachBao=P.bachBao||{};P.bachBao.pts=420;navTo('shop')});
  const capture=async(mode,frame)=>{
   await page.locator(frame).waitFor({state:'visible'});
   const d=await page.evaluate(sel=>{
    const f=document.querySelector(sel),r=f.getBoundingClientRect(),modal=document.querySelector('#hvShopRoot');
    const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
    const xs=[...modal.querySelectorAll('.hv-cityf-x,.hv-ptsf-x,.hv-shop-back,.hv-shopc-x')].filter(vis);
    const hit=xs.every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});
    const hub=document.getElementById(typeof SCREENS==='object'?SCREENS.hub:'hubScreen');
    return {closeCount:xs.length,hit,frame:[r.x,r.y,r.width,r.height],inViewport:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hubVisible:!!hub&&getComputedStyle(hub).display!=='none',backdrop:getComputedStyle(modal).backgroundImage,overflow:document.documentElement.scrollWidth>innerWidth};
   },frame);
   check(mode+' layout '+width,d.closeCount===1&&d.hit&&d.inViewport&&d.hubVisible&&d.backdrop==='none'&&!d.overflow,d);
   const file=path.join(out,`${width}-${mode}.png`);await page.screenshot({path:file});evidence.images.push({file:path.relative(root,file),sha256:sha(file),capturedAt:new Date().toISOString(),viewport:{width,height:844},mode});
  };
  await capture('city','.hv-cityf');
  await page.locator('[data-scity="pts"]').click();await page.waitForTimeout(900);await capture('pts','.hv-ptsf');
  await page.locator('[data-bbr-buy="ss8"]').click();
  await page.waitForFunction(()=>P.bachBao.pts===320);check('exchange '+width,true,{before:420,after:320});
  await page.locator('.hv-ptsf-x').click();await page.waitForTimeout(700);await page.locator('[data-scity="night"]').click();await page.waitForTimeout(900);await capture('night','.hv-shopf');
  await page.locator('.hv-shopf .hv-shop-back').click();await page.waitForTimeout(700);await page.locator('.hv-cityf-x').click();
  check('close '+width,await page.locator('#hvShopRoot').isHidden());
  await page.close();
 }
 check('page errors',evidence.errors.length===0,evidence.errors);
 evidence.status='PASS';
}catch(e){evidence.status='FAIL';evidence.failure=e.stack;process.exitCode=1;}
finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({status:evidence.status,out,checks:evidence.checks.length,failure:evidence.failure}));}
})();

