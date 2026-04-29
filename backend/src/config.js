const { z } = require('zod');

const schema = z.object({
  // Stellar / Soroban
  STELLAR_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  HORIZON_URL: z.string().url(),
  SOROBAN_RPC_URL: z.string().url(),
  SOROBAN_RPC_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  STELLAR_NETWORK_PASSPHRASE: z.string().min(1),

  // Contract
  VACCINATIONS_CONTRACT_ID: z.string().min(1),

  // Backend
  ADMIN_SECRET_KEY: z.string().min(1),
  SEP10_SERVER_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  // Comma-separated list of allowed origins, e.g. https://app.example.com,https://admin.example.com
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // SEP-10: home domain used as the manage_data key prefix ('<HOME_DOMAIN> auth')
  HOME_DOMAIN: z.string().min(1).default('localhost'),
  // SEP-10: domain of this auth server, included in the web_auth_domain manage_data op
  WEB_AUTH_DOMAIN: z.string().min(1).default('localhost'),

  // Transaction fees (stroops; 1 XLM = 10_000_000 stroops)
  SOROBAN_FEE: z.coerce.number().int().positive().default(100),
  SOROBAN_TIP: z.coerce.number().int().min(0).default(0),

  // Request limits
  BODY_LIMIT: z.string().default('10kb'),

  // Indexer
  EVENT_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  DATABASE_PATH: z.string().default('/data/vaccichain.db'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map(i => `  ${i.path[0]}: ${i.message}`).join('\n');
  console.error(`[config] Missing or invalid environment variables:\n${missing}`);
  process.exit(1);
}

module.exports = result.data;
