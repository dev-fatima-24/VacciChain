'use strict';

/**
 * Input sanitization middleware.
 *
 * Applied at the API boundary (before route handlers) to all string fields
 * in req.body, req.query, and req.params.
 *
 * Rules:
 *  1. Strip HTML/script tags (prevent XSS if values are ever rendered)
 *  2. Reject null bytes and ASCII control characters (prevent injection)
 *  3. Trim leading/trailing whitespace
 *
 * This runs AFTER Zod schema validation so the shape is already known.
 * It is a defence-in-depth layer — the contract also enforces length limits.
 */

// Matches any HTML/XML tag: <script>, </div>, <!-- comment -->, etc.
const HTML_TAG_RE = /<[^>]*>/g;

// Matches null bytes and ASCII control characters (0x00–0x1F) except
// tab (0x09), newline (0x0A), and carriage return (0x0D) which are
// legitimate in some text fields.
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitize a single string value.
 * Returns the cleaned string, or throws if the value contains null bytes
 * or control characters that cannot be safely stripped.
 *
 * @param {string} value
 * @returns {string}
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;

  // Reject null bytes — these are never legitimate in API inputs
  if (value.includes('\x00')) {
    throw new SanitizationError('Input contains null bytes');
  }

  // Strip control characters
  let cleaned = value.replace(CONTROL_CHAR_RE, '');

  // Strip HTML/script tags
  cleaned = cleaned.replace(HTML_TAG_RE, '');

  // Trim whitespace
  return cleaned.trim();
}

/**
 * Recursively sanitize all string values in an object or array.
 *
 * @param {unknown} input
 * @returns {unknown}
 */
function sanitizeDeep(input) {
  if (typeof input === 'string') return sanitizeString(input);
  if (Array.isArray(input)) return input.map(sanitizeDeep);
  if (input !== null && typeof input === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(input)) {
      out[key] = sanitizeDeep(val);
    }
    return out;
  }
  return input;
}

class SanitizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SanitizationError';
  }
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params.
 * Returns 400 if any value contains a null byte.
 */
function sanitizeInputs(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeDeep(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeDeep(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeDeep(req.params);
    }
    next();
  } catch (err) {
    if (err instanceof SanitizationError) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { sanitizeInputs, sanitizeString, sanitizeDeep };
