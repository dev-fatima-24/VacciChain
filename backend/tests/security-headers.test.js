const request = require('supertest');
const app = require('../src/app');

describe('Security Headers', () => {
  describe('GET /health', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should include Referrer-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'none'");
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    });

    it('should include Permissions-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['permissions-policy']).toBeDefined();
      expect(response.headers['permissions-policy']).toContain('geolocation=()');
    });
  });

  describe('All API endpoints', () => {
    it('should include security headers on error responses', async () => {
      const response = await request(app).get('/v1/nonexistent-endpoint');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include security headers on successful API responses', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('Security Headers Middleware', () => {
    it('should not include HSTS header by default (for development)', async () => {
      const response = await request(app).get('/health');
      
      // HSTS should be set by reverse proxy in production, not by the app
      expect(response.headers['strict-transport-security']).toBeUndefined();
    });

    it('should set restrictive CSP for API responses', async () => {
      const response = await request(app).get('/health');
      
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'none'");
      // API responses should not allow any resource loading
    });
  });
});
