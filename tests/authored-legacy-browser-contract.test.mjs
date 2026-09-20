import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const battle = readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const qa = readFileSync(new URL('../scripts/qa-authored-legacy-browser.mjs', import.meta.url), 'utf8');

test('legacy authored QA exposes deterministic Lục Ảnh actions and real Đình Lôi asset enumeration', () => {
  assert.ok(battle.includes('qaForceLucAnhAction: async(action="basic")'));
  assert.ok(battle.includes('getLucAnhAuthoredAssets'));
  assert.ok(battle.includes('Object.keys(DINH_LOI_ASSET_NAMES)'));
  assert.ok(!battle.includes('getDinhLoiAssets:()=>Object.fromEntries(Object.entries(DINH_LOI_IMAGES)'));
});

test('legacy authored browser QA covers Basic Skill Ultimate for all three authored heroes', () => {
  for (const hero of ['luc-anh','dinh-loi','ong-pho']) assert.ok(qa.includes(`key: '${hero}'`), hero);
  assert.ok(qa.includes("for (const action of ['basic','skill','ultimate'])"));
  assert.ok(qa.includes("e.type==='marker:impact'"));
  assert.ok(qa.includes("e.type==='action:complete'"));
  assert.ok(qa.includes('Math.hypot(row.after.x-row.after.baseX,row.after.y-row.after.baseY)<=2'));
});

test('legacy authored browser QA requires action assets and both desktop/mobile viewports', () => {
  for (const asset of ['basicProjectile','basicImpact','skill1Vfx','ultimateVfx','skill1Wave','skill1Impact','skill1Shield','ultimateImpact']) {
    assert.ok(qa.includes(asset), asset);
  }
  assert.ok(qa.includes("['desktop',1280,800,1]"));
  assert.ok(qa.includes("['mobile',390,844,2]"));
  assert.ok(qa.includes("assetHttpErrors.length===0"));
  assert.ok(qa.includes("networkFailures.length===0"));
});
