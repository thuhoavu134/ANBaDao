// One monotonic elapsed clock per action/VFX timeline. Replay of the same
// elapsedMs must yield the same frame. Never mix Date.now with performance.now.

export function frameDurationMs(clip) {
  if (Number(clip?.ms) > 0) return Number(clip.ms);
  if (Number(clip?.fps) > 0) return 1000 / Number(clip.fps);
  const frames = Number(clip?.frames);
  if (Number(clip?.durationMs) > 0 && frames > 0) return Number(clip.durationMs) / frames;
  return 42;
}

export function frameAt(clip, elapsedMs) {
  const frames = Math.max(1, Number(clip?.frames) || 1);
  const step = frameDurationMs(clip);
  const raw = Math.max(0, Math.floor(Number(elapsedMs) / step));
  return clip?.loop ? raw % frames : Math.min(frames - 1, raw);
}

export function createFrameClock(options = {}) {
  const now = options.now || (() => (typeof performance !== 'undefined' ? performance.now() : 0));
  return {
    now,
    frameAt,
    elapsedSince(startMs) { return Math.max(0, now() - startMs); }
  };
}
