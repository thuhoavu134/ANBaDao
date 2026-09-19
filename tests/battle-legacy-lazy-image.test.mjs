import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const battle=fs.readFileSync(new URL('../battle.html',import.meta.url),'utf8');

test('legacy battle image handles are callable lazy loaders, not Image objects invoked as functions',()=>{
  for(const name of [
    'ONG_PHO_IDLE_IMAGE','ONG_PHO_SKILL1_IMAGE','ONG_PHO_ULTIMATE_IMAGE',
    'ONG_PHO_ATTACK_IMAGE','ONG_PHO_HIT_IMAGE','ONG_PHO_FALL_IMAGE','THAY_MO_IDLE_IMAGE'
  ]){
    assert.match(battle,new RegExp('const\\s+'+name+'\\s*=\\s*\\(\\)\\s*=>\\s*battleLegacyImage'));
    assert.doesNotMatch(battle,new RegExp('const\\s+'+name+'\\s*=\\s*new Image\\(\\)'));
  }
});

test('every direct Image declaration remains an object and is never called as a function',()=>{
  const declared=[...battle.matchAll(/const\\s+([A-Z0-9_]+)\\s*=\\s*new Image\\(\\)/g)].map(m=>m[1]);
  for(const name of declared){
    assert.doesNotMatch(battle,new RegExp('\\b'+name+'\\s*\\('),name+' must not be called as a function');
  }
});
