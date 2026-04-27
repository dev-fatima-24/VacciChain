const express = require('express');
const authMiddleware = require('../middleware/auth');
const { queryAuditLog } = require('../middleware/auditLog');

const router = express.Router();

/**
 * Require admin (issuer) role.
 * Reuses the same role that guards vaccination issuance.
 */
function adminOnly(req, res, next) {
  if (req.user?.role !== 'issuer') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * GET /admin/audit
 * Query params:
 *   actor  — filter by Stellar public key
 *   from   — ISO date string (inclusive lower bound)
 *   to     — ISO date string (inclusive upper bound)
 *   limit  — max entries to return (default 100, max 1000)
 *   offset — pagination offset (default 0)
 */
router.get('/audit', authMiddleware, adminOnly, (req, res) => {
  const { actor, from, to } = req.query;
  const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 1000);
  const offset = Math.max(parseInt(req.query.offset || '0',   10), 0);

  // Basic date validation
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

module.exports = router;
