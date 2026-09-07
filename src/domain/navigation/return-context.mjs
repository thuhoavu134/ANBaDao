export const RETURN_CONTEXT_SCHEMA = 'hon-viet-return-context/v1';
export const RETURN_CONTEXT_SCHEMA_VERSION = 1;

const RETURN_SCREEN = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const RETURN_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const RETURN_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function error(code, message, extra = {}) {
  return { ok: false, code, message, ...extra };
}

function normalizeParams(params) {
  if (params === undefined || params === null) return {};
  if (!isRecord(params)) return null;
  try {
    return clone(params);
  } catch {
    return null;
  }
}

function normalizeRoute(route) {
  if (!isRecord(route)) return null;
  const screen = String(route.screen ?? '').trim();
  const params = normalizeParams(route.params);
  if (!RETURN_SCREEN.test(screen) || params === null) return null;
  return { screen, params };
}

function optionalToken(value, pattern = RETURN_TOKEN) {
  if (value === undefined || value === null || value === '') return null;
  const token = String(value).trim();
  return pattern.test(token) ? token : undefined;
}

function normalizeScroll(scroll) {
  if (scroll === undefined || scroll === null) return { x: 0, y: 0 };
  if (!isRecord(scroll)) return null;
  const x = Number(scroll.x ?? 0);
  const y = Number(scroll.y ?? 0);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) return null;
  return {
    x: Math.min(100_000_000, Math.round(x)),
    y: Math.min(100_000_000, Math.round(y))
  };
}

export function captureReturnContext(input = {}, { now = Date.now() } = {}) {
  if (!isRecord(input)) {
    return error('INVALID_RETURN_CONTEXT', 'Return context phải là object.');
  }

  const sourceRoute = normalizeRoute(input.sourceRoute ?? input.route);
  const mode = optionalToken(input.mode);
  const encounterId = optionalToken(input.encounterId, RETURN_ID);
  const heroId = optionalToken(input.heroId, RETURN_ID);
  const tab = optionalToken(input.tab);
  const filter = optionalToken(input.filter);
  const scroll = normalizeScroll(input.scroll);
  const draftRevision = Number(input.draftRevision ?? input.revision ?? 0);
  const capturedAt = Number(input.capturedAt ?? now);

  if (!sourceRoute || mode === undefined || encounterId === undefined || heroId === undefined ||
      tab === undefined || filter === undefined || !scroll ||
      !Number.isSafeInteger(draftRevision) || draftRevision < 0 ||
      !Number.isFinite(capturedAt) || capturedAt < 0) {
    return error('INVALID_RETURN_CONTEXT', 'Return context có route, token, scroll hoặc revision không hợp lệ.');
  }

  return {
    ok: true,
    context: {
      schema: RETURN_CONTEXT_SCHEMA,
      schemaVersion: RETURN_CONTEXT_SCHEMA_VERSION,
      sourceRoute,
      mode,
      encounterId,
      heroId,
      tab,
      filter,
      scroll,
      draftRevision,
      capturedAt
    }
  };
}

export function validateReturnContext(context) {
  if (!isRecord(context) || context.schema !== RETURN_CONTEXT_SCHEMA ||
      Number(context.schemaVersion) !== RETURN_CONTEXT_SCHEMA_VERSION) {
    return error('INVALID_RETURN_CONTEXT_SCHEMA', 'Return context không đúng phiên bản.');
  }
  const captured = captureReturnContext(context, { now: context.capturedAt });
  if (!captured.ok) return captured;
  return { ok: true, context: captured.context };
}

export function resolveReturnContext(context, {
  availableScreens,
  currentRevision,
  fallbackScreen = 'hub'
} = {}) {
  const validated = validateReturnContext(context);
  const fallback = RETURN_SCREEN.test(String(fallbackScreen)) ? String(fallbackScreen) : 'hub';
  if (!validated.ok) return { ...validated, target: fallback };

  const screens = availableScreens === undefined
    ? null
    : new Set([...availableScreens].map(value => String(value)));
  const target = validated.context.sourceRoute.screen;
  if (screens && !screens.has(target)) {
    return error('RETURN_SOURCE_UNAVAILABLE', 'Source route không còn hợp lệ, cần dùng fallback.', {
      target: fallback,
      sourceRoute: validated.context.sourceRoute
    });
  }

  if (currentRevision !== undefined && currentRevision !== null) {
    const revision = Number(currentRevision);
    if (!Number.isSafeInteger(revision) || revision < 0) {
      return error('INVALID_RETURN_REVISION', 'Revision hiện tại không hợp lệ.', { target: fallback });
    }
    if (validated.context.draftRevision > revision) {
      return error('RETURN_REVISION_AHEAD', 'Return context thuộc draft revision mới hơn save hiện tại.', {
        target: fallback,
        sourceRoute: validated.context.sourceRoute
      });
    }
  }

  return {
    ok: true,
    target,
    sourceRoute: validated.context.sourceRoute,
    context: validated.context
  };
}

export function clearReturnContext() {
  return null;
}
