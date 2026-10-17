import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Registers the authored hero in the SAME DATA / save / roster as the campaign.
// Never replaces the save, squad, or another hero.
const hero={
  he:'soul',faction:'am_hon',archetype:'mystic',rarity:'ssr',
  name:'Cổ Nương',role:'Pháp sư / Ký sinh / Hồi phục',col:'#7853a9',
  stats:{hp:980,mp:70,atk:136,def:60,spd:105},
  passive:{name:'Ký Sinh Thực Tủy',desc:'Đòn đánh trúng gieo tối đa 3 tầng Trùng Hồn, gây sát thương ký sinh và hồi máu cho Cổ Nương. Giảm 50% phản chấn.'},
  skill:{name:'Kéo Dây Đoạt Tủy',cost:0,vfx:'parasite',desc:'Đánh hàng trước, gieo Trùng Hồn lên mục tiêu mất máu.',fx:{kind:'damage',target:'aoe_enemy',power:.8}},
  ultimate:{name:'Vạn Điệp Cốt Cầm: Huyết Trùng Đoạt Mệnh',cost:60,vfx:'vfx-ultimate',desc:'Gây sát thương toàn địch, kích nổ Trùng Hồn và hồi sinh lực cho đồng minh.',fx:{kind:'damage',target:'aoe_enemy',power:1.2}}
};
const art={
  slug:'co-nuong',displayName:'Cổ Nương',identityVersion:'authored-20261017',
  reference:{master:'assets/characters/co-nuong/avatar.webp',runtime:true},
  assets:{
    master:'assets/characters/co-nuong/avatar.webp',
    avatar:'assets/characters/co-nuong/avatar.webp',
    card:'assets/characters/co-nuong/avatar.webp',
    dialogue:'assets/characters/co-nuong/avatar.webp',
    icon:'assets/characters/co-nuong/avatar.webp',
    idle:'assets/characters/co-nuong/idle.webp',
    basic:'assets/characters/co-nuong/basic.webp',
    ultimate:'assets/characters/co-nuong/ultimate.webp',
    run:'assets/characters/co-nuong/run.webp',
    hit:'assets/characters/co-nuong/hit.webp',
    fall:'assets/characters/co-nuong/fall-die.webp'
  }
};
function once(html,needle,replace){
  const occurrences=html.split(needle).length-1;
  if(occurrences!==1)throw new Error('CO_NUONG_MAIN_ANCHOR:'+needle.slice(0,60)+':'+occurrences);
  return html.replace(needle,replace);
}
export function patchCoNuongMainIndex(input){
  if(input.includes('co-nuong-main-registration/v1'))throw new Error('CO_NUONG_ALREADY_PATCHED');
  let html=input;
  const registration='/* co-nuong-main-registration/v1 */\n'
    +'DATA.heroes.co_nuong='+JSON.stringify(hero)+';\n'
    +'CHARACTER_MANIFEST.co_nuong='+JSON.stringify(art)+';\n';
  html=once(html,'let P=null, MEMORY_ONLY=false;',registration+'let P=null, MEMORY_ONLY=false;');
  const init='const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};';
  html=once(html,init,init+'\n  heroes.co_nuong.owned=true;');
  // Save contract injects validation at migrateSave() entry; anchor after the hero-state fill.
  const migrate='for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};';
  html=once(html,migrate,migrate+'\n  if(!p.flags?.coNuongStarter20261018){p.heroes.co_nuong.owned=true;p.flags=p.flags||{};p.flags.coNuongStarter20261018=true;}');
  const roster='const OFFICIAL_ROSTER_12_IDS=Object.freeze(';
  const index=html.indexOf(roster),end=index>=0?html.indexOf(');',index):-1;
  if(index<0||end<0)throw new Error('CO_NUONG_OFFICIAL_ROSTER_MISSING');
  const old=html.slice(index,end+2);
  if(old.includes('"co_nuong"'))throw new Error('CO_NUONG_ALREADY_IN_OFFICIAL_ROSTER');
  const revised=old.replace(']);',',"co_nuong"]);');
  if(revised===old)throw new Error('CO_NUONG_ROSTER_ARRAY_SHAPE');
  html=once(html,old,'// Legacy symbol retained for callers; 24-slot collection cap, 6-slot combat cap.\n'+revised);
  return html;
}
export function installCoNuongMain(root=process.cwd()){
  const path=join(root,'dist','index.html');
  writeFileSync(path,patchCoNuongMainIndex(readFileSync(path,'utf8')));
  return path;
}
