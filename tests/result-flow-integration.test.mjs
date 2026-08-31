import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const battle = fs.readFileSync(new URL('../battle.html', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function inlineScripts(html) {
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((source) => source.trim());
}

test('v3.26.0 package and every inline battle script are syntax-valid', () => {
  assert.equal(pkg.version, '3.26.0');
  assert.match(index, /HV-MG-3\.26\.0-LUC-ANH-GOLDEN-COMPLETE/);
  assert.doesNotMatch(battle, /\\n<(?:style|script)\b/);
  for (const source of [...inlineScripts(index), ...inlineScripts(battle)]) {
    assert.doesNotThrow(() => new Function(source));
  }
});

test('result flow keeps dynamic MVP and Victory Run -> Idle plus Defeat Fall', () => {
  assert.match(battle, /function mvpFromSnapshot\(snap\)/);
  assert.match(battle, /Number\(b\.damage\).*Number\(a\.damage\)/);
  assert.match(battle, /irv-hero \$\{victory\?'run':'fall'\}/);
  assert.match(battle, /irv-hero idle/);
  assert.match(battle, /@keyframes irvRun/);
  assert.match(battle, /@keyframes irvIdle/);
  assert.match(battle, /@keyframes irvFall/);
});

test('result actions and all result assets are present', () => {
  for (const relative of [
    'assets/result-victory-v6/victory-stage-original-quality-smooth-v5.apng',
    'assets/result-victory-v6/victory-text-clean-smooth-v5.apng',
    'assets/result-victory-v6/victory-info-card-portrait-v6.png',
    'assets/result-defeat-v4/defeat-clean-loop.apng',
    'assets/result-defeat-v4/victory-info-card-portrait-v6.png',
    'assets/result-defeat-v4/idle-reward.png',
    'assets/result-defeat-v4/upgrade-hero.png',
    'assets/result-defeat-v4/summon-hero.png',
    'assets/result-defeat-v4/equip-gear.png'
  ]) assert.ok(fs.existsSync(new URL(`../${relative}`, import.meta.url)), relative);

  assert.match(battle, />\$\{victory\?'Ải sau':'Quay lại'\}</);
  for (const route of ['daily', 'heroes', 'summon', 'forge']) {
    assert.match(battle, new RegExp(`data-nav="${route}"`));
  }
});

test('the embedded battle engine is byte-identical to battle.html', () => {
  const match = index.match(/const BATTLE_HTML_BASE64 = "([A-Za-z0-9+/=]+)";/);
  assert.ok(match, 'embedded battle payload');
  assert.equal(Buffer.from(match[1], 'base64').toString('utf8'), battle);
});
