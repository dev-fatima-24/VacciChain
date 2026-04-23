const express = require('express');
const jwt = require('jsonwebtoken');
const StellarSdk = require('@stellar/stellar-sdk');
const { buildChallenge, verifyChallenge } = require('../stellar/sep10');

const router = express.Router();

// POST /auth/sep10 — generate challenge
router.post('/sep10', async (req, res) => {
  const { public_key } = req.body;
  if (!public_key) return res.status(400).json({ error: 'public_key required' });

  try {
    StellarSdk.Keypair.fromPublicKey(public_key); // validate format
  } catch {
    return res.status(400).json({ error: 'Invalid Stellar public key' });
  }

  try {
    const { transaction, nonce } = await buildChallenge(public_key);
    res.json({ transaction, nonce });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/verify — verify signed challenge, issue JWT
router.post('/verify', (req, res) => {
  const { transaction, nonce } = req.body;
  if (!transaction || !nonce) {
    return res.status(400).json({ error: 'transaction and nonce required' });
  }

  try {
    const publicKey = verifyChallenge(transaction, nonce);

    const role = publicKey === process.env.ADMIN_PUBLIC_KEY ? 'issuer' : 'patient';

    const token = jwt.sign(
      { publicKey, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, publicKey, role });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
