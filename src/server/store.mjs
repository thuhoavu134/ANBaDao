import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createMemoryStore() {
  const users = [];
  const saves = new Map();
  const saveVersions = new Map();
  const profiles = new Map();
  const chat = [];
  const oauthState = new Map();
  const oauthCodes = new Map();
  // Owner 2026-11-04: Bang hoi / Gia toc tren server (kenh Bang + Gia toc that)
  const guilds = new Map();   // id -> { id, name, kind: 'guild'|'clan', owner, createdAt }
  const members = new Map();  // userId -> { guild, clan, updatedAt }

  return {
    kind: 'memory',
    async findUserByName(name) {
      const key = String(name || '').toLowerCase();
      return clone(users.find(u => u.user.toLowerCase() === key) || null);
    },
    async findUserById(id) {
      return clone(users.find(u => u.id === id) || null);
    },
    async findUserByEmail(email) {
      const key = String(email || '').toLowerCase();
      if (!key) return null;
      return clone(users.find(u => (u.email || '').toLowerCase() === key) || null);
    },
    async listUsers() {
      return clone(users);
    },
    async createUser(row) {
      users.push({ ...row });
      return clone(row);
    },
    async getSave(userId) {
      return saves.has(userId) ? clone(saves.get(userId)) : null;
    },
    async putSave(userId, save, version = (saveVersions.get(userId) || 0) + 1) {
      saves.set(userId, clone(save));
      saveVersions.set(userId, version);
    },
    async getSaveRecord(userId) {
      return { save: saves.has(userId) ? clone(saves.get(userId)) : null, version: saveVersions.get(userId) || 0 };
    },
    async putSaveIfVersion(userId, save, expectedVersion) {
      const current = saveVersions.get(userId) || 0;
      if (current !== expectedVersion) return null;
      saves.set(userId, clone(save));
      saveVersions.set(userId, current + 1);
      return current + 1;
    },
    async getProfile(userId) {
      return profiles.has(userId) ? clone(profiles.get(userId)) : null;
    },
    async putProfile(userId, profile) {
      profiles.set(userId, clone(profile));
    },
    async patchProfileStats(userId, fields) {
      const current = profiles.get(userId);
      if (!current) throw new Error('Profile must exist before updating stats');
      profiles.set(userId, { ...current, ...clone(fields) });
    },
    async nextRank() {
      let rank = 999;
      for (const profile of profiles.values()) rank = Math.max(rank, Number(profile.rank) || 0);
      return rank + 1;
    },
    async listRivals(userId, limit = 8) {
      return [...profiles.entries()].filter(([id]) => id !== userId).slice(0, limit).map(([id, p]) => ({ userId: id, ...clone(p) }));
    },
    async listLeaderboard(by, limit = 20) {
      const field = by === 'arena' ? 'rank' : by === 'tower' ? 'towerBest' : 'power';
      const direction = by === 'arena' ? 1 : -1;
      return [...profiles.entries()].map(([id, p]) => ({ userId: id, ...clone(p) }))
        .sort((a, b) => direction * ((a[field] || 0) - (b[field] || 0)) || a.user.localeCompare(b.user)).slice(0, limit);
    },
    async getProfilesByNames(names) {
      const wanted = new Set(names);
      return [...profiles.entries()].filter(([, p]) => wanted.has(p.user)).map(([id, p]) => ({ userId: id, ...clone(p) }));
    },
    async listFriendSuggestions(userId, excluded, limit = 12) {
      return [...profiles.entries()].filter(([id, p]) => id !== userId && !excluded.includes(p.user))
        .map(([id, p]) => ({ userId: id, ...clone(p) })).sort((a, b) => (b.power || 0) - (a.power || 0)).slice(0, limit);
    },
    async listProfiles() {
      return [...profiles.entries()].map(([userId, profile]) => ({ userId, ...clone(profile) }));
    },
    async appendChat(msg) {
      chat.push({ channel: 'world', kind: 'chat', scope: '', ...msg });
      while (chat.length > 400) chat.shift();
    },
    async listChatSince(since, opts = {}) {
      const t = Number(since) || 0;
      const channel = opts.channel || 'world';
      const scope = opts.scope || '';
      return clone(chat.filter(m => m.t > t && (m.channel || 'world') === channel && (m.scope || '') === scope).slice(-80));
    },
    async listAllChat() {
      return clone(chat);
    },
    async lastBroadcastAt(user) {
      let t = 0;
      for (const m of chat) if (m.kind === 'sys' && m.by === user && m.t > t) t = m.t;
      return t;
    },
    async createGuild(row) {
      guilds.set(row.id, { ...row });
      return clone(row);
    },
    async getGuild(id) {
      return clone(guilds.get(id) || null);
    },
    async findGuildByName(name, kind) {
      const key = String(name || '').toLowerCase();
      return clone([...guilds.values()].find(g => g.kind === kind && g.name.toLowerCase() === key) || null);
    },
    async listGuilds(kind, limit = 30) {
      const count = id => [...members.values()].filter(m => m.guild === id || m.clan === id).length;
      return [...guilds.values()].filter(g => g.kind === kind).map(g => ({ ...clone(g), members: count(g.id) }))
        .sort((a, b) => b.members - a.members || a.createdAt - b.createdAt).slice(0, limit);
    },
    async countMembers(id) {
      return [...members.values()].filter(m => m.guild === id || m.clan === id).length;
    },
    async getMembership(userId) {
      return clone(members.get(userId) || { guild: '', clan: '' });
    },
    async setMembership(userId, row) {
      const cur = members.get(userId) || { guild: '', clan: '' };
      members.set(userId, { ...cur, ...row });
      return clone(members.get(userId));
    },
    async listGuildState() {
      return { guilds: [...guilds.values()].map(clone), members: [...members.entries()].map(([id, m]) => [id, clone(m)]) };
    },
    async putOauthState(state, row) {
      oauthState.set(state, { ...row });
    },
    async takeOauthState(state) {
      const row = oauthState.get(state) || null;
      oauthState.delete(state);
      return row;
    },
    async putOauthCode(code, row) {
      oauthCodes.set(code, { ...row });
    },
    async takeOauthCode(code) {
      const row = oauthCodes.get(code) || null;
      oauthCodes.delete(code);
      return row;
    }
  };
}

