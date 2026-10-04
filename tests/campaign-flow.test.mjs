import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const builtHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

test('campaign exposes one current mission instead of a chapter selector', () => {
  const activeOverride = html.slice(html.indexOf('<script id="v3238-reference-campaign-render">'));
  assert.match(html, /className='chrow continuous-mission-card'/);
  assert.match(html, /TIẾP TỤC CHINH CHIẾN/);
  assert.doesNotMatch(activeOverride, /DATA\.chapters\.forEach\(ch=>\{/);
});

test('Victory choice gates campaign continuation after a win', () => {
  assert.match(builtHtml, /const nextStage=Math\.max\(Number\(P\.campaignStages\[idx\]\)\|\|0,stageIndex\+1\)/);
  assert.match(builtHtml, /P\.campaignStages\[idx\]=nextStage/);
  assert.match(builtHtml, /if\(resultAction==="next"\) setTimeout\(\(\)=>startChapter\(idx,\{continuing:true\}\),360\); else navTo\("campaign"\);/);
  assert.match(builtHtml, /endChapter\(\{referenceLoop:true,autoContinue:resultAction==="next"\}\)/);
});

test('campaign retains independent battles and the 15-round rule', () => {
  assert.match(html, /ST\.mode==='campaign'\) return \{type:'challenge',maxRounds:15\}/);
  assert.match(html, /tối đa 15 hiệp/);
  assert.match(html, /Không có wave hay quân tiếp viện tự động/);
});

test('loss stops the chain and exposes recovery routes', () => {
  assert.match(html, /if\(!win\)\{ navTo\('campaign'\)/);
  assert.match(html, /Đổi đội hình/);
  assert.match(html, /Tăng lực chiến/);
});


test('top-level mobile battle return follows Xác nhận versus Ải sau', () => {
  const start = builtHtml.indexOf('  async function consumeBattleReturn() {');
  const end = builtHtml.indexOf('\n})();', start);
  assert.ok(start >= 0 && end > start, 'battle-return bridge must exist');
  const bridge = builtHtml.slice(start, end);
  assert.match(bridge, /if \(payload\.resultAction === "next"\) setTimeout\(\(\) => startChapter\(idx, \{ continuing: true \}\), 360\);/);
  assert.match(bridge, /else navTo\("campaign"\);/);
  assert.match(bridge, /endChapter\(\{ referenceLoop: true, autoContinue: payload\.resultAction === "next" \}\)/);
  assert.doesNotMatch(bridge, /đang tới nhiệm vụ kế tiếp/);
});
