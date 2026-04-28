const request = require('supertest');

describe('CORS', () => {
  const ALLOWED = 'http://localhost:3000';
  const BLOCKED = 'https://evil.example.com';

  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env.ALLOWED_ORIGINS = ALLOWED;
    app = require('../src/app');
  });

  it('allows requests from an allowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', ALLOWED);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('blocks requests from a disallowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', BLOCKED);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('handles preflight for allowed origin', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('sets credentials header for allowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', ALLOWED);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('supports multiple allowed origins', async () => {
    jest.resetModules();
    process.env.ALLOWED_ORIGINS = `${ALLOWED},https://admin.example.com`;
    const multiApp = require('../src/app');

    const res = await request(multiApp).get('/health').set('Origin', 'https://admin.example.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://admin.example.com');
  });
});
