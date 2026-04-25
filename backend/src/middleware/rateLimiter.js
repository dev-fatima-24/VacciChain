const rateLimit = require('express-rate-limit');

const make = (maxEnvVar, defaultMax) =>
  rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env[maxEnvVar] ?? defaultMax, 10),
    standardHeaders: true,  // sends Retry-After
    legacyHeaders: false,
    handler: (_req, res, _next, options) =>
      res.status(429).json({ error: 'Too many requests', retryAfter: options.windowMs / 1000 }),
  });

module.exports = {
  verifyLimiter: make('RATE_LIMIT_VERIFY', 60),
  sep10Limiter:  make('RATE_LIMIT_SEP10', 10),
};
