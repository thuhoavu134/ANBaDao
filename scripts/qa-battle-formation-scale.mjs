import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { startBrowser } from './qa-battle-readiness-browser.mjs';

const out=resolve(process.env.HV_LAYOUT_EVIDENCE_DIR||'evidence/battle-layout');
mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const hook=String.raw`
(()=>{
  const proto=CanvasRenderingContext2D.prototype;
  const original=proto.drawImage;
  const calls=[];
  const wanted=src=>/assets\/(?:characters\/(?:linh-dong|bach-dien)\/[^?#]*idle[^?#]*\.(?:webp|png)|battle-runtime\/embedded-(?:0[3-9]|10)\.(?:webp|png))/i.test(src);
  proto.drawImage=function(image,...args){
    try{
      const src=String(image?.currentSrc||image?.src||'');
      if(wanted(src)&&args.length>=4){
        const m=this.getTransform();
        calls.push({image,src,args:args.map(Number),matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f},at:performance.now()});
        if(calls.length>3000)calls.splice(0,calls.length-2200);
      }
    }catch(_){}
    return original.call(this,image,...args);
  };
  const alphaCache=new Map();
  function normalized(call){
    const a=call.args,img=call.image;
    if(a.length>=8)return {sx:a[0],sy:a[1],sw:a[2],sh:a[3],dx:a[4],dy:a[5],dw:a[6],dh:a[7]};
    if(a.length>=4)return {sx:0,sy:0,sw:img.naturalWidth||img.width,sh:img.naturalHeight||img.height,dx:a[0],dy:a[1],dw:a[2],dh:a[3]};
    return null;
  }
  function alphaBounds(call){
    const r=normalized(call); if(!r||!(r.sw>0&&r.sh>0&&r.dw&&r.dh)||!call.image?.complete)return null;
    const key=[call.src,r.sx,r.sy,r.sw,r.sh].join('|');
    let box=alphaCache.get(key);
    if(box===undefined){
      try{
        const w=Math.max(1,Math.round(r.sw)),h=Math.max(1,Math.round(r.sh));
        const c=document.createElement('canvas');c.width=w;c.height=h;
        const cx=c.getContext('2d',{willReadFrequently:true});
        cx.clearRect(0,0,w,h);cx.drawImage(call.image,r.sx,r.sy,r.sw,r.sh,0,0,w,h);
        const data=cx.getImageData(0,0,w,h).data;
        let left=w,top=h,right=-1,bottom=-1;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          if(data[(y*w+x)*4+3]<=16)continue;
          if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;
        }
        box=right>=left?{left,top,right: right+1,bottom: bottom+1,w,h}:null;
      }catch(_){box=null;}
      alphaCache.set(key,box);
    }
    if(!box)return null;
    const lx0=r.dx+(box.left/box.w)*r.dw,lx1=r.dx+(box.right/box.w)*r.dw;
    const ly0=r.dy+(box.top/box.h)*r.dh,ly1=r.dy+(box.bottom/box.h)*r.dh;
    const m=call.matrix;
    const map=(x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
    const pts=[map(lx0,ly0),map(lx1,ly0),map(lx0,ly1),map(lx1,ly1)];
    return {
      left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),
      top:Math.min(...pts.map(p=>p.y)),bottom:Math.max(...pts.map(p=>p.y))
    };
  }
  window.__HV_LAYOUT_MEASURE=()=>{
    const canvas=document.getElementById('gameCanvas');
    const viewport=document.getElementById('gameViewport')||canvas?.parentElement;
    const cr=canvas.getBoundingClientRect(),vr=viewport.getBoundingClientRect();
    const dpr=canvas.width/Math.max(1,cr.width);
    const recent=calls.filter(c=>performance.now()-c.at<2500);
    const records=recent.map(call=>{
      const b=alphaBounds(call); if(!b)return null;
      const bounds={left:b.left/dpr,top:b.top/dpr,right:b.right/dpr,bottom:b.bottom/dpr};
      return {src:call.src.replace(location.origin+'/',''),anchor:{x:call.matrix.e/dpr,y:call.matrix.f/dpr},bounds,
        visibleWidth:bounds.right-bounds.left,visibleHeight:bounds.bottom-bounds.top};
    }).filter(Boolean);
    const units=window.__HON_VIET__?.getUnits?.()||[];
    const scale=Math.max(cr.width/1600,cr.height/870);
    const ox=(cr.width-1600*scale)/2,oy=(cr.height-870*scale)/2;
    const expected=u=>({x:ox+(u.x??u.baseX)*scale,y:oy+(u.y??u.baseY)*scale});
    const isSpecial=(u,kind)=>String(u.sourceId||u.sourceHeroId||'').includes(kind);
    const picked=[];
    for(const u of units){
      const want=isSpecial(u,'linh_dong')?'linh-dong':isSpecial(u,'bach_dien')?'bach-dien':'embedded-';
      const e=expected(u);
      const candidates=records.filter(r=>r.src.includes(want)).map(r=>({...r,distance:Math.hypot(r.anchor.x-e.x,r.anchor.y-e.y)}))
        .filter(r=>r.distance<90).sort((a,b)=>a.distance-b.distance||b.visibleHeight-a.visibleHeight);
      if(candidates[0])picked.push({id:u.id,sourceId:u.sourceId||u.sourceHeroId||null,team:u.team,slot:u.slot,world:{x:u.x,y:u.y},...candidates[0]});
    }
    const uniq=[];const seen=new Set();
    for(const row of picked){const key=row.id;if(seen.has(key))continue;seen.add(key);uniq.push(row);}
    const topHud=document.querySelector('#roundRibbon,.round-ribbon,.turn-order');
    const bottomHud=document.querySelector('.action-zone');
    const relativeRect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top-cr.top,bottom:r.bottom-cr.top,left:r.left-cr.left,right:r.right-cr.left};};
    const top=relativeRect(topHud),bottom=relativeRect(bottomHud);
    function separation(a,b){
      const dx=Math.max(0,Math.max(a.bounds.left-b.bounds.right,b.bounds.left-a.bounds.right));
      const dy=Math.max(0,Math.max(a.bounds.top-b.bounds.bottom,b.bounds.top-a.bounds.bottom));
      return Math.hypot(dx,dy);
    }
    for(const row of uniq){
      row.edge={left:row.bounds.left,right:cr.width-row.bounds.right,top:row.bounds.top,bottom:cr.height-row.bounds.bottom};
      row.hud={topGap:top?row.bounds.top-top.bottom:null,bottomGap:bottom?bottom.top-row.bounds.bottom:null};
      row.nearestGap=Math.min(...uniq.filter(x=>x.id!==row.id).map(x=>separation(row,x)),Infinity);
    }
    return {viewport:{width:innerWidth,height:innerHeight,canvasWidth:cr.width,canvasHeight:cr.height,worldScale:scale,
      worldCrop:{left:-ox/scale,right:(cr.width-ox)/scale,top:-oy/scale,bottom:(cr.height-oy)/scale}},
      topHud:top,bottomHud:bottom,units:uniq,seenSources:[...new Set(recent.map(c=>c.src.replace(location.origin+'/','')))].slice(0,80)};
  };
})();
`;

