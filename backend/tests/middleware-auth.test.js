/**
 * Unit tests for backend/src/middleware/auth.js (Issue #97)
 *
 * Covers:
 * - Valid JWT passes through
 * - Expired JWT rejected
 * - Missing JWT rejected
 * - Wrong role rejected
 * - Missing required claims rejected
 * - Invalid token format rejected
 */

const jwt = require('jsonwebtoken');

// Mock jwtKeys before requiring auth middleware
jest.mock('../src/jwtKeys', () => ({
  getVerificationKeys: jest.fn(),
}));

const { getVerificationKeys } = require('../src/jwtKeys');
const authMiddleware = require('../src/middleware/auth');

const SECRET = 'test-secret-key';
const StellarSdk = require('@stellar/stellar-sdk');
const WALLET = StellarSdk.Keypair.random().publicKey();

function makeReq(token) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

function signToken(payload, secret = SECRET, options = {}) {
  return jwt.sign(payload, secret, { expiresIn: '1h', ...options });
}

const validPayload = () => ({
  sub: WALLET,
  role: 'patient',
  wallet: WALLET,
  exp: Math.floor(Date.now() / 1000) + 3600,
});

beforeEach(() => {
  jest.clearAllMocks();
  getVerificationKeys.mockReturnValue([{ kid: 'k1', secret: SECRET }]);
});

describe('authMiddleware — valid JWT', () => {
  it('calls next() and sets req.user for a valid patient token', () => {
    const token = signToken(validPayload());
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ role: 'patient', wallet: WALLET });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for a valid issuer token', () => {
    const token = signToken({ ...validPayload(), role: 'issuer' });
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('issuer');
  });

  it('tries matching kid key first, then falls back to other keys', () => {
    const altSecret = 'alt-secret';
    getVerificationKeys.mockReturnValue([
      { kid: 'k1', secret: SECRET },
      { kid: 'k2', secret: altSecret },
    ]);
    // Sign with the second key
    const token = jwt.sign(validPayload(), altSecret, { keyid: 'k2' });
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('authMiddleware — missing / malformed header', () => {
  it('returns 401 when Authorization header is absent', () => {
    const req = makeReq(null);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Token abc123' } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a completely invalid token string', () => {
    const req = makeReq('not.a.jwt');
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authMiddleware — expired JWT', () => {
  it('returns 401 for an expired token', () => {
    const token = signToken(validPayload(), SECRET, { expiresIn: '-1s' });
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when signed with an unknown secret', () => {
    const token = signToken(validPayload(), 'wrong-secret');
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authMiddleware — missing required claims', () => {
  it('returns 401 when sub claim is missing', () => {
    const { sub: _sub, ...payload } = validPayload();
    const token = signToken(payload);
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or empty claim: sub' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when role claim is missing', () => {
    const { role: _role, ...payload } = validPayload();
    const token = signToken(payload);
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or empty claim: role' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when wallet claim is missing', () => {
    const { wallet: _wallet, ...payload } = validPayload();
    const token = signToken(payload);
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or empty claim: wallet' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authMiddleware — wrong role', () => {
  it('returns 401 for an unrecognized role value', () => {
    const token = signToken({ ...validPayload(), role: 'admin' });
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role claim' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an empty role value', () => {
    const token = signToken({ ...validPayload(), role: '' });
    const req = makeReq(token);
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Empty string is falsy — caught by the missing-claim check
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
