export const CATALOG_VALIDATOR_SCHEMA = 'hon-viet-catalog-validator/v1';

const DEFAULT_REWARD_HERO_FIELDS = Object.freeze([
  'heroId',
  'shardHero',
  'unlockHero',
  'characterId'
]);

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function duplicates(values) {
  const seen = new Set();
  const result = new Set();
  for (const value of values) {
    if (!value || seen.has(value)) {
      if (value) result.add(value);
    } else {
      seen.add(value);
    }
  }
  return [...result];
}

function refId(value) {
  if (typeof value === 'string' || typeof value === 'number') return text(value);
  return text(value?.id ?? value?.heroId ?? value?.itemId ?? value?.assetId);
}

function collectNextTargets(node) {
  const targets = [];
  const add = (value) => {
    if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === 'string' || typeof value === 'number') {
      const id = text(value);
      if (id) targets.push(id);
    } else if (value && typeof value === 'object') {
      add(value.next ?? value.target ?? value.sceneId ?? value.id);
    }
  };

  add(node?.next);
  add(node?.nextScene);
  add(node?.nextId);
  for (const key of ['options', 'choices', 'branches', 'routes']) {
    const value = node?.[key];
    if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === 'object') Object.values(value).forEach(add);
  }
  return unique(targets);
}

function collectBattleRefs(node) {
  const refs = [];
  const add = (value) => {
    if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === 'string' || typeof value === 'number') {
      const id = text(value);
      if (id) refs.push(id);
    } else if (value && typeof value === 'object') {
      add(value.battleId ?? value.encounterId ?? value.id);
    }
  };

  add(node?.battleId);
  add(node?.encounterId);
  add(node?.battle);
  add(node?.battles);
  add(node?.encounters);
  return unique(refs);
}

function collectRewardRefs(chapters, explicitRefs) {
  const refs = [];
  const add = (value, path, type = 'hero') => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => add(entry, path + '[' + index + ']', type));
      return;
    }
    if (value && typeof value === 'object') {
      const id = refId(value);
      if (id) refs.push({ id, type, path });
      return;
    }
    const id = text(value);
    if (id) refs.push({ id, type, path });
  };

  for (const [index, chapter] of chapters.entries()) {
    const reward = asRecord(chapter?.reward);
    for (const field of DEFAULT_REWARD_HERO_FIELDS) {
      if (reward[field] !== undefined) {
        add(reward[field], 'chapters[' + index + '].reward.' + field);
      }
      if (chapter?.[field] !== undefined) {
        add(chapter[field], 'chapters[' + index + '].' + field);
      }
    }
    for (const field of ['items', 'itemIds', 'rewards']) {
      if (reward[field] !== undefined) {
        add(reward[field], 'chapters[' + index + '].reward.' + field, 'item');
      }
    }
  }
  for (const [index, ref] of asArray(explicitRefs).entries()) {
    const id = refId(ref);
    if (id) refs.push({
      id,
      type: text(ref?.type) || 'hero',
      path: text(ref?.path) || 'rewardRefs[' + index + ']'
    });
  }
  return refs;
}

function collectEncounterUnits(encounters) {
  const units = [];
  for (const [encounterId, raw] of Object.entries(asRecord(encounters))) {
    const entries = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.enemies)
        ? raw.enemies
        : Array.isArray(raw?.units)
          ? raw.units
          : [];
    for (const [index, unit] of entries.entries()) {
      const id = refId(unit);
      units.push({
        id,
        encounterId,
        path: 'encounters.' + encounterId + '[' + index + ']'
      });
    }
  }
  return units;
}

