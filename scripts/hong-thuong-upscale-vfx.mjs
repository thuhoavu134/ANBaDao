// Deterministic per-cell upscale; preserves approved sample 22 frame order.
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const base=new URL('../assets/vfx/hong-thuong/',import.meta.url);
const layers=[];
for(let i=0;i<14;i++){
 const input=fileURLToPath(new URL('impact.webp',base));
 const buffer=await sharp(input).extract({left:(i%5)*128,top:Math.floor(i/5)*128,width:128,height:128}).resize(256,256,{kernel:'lanczos3'}).sharpen({sigma:.6,m1:.4,m2:1.2}).png().toBuffer();
 layers.push({input:buffer,left:(i%5)*256,top:Math.floor(i/5)*256});
}
await sharp({create:{width:1280,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({lossless:true}).toFile(fileURLToPath(new URL('impact-2x.webp',base)));
