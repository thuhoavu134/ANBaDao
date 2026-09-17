import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('Dinh Loi and Luc Anh do not eagerly construct every battle atlas Image', () => {
  const battle = read('battle.html');
  assert.doesNotMatch(battle, /DINH_LOI_IMAGES=Object\.fromEntries\(Object\.entries\(DINH_LOI_ASSET_NAMES\)\.map\(\(\[key,file\]\)=>\{const image=new Image\(\)/);
  assert.doesNotMatch(battle, /LUC_ANH_IMAGES=Object\.fromEntries\(Object\.entries\(LUC_ANH_META\)\.map\(\(\[key,m\]\)=>\{const image=new Image\(\)/);
});

test('Dinh Loi and Luc Anh source declares shared loader ownership hooks', () => {
  const battle = read('battle.html');
  assert.match(battle, /BATTLE_NATIVE_ATLAS_CACHE/);
  assert.match(battle, /function dinhLoiImage/);
  assert.match(battle, /function lucAnhImage/);
  assert.match(battle, /maxBytes=128\*1024\*1024/);
});
