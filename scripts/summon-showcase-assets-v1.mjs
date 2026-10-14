import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export async function finalizeSummonShowcase(root){
 const {default:sharp}=await import('sharp');
 const out=join(root,'dist/assets/ui/summon-scenes');mkdirSync(out,{recursive:true});
 const backgrounds={'hoi-tu':'bach-dien-showcase-bg.jpg','net-mong':'luc-anh-showcase-bg.png','phong-van':'lac-yen-showcase-bg.jpg'};
 for(const [key,file] of Object.entries(backgrounds))await sharp(join(root,'assets/ui/hero-detail',file)).resize(1000,800,{fit:'cover'}).webp({quality:85}).toFile(join(out,key+'.webp'));
 const file=join(root,'dist/index.html'),html=readFileSync(file,'utf8');
 const match=html.match(/const preparationIdlePacks = (\{[^\n]+\});/);
 if(!match)throw Error('Summon: canonical preparation posters missing');
 const packs=JSON.parse(match[1]),posters={};
 // New authored heroes append their packs after the original declaration.
 for(const addition of html.matchAll(/Object\.assign\(preparationIdlePacks,\{([a-z_]+):(\{[^\n]+\})\}\);/g))packs[addition[1]]=JSON.parse(addition[2]);
 const ids=['linh_dong','bach_dien','thay_mo','luc_anh','dinh_loi','ong_hang_pho','tieu_phong','ky_van'];
 for(const id of ids){
  const pack=packs[id];if(!pack?.poster?.src)throw Error('Summon: missing canonical poster '+id);
  const dest=`assets/ui/summon-scenes/hero-${id}.webp`;
  // A static copy only: trim transparent padding, retain RGBA; no animation edits.
  await sharp(join(root,'dist',pack.poster.src)).trim({background:{r:0,g:0,b:0,alpha:0},threshold:1}).webp({lossless:true}).toFile(join(root,'dist',dest));
  posters[id]=dest;
 }
 const marker='const summonPosters = {}; // SUMMON_POSTERS_BUILD';
 if(html.split(marker).length!==2)throw Error('Summon poster marker missing/ambiguous');
 writeFileSync(file,html.replace(marker,()=>`const summonPosters = ${JSON.stringify(posters)}; // SUMMON_POSTERS_BUILD`));
}
