const jwt = require('jsonwebtoken');
const StellarSdk = require('@stellar/stellar-sdk');

/**
 * Generates a mock JWT for testing.
 * @param {Object} overrides - Payload overrides.
 * @returns {string} A signed JWT.
 */
const jwtFactory = (overrides = {}) => {
  const publicKey = overrides.publicKey || overrides.wallet || StellarSdk.Keypair.random().publicKey();
  const payload = {
    sub: overrides.sub || publicKey,
    role: overrides.role || 'patient',
    wallet: publicKey,
    publicKey: publicKey, // Including both for compatibility with existing tests/code
    ...overrides
  };
  
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  const options = { expiresIn: '1h' };
  
  return jwt.sign(payload, secret, options);
};

module.exports = jwtFactory;
