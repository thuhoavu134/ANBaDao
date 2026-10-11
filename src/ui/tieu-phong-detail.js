// Shares the existing detail animation lifecycle; keep only current/next idle pages.
function startTieuPhongDetailIdle(){
 cancelAnimationFrame(_lucDetailRaf);
 const cv=document.getElementById('tieuPhongDetailIdle');if(!cv)return;
 const images=new Map(),dpr=Math.min(2,window.devicePixelRatio||1),width=270,height=248;
 cv.width=width*dpr;cv.height=height*dpr;
 const context=cv.getContext('2d'),started=performance.now();
 function getPage(page){
  if(!images.has(page)){const image=new Image();image.decoding='async';image.src='assets/characters/tieu-phong/idle-'+page+'.webp';images.set(page,image);}
  return images.get(page);
 }
 function tick(){
  if(!cv.isConnected){images.clear();return;}
  let elapsed=(performance.now()-started)%TIEU_PHONG_DETAIL_META.durationMs,frame=0;
  for(;frame<TIEU_PHONG_DETAIL_META.frameDurationsMs.length-1;frame++){if(elapsed<TIEU_PHONG_DETAIL_META.frameDurationsMs[frame])break;elapsed-=TIEU_PHONG_DETAIL_META.frameDurationsMs[frame];}
  const page=Math.floor(frame/16),next=(page+1)%6,image=getPage(page);getPage(next);
  for(const key of images.keys())if(key!==page&&key!==next)images.delete(key);
  if(image.complete&&image.naturalWidth>0){
   context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
   const local=frame%16;context.drawImage(image,(local%4)*480,Math.floor(local/4)*440,480,440,0,0,width,width*440/480);
  }
  _lucDetailRaf=requestAnimationFrame(tick);
 }
 tick();
}
