const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const { validateStellarPublicKey } = require('../middleware/wallet');
const { simulateContract } = require('../stellar/soroban');
const { verifyLimiter, verifierKeyLimiter } = require('../middleware/rateLimiter');
const verifierApiKey = require('../middleware/verifierApiKey');
const authMiddleware = require('../middleware/auth');
const { audit } = require('../middleware/auditLog');

const router = express.Router();

/**
 * Try JWT first; if no Authorization header, fall through to API key auth.
 * One of the two must succeed — otherwise 401.
 */
function jwtOrApiKey(req, res, next) {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  return verifierApiKey(req, res, next);
}

/**
 * Pick the right rate limiter based on how the caller authenticated.
 * API-key callers get verifierKeyLimiter; JWT callers get verifyLimiter.
 */
function adaptiveLimiter(req, res, next) {
  if (req.verifier) return verifierKeyLimiter(req, res, next);
  return verifyLimiter(req, res, next);
}

/**
 * @swagger
 * /verify/{wallet}:
 *   get:
 *     summary: Public vaccination status verification
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address to verify
 *     responses:
 *       200:
 *         description: Vaccination status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: string
 *                 vaccinated:
 *                   type: boolean
 *                 record_count:
 *                   type: number
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VaccinationRecord'
 *       401:
 *         description: Unauthorized - JWT or API key required
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Contract query failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /verify/:wallet — JWT or verifier API key
router.get(
  '/:wallet',
  validateStellarPublicKey('params', 'wallet', 'wallet'),
  jwtOrApiKey,
  adaptiveLimiter,
  async (req, res) => {
    const { wallet } = req.params;
    const actor = req.verifier ? `apikey:${req.verifier.id}` : (req.user?.wallet ?? 'unknown');

    try {
      const args = [StellarSdk.Address.fromString(wallet).toScVal()];
      const result = await simulateContract('verify_vaccination', args);
      const [vaccinated, records] = StellarSdk.scValToNative(result);

      audit({
        actor,
        action: 'verify.lookup',
        target: wallet,
        result: 'success',
        meta: req.verifier ? { verifier_label: req.verifier.label } : {},
      });

      res.json({ wallet, vaccinated, record_count: records.length, records });
    } catch (err) {
      audit({ actor, action: 'verify.lookup', target: wallet, result: 'failure', meta: { error: err.message } });
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
