// Geometry is in world coordinates, using the same body/formation owners as HUD.
function drawOwnerDinhShield(context,unit,frame){
 const body=battleCharacterBody(unit),height=body.height*1.36;
 // The bell's visible 139px sits inside a 160px source fitted to a 270px cell.
 // This gives ~1.15 body heights, centered on the actual buff recipient.
 return __hvPersistentPages.draw(context,'dinh-shield',frame,body.centerX,body.centerY,
  height*480/270,height,{baseline:height/2,screen:true,alpha:.82,flip:battleVfxMirror(unit)});
}
function drawOwnerDinhUltimate(context,image,sx,sy,cellW,cellH,actor){
 const rows=PORTRAIT_FORMATION.rows,top=(rows[0]+rows[1])/2,bottom=(rows[1]+rows[2])/2;
 const height=bottom-top,width=height*480/270;
 context.save();context.translate(WORLD.width/2,(top+bottom)/2);
 context.scale(battleVfxMirror(actor)?-1:1,1);
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 // Remove only the compatibility cell's empty padding, not any authored pixels.
 // Build fits the 480x270 source into 262x147 at (4,167) in a 270x480 cell.
 context.drawImage(image,sx+cellW*4/270,sy+cellH*167/480,
  cellW*262/270,cellH*147/480,-width/2,-height/2,width,height);
 context.restore();
}
