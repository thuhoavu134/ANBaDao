// Separate the supplied raster lettering by its actual alpha silhouette.
// No rectangular runtime clipping: pixels outside each glyph are untouched.
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const root='assets/owner-refresh-20261018';
for(const [kind,top,box] of [['victory',153,[99,165,396,241]],['defeat',187,[141,189,335,247]]]){
 const temp=mkdtempSync(join(tmpdir(),'result-layers-'));
 try{
 const frames=[];for(let i=0;i<18;i++)frames.push(await sharp(join(root,`result-${kind}.webp`)).extract({left:i%6*480,top:Math.floor(i/6)*440,width:480,height:440}).ensureAlpha().raw().toBuffer());
 const ref=frames[0],letters=Buffer.alloc(ref.length),mask=new Uint8Array(480*440);
 for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){
  const p=y*480+x,o=p*4;if(ref[o+3]>8){mask[p]=1;ref.copy(letters,o,o,o+4);}
 }
 await sharp(letters,{raw:{width:480,height:440,channels:4}}).extract({left:0,top,width:480,height:440-top}).png().toFile(join(root,`result-${kind}-letters.png`));
 for(let i=0;i<18;i++){
  const out=Buffer.from(frames[i]);
  for(let p=0;p<mask.length;p++)if(mask[p]){
   const o=p*4;
   out.fill(0,o,o+4);
  }
  await sharp(out,{raw:{width:480,height:440,channels:4}}).extract({left:0,top,width:480,height:440-top}).png().toFile(join(temp,`${String(i).padStart(2,'0')}.png`));
 }
 execFileSync('ffmpeg',['-v','error','-y','-framerate','9/2','-i',join(temp,'%02d.png'),'-plays','0','-f','apng',join(root,`result-${kind}-wings.png`)]);
 }finally{rmSync(temp,{recursive:true,force:true});}
}
