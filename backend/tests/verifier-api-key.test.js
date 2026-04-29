const os      = require('os');
const path    = require('path');
const fs      = require('fs');
const request = require('supertest');
const crypto  = require('crypto');
const { initDb, insertApiKey, revokeApiKey } = require('../src/indexer/db');
const app     = require('../src/app');
const { jwtFactory } = require('./factories');


const tmpDb = path.join(os.tmpdir(), `vaccichain-apikey-test-${Date.now()}.db`);

beforeAll(async () => {
  await initDb(tmpDb);
});

afterAll(() => {
  if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb);
});

// ── helpers ───────────────────────────────────────────────────────────────────

const VALID_WALLET = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

function issuerToken() {
  return jwtFactory({ sub: 'admin', role: 'issuer', wallet: VALID_WALLET });
}


// ── admin API key routes ──────────────────────────────────────────────────────

describe('POST /admin/api-keys', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/admin/api-keys').send({ label: 'Test' });
    expect(res.status).toBe(401);
  });

  it('requires issuer role', async () => {
    const token = jwtFactory({ sub: 'p', role: 'patient', wallet: VALID_WALLET });

    const res = await request(app)
      .post('/admin/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Test' });
    expect(res.status).toBe(403);
  });

  it('rejects missing label', async () => {
    const res = await request(app)
      .post('/admin/api-keys')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/label/);
  });

  it('creates a key and returns it once', async () => {
    const res = await request(app)
      .post('/admin/api-keys')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send({ label: 'School A' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ label: 'School A' });
    expect(typeof res.body.key).toBe('string');
    expect(res.body.key).toHaveLength(64); // 32 bytes hex
    expect(typeof res.body.id).toBe('string');
  });
});

describe('GET /admin/api-keys', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/admin/api-keys');
    expect(res.status).toBe(401);
  });

  it('returns list of keys without raw key value', async () => {
    const res = await request(app)
      .get('/admin/api-keys')
      .set('Authorization', `Bearer ${issuerToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // raw key must never appear in list
    res.body.forEach(k => expect(k.key).toBeUndefined());
    res.body.forEach(k => expect(k.key_hash).toBeUndefined());
  });
});

describe('DELETE /admin/api-keys/:id', () => {
  it('revokes a key', async () => {
    const createRes = await request(app)
      .post('/admin/api-keys')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send({ label: 'To Revoke' });
    expect(createRes.status).toBe(201);
    const { id } = createRes.body;

    const revokeRes = await request(app)
      .delete(`/admin/api-keys/${id}`)
      .set('Authorization', `Bearer ${issuerToken()}`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.revoked).toBe(true);

    // Key should now appear as revoked in list
    const listRes = await request(app)
      .get('/admin/api-keys')
      .set('Authorization', `Bearer ${issuerToken()}`);
    const found = listRes.body.find(k => k.id === id);
    expect(found.revoked).toBeTruthy();
  });
});

// ── verifierApiKey middleware ─────────────────────────────────────────────────

describe('verifierApiKey middleware', () => {
  const verifierApiKey = require('../src/middleware/verifierApiKey');

  function makeReqRes(headerValue) {
    const req = { headers: headerValue !== undefined ? { 'x-api-key': headerValue } : {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
  }

  it('rejects missing header', () => {
    const { req, res, next } = makeReqRes(undefined);
    verifierApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unknown key', () => {
    const { req, res, next } = makeReqRes('unknownkey');
    verifierApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid active key', () => {
    const rawKey  = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const id      = crypto.randomUUID();
    insertApiKey({ id, key_hash: keyHash, label: 'Test', created_at: new Date().toISOString() });

    const { req, res, next } = makeReqRes(rawKey);
    verifierApiKey(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.verifier).toMatchObject({ id, label: 'Test' });
  });

  it('rejects a revoked key', () => {
    const rawKey  = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const id      = crypto.randomUUID();
    insertApiKey({ id, key_hash: keyHash, label: 'Revoked', created_at: new Date().toISOString() });
    revokeApiKey(id);

    const { req, res, next } = makeReqRes(rawKey);
    verifierApiKey(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
