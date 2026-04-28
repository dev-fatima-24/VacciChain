const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const StellarSdk = require('@stellar/stellar-sdk');
const { buildChallenge, verifyChallenge } = require('../stellar/sep10');
const { sep10Limiter } = require('../middleware/rateLimiter');
const { audit } = require('../middleware/auditLog');
const validate = require('../middleware/validate');

const router = express.Router();

const sep10Schema = z.object({
  public_key: z.string().refine((val) => {
    try {
      StellarSdk.Keypair.fromPublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid Stellar public key' }),
});

const verifySchema = z.object({
  transaction: z.string().min(1, 'transaction is required'),
  nonce: z.string().min(1, 'nonce is required'),
});

// POST /auth/sep10 — generate challenge
router.post('/sep10', sep10Limiter, validate(sep10Schema), async (req, res) => {
  const { public_key } = req.body;

  try {
    const { transaction, nonce } = await buildChallenge(public_key);
    res.json({ transaction, nonce });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/verify — verify signed challenge, issue JWT
router.post('/verify', validate(verifySchema), (req, res) => {
  const { transaction, nonce } = req.body;

  try {
    const publicKey = verifyChallenge(transaction, nonce);

    const role = publicKey === process.env.ADMIN_PUBLIC_KEY ? 'issuer' : 'patient';
    const now = Math.floor(Date.now() / 1000);

    const token = jwt.sign(
      {
        sub: publicKey,       // SEP-10: subject is the authenticated Stellar account
        iss: process.env.HOME_DOMAIN || 'localhost',
        iat: now,
        wallet: publicKey,    // convenience claim used by authMiddleware
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    audit({ actor: publicKey, action: 'auth.login', result: 'success', meta: { role } });

    res.json({ token, wallet: publicKey, role });
  } catch (err) {
    audit({ actor: 'unknown', action: 'auth.login', result: 'failure', meta: { error: err.message } });
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
