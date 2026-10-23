// Probe the hero-detail stage of one or more heroes: which canvas/img draws the idle, and does it animate?
import { launch, attach } from './qa-run.mjs';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['co_nuong'];
const b = await launch({ width: 390, height: 844 });
const c = await attach((await (await fetch(b.base + '/json/list')).json()).find((t) => t.type === 'page').webSocketDebuggerUrl);
await c.resize(390, 844);
await c.goto('http://127.0.0.1:18091/index.html?qa=unlock-all', 6000);
await c.eval(`(async()=>{const el=[...document.querySelectorAll('button,a,div[role=button]')].find(e=>/Tiếp tục chơi game/i.test(e.textContent||''));if(el)el.click();await new Promise(r=>setTimeout(r,2500));navTo('heroes');await new Promise(r=>setTimeout(r,1500));return 1;})()`);

for (const id of ids) {
  const r = await c.eval('(async()=>{const id=' + JSON.stringify(id) + ';navTo("heroes");await new Promise(r=>setTimeout(r,900));' +
    'let card=document.querySelector(\'[data-hero-id="\'+id+\'"]\');' +
    'if(!card){const sc=document.querySelector("#heroList,.hero-list,.hlist,.scroll,.content")||document.scrollingElement;' +
    'for(let i=0;i<16&&!card;i++){sc.scrollTop=sc.scrollHeight;window.scrollBy(0,600);await new Promise(r=>setTimeout(r,200));card=document.querySelector(\'[data-hero-id="\'+id+\'"]\');}}' +
    'for(let i=0;i<30&&!card;i++){await new Promise(r=>setTimeout(r,200));card=document.querySelector(\'[data-hero-id="\'+id+\'"]\');}' +'if(card){card.click();await new Promise(r=>setTimeout(r,2500));}' +'else if(typeof renderHeroDetail===\'function\'){renderHeroDetail(id);await new Promise(r=>setTimeout(r,2500));}' +'else return {id,card:false,idsOnPage:[...document.querySelectorAll(\'[data-hero-id]\')].map(e=>e.getAttribute(\'data-hero-id\'))};' +
    'const stage=document.querySelector("#hdBody .hstage")||document.querySelector(".hstage");' +
    'const cvs=[...(stage?stage.querySelectorAll("canvas"):[])].map(cv=>({id:cv.id,w:cv.width,h:cv.height,vis:cv.getBoundingClientRect().width>0&&getComputedStyle(cv).display!=="none"}));' +
    'const imgs=[...(stage?stage.querySelectorAll("img"):[])].map(i=>({src:(i.currentSrc||i.src||"").split("/").slice(-2).join("/"),vis:i.getBoundingClientRect().width>0&&getComputedStyle(i).display!=="none"}));' +
    'const hash=cv=>{try{const d=cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data;let h=0,n=0;for(let i=3;i<d.length;i+=4*97){h=(h*31+d[i]+d[i-1])|0;if(d[i]>24)n++;}return [h,n];}catch(e){return ["err",0];}};' +
    'const live=[];for(const cv of (stage?stage.querySelectorAll("canvas"):[])){const a=hash(cv);await new Promise(r=>setTimeout(r,450));const b2=hash(cv);live.push({id:cv.id,opaque:b2[1],animating:a[0]!==b2[0]});}' +
    'return {id,card:true,stageId:stage&&stage.dataset.heroId,canvases:cvs,imgs,live};})()');
  console.log(JSON.stringify(r));
}
await b.kill();
