const request = require('supertest');
const app = require('../src/app');

describe('Body size limit', () => {
  it('returns 413 when JSON body exceeds limit', async () => {
    const large = { data: 'x'.repeat(11 * 1024) }; // > 10 kb
    const res = await request(app).post('/auth/sep10').send(large);
    expect(res.status).toBe(413);
  });

  it('accepts requests within the limit', async () => {
    const small = { public_key: 'GABC' };
    const res = await request(app).post('/auth/sep10').send(small);
    expect(res.status).not.toBe(413);
  });
});
