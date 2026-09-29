// One cloud-save owner. Server versions are independent of the local save revision.
// Requests carry an immutable session so an account switch cannot redirect a write.
export function createCloudSession(deps) {
  let active = null;
  const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const same = credentials => active && active.user === credentials.user && active.token === credentials.token;
  function assertCurrent(session) {
    if (session !== active) throw Object.assign(new Error('Phiên đăng nhập đã thay đổi.'), { code: 'SESSION_CHANGED' });
  }
  async function connect(credentials, { force = false } = {}) {
    if (!credentials?.user || !credentials?.token) throw new Error('Chưa đăng nhập.');
    if (!force && same(credentials)) {
      if (active.ready) return active.version;
      if (active.loading) return active.loading;
    }
    const previous = active;
    const session = { user: credentials.user, token: credentials.token, ready: false, version: null, writes: Promise.resolve() };
    active = session;
    deps.setCredentials?.({ user: session.user, token: session.token });
    session.loading = (async () => {
      // A manual pull must observe any write that already reached the server.
      // Queued writes from the superseded session fail its identity check.
      if (previous) await previous.writes;
      assertCurrent(session);
      const record = await deps.request(session, 'GET', '/api/save');
      assertCurrent(session);
      if (!Number.isSafeInteger(record.version) || record.version < 0) throw new Error('Server chưa hỗ trợ đồng bộ an toàn.');
      const local = deps.getPlayer();
      const owner = deps.getLocalOwner?.() || '';
      const acknowledged = deps.getAcknowledged?.(session.user);
      // Keep offline work only if both sides share the last acknowledged version.
      const keepOffline = !force && owner === session.user && acknowledged?.version === record.version
        && Number(local?.revision || 0) > Number(acknowledged.localRevision || 0);
      if (record.save && !keepOffline) {
        deps.backup?.(copy(local), owner);
        deps.replacePlayer(copy(record.save));
      } else if (!record.save && owner && owner !== session.user) {
        deps.backup?.(copy(local), owner);
        deps.replacePlayer(deps.newPlayer());
      }
      assertCurrent(session);
      session.version = record.version;
      deps.setLocalOwner?.(session.user);
      if (!keepOffline) deps.acknowledge?.(session.user, { version: record.version, localRevision: Number(deps.getPlayer()?.revision || 0) });
      session.ready = true;
      return session.version;
    })();
    try { return await session.loading; }
    finally { session.loading = null; }
  }
  function upload() {
    const session = active;
    if (!session?.ready) return Promise.resolve(false);
    const snapshot = copy(deps.getPlayer());
    const next = session.writes.then(async () => {
      assertCurrent(session);
      if (!session.ready) return false;
      try {
        const result = await deps.request(session, 'PUT', '/api/save', { save: snapshot, expectedVersion: session.version });
        assertCurrent(session);
        if (!Number.isSafeInteger(result.version) || result.version !== session.version + 1) throw new Error('Không xác nhận được bản lưu trên mây.');
        session.version = result.version;
        deps.acknowledge?.(session.user, { version: session.version, localRevision: Number(snapshot?.revision || 0) });
        return true;
      } catch (error) {
        // The response may have been lost after commit. Never retry against a
        // newly fetched version automatically, which would overwrite another device.
        session.ready = false;
        throw error;
      }
    });
    session.writes = next.catch(() => {});
    return next;
  }
  return {
    connect, upload,
    disconnect() { active = null; },
    readyFor(credentials) { return Boolean(same(credentials) && active.ready); },
    inspect() { return active ? { user: active.user, version: active.version, ready: active.ready } : { ready: false }; }
  };
}
