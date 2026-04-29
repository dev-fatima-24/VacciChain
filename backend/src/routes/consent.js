const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getConsent, recordConsent, hasConsented } = require('../indexer/db');

const router = express.Router();

/**
 * GET /patient/consent/:wallet
 * Returns consent status for a wallet. Public — used by issuers before minting.
 */
router.get('/consent/:wallet', (req, res) => {
  const { wallet } = req.params;
  const consent = getConsent(wallet);
  res.json({ wallet, consented: !!consent, consented_at: consent?.consented_at ?? null });
});

/**
 * POST /patient/consent
 * Record explicit patient consent. Requires patient JWT.
 */
router.post('/consent', authMiddleware, (req, res) => {
  const { publicKey } = req.user;
  if (getConsent(publicKey)) {
    return res.json({ success: true, wallet: publicKey, already_consented: true });
  }
  recordConsent(publicKey);
  res.status(201).json({ success: true, wallet: publicKey });
});

module.exports = router;
