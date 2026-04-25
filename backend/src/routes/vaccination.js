const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const issuerMiddleware = require('../middleware/issuer');
const { validateStellarPublicKey } = require('../middleware/wallet');
const { invokeContract, simulateContract } = require('../stellar/soroban');
const { audit } = require('../middleware/auditLog');

const router = express.Router();

// POST /vaccination/issue — mint NFT (issuer only)
router.post(
  '/issue',
  authMiddleware,
  issuerMiddleware,
  validateStellarPublicKey('body', 'patient_address'),
  async (req, res) => {
  const { patient_address, vaccine_name, date_administered } = req.body;

  if (!patient_address || !vaccine_name || !date_administered) {
    return res.status(400).json({ error: 'patient_address, vaccine_name, date_administered required' });
  }

  try {
    const args = [
      StellarSdk.Address.fromString(patient_address).toScVal(),
      StellarSdk.xdr.ScVal.scvString(vaccine_name),
      StellarSdk.xdr.ScVal.scvString(date_administered),
      StellarSdk.Address.fromString(req.user.publicKey).toScVal(),
    ];

    const result = await invokeContract(process.env.ISSUER_SECRET_KEY, 'mint_vaccination', args);
    const tokenId = StellarSdk.scValToNative(result);

    audit({
      actor: req.user.publicKey,
      action: 'vaccination.issue',
      target: patient_address,
      result: 'success',
      meta: { token_id: tokenId, vaccine_name, date_administered },
    });

    res.json({ success: true, token_id: tokenId });
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
  async (req, res) => {
    const { token_id } = req.body;

    if (token_id === undefined || token_id === null) {
      return res.status(400).json({ error: 'token_id required' });
    }

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
