/**
 * Security Headers Middleware
 * 
 * Adds security headers to all API responses to protect against common web vulnerabilities.
 * These headers complement the frontend Nginx security headers.
 */

/**
 * Middleware to set security headers on API responses.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking by disallowing embedding in frames
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Enable XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy for API responses
  // Restrictive since API only returns JSON
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  
  // Permissions Policy - Disable all browser features for API
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  
  // Note: HSTS (Strict-Transport-Security) should be set by reverse proxy/load balancer in production
  // Uncomment below if backend is directly exposed with HTTPS:
  // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  next();
}

module.exports = securityHeaders;