function collectPriceEntries(prices) {
  if (Array.isArray(prices)) {
    return prices.map((entry, index) => ({
      id: refId(entry) || 'prices[' + index + ']',
      amount: entry?.amount ?? entry?.price ?? entry?.cost ?? entry?.value,
      path: text(entry?.path) || 'prices[' + index + ']'
    }));
  }
  return Object.entries(asRecord(prices)).map(([id, entry]) => ({
    id,
    amount: entry && typeof entry === 'object'
      ? entry.amount ?? entry.price ?? entry.cost ?? entry.value
      : entry,
    path: 'prices.' + id
  }));
}

function issue(code, path, message, details = {}) {
  return Object.freeze({ code, path, message, ...details });
}

function graphCycles(graph) {
  const state = new Map();
  const stack = [];
  const cycles = [];
  const seen = new Set();

  const visit = (id) => {
    state.set(id, 1);
    stack.push(id);
    for (const target of graph.get(id) || []) {
      if (!graph.has(target)) continue;
      if (state.get(target) === 1) {
        const start = stack.indexOf(target);
        const cycle = stack.slice(start).concat(target);
        const key = [...cycle].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      } else if (!state.get(target)) {
        visit(target);
      }
    }
    stack.pop();
    state.set(id, 2);
  };

  for (const id of graph.keys()) {
    if (!state.get(id)) visit(id);
  }
  return cycles;
}

function reachableFrom(graph, starts) {
  const reachable = new Set();
  const queue = [...starts];
  while (queue.length) {
    const id = queue.shift();
    if (reachable.has(id) || !graph.has(id)) continue;
    reachable.add(id);
    for (const target of graph.get(id) || []) queue.push(target);
  }
  return reachable;
}

/**
 * Validate the catalog that is already owned by Lục Thần.
 *
 * This function deliberately accepts plain data only. It does not read the
 * DOM, storage, runtime globals, or the Hermes archive. The runtime adapter
 * is responsible for producing this input once at the catalog boundary.
 */