export function createFileStore(filePath) {
  const mem = createMemoryStore();
  mem.kind = 'file';

  function snapshot() {
    return {
      users: [],
      saves: [],
      profiles: [],
      chat: [],
      oauthState: [],
      oauthCodes: []
    };
  }

  async function dump() {
    const data = {
      users: await mem.listUsers(),
      saves: (await mem.listUsers()).map(async u => [u.id, await mem.getSave(u.id)]),
      profiles: await mem.listProfiles(),
      chat: [],
      oauthState: [],
      oauthCodes: []
    };
    data.chat = await mem.listAllChat();
    const gs = await mem.listGuildState();
    data.guilds = gs.guilds;
    data.members = gs.members;
    const saves = [];
    for (const u of data.users) {
      const save = await mem.getSave(u.id);
      if (save != null) saves.push([u.id, save]);
    }
    data.saves = saves;
    data.saveVersions = await Promise.all(data.users.map(async u => [u.id, (await mem.getSaveRecord(u.id)).version]));
    data.profiles = (await mem.listProfiles()).map(p => [p.userId, p]);
    const tmp = filePath + '.tmp';
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, filePath);
  }

  if (existsSync(filePath)) {
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf8'));
      for (const u of raw.users || []) mem.createUser(u);
      const versions = new Map(raw.saveVersions || []);
      for (const [id, save] of raw.saves || []) mem.putSave(id, save, versions.get(id) || 0);
      for (const row of raw.profiles || []) {
        if (Array.isArray(row)) mem.putProfile(row[0], row[1]);
        else if (row && row.userId) {
          const { userId, ...profile } = row;
          mem.putProfile(userId, profile);
        }
      }
      for (const g of raw.guilds || []) mem.createGuild(g);
      for (const [id, m] of raw.members || []) mem.setMembership(id, m);
      for (const msg of raw.chat || []) mem.appendChat(msg);
    } catch {
      void snapshot;
    }
  }

  let pendingWrite = Promise.resolve();
  const persist = fn => (...args) => {
    const task = pendingWrite.then(async () => {
      const out = await fn(...args);
      await dump();
      return out;
    });
    pendingWrite = task.catch(() => {});
    return task;
  };

  return {
    ...mem,
    kind: 'file',
    createUser: persist(mem.createUser.bind(mem)),
    putSave: persist(mem.putSave.bind(mem)),
    putSaveIfVersion: persist(mem.putSaveIfVersion.bind(mem)),
    putProfile: persist(mem.putProfile.bind(mem)),
    patchProfileStats: persist(mem.patchProfileStats.bind(mem)),
    appendChat: persist(mem.appendChat.bind(mem)),
    createGuild: persist(mem.createGuild.bind(mem)),
    setMembership: persist(mem.setMembership.bind(mem))
  };
}

