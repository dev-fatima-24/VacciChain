const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middleware/auth');

describe('JWT Claims Validation Middleware', () => {
  const JWT_SECRET = 'test-jwt-secret';
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  const createToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET);
  };

  const setAuthHeader = (token) => {
    req.headers.authorization = `Bearer ${token}`;
  };

  it('passes when all required claims are present and valid', () => {
    const payload = {
      sub: 'user123',
      role: 'patient',
      wallet: 'GB...',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    setAuthHeader(createToken(payload));

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });

  it('returns 401 when sub claim is missing', () => {
    const payload = {
      role: 'patient',
      wallet: 'GB...',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    setAuthHeader(createToken(payload));

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or empty claim: sub' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when role claim is missing', () => {
    const payload = {
      sub: 'user123',
      wallet: 'GB...',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    setAuthHeader(createToken(payload));

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or empty claim: role' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when wallet claim is missing', () => {
    const payload = {
      sub: 'user123',
      role: 'patient',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    setAuthHeader(createToken(payload));

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or empty claim: wallet' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when role claim is invalid', () => {
    const payload = {
      sub: 'user123',
      role: 'admin', // invalid role
      wallet: 'GB...',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    setAuthHeader(createToken(payload));

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role claim' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is missing', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    req.headers.authorization = 'Bearer invalid-token';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
