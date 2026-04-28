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

/**
 * Generate a SEP-10 authentication challenge.
 *
 * @route POST /auth/sep10
 * @param {string} public_key - The Stellar public key requesting a challenge
 * @returns {Object} 200 - Challenge transaction and nonce
 * @returns {string} 200.transaction - The unsigned SEP-10 challenge transaction
 * @returns {string} 200.nonce - A unique nonce for this challenge (single-use)
 * @returns {Object} 400 - Invalid public key format
 * @returns {Object} 429 - Rate limit exceeded (max 10 per minute per IP)
 * @throws {Error} 500 - Internal server error
 */
router.post('/sep10', sep10Limiter, validate(sep10Schema), async (req, res) => {
  const { public_key } = req.body;

  try {
    const { transaction, nonce } = await buildChallenge(public_key);
    res.json({ transaction, nonce });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Verify a signed SEP-10 challenge and issue a JWT.
 *
 * The client must sign the challenge transaction returned from POST /auth/sep10
 * with their Stellar wallet and submit it here. Upon successful verification,
 * a JWT is issued that can be used to authenticate subsequent API requests.
 *
 * @route POST /auth/verify
 * @param {string} transaction - The signed SEP-10 challenge transaction
 * @param {string} nonce - The nonce from the challenge (must match)
 * @returns {Object} 200 - Authentication successful
 * @returns {string} 200.token - JWT token (expires in 1 hour)
 * @returns {string} 200.publicKey - The authenticated Stellar public key
 * @returns {string} 200.role - User role: 'issuer' (admin) or 'patient'
 * @returns {Object} 400 - Missing or invalid parameters
 * @returns {Object} 401 - Invalid signature or nonce mismatch
 * @throws {Error} 500 - Internal server error
 */
router.post('/verify', validate(verifySchema), (req, res) => {
  const { transaction, nonce } = req.body;

  try {
    const publicKey = verifyChallenge(transaction, nonce);

    const role = publicKey === process.env.ADMIN_PUBLIC_KEY ? 'issuer' : 'patient';

    const token = jwt.sign(
      { publicKey, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    audit({ actor: publicKey, action: 'auth.login', result: 'success', meta: { role } });

    res.json({ token, publicKey, role });
  } catch (err) {
    audit({ actor: 'unknown', action: 'auth.login', result: 'failure', meta: { error: err.message } });
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
