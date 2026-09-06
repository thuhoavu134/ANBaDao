export const OPENING_LOOP_CONTRACT_SCHEMA = 'hon-viet-opening-loop/v1';
export const OPENING_LOOP_SCHEMA_VERSION = 1;
export const OPENING_EVENT_LIMIT = 200;

export const OPENING_STEP_STATUSES = Object.freeze({
  LOCKED: 'locked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLAIMED: 'claimed'
});

export const OPENING_LOOP_STATUSES = Object.freeze({
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  TERMINAL: 'terminal',
  SKIPPED: 'skipped'
});

export const OPENING_COUNT_MODES = Object.freeze({
  HISTORY: 'history',
  SINCE_ACCEPTANCE: 'since_acceptance'
});

const HV_OPENING_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const HV_OPENING_SOURCE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

function hvOpeningIsRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hvOpeningId(value, field) {
  const id = String(value ?? '').trim();
  return HV_OPENING_ID.test(id) ? id : null;
}

function hvOpeningError(code, message, extra = {}) {
  return { ok: false, code, message, ...extra };
}

function hvOpeningRoute(route) {
  if (!hvOpeningIsRecord(route)) return null;
  const screen = hvOpeningId(route.screen, 'screen');
  if (!screen) return null;
  const anchorId = route.anchorId === undefined || route.anchorId === null
    ? null
    : hvOpeningId(route.anchorId, 'anchorId');
  if (route.anchorId !== undefined && route.anchorId !== null && !anchorId) return null;
  const params = route.params === undefined ? {} : route.params;
  if (!hvOpeningIsRecord(params)) return null;
  return {
    screen,
    ...(anchorId ? { anchorId } : {}),
    params: { ...params }
  };
}

function hvOpeningCloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function hvOpeningStepMap(graph) {
  return new Map(graph.steps.map(step => [step.id, step]));
}

function hvOpeningReachable(graph) {
  const map = hvOpeningStepMap(graph);
  const seen = new Set();
  let cursor = graph.entryId;
  while (cursor !== null && cursor !== undefined) {
    if (seen.has(cursor)) break;
    seen.add(cursor);
    cursor = map.get(cursor)?.next ?? null;
  }
  return seen;
}

function hvOpeningAncestors(graph) {
  const map = hvOpeningStepMap(graph);
  const ancestors = new Map(graph.steps.map(step => [step.id, new Set()]));
  let cursor = graph.entryId;
  const seen = new Set();
  while (cursor !== null && !seen.has(cursor)) {
    seen.add(cursor);
    const next = map.get(cursor)?.next ?? null;
    if (next !== null) ancestors.get(next)?.add(cursor);
    cursor = next;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of graph.steps) {
      const before = ancestors.get(step.id).size;
      for (const parent of [...ancestors.get(step.id)]) {
        for (const ancestor of ancestors.get(parent) || []) ancestors.get(step.id).add(ancestor);
      }
      if (ancestors.get(step.id).size !== before) changed = true;
    }
  }
  return ancestors;
}

function hvOpeningNextCycle(graph) {
  const map = hvOpeningStepMap(graph);
  const visiting = new Set();
  const visited = new Set();
  const visit = stepId => {
    if (visiting.has(stepId)) return stepId;
    if (visited.has(stepId)) return null;
    visiting.add(stepId);
    const next = map.get(stepId)?.next;
    const cycle = next === null ? null : visit(next);
    visiting.delete(stepId);
    visited.add(stepId);
    return cycle;
  };
  return visit(graph.entryId);
}

function hvOpeningRouteMatches(expected, actual) {
  if (actual === undefined || actual === null) return true;
  if (!hvOpeningIsRecord(actual)) return false;
  if (actual.screen !== undefined && actual.screen !== expected.screen) return false;
  if (actual.anchorId !== undefined && actual.anchorId !== expected.anchorId) return false;
  if (actual.params !== undefined) {
    if (!hvOpeningIsRecord(actual.params)) return false;
    for (const [key, value] of Object.entries(actual.params)) {
      if (expected.params?.[key] !== value) return false;
    }
  }
  return true;
}

