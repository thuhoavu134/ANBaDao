// Geometry is in world coordinates, using the same body/formation owners as HUD.
function drawOwnerDinhShield(context,unit,frame){
 const body=battleCharacterBody(unit),height=body.height*1.36;
 // The bell's visible 139px sits inside a 160px source fitted to a 270px cell.
 // This gives ~1.15 body heights, centered on the actual buff recipient.
 return __hvPersistentPages.draw(context,'dinh-shield',frame,body.centerX,body.centerY,
  height*480/270,height,{baseline:height/2,screen:true,alpha:.82,flip:battleVfxMirror(unit)});
}
// Keep the authored landscape size; do not squeeze the clip into a row band.
function drawOwnerDinhUltimate(context,image,sx,sy,cellW,cellH,actor){
 const rows=PORTRAIT_FORMATION.rows,height=270,width=480;
 context.save();context.translate(WORLD.width/2,rows[1]);
 context.scale(battleVfxMirror(actor)?-1:1,1);
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 // 480x270 content uniformly fitted inside 480x270 with four-pixel margins.
 context.drawImage(image,sx+cellW*7/480,sy+cellH*4/270,
  cellW*466/480,cellH*262/270,-width/2,-height/2,width,height);
 context.restore();
}
function ownerDinhProtectedAlly(actor,target,friends){
 const teammates=friends.filter(u=>u!==actor&&u.hp>0&&u.team===actor.team);
 return teammates.includes(target)?target:Core.lowestHealth(teammates)||actor;
}
// The supplied ATK already travels within its frames. Both consecutive source
// ranges must share one fixed stage; translating the first and restarting the
// second at the victim makes the same flying shield appear to attack twice.
function drawOwnerDinhAttack(context,image,frame,actor,target){
 if(!image?.complete||image.naturalWidth<2)return false;
 const a=battleCharacterBody(actor),b=battleCharacterBody(target);
 const width=Math.max(300,Math.abs(b.centerX-a.centerX)+200),height=width*270/480;
 const cellW=image.naturalWidth/8,cellH=image.naturalHeight/8;
 context.save();context.translate((a.centerX+b.centerX)/2,(a.centerY+b.centerY)/2);
 context.scale(battleVfxMirror(actor)?-1:1,1);
 context.drawImage(image,frame%8*cellW,Math.floor(frame/8)*cellH,cellW,cellH,-width/2,-height/2,width,height);
 context.restore();return true;
}
function ownerRefreshSoundEvent(actor,action){
 const id=String(actor?.sourceId||actor?.sourceHeroId||actor?.id||'');
 if(id==='dinh_loi')return 'dinh-loi-'+(action==='ultimate'?'ultimate':action==='skill'?'skill':'atk');
 if(['thay_mo','thay-mo','hero_thay_mo'].includes(id)&&action==='ultimate')return 'thay-mo-ultimate';
 return null;
}
