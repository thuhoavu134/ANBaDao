// Plays the supplied lossless idle pack; only current and next mobile pages stay decoded.
function startTichDaoDetailIdle(targetCanvas){
 if(!targetCanvas)cancelAnimationFrame(_lucDetailRaf);
 let localRaf=0,disposed=false;
 const cv=targetCanvas||document.getElementById('tichDaoDetailIdle');if(!cv)return;
 const images=new Map(),dpr=Math.min(2,window.devicePixelRatio||1),width=260,height=402;
 cv.width=width*dpr;cv.height=height*dpr;
 const context=cv.getContext('2d'),started=performance.now(),meta=TICH_DAO_DETAIL_META;
 // Fit the authored 379x440 content box into the portrait stage, bottom anchored.
 const fit=Math.min(width/meta.contentSize[0],height/meta.contentSize[1]);
 const drawW=meta.cellW*fit,drawH=meta.cellH*fit,offX=-(meta.contentOffset?.[0]||0)*fit,offY=height-drawH;
 function getPage(page){
  if(!images.has(page)){const image=new Image();image.decoding='async';image.src='assets/characters/tich-dao/idle-authored-'+page+'.webp';images.set(page,image);}
  return images.get(page);
 }
 function tick(){
  if(disposed||!cv.isConnected){images.clear();return;}
  let elapsed=(performance.now()-started)%meta.durationMs,frame=0;
  for(;frame<meta.frameDurationsMs.length-1;frame++){if(elapsed<meta.frameDurationsMs[frame])break;elapsed-=meta.frameDurationsMs[frame];}
  const page=Math.floor(frame/meta.pageFrames),next=(page+1)%meta.pages,image=getPage(page);getPage(next);
  for(const key of images.keys())if(key!==page&&key!==next)images.delete(key);
  if(image.complete&&image.naturalWidth>0){
   context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
   const local=frame%meta.pageFrames;context.drawImage(image,(local%meta.cols)*meta.cellW,Math.floor(local/meta.cols)*meta.cellH,meta.cellW,meta.cellH,offX,offY,drawW,drawH);
  }
  localRaf=requestAnimationFrame(tick);if(!targetCanvas)_lucDetailRaf=localRaf;
 }
 tick();
 return ()=>{disposed=true;cancelAnimationFrame(localRaf);images.clear();};
}
