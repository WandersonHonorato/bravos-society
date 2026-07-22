const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// On Vercel only /tmp is writable, and it's wiped whenever a serverless
// instance is recycled. Locally we keep the .sqlite file next to the
// project so it survives restarts.
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'bravos.sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_goalkeeper INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_players (
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  PRIMARY KEY (team_id, player_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  order_num INTEGER NOT NULL,
  team_a_id TEXT NOT NULL,
  team_b_id TEXT NOT NULL,
  gols_a INTEGER,
  gols_b INTEGER,
  finished INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbPromise = null;

async function initDb() {
  ensureDir();
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  let db;
  if (fs.existsSync(DB_FILE)) {
    db = new SQL.Database(fs.readFileSync(DB_FILE));
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  return db;
}

// Returns the (already initialized) sql.js database instance, initializing
// it once per running process.
function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

// Writes the in-memory database out to disk. sql.js keeps everything in
// memory, so every mutation must be followed by a persist() to survive.
function persist(db) {
  ensureDir();
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

function run(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

function all(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(db, sql, params = []) {
  return all(db, sql, params)[0] || null;
}

module.exports = { getDb, persist, run, all, get };
