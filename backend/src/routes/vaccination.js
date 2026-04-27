const express = require('express');
const { z } = require('zod');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const issuerMiddleware = require('../middleware/issuer');
const { validateStellarPublicKey } = require('../middleware/wallet');
const { invokeContract, simulateContract } = require('../stellar/soroban');
const { audit } = require('../middleware/auditLog');
const validate = require('../middleware/validate');

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
});

const revokeSchema = z.object({
  token_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

// POST /vaccination/issue — mint NFT (issuer only)
router.post(
  '/issue',
  authMiddleware,
  issuerMiddleware,
  validate(issueSchema),
  async (req, res) => {
  const { patient_address, vaccine_name, date_administered } = req.body;

  try {
    const args = [
      StellarSdk.Address.fromString(patient_address).toScVal(),
      StellarSdk.xdr.ScVal.scvString(vaccine_name),
      StellarSdk.xdr.ScVal.scvString(date_administered),
      StellarSdk.Address.fromString(req.user.publicKey).toScVal(),
    ];

    const result = await invokeContract(process.env.ISSUER_SECRET_KEY, 'mint_vaccination', args);
    const tokenId = StellarSdk.scValToNative(result.returnValue);
    const timestamp = new Date().toISOString();

    audit({
      actor: req.user.publicKey,
      action: 'vaccination.issue',
      target: patient_address,
      result: 'success',
      meta: { token_id: tokenId, vaccine_name, date_administered },
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

// GET /vaccination/:wallet — fetch all records for a wallet
router.get('/:wallet', authMiddleware, validateStellarPublicKey('params', 'wallet', 'wallet'), async (req, res) => {
  const { wallet } = req.params;

  try {
    const args = [StellarSdk.Address.fromString(wallet).toScVal()];
    const result = await simulateContract('verify_vaccination', args);
    const [vaccinated, records] = StellarSdk.scValToNative(result);

    res.json({ wallet, vaccinated, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
