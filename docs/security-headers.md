# Security Headers Documentation

## Overview

VacciChain implements comprehensive security headers to protect against common web vulnerabilities including XSS (Cross-Site Scripting), clickjacking, MIME sniffing, and other attacks. This is especially critical for a blockchain application that handles wallet interactions and sensitive health data.

## Implemented Security Headers

### 1. Content-Security-Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded and executed.

**Frontend Configuration** (Nginx):
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://horizon.stellar.org https://soroban.stellar.org; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self';
```

**Backend Configuration**:
```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

**Why This Matters for VacciChain**:
- Prevents malicious scripts from intercepting Freighter wallet signing prompts
- Blocks unauthorized connections to external APIs
- Protects against injection attacks that could steal vaccination records

**Production Notes**:
- `unsafe-inline` is used for React inline styles in development
- Consider using a CSS-in-JS solution or nonces to remove `unsafe-inline` in production
- `connect-src` explicitly allows Stellar Horizon and Soroban RPC endpoints

### 2. X-Frame-Options

**Value**: `DENY`

**Purpose**: Prevents clickjacking attacks by disallowing the page to be embedded in frames/iframes.

**Why This Matters for VacciChain**:
- Prevents attackers from overlaying fake UI elements on top of wallet signing prompts
- Protects against UI redressing attacks that could trick users into signing malicious transactions

### 3. X-Content-Type-Options

**Value**: `nosniff`

**Purpose**: Prevents browsers from MIME-sniffing responses, forcing them to respect the declared Content-Type.

**Why This Matters for VacciChain**:
- Prevents browsers from interpreting JSON responses as HTML/JavaScript
- Blocks attacks where malicious content is disguised with incorrect MIME types

### 4. Referrer-Policy

**Value**: `strict-origin-when-cross-origin`

**Purpose**: Controls how much referrer information is sent with requests.

**Behavior**:
- Same-origin requests: Full URL is sent
- Cross-origin requests: Only origin (no path/query) is sent
- HTTPS → HTTP: No referrer is sent

**Why This Matters for VacciChain**:
- Prevents leaking sensitive URLs (e.g., with patient IDs) to external sites
- Maintains privacy while allowing legitimate analytics

### 5. X-XSS-Protection

**Value**: `1; mode=block`

**Purpose**: Enables browser's built-in XSS filter (legacy, but still useful for older browsers).

**Note**: Modern browsers rely on CSP, but this provides defense-in-depth for older browsers.

### 6. Strict-Transport-Security (HSTS)

**Value**: `max-age=31536000; includeSubDomains; preload`

**Purpose**: Forces browsers to only connect via HTTPS.

**Status**: 
- ⚠️ **Disabled in development** (commented out in `nginx.conf`)
- ✅ **Enabled in production** (`nginx.production.conf`)

**Why This Matters for VacciChain**:
- Prevents man-in-the-middle attacks
- Protects wallet private keys and authentication tokens in transit
- Critical for mainnet deployment

**Production Deployment**:
1. Ensure HTTPS is working properly
2. Test with a short `max-age` first (e.g., 300 seconds)
3. Gradually increase to 31536000 (1 year)
4. Consider HSTS preloading: https://hstspreload.org/

### 7. Permissions-Policy

**Value**: `geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()`

**Purpose**: Disables unnecessary browser features to reduce attack surface.

**Why This Matters for VacciChain**:
- VacciChain doesn't need geolocation, camera, or other device features
- Reduces risk of permission-based attacks
- Improves privacy

## Configuration Files

### Frontend (Nginx)

**Development**: `frontend/nginx.conf`
- Includes `unsafe-inline` for React development
- HSTS disabled
- Suitable for local development and testnet

**Production**: `frontend/nginx.production.conf`
- Stricter CSP (no `unsafe-inline`)
- HSTS enabled
- Use for mainnet deployment

### Backend (Express)

**Middleware**: `backend/src/middleware/securityHeaders.js`
- Applied to all API responses
- Restrictive CSP for JSON-only API
- Automatically loaded in `app.js`

