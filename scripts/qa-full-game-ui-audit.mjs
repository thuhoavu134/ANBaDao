import {mkdirSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
import {startBrowser} from './qa-battle-readiness-browser.mjs';
const out='evidence/full-ui-audit';mkdirSync(out,{recursive:true});
const browser=await startBrowser(),report={revision:process.env.GITHUB_SHA,scope:'Full production build, actual owners; QA unlock only for gated-screen inventory; not owner-preview default',runs:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const routes=['hub','heroes','team','daily','campaign','summon','shop','arena','expedition','hunt','festival','forge','bag','mail','jobs','guild','clan','friends','chat','net','tower','vault','journey'];
try{for(const [width,height] of [[390,844],[1280,800]]){
 const run={width,height,screens:[]};report.runs.push(run);const tiles=[];
 for(const route of routes){
  const page=await browser.page(width,height,1);const row={route};run.screens.push(row);
  try{
   await page.send('Page.navigate',{url:browser.origin+'/?qa=unlock-all'});
   await page.wait('typeof navTo==="function" && !!document.getElementById("hvLoginContinue")');
   await page.click('#hvLoginContinue');await page.wait('document.getElementById("hvLoginRoot").hidden');
   await page.evaluate('document.getElementById("hvQaFullAccess")?.remove()');
   if(route!=='hub'){
    const selector='#hubScreen [data-art-go="'+route+'"]';
    const present=await page.evaluate('!!document.querySelector('+JSON.stringify(selector)+')');
    if(present){await page.click(selector);row.entry='real hub click';}
    else {await page.evaluate('navTo('+JSON.stringify(route)+')');row.entry='actual router, secondary inventory';}
   }else row.entry='normal boot';
   await pause(route==='campaign'?2200:700);
   row.snapshot=await page.evaluate(`(()=>{const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&r.bottom>0&&r.top<innerHeight;};return {screen:ST.screen,body:document.body.className,overflow:document.documentElement.scrollWidth>innerWidth,labels:Array.from(document.querySelectorAll('button,[role=button]')).filter(visible).map(e=>({id:e.id,text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,70),action:e.dataset.artGo||e.dataset.nav||e.dataset.assist||null})).slice(0,90),broken:Array.from(document.images).filter(i=>visible(i)&&i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src')),text:document.body.innerText.slice(0,1500)}})()`);
   const im=await page.send('Page.captureScreenshot',{format:'jpeg',quality:75});writeFileSync(out+'/'+width+'-'+route+'.jpg',Buffer.from(im.data,'base64'));
   const thumb=await sharp(Buffer.from(im.data,'base64')).resize(195,422,{fit:'contain',background:'#eee'}).jpeg().toBuffer();tiles.push({input:thumb,left:(tiles.length%4)*195,top:Math.floor(tiles.length/4)*450});
   if(width===390&&['hub','team','daily','campaign','heroes','summon'].includes(route))console.log('FULL_UI_IMAGE:'+route+':'+im.data);
   row.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
   row.assetErrors=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400&&new URL(e.params.response.url).pathname.startsWith('/assets/')).map(e=>e.params.response.url);
   row.ok=!row.exceptions.length&&!row.snapshot.broken.length&&!row.assetErrors.length;
  }catch(e){row.ok=false;row.error=String(e.stack||e);}finally{await page.close();}
 }
 if(tiles.length){const sheet=await sharp({create:{width:780,height:Math.ceil(tiles.length/4)*450,channels:3,background:'#ddd'}}).composite(tiles).jpeg({quality:80}).toBuffer();console.log('FULL_UI_SHEET:'+width+':'+sheet.toString('base64'));writeFileSync(out+'/'+width+'-sheet.jpg',sheet);}
 run.ok=run.screens.every(x=>x.ok);
}}finally{await browser.close();}
report.ok=report.runs.every(x=>x.ok);writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('FULL_UI_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
