import {startBrowser} from './qa-battle-readiness-browser.mjs';
const browser=await startBrowser(), report={revision:process.env.GITHUB_SHA,runs:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try { for(const [width,height] of [[390,844],[320,740],[620,930],[1280,800]]) {
 const page=await browser.page(width,height,1), row={width,height,checks:[]}; report.runs.push(row);
 try {
  await page.send('Page.navigate',{url:browser.origin+'/'});
  await page.wait('typeof navTo==="function" && !!document.getElementById("hvLoginContinue")');
  await page.click('#hvLoginContinue');await page.wait('document.getElementById("hvLoginRoot").hidden');
  for(const route of ['hub','heroes','team','campaign']) {
   if(route!=='hub') await page.evaluate('navTo('+JSON.stringify(route)+')');
   await pause(route==='campaign'?2300:800);
   const snapshot=await page.evaluate(`(()=>{const sel=${JSON.stringify({hub:'#hubScreen',heroes:'#hvHeroRosterV4',team:'#hvGearRoot',campaign:'#hvCampaignScene'})}[${JSON.stringify(route)}],root=document.querySelector(sel);return {route:ST.screen,visible:!!root&&root.getBoundingClientRect().height>0,overflow:document.documentElement.scrollWidth>innerWidth,buttons:root?.querySelectorAll('button').length||0};})()`);
   row.checks.push({name:route+' route',ok:snapshot.route===route&&snapshot.visible&&!snapshot.overflow,snapshot});
   if(route==='heroes') {
    const controls=await page.evaluate(`Array.from(document.querySelectorAll('#hvHeroRosterV4 .v4-tab,#hvHeroRosterV4 .v4-filter button,#hvHeroRosterV4 select')).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent,width:r.width,height:r.height};})`);
    row.controls=controls;row.checks.push({name:'roster controls at least 44px',ok:controls.length>=12&&controls.every(c=>c.width>=44&&c.height>=44)});
    row.grid=await page.evaluate(`(()=>{const g=document.querySelector('#hvHeroRosterV4 .v4-grid'),r=g.getBoundingClientRect();return {client:g.clientWidth,scroll:g.scrollWidth,columns:getComputedStyle(g).gridTemplateColumns,cards:Array.from(g.querySelectorAll('.v4-card')).slice(0,8).map(c=>{const b=c.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,inside:b.left>=r.left&&b.right<=r.right};})};})()`);
    row.checks.push({name:'all four roster columns inside viewport',ok:row.grid.scroll<=row.grid.client+1&&row.grid.cards.every(c=>c.inside)});
    row.checks.push({name:'roster rows do not overlap',ok:row.grid.cards.length>=8&&row.grid.cards.slice(0,4).every((c,i)=>c.bottom<=row.grid.cards[i+4].top)});
    await page.click('[data-roster-scope="all"]');
    row.checks.push({name:'catalog tab works',ok:await page.evaluate('document.querySelector("[data-roster-scope=all]").getAttribute("aria-pressed")==="true"')});
    await page.click('[data-roster-nav="team"]');await pause(150);
    row.checks.push({name:'roster assist navigation works',ok:await page.evaluate('ST.screen==="team" && document.getElementById("hvHeroRosterV4").hidden')});
    await page.evaluate('navTo("heroes")');await pause(100);
   }
   if(route==='team') {
    await page.click('[data-assist="gear"] small');await pause(200);
    row.checks.push({name:'assist equipment opens',ok:await page.evaluate('document.querySelector("#hvGearRoot [data-gear-view=board]").classList.contains("is-active")')});
    await page.click('[data-gear-wheel]');await pause(200);
    row.checks.push({name:'equipment back returns to assist wheel',ok:await page.evaluate('ST.screen==="team"&&!document.getElementById("hvGearRoot").hidden&&document.querySelector("#hvGearRoot [data-gear-view=wheel]").classList.contains("is-active")')});
   }
   if(route==='campaign') {
    row.dock=await page.evaluate(`(()=>{const e=document.querySelector('#hvCampaignScene .cs-dock'),background=getComputedStyle(e).backgroundImage,color=getComputedStyle(e.querySelector('button')).color;const rgb=s=>(s.match(/[0-9.]+/g)||[]).slice(0,3).map(Number),L=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),t=L(rgb(color)),contrasts=(background.match(/rgb\\([^)]+\\)/g)||[]).map(s=>{const b=L(rgb(s));return (Math.max(t,b)+.05)/(Math.min(t,b)+.05);});return {background,color,contrasts};})()`);
    row.checks.push({name:'campaign dock readable contrast',ok:row.dock.contrasts.length>0&&row.dock.contrasts.every(c=>c>=4.5)});
    await page.click('.cs-chest-fab');await pause(200);
    row.checks.push({name:'afk reward sheet opens',ok:await page.evaluate('!!document.querySelector("#hvCampaignScene dialog[open]")')});
    await page.click('#hvCampaignScene dialog[open] .cs-sheet-close');await pause(150);
    row.checks.push({name:'afk reward sheet closes',ok:await page.evaluate('!document.querySelector("#hvCampaignScene dialog[open]")')});
   }
   const shot=await page.send('Page.captureScreenshot',{format:'jpeg',quality:80});
   console.log('UI_POLISH_IMAGE:'+width+':'+route+':'+shot.data);
  }
  row.exceptions=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
  row.ok=row.checks.every(x=>x.ok)&&!row.exceptions.length;
 }catch(e){row.ok=false;row.error=String(e.stack||e);}finally{await page.close();}
}}finally{await browser.close();}
report.ok=report.runs.every(r=>r.ok);console.log('UI_POLISH_REPORT:'+JSON.stringify(report));if(!report.ok)process.exitCode=1;
