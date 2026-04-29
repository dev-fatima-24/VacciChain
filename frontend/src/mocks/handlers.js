import { http, HttpResponse } from 'msw';

export const handlers = [
  // Authentication
  http.post('/v1/auth/sep10', async ({ request }) => {
    const { public_key } = await request.json();
    return HttpResponse.json({
      transaction: 'AAAAAgAAAAB...', // Mock XDR
      nonce: 'mock-nonce-' + Math.random().toString(36).substring(7)
    });
  }),

  http.post('/v1/auth/verify', async ({ request }) => {
    const { transaction, nonce } = await request.json();
    return HttpResponse.json({
      token: 'mock-jwt-token',
      publicKey: 'GA...',
      role: 'patient'
    });
  }),

  // Vaccination Records
  http.get('/v1/vaccination/:wallet', ({ params }) => {
    const { wallet } = params;
    return HttpResponse.json({
      wallet,
      records: [
        { 
          vaccine_name: 'MMR', 
          date_administered: '2026-01-01', 
          lot_number: 'LOT123',
          issuer_address: 'GISS...'
        }
      ]
    });
  }),

  http.post('/v1/vaccination/issue', async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json({
      success: true,
      tokenId: 'token-' + Math.floor(Math.random() * 1000),
      transactionHash: 'hash-' + Math.random().toString(36).substring(7)
    });
  }),

  // Verification
  http.get('/v1/verify/:wallet', ({ params }) => {
    const { wallet } = params;
    return HttpResponse.json({
      wallet,
      vaccinated: true,
      record_count: 1,
      records: [{ vaccine: 'MMR', date: '2026-01-01' }]
    });
  }),

  // Patient Registration
  http.post('/v1/patient/register', async ({ request }) => {
    const { publicKey } = await request.json();
    return HttpResponse.json({ success: true, wallet: publicKey || 'GB...' });
  }),

  // Consent
  http.get('/v1/patient/consent/:wallet', ({ params }) => {
    return HttpResponse.json({ wallet: params.wallet, consented: false });
  }),

  http.post('/v1/patient/consent', async ({ request }) => {
    const { wallet } = await request.json();
    return HttpResponse.json({ success: true, wallet });
  }),

  // Admin / API Keys
  http.get('/v1/admin/api-keys', () => {
    return HttpResponse.json([
      { 
        id: '1', 
        label: 'Default School District', 
        created_at: new Date().toISOString(), 
        revoked: false 
      }
    ]);
  }),

  http.post('/v1/admin/api-keys', async ({ request }) => {
    const { label } = await request.json();
    return HttpResponse.json({
      id: 'key-' + Math.random().toString(36).substring(7),
      label: label || 'New Key',
      key: 'sk_' + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      revoked: false
    });
  }),

  http.delete('/v1/admin/api-keys/:id', () => {
    return HttpResponse.json({ revoked: true });
  }),

  // Health check
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Events
  http.get('/v1/events', () => {
    return HttpResponse.json({
      events: [],
      count: 0
    });
  }),
];
