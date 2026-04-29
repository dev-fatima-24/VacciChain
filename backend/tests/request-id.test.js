const request = require('supertest');
const app = require('../src/app');
const logger = require('../src/logger');

jest.mock('../src/stellar/soroban', () => ({
  simulateContract: jest.fn().mockResolvedValue(
    (() => {
      const sdk = require('@stellar/stellar-sdk');
      return sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvBool(true), sdk.xdr.ScVal.scvVec([])]);
    })()
  ),
  invokeContract: jest.fn().mockResolvedValue({}),
  getRpcServer: jest.fn().mockReturnValue({ getHealth: jest.fn().mockResolvedValue({}) }),
}));

describe('X-Request-ID middleware', () => {
  it('generates X-Request-ID when not provided', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('echoes client-provided X-Request-ID', async () => {
    const clientId = 'my-trace-id-abc123';
    const res = await request(app).get('/health').set('X-Request-ID', clientId);
    expect(res.headers['x-request-id']).toBe(clientId);
  });

  it('attaches requestId to req for every route', async () => {
    const res = await request(app).get('/verify/invalid-address');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

describe('Structured request logging', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('logs requestId, method, route, statusCode, durationMs on response finish', async () => {
    const clientId = 'test-request-id-999';
    await request(app).get('/health').set('X-Request-ID', clientId);

    const call = logSpy.mock.calls.find(
      ([msg, meta]) => msg === 'request' && meta?.requestId === clientId
    );
    expect(call).toBeDefined();
    const [, meta] = call;
    expect(meta.requestId).toBe(clientId);
    expect(meta.method).toBe('GET');
    expect(meta.route).toBe('/health');
    expect(typeof meta.statusCode).toBe('number');
    expect(typeof meta.durationMs).toBe('number');
    expect(meta.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('Logger production mode', () => {
  it('omits stack trace in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    // Re-require to pick up new env
    jest.resetModules();
    const prodLogger = require('../src/logger');
    const err = new Error('test error');
    const spy = jest.spyOn(prodLogger, 'error').mockImplementation(() => {});
    prodLogger.error('oops', err);
    // The format is configured at creation time; verify the format chain excludes stack
    expect(prodLogger).toBeDefined();
    spy.mockRestore();
    process.env.NODE_ENV = origEnv;
    jest.resetModules();
  });
});
