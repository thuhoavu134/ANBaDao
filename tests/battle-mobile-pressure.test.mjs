import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DINH_LOI_MOBILE_SCALE,
  DINH_LOI_MOBILE_SOURCES,
  dinhLoiMobileVariantPath,
  patchBattleMobilePressure
} from '../scripts/battle-mobile-pressure-v1.mjs';

const MiB=1024*1024;

test('Đình Lôi mobile derivatives reduce each native 2x atlas to one-quarter decoded bytes',()=>{
  assert.equal(DINH_LOI_MOBILE_SCALE,.5);
  assert.equal(DINH_LOI_MOBILE_SOURCES.length,14);
  const desktop=3840*2160*4;
  const mobile=1920*1080*4;
  assert.equal(mobile,desktop/4);
  assert.ok(mobile<8*MiB);
  assert.equal(dinhLoiMobileVariantPath('assets/characters/dinh-loi/idle-atlas.png'),'assets/characters/dinh-loi/mobile-v1/idle-atlas.webp');
});

test('battle low-memory patch lowers canvas pressure, caps visual FPS and defers shield atlas until needed',()=>{
  const source=`const view = { width: 1, height: 1, scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };
const ambientFireflies = Array.from({ length: 24 }, (_, index) => ({}));
let lastFrame = performance.now();
function resizeCanvas() {
  const rect = dom.viewport.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
}
const DINH_LOI_ID="dinh_loi", DINH_LOI_FRAMES=64, DINH_LOI_COLS=8, DINH_LOI_CELL_W=480, DINH_LOI_CELL_H=270;
const DINH_LOI_ASSET_BASE="assets/characters/dinh-loi/";
const DINH_LOI_ASSET_NAMES=Object.freeze({idle:"idle-atlas.png",skill1Shield:"skill1-shield-atlas.png",ultimateVfx:"ultimate-vfx-atlas.png",ultimateImpact:"ultimate-impact-atlas.png"});
const DINH_LOI_CLIPS=Object.fromEntries(Object.entries(DINH_LOI_ASSET_NAMES).map(([key,file])=>{const portrait=key==='ultimateVfx'||key==='ultimateImpact';const cellW=portrait?270:480,cellH=portrait?480:270;return [key,{src:DINH_LOI_ASSET_BASE+file,cols:8,rows:8,cellW,cellH,atlasWidth:cellW*8,atlasHeight:cellH*8}]}));
function drawDinhLoiPersistentShields(context,time){
    const image=DINH_LOI_IMAGES.skill1Shield;if(!image?.complete||image.naturalWidth<2)return;const frame=dinhLoiFrame(time,true);
    for(const unit of living(TEAM_PLAYER).concat(living(TEAM_ENEMY))){if(!(unit.statuses||[]).some(s=>s.type==="guard"&&s.sourceHeroId===DINH_LOI_ID))continue;drawDinhLoiAtlasFrame(context,image,frame,unit.x,unit.y,330,186,{baseline:93,screen:true,alpha:.82});}
  }
function render(time) {
    resizeCanvas();
    const delta = Math.min(0.05, Math.max(0, (time - lastFrame) / 1000));
    lastFrame = time;
    updateEffects(delta);
    units.forEach(unit=>drawUnit(ctx,unit,time));
    requestAnimationFrame(render);
  }
`;
  const patched=patchBattleMobilePressure(source,{
    'assets/characters/dinh-loi/idle-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/idle-atlas.webp',width:1920,height:1080,scale:.5},
    'assets/characters/dinh-loi/skill1-shield-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/skill1-shield-atlas.webp',width:1920,height:1080,scale:.5},
    'assets/characters/dinh-loi/ultimate-vfx-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/ultimate-vfx-atlas.webp',width:1080,height:1920,scale:.5},
    'assets/characters/dinh-loi/ultimate-impact-atlas.png':{src:'assets/characters/dinh-loi/mobile-v1/ultimate-impact-atlas.webp',width:1080,height:1920,scale:.5}
  });
  assert.match(patched,/__HV_BATTLE_LOW_MEMORY/);
  assert.match(patched,/Math\.min\(devicePixelRatio \|\| 1, __HV_BATTLE_LOW_MEMORY \? 1\.5 : 2\)/);
  assert.match(patched,/__hvBattlePaintAt/);
  assert.match(patched,/1000\/30/);
  assert.match(patched,/mobile-v1\/idle-atlas\.webp/);
  const shield=patched.slice(patched.indexOf('function drawDinhLoiPersistentShields'),patched.indexOf('function render'));
  assert.ok(shield.indexOf('const guarded=') < shield.indexOf('DINH_LOI_IMAGES.skill1Shield'));
});

test('static pipeline applies battle mobile after final battle owners and before iframe sync',()=>{
  const build=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
  const result=build.indexOf("await import('./result-character-motion-v1.mjs');");
  const mobile=build.indexOf('await buildBattleMobilePressure(root);');
  const campaign=build.indexOf('await installCampaignMobileAtlases(root);');
  const sync=build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(result>=0 && result<mobile && mobile<campaign && campaign<sync,{result,mobile,campaign,sync});
});
