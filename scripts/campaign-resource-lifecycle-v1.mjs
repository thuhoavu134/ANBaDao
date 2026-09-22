import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaignSceneImageOwner } from '../src/ui/campaign-resource-lifecycle.mjs';

const marker = '/* HV_CAMPAIGN_RESOURCE_LIFECYCLE_V1 */';
function replaceOne(input, from, to) {
  if (input.split(from).length !== 2) throw new Error('Campaign lifecycle missing/ambiguous anchor: ' + from.slice(0, 80));
  return input.replace(from, () => to);
}
function replaceFunction(input, name, nextName, text) {
  const from = input.indexOf('function ' + name + '(');
  const to = input.indexOf('function ' + nextName + '(', from + 1);
  if (from < 0 || to <= from) throw new Error('Campaign lifecycle function boundary: ' + name);
  return input.slice(0, from) + text + '\n' + input.slice(to);
}
export function patchCampaignResourceLifecycle(input) {
  if (input.includes(marker)) return input;
  let html = replaceFunction(input, 'campaignPackFor', 'campaignBattleOpen', `function campaignPackFor(src, spec) {
  if (!spec || !src.startsWith('assets/')) return null;
  const rows = spec.rows || Math.ceil(spec.frames / spec.cols);
  const width = spec.atlasWidth || spec.cols * (spec.strideW || spec.cellW);
  const height = spec.atlasHeight || rows * (spec.strideH || spec.cellH);
  return {heroId:src,clip:src.includes('/run-')?'run':'idle',tier:'campaign-lite',src,
    decodedBytes:width*height*4};
}`);
  html = replaceFunction(html, 'dropSceneStored', 'frameAt', `${marker}
const sceneImageOwner=(${createCampaignSceneImageOwner.toString()})({
  images:sceneImages,cache:sceneResourceCache,packFor:campaignPackFor,
  makeImage:()=>new Image(),getScope:()=>sceneState.scope,
  active:()=>sceneState.active&&!campaignBattleOpen(),
  draw:()=>drawScene(performance.now()),
  scheduleFrame:fn=>requestAnimationFrame(fn),cancelFrame:id=>cancelAnimationFrame(id)
});
function releaseSceneAtlases(){sceneImageOwner.clear();}
try{window.__HV_CAMPAIGN_RELEASE_ATLASES=releaseSceneAtlases;}catch(_){}
function emptySceneImage(){return {complete:false,naturalWidth:0,naturalHeight:0};}
function imageForScene(src,spec=null){return sceneImageOwner.image(src,spec);}
`);
  html = replaceOne(html, 'function drawScene(time) {', `function drawScene(time) {
  sceneImageOwner.beginFrame();
  try{return drawSceneContents(time);}finally{sceneImageOwner.endFrame();}
}
function drawSceneContents(time) {`);
  html = replaceOne(html,
    '    for(const actor of farm.actors)if(farmAttackSpecs[actor.id])imageForScene(farmAttackSpecs[actor.id].src);',
    '    // Attack atlases are requested with their spec only by the attacking actor.');
  return html;
}
export function installCampaignResourceLifecycle(root) {
  const file = join(root, 'dist', 'index.html');
  writeFileSync(file, patchCampaignResourceLifecycle(readFileSync(file, 'utf8')));
}
