const jwt = require('jsonwebtoken');

/**
 * Verify JWT and validate that required claims (sub, role, wallet, exp) are present and correct.
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
