/**
 * Brute-force protection for /auth/verify.
 *
 * Tracks failed attempts per IP and per wallet address.
 * After MAX_ATTEMPTS failures within WINDOW_MS, the IP/wallet is blocked
 * for BLOCK_DURATION_MS and a block event is logged.
 *
 * Storage is in-process (Map). For multi-instance deployments, replace
 * with a shared Redis store.
 */

const { audit } = require('./auditLog');
const logger = require('../logger');

const MAX_ATTEMPTS     = parseInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS   || '5',      10);
const WINDOW_MS        = parseInt(process.env.BRUTE_FORCE_WINDOW_MS      || '600000', 10); // 10 min
const BLOCK_DURATION_MS = parseInt(process.env.BRUTE_FORCE_BLOCK_MS      || '900000', 10); // 15 min

// Map<key, { count, windowStart, blockedUntil }>
const store = new Map();

function _getEntry(key) {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now, blockedUntil: 0 };
    store.set(key, entry);
  }
  return entry;
}

/**
 * Returns true if the key is currently blocked.
 */
function isBlocked(key) {
  const entry = store.get(key);
  if (!entry) return false;
  return Date.now() < entry.blockedUntil;
}

/**
 * Record a failed attempt for a key.
 * Blocks the key if MAX_ATTEMPTS is reached within the window.
 */
function recordFailure(key, meta = {}) {
  const entry = _getEntry(key);
  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    logger.warn('brute-force block', { key, attempts: entry.count, ...meta });
    audit({
      actor: meta.wallet || key,
      action: 'auth.brute_force_block',
      result: 'blocked',
      meta: { ip: meta.ip, wallet: meta.wallet, attempts: entry.count },
    });
  }
}

/**
 * Clear the failure record for a key on successful auth.
 */
function recordSuccess(key) {
  store.delete(key);
}

/**
 * Express middleware that enforces brute-force limits on /auth/verify.
 *
 * Checks both the client IP and the wallet address (from request body).
 * Returns 429 with retryAfter if either is blocked.
 */
function bruteForceGuard(req, res, next) {
  const ip     = req.ip || req.socket?.remoteAddress || 'unknown';
  // wallet may not be in body yet — we check again after body parse
  const wallet = req.body?.public_key || req.body?.wallet || null;

  const ipBlocked     = isBlocked(`ip:${ip}`);
  const walletBlocked = wallet && isBlocked(`wallet:${wallet}`);

  if (ipBlocked || walletBlocked) {
    const entry = store.get(ipBlocked ? `ip:${ip}` : `wallet:${wallet}`);
    const retryAfter = Math.ceil((entry.blockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      error: 'Too many failed attempts. Try again later or contact support.',
      retryAfter,
    });
  }

  next();
}

module.exports = { bruteForceGuard, recordFailure, recordSuccess, isBlocked };
