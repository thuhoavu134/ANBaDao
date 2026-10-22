// Pure parts of the hero scaffold (no file access): brief validation, battle markers, cue placement and the
// generated domain module / test source. scripts/hero/scaffold.mjs does the file work.
const constName = key => key.toUpperCase();
const js = v => JSON.stringify(v);

export const ELEMENT = { soul: ['soul', 'Âm Hồn'], moc: ['wood', 'Mộc Tinh'], thuy: ['water', 'Thương Thủy'], hoa: ['fire', 'Viêm Hỏa'], kim: ['metal', 'Kim Khí'], mong: ['dream', 'Hư Mộng'] };
export const TARGETS = { enemy: '1 địch', aoe_enemy: 'Toàn bộ địch' };

export function validateBrief(b) {
  const errs = [];
  const need = (path, ok = v => typeof v === 'string' && v.trim()) => {
    const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), b);
    if (!ok(v)) errs.push(path);
  };
  need('key', v => typeof v === 'string' && /^[a-z][a-z0-9_]*$/.test(v));
  need('name'); need('he', v => Object.hasOwn(ELEMENT, v));
  for (const slot of ['passive', 'basic', 'ultimate']) { need(`kit.${slot}.name`); need(`kit.${slot}.desc`); }
  for (const slot of ['basic', 'ultimate']) {
    need(`kit.${slot}.power`, v => typeof v === 'number' && v > 0 && v < 20);
    need(`kit.${slot}.target`, v => Object.hasOwn(TARGETS, v));
    need(`kit.${slot}.hits`, v => v == null || (Number.isInteger(v) && v >= 1 && v <= 6));
  }
  if (errs.length) throw new Error(`brief thiếu/sai: ${errs.join(', ')} (mẫu: docs/templates/hero-brief.json)`);
  return b;
}

/**
 * Battle markers in source-clip ms. The hero's own swing/voice sound (cut from the atk / ulti clip by
 * extract_sfx.py) marks the release, exactly where an animator would put it: Tịnh Mặc's basic swing sound
 * starts at 1800ms and his hand-tuned release was 1780ms. Without audio: 45% of the clip.
 */
export function markers(clipMs, hits, soundStartMs, vfxMs) {
  const release = Math.round(Math.min(0.7 * clipMs, Math.max(0.3 * clipMs, soundStartMs ?? 0.45 * clipMs)));
  const gap = hits > 1 ? 400 : 0;
  const first = Math.min(clipMs - 200 - gap * (hits - 1), release + 400);
  const list = Array.from({ length: hits }, (_, i) => Math.round(first + gap * i));
  const last = list[list.length - 1];
  const vfxEnd = Math.round(Math.min(clipMs, Math.max(last + 300, vfxMs ? release + vfxMs : last + 700)));
  return { release, hits: list, vfxEnd: Math.max(vfxEnd, last), recovery: Math.max(Math.round(clipMs), vfxEnd) };
}

/** Cue placed where it was cut from the clip: release - lead = trim start (runtime: play at marker - lead). */
export function cueAt(cue, startMs, m) {
  if (startMs <= m.release) return { cue, at: 'release', lead: Math.round(m.release - startMs) };
  const hit = m.hits.findIndex(h => h >= startMs);
  if (hit < 0) return { cue, at: 'hit', hit: m.hits.length - 1 };
  return { cue, at: 'hit', hit, lead: Math.round(m.hits[hit] - startMs) };
}

