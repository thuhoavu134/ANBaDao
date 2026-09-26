import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('dist/battle.html','utf8');
for(const [hero,start,end,variable] of [
  ['Lục Ảnh','  function drawLucAnhFx(','\n\n  // v3.13:','lucAnhFx'],
  ['Đình Lôi','  function drawDinhLoiFx(','\n  function drawDinhLoiPersistentShields','dinhLoiFx']
])test(hero+' keeps a newly released VFX when RAF still refers to the preceding instant',()=>{
  const a=html.indexOf(start),b=html.indexOf(end,a);assert.ok(a>0&&b>a);
  const fx={started:101,duration:20};const context=vm.createContext({[variable]:hero==='Lục Ảnh'?[fx]:fx});
  vm.runInContext(html.slice(a,b),context);
  const draw=hero==='Lục Ảnh'?context.drawLucAnhFx:context.drawDinhLoiFx;
  draw({},100);
  assert.equal(hero==='Lục Ảnh'?context[variable].length:!!context[variable],hero==='Lục Ảnh'?1:true);
  draw({},122);
  assert.equal(hero==='Lục Ảnh'?context[variable].length:context[variable],hero==='Lục Ảnh'?0:null);
});
