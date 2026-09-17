// Metadata-driven Canvas 2D sprite blit. Destination size is supplied by the
// caller so battle can keep the existing 477×440 footprint while sampling a
// native cell. Never guess layout from naturalWidth.

export function sourceRectForFrame(clip, frame) {
  const cellW = Number(clip.cellW ?? clip.w);
  const cellH = Number(clip.cellH ?? clip.h);
  const cols = Number(clip.cols);
  const frames = Math.max(1, Number(clip.frames) || 1);
  const index = Math.max(0, Math.min(frames - 1, frame | 0));
  return {
    sx: (index % cols) * cellW,
    sy: Math.floor(index / cols) * cellH,
    sw: cellW,
    sh: cellH
  };
}

export function drawCanvasSprite(ctx, opts = {}) {
  const { image, clip, frame = 0, x = 0, y = 0, width, height, flip = false } = opts;
  if (!ctx || !image || !clip) return false;
  const cellW = Number(clip.cellW ?? clip.w);
  const cellH = Number(clip.cellH ?? clip.h);
  const cols = Number(clip.cols);
  if (!(cellW > 0) || !(cellH > 0) || !(cols > 0)) return false;
  const destW = Number(width);
  const destH = Number(height);
  if (!(destW > 0) || !(destH > 0)) return false;
  const { sx, sy, sw, sh } = sourceRectForFrame(clip, frame);
  const atlasScale = Number(image.__hvAtlasScale) > 0 ? Number(image.__hvAtlasScale) : 1;
  const baseline = opts.baseline ?? clip.pivot?.y ?? cellH;
  const alpha = opts.alpha ?? 1;
  const blendMode = opts.blendMode || clip.blendMode || 'source-over';
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = blendMode;
  ctx.drawImage(
    image,
    sx * atlasScale, sy * atlasScale, sw * atlasScale, sh * atlasScale,
    -destW / 2, -destH + baseline,
    destW, destH
  );
  ctx.restore();
  return true;
}
