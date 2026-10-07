import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import sharp from 'sharp';

export const LOADING_BACKGROUNDS=Object.freeze([
 'assets/hub/background-v3240/vietnamese-cloud-citadel.png',
 'assets/hub/foreground-v3240/vietnamese-gateway-foreground.png',
 'assets/battle/backgrounds-v1/06-ben-song-den-hoa.png'
]);
const iconDir='assets/ui/menu-v3233/icons';
const outputPath=src=>src.startsWith(iconDir+'/')?src.replace(iconDir+'/',iconDir+'/lossless-v1/').replace(/\.png$/,'.webp'):src.replace(/\.png$/,'.lossless-v1.webp');
export function patchLoadingImages(html,backgrounds=LOADING_BACKGROUNDS){
 // Covers literal URLs and the existing ${icon}/${cleanMenuIcons[name]} templates.
 let out=html.replace(/assets\/ui\/menu-v3233\/icons\/([^\s"'`<>/]+)\.png/g,(_all,name)=>iconDir+'/lossless-v1/'+name+'.webp');
 for(const src of backgrounds)out=out.replaceAll(src,outputPath(src));
 return out;
}
export async function buildLoadingLossless(root,{backgrounds=LOADING_BACKGROUNDS}={}){
 const dist=join(root,'dist'),icons=join(dist,iconDir);
 const sources=[...readdirSync(icons).filter(n=>n.endsWith('.png')).sort().map(n=>iconDir+'/'+n),...backgrounds];
 const images=[];
 // Sequential conversion bounds build memory; no new runtime loader/cache.
 for(const src of sources){
  const original=readFileSync(join(dist,src));
  const {data,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const encoded=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).webp({lossless:true,effort:4}).toBuffer();
  const decoded=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(decoded.info.width!==info.width||decoded.info.height!==info.height)throw new Error('Lossless dimensions: '+src);
  for(let i=0;i<data.length;i+=4){
   if(data[i+3]!==decoded.data[i+3]||(data[i+3]&&(data[i]!==decoded.data[i]||data[i+1]!==decoded.data[i+1]||data[i+2]!==decoded.data[i+2])))throw new Error('Lossless visible pixel mismatch: '+src);
  }
  const dest=outputPath(src);mkdirSync(dirname(join(dist,dest)),{recursive:true});writeFileSync(join(dist,dest),encoded);
  images.push({src,dest,width:info.width,height:info.height,before:original.length,after:encoded.length,visiblePixelsEqual:true});
 }
 for(const name of ['index.html','battle.html']){
  const file=join(dist,name);if(existsSync(file))writeFileSync(file,patchLoadingImages(readFileSync(file,'utf8'),backgrounds));
 }
 const report={images,before:images.reduce((n,x)=>n+x.before,0),after:images.reduce((n,x)=>n+x.after,0)};
 writeFileSync(join(dist,'loading-lossless-report.json'),JSON.stringify(report,null,2));
 console.log('LOADING_LOSSLESS:'+JSON.stringify(report));return report;
}
