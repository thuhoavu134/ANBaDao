// Plays the keyed idle pack (6 pages); only current and next pages stay decoded.
function startHongThuongDetailIdle(){
 cancelAnimationFrame(_lucDetailRaf);
 const cv=document.getElementById('hongThuongDetailIdle');if(!cv)return;
 const images=new Map(),dpr=Math.min(2,window.devicePixelRatio||1),width=280,height=430;
 cv.width=width*dpr;cv.height=height*dpr;
 const context=cv.getContext('2d'),started=performance.now(),meta=HONG_THUONG_DETAIL_META;
 const fit=Math.min(width/meta.cellW,height/meta.cellH);
 const drawW=meta.cellW*fit,drawH=meta.cellH*fit,offX=(width-drawW)/2,offY=height-drawH;
 function getPage(page){
  if(!images.has(page)){const image=new Image();image.decoding='async';image.src='assets/characters/hong-thuong/idle-authored-'+page+'.webp';images.set(page,image);}
  return images.get(page);
 }
 function tick(){
  if(!cv.isConnected){images.clear();return;}
  let elapsed=(performance.now()-started)%meta.durationMs,frame=0;
  for(;frame<meta.frameDurationsMs.length-1;frame++){if(elapsed<meta.frameDurationsMs[frame])break;elapsed-=meta.frameDurationsMs[frame];}
  const page=Math.floor(frame/meta.pageFrames),next=(page+1)%meta.pages,image=getPage(page);getPage(next);
  for(const key of images.keys())if(key!==page&&key!==next)images.delete(key);
  if(image.complete&&image.naturalWidth>0){
   context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
   const local=frame%meta.pageFrames;context.drawImage(image,(local%meta.cols)*meta.cellW,Math.floor(local/meta.cols)*meta.cellH,meta.cellW,meta.cellH,offX,offY,drawW,drawH);
  }
  _lucDetailRaf=requestAnimationFrame(tick);
 }
 tick();
}
