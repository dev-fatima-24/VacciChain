/**
 * API versioning middleware.
 * Adds API-Version header to all responses.
 * When a version is sunset, adds Deprecation header.
 */
const CURRENT_VERSION = '1';
const SUNSET_VERSIONS = {}; // e.g. { '0': 'Sat, 01 Jan 2025 00:00:00 GMT' }

function apiVersion(req, res, next) {
  res.setHeader('API-Version', CURRENT_VERSION);
  const requestedVersion = req.params.version;
  if (requestedVersion && SUNSET_VERSIONS[requestedVersion]) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', SUNSET_VERSIONS[requestedVersion]);
  }
  next();
}

module.exports = apiVersion;
