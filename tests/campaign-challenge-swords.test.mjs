import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const js=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8'),css=readFileSync(new URL('../src/ui/campaign-scene.css',import.meta.url),'utf8');
test('AC01 decorative sword children retain the single challenge button and preparation handler',()=>{
 assert.match(js,/cs-challenge-badge/);assert.match(js,/cs-sword-left/);assert.match(js,/cs-sword-right/);assert.match(js,/aria-label="Khiêu chiến"/);
 let opens=0;const fn=js.slice(js.indexOf('function sceneClick('),js.indexOf('window.HonVietCampaignScene'));
 const button={disabled:false,dataset:{},hasAttribute:k=>k==='data-hv-afk-challenge'};
 const click=runInNewContext(fn+'\nsceneClick;',{openPreparation:()=>opens++});
 click({target:{closest:()=>button}});assert.equal(opens,1);button.disabled=true;click({target:{closest:()=>button}});assert.equal(opens,1);
});
test('AC02-03 swords have mirrored motion, collision flash and accessible static fallback',()=>{
 assert.match(css,/@keyframes cs-sword-left/);assert.match(css,/@keyframes cs-sword-right/);assert.match(css,/@keyframes cs-sword-flash/);
 assert.match(css,/prefers-reduced-motion:reduce[^]*cs-challenge[^]*animation:none/);
 assert.match(css,/cs-motion-paused[^]*animation-play-state:paused/);assert.match(css,/cs-challenge:focus-visible/);
});