function hvOpeningRecordEvent(state, eventKey, event) {
  const events = { ...(state.events || {}) };
  events[eventKey] = event;
  const keys = Object.keys(events);
  if (keys.length > OPENING_EVENT_LIMIT) delete events[keys[0]];
  return events;
}

function hvOpeningValidateState(state, graph) {
  if (!hvOpeningIsRecord(state)) {
    return hvOpeningError('INVALID_OPENING_STATE', 'Opening loop state phải là object.');
  }
  if (state.schema !== OPENING_LOOP_CONTRACT_SCHEMA ||
      Number(state.schemaVersion) !== OPENING_LOOP_SCHEMA_VERSION) {
    return hvOpeningError('INVALID_OPENING_STATE_SCHEMA', 'Opening loop state không đúng phiên bản.');
  }
  if (state.entryId !== graph.entryId) {
    return hvOpeningError('OPENING_ENTRY_MISMATCH', 'Entry của opening loop không khớp graph.');
  }
  const statuses = new Set(Object.values(OPENING_STEP_STATUSES));
  for (const step of graph.steps) {
    const status = state.stepStatus?.[step.id];
    if (!statuses.has(status)) {
      return hvOpeningError('INVALID_STEP_STATUS', 'Trạng thái bước opening không hợp lệ.', {
        stepId: step.id
      });
    }
    const progress = Number(state.progress?.[step.id]);
    if (!Number.isInteger(progress) || progress < 0 || progress > step.target) {
      return hvOpeningError('INVALID_STEP_PROGRESS', 'Tiến độ bước opening không hợp lệ.', {
        stepId: step.id
      });
    }
  }
  return { ok: true };
}

export function validateOpeningStep(input = {}) {
  if (!hvOpeningIsRecord(input)) {
    return hvOpeningError('INVALID_OPENING_STEP', 'QuestDefinition phải là object.');
  }

  const errors = [];
  const id = hvOpeningId(input.id, 'id');
  const eventId = hvOpeningId(input.eventId, 'eventId');
  const target = Number(input.target);
  const route = hvOpeningRoute(input.route);
  const next = input.next === undefined || input.next === null
    ? null
    : hvOpeningId(input.next, 'next');
  const prerequisites = input.prerequisite ?? input.prerequisites ?? [];
  const rewardId = input.rewardId === undefined || input.rewardId === null
    ? null
    : hvOpeningId(input.rewardId, 'rewardId');
  const countMode = input.countMode ?? OPENING_COUNT_MODES.SINCE_ACCEPTANCE;
  const terminal = input.terminal === true;

  if (!id) errors.push('id');
  if (!eventId) errors.push('eventId');
  if (!Number.isInteger(target) || target < 1) errors.push('target');
  if (!route) errors.push('route');
  if (!Array.isArray(prerequisites)) {
    errors.push('prerequisite');
  } else {
    const seen = new Set();
    for (const prerequisite of prerequisites) {
      const normalized = hvOpeningId(prerequisite, 'prerequisite');
      if (!normalized || seen.has(normalized) || normalized === id) errors.push('prerequisite');
      seen.add(normalized);
    }
  }
  if (input.next !== undefined && input.next !== null && !next) errors.push('next');
  if (rewardId === null && input.rewardId !== undefined && input.rewardId !== null) errors.push('rewardId');
  if (!Object.values(OPENING_COUNT_MODES).includes(countMode)) errors.push('countMode');
  if (terminal && next !== null) errors.push('terminal-next');
  if (!terminal && next === null) errors.push('terminal-flag');
  if (errors.length) {
    return hvOpeningError('INVALID_OPENING_STEP', 'QuestDefinition opening không hợp lệ.', {
      fields: [...new Set(errors)],
      stepId: id || null
    });
  }

  return {
    ok: true,
    step: {
      id,
      eventId,
      target,
      prerequisite: [...new Set(prerequisites.map(value => String(value).trim()))],
      route,
      next,
      terminal,
      rewardId,
      countMode,
      label: typeof input.label === 'string' && input.label.trim() ? input.label.trim() : id,
      description: typeof input.description === 'string' ? input.description.trim() : ''
    }
  };
}

