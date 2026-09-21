import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const battle = readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const polish = readFileSync(new URL('../scripts/battle-visual-polish-v1.mjs', import.meta.url), 'utf8');

test('battle floaters clamp to the actual visible canvas world after camera transform', () => {
  assert.ok(battle.includes('const transform = context.getTransform();'));
  assert.ok(battle.includes('const visibleLeft = (0 - transform.e) / transformScaleX;'));
  assert.ok(battle.includes('const visibleRight = (context.canvas.width - transform.e) / transformScaleX;'));
  assert.ok(battle.includes('const safeX = minX <= maxX'));
  assert.ok(battle.includes('context.strokeText(floater.text, safeX, floater.y);'));
  assert.ok(battle.includes('context.fillText(floater.text, safeX, floater.y);'));
});

test('long floater labels can shrink to fit and Lục Ảnh status copy is not rendered as oversized damage text', () => {
  assert.ok(battle.includes('const maxTextWidth = Math.max(1, visibleRight - visibleLeft - edgePadding * 2);'));
  assert.ok(battle.includes('const fittedSize = Math.max(12, floaterBaseSize * (maxTextWidth / textWidth));'));
  assert.ok(battle.includes('addFloater(foe,"ẢNH TAN · "+marks,"#c9b27b",false);'));
  assert.ok(battle.includes('addFloater(foe,"ĐỘC VÂN · 6% HP","#98a86d",false);'));
  assert.ok(!battle.includes('addFloater(foe,"ĐỘC VÂN · 6% HP","#98a86d",true);'));
});


test('final visual polish build patch preserves viewport clamp for damage and status floaters', () => {
  assert.ok(polish.includes('const visibleFloaterBounds=(textWidth,padding=18)=>'));
  assert.ok(polish.includes('context.measureText(floater.text).width*pop'));
  assert.ok(polish.includes('context.translate(safe.x,floater.y)'));
  assert.ok(polish.includes('const maxTextWidth=Math.max(1,visibleWidth-36)'));
  assert.ok(polish.includes('context.strokeText(floater.text,safe.x,floater.y)'));
  assert.ok(polish.includes('context.fillText(floater.text,safe.x,floater.y)'));
});
