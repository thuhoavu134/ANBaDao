// Deterministic per-cell upscale; preserves approved sample 22 frame order.
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const base=new URL('../assets/vfx/hong-thuong/',import.meta.url);
const layers=[];
for(let i=0;i<14;i++){
 const input=fileURLToPath(new URL('impact.webp',base));
 const buffer=await sharp(input).extract({left:(i%5)*128,top:Math.floor(i/5)*128,width:128,height:128}).flatten({background:{r:0,g:0,b:0}}).resize(512,512,{kernel:'lanczos3'}).modulate({brightness:1.18,saturation:1.04}).sharpen({sigma:.9,m1:.6,m2:1.8}).png().toBuffer();
 layers.push({input:buffer,left:(i%5)*512,top:Math.floor(i/5)*512});
}
await sharp({create:{width:2560,height:1536,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({lossless:true}).toFile(fileURLToPath(new URL('impact-4x-bright.webp',base)));
