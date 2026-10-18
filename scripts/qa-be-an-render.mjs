// Asset choreography review through production renderer; not full-game evidence.
import{createCanvas,loadImage,Image as NativeImage}from'@napi-rs/canvas';import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import vm from'node:vm';
const out=process.argv[2];if(!out)throw Error('Provide an output directory');mkdirSync(out,{recursive:true});
const meta=JSON.parse(readFileSync('assets/characters/be-an/runtime-meta.json'));
class Image extends NativeImage{set src(v){super.src=readFileSync(v);}get src(){return super.src;}}
const canvas=createCanvas(960,540),ctx=canvas.getContext('2d');let now=0,index=0;
const actor={id:'an',sourceId:'hero_splus_be_an',team:'player',hp:10000,x:210,y:430},target={id:'target',sourceId:'hero_splus_be_an',team:'enemy',hp:10000,x:725,y:430};
const c={BE_AN_META:meta,Image,innerWidth:960,TEAM_ENEMY:'enemy',state:{battleId:1,speed:1,sound:false},performance:{now:()=>now},getUnit:id=>id===actor.id?actor:target,AbortController,drawUnitHud(){},window:{},__hvIsSkipping:()=>false};vm.createContext(c);vm.runInContext(readFileSync('src/runtime/be-an.js','utf8'),c);
const decoded=new Map();for(const clip of Object.values(meta.clips))for(const page of clip.pages){const src='assets/characters/be-an/'+page.file;decoded.set(src,await loadImage(readFileSync(src)));}c.beAnImage=src=>decoded.get(src);
for(const kind of ['basic','ultimate','special']){
 c.cancelBeAn();const duration=kind==='ultimate'?6650:4000;
 vm.runInContext(`beAnMotions.set('an',{kind:'${kind}',start:0,speed:1,duration:${duration}})`,c);
 if(kind!=='special'){const t=meta.timeline[kind];c.info={actor,kind,battleId:1,speed:1,start:0,release:t.release,vfxEnd:t.vfxEnd,targets:['target'],abort:new AbortController()};vm.runInContext('beAnActions.add(info)',c);}
 for(let frame=0;frame<Math.ceil(duration*.024);frame++){
  now=frame/24*1000;ctx.fillStyle='#25333d';ctx.fillRect(0,0,960,540);ctx.fillStyle='#34464d';ctx.fillRect(0,430,960,110);
  ctx.fillStyle='#fff4d6';ctx.font='bold 24px sans-serif';ctx.fillText('BÉ AN · '+kind.toUpperCase(),35,45);ctx.font='16px sans-serif';ctx.fillText('Kiểm ghép asset — chưa phải trận game hoàn chỉnh',35,75);
  for(const u of [actor,target]){ctx.fillStyle='#17262b66';ctx.beginPath();ctx.ellipse(u.x,u.y,36,8,0,0,Math.PI*2);ctx.fill();c.drawBeAnHero(ctx,u,now);}
  c.drawBeAnVfx(ctx,now);
  const hits=meta.timeline[kind]?.hits||[];ctx.fillStyle='#e1d6bb';ctx.fillText(`${(now/1000).toFixed(2)}s · ${hits.filter(t=>t<=now).length}/${hits.length} hit`,35,510);
  for(const [i,t]of hits.entries())if(now>=t&&now<t+400){ctx.fillStyle='#ffd34b';ctx.font='bold italic 28px sans-serif';ctx.fillText('HIT '+(i+1),target.x-35,260-(now-t)*.12);}
  writeFileSync(out+'/'+String(index++).padStart(4,'0')+'.png',canvas.toBuffer('image/png'));
 }
}
console.log('frames',index);
