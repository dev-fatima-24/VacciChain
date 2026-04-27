const crypto = require('crypto');
const { getApiKeyByHash } = require('../indexer/db');

/**
 * Middleware: validate X-API-Key header against the api_keys table.
 * On success, attaches req.verifier = { id, label } and calls next().
 * On failure, returns 401.
 */
function verifierApiKey(req, res, next) {
  const raw = req.headers['x-api-key'];
  if (!raw) return res.status(401).json({ error: 'Missing X-API-Key header' });

  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const record = getApiKeyByHash(hash);

  if (!record || record.revoked) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }

  req.verifier = { id: record.id, label: record.label };
  next();
}

module.exports = verifierApiKey;
