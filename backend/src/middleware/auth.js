const jwt = require('jsonwebtoken');
const { getVerificationKeys } = require('../jwtKeys');

/**
 * JWT authentication middleware.
 *
 * Supports key rotation: tries the current key first (matched by `kid` header),
 * then falls back to previous keys so tokens issued before a rotation remain
 * valid during the transition window.
 *
 * @param {Object} req - Express request object
 * @param {string} req.headers.authorization - Bearer token (format: "Bearer <token>")
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(7);

  // Decode header to find the kid, then try matching key first for efficiency.
  // Fall back to trying all valid keys so tokens issued before rotation still work.
  const keys = getVerificationKeys();
  let decoded = null;

  // Attempt to read kid from token header without verifying (safe — we verify below)
  let preferredKid = null;
  try {
    const unverified = jwt.decode(token, { complete: true });
    preferredKid = unverified?.header?.kid || null;
  } catch (_) {
    // ignore — we'll try all keys
  }

  // Sort keys so the one matching kid is tried first
  const ordered = preferredKid
    ? [...keys].sort((a) => (a.kid === preferredKid ? -1 : 1))
    : keys;

  for (const key of ordered) {
    try {
      decoded = jwt.verify(token, key.secret);
      break;
    } catch (_) {
      // try next key
    }
  }

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

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
}

module.exports = authMiddleware;
