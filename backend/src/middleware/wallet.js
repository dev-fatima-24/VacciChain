const StellarSdk = require('@stellar/stellar-sdk');

const STELLAR_PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;

function validateStellarPublicKey(location, fieldName, label = fieldName) {
  return (req, res, next) => {
    const value = req[location]?.[fieldName];

    if (value === undefined || value === null || value === '') {
      return next();
    }

    if (typeof value !== 'string' || !STELLAR_PUBLIC_KEY_REGEX.test(value)) {
      return res.status(400).json({
        error: `${label} must be a valid Stellar public key (G... 56-char base32)`,
      });
    }

    try {
      StellarSdk.Keypair.fromPublicKey(value);
      next();
    } catch {
      return res.status(400).json({
        error: `${label} must be a valid Stellar public key (G... 56-char base32)`,
      });
    }
  };
}

module.exports = {
  validateStellarPublicKey,
};