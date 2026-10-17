// Offline Canvas study of production VFX functions, not a full game capture.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','VFX Sans');
(async()=>{
 const out=__dirname,root=path.resolve(out,'../../..'),source=fs.readFileSync(path.join(root,'src/runtime/splus-battle-bridge.js'),'utf8');
 const images={};for(const file of ['vfx-basic.webp','vfx-ultimate.webp','vfx-parasite-smoke.webp'])images['assets/vfx/co-nuong/'+file]=await loadImage(path.join(root,'assets/vfx/co-nuong',file));
 let now=0;const a={id:'a',sourceId:'hero_splus_co_nuong',team:'player',hp:100,x:110,y:280},t={id:'t',team:'enemy',hp:100,x:720,y:280},b={id:'b',sourceId:'hero_splus_co_nuong',team:'enemy',hp:100,x:850,y:570},v={id:'v',team:'player',hp:100,x:240,y:570};const units=[a,t,b,v];
 const c=vm.createContext({console,state:{speed:1,battleId:1},units,innerWidth:1280,TEAM_ENEMY:'enemy',performance:{now:()=>now},__hvIsSkipping:()=>false,getUnit:id=>units.find(x=>x.id===id),battleCharacterBody:u=>({centerX:u.x,centerY:u.y-85,footY:u.y,height:170})});
 vm.runInContext(source,c);c.images=images;vm.runInContext("coNuongImage=src=>{const image=images[src];return image?{complete:true,naturalWidth:image.width,image}:null};coNuongAtlas=(function(original){return function(ctx,...args){const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...rest)=>draw(im.image||im,...rest);try{return original(ctx,...args)}finally{ctx.drawImage=draw}}})(coNuongAtlas);splusCombat=()=>({hud:u=>(u.id==='t'||u.id==='v')&&performance.now()>=991&&performance.now()<4380?[{type:'parasite',sourceId:u.id==='t'?'a':'b',stacks:1}]:[]});",c);
 vm.runInContext("coNuongImpacts.push({kind:'vfx-basic',actor:units[0],target:units[1],start:600,duration:1292,speed:1},{kind:'vfx-basic',actor:units[2],target:units[3],start:600,duration:1292,speed:1},{kind:'vfx-ultimate',target:units[1],start:4380,duration:900,speed:1},{kind:'vfx-ultimate',target:units[3],start:4380,duration:900,speed:1,mirror:true});",c);
 vm.runInContext("for(const start of [5280,6180])for(const target of [units[1],units[3]])coNuongImpacts.push({kind:'vfx-ultimate',target,start,duration:900,speed:1,mirror:target===units[3]});",c);
 const canvas=createCanvas(960,640),ctx=canvas.getContext('2d');
 for(let i=0;i<240;i++){
  now=i*1000/30;ctx.fillStyle='#101923';ctx.fillRect(0,0,960,640);ctx.fillStyle='#e9dcb6';ctx.font='bold 22px "VFX Sans"';ctx.fillText('CỔ NƯƠNG · SƯƠNG TỐI / ULTIMATE 3 ĐỢT',28,34);ctx.font='14px "VFX Sans"';ctx.fillStyle='#a2b3c8';ctx.fillText('Nghiên cứu VFX · mốc thân thay cho nhân vật · tốc độ 1× · có âm thanh',28,60);
  ctx.strokeStyle='#324150';ctx.beginPath();ctx.moveTo(25,325);ctx.lineTo(935,325);ctx.stroke();
  for(const u of units){ctx.strokeStyle='#647587';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.strokeRect(u.x-42,u.y-170,84,170);ctx.setLineDash([]);ctx.fillStyle='#233241';ctx.beginPath();ctx.arc(u.x,u.y-144,22,0,7);ctx.fill();ctx.fillRect(u.x-25,u.y-117,50,116);ctx.fillStyle='#a2b3c8';ctx.font='15px "VFX Sans"';ctx.fillText(u.sourceId?'Vị trí đàn':'Thân địch',u.x-32,u.y+22);if(u.sourceId){const dir=u.team==='enemy'?-1:1;ctx.fillStyle='#d3b777';ctx.fillRect(u.x+dir*30-3,u.y-87,6,40);}}
  c.drawCoNuongImpactOverlay(ctx,now);
  ctx.fillStyle='#e4d7ec';ctx.font='16px "VFX Sans"';ctx.fillText(now<600?'ATK nhả kiếm ở frame 16/18':now<1892?'Ba kiếm nối đuôi → xuyên qua/lại':now<4380?'Sương tối rơi · bám theo Trùng Hồn':now<7080?'Ultimate · đợt '+(Math.floor((now-4380)/900)+1)+'/3 · cao bằng thân địch':'Hoàn tất ba đợt',350,620);
  fs.writeFileSync(path.join(out,'frames',String(i).padStart(3,'0')+'.png'),canvas.toBuffer('image/png'));
  if([100,160,187,214].includes(i))fs.copyFileSync(path.join(out,'frames',String(i).padStart(3,'0')+'.png'),path.join(out,'study-'+i+'.png'));
 }
})();
