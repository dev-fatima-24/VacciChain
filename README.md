#  Vacci-Chain

[![CI](https://github.com/EDOHWARES/VacciChain/actions/workflows/ci.yml/badge.svg)](https://github.com/EDOHWARES/VacciChain/actions/workflows/ci.yml)

> Blockchain-based vaccination records on Stellar — soulbound, verifiable, tamper-proof.

VacciChain lets governments and healthcare providers issue vaccination records as non-transferable NFTs (soulbound tokens) on the Stellar network via Soroban smart contracts. Patients hold records in their Stellar wallets. Schools, employers, and border agencies verify status on-chain — no central database, no forgery.

---

##  Features

-  **Issuer-gated minting** — only authorized healthcare providers can issue vaccination NFTs
-  **Soulbound tokens** — all transfer attempts are reverted at the contract level
-  **On-chain verification** — any third party can verify a wallet's vaccination status publicly
-  **SEP-10 authentication** — Stellar Web Auth for secure, replay-protected sessions
-  **Analytics service** — vaccination rates, issuer activity, and anomaly detection
-  **Fully dockerized** — one command to spin up the entire stack

---

## 🌐 Public Demo Environment

You can explore VacciChain without setting up a local environment by visiting our live testnet demo.

* **Network:** Stellar Testnet
* **Reset Schedule:** Weekly (Every Sunday at 00:00 UTC)

### Testing as an Issuer
To evaluate the issuer flow (minting and revoking records), you can connect your Freighter wallet using testnet credentials. **Ensure your wallet is set to Testnet.**

> **⚠️ Security Warning:** The demo database and contract state are wiped periodically.

## 🚀 Staging Environment

A production-equivalent staging environment is automatically deployed on every merge to `main`:

* **URL:** https://staging.vaccichain.example.com
* **Network:** Stellar Testnet
* **Deployment:** Automatic via GitHub Actions
* **Infrastructure:** AWS ECS Fargate

See [docs/staging-environment.md](docs/staging-environment.md) for testing and monitoring procedures.

---

##  Architecture

```
vacci-chain/
├── contracts/                   # Rust — Soroban smart contracts
│   ├── src/
│   │   ├── lib.rs               # Contract entrypoint
│   │   ├── mint.rs              # Issue vaccination NFT
│   │   ├── verify.rs            # On-chain verification logic
│   │   ├── storage.rs           # Key-value storage schemas
│   │   └── events.rs            # Contract event definitions
│   ├── Cargo.toml
│   └── Makefile                 # build, test, deploy targets
│
├── backend/                     # Node.js — Express REST API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # SEP-10 challenge + verify
│   │   │   ├── vaccination.js   # Issue and fetch records
│   │   │   └── verify.js        # Public verification endpoint
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT guard middleware
│   │   │   └── issuer.js        # Authorized issuer check
│   │   ├── stellar/
│   │   │   ├── sep10.js         # Challenge generation + signature verify
│   │   │   └── soroban.js       # Contract invocation helpers
│   │   └── app.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                    # React — patient & issuer UI
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── IssuerDashboard.jsx
│   │   │   └── VerifyPage.jsx
│   │   ├── hooks/
│   │   │   ├── useFreighter.js  # Wallet connect + SEP-10 flow
│   │   │   └── useVaccination.js
│   │   └── components/
│   │       ├── NFTCard.jsx
│   │       └── VerificationBadge.jsx
│   ├── package.json
│   └── Dockerfile
│
├── python-service/              # Python — FastAPI analytics
│   ├── main.py
│   ├── routes/
│   │   ├── analytics.py         # Vaccination rates, issuer stats
│   │   └── batch.py             # Bulk verification scripts
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml
```

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Rust · Soroban SDK |
| Backend | Node.js · Express.js · Stellar SDK |
| Frontend | React · Freighter API |
| Analytics | Python · FastAPI |
| Auth | SEP-10 · JWT |
| Infrastructure | Docker · Docker Compose |
| Network | Stellar Testnet → Mainnet |

---

##  Smart Contract

The Soroban contract (`contracts/`) enforces all core rules. No backend can override it.

### Functions

| Function | Access | Description |
|---|---|---|
| `mint_vaccination(patient, vaccine, date, issuer)` | Issuer only | Issues a soulbound vaccination NFT |
| `transfer(...)` | Blocked | Always reverts — tokens are non-transferable |
| `verify_vaccination(wallet)` | Public | Returns vaccination status + metadata list |
| `add_issuer(address)` | Admin only | Authorizes a new healthcare provider |
| `revoke_issuer(address)` | Admin only | Removes issuer authorization |

### Storage Schema

```
patient_address  →  Vec<token_id>
token_id         →  VaccinationRecord { vaccine_name, date, issuer, timestamp }
issuer_address   →  bool (authorized)
```

### Security Controls
- Issuer allowlist checked on every mint
- Duplicate record detection before minting
- All inputs validated at contract boundary
- Replay protection via SEP-10 nonces
- No reentrancy patterns — single-entry invocation model
- Safe arithmetic throughout
- All critical actions emit on-chain events

---

##  Backend API

Base URL: `http://localhost:4000/v1`

> All endpoints are versioned. Responses include an `API-Version: 1` header.
> Unversioned paths (`/auth/...`, `/vaccination/...`, etc.) return a `308 Permanent Redirect` to `/v1/...` with a `Deprecation: true` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/sep10` | Generate SEP-10 challenge transaction |
| POST | `/auth/verify` | Verify signed challenge, issue JWT |

### Vaccination

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/vaccination/issue` | Issuer JWT | Mint NFT via Soroban contract |
| GET | `/vaccination/:wallet` | JWT | Fetch all records for a wallet |

### Verification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/verify/:wallet` | None | Public vaccination status check |

---

##  Frontend Pages

**Landing** — Project overview and connect wallet CTA

**Patient Dashboard** — View all vaccination NFTs held in connected wallet, with vaccine name, date, and issuer details

**Issuer Dashboard** — Authorized issuers can fill and submit the vaccination form; mints directly to patient wallet via contract

**Verification Page** — Enter any Stellar wallet address and get an instant on-chain verification result with badge

---

## 🐍 Analytics Service

Base URL: `http://localhost:8001`

| Endpoint | Description |
|---|---|
| `GET /analytics/rates` | Vaccination rates by vaccine type and region |
| `GET /analytics/issuers` | Issuer activity — volume, frequency, last active |
| `POST /batch/verify` | Bulk verify a list of wallet addresses |
| `GET /analytics/anomalies` | Flag unusual minting patterns |

---

##  SEP-10 Auth Flow

```
Client (Freighter)                Backend                    Stellar Network
      │                              │                              │
      │── POST /auth/sep10 ─────────►│                              │
      │                              │── build challenge tx ───────►│
      │◄── challenge tx ─────────────│                              │
      │                              │                              │
      │── sign with wallet ──────────┤                              │
      │                              │                              │
      │── POST /auth/verify ────────►│                              │
      │     { signed_tx }            │── verify signature ─────────►│
      │                              │◄── valid ────────────────────│
      │◄── JWT ──────────────────────│                              │
```

---

##  Docker Setup

```bash
# Start all services
docker compose up --build

# Services and ports
# frontend        → http://localhost:3000
# backend         → http://localhost:4000
# python-service  → http://localhost:8001
```

`docker-compose.yml` wires all services on an internal `vaccichain` network. Only frontend, backend, and analytics ports are exposed to the host.

---

##  Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- Node.js 18+
- Python 3.11+
- Docker + Docker Compose
- [Freighter Wallet](https://www.freighter.app/) browser extension

### 1. Clone & configure

```bash
git clone https://github.com/your-org/vacci-chain.git
cd vacci-chain
cp .env.example .env
# Fill in your Stellar keys and contract IDs
```

### 2. Setup secret scanning protection

```bash
# Linux/macOS
./scripts/setup-git-hooks.sh

# Windows
.\scripts\setup-git-hooks.ps1
```

This installs [Gitleaks](https://github.com/gitleaks/gitleaks) pre-commit hooks to prevent accidental commits of Stellar secret keys, JWT secrets, and other credentials. See [docs/secret-scanning-setup.md](docs/secret-scanning-setup.md) for details.

### 3. Deploy the contract

```bash
cd contracts
make build       # compile to WASM
make deploy      # deploy to testnet, outputs CONTRACT_ID
make test        # run contract unit tests
```

### 4. Run with Docker

```bash
docker compose up --build
```

### 5. Run locally (without Docker)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Python service
cd python-service && pip install -r requirements.txt && uvicorn main:app --port 8001
```

---

##  Environment Variables

Copy `.env.example` to `.env` and fill in the required values. The backend validates all variables at startup and exits with a clear error message if anything is missing or malformed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `STELLAR_NETWORK` | no | `testnet` | `testnet` or `mainnet` |
| `HORIZON_URL` | yes | — | Horizon REST API URL for the chosen network |
| `SOROBAN_RPC_URL` | yes | — | Soroban RPC endpoint for contract calls |
| `STELLAR_NETWORK_PASSPHRASE` | yes | — | Must exactly match the target network |
| `VACCINATIONS_CONTRACT_ID` | yes | — | Deployed contract address (starts with `C`) |
| `ADMIN_SECRET_KEY` | yes | — | Signs admin contract invocations (starts with `S`) |
| `ADMIN_PUBLIC_KEY` | yes | — | Grants `issuer` role on SEP-10 login (starts with `G`) |
| `SEP10_SERVER_KEY` | yes | — | Signs SEP-10 challenge transactions (starts with `S`) |
| `ISSUER_SECRET_KEY` | yes | — | Signs mint/revoke transactions (starts with `S`) |
| `JWT_SECRET` | yes | — | Signs JWTs; rotate to invalidate all sessions |
| `PORT` | no | `4000` | Backend listen port |
| `RATE_LIMIT_SEP10` | no | `10` | Max SEP-10 requests per IP per minute |
| `RATE_LIMIT_VERIFY` | no | `60` | Max verify requests per IP per minute |
| `AUDIT_LOG_PATH` | no | `./audit.log` | Path to append-only NDJSON audit log |
| `ANALYTICS_PORT` | no | `8001` | Python analytics service port |
| `BACKEND_URL` | no | `http://backend:4000` | Analytics service → backend base URL |
| `ANOMALY_THRESHOLD` | no | `50` | Mint count above which an issuer is flagged |
| `ANOMALY_SCHEDULE_MINUTES` | no | `15` | How often (minutes) the anomaly check runs |
| `ALERT_WEBHOOK_URL` | no | — | Webhook URL to POST alerts to (Slack/PagerDuty/email) |
| `ALERT_WEBHOOK_TYPE` | no | `slack` | Webhook payload format: `slack`, `pagerduty`, or `email` |
| `PAGERDUTY_ROUTING_KEY` | no | — | PagerDuty Events API v2 routing key (required when `ALERT_WEBHOOK_TYPE=pagerduty`) |
| `ALERT_EMAIL_TO` | no | — | Recipient address (required when `ALERT_WEBHOOK_TYPE=email`) |

For full descriptions, format rules, and examples see [docs/configuration.md](docs/configuration.md).

---

##  Testing

```bash
# Smart contract tests
cd contracts && cargo test

# Backend tests
cd backend && npm test

# Python service tests
cd python-service && pytest
```

---

##  Security Notes

- **Secret scanning** — Gitleaks pre-commit hooks and CI/CD workflows prevent accidental commits of Stellar keys, JWT secrets, and API tokens
- Soulbound enforcement is at the **contract level** — no UI or backend can bypass it
- Issuer authorization is **on-chain** — adding/removing issuers requires an admin-signed contract call
- SEP-10 challenges expire after 5 minutes and are single-use
- JWTs are short-lived (1 hour) and scoped by role (`patient` | `issuer`)
- All contract events are emitted and indexable for audit trails

---

##  License

MIT © VacciChain Contributors
