// Host-only image lifetime. Keep native Image objects and authored source pixels.
// The actual battle has its own cache; never keep the retired host battle warm.
export function createHostBattleAtlasOwner(makeImage = () => new Image()) {
  const images = new Map();
  let suspended = false;
  function image(src) {
    if (!src || suspended) return null;
    if (images.has(src)) return images.get(src);
    const value = makeImage();
    value.decoding = 'async';
    images.set(src, value);
    value.src = src;
    return value;
  }
  function collection(sources) {
    return Object.defineProperties({}, Object.fromEntries(Object.entries(sources).map(([key, src]) =>
      [key, { enumerable: true, get: () => image(src) }])));
  }
  function clear() {
    for (const value of images.values()) {
      value.onload = null; value.onerror = null;
      value.removeAttribute('src');
    }
    images.clear();
  }
  return {
    image, collection, clear,
    suspend() { suspended = true; clear(); },
    resume() { suspended = false; },
    get suspended() { return suspended; },
    inspect() { return { suspended, entries: images.size,
      decodedBytes: [...images.values()].reduce((n, im) => n + (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4, 0) }; }
  };
}

export function patchHostBattleResources(input) {
  const marker = '/* HV_HOST_BATTLE_ATLASES_V1 */';
  if (input.includes(marker)) return input;
  let html = input;
  function replace(from, to, label) {
    if (html.split(from).length !== 2) throw new Error('Host battle resources missing/ambiguous ' + label);
    html = html.replace(from, () => to);
  }
  replace("const imgLacViet = new Image(); imgLacViet.src = 'assets/heroes-concept/lac_viet_atlas.webp';\nconst imgHacTrieu = new Image(); imgHacTrieu.src = 'assets/heroes-concept/hac_trieu_atlas.webp';",
    `${marker}\nconst __hvHostAtlases=(${createHostBattleAtlasOwner.toString()})();
window.__HV_HOST_ATLASES=__hvHostAtlases;
const HOST_IDENTITY_ATLASES=__hvHostAtlases.collection({ally:'assets/heroes-concept/lac_viet_atlas.webp',foe:'assets/heroes-concept/hac_trieu_atlas.webp'});`, 'identity atlases');
  replace("const POSE_ATLASES=Object.fromEntries(Object.entries(POSE_ATLAS_PATHS).map(([key,src])=>{ const image=new Image(); image.decoding='async'; image.src=src; return [key,image]; }));",
    'const POSE_ATLASES=__hvHostAtlases.collection(POSE_ATLAS_PATHS);', 'pose atlases');
  replace("const LUC_ANH_IMAGES=Object.fromEntries(Object.entries(LUC_ANH_ANIMS).map(([k,a])=>{const im=new Image();im.decoding='async';im.src=a.src;return [k,im];}));",
    'const LUC_ANH_IMAGES=__hvHostAtlases.collection(Object.fromEntries(Object.entries(LUC_ANH_ANIMS).map(([key,clip])=>[key,clip.src])));', 'Luc Anh atlases');
  replace("const identityAtlas = c.side === 'ally' ? imgLacViet : imgHacTrieu;",
    "const identityAtlas = HOST_IDENTITY_ATLASES[c.side === 'ally' ? 'ally' : 'foe'];", 'identity renderer');
  replace('  if (!img.complete || img.naturalWidth < 1) return false;',
    '  if (!img?.complete || img.naturalWidth < 1) return false;', 'suspended identity renderer');
  replace('function renderLoop(now){ const dt=Math.min(now-last,40); last=now;',
    `function renderLoop(now){ const dt=Math.min(now-last,40); last=now;
  if(window.__HV_HOST_ATLASES?.suspended){requestAnimationFrame(renderLoop);return;}`, 'hidden legacy render loop');
  replace('    window.__HV_LINH_DONG_CACHE?.clear();',
    `    window.__HV_HOST_ATLASES.suspend();
    if(typeof _lucDetailRaf!=='undefined'){cancelAnimationFrame(_lucDetailRaf);_lucDetailRaf=0;}
    window.__HV_LINH_DONG_CACHE?.clear();`, 'suspend before iframe');
  replace('    window.__HV_BATTLE_HOST_MEMORY_RESTORE?.();\n', '', 'remove premature restore');
  replace('    frame.src = "about:blank";',
    `    frame.src = "about:blank";
    window.__HV_HOST_ATLASES.resume();
    window.__HV_BATTLE_HOST_MEMORY_RESTORE?.();`, 'resume after child teardown');
  return html;
}
