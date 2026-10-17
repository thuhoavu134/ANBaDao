import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {patchOwnerRefresh} from '../scripts/owner-refresh-20261018.mjs';

// Production seam after battle-instant-skip-v1, which runs before the final
// owner refresh. Keep every strict final-owner anchor in this regression.
function finalBattle(){return [
 "const event=eventOverride||(action==='ultimate'?'ultimate':action==='skill'?'skill':'basic');",
 '__hvActionAssets=await __hvSkipVisualAssets(()=>__hvBattleAssets.prepare(actor,action,target,battleId),battleId);',
 'function drawDinhLoiFx(){}',
 'context.drawImage(image,sx,sy,cellW,cellH,170,45,WORLD.width-340,WORLD.height-90)',
 'context.drawImage(image,sx,sy,cellW,cellH,120,10,WORLD.width-240,WORLD.height-20)',
 "__hvPersistentPages.draw(context,'dinh-shield',frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82})",
 'drawW=Math.min(790,Math.max(710,bounds.w+270)),drawH=Math.min(430,Math.max(390,bounds.h+250))',
 "${base}${victory?'victory-text-clean-smooth-v5.apng':'defeat-clean-loop.apng'}"
 ,'<div class="irv-hero-wrap">','</head>'
].join('\n');}
test('final installer composes with production instant-skip readiness owner',()=>{
 const output=patchOwnerRefresh(finalBattle(),'battle');
 assert.match(output,/ownerCue/);
 assert.equal(patchOwnerRefresh(output,'battle'),output);
 // New preparation must use the same skip cancellation owner as all other assets.
 assert.match(output,/await __hvSkipVisualAssets\(\(\)=>window\.HonVietSfx\?\.prepare\(ownerCue/);
});
test('missing or duplicate final readiness owner still fails closed',()=>{
 const input=finalBattle(),ready=input.split('\n')[1];
 assert.throws(()=>patchOwnerRefresh(input.replace(ready,''),'battle'),/owner/);
 assert.throws(()=>patchOwnerRefresh(input+'\n'+ready,'battle'),/owner/);
});
test('build installs owner refresh after instant skip',()=>{
 const build=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
 assert.ok(build.indexOf('installBattleInstantSkip(root)')<build.indexOf('installOwnerRefresh(root)'));
});
