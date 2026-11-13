import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');
const js = () => read('src/ui/campaign-scene.js');
const css = () => read('src/ui/campaign-scene.css') + read('src/ui/campaign-3d.css');

test('AC01: cảnh chiếm chiều cao chính, rương fab gọn, không bảng lớn luôn hiện', () => {
  const ui = js();
  const style = css();
  assert.match(ui, /cs-chest-fab/);
  assert.match(ui, /cs-hud/);
  assert.match(ui, /data-scene-action="open-chest"/);
  assert.match(style, /cs-landscape\{[^}]*min-height:5[02]dvh/);
  assert.match(style, /cs-chest-sheet/);
  assert.doesNotMatch(ui, /THU HOẠCH TRÊN HÀNH TẨU/);
  assert.doesNotMatch(ui, /cs-chest-heading/);
});

test('AC04: popup rương có thời gian, cap 15 giờ, nhận, đóng', () => {
  const ui = js();
  assert.match(ui, /cs-chest-sheet/);
  assert.match(ui, /data-scene-action="close-chest"/);
  assert.match(ui, /data-hv-afk-claim/);
  assert.match(ui, /15 giờ/);
  assert.match(ui, /data-afk-progress/);
  assert.match(ui, /data-afk-amount/);
});

test('AC05: nhận thưởng khóa nhấn nhanh, chỉ commit một lần', () => {
  const ui = js();
  assert.match(ui, /sceneState\.claiming/);
  assert.match(ui, /commandId: 'afk\.chest\.claim:/);
  assert.match(ui, /claimAfkChest/);
});

test('AC07: Khiêu chiến và Đổi đội hình giữ luồng prepare', () => {
  const ui = js();
  assert.match(ui, /data-hv-afk-challenge/);
  assert.match(ui, /data-scene-action="prepare"/);
  assert.match(ui, /function openPreparation\(/);
  assert.match(ui, /startChapter\(checkpoint\.chapterIndex, \{ fromAfkChest: true \}\)/);
});

test('AC08: rời màn dừng clock, đóng dialog, một scope', () => {
  const ui = js();
  assert.match(ui, /function onSceneRoute\(/);
  assert.match(ui, /stopSceneClock\(\)/);
  assert.match(ui, /querySelectorAll\??\.?\(['"]dialog['"]\)/);
  assert.match(ui, /createSceneLifetime\(['"]campaign['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"]click['"]/);
});

test('AC09: điểm nối Run theo ID, thiếu thì Idle, không bịa FPS', () => {
  const ui = js();
  assert.match(ui, /HonVietCampaignRunSpecs/);
  assert.match(ui, /spriteSpecs\[campaignActorArtId\(pick\.id\)\]/);
  assert.doesNotMatch(ui, /run-placeholder/);
  assert.doesNotMatch(ui, /fakeRun|pretendRun|scrollOffset\s*=\s*time/);
});

test('AC03: đường giữa màn, chân theo slot, prepare không đổi', () => {
  const ui = js();
  const style = css();
  const road = join(root, 'assets/ui/campaign/campaign-map-v3.webp');
  assert.equal(existsSync(road), true);
  assert.ok(readFileSync(road).length > 50000, 'road webp must be a real painted path');
  assert.match(style, /campaign-map-v3\.webp/);
  assert.match(ui, /HOME_SLOT/);
  assert.match(ui, /homePartyPose/);
  assert.match(ui, /h \* \(\.38 \+ \.27 \* pick\.rowIndex\)/);
});

test('AC10: domain AFK và board không bị ticket này sửa công thức', () => {
  const chest = read('src/domain/afk/afk-chest.mjs');
  const view = read('src/domain/campaign/campaign-view.mjs');
  assert.match(chest, /export const AFK_CAP_SECONDS = 15 \* 60 \* 60/);
  assert.match(chest, /gold: 60/);
  assert.match(view, /export const CAMPAIGN_BOARD_SIZE = 6/);
});

test('AC02: canvas aria-label theo đội đang chọn, art theo pick.id', () => {
  const ui = js();
  assert.match(ui, /savedSceneSquad\(\)/);
  assert.match(ui, /Đội đang thám hiểm: ' \+ squad\.map/);
  assert.match(ui, /specForAfk\(pick\)/);
  assert.match(ui, /spriteSpecs\[campaignActorArtId\(pick\.id\)\]/);
});

