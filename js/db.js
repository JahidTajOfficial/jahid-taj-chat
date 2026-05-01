const DB = {
  async query(sql, args = []) {
    const url = CONFIG.TURSO_URL.replace("libsql://", "https://");
    const response = await fetch(url + "/v2/pipeline", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + CONFIG.TURSO_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: sql, args: args } },
          { type: "close" },
        ],
      }),
    });
    const data = await response.json();
    if (data.results && data.results[0].type === "ok") {
      return data.results[0].response.result;
    }
    return null;
  },

  async init() {
    await this.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);

    await this.query(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT,
      group_id TEXT,
      channel_id TEXT,
      type TEXT DEFAULT 'text',
      content TEXT NOT NULL,
      media_url TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);

    await this.query(`CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);

    await this.query(`CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at INTEGER DEFAULT (strftime('%s','now'))
    )`);

    await this.query(`CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);

    await this.query(`CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'image',
      media_url TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      expires_at INTEGER NOT NULL
    )`);

    console.log("DB ready!");
  },
};