export function domainModule(b, slug, today) {
  const key = b.key, K = constName(key), [element, elementName] = ELEMENT[b.he];
  const t = s => TARGETS[b.kit[s].target];
  const hitsB = b.kit.basic.hits || 1, hitsU = b.kit.ultimate.hits || 1;
  return `// ${b.fullName || b.name} (scaffold ${today}, scripts/hero/scaffold.mjs). Presentation lives in
// assets/characters/${slug}/hero.json; rules live in splus-mechanics AUTHORED_HIT.${key}.
export const ${K}_KIT = Object.freeze({
  id: 'hero_splus_${key}',
  key: '${key}',
  passive: Object.freeze({ name: ${js(b.kit.passive.name)} }),
  basic: Object.freeze({ name: ${js(b.kit.basic.name)}, cost: 0, hits: ${hitsB}, target: '${b.kit.basic.target}', multiplier: ${b.kit.basic.power} }),
  ultimate: Object.freeze({ name: ${js(b.kit.ultimate.name)}, cost: 60, hits: ${hitsU}, target: '${b.kit.ultimate.target}', multiplier: ${b.kit.ultimate.power} })
});

export const ${K}_HERO = Object.freeze({
  id: 'hero_splus_${key}', key: '${key}', number: null, catalogKind: 'authored-extra',
  name: ${js(b.name)}, fullName: ${js(b.fullName || b.name)}, rarity: 'S+', element: '${element}', elementName: '${elementName}', role: '${b.archetype || 'mystic'}',
  recommendedSlots: ${js(b.recommendedSlots || [0, 1, 2])}, weapon: ${js(b.weapon || '')},
  profileVersion: '${slug}/${today}-scaffold', gender: ${js(b.gender || '')}, age: ${js(b.age || '')},
  introduction: ${js(b.introduction || b.kit.passive.desc)},
  voice: Object.freeze({ lobby: ${js(b.voice?.lobby || '')}, ultimate: ${js(b.voice?.ultimate || b.kit.ultimate.name + '!')} }),
  art: Object.freeze({ status: 'canvas-sprite-runtime-review', portrait: 'assets/characters/${slug}/portrait-00000000.webp' }),
  iconId: 'splus.${key}.ultimate', passiveName: ${js(b.kit.passive.name)},
  passive: Object.freeze({ id: '${key}.passive', name: ${js(b.kit.passive.name)}, target: 'Bản thân',
    description: ${js(b.kit.passive.desc)},
    effects: ${js(b.kit.passive.effects || [b.kit.passive.name])}, rules: {}, cost: 0, cooldown: 0 }),
  actions: Object.freeze({
    basic: Object.freeze({ id: '${key}.basic', name: ${js(b.kit.basic.name)}, description: ${js(b.kit.basic.desc)}, target: '${t('basic')}', cost: 0, cooldown: 0 }),
    // Display-only alias required by the S+ hero contract; combat blocks the skill slot.
    skill: Object.freeze({ id: '${key}.skill', name: ${js(b.kit.basic.name)}, description: ${js('Alias hiển thị của đòn thường, ' + b.name + ' không có Skill tiêu hao riêng.')}, target: '${t('basic')}', cost: 0, cooldown: 0 }),
    ultimate: Object.freeze({ id: '${key}.ultimate', name: ${js(b.kit.ultimate.name)}, description: ${js(b.kit.ultimate.desc)}, target: '${t('ultimate')}',
      effects: ${js(b.kit.ultimate.effects || [`${Math.round(b.kit.ultimate.power * 100)}% sát thương`])}, cost: 60, cooldown: 0 })
  })
});
`;
}

export function heroTest(b, slug) {
  const key = b.key, hb = b.kit.basic.hits || 1, hu = b.kit.ultimate.hits || 1;
  const areaB = b.kit.basic.target === 'aoe_enemy', areaU = b.kit.ultimate.target === 'aoe_enemy';
  return `// Generated by scripts/hero/scaffold.mjs: the contract every authored hero must keep.
// Add the hero's own mechanics tests below when AUTHORED_HIT.${key} gains special rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {SPLUS_EXTRA_BY_ID, resolveSplusExtraId} from '../src/domain/hero/splus-extras.mjs';
const H=(key,team=1,slot=0,extra={})=>({id:\`\${team}:\${key}\`,sourceId:\`hero_splus_\${key}\`,team,slot,hp:1e6,maxHp:1e6,atk:1000,def:200,speed:100,energy:100,crit:0,accuracy:100,statuses:[],...extra});
const make=units=>{const e=createSplusCombat({units,rng:()=>.5});e.start();return e;};
const hits=(e,src,tgt,action)=>e.events.filter(x=>x.type==='damage'&&x.sourceId===src&&x.targetId===tgt&&x.action===action);

test(${js(`${b.name}: registered as an S+ extra and resolvable by key / slug`)},()=>{
  assert.ok(SPLUS_EXTRA_BY_ID.hero_splus_${key});
  for(const alias of ${js([key, ...(slug.replace(/-/g, '_') === key ? [slug] : []), `hero_splus_${key}`])})assert.equal(resolveSplusExtraId(alias),'hero_splus_${key}',alias);
});

test(${js(`${b.name} basic: ${hb} hit(s), ${areaB ? 'every enemy' : 'one target'}`)},()=>{
  const e=make([H('${key}',1,0),H('a',2,0),H('b',2,1)]);
  e.act('1:${key}','basic','2:a');
  assert.equal(hits(e,'1:${key}','2:a','basic').length,${hb});
  assert.equal(hits(e,'1:${key}','2:b','basic').length,${areaB ? hb : 0});
});

test(${js(`${b.name} ultimate: ${hu} hit(s), ${areaU ? 'every enemy' : 'one target'}`)},()=>{
  const e=make([H('${key}',1,0),H('a',2,0),H('b',2,1)]);
  e.act('1:${key}','ultimate','2:a');
  assert.equal(hits(e,'1:${key}','2:a','ultimate').length,${hu});
  assert.equal(hits(e,'1:${key}','2:b','ultimate').length,${areaU ? hu : 0});
});
`;
}