export function validateOpeningGraph(input = {}) {
  const rawSteps = Array.isArray(input) ? input : input?.steps;
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    return hvOpeningError('EMPTY_OPENING_GRAPH', 'Opening graph phải có ít nhất một bước.');
  }

  const entryId = hvOpeningId(
    Array.isArray(input) ? rawSteps[0]?.id : (input.entryId ?? rawSteps[0]?.id),
    'entryId'
  );
  if (!entryId) return hvOpeningError('INVALID_OPENING_ENTRY', 'Entry opening không hợp lệ.');

  const steps = [];
  const ids = new Set();
  for (const raw of rawSteps) {
    const result = validateOpeningStep(raw);
    if (!result.ok) return result;
    if (ids.has(result.step.id)) {
      return hvOpeningError('DUPLICATE_OPENING_STEP', 'Opening graph có bước trùng ID.', {
        stepId: result.step.id
      });
    }
    ids.add(result.step.id);
    steps.push(result.step);
  }

  const graph = { entryId, steps };
  const map = hvOpeningStepMap(graph);
  if (!map.has(entryId)) {
    return hvOpeningError('MISSING_OPENING_ENTRY', 'Entry không tồn tại trong opening graph.', { entryId });
  }

  for (const step of steps) {
    if (step.next !== null && !map.has(step.next)) {
      return hvOpeningError('MISSING_OPENING_NEXT', 'Bước kế tiếp không tồn tại.', {
        stepId: step.id,
        next: step.next
      });
    }
    for (const prerequisite of step.prerequisite) {
      if (!map.has(prerequisite)) {
        return hvOpeningError('MISSING_OPENING_PREREQUISITE', 'Prerequisite không tồn tại.', {
          stepId: step.id,
          prerequisite
        });
      }
    }
  }

  const cycleAt = hvOpeningNextCycle(graph);
  if (cycleAt) {
    return hvOpeningError('OPENING_NEXT_CYCLE', 'Opening graph có vòng lặp ở next.', {
      stepId: cycleAt
    });
  }

  const reachable = hvOpeningReachable(graph);
  if (reachable.size !== steps.length) {
    const unreachable = steps.filter(step => !reachable.has(step.id)).map(step => step.id);
    return hvOpeningError('UNREACHABLE_OPENING_STEP', 'Opening graph có bước không đi tới được từ entry.', {
      unreachable
    });
  }

  const ancestors = hvOpeningAncestors(graph);
  const entry = map.get(entryId);
  if (entry.prerequisite.length) {
    return hvOpeningError('ENTRY_HAS_PREREQUISITE', 'Entry opening không được phụ thuộc bước trước.', {
      entryId
    });
  }
  for (const step of steps) {
    for (const prerequisite of step.prerequisite) {
      if (!ancestors.get(step.id)?.has(prerequisite)) {
        return hvOpeningError('OPENING_PREREQUISITE_DEADLOCK', 'Prerequisite không nằm trên đường mở khóa trước đó.', {
          stepId: step.id,
          prerequisite
        });
      }
    }
  }

  const terminalIds = steps.filter(step => step.terminal).map(step => step.id);
  if (!terminalIds.length) {
    return hvOpeningError('MISSING_OPENING_TERMINAL', 'Opening graph phải có bước kết thúc.');
  }

  return { ok: true, entryId, steps, terminalIds };
}

export function buildOpeningEventKey({ eventId, periodKey = 'permanent', sourceId = '-' } = {}) {
  const normalizedEventId = hvOpeningId(eventId, 'eventId');
  const normalizedPeriodKey = hvOpeningId(periodKey, 'periodKey');
  const normalizedSourceId = sourceId === undefined || sourceId === null || sourceId === ''
    ? '-'
    : String(sourceId).trim();
  if (!normalizedEventId || !normalizedPeriodKey ||
      (normalizedSourceId !== '-' && !HV_OPENING_SOURCE.test(normalizedSourceId))) return null;
  return [normalizedEventId, normalizedPeriodKey, normalizedSourceId].join('|');
}

