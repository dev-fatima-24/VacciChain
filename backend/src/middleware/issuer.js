/**
 * Require the authenticated user to have the 'issuer' role.
 * Must be used after authMiddleware.
 */
function issuerMiddleware(req, res, next) {
  if (req.user?.role !== 'issuer') {
    return res.status(403).json({ error: 'Issuer role required' });
  }
  next();
}

module.exports = issuerMiddleware;
