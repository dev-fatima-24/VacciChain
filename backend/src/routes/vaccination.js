const express = require('express');
const { z } = require('zod');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const issuerMiddleware = require('../middleware/issuer');
const { validateStellarPublicKey } = require('../middleware/wallet');
const { invokeContract, simulateContract } = require('../stellar/soroban');
const { audit } = require('../middleware/auditLog');
const validate = require('../middleware/validate');
const { hasConsented } = require('../indexer/db');

const router = express.Router();

const issueSchema = z.object({
  patient_address: z.string().refine((val) => {
    try {
      StellarSdk.Address.fromString(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid Stellar address' }),
  vaccine_name: z.string().min(1, 'vaccine_name is required'),
  date_administered: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  dose_number: z.number().int().min(1).optional(),
  dose_series: z.number().int().min(1).optional(),
});

const revokeSchema = z.object({
  token_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

/**
 * @swagger
 * /vaccination/issue:
 *   post:
 *     summary: Issue a vaccination NFT (issuer only)
 *     tags:
 *       - Vaccination
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_address:
 *                 type: string
 *                 description: Stellar address of patient
 *               vaccine_name:
 *                 type: string
 *               date_administered:
 *                 type: string
 *                 format: date-time
 *             required:
 *               - patient_address
 *               - vaccine_name
 *               - date_administered
 *     responses:
 *       200:
 *         description: Vaccination NFT issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tokenId:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *                 ledger:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - issuer role required
 *       500:
 *         description: Contract invocation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /vaccination/issue — mint NFT (issuer only)
router.post(
  '/issue',
  authMiddleware,
  issuerMiddleware,
  validate(issueSchema),
  async (req, res) => {
  const { patient_address, vaccine_name, date_administered, dose_number, dose_series } = req.body;

  // Enforce patient consent unless jurisdiction config waives it
  if (process.env.REQUIRE_PATIENT_CONSENT !== 'false' && !hasConsented(patient_address)) {
    return res.status(403).json({ error: 'Patient has not provided consent. They must consent before a record can be issued.' });
  }

  try {
    const toOptU32 = (v) => v != null
      ? StellarSdk.xdr.ScVal.scvVec([StellarSdk.xdr.ScVal.scvU32(v)])
      : StellarSdk.xdr.ScVal.scvVoid();

    const args = [
      StellarSdk.Address.fromString(patient_address).toScVal(),
      StellarSdk.xdr.ScVal.scvString(vaccine_name),
      StellarSdk.xdr.ScVal.scvString(date_administered),
      StellarSdk.Address.fromString(req.user.publicKey).toScVal(),
      toOptU32(dose_number),
      toOptU32(dose_series),
    ];

    const result = await invokeContract(process.env.ISSUER_SECRET_KEY, 'mint_vaccination', args);
    const tokenId = StellarSdk.scValToNative(result.returnValue);
    const timestamp = new Date().toISOString();

    audit({
      actor: req.user.publicKey,
      action: 'vaccination.issue',
      target: patient_address,
      result: 'success',
      meta: { token_id: tokenId, vaccine_name, date_administered, dose_number, dose_series },
    });

    res.json({
      success: true,
      tokenId,
      transactionHash: result.hash,
      ledger: result.ledger,
      timestamp,
    });
  } catch (err) {
    audit({
      actor: req.user.publicKey,
      action: 'vaccination.issue',
      target: patient_address,
      result: 'failure',
      meta: { error: err.message },
    });
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /vaccination/revoke:
 *   post:
 *     summary: Revoke a vaccination record (issuer only)
 *     tags:
 *       - Vaccination
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token_id:
 *                 type: string
 *                 description: Token ID to revoke
 *             required:
 *               - token_id
 *     responses:
 *       200:
 *         description: Vaccination record revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token_id:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - issuer role required
 *       500:
 *         description: Contract invocation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /vaccination/revoke — revoke a vaccination record (issuer or admin only)
router.post(
  '/revoke',
  authMiddleware,
  issuerMiddleware,
  validate(revokeSchema),
  async (req, res) => {
    const { token_id } = req.body;

    try {
      const args = [
        StellarSdk.xdr.ScVal.scvU64(StellarSdk.xdr.Uint64.fromString(String(token_id))),
        StellarSdk.Address.fromString(req.user.publicKey).toScVal(),
      ];

      await invokeContract(process.env.ISSUER_SECRET_KEY, 'revoke_vaccination', args);

      audit({
        actor: req.user.publicKey,
        action: 'vaccination.revoke',
        target: String(token_id),
        result: 'success',
        meta: { token_id },
      });

      res.json({ success: true, token_id });
    } catch (err) {
      audit({
        actor: req.user.publicKey,
        action: 'vaccination.revoke',
        target: String(token_id),
        result: 'failure',
        meta: { token_id, error: err.message },
      });
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /vaccination/{wallet}:
 *   get:
 *     summary: Fetch all vaccination records for a wallet
 *     tags:
 *       - Vaccination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address
 *     responses:
 *       200:
 *         description: Vaccination records retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: string
 *                 vaccinated:
 *                   type: boolean
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VaccinationRecord'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Contract query failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /vaccination/:wallet — fetch paginated records for a wallet
router.get('/:wallet', authMiddleware, validateStellarPublicKey('params', 'wallet', 'wallet'), async (req, res) => {
  const { wallet } = req.params;

  const rawPage = req.query.page !== undefined ? Number(req.query.page) : 1;
  const rawLimit = req.query.limit !== undefined ? Number(req.query.limit) : 20;

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    return res.status(400).json({ error: 'page must be a positive integer' });
  }
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
    return res.status(400).json({ error: 'limit must be an integer between 1 and 100' });
  }

  try {
    const args = [StellarSdk.Address.fromString(wallet).toScVal()];
    const result = await simulateContract('verify_vaccination', args);
    const [vaccinated, allRecords] = StellarSdk.scValToNative(result);

    const total = allRecords.length;
    const start = (rawPage - 1) * rawLimit;
    const data = allRecords.slice(start, start + rawLimit);

    res.json({ data, total, page: rawPage, limit: rawLimit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