## Testing Security Headers

### Automated Testing

**Linux/macOS**:
```bash
chmod +x scripts/test-security-headers.sh
./scripts/test-security-headers.sh
```

**Windows**:
```powershell
.\scripts\test-security-headers.ps1
```

**Custom URLs**:
```bash
# Linux/macOS
./scripts/test-security-headers.sh https://staging.vaccichain.com https://api.vaccichain.com

# Windows
.\scripts\test-security-headers.ps1 -FrontendUrl "https://staging.vaccichain.com" -BackendUrl "https://api.vaccichain.com"
```

### Manual Testing

**Using curl**:
```bash
# Frontend
curl -I http://localhost:3000

# Backend
curl -I http://localhost:4000/health
```

**Using browser DevTools**:
1. Open VacciChain in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click on the main document request
6. Check "Response Headers" section

### Online Security Scanners

**SecurityHeaders.com**:
1. Deploy to a publicly accessible URL
2. Visit https://securityheaders.com/
3. Enter your URL
4. Target: Grade A or higher

**Mozilla Observatory**:
1. Visit https://observatory.mozilla.org/
2. Enter your URL
3. Target: A+ rating

**Expected Results**:
- ✅ Content-Security-Policy: Present
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: Present
- ⚠️ Strict-Transport-Security: Only in production with HTTPS

## Common Issues and Solutions

### Issue: CSP Blocks Inline Scripts

**Symptom**: Console errors like "Refused to execute inline script"

**Solution**:
1. Move inline scripts to external `.js` files
2. Use nonces or hashes for necessary inline scripts
3. For React: Use styled-components or CSS modules instead of inline styles

### Issue: CSP Blocks External Resources

**Symptom**: Images, fonts, or API calls fail to load

**Solution**:
1. Add the domain to the appropriate CSP directive
2. Example: `img-src 'self' https://trusted-cdn.com`
3. Be specific - avoid using wildcards like `*`

### Issue: Freighter Wallet Not Working

**Symptom**: Wallet connection or signing fails

**Solution**:
1. Ensure `connect-src` includes Stellar endpoints
2. Check browser console for CSP violations
3. Freighter injects scripts - may need `script-src` adjustments

### Issue: HSTS Errors in Development

**Symptom**: Browser forces HTTPS on localhost

**Solution**:
1. Clear HSTS settings in browser:
   - Chrome: `chrome://net-internals/#hsts` → Delete domain
   - Firefox: Delete `SiteSecurityServiceState.txt` in profile folder
2. Use different domain for development (e.g., `local.vaccichain.test`)

## Security Best Practices

### 1. Regular Audits
- Test headers after every deployment
- Run security scanners monthly
- Review CSP violations in browser console

### 2. CSP Reporting
Consider adding CSP reporting in production:
```nginx
add_header Content-Security-Policy "...; report-uri /csp-report";
```

### 3. Gradual Rollout
- Test in staging first
- Use `Content-Security-Policy-Report-Only` to test without blocking
- Monitor for violations before enforcing

### 4. Keep Updated
- Review OWASP recommendations: https://owasp.org/www-project-secure-headers/
- Follow Mozilla guidelines: https://infosec.mozilla.org/guidelines/web_security
- Update headers as new threats emerge

## Production Deployment Checklist

- [ ] Switch to `nginx.production.conf`
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Test HSTS with short `max-age` first
- [ ] Remove `unsafe-inline` from CSP if possible
- [ ] Test all functionality (especially Freighter wallet)
- [ ] Run securityheaders.com scan (target: Grade A)
- [ ] Run Mozilla Observatory scan (target: A+)
- [ ] Set up CSP violation reporting
- [ ] Document any CSP exceptions and why they're needed
- [ ] Schedule regular security header audits

## Additional Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [HSTS Preload](https://hstspreload.org/)

## Support

For security concerns or questions:
1. Review this documentation
2. Check browser console for CSP violations
3. Test with provided scripts
4. Contact the security team for production deployments
