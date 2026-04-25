const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// { key -> { status, body, expiresAt } }
const store = new Map();

// Prune expired entries on each request (lazy GC)
function prune() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // missing key — not idempotent, pass through

  prune();

  const cached = store.get(key);
  if (cached) {
    return res.status(cached.status).json(cached.body);
  }

  // Intercept res.json to cache the first response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) {
      store.set(key, { status: res.statusCode, body, expiresAt: Date.now() + TTL_MS });
    }
    return originalJson(body);
  };

  next();
}

module.exports = idempotency;
