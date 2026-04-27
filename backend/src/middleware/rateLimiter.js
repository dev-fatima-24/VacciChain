const rateLimit = require('express-rate-limit');

const make = (maxEnvVar, defaultMax, keyGen) =>
  rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env[maxEnvVar] ?? defaultMax, 10),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGen,
    handler: (_req, res, _next, options) =>
      res.status(429).json({ error: 'Too many requests', retryAfter: options.windowMs / 1000 }),
  });

module.exports = {
  verifyLimiter:    make('RATE_LIMIT_VERIFY', 60),
  sep10Limiter:     make('RATE_LIMIT_SEP10', 10),
  // Keyed by verifier API key id so each third-party has its own bucket
  verifierKeyLimiter: make('RATE_LIMIT_VERIFIER_KEY', 120, (req) => req.verifier?.id ?? req.ip),
};
