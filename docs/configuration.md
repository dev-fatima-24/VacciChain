# Configuration Reference

All environment variables consumed by the VacciChain stack. Copy `.env.example` to `.env` and fill in the required values before starting any service.

```bash
cp .env.example .env
```

The backend validates its variables at startup via [Zod](https://zod.dev/). A missing or malformed required variable will print a clear error and exit with code 1 — no cryptic runtime failures.

---

## Stellar / Soroban

### `STELLAR_NETWORK`
- Required: no
- Default: `testnet`
- Allowed values: `testnet` | `mainnet`
- Description: Selects the Stellar network. Controls which network passphrase is used when signing transactions. Must match `HORIZON_URL`, `SOROBAN_RPC_URL`, and `STELLAR_NETWORK_PASSPHRASE`.
- Example: `STELLAR_NETWORK=testnet`

### `HORIZON_URL`
- Required: yes
- Format: valid HTTPS URL
- Description: Horizon REST API endpoint for the chosen network.
- Example (testnet): `HORIZON_URL=https://horizon-testnet.stellar.org`
- Example (mainnet): `HORIZON_URL=https://horizon.stellar.org`

### `SOROBAN_RPC_URL`
- Required: yes
- Format: valid HTTPS URL
- Description: Soroban RPC endpoint used to simulate and submit contract transactions.
- Example (testnet): `SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`
- Example (mainnet): `SOROBAN_RPC_URL=https://mainnet.sorobanrpc.com`

### `STELLAR_NETWORK_PASSPHRASE`
- Required: yes
- Format: non-empty string
- Description: Network passphrase included in every transaction envelope. Must exactly match the target network.
- Example (testnet): `STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015`
- Example (mainnet): `STELLAR_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015`

---

## Contract

### `VACCINATIONS_CONTRACT_ID`
- Required: yes
- Format: 56-character Stellar contract address (starts with `C`)
- Description: Deployed address of the VacciChain Soroban contract. Obtained from `make deploy` in the `contracts/` directory.
- Example: `VACCINATIONS_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

---

## Backend auth

### `ADMIN_SECRET_KEY`
- Required: yes
- Format: 56-character Stellar secret key (starts with `S`)
- Description: Secret key of the account used to sign admin-level contract invocations (e.g. `add_issuer`, `revoke_issuer`). Keep this secret — never commit it.
- Example: `ADMIN_SECRET_KEY=SCZANGBA5RLMPI7JMTP2UOF4BIZX4ICOAP7MWKPKZUEZFEKNUMBMFTA`

### `ADMIN_PUBLIC_KEY`
- Required: yes
- Format: 56-character Stellar public key (starts with `G`)
- Description: Public key corresponding to `ADMIN_SECRET_KEY`. Used by the auth route to assign the `issuer` role when the admin wallet authenticates via SEP-10.
- Example: `ADMIN_PUBLIC_KEY=GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZWM9CQJKR3BSQNEWVZSR`

### `SEP10_SERVER_KEY`
- Required: yes
- Format: 56-character Stellar secret key (starts with `S`)
- Description: Secret key used to sign SEP-10 challenge transactions. Should be a dedicated key, separate from `ADMIN_SECRET_KEY`.
- Example: `SEP10_SERVER_KEY=SBPOVRCGGG65T7FQBV5KCBZ7HNZSZQZQZQZQZQZQZQZQZQZQZQZQZQZ`

### `ISSUER_SECRET_KEY`
- Required: yes
- Format: 56-character Stellar secret key (starts with `S`)
- Description: Secret key used to sign vaccination minting and revocation transactions submitted to the contract. Must correspond to an address authorized as an issuer on-chain.
- Example: `ISSUER_SECRET_KEY=SCZANGBA5RLMPI7JMTP2UOF4BIZX4ICOAP7MWKPKZUEZFEKNUMBMFTA`

### `JWT_SECRET`
- Required: yes
- Format: non-empty string; minimum 32 characters recommended
- Description: Secret used to sign and verify JWTs issued after SEP-10 authentication. Rotate this to invalidate all active sessions.
- Example: `JWT_SECRET=change-me-to-a-long-random-string-in-production`

---

## Backend server

### `PORT`
- Required: no
- Default: `4000`
- Format: positive integer
- Description: TCP port the Express backend listens on.
- Example: `PORT=4000`

---

## Rate limiting

### `RATE_LIMIT_SEP10`
- Required: no
- Default: `10`
- Format: positive integer
- Description: Maximum SEP-10 challenge requests per IP per minute. Protects the challenge endpoint from enumeration and DoS.
- Example: `RATE_LIMIT_SEP10=10`

### `RATE_LIMIT_VERIFY`
- Required: no
- Default: `60`
- Format: positive integer
- Description: Maximum public verification requests (`GET /verify/:wallet`) per IP per minute.
- Example: `RATE_LIMIT_VERIFY=60`

---

## Audit log

### `AUDIT_LOG_PATH`
- Required: no
- Default: `./audit.log` (relative to the backend working directory)
- Format: valid file path; the parent directory must be writable
- Description: Path to the append-only NDJSON audit log file. Each line is a JSON object with `timestamp`, `actor`, `action`, `target`, `result`, and `meta`. Never deleted or updated — only appended.
- Example: `AUDIT_LOG_PATH=/var/log/vaccichain/audit.log`

---

## Python analytics service

### `ANALYTICS_PORT`
- Required: no
- Default: `8001`
- Format: positive integer
- Description: TCP port the FastAPI analytics service listens on.
- Example: `ANALYTICS_PORT=8001`

### `BACKEND_URL`
- Required: no (set automatically by Docker Compose)
- Default: `http://backend:4000`
- Format: valid HTTP/HTTPS URL, no trailing slash
- Description: Base URL the analytics service uses to call the backend API. When running outside Docker, point this at the backend host.
- Example: `BACKEND_URL=http://localhost:4000`

---

## Validation summary

| Variable | Required | Validated by | Rule |
|---|---|---|---|
| `STELLAR_NETWORK` | no | Zod (backend) | enum: `testnet` \| `mainnet` |
| `HORIZON_URL` | yes | Zod (backend) | valid URL |
| `SOROBAN_RPC_URL` | yes | Zod (backend) | valid URL |
| `STELLAR_NETWORK_PASSPHRASE` | yes | Zod (backend) | non-empty string |
| `VACCINATIONS_CONTRACT_ID` | yes | Zod (backend) | non-empty string |
| `ADMIN_SECRET_KEY` | yes | Zod (backend) | non-empty string |
| `ADMIN_PUBLIC_KEY` | yes | runtime | valid Stellar public key format |
| `SEP10_SERVER_KEY` | yes | Zod (backend) | non-empty string |
| `ISSUER_SECRET_KEY` | yes | runtime | valid Stellar secret key format |
| `JWT_SECRET` | yes | Zod (backend) | non-empty string |
| `PORT` | no | Zod (backend) | positive integer, default 4000 |
| `RATE_LIMIT_SEP10` | no | runtime | parsed as integer, default 10 |
| `RATE_LIMIT_VERIFY` | no | runtime | parsed as integer, default 60 |
| `AUDIT_LOG_PATH` | no | runtime | writable path, default `./audit.log` |
| `ANALYTICS_PORT` | no | runtime | positive integer, default 8001 |
| `BACKEND_URL` | no | runtime | valid URL, default set by Compose |
