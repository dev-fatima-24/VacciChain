const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 *
 * Verifies the JWT token from the Authorization header and validates required claims.
 * Attaches the decoded token to req.user for use in route handlers.
 *
 * @param {Object} req - Express request object
 * @param {string} req.headers.authorization - Bearer token (format: "Bearer <token>")
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Calls next() on success, sends 401 response on failure
 *
 * @throws {Error} 401 - Missing authorization header
 * @throws {Error} 401 - Invalid or expired token
 * @throws {Error} 401 - Missing required claim (sub, role, wallet, exp)
 * @throws {Error} 401 - Invalid role claim (must be 'patient' or 'issuer')
 *
 * @side-effects Sets req.user to the decoded JWT payload on success
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate required claims
    const requiredClaims = ['sub', 'role', 'wallet', 'exp'];
    for (const claim of requiredClaims) {
      if (!decoded[claim]) {
        return res.status(401).json({ error: `Missing or empty claim: ${claim}` });
      }
    }

    // Validate role value
    if (!['patient', 'issuer'].includes(decoded.role)) {
      return res.status(401).json({ error: 'Invalid role claim' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