new Function(hook);

async function runPage(browser,{name,width,height,dpr,url}){
  const page=await browser.page(width,height,dpr);
  const result={name,width,height,dpr,url,errors:[]};
  try{
    await page.send('Page.addScriptToEvaluateOnNewDocument',{source:hook});
    await page.send('Page.navigate',{url:browser.origin+url});
    await page.wait('!!window.__HON_VIET__ && !!document.getElementById("gameCanvas")',30000);
    await sleep(1800);
    if(await page.evaluate('!!document.querySelector("#startBattle") && !document.querySelector("#startBattle").disabled')){
      await page.click('#startBattle').catch(()=>{});
      await page.wait('__HON_VIET__.getState().mode === "battle"',15000).catch(()=>{});
      await sleep(250);
      if(await page.evaluate('__HON_VIET__.getState().auto')) await page.evaluate('__HON_VIET__.toggleAuto()');
      await page.wait('__HON_VIET__.getUnits().every(u=>Math.abs(Number(u.x)-Number(u.baseX))<1&&Math.abs(Number(u.y)-Number(u.baseY))<1)',15000).catch(()=>{});
      await sleep(450);
    }
    if(url.includes('qaSplus42=')) await sleep(2500);
    await page.wait('typeof window.__HV_LAYOUT_MEASURE === "function"',5000);
    result.measurement=await page.evaluate('__HV_LAYOUT_MEASURE()');
    result.state=await page.evaluate('__HON_VIET__.getState()');
    result.runtimeErrors=page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails?.text||'runtime exception');
    const file=name+'.png'; await page.screenshot(join(out,file)); result.screenshot=file;
    const measured=result.measurement?.units||[];
    result.clipped=measured.filter(u=>Object.values(u.edge||{}).some(v=>Number.isFinite(v)&&v<-1)).map(u=>u.id);
    result.overlaps=measured.filter(u=>Number.isFinite(u.nearestGap)&&u.nearestGap<1).map(u=>u.id);
    result.ok=Boolean(measured.length)&&!result.runtimeErrors.length&&!result.clipped.length&&!result.overlaps.length;
  }catch(error){
    result.ok=false;result.errors.push(String(error.stack||error));
    try{await page.screenshot(join(out,name+'-failure.png'));}catch{}
  }finally{await page.close();}
  return result;
}

const browser=await startBrowser();
const report={revision:process.env.GITHUB_SHA||'local',scope:'Actual generated Canvas2D alpha bounds; no atlas-canvas-size inference.',runs:[]};
try{
  for(const [name,w,h] of [['mobile-390',390,844],['mobile-393',393,852],['mobile-430',430,932],['desktop-1280',1280,800]]){
    report.runs.push(await runPage(browser,{name,width:w,height:h,dpr:w<600?2:1,url:'/battle.html?linhDongQa=1&bachDienQa=1&qaPhase01=1'}));
  }
  report.runs.push(await runPage(browser,{name:'splus-linh-390',width:390,height:844,dpr:2,url:'/battle.html?qaSplus42=hero_splus_linh_dong'}));
  report.runs.push(await runPage(browser,{name:'splus-bach-390',width:390,height:844,dpr:2,url:'/battle.html?qaSplus42=hero_splus_bach_dien&bachDienQa=1'}));
}finally{await browser.close();}
report.ok=report.runs.every(r=>r.ok);
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({ok:report.ok,runs:report.runs.map(r=>({name:r.name,ok:r.ok,units:r.measurement?.units?.map(u=>({id:u.id,sourceId:u.sourceId,slot:u.slot,w:+u.visibleWidth.toFixed(1),h:+u.visibleHeight.toFixed(1),edge:u.edge,hud:u.hud,gap:Number.isFinite(u.nearestGap)?+u.nearestGap.toFixed(1):null})),errors:r.errors,clipped:r.clipped,overlaps:r.overlaps,seenSources:r.measurement?.seenSources}))},null,2));
if(!report.ok)process.exitCode=1;
