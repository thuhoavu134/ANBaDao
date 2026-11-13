import test from 'node:test';
import assert from 'node:assert/strict';
import { patchMainCityArt, MAIN_CITY_ART } from '../scripts/hub-main-city-art-v1.mjs';

for (const suffix of ['.png', '.lossless-v1.webp']) {
  test('replace background and remove duplicate gateway: ' + suffix, () => {
    const controls = '<button data-art-go="shop">Hắc Thị</button>';
    const input = '<head></head><img class="hv-daylight-base" src="assets/hub/background-v3240/vietnamese-cloud-citadel' + suffix + '"><img class="hub-foreground-depth" src="assets/hub/foreground-v3240/vietnamese-gateway-foreground' + suffix + '" alt="" draggable="false">' + controls;
    const output = patchMainCityArt(input);
    assert.ok(output.includes(MAIN_CITY_ART));
    assert.ok(!output.includes('<img class="hub-foreground-depth"'));
    assert.ok(output.includes(controls));
    assert.equal(patchMainCityArt(output), output);
  });
}
test('fail on upstream hub markup drift', () => {
  assert.throws(() => patchMainCityArt('<head></head>'), /anchors missing/);
});
