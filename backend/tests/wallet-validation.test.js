const request = require('supertest');
const StellarSdk = require('@stellar/stellar-sdk');
const { jwtFactory, vaccinationRecordFactory } = require('./factories');

jest.mock('../src/stellar/soroban', () => ({
  invokeContract: jest.fn(),
  simulateContract: jest.fn(),
}));

jest.mock('@stellar/stellar-sdk', () => {
  const originalModule = jest.requireActual('@stellar/stellar-sdk');
  return {
    ...originalModule,
    Keypair: originalModule.Keypair,
    scValToNative: jest.fn(),
    Address: {
      ...originalModule.Address,
      fromString: jest.fn((address) => ({
        toScVal: () => ({}),
      })),
    },
  };
});



const { invokeContract, simulateContract } = require('../src/stellar/soroban');



process.env.JWT_SECRET = 'test-jwt-secret';

const app = require('../src/app');

const validPatientWallet = StellarSdk.Keypair.random().publicKey();
const validIssuerWallet = StellarSdk.Keypair.random().publicKey();
const issuerToken = jwtFactory({ publicKey: validIssuerWallet, role: 'issuer' });
const patientToken = jwtFactory({ publicKey: validPatientWallet, role: 'patient' });

// Correct length and G-prefix but invalid checksum
const checksumInvalidWallet = `G${'A'.repeat(55)}`;

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});



describe('Wallet validation — POST /vaccination/issue', () => {
  it('rejects malformed patient_address', async () => {
    const res = await request(app)
      .post('/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken}`)
      .send({
        patient_address: 'not-a-wallet',
        vaccine_name: 'MMR',
        date_administered: '2026-04-23',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      'patient_address must be a valid Stellar public key (G... 56-char base32)'
    );
    expect(invokeContract).not.toHaveBeenCalled();
  });

  it('rejects checksum-invalid patient_address (correct length, bad checksum)', async () => {
    const res = await request(app)
      .post('/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken}`)
      .send({
        patient_address: checksumInvalidWallet,
        vaccine_name: 'MMR',
        date_administered: '2026-04-23',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      'patient_address must be a valid Stellar public key (G... 56-char base32)'
    );
    expect(invokeContract).not.toHaveBeenCalled();
  });

  it('accepts a valid patient_address and mints', async () => {
    invokeContract.mockResolvedValue({ fake: 'scval' });
    StellarSdk.scValToNative.mockReturnValue('token-1');

    const res = await request(app)
      .post('/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken}`)
      .send({
        patient_address: validPatientWallet,
        vaccine_name: 'MMR',
        date_administered: '2026-04-23',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, tokenId: 'token-1' });

    expect(invokeContract).toHaveBeenCalledTimes(1);
  });
});

describe('Wallet validation — GET /vaccination/:wallet', () => {
  it('rejects malformed wallet param', async () => {
    const res = await request(app)
      .get('/vaccination/not-a-wallet')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      'wallet must be a valid Stellar public key (G... 56-char base32)'
    );
    expect(simulateContract).not.toHaveBeenCalled();
  });

  it('rejects checksum-invalid wallet param (correct length, bad checksum)', async () => {
    const res = await request(app)
      .get(`/vaccination/${checksumInvalidWallet}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      'wallet must be a valid Stellar public key (G... 56-char base32)'
    );
    expect(simulateContract).not.toHaveBeenCalled();
  });
});

describe('Wallet validation — GET /verify/:wallet', () => {
  it('rejects malformed wallet param', async () => {
    const res = await request(app).get('/verify/not-a-wallet');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      'wallet must be a valid Stellar public key (G... 56-char base32)'
    );
    expect(simulateContract).not.toHaveBeenCalled();
  });

  it('rejects checksum-invalid wallet param (correct length, bad checksum)', async () => {
    const res = await request(app).get(`/verify/${checksumInvalidWallet}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      'wallet must be a valid Stellar public key (G... 56-char base32)'
    );
    expect(simulateContract).not.toHaveBeenCalled();
  });

  it('accepts a valid wallet and returns vaccination status', async () => {
    const record = vaccinationRecordFactory({ vaccine_name: 'MMR' });
    simulateContract.mockResolvedValue({ fake: 'scval' });
    jest
      .spyOn(StellarSdk, 'scValToNative')
      .mockReturnValue([true, [{ vaccine: record.vaccine_name }]]);

    const res = await request(app)
      .get(`/verify/${validPatientWallet}`)
      .set('Authorization', `Bearer ${patientToken}`);


    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      wallet: validPatientWallet,
      vaccinated: true,
      record_count: 1,
      records: [{ vaccine: record.vaccine_name }],
    });
    expect(simulateContract).toHaveBeenCalledTimes(1);
  });
});
