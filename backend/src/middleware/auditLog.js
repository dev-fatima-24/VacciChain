const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || path.join(__dirname, '../../audit.log');

/**
 * Append a single audit entry to the append-only NDJSON log file.
 * This is the only write path — there is no update or delete.
 */
function writeAuditEntry(entry) {
  const line = JSON.stringify(entry) + '\n';
  // appendFileSync keeps writes atomic enough for a single-process server
  fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf8');
}

/**
 * Build and persist an audit log entry.
 *
 * @param {object} opts
 * @param {string} opts.actor   - Stellar public key of the acting wallet
 * @param {string} opts.action  - e.g. 'vaccination.issue', 'auth.login'
 * @param {string} [opts.target] - Subject of the action (patient wallet, etc.)
 * @param {string} opts.result  - 'success' | 'failure'
 * @param {object} [opts.meta]  - Any extra context (token_id, error message, …)
 */
function audit({ actor, action, target = null, result, meta = {} }) {
  const entry = {
    timestamp: new Date().toISOString(),
    actor,
    action,
    target,
    result,
    meta,
  };
  writeAuditEntry(entry);
}

/**
 * Read all audit entries, optionally filtered by actor and/or date range.
 *
 * @param {object} filters
 * @param {string} [filters.actor]  - exact wallet match
 * @param {string} [filters.from]   - ISO date string (inclusive)
 * @param {string} [filters.to]     - ISO date string (inclusive)
 * @returns {object[]}
 */
function queryAuditLog({ actor, from, to } = {}) {
  if (!fs.existsSync(AUDIT_LOG_PATH)) return [];

  const fromMs = from ? new Date(from).getTime() : null;
  const toMs   = to   ? new Date(to).getTime()   : null;

  const raw = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
  const entries = raw
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);

  return entries.filter(e => {
    if (actor && e.actor !== actor) return false;
    const ts = new Date(e.timestamp).getTime();
    if (fromMs && ts < fromMs) return false;
    if (toMs   && ts > toMs)   return false;
    return true;
  });
}

module.exports = { audit, queryAuditLog };
