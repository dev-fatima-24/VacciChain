const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('../src/stellar/soroban', () => ({
  invokeContract: jest.fn(),
  simulateContract: jest.fn(),
}));

const { invokeContract } = require('../src/stellar/soroban');

function makeToken(overrides = {}) {
  return jwt.sign(
    { sub: 'GTEST', role: 'patient', wallet: 'GTEST', ...overrides },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('POST /patient/register', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_SECRET_KEY = 'SCZANGBA5RLMPI35IQKZNMHES4NXBS4RVZJBZPAXKZQNQNZ5RX42L72';
    invokeContract.mockResolvedValue({ returnValue: null, hash: 'abc', ledger: 1 });
  });

  afterEach(() => jest.clearAllMocks());

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/patient/register');
    expect(res.status).toBe(401);
  });

  it('registers successfully with a valid patient JWT', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/patient/register')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(invokeContract).toHaveBeenCalledWith(
      process.env.ADMIN_SECRET_KEY,
      'register_patient',
      expect.any(Array)
    );
  });

  it('returns 500 when contract invocation fails', async () => {
    invokeContract.mockRejectedValue(new Error('contract error'));
    const token = makeToken();
    const res = await request(app)
      .post('/patient/register')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('contract error');
  });
});
