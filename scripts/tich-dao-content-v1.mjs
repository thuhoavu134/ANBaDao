// tich-dao-content-v1.mjs — đo chiều cao nội dung (alpha bbox) từng clip và ghi
// content.scale để runtime phóng atk/ultimate/hit/run/fall-die về đúng cỡ idle.
// Run: node scripts/tich-dao-content-v1.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const base=join(root,'assets/characters/tich-dao');
const meta=JSON.parse(readFileSync(join(base,'runtime-meta.json'),'utf8'));

async function cellHeight(file,cellIndex,cols){
  const {default:sharp}=await import('sharp');
  const col=cellIndex%cols,row=Math.floor(cellIndex/cols);
  const {data,info}=await sharp(join(base,file))
    .extract({left:col*480,top:row*440,width:480,height:440})
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let maxy=-1,miny=1e9;
  for(let y=0;y<440;y++)for(let x=0;x<480;x++){
    if(data[(y*480+x)*4+3]>16){if(y<miny)miny=y;if(y>maxy)maxy=y;}
  }
  return maxy<0?0:maxy-miny+1;
}

async function main(){
  // idle chuẩn: đo frame giữa trang 1
  const idleH=Math.max(await cellHeight('idle-authored-0.webp',4,3),
                       await cellHeight('idle-authored-4.webp',4,3));
  if(!(idleH>350))throw new Error('idle content height lạ: '+idleH);
  const probes={
    'basic':[3,9,14],'hit':[4,9],'run':[4,9],'fall-die':[6,12],
    // các phase hiện hình của ultimate
    'ultimate':(meta.ultimateTimeline.phases.filter(p=>p.visible).flatMap(p=>p.cells.slice(1,4))),
  };
  for(const key of ['idle-authored-0',...Array.from({length:9},(_,i)=>'idle-authored-'+i)]){
    meta.clips[key].content={frameHeightPx:idleH,scale:1};
  }
  for(const [key,cells] of Object.entries(probes)){
    const cols=meta.clips[key].cols;
    let best=0;
    for(const ci of cells){const h=await cellHeight(meta.clips[key].file,ci,cols);if(h>best)best=h;}
    const scale=Math.min(2.6,Math.max(1,Math.round(idleH/Math.max(1,best)*100)/100));
    meta.clips[key].content={frameHeightPx:best,scale,normalizedHeightPx:Math.round(best*scale)};
    console.log(key.padEnd(9),'content',best+'px','→ scale',scale,'=',Math.round(best*scale),'px (idle',idleH+'px)');
  }
  writeFileSync(join(base,'runtime-meta.json'),JSON.stringify(meta,null,1));
  console.log('TICH_DAO_CONTENT_OK idle='+idleH);
}
main().catch(e=>{console.error('TICH_DAO_CONTENT_FAIL',e.message);process.exit(1);});