export function validateCatalog(catalog = {}) {
  const input = asRecord(catalog);
  const issues = [];
  const add = (code, path, message, details = {}) => {
    issues.push(issue(code, path, message, details));
  };

  const heroes = asRecord(input.heroes);
  const playableIds = asArray(input.playableIds ?? input.officialRosterIds).map(text);
  const playableDuplicates = duplicates(playableIds);
  for (const id of playableDuplicates) {
    add('DUPLICATE_PLAYABLE_ID', 'playableIds', 'Playable ID bị lặp: ' + id, { id });
  }

  const playableSet = new Set(playableIds);
  if (!playableIds.length) {
    add('MISSING_PLAYABLE_CATALOG', 'playableIds', 'Catalog không có ID playable.');
  }
  for (const id of playableIds) {
    if (!heroes[id]) {
      add('UNKNOWN_PLAYABLE_ID', 'playableIds.' + id, 'Playable ID không có trong heroes: ' + id, { id });
    }
  }

  const nonPlayableHeroIds = Object.keys(heroes).filter((id) => !playableSet.has(id));
  const scenes = asRecord(input.scenes);
  const chapters = asArray(input.chapters);
  const encounters = asRecord(input.encounters);
  const sceneSpeakerIds = unique([
    ...asArray(input.sceneSpeakerIds).map(text),
    ...Object.values(scenes).map((scene) => text(scene?.sp)).filter(Boolean)
  ]);
  const npcIds = sceneSpeakerIds.filter((id) => !heroes[id]);
  const encounterUnits = collectEncounterUnits(encounters);
  const enemyIds = unique(encounterUnits.map((unit) => unit.id));
  const encounterIdDuplicates = duplicates(encounterUnits.map((unit) => unit.id));
  for (const id of encounterIdDuplicates) {
    add('DUPLICATE_ENEMY_ID', 'encounters', 'Enemy ID bị lặp trong nhiều encounter: ' + id, { id });
  }
  for (const unit of encounterUnits) {
    if (!unit.id) {
      add('MISSING_ENEMY_ID', unit.path, 'Encounter unit thiếu ID.', { encounterId: unit.encounterId });
    }
  }

  const chapterIds = chapters.map((chapter) => text(chapter?.id || chapter?.idx));
  for (const id of duplicates(chapterIds)) {
    add('DUPLICATE_CHAPTER_ID', 'chapters', 'Chapter ID bị lặp: ' + id, { id });
  }

  const graph = new Map();
  for (const [id, scene] of Object.entries(scenes)) {
    graph.set(id, collectNextTargets(scene));
  }
  const starts = [];
  for (const [index, chapter] of chapters.entries()) {
    const first = text(chapter?.first ?? chapter?.firstScene ?? chapter?.startScene);
    if (first) {
      starts.push(first);
      if (!scenes[first]) {
        add(
          'MISSING_SCENE_REF',
          'chapters[' + index + '].first',
          'Chapter trỏ tới scene không tồn tại: ' + first,
          { from: chapterIds[index] || index, to: first }
        );
      }
    }
  }
  for (const [id, targets] of graph.entries()) {
    for (const target of targets) {
      if (!scenes[target]) {
        add(
          'MISSING_SCENE_REF',
          'scenes.' + id + '.next',
          'Scene trỏ tới scene không tồn tại: ' + target,
          { from: id, to: target }
        );
      }
    }
  }
  for (const cycle of graphCycles(graph)) {
    add(
      'SCENE_CYCLE',
      'scenes.' + cycle[0],
      'Phát hiện vòng lặp tiến trình: ' + cycle.join(' → '),
      { cycle }
    );
  }
  const reachableScenes = reachableFrom(graph, starts);
  const allowedUnreachableScenes = new Set(asArray(input.allowedUnreachableSceneIds).map(text));
  const unreachableSceneIds = Object.keys(scenes)
    .filter((id) => !reachableScenes.has(id) && !allowedUnreachableScenes.has(id));
  for (const id of unreachableSceneIds) {
    add(
      'UNREACHABLE_SCENE',
      'scenes.' + id,
      'Scene không tới được từ first scene của chapter: ' + id,
      { id }
    );
  }

  const referencedEncounterIds = new Set();
  for (const scene of Object.values(scenes)) {
    for (const id of collectBattleRefs(scene)) referencedEncounterIds.add(id);
  }
  for (const chapter of chapters) {
    for (const id of collectBattleRefs(chapter)) referencedEncounterIds.add(id);
  }
  for (const [index, ref] of asArray(input.battleRefs).entries()) {
    const id = refId(ref);
    if (!id) continue;
    referencedEncounterIds.add(id);
    if (!encounters[id]) {
      add('UNKNOWN_ENCOUNTER_ID', 'battleRefs[' + index + ']', 'Battle/encounter không tồn tại: ' + id, { id });
    }
  }
  const reservedEncounterIds = new Set(asArray(input.reservedEncounterIds).map(text));
  const unreachableEncounterIds = Object.keys(encounters)
    .filter((id) => !referencedEncounterIds.has(id) && !reservedEncounterIds.has(id));
  for (const id of unreachableEncounterIds) {
    add(
      'UNREACHABLE_ENCOUNTER',
      'encounters.' + id,
      'Encounter không có đường vào từ chapter/scene: ' + id,
      { id }
    );
  }
  for (const [id, scene] of Object.entries(scenes)) {
    for (const battleId of collectBattleRefs(scene)) {
      if (!encounters[battleId]) {
        add(
          'UNKNOWN_ENCOUNTER_ID',
          'scenes.' + id,
          'Scene trỏ tới encounter không tồn tại: ' + battleId,
          { from: id, id: battleId }
        );
      }
    }
  }

  const rewardRefs = collectRewardRefs(chapters, input.rewardRefs);
  const legacyRewardHeroIds = [];
  for (const ref of rewardRefs) {
    if (ref.type === 'hero') {
      if (!heroes[ref.id]) {
        add(
          'UNKNOWN_REWARD_HERO_ID',
          ref.path,
          'Phần thưởng hero không tồn tại: ' + ref.id,
          { id: ref.id, classification: 'unknown' }
        );
      } else if (!playableSet.has(ref.id)) {
        legacyRewardHeroIds.push(ref.id);
        add(
          'LEGACY_REWARD_HERO',
          ref.path,
          'Phần thưởng hero tồn tại nhưng không playable: ' + ref.id,
          { id: ref.id, classification: 'existing-non-playable' }
        );
      }
    } else if (ref.type === 'item') {
      const items = asRecord(input.items);
      if (Object.keys(items).length && !items[ref.id]) {
        add(
          'UNKNOWN_REWARD_ITEM_ID',
          ref.path,
          'Phần thưởng item không tồn tại: ' + ref.id,
          { id: ref.id, classification: 'unknown' }
        );
      }
    }
  }

  const hasAssetIndex = Array.isArray(input.availableAssetPaths);
  const availableAssetPaths = new Set(asArray(input.availableAssetPaths).map(text));
  const assetRefs = asArray(input.assetRefs);
  const assetIds = assetRefs.map((ref, index) => refId(ref) || 'asset[' + index + ']');
  for (const id of duplicates(assetIds)) {
    add('DUPLICATE_ASSET_ID', 'assetRefs', 'Asset reference ID bị lặp: ' + id, { id });
  }
  const missingAssetIds = [];
  for (const [index, ref] of assetRefs.entries()) {
    const id = refId(ref) || 'asset[' + index + ']';
    const path = text(ref?.path ?? ref?.source);
    if (!path || (hasAssetIndex && !availableAssetPaths.has(path))) {
      missingAssetIds.push(id);
      add(
        'MISSING_ASSET',
        'assetRefs[' + index + ']',
        'Asset reference không tồn tại trong asset tree: ' + (path || id),
        { id, assetPath: path || null }
      );
    }
  }

  const invalidPriceIds = [];
  const negativePriceIds = [];
  for (const price of collectPriceEntries(input.prices)) {
    const amount = Number(price.amount);
    if (!Number.isFinite(amount)) {
      invalidPriceIds.push(price.id);
      add('INVALID_PRICE', price.path, 'Giá không phải số hữu hạn: ' + price.id, { id: price.id, value: price.amount });
    } else if (amount < 0) {
      negativePriceIds.push(price.id);
      add('NEGATIVE_PRICE', price.path, 'Giá không được âm: ' + price.id, { id: price.id, value: amount });
    }
  }

  const legacyIds = unique([...nonPlayableHeroIds, ...legacyRewardHeroIds]);
  const issueCountByCode = Object.fromEntries(
    [...new Set(issues.map((entry) => entry.code))].map((code) => [
      code,
      issues.filter((entry) => entry.code === code).length
    ])
  );
  const summary = {
    playableHeroIds: playableIds,
    playableHeroCount: playableIds.length,
    nonPlayableHeroIds,
    nonPlayableHeroCount: nonPlayableHeroIds.length,
    npcIds,
    npcCount: npcIds.length,
    enemyIds,
    enemyCount: enemyIds.length,
    legacyIds,
    legacyRewardHeroIds: unique(legacyRewardHeroIds),
    chapterCount: chapters.length,
    sceneCount: Object.keys(scenes).length,
    reachableSceneIds: [...reachableScenes],
    unreachableSceneIds,
    encounterCount: Object.keys(encounters).length,
    referencedEncounterIds: [...referencedEncounterIds],
    unreachableEncounterIds,
    rewardRefCount: rewardRefs.length,
    assetRefCount: assetRefs.length,
    missingAssetIds,
    invalidPriceIds,
    negativePriceIds,
    issueCount: issues.length,
    issueCountByCode
  };

  return {
    schema: CATALOG_VALIDATOR_SCHEMA,
    ok: issues.length === 0,
    errors: issues,
    issues,
    summary
  };
}
