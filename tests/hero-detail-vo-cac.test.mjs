import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import {installCoreScreenPolish} from '../scripts/core-screen-polish-v1.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

function hallHarness(){
  const classes=()=>({toggle(){},add(){}});
  const stage={dataset:{heroId:'bach_dien'},classList:classes(),style:{setProperty(){}}};
  const body={querySelector:()=>stage};
  const title={textContent:''},back={addEventListener(type,fn){this.click=fn;}};
  const overlay={dataset:{},classList:classes(),setAttribute(){},querySelector(selector){return selector==='.hv-hd-stage'?{append(node){assert.equal(node,body);}}:selector==='[data-hd-title]'?title:back;}};
  let mounted=false,renderCount=0;const nav=[];
  const context={document:{body:{append(node){assert.equal(node,overlay);mounted=true;},classList:classes()},getElementById(id){return id==='hdBody'?body:id==='hdName'?{textContent:stage.dataset.heroId}:id==='hvHeroDetailRoot'&&mounted?overlay:null;},createElement(){return overlay;}},getComputedStyle(){return {getPropertyValue(){return '';}};},ST:{screen:'hub'},showScreen(name){context.ST.screen=name;},renderHeroDetail(id){renderCount++;stage.dataset.heroId=id;},navTo(name){nav.push(name);}};
  vm.createContext(context);vm.runInContext(read('src/ui/hero-detail-hall-runtime.js'),context);
  return {context,overlay,back,nav,get renderCount(){return renderCount;}};
}
test('hall scopes preview to currently rendered hero and clears it on switching',()=>{
 const h=hallHarness();h.context.renderHeroDetail('bach_dien');h.context.showScreen('heroDetail');
 assert.equal(h.overlay.dataset.heroId,'bach_dien');assert.equal(h.overlay.hidden,false);
 h.context.renderHeroDetail('linh_dong');assert.equal(h.overlay.dataset.heroId,'linh_dong');assert.equal(h.renderCount,2);
 h.context.showScreen('hub');assert.equal(h.overlay.hidden,true);
});
test('existing Back command still routes to roster; repeated install is guarded',()=>{
 const h=hallHarness();h.back.click();assert.deepEqual(h.nav,['heroes']);
 const render=h.context.renderHeroDetail;
 vm.runInContext(read('src/ui/hero-detail-hall-runtime.js'),h.context);
 assert.equal(h.context.renderHeroDetail,render);
});
test('real late build owner emits preview CSS while preserving live scripts and commands',()=>{
 const dir=mkdtempSync(join(tmpdir(),'vo-cac-'));
 try{
  mkdirSync(join(dir,'src/ui'),{recursive:true});mkdirSync(join(dir,'dist'));
  for(const file of ['core-screen-polish.css','hero-detail-vo-cac.css','hero-roster-concept.css'])copyFileSync(new URL('src/ui/'+file,root),join(dir,'src/ui',file));
  const live='<body><button id="lvBtn">Nâng cấp</button><script>window.keepExistingHandler=true;</script></body>';
  writeFileSync(join(dir,'dist/index.html'),'<html><head></head>'+live+'</html>');
  installCoreScreenPolish(dir);
  const output=readFileSync(join(dir,'dist/index.html'),'utf8');
  assert.ok(output.includes(live));assert.ok(output.includes('vo-cac-pavilion-v1.webp'));
  assert.throws(()=>installCoreScreenPolish(dir),/installed twice/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
