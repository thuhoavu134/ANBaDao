// Undo a clip-wide contain resize into a common source-camera coordinate system.
// Offsets are fractions of a cell, so delivery/downsample variants need no changes.
// One transform per clip: animation movement and every original RGBA pixel survive.
export function registrationFromCrop(crop, reference, cellW, cellH, padding = 16) {
  const placement = box => {
    if (!Array.isArray(box) || box.length !== 4 || !box.every(Number.isFinite)) throw new Error('Invalid source crop');
    const w = box[2] - box[0], h = box[3] - box[1];
    if (!(w > 0 && h > 0 && cellW > 2 * padding && cellH > 2 * padding)) throw new Error('Invalid crop dimensions');
    const scale = Math.min((cellW - 2 * padding) / w, (cellH - 2 * padding) / h);
    return { scale, x: (cellW - w * scale) / 2, y: cellH - padding - h * scale };
  };
  const packed = placement(crop), target = placement(reference);
  const scale = target.scale / packed.scale;
  return Object.freeze({
    scale,
    offsetX: (target.x + (crop[0] - reference[0]) * target.scale - packed.x * scale) / cellW,
    offsetY: (target.y + (crop[1] - reference[1]) * target.scale - packed.y * scale) / cellH
  });
}