export function createOpeningLoopState(definition, { now = Date.now() } = {}) {
  const graph = validateOpeningGraph(definition);
  if (!graph.ok) return graph;
  const progress = {};
  const stepStatus = {};
  for (const step of graph.steps) {
    progress[step.id] = 0;
    stepStatus[step.id] = step.id === graph.entryId
      ? OPENING_STEP_STATUSES.IN_PROGRESS
      : OPENING_STEP_STATUSES.LOCKED;
  }
  return {
    ok: true,
    graph,
    state: {
      schema: OPENING_LOOP_CONTRACT_SCHEMA,
      schemaVersion: OPENING_LOOP_SCHEMA_VERSION,
      entryId: graph.entryId,
      currentStepId: graph.entryId,
      status: OPENING_LOOP_STATUSES.IN_PROGRESS,
      progress,
      stepStatus,
      events: {},
      claims: {},
      lastEventKey: null,
      updatedAt: now
    }
  };
}

export function advanceOpeningLoop(state, definition, event = {}) {
  const graph = validateOpeningGraph(definition);
  if (!graph.ok) return graph;
  const stateValidation = hvOpeningValidateState(state, graph);
  if (!stateValidation.ok) return stateValidation;
  if (state.status === OPENING_LOOP_STATUSES.TERMINAL ||
      state.status === OPENING_LOOP_STATUSES.SKIPPED) {
    return hvOpeningError('OPENING_NOT_ACTIVE', 'Opening loop đã kết thúc hoặc được bỏ qua.');
  }

  const transactionStatus = event.transactionStatus ?? event.transaction?.status ?? 'success';
  if (transactionStatus !== 'success') {
    return hvOpeningError('TRANSACTION_NOT_COMMITTED', 'Chỉ ghi opening event sau giao dịch thành công.');
  }

  const eventKey = buildOpeningEventKey(event);
  if (!eventKey) {
    return hvOpeningError('INVALID_OPENING_EVENT', 'Opening event thiếu eventId/periodKey/sourceId hợp lệ.');
  }
  if (state.events?.[eventKey]) {
    return {
      ok: true,
      duplicate: true,
      eventKey,
      state,
      stepId: state.events[eventKey].stepId,
      completed: Boolean(state.events[eventKey].completed)
    };
  }

  const currentStepId = state.currentStepId;
  const step = graph.steps.find(candidate => candidate.id === currentStepId);
  if (!step) return hvOpeningError('INVALID_OPENING_CURSOR', 'Không tìm thấy bước hiện tại của opening loop.');
  if (state.stepStatus[step.id] === OPENING_STEP_STATUSES.COMPLETED) {
    return hvOpeningError('OPENING_REWARD_PENDING', 'Bước opening đã hoàn thành và đang chờ nhận thưởng.', {
      stepId: step.id
    });
  }
  if (step.eventId !== event.eventId) {
    return hvOpeningError('UNEXPECTED_OPENING_EVENT', 'Event không khớp bước opening hiện tại.', {
      expected: step.eventId,
      received: event.eventId,
      stepId: step.id
    });
  }
  if (!hvOpeningRouteMatches(step.route, event.route)) {
    return hvOpeningError('OPENING_ROUTE_MISMATCH', 'Event không khớp route của bước opening.', {
      stepId: step.id,
      expectedRoute: step.route
    });
  }
  for (const prerequisite of step.prerequisite) {
    const status = state.stepStatus[prerequisite];
    if (status !== OPENING_STEP_STATUSES.COMPLETED &&
        status !== OPENING_STEP_STATUSES.CLAIMED) {
      return hvOpeningError('OPENING_PREREQUISITE_LOCKED', 'Opening step chưa đủ prerequisite.', {
        stepId: step.id,
        prerequisite
      });
    }
  }

  const amount = Number(event.amount ?? 1);
  if (!Number.isInteger(amount) || amount < 1) {
    return hvOpeningError('INVALID_OPENING_AMOUNT', 'Số lượng event opening không hợp lệ.', {
      stepId: step.id
    });
  }
  const previousProgress = Number(state.progress[step.id]) || 0;
  const progress = Math.min(step.target, previousProgress + amount);
  const nextState = hvOpeningCloneState(state);
  nextState.progress[step.id] = progress;
  nextState.events = hvOpeningRecordEvent(nextState, eventKey, {
    eventId: String(event.eventId),
    periodKey: String(event.periodKey ?? 'permanent'),
    sourceId: String(event.sourceId ?? '-'),
    stepId: step.id,
    amount,
    completed: progress >= step.target,
    at: Number(event.now ?? Date.now())
  });
  nextState.lastEventKey = eventKey;
  nextState.updatedAt = Number(event.now ?? Date.now());

  if (progress < step.target) {
    nextState.stepStatus[step.id] = OPENING_STEP_STATUSES.IN_PROGRESS;
    return {
      ok: true,
      duplicate: false,
      completed: false,
      advancedTo: step.id,
      eventKey,
      stepId: step.id,
      state: nextState
    };
  }

  nextState.stepStatus[step.id] = OPENING_STEP_STATUSES.COMPLETED;
  if (step.rewardId) {
    nextState.status = OPENING_LOOP_STATUSES.COMPLETED;
    return {
      ok: true,
      duplicate: false,
      completed: true,
      advancedTo: step.id,
      eventKey,
      stepId: step.id,
      rewardId: step.rewardId,
      state: nextState
    };
  }

  if (step.next === null) {
    nextState.status = OPENING_LOOP_STATUSES.TERMINAL;
    nextState.currentStepId = null;
    return {
      ok: true,
      duplicate: false,
      completed: true,
      advancedTo: null,
      eventKey,
      stepId: step.id,
      state: nextState
    };
  }

  nextState.stepStatus[step.next] = OPENING_STEP_STATUSES.IN_PROGRESS;
  nextState.currentStepId = step.next;
  nextState.status = OPENING_LOOP_STATUSES.IN_PROGRESS;
  return {
    ok: true,
    duplicate: false,
    completed: true,
    advancedTo: step.next,
    eventKey,
    stepId: step.id,
    state: nextState
  };
}

