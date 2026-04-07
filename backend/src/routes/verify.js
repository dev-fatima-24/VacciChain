const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const { simulateContract } = require('../stellar/soroban');

const router = express.Router();

// GET /verify/:wallet — public, no auth required
router.get('/:wallet', async (req, res) => {
  const { wallet } = req.params;

  try {
    StellarSdk.Keypair.fromPublicKey(wallet);
  } catch {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const args = [StellarSdk.Address.fromString(wallet).toScVal()];
    const result = await simulateContract('verify_vaccination', args);
    const [vaccinated, records] = StellarSdk.scValToNative(result);

    res.json({ wallet, vaccinated, record_count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
