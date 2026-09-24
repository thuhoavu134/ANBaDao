import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('R08 build installs the battle protocol after the transaction contract', () => {
  const build = read('../scripts/build-static.mjs');
  const transaction = build.indexOf("await import('./transaction-contract-v1.mjs');");
  const settlement = build.indexOf("await import('./settlement-navigation-v1.mjs');");
  assert.ok(transaction >= 0);
  assert.ok(settlement > transaction);

  const patch = read('../scripts/settlement-navigation-v1.mjs');
  assert.match(patch, /hon-viet-battle\/v1/);
  assert.match(patch, /schemaVersion:1/);
  assert.match(patch, /sequence:/);
  assert.match(patch, /function applyLegacyMetaWinHooks/);
  assert.match(patch, /HonVietTransaction\?\.commit/);
  assert.match(patch, /samkok-r08-settlement-navigation/);
  new Function(patch.replace(/^import[^\n]*\n/gm, ''));
});

test('battle bridge protocol annotates every parent message and remains syntactically valid', () => {
  const battle = read('../dist/battle.html');
  const messageCount = (battle.match(/parent\.postMessage\(\{/g) || []).length;
  assert.ok(messageCount >= 8);
  assert.equal(
    (battle.match(/schema:"hon-viet-battle\/v1"/g) || []).length,
    messageCount
  );

  const scriptBodies = [];
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let scriptMatch;
  while ((scriptMatch = scriptPattern.exec(battle))) scriptBodies.push(scriptMatch[1]);
  for (const body of scriptBodies) new Function(body);
});

test('the shared battle host message helper satisfies the settlement protocol', () => {
  const battle = read('../dist/battle.html');
  const start = battle.indexOf('function postToHonVietHost(type, payload)');
  const end = battle.indexOf('window.postToHonVietHost = postToHonVietHost;', start);
  assert.ok(start >= 0 && end > start, 'shared host bridge exists');
  const bridge = battle.slice(start, end);
  assert.match(bridge, /schema:"hon-viet-battle\/v1"/);
  assert.match(bridge, /schemaVersion:1/);
  assert.match(bridge, /sequence:\(window\.__HV_MESSAGE_SEQUENCE=/);
  assert.match(bridge, /origin:location\.origin/);
  assert.match(bridge, /parent\.postMessage\(message, "\*"\)/);
});

test('settlement hook keeps existing reward values but commits before progress/navigation', () => {
  const patch = read('../scripts/settlement-navigation-v1.mjs');
  const hookStart = patch.indexOf('const newHooks = [');
  const hookEnd = patch.indexOf('index = index.replace(hookPattern, newHooks);');
  const hook = patch.slice(hookStart, hookEnd);

  assert.match(hook, /source:"battle\.settlement"/);
  assert.match(hook, /reward:{gold}/);
  assert.match(hook, /if \(!transaction\.duplicate && typeof questProgress/);
  assert.ok(!hook.includes('P.gold+=gold'));
  assert.ok(!hook.includes('P.gold += gold'));
});

test('navigation controller has one active session and blocks stale/duplicate messages', () => {
  const patch = read('../scripts/settlement-navigation-v1.mjs');
  assert.match(patch, /message\.origin!==location\.origin/);
  assert.match(patch, /message\.schema!==SCHEMA/);
  assert.match(patch, /message\.schemaVersion!==1/);
  assert.match(patch, /sequence<=last/);
  assert.match(patch, /sessionId!==status\.activeSessionId/);
  assert.match(patch, /status\.phase==="settling"/);
  assert.match(patch, /status\.phase="settled"/);
  assert.match(patch, /event\.stopImmediatePropagation/);
});