export async function createPostgresStore(databaseUrl, sqlImpl) {
  const sql = sqlImpl || (await import('@neondatabase/serverless')).neon(databaseUrl);
  await sql`CREATE TABLE IF NOT EXISTS hv_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    pass_hash TEXT,
    email TEXT UNIQUE,
    provider TEXT NOT NULL DEFAULT 'password',
    created_at BIGINT NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hv_saves (
    user_id TEXT PRIMARY KEY,
    save JSONB NOT NULL,
    updated_at BIGINT NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hv_profiles (
    user_id TEXT PRIMARY KEY,
    power INT DEFAULT 0,
    tower_best INT DEFAULT 0,
    chapter INT DEFAULT 0,
    squad JSONB,
    rank INT DEFAULT 1000,
    updated_at BIGINT NOT NULL
  )`;
  await sql`ALTER TABLE hv_saves ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0`;
  await sql`CREATE INDEX IF NOT EXISTS hv_profiles_power_idx ON hv_profiles (power DESC, user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS hv_profiles_tower_idx ON hv_profiles (tower_best DESC, user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS hv_profiles_rank_idx ON hv_profiles (rank ASC, user_id)`;
  await sql`CREATE TABLE IF NOT EXISTS hv_chat (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    t BIGINT NOT NULL
  )`;
  // Owner 2026-11-04 (duyet): chi THEM cot / bang, khong xoa du lieu cu
  await sql`ALTER TABLE hv_chat ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'world'`;
  await sql`ALTER TABLE hv_chat ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'chat'`;
  await sql`ALTER TABLE hv_chat ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE hv_chat ADD COLUMN IF NOT EXISTS by_user TEXT`;
  await sql`ALTER TABLE hv_chat ADD COLUMN IF NOT EXISTS meta JSONB`;
  await sql`CREATE INDEX IF NOT EXISTS hv_chat_channel_idx ON hv_chat (channel, scope, t)`;
  await sql`CREATE TABLE IF NOT EXISTS hv_guilds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    owner TEXT NOT NULL,
    created_at BIGINT NOT NULL
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS hv_guilds_name_idx ON hv_guilds (kind, lower(name))`;
  await sql`CREATE TABLE IF NOT EXISTS hv_members (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT '',
    clan_id TEXT NOT NULL DEFAULT '',
    updated_at BIGINT NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS hv_oauth_state (
    state TEXT PRIMARY KEY,
    created_at BIGINT NOT NULL,
    payload JSONB
  )`;
  await sql`ALTER TABLE hv_oauth_state ADD COLUMN IF NOT EXISTS payload JSONB`;
  await sql`ALTER TABLE hv_profiles ADD COLUMN IF NOT EXISTS friends JSONB DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE hv_profiles ADD COLUMN IF NOT EXISTS friend_inbox JSONB DEFAULT '[]'::jsonb`;
  await sql`CREATE TABLE IF NOT EXISTS hv_oauth_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at BIGINT NOT NULL
  )`;

  const mapUser = row => row && {
    id: row.id,
    user: row.username,
    passHash: row.pass_hash,
    email: row.email,
    provider: row.provider,
    createdAt: Number(row.created_at)
  };
  const mapProfile = row => ({ userId: row.user_id, user: row.username, power: row.power, towerBest: row.tower_best,
    chapter: row.chapter, squad: row.squad, rank: row.rank, friends: row.friends || [], friendInbox: row.friend_inbox || [] });

  return {
    kind: 'postgres',
    async findUserByName(name) {
      const rows = await sql`SELECT * FROM hv_users WHERE lower(username) = ${String(name || '').toLowerCase()} LIMIT 1`;
      return mapUser(rows[0]);
    },
    async findUserById(id) {
      const rows = await sql`SELECT * FROM hv_users WHERE id = ${id} LIMIT 1`;
      return mapUser(rows[0]);
    },
    async findUserByEmail(email) {
      const rows = await sql`SELECT * FROM hv_users WHERE lower(email) = ${String(email || '').toLowerCase()} LIMIT 1`;
      return mapUser(rows[0]);
    },
    async listUsers() {
      const rows = await sql`SELECT * FROM hv_users`;
      return rows.map(mapUser);
    },
    async createUser(row) {
      await sql`INSERT INTO hv_users (id, username, pass_hash, email, provider, created_at)
        VALUES (${row.id}, ${row.user}, ${row.passHash || null}, ${row.email || null}, ${row.provider}, ${row.createdAt})`;
      return row;
    },
    async getSave(userId) {
      const rows = await sql`SELECT save FROM hv_saves WHERE user_id = ${userId} LIMIT 1`;
      return rows[0] ? rows[0].save : null;
    },
    async putSave(userId, save) {
      await sql`INSERT INTO hv_saves (user_id, save, updated_at, version) VALUES (${userId}, ${JSON.stringify(save)}::jsonb, ${Date.now()}, 1)
        ON CONFLICT (user_id) DO UPDATE SET save = excluded.save, updated_at = excluded.updated_at, version = hv_saves.version + 1`;
    },
    async getSaveRecord(userId) {
      const rows = await sql`SELECT save, version FROM hv_saves WHERE user_id = ${userId} LIMIT 1`;
      return { save: rows[0]?.save ?? null, version: Number(rows[0]?.version || 0) };
    },
    async putSaveIfVersion(userId, save, expectedVersion) {
      const rows = expectedVersion === 0
        ? await sql`INSERT INTO hv_saves (user_id, save, updated_at, version) VALUES (${userId}, ${JSON.stringify(save)}::jsonb, ${Date.now()}, 1)
            ON CONFLICT (user_id) DO UPDATE SET save = excluded.save, updated_at = excluded.updated_at, version = hv_saves.version + 1
            WHERE hv_saves.version = 0 RETURNING version`
        : await sql`UPDATE hv_saves SET save = ${JSON.stringify(save)}::jsonb, updated_at = ${Date.now()}, version = version + 1
            WHERE user_id = ${userId} AND version = ${expectedVersion} RETURNING version`;
      return rows[0] ? Number(rows[0].version) : null;
    },
    async getProfile(userId) {
      const rows = await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id WHERE p.user_id = ${userId} LIMIT 1`;
      const row = rows[0];
      if (!row) return null;
      return { user: row.username, power: row.power, towerBest: row.tower_best, chapter: row.chapter, squad: row.squad, rank: row.rank, friends: row.friends || [], friendInbox: row.friend_inbox || [], userId };
    },
    async putProfile(userId, profile) {
      await sql`INSERT INTO hv_profiles (user_id, power, tower_best, chapter, squad, rank, friends, friend_inbox, updated_at)
        VALUES (${userId}, ${profile.power || 0}, ${profile.towerBest || 0}, ${profile.chapter || 0}, ${JSON.stringify(profile.squad || [])}::jsonb, ${profile.rank || 1000}, ${JSON.stringify(profile.friends || [])}::jsonb, ${JSON.stringify(profile.friendInbox || [])}::jsonb, ${Date.now()})
        ON CONFLICT (user_id) DO UPDATE SET
          power = excluded.power, tower_best = excluded.tower_best, chapter = excluded.chapter,
          squad = excluded.squad, rank = excluded.rank, friends = excluded.friends, friend_inbox = excluded.friend_inbox, updated_at = excluded.updated_at`;
    },
    async listProfiles() {
      const rows = await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id`;
      return rows.map(row => ({
        userId: row.user_id,
        user: row.username,
        power: row.power,
        towerBest: row.tower_best,
        chapter: row.chapter,
        squad: row.squad,
        rank: row.rank,
        friends: row.friends || [],
        friendInbox: row.friend_inbox || []
      }));
    },
    async patchProfileStats(userId, fields) {
      await sql`UPDATE hv_profiles SET power = ${fields.power}, tower_best = ${fields.towerBest}, chapter = ${fields.chapter},
        squad = ${JSON.stringify(fields.squad)}::jsonb, updated_at = ${Date.now()} WHERE user_id = ${userId}`;
    },
    async nextRank() {
      const rows = await sql`SELECT GREATEST(COALESCE(MAX(rank), 999), 999) + 1 AS rank FROM hv_profiles`;
      return Number(rows[0].rank);
    },
    async listRivals(userId, limit = 8) {
      const rows = await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id
        WHERE p.user_id <> ${userId} ORDER BY p.rank, p.user_id LIMIT ${limit}`;
      return rows.map(mapProfile);
    },
    async listLeaderboard(by, limit = 20) {
      const rows = by === 'arena'
        ? await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id ORDER BY p.rank ASC, p.user_id LIMIT ${limit}`
        : by === 'tower'
          ? await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id ORDER BY p.tower_best DESC, p.user_id LIMIT ${limit}`
          : await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id ORDER BY p.power DESC, p.user_id LIMIT ${limit}`;
      return rows.map(mapProfile);
    },
    async getProfilesByNames(names) {
      if (!names.length) return [];
      const rows = await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id
        WHERE u.username = ANY(${names}::text[])`;
      return rows.map(mapProfile);
    },
    async listFriendSuggestions(userId, excluded, limit = 12) {
      const rows = await sql`SELECT p.*, u.username FROM hv_profiles p JOIN hv_users u ON u.id = p.user_id
        WHERE p.user_id <> ${userId} AND NOT (u.username = ANY(${excluded}::text[])) ORDER BY p.power DESC, p.user_id LIMIT ${limit}`;
      return rows.map(mapProfile);
    },
    async appendChat(msg) {
      await sql`INSERT INTO hv_chat (username, text, t, channel, kind, scope, by_user, meta)
        VALUES (${msg.user}, ${msg.text}, ${msg.t}, ${msg.channel || 'world'}, ${msg.kind || 'chat'}, ${msg.scope || ''},
          ${msg.by || null}, ${msg.meta ? JSON.stringify(msg.meta) : null}::jsonb)`;
    },
    async listChatSince(since, opts = {}) {
      const channel = opts.channel || 'world';
      const scope = opts.scope || '';
      const rows = await sql`SELECT username, text, t, channel, kind, scope, by_user, meta FROM hv_chat
        WHERE t > ${Number(since) || 0} AND channel = ${channel} AND scope = ${scope} ORDER BY t ASC LIMIT 80`;
      return rows.map(r => ({ user: r.username, text: r.text, t: Number(r.t), channel: r.channel || 'world',
        kind: r.kind || 'chat', scope: r.scope || '', by: r.by_user || undefined,
        meta: r.meta && typeof r.meta === 'object' ? r.meta : undefined }));
    },
    async lastBroadcastAt(user) {
      const rows = await sql`SELECT MAX(t) AS t FROM hv_chat WHERE kind = 'sys' AND by_user = ${user}`;
      return Number((rows[0] && rows[0].t) || 0);
    },
    async createGuild(row) {
      await sql`INSERT INTO hv_guilds (id, name, kind, owner, created_at) VALUES (${row.id}, ${row.name}, ${row.kind}, ${row.owner}, ${row.createdAt})`;
      return { ...row };
    },
    async getGuild(id) {
      const rows = await sql`SELECT * FROM hv_guilds WHERE id = ${id} LIMIT 1`;
      const g = rows[0];
      return g ? { id: g.id, name: g.name, kind: g.kind, owner: g.owner, createdAt: Number(g.created_at) } : null;
    },
    async findGuildByName(name, kind) {
      const rows = await sql`SELECT * FROM hv_guilds WHERE kind = ${kind} AND lower(name) = lower(${name}) LIMIT 1`;
      const g = rows[0];
      return g ? { id: g.id, name: g.name, kind: g.kind, owner: g.owner, createdAt: Number(g.created_at) } : null;
    },
    async listGuilds(kind, limit = 30) {
      const rows = await sql`SELECT g.*, (SELECT COUNT(*) FROM hv_members m WHERE m.guild_id = g.id OR m.clan_id = g.id) AS members
        FROM hv_guilds g WHERE g.kind = ${kind} ORDER BY members DESC, g.created_at ASC LIMIT ${limit}`;
      return rows.map(g => ({ id: g.id, name: g.name, kind: g.kind, owner: g.owner, createdAt: Number(g.created_at), members: Number(g.members || 0) }));
    },
    async countMembers(id) {
      const rows = await sql`SELECT COUNT(*) AS n FROM hv_members WHERE guild_id = ${id} OR clan_id = ${id}`;
      return Number((rows[0] && rows[0].n) || 0);
    },
    async getMembership(userId) {
      const rows = await sql`SELECT guild_id, clan_id FROM hv_members WHERE user_id = ${userId} LIMIT 1`;
      return rows[0] ? { guild: rows[0].guild_id || '', clan: rows[0].clan_id || '' } : { guild: '', clan: '' };
    },
    async setMembership(userId, row) {
      const cur = await this.getMembership(userId);
      const next = { ...cur, ...row };
      await sql`INSERT INTO hv_members (user_id, guild_id, clan_id, updated_at) VALUES (${userId}, ${next.guild || ''}, ${next.clan || ''}, ${Date.now()})
        ON CONFLICT (user_id) DO UPDATE SET guild_id = excluded.guild_id, clan_id = excluded.clan_id, updated_at = excluded.updated_at`;
      return next;
    },
    async putOauthState(state, row) {
      await sql`INSERT INTO hv_oauth_state (state, created_at, payload) VALUES (${state}, ${row.createdAt}, ${JSON.stringify(row || {})}::jsonb)
        ON CONFLICT (state) DO UPDATE SET created_at = excluded.created_at, payload = excluded.payload`;
    },
    async takeOauthState(state) {
      const rows = await sql`SELECT * FROM hv_oauth_state WHERE state = ${state} LIMIT 1`;
      await sql`DELETE FROM hv_oauth_state WHERE state = ${state}`;
      if (!rows[0]) return null;
      const payload = rows[0].payload && typeof rows[0].payload === 'object' ? rows[0].payload : {};
      return { ...payload, createdAt: Number(rows[0].created_at) };
    },
    async putOauthCode(code, row) {
      await sql`INSERT INTO hv_oauth_codes (code, user_id, created_at) VALUES (${code}, ${row.userId}, ${row.createdAt})
        ON CONFLICT (code) DO UPDATE SET user_id = excluded.user_id, created_at = excluded.created_at`;
    },
    async takeOauthCode(code) {
      const rows = await sql`SELECT * FROM hv_oauth_codes WHERE code = ${code} LIMIT 1`;
      await sql`DELETE FROM hv_oauth_codes WHERE code = ${code}`;
      return rows[0] ? { userId: rows[0].user_id, createdAt: Number(rows[0].created_at) } : null;
    }
  };
}

export async function createStoreFromEnv(env = process.env, options = {}) {
  if (env.DATABASE_URL) {
    try {
      return await createPostgresStore(env.DATABASE_URL, options.sql);
    } catch (err) {
      const unavailable = new Error('Database initialization failed', { cause: err });
      unavailable.code = 'STORE_UNAVAILABLE';
      throw unavailable;
    }
  }
  if (env.VERCEL) {
    const unavailable = new Error('DATABASE_URL is required in production');
    unavailable.code = 'STORE_UNAVAILABLE';
    throw unavailable;
  }
  const filePath = env.HONVIET_STORE_PATH || 'data/hon-viet-store.json';
  return createFileStore(filePath);
}
