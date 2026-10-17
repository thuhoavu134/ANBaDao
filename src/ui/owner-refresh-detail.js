// Uses the existing detail RAF owner; closing/replacing the detail cancels it.
function startOwnerRefreshDetailIdle(id){
 cancelAnimationFrame(_lucDetailRaf);
 const stage=document.querySelector('#hdBody .hstage[data-hero-id="'+id+'"]');if(!stage)return;
 const portrait=stage.querySelector('.hsava');if(!portrait)return;
 const cv=document.createElement('canvas'),ctx=cv.getContext('2d');if(!ctx)return;
 const dpr=Math.min(2,window.devicePixelRatio||1),size=300;
 cv.width=cv.height=size*dpr;cv.style.cssText='width:300px;height:300px;max-width:100%;display:block;margin:0 auto;position:relative;z-index:2';
 cv.setAttribute('aria-label',(id==='dinh_loi'?'Đình Lôi':'Thầy Mo')+' idle');
 portrait.after(cv);
 const image=new Image();image.decoding='async';
 let meta=null,started=performance.now();
 const abort=new AbortController();
 fetch('assets/owner-refresh-20261018/manifest.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('idle manifest '+r.status);return r.json();}).then(m=>{if(!cv.isConnected)return;meta=m.clips[id==='dinh_loi'?'dinh-idle':'thay-idle'];image.src='assets/owner-refresh-20261018/'+meta.file;}).catch(()=>{});
 function tick(){
  if(!cv.isConnected||ST.screen!=='heroDetail'){abort.abort();return;}
  if(meta&&image.complete&&image.naturalWidth>1){
   portrait.hidden=true;portrait.style.display='none';
   const total=meta.durations.reduce((a,b)=>a+b,0);let t=(performance.now()-started)%total,f=0;
   while(f<meta.frames-1&&t>=meta.durations[f])t-=meta.durations[f++];
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   const scale=285/meta.cellH,w=meta.cellW*scale;
   ctx.drawImage(image,f%meta.cols*meta.cellW,Math.floor(f/meta.cols)*meta.cellH,meta.cellW,meta.cellH,(size-w)/2,15,w,285);
  }
  _lucDetailRaf=requestAnimationFrame(tick);
 }
 _lucDetailRaf=requestAnimationFrame(tick);
}
