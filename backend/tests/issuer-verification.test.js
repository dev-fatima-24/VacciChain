const { isAuthorizedIssuer, invalidateCache } = require('../src/stellar/issuerCache');
const issuerMiddleware = require('../src/middleware/issuer');
const { simulateContract } = require('../src/stellar/soroban');
const StellarSdk = require('@stellar/stellar-sdk');

jest.mock('../src/stellar/soroban');

describe('Issuer Verification & Caching', () => {
  const wallet = 'GD6W6X66Z3ND66Z3D7S3Y3A6S2Z6Z2Z6Z2Z6Z2Z6Z2Z6Z2Z6Z2Z6Z2Z'; // Still invalid length
  // Let's use a real one
  const validWallet = 'GDE76K45763M6HEDT26F5D3M5C3U4U5M6X2Z6Z2Z6Z2Z6Z2Z6Z2Z6Z2Z'; // Still not valid
  // I'll use a known valid testnet address format
  const testWallet = 'GB7V7Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57'; // 56 chars
  const realTestWallet = 'GB7V7Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57Z57'; // Actually, let's just use any 56-char G... address
  const gAddress = StellarSdk.Keypair.random().publicKey();

  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache(); // clear all
  });

  it('isAuthorizedIssuer calls simulateContract and caches result', async () => {
    simulateContract.mockResolvedValue(StellarSdk.xdr.ScVal.scvBool(true));
    
    const res1 = await isAuthorizedIssuer(gAddress);
    expect(res1).toBe(true);
    expect(simulateContract).toHaveBeenCalledTimes(1);

    const res2 = await isAuthorizedIssuer(gAddress);
    expect(res2).toBe(true);
    expect(simulateContract).toHaveBeenCalledTimes(1);
  });

  it('invalidateCache clears the cached value', async () => {
    simulateContract.mockResolvedValue(StellarSdk.xdr.ScVal.scvBool(true));
    
    await isAuthorizedIssuer(gAddress);
    expect(simulateContract).toHaveBeenCalledTimes(1);

    invalidateCache(gAddress);

    await isAuthorizedIssuer(gAddress);
    expect(simulateContract).toHaveBeenCalledTimes(2);
  });

  it('issuerMiddleware blocks unauthorized issuers', async () => {
    simulateContract.mockResolvedValue(StellarSdk.xdr.ScVal.scvBool(false));
    
    const req = {
      user: { role: 'issuer', wallet: gAddress }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Issuer authorization revoked or not found on-chain' });
    expect(next).not.toHaveBeenCalled();
  });

  it('issuerMiddleware allows authorized issuers', async () => {
    simulateContract.mockResolvedValue(StellarSdk.xdr.ScVal.scvBool(true));
    
    const req = {
      user: { role: 'issuer', wallet: gAddress }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('issuerMiddleware blocks non-issuer role even if authorized on-chain', async () => {
    const req = {
      user: { role: 'patient', wallet: gAddress }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    await issuerMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Issuer role required' });
    expect(next).not.toHaveBeenCalled();
    expect(simulateContract).not.toHaveBeenCalled();
  });
});
