import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('Cổ Nương mapping preserves the single canonical Ky Van/Tieu Phong source anchor', () => {
  const bridge = read('src/runtime/splus-battle-bridge.js');
  const anchor = '  const h=normalizeConfiguredHero(raw,index),kit=';
  assert.equal(bridge.split(anchor).length-1, 1, 'The Ky Van and Tieu Phong patch owner expects exactly one anchor');
  assert.match(bridge, /if\(raw&&\/\^\(\?:co_nuong\|co-nuong\)/);
  assert.ok(bridge.indexOf("sourceId:'hero_splus_co_nuong'") < bridge.indexOf(anchor));
  for (const file of ['scripts/ky-van-runtime-v1.mjs','scripts/tieu-phong-runtime-v1.mjs']) {
    assert.ok(read(file).includes("once('  const h=normalizeConfiguredHero(raw,index),kit="), file+' must use canonical anchor');
  }
});

test('Cổ Nương impact VFX is painted separately, after all combatants', () => {
  const bridge=read('src/runtime/splus-battle-bridge.js');
  const build=read('scripts/splus-runtime-v1.mjs');
  assert.match(bridge,/function drawCoNuongImpactOverlay\(context,time\)/);
  assert.match(build,/drawCoNuongImpactOverlay\(ctx,time\)/);
  assert.match(bridge,/function drawSplusToken\(context, unit, time\)/);
});


test('Cổ Nương keeps the late Tiêu Phong settlement anchor unique',()=>{
  assert.equal(read('src/runtime/splus-battle-bridge.js').split('result=e.act(actor.id,action,target?.id);').length-1,1);
});

test('late Kỷ Vân, Tiêu Phong and Tịch Dao installers compose with the new bridge',async()=>{
  const {patchKyVanBattle}=await import('../scripts/ky-van-runtime-v1.mjs');
  const {patchTieuPhongBattle}=await import('../scripts/tieu-phong-runtime-v1.mjs');
  const {patchTichDaoBattle}=await import('../scripts/tich-dao-runtime-v1.mjs');
  let html=read('src/runtime/splus-battle-bridge.js')+`
    drawBachDienFx(ctx,time);
  async function performAction(actor, action, target) {
    const authoredFallMs=isOngPho(unit)?1:0;
    unit.defeatHideDuration = defeatDuration(1);
  }
const STATUS_ICON_SOURCES = Object.freeze({});
      if(isNemVi){}
    drawEffects(ctx, time);
`;
  html=patchKyVanBattle(html,'',{});html=patchTieuPhongBattle(html,'',{});html=patchTichDaoBattle(html,'',{});
  assert.ok(html.includes('return performCoNuongAction(actor,action,target,e,battleId)'));
  assert.ok(html.includes('result=shadowAction?await resolveTichDaoCast'));
});