export function claimOpeningStep(state, definition, {
  stepId,
  commandId,
  transactionStatus = 'success',
  now = Date.now()
} = {}) {
  const graph = validateOpeningGraph(definition);
  if (!graph.ok) return graph;
  const stateValidation = hvOpeningValidateState(state, graph);
  if (!stateValidation.ok) return stateValidation;
  if (transactionStatus !== 'success') {
    return hvOpeningError('TRANSACTION_NOT_COMMITTED', 'Chỉ claim opening sau giao dịch thành công.');
  }
  const normalizedStepId = hvOpeningId(stepId, 'stepId');
  const normalizedCommandId = commandId === undefined || commandId === null
    ? ''
    : String(commandId).trim();
  if (!normalizedStepId || !HV_OPENING_SOURCE.test(normalizedCommandId)) {
    return hvOpeningError('INVALID_OPENING_CLAIM', 'Claim opening thiếu stepId/commandId hợp lệ.');
  }
  const step = graph.steps.find(candidate => candidate.id === normalizedStepId);
  if (!step) return hvOpeningError('UNKNOWN_OPENING_STEP', 'Không tìm thấy bước opening.', { stepId: normalizedStepId });
  if (state.claims?.[normalizedStepId]) {
    return {
      ok: true,
      duplicate: true,
      stepId: normalizedStepId,
      rewardId: step.rewardId,
      state
    };
  }
  if (state.currentStepId !== normalizedStepId ||
      state.stepStatus[normalizedStepId] !== OPENING_STEP_STATUSES.COMPLETED) {
    return hvOpeningError('OPENING_NOT_CLAIMABLE', 'Bước opening chưa ở trạng thái có thể nhận.');
  }
  if (!step.rewardId) {
    return hvOpeningError('OPENING_REWARD_UNDEFINED', 'Bước opening không có reward ID.');
  }

  const nextState = hvOpeningCloneState(state);
  nextState.claims[normalizedStepId] = {
    commandId: normalizedCommandId,
    rewardId: step.rewardId,
    at: now
  };
  nextState.stepStatus[normalizedStepId] = OPENING_STEP_STATUSES.CLAIMED;
  nextState.updatedAt = now;

  if (step.next === null) {
    nextState.status = OPENING_LOOP_STATUSES.TERMINAL;
    nextState.currentStepId = null;
    return {
      ok: true,
      duplicate: false,
      completed: true,
      advancedTo: null,
      stepId: normalizedStepId,
      rewardId: step.rewardId,
      state: nextState
    };
  }

  nextState.stepStatus[step.next] = OPENING_STEP_STATUSES.IN_PROGRESS;
  nextState.currentStepId = step.next;
  nextState.status = OPENING_LOOP_STATUSES.IN_PROGRESS;
  return {
    ok: true,
    duplicate: false,
    completed: true,
    advancedTo: step.next,
    stepId: normalizedStepId,
    rewardId: step.rewardId,
    state: nextState
  };
}

