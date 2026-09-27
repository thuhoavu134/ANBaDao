export function authoredVisualCueTimes(evidence, spec) {
  const draw = evidence?.draws?.[spec?.src];
  if (!draw) return [];
  if (Number.isFinite(Number(spec?.frameIndex))) {
    return (draw.frameSequence || [])
      .filter(entry => Number(entry.frameIndex) === Number(spec.frameIndex))
      .map(entry => Number(entry.firstMs))
      .filter(Number.isFinite);
  }
  return Number.isFinite(Number(draw.firstMs)) ? [Number(draw.firstMs)] : [];
}

export function authoredVisualOccurrence(actionId) {
  const match = String(actionId || '').match(/:chain(\d+)$/);
  return match ? Math.max(0, Number(match[1]) - 1) : 0;
}

export function pairAuthoredAudioToVisual(scoped, visualTimes, limitMs = 50, visualSpec = null) {
  const cues = (scoped || []).map(item => {
    const occurrence = authoredVisualOccurrence(item?.actionId);
    const visualMs = Number.isFinite(Number(visualTimes?.[occurrence]))
      ? Number(visualTimes[occurrence])
      : null;
    const expectedCuePerformanceMs = Number.isFinite(Number(item?.expectedCuePerformanceMs))
      ? Number(item.expectedCuePerformanceMs)
      : null;
    const visualSignedOffsetMs = visualMs === null || expectedCuePerformanceMs === null
      ? null
      : expectedCuePerformanceMs - visualMs;
    return {
      actionId: item?.actionId || null,
      event: item?.event || null,
      cue: item?.cue || null,
      source: visualSpec?.src || null,
      frameIndex: Number.isFinite(Number(visualSpec?.frameIndex)) ? Number(visualSpec.frameIndex) : null,
      occurrence,
      visualMs,
      expectedCuePerformanceMs,
      visualSignedOffsetMs
    };
  });
  const bad = cues.filter(item =>
    !Number.isFinite(Number(item.visualMs)) ||
    !Number.isFinite(Number(item.visualSignedOffsetMs)) ||
    Math.abs(Number(item.visualSignedOffsetMs)) > Number(limitMs)
  );
  return { cues, bad };
}
