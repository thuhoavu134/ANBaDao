import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const battle = readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const hud = battle.slice(
  battle.indexOf('id="v3237-reference-battle-loop"'),
  battle.indexOf('</style>', battle.indexOf('id="v3237-reference-battle-loop"'))
);

test('L12-H1: embedded campaign HUD hides the brand topbar', () => {
  assert.match(hud, /\.embedded-battle\s+\.topbar\{[^}]*display:\s*none/i);
  assert.doesNotMatch(hud, /\.embedded-battle\s+\.topbar\{[^}]*flex:\s*0 0 auto/i);
});

test('L12-H2: campaign ribbon is compact lacquer, not mint pastel', () => {
  assert.doesNotMatch(hud, /background:#e7f4ef/i);
  assert.doesNotMatch(hud, /#d8eee6/i);
  assert.doesNotMatch(hud, /#f9fffc/i);
  assert.match(hud, /\.embedded-battle\s+\.battle-ribbon\{[^}]*min-height:\s*4[0-8]px/i);
  assert.match(hud, /\.embedded-battle\s+\.battle-ribbon\{[^}]*(#d7aa57|#163532|#0b221f|rgba\(215,\s*170,\s*87)/i);
});

test('L12-H3: dock speed and skip are 44px circular chips', () => {
  assert.match(hud, /\.reference-battle-speed\{[^}]*width:\s*44px/i);
  assert.match(hud, /\.reference-battle-speed\{[^}]*height:\s*44px/i);
  assert.match(hud, /\.reference-battle-speed\{[^}]*border-radius:\s*50%/i);
  assert.match(hud, /\.reference-battle-skip\{[^}]*width:\s*44px/i);
  assert.match(hud, /\.reference-battle-skip\{[^}]*height:\s*44px/i);
  assert.match(hud, /\.reference-battle-skip\{[^}]*border-radius:\s*50%/i);
});
