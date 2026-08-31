import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('campaign exposes one current mission instead of a chapter selector', () => {
  const activeOverride = html.slice(html.indexOf('<script id="v3238-reference-campaign-render">'));
  assert.match(html, /className='chrow continuous-mission-card'/);
  assert.match(html, /TIẾP TỤC CHINH CHIẾN/);
  assert.doesNotMatch(activeOverride, /DATA\.chapters\.forEach\(ch=>\{/);
});

test('winning an encounter automatically starts the next mission', () => {
  assert.match(html, /P\.campaignStages\[idx\]=stageIndex\+1/);
  assert.match(html, /setTimeout\(\(\)=>startChapter\(idx,\{continuing:true\}\),360\)/);
  assert.match(html, /endChapter\(\{referenceLoop:true,autoContinue:true\}\)/);
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
