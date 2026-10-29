import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {initialHeroStars,normalizeRarityStars,rarityBaseStars,refundableHeroStarShards} from '../src/domain/hero/rarity-stars.mjs';
import {buildStarUpResultView,runStarUpOnce,patchHeroRarityStars} from '../scripts/hero-rarity-stars-v1.mjs';
test('star-up QA bypasses the login overlay before touching session or network',()=>{
 const source=readFileSync(new URL('../src/ui/login-gate-runtime.js',import.meta.url),'utf8');
 const blocked=new Proxy({}, {get(){throw new Error('QA must not touch login state');}});
 assert.doesNotThrow(()=>vm.runInNewContext(source,{__HV_QA_STARUP__:true,document:blocked,localStorage:blocked,sessionStorage:blocked,fetch(){throw new Error('QA must not fetch auth');}}));
});
const defs={ssr:{rarity:'ssr'},six:{rarity:'SSR'},sr:{rarity:'sr'}};
test('new SSR starts at five real stars with no refundable free investment',()=>{
 const hero={owned:true,level:1,...initialHeroStars(defs.ssr)};
 assert.equal(hero.stars,5);assert.equal(refundableHeroStarShards(hero,defs.ssr),0);
 assert.equal(initialHeroStars(defs.sr).stars,1);
});
test('legacy SSR migration preserves paid shards exactly once and leaves SR untouched',()=>{
 for(let n=1;n<=6;n++){
  const player={heroes:{ssr:{owned:true,level:8,stars:n},sr:{owned:true,stars:2}},gold:123,shards:{ssr:7}};
  const oldRefund=10*n*(n-1);
  normalizeRarityStars(player,defs);
  assert.equal(player.heroes.ssr.stars,Math.max(5,n));
  assert.equal(refundableHeroStarShards(player.heroes.ssr,defs.ssr),oldRefund);
  const snapshot=JSON.stringify(player);normalizeRarityStars(player,defs);assert.equal(JSON.stringify(player),snapshot);
  assert.equal(player.gold,123);assert.equal(player.shards.ssr,7);assert.deepEqual(player.heroes.sr,{owned:true,stars:2});
 }
});
test('locked SSR does not gain ownership or paid-refund credit',()=>{
 const p={heroes:{ssr:{owned:false,stars:1}}};normalizeRarityStars(p,defs);
 assert.equal(p.heroes.ssr.owned,false);assert.equal(p.heroes.ssr.stars,5);assert.equal(p.heroes.ssr.legacyStarRefund,0);
});
test('five-to-six costs 100 shards; reset cannot refund free base stars repeatedly',()=>{
 const hero={owned:true,...initialHeroStars(defs.ssr)};
 const spent=20*hero.stars;hero.stars++;
 assert.equal(spent,100);assert.equal(refundableHeroStarShards(hero,defs.ssr),spent);
 hero.stars=rarityBaseStars(defs.ssr);hero.legacyStarRefund=0;
 normalizeRarityStars({heroes:{ssr:hero}},defs);
 assert.equal(refundableHeroStarShards(hero,defs.ssr),0);
});

test('star-up result uses the registered hero portrait and canonical before/after stars',()=>{
 const hero={name:'Lăng Tiêu',stars:3};
 const view=buildStarUpResultView({hero,beforeStars:2,afterStars:3,portrait:'assets/characters/lang-tieu/portrait-card.webp'});
 assert.equal(view.title,'THĂNG SAO');assert.equal(view.kicker,'TƯỚNG TINH');
 assert.equal(view.heroName,'Lăng Tiêu');assert.equal(view.portrait,'assets/characters/lang-tieu/portrait-card.webp');
 assert.equal(view.starLine,'★★ → ★★★');assert.equal(view.description,'Lăng Tiêu tăng từ 2★ lên 3★.');
 assert.deepEqual(hero,{name:'Lăng Tiêu',stars:3});
 assert.equal(buildStarUpResultView({hero,beforeStars:2,afterStars:7,portrait:'asset.webp'}),null);
});

