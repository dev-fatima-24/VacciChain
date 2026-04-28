const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

// Mock Soroban RPC responses
jest.mock('../src/stellar/soroban', () => ({
  invokeContract: jest.fn().mockResolvedValue({
    result: { ok: null },
    ledger: 1000,
  }),
  getContractState: jest.fn().mockResolvedValue({}),
}));

// Mock SEP-10 functions
jest.mock('../src/stellar/sep10', () => ({
  buildChallenge: jest.fn().mockResolvedValue({
    transaction: 'AAAAAgAAAABIQvkylb3/M+0wTwfqSo7VVV+xopwUcY+KJH31xvEGzgAAAGQAJZf9AAAAAwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAA=',
    nonce: 'test-nonce-123',
  }),
  verifyChallenge: jest.fn((tx, nonce) => {
    if (nonce === 'test-nonce-123') {
      return 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ';
    }
    throw new Error('Invalid nonce');
  }),
}));

describe('Integration Tests - SEP-10 Auth Flow', () => {
  describe('POST /auth/sep10', () => {
    it('should generate a challenge for a valid public key', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({ public_key: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('transaction');
      expect(res.body).toHaveProperty('nonce');
      expect(res.body.nonce).toBe('test-nonce-123');
    });

    it('should reject invalid public key format', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({ public_key: 'invalid-key' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject missing public_key', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/verify', () => {
    it('should issue JWT for valid signed challenge', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({
          transaction: 'AAAAAgAAAABIQvkylb3/M+0wTwfqSo7VVV+xopwUcY+KJH31xvEGzgAAAGQAJZf9AAAAAwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAA=',
          nonce: 'test-nonce-123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('publicKey');
      expect(res.body).toHaveProperty('role');
      expect(res.body.publicKey).toBe('GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');
    });

    it('should reject invalid nonce', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({
          transaction: 'AAAAAgAAAABIQvkylb3/M+0wTwfqSo7VVV+xopwUcY+KJH31xvEGzgAAAGQAJZf9AAAAAwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAA=',
          nonce: 'invalid-nonce',
        });

      expect(res.status).toBe(401);
    });

    it('should reject missing transaction', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({ nonce: 'test-nonce-123' });

      expect(res.status).toBe(400);
    });

    it('should reject missing nonce', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({ transaction: 'some-tx' });

      expect(res.status).toBe(400);
    });
  });
});

describe('Integration Tests - Protected Routes', () => {
  let validToken;
  let issuerToken;

  beforeAll(() => {
    validToken = jwt.sign(
      {
        publicKey: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
        role: 'patient',
        sub: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
        wallet: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    issuerToken = jwt.sign(
      {
        publicKey: process.env.ADMIN_PUBLIC_KEY || 'GADMIN',
        role: 'issuer',
        sub: process.env.ADMIN_PUBLIC_KEY || 'GADMIN',
        wallet: process.env.ADMIN_PUBLIC_KEY || 'GADMIN',
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('GET /vaccination/:wallet', () => {
    it('should reject request without auth header', async () => {
      const res = await request(app)
        .get('/vaccination/GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authorization/i);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/vaccination/GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should accept request with valid token', async () => {
      const res = await request(app)
        .get('/vaccination/GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /vaccination/issue', () => {
    it('should reject request without auth header', async () => {
      const res = await request(app)
        .post('/vaccination/issue')
        .send({
          patient: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
          vaccine_name: 'COVID-19',
          date_administered: '2024-01-15',
        });

      expect(res.status).toBe(401);
    });

    it('should reject patient role (issuer role required)', async () => {
      const res = await request(app)
        .post('/vaccination/issue')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          patient: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
          vaccine_name: 'COVID-19',
          date_administered: '2024-01-15',
        });

      expect(res.status).toBe(403);
    });

    it('should accept issuer role with valid data', async () => {
      const res = await request(app)
        .post('/vaccination/issue')
        .set('Authorization', `Bearer ${issuerToken}`)
        .send({
          patient: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
          vaccine_name: 'COVID-19',
          date_administered: '2024-01-15',
        });

      expect(res.status).toBe(200);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/vaccination/issue')
        .set('Authorization', `Bearer ${issuerToken}`)
        .send({
          patient: 'GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ',
        });

      expect(res.status).toBe(400);
    });
  });
});

describe('Integration Tests - Public Verify Endpoint', () => {
  describe('GET /verify/:wallet', () => {
    it('should accept valid Stellar address', async () => {
      const res = await request(app)
        .get('/verify/GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('vaccinated');
      expect(res.body).toHaveProperty('record_count');
    });

    it('should reject invalid Stellar address', async () => {
      const res = await request(app)
        .get('/verify/invalid-address');

      expect(res.status).toBe(400);
    });

    it('should not require authentication', async () => {
      const res = await request(app)
        .get('/verify/GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTBYICQJ2JTLU5VTDA7LUYXJQ');

      expect(res.status).toBe(200);
    });
  });
});

describe('Integration Tests - Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app)
      .get('/unknown-route');

    expect(res.status).toBe(404);
  });

  it('should handle malformed JSON', async () => {
    const res = await request(app)
      .post('/auth/sep10')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(res.status).toBe(400);
  });
});
