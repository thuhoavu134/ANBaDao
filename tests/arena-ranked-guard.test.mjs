import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('online maintenance blocks before stamina is spent; local arena still starts', () => {
  let starts = 0, stamina = 20;
  const notices = [];
  const context = { document: { body: {} }, P: { arena: { rivals: [{ net: true }, { net: false }] } },
    prepareArenaSettle() {}, startArena() { starts++; stamina -= 5; return true; }, toast: text => notices.push(text) };
  context.window = context; vm.createContext(context);
  vm.runInContext(readFileSync('src/ui/arena-runtime.js', 'utf8'), context);
  assert.equal(context.startArena(0), false);
  assert.equal(stamina, 20); assert.equal(starts, 0);
  assert.match(notices[0], /Chưa trừ thể lực/);
  assert.equal(context.startArena(1), true);
  assert.equal(stamina, 15); assert.equal(starts, 1);
});