test('one successful star-up click presents once; the close action cannot charge again',()=>{
 const button={disabled:false};let stars=2,transactions=0,presentations=0;
 const args={id:'hero',button,readStars:()=>stars,performStarUp:()=>{transactions++;stars++;return {ok:true};},
  showResult:(id,before)=>{presentations++;assert.equal(id,'hero');assert.equal(before,2);},
  refresh(){},render(){}};
 assert.equal(runStarUpOnce(args).ok,true);
 assert.equal(runStarUpOnce(args).duplicate,true);
 assert.equal(transactions,1);assert.equal(presentations,1);
});

test('star-up patch keeps confirmation close-only and resets shared reward UI for later rewards',()=>{
 const starListener="document.getElementById('stBtn').addEventListener('click',()=>{ const r=starUpHero(id); if(r.ok)showRewardCeremony('THĂNG SAO','Sức mạnh cốt lõi đã được nâng lên.',[{icon:'★',label:DATA.heroes[id].name,value:'★'.repeat(P.heroes[id]?.star||1)}],'★','Đột phá'); else toast(r.msg); refreshResbar(); renderHeroDetail(id); });";
 const html=[
  'const SAVE_KEY="mong_gioi_save_v1";',
  'const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};',
  'for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};',
  '  p.squad=normalizeSquad(p.squad,p,true);\n  return p; }',
  'function persist(){',
  'function netOnline(){ return !!(NET.server&&NET.token); }',
  'async function netAuth(kind){',
  'function netLogout(){',
  'function heroStars(id){ return (P.heroes[id]&&P.heroes[id].stars)||1; }',
  'shards:10*S2*(S2-1)','hh.level=1; hh.stars=1;',
  'P.heroes[id].stars++; persist(); return {ok:true};',
  "const v=document.getElementById('rewardVeil'); if(!v)return toast(title); document.getElementById('rewardBurst').textContent=icon;",
  starListener,
  "document.getElementById('rewardClose')?.addEventListener('click',closeRewardCeremony);"
  ,'  <script src="assets/qa/qa-gear-seed.js"></script>'
 ].join('\n');
 const patched=patchHeroRarityStars(html,'export const STAR_MAX=6;');
 const begin=patched.indexOf("document.getElementById('stBtn').addEventListener('click'");
 const end=patched.indexOf('\n',begin);
 const listener=patched.slice(begin,end);
 assert.match(listener,/runStarUpOnce/);assert.match(listener,/event\.currentTarget/);assert.match(listener,/performStarUp:starUpHero/);
 assert.match(patched,/const beforeStars=readStars\(id\),result=performStarUp\(id\)/);
 const close=patched.slice(patched.indexOf("document.getElementById('rewardClose')?.addEventListener"));
 assert.doesNotMatch(close,/starUpHero|runStarUpOnce/);
 assert.match(patched,/v\.removeAttribute\('data-reward-kind'\)/);
 assert.match(patched,/close\.textContent='Thu nhận'/);
 assert.match(patched,/close\.textContent='Xác nhận'/);
 assert.match(patched,/mong_gioi_qa_star_up_v1/);
 assert.match(patched,/function netOnline\(\)\{ return !__HV_QA_STARUP__/);
 assert.match(patched,/if\(__HV_QA_STARUP__\)\{toast\('QA chỉ dùng hồ sơ khách cục bộ\.'/);
 assert.match(patched,/if\(__HV_QA_STARUP__\)\{toast\('Phiên máy thật được giữ nguyên trong QA\.'/);
 assert.match(patched,/portraitSrc\(id,'card'\)/);
});

test('real index patch parses every inline script and wires the star result without changing its transaction owner',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const domain=readFileSync(new URL('../src/domain/hero/rarity-stars.mjs',import.meta.url),'utf8');
 const patched=patchHeroRarityStars(html,domain);
 assert.match(patched,/const beforeStars=readStars\(id\),result=performStarUp\(id\)/);
 assert.match(patched,/portraitSrc\(id,'card'\)\|\|portraitSrc\(id,'master'\)/);
 assert.match(patched,/mong_gioi_qa_star_up_v1/);
 assert.match(patched,/location\.hostname\.endsWith\('\.vercel\.app'\).*location\.hostname\.includes\('-git-'\)/);
 assert.match(patched,/function netOnline\(\)\{ return !__HV_QA_STARUP__&&!!\(NET\.server&&NET\.token\); \}/);
 assert.match(patched,/assets\/qa\/qa-star-up-seed\.js/);
 assert.match(patched,/starLine:'★'\.repeat\(before\)\+' → '\+'★'\.repeat\(after\)/);
 const scripts=[...patched.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 assert.ok(scripts.length>0);
 for(const [,attrs,body] of scripts){
  if(!body.trim()||/type=["'](?:application\/json|text\/template)["']/i.test(attrs))continue;
  assert.doesNotThrow(()=>new Function(body),'inline script must parse after star-up patch');
 }
});

test('star-up QA seed is preview-only, resettable, and leaves production profile untouched',()=>{
 const source=readFileSync(new URL('../assets/qa/qa-star-up-seed.js',import.meta.url),'utf8');
 const mainProfile={gold:321,heroes:{thay_mo:{owned:false,stars:1}}};
 const hero={name:'Thầy Mơ',rarity:'sr'};
 const makeContext=enabled=>{
  const writes=[],shown=[];let context;
  const document={body:{appendChild(node){this.banner=node;}},createElement(tag){return {tag,style:{},attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},addEventListener(type,fn){this[type+'Handler']=fn;},append(...children){this.children.push(...children);}};}};
  context={__HV_QA_STARUP__:enabled,DATA:{heroes:{thay_mo:hero,bach_dien:{name:'Bạch Diện',rarity:'ssr'}},daily:{stamCap:120}},P:mainProfile,document,
   toast(){},refreshResbar(){},renderHeroDetail(id){shown.push(id);},showScreen(id){shown.push(id);},rarityBaseStars:hero=>hero.rarity==='ssr'?5:2,
   defaultPlayer:()=>({heroes:{thay_mo:{owned:true,stars:2}},shards:{},gold:500,gems:800,so:0,tinh:0,hoat:0,stamina:10,economy:{}}),
   persist(){writes.push(JSON.parse(JSON.stringify(context.P)));}};
  vm.runInNewContext(source,context);
  return {context,writes,shown};
 };
 const disabled=makeContext(false);assert.equal(disabled.writes.length,0);assert.equal(disabled.context.P,mainProfile);
 const qa=makeContext(true);
 assert.equal(qa.context.P.heroes.thay_mo.stars,2);assert.equal(qa.context.P.heroes.thay_mo.owned,true);
 assert.equal(qa.context.P.shards.thay_mo,10000);assert.equal(qa.context.P.gold,5000000);
 assert.equal(qa.context.P.gems,50000);assert.equal(qa.context.P.stamina,120);
 assert.equal(qa.context.P.shards.bach_dien,10000);
 assert.equal(qa.context.P.heroes.bach_dien.owned,true);assert.equal(qa.context.P.heroes.bach_dien.stars,5);
 assert.notEqual(qa.context.P,mainProfile);assert.equal(mainProfile.gold,321);
 assert.deepEqual(qa.shown,['thay_mo','heroDetail']);assert.equal(qa.writes.length,1);
 qa.context.P.heroes.thay_mo.stars=3;qa.context.P.heroes.thay_mo.level=12;
 qa.context.P.shards.thay_mo=1;qa.context.P.gold=1;qa.context.P.shards.bach_dien=20000;
 qa.context.document.body.banner.children[2].clickHandler();
 assert.equal(qa.context.P.heroes.thay_mo.stars,3);assert.equal(qa.context.P.heroes.thay_mo.level,12);
 assert.equal(qa.context.P.shards.thay_mo,10000);assert.equal(qa.context.P.shards.bach_dien,20000);
 assert.equal(qa.context.P.gold,5000000);assert.equal(qa.writes.length,2);
 qa.context.document.body.banner.children[1].clickHandler();
 assert.equal(qa.writes.length,3);assert.equal(mainProfile.gold,321);
 assert.equal(qa.context.P.heroes.thay_mo.stars,2);
});