export function validateOpeningResume(state, definition) {
  const graph = validateOpeningGraph(definition);
  if (!graph.ok) return graph;
  const stateValidation = hvOpeningValidateState(state, graph);
  if (!stateValidation.ok) return stateValidation;

  const map = hvOpeningStepMap(graph);
  if (state.status === OPENING_LOOP_STATUSES.TERMINAL) {
    if (state.currentStepId !== null) {
      return hvOpeningError('INVALID_TERMINAL_CURSOR', 'Opening terminal state vẫn còn cursor.');
    }
    return { ok: true, status: state.status, currentStepId: null, canResume: false };
  }
  if (state.status === OPENING_LOOP_STATUSES.SKIPPED) {
    return { ok: true, status: state.status, currentStepId: state.currentStepId ?? null, canResume: false };
  }

  const step = map.get(state.currentStepId);
  if (!step) return hvOpeningError('INVALID_OPENING_CURSOR', 'Cursor resume không trỏ tới bước hợp lệ.');
  if (state.stepStatus[step.id] === OPENING_STEP_STATUSES.LOCKED) {
    return hvOpeningError('LOCKED_OPENING_CURSOR', 'Cursor resume đang trỏ vào bước bị khóa.', {
      stepId: step.id
    });
  }
  for (const prerequisite of step.prerequisite) {
    const status = state.stepStatus[prerequisite];
    if (status !== OPENING_STEP_STATUSES.COMPLETED &&
        status !== OPENING_STEP_STATUSES.CLAIMED) {
      return hvOpeningError('OPENING_PREREQUISITE_LOCKED', 'Cursor resume chưa đủ prerequisite.', {
        stepId: step.id,
        prerequisite
      });
    }
  }
  return {
    ok: true,
    status: state.status,
    currentStepId: state.currentStepId,
    canResume: true,
    step
  };
}

export function getOpeningLoopView(state, definition) {
  const resume = validateOpeningResume(state, definition);
  if (!resume.ok) return resume;
  const graph = validateOpeningGraph(definition);
  const completed = graph.steps.filter(step => {
    const status = state.stepStatus[step.id];
    return status === OPENING_STEP_STATUSES.COMPLETED ||
      status === OPENING_STEP_STATUSES.CLAIMED;
  }).length;
  const current = resume.currentStepId
    ? graph.steps.find(step => step.id === resume.currentStepId)
    : null;
  return {
    ok: true,
    status: resume.status,
    currentStepId: resume.currentStepId,
    current: current || null,
    currentProgress: current ? Number(state.progress[current.id]) || 0 : 0,
    totalSteps: graph.steps.length,
    completedSteps: completed,
    canResume: resume.canResume,
    route: current?.route || null
  };
}

export function skipOpeningLoop(state, definition, {
  reason = 'user',
  now = Date.now()
} = {}) {
  const graph = validateOpeningGraph(definition);
  if (!graph.ok) return graph;
  const stateValidation = hvOpeningValidateState(state, graph);
  if (!stateValidation.ok) return stateValidation;
  const normalizedReason = String(reason || '').trim();
  if (!normalizedReason) return hvOpeningError('INVALID_SKIP_REASON', 'Lý do bỏ qua opening không được trống.');
  if (state.status === OPENING_LOOP_STATUSES.TERMINAL ||
      state.status === OPENING_LOOP_STATUSES.SKIPPED) {
    return { ok: true, duplicate: true, state };
  }
  const nextState = hvOpeningCloneState(state);
  nextState.status = OPENING_LOOP_STATUSES.SKIPPED;
  nextState.skip = { reason: normalizedReason, at: now };
  nextState.updatedAt = now;
  return { ok: true, duplicate: false, state: nextState };
}
