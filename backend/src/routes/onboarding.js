/**
 * Issuer onboarding routes.
 *
 * POST /v1/onboarding/apply       — healthcare provider submits application (requires patient/issuer JWT)
 * GET  /v1/onboarding/applications — admin lists all applications (admin JWT required)
 * POST /v1/onboarding/applications/:id/review — admin approves or rejects (admin JWT required)
 */

const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { audit } = require('../middleware/auditLog');
const { addIssuer } = require('../stellar/soroban');
const {
  insertIssuerApplication,
  getIssuerApplication,
  listIssuerApplications,
  updateIssuerApplicationStatus,
} = require('../indexer/db');

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user?.role !== 'issuer') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

const applySchema = z.object({
  name:           z.string().min(2).max(120),
  license_number: z.string().min(1).max(60),
  country:        z.string().min(2).max(60),
  wallet:         z.string().min(56).max(56),
});

const reviewSchema = z.object({
  decision:      z.enum(['approved', 'rejected']),
  reviewer_note: z.string().max(500).optional(),
});

/**
 * POST /onboarding/apply
 * Any authenticated user can submit an onboarding request.
 */
router.post('/apply', authMiddleware, validate(applySchema), async (req, res) => {
  const { name, license_number, country, wallet } = req.body;

  // Prevent duplicate applications from the same wallet
  const existing = listIssuerApplications().find(a => a.wallet === wallet && a.status === 'pending');
  if (existing) {
    return res.status(409).json({ error: 'A pending application already exists for this wallet.' });
  }

  const id = crypto.randomUUID();
  insertIssuerApplication({ id, wallet, name, license_number, country, submitted_at: new Date().toISOString() });

  audit({ actor: req.user.wallet, action: 'onboarding.apply', result: 'submitted', meta: { id, wallet } });

  res.status(201).json({ id, status: 'pending', message: 'Application submitted. You will be notified of the outcome.' });
});

/**
 * GET /onboarding/applications
 * Admin only — list all applications, optionally filtered by status.
 */
router.get('/applications', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.query;
  const allowed = ['pending', 'approved', 'rejected'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  res.json(listIssuerApplications({ status }));
});

/**
 * POST /onboarding/applications/:id/review
 * Admin only — approve or reject an application.
 * On approval, the wallet is added to the contract issuer allowlist.
 */
router.post('/applications/:id/review', authMiddleware, adminOnly, validate(reviewSchema), async (req, res) => {
  const application = getIssuerApplication(req.params.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  if (application.status !== 'pending') {
    return res.status(409).json({ error: `Application is already ${application.status}` });
  }

  const { decision, reviewer_note } = req.body;

  if (decision === 'approved') {
    try {
      await addIssuer(application.wallet);
    } catch (err) {
      return res.status(502).json({ error: `Contract call failed: ${err.message}` });
    }
  }

  updateIssuerApplicationStatus(req.params.id, { status: decision, reviewer_note });

  audit({
    actor: req.user.wallet,
    action: `onboarding.${decision}`,
    result: decision,
    meta: { applicationId: req.params.id, applicantWallet: application.wallet },
  });

  res.json({ id: req.params.id, status: decision, wallet: application.wallet });
});

module.exports = router;
