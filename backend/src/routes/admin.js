const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const { queryAuditLog } = require('../middleware/auditLog');
const { insertApiKey, listApiKeys, revokeApiKey } = require('../indexer/db');

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user?.role !== 'issuer') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * GET /admin/audit
 */
router.get('/audit', authMiddleware, adminOnly, (req, res) => {
  const { actor, from, to } = req.query;
  const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 1000);
  const offset = Math.max(parseInt(req.query.offset || '0',   10), 0);

  if (from && isNaN(new Date(from).getTime())) {
    return res.status(400).json({ error: 'Invalid "from" date' });
  }
  if (to && isNaN(new Date(to).getTime())) {
    return res.status(400).json({ error: 'Invalid "to" date' });
  }

  const entries = queryAuditLog({ actor, from, to });
  const page    = entries.slice(offset, offset + limit);
  res.json({ total: entries.length, offset, limit, entries: page });
});

// ── API key management ────────────────────────────────────────────────────────

/**
 * POST /admin/api-keys
 * Body: { label: string }
 * Returns the raw key once — it is never stored in plaintext.
 */
router.post('/api-keys', authMiddleware, adminOnly, (req, res) => {
  const { label } = req.body;
  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'label is required' });
  }

  const rawKey  = crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const id      = crypto.randomUUID();

  insertApiKey({ id, key_hash: keyHash, label: label.trim(), created_at: new Date().toISOString() });

  res.status(201).json({ id, label: label.trim(), key: rawKey });
});

/**
 * GET /admin/api-keys
 * Returns all keys (without the raw key value).
 */
router.get('/api-keys', authMiddleware, adminOnly, (_req, res) => {
  res.json(listApiKeys());
});

/**
 * DELETE /admin/api-keys/:id
 * Revokes a key by id.
 */
router.delete('/api-keys/:id', authMiddleware, adminOnly, (req, res) => {
  revokeApiKey(req.params.id);
  res.json({ revoked: true });
});

module.exports = router;
