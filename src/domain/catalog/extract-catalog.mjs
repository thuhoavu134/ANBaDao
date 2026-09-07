import vm from 'node:vm';

export const CATALOG_SOURCE_SCHEMA = 'hon-viet-catalog-source/v1';

function escapeRegExp(value) {
  const special = '^$.*+?()[]{}|\\';
  return String(value).split('').map((character) => (
    special.includes(character) ? '\\' + character : character
  )).join('');
}

function readBindingExpression(source, name) {
  const declaration = new RegExp('(?:const|let|var)\\s+' + escapeRegExp(name) + '\\s*=');
  const match = declaration.exec(source);
  if (!match) throw new Error('Catalog binding not found: ' + name);

  const start = match.index + match[0].length;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let parens = 0;
  let brackets = 0;
  let braces = 0;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === String.fromCharCode(96)) {
      quote = character;
      continue;
    }
    if (character === '(') parens += 1;
    else if (character === ')') parens -= 1;
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets -= 1;
    else if (character === '{') braces += 1;
    else if (character === '}') braces -= 1;
    else if (character === ';' && parens === 0 && brackets === 0 && braces === 0) {
      return source.slice(start, index).trim();
    }
  }
  throw new Error('Catalog binding has no terminator: ' + name);
}

function evaluateBinding(source, name, context = {}) {
  const expression = readBindingExpression(source, name);
  const sandbox = Object.assign(Object.create(null), context);
  return vm.runInNewContext('(' + expression + ')', sandbox, {
    timeout: 250,
    displayErrors: true
  });
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return String(value ?? '').trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Read the one active runtime catalog boundary from index.html.
 *
 * Only literal/config bindings are evaluated in an isolated VM context. No
 * DOM, storage, network, runtime functions, or Cocos bundle is executed.
 */
export function extractCatalogFromRuntimeSource(source, {
  availableAssetPaths = [],
  runtimePath = 'index.html'
} = {}) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new TypeError('Runtime source must be a non-empty string.');
  }

  const data = asRecord(evaluateBinding(source, 'DATA'));
  const playableIds = evaluateBinding(source, 'OFFICIAL_ROSTER_12_IDS');
  const characterManifest = asRecord(evaluateBinding(source, 'CHARACTER_MANIFEST'));
  const roleArtSheets = asRecord(evaluateBinding(source, 'ROLE_ART_SHEETS'));
  const roleArtCrops = asRecord(evaluateBinding(source, 'ROLE_ART_CROPS', {
    ROLE_ART_SHEETS: roleArtSheets
  }));
  const roleArtAlias = asRecord(evaluateBinding(source, 'ROLE_ART_ALIAS'));
  const heroes = asRecord(data.heroes);
  const assetRefs = [];

  for (const [heroId, manifest] of Object.entries(characterManifest)) {
    for (const [kind, assetPath] of Object.entries(asRecord(manifest?.assets))) {
      const path = text(assetPath);
      if (path) {
        assetRefs.push({
          id: 'hero:' + heroId + ':' + kind,
          heroId,
          kind,
          path,
          required: playableIds.includes(heroId)
        });
      }
    }
  }

  for (const heroId of playableIds) {
    const hero = asRecord(heroes[heroId]);
    const rawArchetype = text(hero.archetype);
    const resolvedArchetype = roleArtCrops[rawArchetype]
      ? rawArchetype
      : text(roleArtAlias[rawArchetype]) || 'striker';
    const fallbackPath = text(roleArtCrops[resolvedArchetype]?.[0]);
    if (fallbackPath) {
      assetRefs.push({
        id: 'hero:' + heroId + ':role-fallback',
        heroId,
        kind: 'role-fallback',
        path: fallbackPath,
        required: true
      });
    }
  }

  const sceneSpeakerIds = Object.values(asRecord(data.scenes))
    .map((scene) => text(scene?.sp))
    .filter(Boolean);

  return {
    schema: CATALOG_SOURCE_SCHEMA,
    playableIds: clone(Array.isArray(playableIds) ? playableIds : []),
    heroes: clone(heroes),
    chapters: clone(Array.isArray(data.chapters) ? data.chapters : []),
    scenes: clone(asRecord(data.scenes)),
    encounters: clone(asRecord(data.encounters)),
    sceneSpeakerIds: clone(sceneSpeakerIds),
    reservedEncounterIds: ['luyen_tap'],
    prices: [
      { id: 'daily.costCampaign', amount: data.daily?.costCampaign, unit: 'stamina' },
      { id: 'daily.costBoss', amount: data.daily?.costBoss, unit: 'stamina' },
      { id: 'daily.costTrain', amount: data.daily?.costTrain, unit: 'stamina' }
    ],
    assetRefs: clone(assetRefs),
    availableAssetPaths: clone([...availableAssetPaths]),
    source: {
      runtimePath,
      binding: 'DATA + OFFICIAL_ROSTER_12_IDS + CHARACTER_MANIFEST + ROLE_ART_CROPS',
      assetPolicy: 'character manifest, then authored role fallback for playable heroes'
    }
  };
}
