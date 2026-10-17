import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../scripts/thay-mo-authored-production-v1.mjs',import.meta.url),'utf8');
test('authored Thầy Mo Fall uses final frame and Run advances on the four-second source clock',()=>{
 const calls=[],paths=[];
 const code=source.slice(source.indexOf('  function drawThayMoAuthoredCell'),source.indexOf('  function drawThayMoAuthoredSkill1Fx'));
 const ctx={drawImage(...a){calls.push(a);}};
 const scope={isThayMoAuthored:()=>true,battleLegacyImage:p=>{paths.push(p);return {complete:true,naturalWidth:2880};}};
 vm.createContext(scope);vm.runInContext(code,scope);
 assert.equal(scope.drawThayMoAuthoredHero(ctx,{hp:0,defeatedAt:100,defeatFallDuration:4000},4099),true);
 assert.match(paths[0],/thay-fall-die.webp$/);assert.deepEqual(calls[0].slice(1,5),[2400,880,480,440]);
 scope.drawThayMoAuthoredHero(ctx,{hp:100,state:'run',stateStarted:100},2100);
 assert.match(paths[1],/thay-run.webp$/);assert.deepEqual(calls[1].slice(1,5),[1440,440,480,440]);
});
test('result and campaign reference the supplied Run/Fall, with no synthetic Thầy Mo fall',()=>{
 const result=readFileSync(new URL('../scripts/result-character-motion-v1.mjs',import.meta.url),'utf8');
 const block=result.slice(result.indexOf('  thay_mo: {'),result.indexOf('  luc_anh: {'));
 assert.match(block,/thay-run.webp/);assert.match(block,/thay-fall-die.webp/);assert.doesNotMatch(block,/syntheticFall|idle-translation/);
 const campaign=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');assert.match(campaign,/thay-run.webp/);
});
