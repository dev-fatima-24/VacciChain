const { isAuthorizedIssuer } = require('../stellar/issuerCache');
const logger = require('../logger');

/**
 * Require the authenticated user to have the 'issuer' role AND 
 * verify their wallet is currently authorized on-chain.
 * Must be used after authMiddleware.
 * Issuer role authorization middleware.
 *
 * Verifies that the authenticated user has the 'issuer' role.
 * Must be used after authMiddleware to ensure req.user is populated.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Decoded JWT payload (set by authMiddleware)
 * @param {string} req.user.role - User role ('patient' or 'issuer')
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Calls next() if user has 'issuer' role, sends 403 response otherwise
 *
 * @throws {Error} 403 - User does not have 'issuer' role
 *
 * @side-effects None
 */
async function issuerMiddleware(req, res, next) {
  if (req.user?.role !== 'issuer') {
    return res.status(403).json({ error: 'Issuer role required' });
  }

  const wallet = req.user.wallet || req.user.publicKey;
  if (!wallet) {
    return res.status(401).json({ error: 'Wallet address missing in token' });
  }

  try {
    const isAuthorized = await isAuthorizedIssuer(wallet);
    if (!isAuthorized) {
      logger.warn('Unauthorized issuer attempt', { wallet });
      return res.status(403).json({ error: 'Issuer authorization revoked or not found on-chain' });
    }
    next();
  } catch (error) {
    logger.error('Error verifying issuer allowlist', { wallet, error: error.message });
    res.status(500).json({ error: 'Failed to verify issuer authorization' });
  }
}

module.exports = issuerMiddleware;
