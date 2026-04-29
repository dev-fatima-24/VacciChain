const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const { invokeContract } = require('../stellar/soroban');
const { resolveContractErrorMessage } = require('../stellar/contractErrors');
const { audit } = require('../middleware/auditLog');

const router = express.Router();

// POST /patient/register — self-register wallet into the on-chain allowlist.
// Requires a valid patient JWT (SEP-10 authenticated).
router.post('/register', authMiddleware, async (req, res) => {
  const { publicKey } = req.user;

  try {
    const args = [StellarSdk.Address.fromString(publicKey).toScVal()];
    await invokeContract(process.env.ADMIN_SECRET_KEY, 'register_patient', args);

    audit({
      actor: publicKey,
      action: 'patient.register',
      target: publicKey,
      result: 'success',
    });

    res.json({ success: true, wallet: publicKey });
  } catch (err) {
    const errorMessage = resolveContractErrorMessage(err);
    audit({
      actor: publicKey,
      action: 'patient.register',
      target: publicKey,
      result: 'failure',
      meta: { error: errorMessage },
    });
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;
