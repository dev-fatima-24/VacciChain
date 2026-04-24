const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const issuerMiddleware = require('../middleware/issuer');
const { validateStellarPublicKey } = require('../middleware/wallet');
const { invokeContract, simulateContract } = require('../stellar/soroban');

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

    res.json({ success: true, token_id: tokenId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
