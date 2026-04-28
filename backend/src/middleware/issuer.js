/**
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
function issuerMiddleware(req, res, next) {
  if (req.user?.role !== 'issuer') {
    return res.status(403).json({ error: 'Issuer role required' });
  }
  next();
}

module.exports = issuerMiddleware;
