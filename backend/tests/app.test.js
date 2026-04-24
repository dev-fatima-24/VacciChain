const request = require('supertest');
const app = require('../src/app');

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth routes', () => {
  it('POST /auth/sep10 requires public_key', async () => {
    const res = await request(app).post('/auth/sep10').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/public_key/);
  });

  it('POST /auth/sep10 rejects invalid key', async () => {
    const res = await request(app).post('/auth/sep10').send({ public_key: 'not-a-key' });
    expect(res.status).toBe(400);
  });

  it('POST /auth/verify requires transaction and nonce', async () => {
    const res = await request(app).post('/auth/verify').send({});
    expect(res.status).toBe(400);
  });
});

describe('Vaccination routes', () => {
  it('POST /vaccination/issue requires auth', async () => {
    const res = await request(app).post('/vaccination/issue').send({});
    expect(res.status).toBe(401);
  });

  it('GET /vaccination/:wallet requires auth', async () => {
    const res = await request(app).get('/vaccination/GABC');
    expect(res.status).toBe(401);
  });
});

describe('Verify route', () => {
  it('GET /verify/:wallet rejects invalid address', async () => {
    const res = await request(app).get('/verify/invalid-address');
    expect(res.status).toBe(400);
  });
});