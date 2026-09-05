// Measured on the shipped first frames at alpha >= 128. These are fixed per
// animation, not per-frame bounding boxes; authored breathing stays intact.
export const LUC_ANH_IDLE_REFERENCE = Object.freeze({ cell: 480, bodyHeight: 398, footY: 427, displaySize: 330, baseline: 48 });
export const LUC_ANH_BASIC_REFERENCE = Object.freeze({ cell: 240, bodyHeight: 148, footY: 190 });

export function alignedLucAnhPose(pose, idle = LUC_ANH_IDLE_REFERENCE) {
  const bodyHeight = idle.displaySize * idle.bodyHeight / idle.cell;
  const footWorldY = idle.baseline - idle.displaySize * (1 - idle.footY / idle.cell);
  const displaySize = bodyHeight * pose.cell / pose.bodyHeight;
  return Object.freeze({ displaySize, scale: displaySize / idle.displaySize,
    baseline: footWorldY + displaySize * (1 - pose.footY / pose.cell), bodyHeight, footWorldY });
}

export const LUC_ANH_BASIC_GEOMETRY = alignedLucAnhPose(LUC_ANH_BASIC_REFERENCE);
