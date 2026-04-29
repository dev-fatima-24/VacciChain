const express = require('express');
const crypto = require('crypto');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const { queryAuditLog, audit } = require('../middleware/auditLog');
const { insertApiKey, listApiKeys, revokeApiKey } = require('../indexer/db');
const { invokeContract, simulateContract } = require('../stellar/soroban');
const config = require('../config');

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function isValidStellarAddress(address) {
  try {
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// ── Issuer management ─────────────────────────────────────────────────────────

/**
 * POST /admin/issuers
 * Body: { address: string }
 * Authorizes a new issuer on-chain via add_issuer contract call.
 */
router.post('/issuers', authMiddleware, adminOnly, async (req, res) => {
  const { address } = req.body;
  if (!address || !isValidStellarAddress(address)) {
    return res.status(400).json({ error: 'Valid Stellar address required' });
  }

  try {
    const result = await invokeContract(
      config.ADMIN_SECRET_KEY,
      'add_issuer',
      [StellarSdk.xdr.ScVal.scvAddress(StellarSdk.Address.fromString(address).toScAddress())]
    );
    audit({ actor: req.user.wallet, action: 'admin.add_issuer', result: 'success', meta: { address } });
    res.status(201).json({ address, authorized: true, hash: result.hash });
  } catch (err) {
    audit({ actor: req.user.wallet, action: 'admin.add_issuer', result: 'failure', meta: { address, error: err.message } });
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /admin/issuers/:address
 * Revokes an issuer on-chain via revoke_issuer contract call.
 */
router.delete('/issuers/:address', authMiddleware, adminOnly, async (req, res) => {
  const { address } = req.params;
  if (!isValidStellarAddress(address)) {
    return res.status(400).json({ error: 'Invalid Stellar address' });
  }

  try {
    const result = await invokeContract(
      config.ADMIN_SECRET_KEY,
      'revoke_issuer',
      [StellarSdk.xdr.ScVal.scvAddress(StellarSdk.Address.fromString(address).toScAddress())]
    );
    audit({ actor: req.user.wallet, action: 'admin.revoke_issuer', result: 'success', meta: { address } });
    res.json({ address, authorized: false, hash: result.hash });
  } catch (err) {
    audit({ actor: req.user.wallet, action: 'admin.revoke_issuer', result: 'failure', meta: { address, error: err.message } });
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /admin/issuers
 * Lists all authorized issuers by reading contract state.
 */
router.get('/issuers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const retval = await simulateContract('list_issuers', []);
    // Contract returns a Vec of addresses; parse into an array of strings
    let issuers = [];
    if (retval && retval.switch().name === 'scvVec') {
      issuers = retval.vec().map((v) => StellarSdk.Address.fromScVal(v).toString());
    }
    res.json({ issuers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit log ─────────────────────────────────────────────────────────────────

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

router.get('/api-keys', authMiddleware, adminOnly, (_req, res) => {
  res.json(listApiKeys());
});

router.delete('/api-keys/:id', authMiddleware, adminOnly, (req, res) => {
  revokeApiKey(req.params.id);
  res.json({ revoked: true });
});

module.exports = router;
