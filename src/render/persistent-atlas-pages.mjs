// A resident current page and one next page per looping clip. Action leases
// cannot evict these pages. A late decode holds the last painted frame.
export function createPersistentAtlasPages({ packs, cache, now = () => performance.now() }) {
  const states = new Map();
  function release(id) {
    const state = states.get(id);
    if (!state) return;
    for (const src of state.pins) cache.unpin(src, state.owner);
    cache.clearScope(state.scope);
    states.delete(id);
  }
  function frame(id, requested) {
    const pack = packs[id];
    if (!pack) return null;
    let state = states.get(id);
    if (!state) {
      state = { owner: Symbol(id), scope: 'persistent:' + id, pins: new Set(), held: null, retries: new Map() };
      states.set(id, state);
    }
    const index = ((Math.floor(requested) % pack.frames) + pack.frames) % pack.frames;
    const pageIndex = Math.floor(index / pack.pageFrames), page = pack.pages[pageIndex];
    const keep = new Set([page.src, state.held?.page.src]);
    for (const src of state.pins) if (!keep.has(src)) { cache.unpin(src, state.owner); state.pins.delete(src); }
    const reserve = (p, priority) => {
      state.pins.add(p.src);
      let handle = cache.reserve(p, { pin: state.owner, scope: state.scope, priority });
      if (handle.state === 'failed' && now() >= (state.retries.get(p.src) || 0)) {
        state.retries.set(p.src, now() + 3000);
        cache.allowRetry(p.src);
        handle = cache.reserve(p, { pin: state.owner, scope: state.scope, priority });
      }
      return handle;
    };
    const handle = reserve(page, 'visible');
    if (handle.state === 'ready') {
      if (state.held && state.held.page.src !== page.src) {
        cache.unpin(state.held.page.src, state.owner); state.pins.delete(state.held.page.src);
      }
      state.held = { page, image: handle.image, index: index % pack.pageFrames };
      reserve(pack.pages[(pageIndex + 1) % pack.pages.length], 'prefetch');
    }
    if (!state.held) return null;
    const held = state.held;
    return { image: held.image, sx: held.index % held.page.cols * pack.cellW,
      sy: Math.floor(held.index / held.page.cols) * pack.cellH, sw: pack.cellW, sh: pack.cellH };
  }
  function draw(context, id, requested, x, y, width, height, options = {}) {
    const source = frame(id, requested);
    if (!source) return false;
    const round = options.round ? Math.round : value => value;
    context.save();context.translate(round(x),round(y));
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    if(options.flip)context.scale(-1,1);
    context.globalAlpha=options.alpha??1;
    if(options.screen)context.globalCompositeOperation='screen';
    context.drawImage(source.image,source.sx,source.sy,source.sw,source.sh,
      round(-width*.5),round(-height+(options.baseline??42)),round(width),round(height));
    context.restore();return true;
  }
  function clear() { for (const id of [...states.keys()]) release(id); cache.clear(); }
  return { frame, draw, release, clear, inspect: () => cache.inspect() };
}
