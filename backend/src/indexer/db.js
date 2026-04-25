/**
 * SQLite-backed event store using sql.js (pure WASM — no native build required).
 * The DB is loaded from disk on init and flushed to disk after every write.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let dbPath = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    event_type  TEXT NOT NULL,
    ledger      INTEGER NOT NULL,
    timestamp   INTEGER NOT NULL,
    contract_id TEXT NOT NULL,
    payload     TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_ledger ON events(ledger);
`;

/** Persist in-memory DB to disk. */
function flush() {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

/** Initialize (or load) the database. */
async function initDb(filePath) {
  dbPath = filePath;
  const SQL = await initSqlJs();

  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  db.run(SCHEMA);
  flush();
  return db;
}

/**
 * Upsert a batch of events. Deduplicates by id (PRIMARY KEY conflict = ignore).
 * @param {Array<{id, event_type, ledger, timestamp, contract_id, payload}>} events
 */
function upsertEvents(events) {
  if (!events.length) return;
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO events (id, event_type, ledger, timestamp, contract_id, payload) VALUES (?,?,?,?,?,?)'
  );
  for (const e of events) {
    stmt.run([e.id, e.event_type, e.ledger, e.timestamp, e.contract_id, JSON.stringify(e.payload)]);
  }
  stmt.free();
  flush();
}

/**
 * Query events with optional filters.
 * @param {{ event_type?: string, limit?: number, offset?: number }} opts
 */
function queryEvents({ event_type, limit = 100, offset = 0 } = {}) {
  let sql = 'SELECT * FROM events';
  const params = [];
  if (event_type) {
    sql += ' WHERE event_type = ?';
    params.push(event_type);
  }
  sql += ' ORDER BY ledger DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const results = db.exec(sql, params);
  if (!results.length) return [];

  const { columns, values } = results[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    obj.payload = JSON.parse(obj.payload);
    return obj;
  });
}

/** Return the highest ledger sequence we've indexed (0 if none). */
function getLatestLedger() {
  const res = db.exec('SELECT MAX(ledger) as max_ledger FROM events');
  if (!res.length || res[0].values[0][0] == null) return 0;
  return res[0].values[0][0];
}

module.exports = { initDb, upsertEvents, queryEvents, getLatestLedger };
