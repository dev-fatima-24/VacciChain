// Set required env vars before any module is loaded in tests
process.env.STELLAR_NETWORK = 'testnet';
process.env.HORIZON_URL = 'https://horizon-testnet.stellar.org';
process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
process.env.VACCINATIONS_CONTRACT_ID = 'CTEST000000000000000000000000000000000000000000000000000';
process.env.ADMIN_SECRET_KEY = 'STEST000000000000000000000000000000000000000000000000000';
process.env.SEP10_SERVER_KEY = 'STEST000000000000000000000000000000000000000000000000001';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
