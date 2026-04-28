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
 * @swagger
 * /auth/sep10:
 *   post:
 *     summary: Generate SEP-10 challenge transaction
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               public_key:
 *                 type: string
 *                 description: Stellar public key
 *             required:
 *               - public_key
 *     responses:
 *       200:
 *         description: Challenge transaction generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: string
 *                 nonce:
 *                   type: string
 *       400:
 *         description: Invalid public key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 */
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

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify signed SEP-10 challenge and issue JWT
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction:
 *                 type: string
 *                 description: Signed challenge transaction
 *               nonce:
 *                 type: string
 *                 description: Nonce from challenge
 *             required:
 *               - transaction
 *               - nonce
 *     responses:
 *       200:
 *         description: JWT issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 publicKey:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [patient, issuer]
 *       401:
 *         description: Invalid signature or nonce
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /auth/verify — verify signed challenge, issue JWT
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
