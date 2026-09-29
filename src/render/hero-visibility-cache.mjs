// One independent body frame per atlas-managed hero, shared by both teams.
// Large animation sheets may be evicted; this bounded 5 MiB cache keeps a
// previously visible character on screen until its actual animation is ready.
// It never supplies assets to an action/VFX readiness gate.
export function createHeroVisibilityCache({ makeCanvas = () => document.createElement('canvas'), maxEntries = 4 } = {}) {
  const frames = new Map(), capturing = new Set();
  const width = 640, height = 512, originX = 320, originY = 440;
  const drop = frame => { frame.canvas.width = 0; frame.canvas.height = 0; };
  function finish(context, hero, unit, time, drawn, render, internallyMirrored = false) {
    if (!unit || unit.hp <= 0 || capturing.has(hero)) return !!drawn;
    let frame = frames.get(hero);
    const idle = !unit.state || unit.state === 'idle';
    if (drawn && (!frame || (idle && !frame.idle))) {
      let canvas;
      capturing.add(hero);
      try {
        canvas = makeCanvas(); canvas.width = width; canvas.height = height;
        const copy = canvas.getContext('2d');
        if (copy) {
          copy.translate(originX, originY);
          // S+ renderers own mirroring; native heroes inherit it from drawUnit.
          // Store the player's pose once, then mirror at the same owner as live art.
          if (render(copy, { ...unit, team: 'player' }, time)) {
            if (frame) drop(frame);
            frame = { canvas, idle }; frames.delete(hero); frames.set(hero, frame);
            canvas = null;
            while (frames.size > maxEntries) {
              const oldest = frames.keys().next().value;
              drop(frames.get(oldest)); frames.delete(oldest);
            }
          }
        }
      } catch (_) {
        // A backup allocation failure must not interrupt the live battle draw.
      } finally {
        if (canvas) { canvas.width = 0; canvas.height = 0; }
        capturing.delete(hero);
      }
    }
    if (drawn) return true;
    if (!frame || !frame.canvas.width) return false;
    context.save();
    try {
      if (internallyMirrored && unit.team === 'enemy') context.scale(-1, 1);
      context.drawImage(frame.canvas, -originX, -originY);
    } finally { context.restore(); }
    return true;
  }
  function clear() { for (const frame of frames.values()) drop(frame); frames.clear(); }
  return { finish, clear, inspect: () => ({ count: frames.size, bytes: frames.size * width * height * 4 }) };
}
