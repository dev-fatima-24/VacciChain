'use strict';

/**
 * Admin multi-signature middleware.
 *
 * Critical admin operations (add/revoke issuer, contract upgrade, pause) require
 * M-of-N approvals from registered key holders before the operation is executed.
 *
 * Flow:
 *  1. Initiator submits the operation with their JWT — a pending proposal is created.
 *  2. Each additional key holder calls POST /admin/multisig/approve with the proposal ID.
 *  3. Once M approvals are collected the proposal is marked "approved" and the
 *     original handler is allowed to proceed.
 *  4. Proposals expire after PROPOSAL_TTL_MS (default 1 hour).
 *
 * Configuration (environment variables):
 *  MULTISIG_THRESHOLD   – number of approvals required (M), default 2
 *  MULTISIG_KEY_HOLDERS – comma-separated list of wallet addresses that may approve
 *
 * Storage is in-process (Map). For multi-instance deployments replace with Redis.
 */

const crypto = require('crypto');
const { audit } = require('./auditLog');
const logger = require('../logger');

const PROPOSAL_TTL_MS = parseInt(process.env.MULTISIG_PROPOSAL_TTL_MS || String(60 * 60 * 1000), 10);
const THRESHOLD = parseInt(process.env.MULTISIG_THRESHOLD || '2', 10);

/**
 * Parse the comma-separated key holder list from env.
 * @returns {Set<string>}
 */
function getKeyHolders() {
  const raw = process.env.MULTISIG_KEY_HOLDERS || '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/**
 * @typedef {Object} Proposal
 * @property {string}   id          - UUID
 * @property {string}   operation   - e.g. "add_issuer", "revoke_issuer", "upgrade"
 * @property {Object}   params      - operation parameters (for audit trail)
 * @property {string}   initiator   - wallet address of the initiator
 * @property {Set<string>} approvals - wallet addresses that have approved
 * @property {number}   createdAt   - epoch ms
 * @property {number}   expiresAt   - epoch ms
 * @property {'pending'|'approved'|'expired'} status
 */

/** @type {Map<string, Proposal>} */
const proposals = new Map();

// Purge expired proposals every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, p] of proposals) {
    if (now > p.expiresAt && p.status === 'pending') {
      p.status = 'expired';
      proposals.delete(id);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Create a new multi-sig proposal.
 * The initiator's approval is counted automatically.
 *
 * @param {string} operation
 * @param {Object} params
 * @param {string} initiatorWallet
 * @returns {Proposal}
 */
function createProposal(operation, params, initiatorWallet) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const proposal = {
    id,
    operation,
    params,
    initiator: initiatorWallet,
    approvals: new Set([initiatorWallet]),
    createdAt: now,
    expiresAt: now + PROPOSAL_TTL_MS,
    status: 'pending',
  };
  proposals.set(id, proposal);

  audit({
    actor: initiatorWallet,
    action: `multisig.proposal_created`,
    result: 'pending',
    meta: { proposalId: id, operation, threshold: THRESHOLD },
  });

  logger.info('multisig proposal created', { proposalId: id, operation, initiator: initiatorWallet });
  return proposal;
}

/**
 * Add an approval to an existing proposal.
 * Returns the updated proposal.
 *
 * @param {string} proposalId
 * @param {string} approverWallet
 * @returns {Proposal}
 */
function approveProposal(proposalId, approverWallet) {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error('Proposal not found');
  if (proposal.status !== 'pending') throw new Error(`Proposal is ${proposal.status}`);
  if (Date.now() > proposal.expiresAt) {
    proposal.status = 'expired';
    proposals.delete(proposalId);
    throw new Error('Proposal has expired');
  }

  const keyHolders = getKeyHolders();
  if (keyHolders.size > 0 && !keyHolders.has(approverWallet)) {
    throw new Error('Approver is not a registered key holder');
  }

  proposal.approvals.add(approverWallet);

  audit({
    actor: approverWallet,
    action: 'multisig.approval_added',
    result: 'pending',
    meta: { proposalId, operation: proposal.operation, approvals: proposal.approvals.size, threshold: THRESHOLD },
  });

  if (proposal.approvals.size >= THRESHOLD) {
    proposal.status = 'approved';
    audit({
      actor: approverWallet,
      action: 'multisig.proposal_approved',
      result: 'success',
      meta: { proposalId, operation: proposal.operation },
    });
    logger.info('multisig proposal approved', { proposalId, operation: proposal.operation });
  }

  return proposal;
}

/**
 * Get a proposal by ID (read-only).
 * @param {string} proposalId
 * @returns {Proposal|undefined}
 */
function getProposal(proposalId) {
  return proposals.get(proposalId);
}

/**
 * Express middleware factory.
 *
 * Wraps a critical admin operation with multi-sig enforcement.
 * Usage:
 *   router.post('/issuers', authMiddleware, adminOnly, requireMultiSig('add_issuer'), handler)
 *
 * Request flow:
 *  - If no `proposal_id` in body → create a new proposal, return 202 with proposal details.
 *  - If `proposal_id` present and proposal is approved → allow handler to proceed.
 *  - If `proposal_id` present but not yet approved → return 202 with current approval count.
 *
 * @param {string} operationName - human-readable name for audit logs
 * @returns {import('express').RequestHandler}
 */
function requireMultiSig(operationName) {
  return (req, res, next) => {
    // If threshold is 1 (or 0), skip multi-sig — single admin is sufficient
    if (THRESHOLD <= 1) return next();

    const { proposal_id } = req.body;
    const initiatorWallet = req.user?.wallet;

    if (!proposal_id) {
      // Step 1: create proposal
      const proposal = createProposal(operationName, req.body, initiatorWallet);
      return res.status(202).json({
        message: `Multi-sig required. ${THRESHOLD - 1} more approval(s) needed.`,
        proposal_id: proposal.id,
        approvals: proposal.approvals.size,
        threshold: THRESHOLD,
        expires_at: new Date(proposal.expiresAt).toISOString(),
      });
    }

    // Step 2: check existing proposal
    const proposal = proposals.get(proposal_id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found or expired' });
    }
    if (proposal.status === 'expired') {
      return res.status(410).json({ error: 'Proposal has expired' });
    }
    if (proposal.status !== 'approved') {
      return res.status(202).json({
        message: `Waiting for approvals. ${THRESHOLD - proposal.approvals.size} more needed.`,
        proposal_id: proposal.id,
        approvals: proposal.approvals.size,
        threshold: THRESHOLD,
        expires_at: new Date(proposal.expiresAt).toISOString(),
      });
    }

    // Approved — consume proposal and proceed
    proposals.delete(proposal_id);
    next();
  };
}

module.exports = { requireMultiSig, createProposal, approveProposal, getProposal };
