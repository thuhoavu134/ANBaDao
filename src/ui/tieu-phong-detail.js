// Plays the supplied lossless idle pack; only current and next mobile pages stay decoded.
function startTieuPhongDetailIdle(targetCanvas){
 if(!targetCanvas)cancelAnimationFrame(_lucDetailRaf);
 let localRaf=0,disposed=false;
 const cv=targetCanvas||document.getElementById('tieuPhongDetailIdle');if(!cv)return;
 const images=new Map(),dpr=Math.min(2,window.devicePixelRatio||1),width=260,height=402;
 cv.width=width*dpr;cv.height=height*dpr;
 const context=cv.getContext('2d'),started=performance.now();
 function getPage(page){
  if(!images.has(page)){const image=new Image();image.decoding='async';image.src='assets/characters/tieu-phong/idle-authored-'+page+'.webp';images.set(page,image);}
  return images.get(page);
 }
 function tick(){
  if(disposed||!cv.isConnected){images.clear();return;}
  let elapsed=(performance.now()-started)%TIEU_PHONG_DETAIL_META.durationMs,frame=0;
  for(;frame<TIEU_PHONG_DETAIL_META.frameDurationsMs.length-1;frame++){if(elapsed<TIEU_PHONG_DETAIL_META.frameDurationsMs[frame])break;elapsed-=TIEU_PHONG_DETAIL_META.frameDurationsMs[frame];}
  const page=Math.floor(frame/9),next=(page+1)%4,image=getPage(page);getPage(next);
  for(const key of images.keys())if(key!==page&&key!==next)images.delete(key);
  if(image.complete&&image.naturalWidth>0){
   context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
   const local=frame%9;context.drawImage(image,(local%3)*432,Math.floor(local/3)*668,432,668,0,0,width,height);
  }
  localRaf=requestAnimationFrame(tick);if(!targetCanvas)_lucDetailRaf=localRaf;
 }
 tick();
 return ()=>{disposed=true;cancelAnimationFrame(localRaf);images.clear();};
}

