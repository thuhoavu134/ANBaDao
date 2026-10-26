// Owner 2026-10-26: tiếng tướng authored phải phát đúng cao độ gốc ở mọi tốc độ trận.
// Trận nhúng trong app bị ép x3 (battle.html: `if (!EMBEDDED) return; state.speed = 3;`), nếu tua tiếng theo
// tốc độ trận thì tiếng nhanh gấp 3, cao hơn ~19 nửa cung -> owner nghe "không phải tiếng gốc".
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const hero = JSON.parse(readFileSync(new URL('assets/characters/lang-van/hero.json', root), 'utf8'));
const authoredMap = {
  'lang-van-basic-1': hero.sfx['lang-van-basic-1'],
  'lang-van-basic-3': hero.sfx['lang-van-basic-3'],
};
const placeholder = '/*HV_AUTHORED_SFX*/{}/*HV_AUTHORED_SFX_END*/';
const raw = readFileSync(new URL('src/ui/audio-sfx-runtime.js', root), 'utf8');
assert.ok(raw.includes(placeholder), 'runtime phải còn chỗ cắm map cue authored');
const source = raw.replace(placeholder, JSON.stringify(authoredMap));

function makeBus() {
  const sources = [], requests = [];
  const ctx = {
    state: 'running', currentTime: 0, destination: {},
    decodeAudioData: async () => ({ duration: 0.7 }),
    createBufferSource() {
      const s = { playbackRate: { value: 1 }, connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(s); return s;
    },
    createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
  };
  const window = { __HV_EARLY_CTX: ctx, addEventListener() {} };
  window.parent = window;
  const c = vm.createContext({
    window, URL, AbortController, setTimeout, clearTimeout, console,
    document: { baseURI: 'https://battle.test/battle.html', documentElement: { dataset: {} }, addEventListener() {} },
    performance: { now: () => 100, timeOrigin: 0 },
    fetch: async url => {
      const path = new URL(url).pathname.slice(1); requests.push(path);
      const bytes = readFileSync(new URL(path, root));
      return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
    },
  });
  vm.runInContext(source, c);
  return { bus: window.HonVietSfx, sources, requests };
}

for (const speed of [1, 2, 3]) {
  test(`Lăng Vân: tiếng đòn thường giữ cao độ gốc ở tốc độ trận x${speed}`, async () => {
    const { bus, sources, requests } = makeBus();
    assert.equal(await bus.prepare('lang-van-basic-3'), true);
    assert.equal(await bus.play('lang-van-basic-3', { group: 'combat', playbackRate: speed }), true);
    assert.equal(requests.at(-1), 'assets/audio/sfx/' + authoredMap['lang-van-basic-3']);
    assert.equal(sources.at(-1).playbackRate.value, 1, 'không được tua nhanh/cao giọng theo tốc độ trận');
    assert.equal(sources.at(-1).started, true);
  });
}

test('Lăng Vân: 2 tiếng đòn thường là file NGUYÊN BẢN owner chọn trong kho Kiếm Thế, không bị chỉnh', () => {
  const md5 = rel => createHash('md5').update(readFileSync(new URL('assets/audio/sfx/' + rel, root))).digest('hex');
  // cy_bzwy_c.wav (nhịp 1-2) và tm_dcg_c.wav (nhịp 3, owner chọn số 23) — md5 lấy từ file gốc trong kho.
  assert.equal(md5(hero.sfx['lang-van-basic-1']).slice(0, 8), 'efd892d4');
  assert.equal(hero.sfx['lang-van-basic-2'], hero.sfx['lang-van-basic-1']);
  assert.equal(md5(hero.sfx['lang-van-basic-3']).slice(0, 8), '90bd2748');
  // tên file mang mã nội dung -> đổi tiếng là đổi URL, không thiết bị nào giữ bản cũ
  assert.match(hero.sfx['lang-van-basic-1'], /-efd892d4\.wav$/);
  assert.match(hero.sfx['lang-van-basic-3'], /-90bd2748\.wav$/);
});

test('Lăng Vân: đòn thường không còn tiếng va chạm cũ đè lên 3 tiếng owner chọn', () => {
  const cues = hero.battle.actions.basic.sfx.map(e => e.cue);
  assert.deepEqual(cues, ['lang-van-basic-1', 'lang-van-basic-2', 'lang-van-basic-3']);
  assert.equal(hero.sfx['lang-van-basic-hit'], undefined);
});

// Owner 2026-10-26 ("đưa về cao độ gốc đi"): 6 tướng cũ cũng không được tua tiếng theo tốc độ trận.
for (const cue of ['be-an-basic', 'tich-dao-slash', 'hong-thuong-impact', 'co-nuong-atk', 'dinh-loi-atk', 'thay-mo-ultimate']) {
  test(`tướng cũ: ${cue} giữ cao độ gốc ở x3`, async () => {
    const { bus, sources } = makeBus();
    assert.equal(await bus.prepare(cue), true, 'phải nạp được file của ' + cue);
    assert.equal(await bus.play(cue, { group: 'combat', playbackRate: 3 }), true);
    assert.equal(sources.at(-1).playbackRate.value, 1, cue + ' không được tua nhanh/cao giọng');
  });
}
