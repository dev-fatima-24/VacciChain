/**
 * Unit tests for backend/src/middleware/issuer.js (Issue #97)
 *
 * Covers:
 * - Authorized issuer passes through
 * - Revoked / unauthorized issuer rejected
 * - Non-issuer role rejected (patient, missing role)
 * - Missing wallet in token rejected
 * - Contract allowlist check error handled gracefully
 */

// Mock the on-chain allowlist check and logger before requiring the middleware
jest.mock('../src/stellar/issuerCache', () => ({
  isAuthorizedIssuer: jest.fn(),
}));

jest.mock('../src/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

const { isAuthorizedIssuer } = require('../src/stellar/issuerCache');
const logger = require('../src/logger');
const issuerMiddleware = require('../src/middleware/issuer');
const StellarSdk = require('@stellar/stellar-sdk');

const WALLET = StellarSdk.Keypair.random().publicKey();

function makeReq(overrides = {}) {
  return {
    user: {
      role: 'issuer',
      wallet: WALLET,
      ...overrides,
    },
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('issuerMiddleware — authorized issuer', () => {
  it('calls next() when role is issuer and wallet is on-chain authorized', async () => {
    isAuthorizedIssuer.mockResolvedValue(true);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(isAuthorizedIssuer).toHaveBeenCalledWith(WALLET);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('accepts wallet from req.user.publicKey when wallet field is absent', async () => {
    isAuthorizedIssuer.mockResolvedValue(true);
    const req = { user: { role: 'issuer', publicKey: WALLET } };
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(isAuthorizedIssuer).toHaveBeenCalledWith(WALLET);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('issuerMiddleware — revoked / unauthorized issuer', () => {
  it('returns 403 when wallet is not authorized on-chain', async () => {
    isAuthorizedIssuer.mockResolvedValue(false);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Issuer authorization revoked or not found on-chain',
    });
    expect(next).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('issuerMiddleware — non-issuer role', () => {
  it('returns 403 when role is patient', async () => {
    const req = makeReq({ role: 'patient' });
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Issuer role required' });
    expect(next).not.toHaveBeenCalled();
    // Should not even reach the on-chain check
    expect(isAuthorizedIssuer).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is undefined', async () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Issuer role required' });
    expect(next).not.toHaveBeenCalled();
    expect(isAuthorizedIssuer).not.toHaveBeenCalled();
  });

  it('returns 403 when role is missing', async () => {
    const req = { user: { wallet: WALLET } };
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Issuer role required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('issuerMiddleware — missing wallet in token', () => {
  it('returns 401 when both wallet and publicKey are absent', async () => {
    const req = { user: { role: 'issuer' } };
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Wallet address missing in token' });
    expect(next).not.toHaveBeenCalled();
    expect(isAuthorizedIssuer).not.toHaveBeenCalled();
  });
});

describe('issuerMiddleware — contract allowlist check error', () => {
  it('returns 500 when isAuthorizedIssuer throws', async () => {
    isAuthorizedIssuer.mockRejectedValue(new Error('RPC timeout'));
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to verify issuer authorization' });
    expect(next).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
