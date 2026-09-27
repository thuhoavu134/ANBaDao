import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createMemoryStore() {
  const users = [];
  const saves = new Map();
  const profiles = new Map();
  const chat = [];
  const oauthState = new Map();
  const oauthCodes = new Map();

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
    async putSave(userId, save) {
      saves.set(userId, clone(save));
    },
    async getProfile(userId) {
      return profiles.has(userId) ? clone(profiles.get(userId)) : null;
    },
    async putProfile(userId, profile) {
      profiles.set(userId, clone(profile));
    },
    async listProfiles() {
      return [...profiles.entries()].map(([userId, profile]) => ({ userId, ...clone(profile) }));
    },
    async appendChat(msg) {
      chat.push({ ...msg });
      while (chat.length > 200) chat.shift();
    },
    async listChatSince(since) {
      const t = Number(since) || 0;
      return chat.filter(m => m.t > t).slice(-80);
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
      chat: await mem.listChatSince(0),
      oauthState: [],
      oauthCodes: []
    };
    const saves = [];
    for (const u of data.users) {
      const save = await mem.getSave(u.id);
      if (save != null) saves.push([u.id, save]);
    }
    data.saves = saves;
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
      for (const [id, save] of raw.saves || []) mem.putSave(id, save);
      for (const row of raw.profiles || []) {
        if (Array.isArray(row)) mem.putProfile(row[0], row[1]);
        else if (row && row.userId) {
          const { userId, ...profile } = row;
          mem.putProfile(userId, profile);
        }
      }
      for (const msg of raw.chat || []) mem.appendChat(msg);
    } catch {
      void snapshot;
    }
  }

  const persist = fn => async (...args) => {
    const out = await fn(...args);
    await dump();
    return out;
  };

  return {
    ...mem,
    kind: 'file',
    createUser: persist(mem.createUser.bind(mem)),
    putSave: persist(mem.putSave.bind(mem)),
    putProfile: persist(mem.putProfile.bind(mem)),
    appendChat: persist(mem.appendChat.bind(mem))
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
  await sql`CREATE TABLE IF NOT EXISTS hv_chat (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    t BIGINT NOT NULL
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
      await sql`INSERT INTO hv_saves (user_id, save, updated_at) VALUES (${userId}, ${JSON.stringify(save)}::jsonb, ${Date.now()})
        ON CONFLICT (user_id) DO UPDATE SET save = excluded.save, updated_at = excluded.updated_at`;
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
    async appendChat(msg) {
      await sql`INSERT INTO hv_chat (username, text, t) VALUES (${msg.user}, ${msg.text}, ${msg.t})`;
    },
    async listChatSince(since) {
      const rows = await sql`SELECT username, text, t FROM hv_chat WHERE t > ${Number(since) || 0} ORDER BY t ASC LIMIT 80`;
      return rows.map(r => ({ user: r.username, text: r.text, t: Number(r.t) }));
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
      console.error('honviet store postgres failed', err);
    }
  }
  if (env.VERCEL) {
    if (!env.DATABASE_URL) {
      console.error('HONVIET STORE WARNING: VERCEL deployment has no DATABASE_URL. '
        + 'Falling back to an in-memory store: player saves, profiles, chat and arena '
        + 'results are lost on every cold start. Set DATABASE_URL to the Neon Postgres '
        + 'connection string (Project Settings > Environment Variables).');
    }
    return createMemoryStore();
  }
  const filePath = env.HONVIET_STORE_PATH || 'data/hon-viet-store.json';
  return createFileStore(filePath);
}
