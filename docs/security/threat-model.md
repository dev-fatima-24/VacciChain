# VacciChain Threat Model

**Version:** 1.0  
**Date:** 2026-04-28  
**Status:** Active — must be reviewed and updated before mainnet launch  
**Scope:** Soroban smart contract, Node.js backend API, React frontend, Python analytics service

---

## 1. Assets

| Asset | Location | Sensitivity |
|---|---|---|
| Vaccination records (soulbound NFTs) | On-chain (Soroban contract storage) | High — medical data |
| Patient wallet addresses | On-chain + backend indexer DB | Medium — pseudonymous but linkable |
| Admin secret key (`ADMIN_SECRET_KEY`) | Backend environment / secrets manager | Critical — controls issuer list and contract upgrades |
| Issuer secret key (`ISSUER_SECRET_KEY`) | Backend environment / secrets manager | High — signs all mint/revoke transactions |
| SEP-10 server key (`SEP10_SERVER_KEY`) | Backend environment | High — signs auth challenges |
| JWT secret (`JWT_SECRET`) | Backend environment | High — forging it grants arbitrary role claims |
| Verifier API keys | Backend SQLite DB (`api_keys` table) | Medium — grants bulk verification access |
| SEP-10 nonces | In-memory nonce store | Medium — single-use; expiry limits window |
| Audit log (`audit.log`) | Backend filesystem | Medium — append-only NDJSON; contains wallet + action history |
| Backend indexer SQLite DB | Backend filesystem | Medium — indexed on-chain events cache |
| Contract WASM / upgrade path | On-chain deployer | Critical — malicious upgrade replaces all logic |

---

## 2. Threat Actors

| Actor | Access | Motivation |
|---|---|---|
| External attacker | Public endpoints, on-chain read | Forge records, DoS, data harvest |
| Malicious patient | Valid patient JWT, own wallet | Access other patients' data, spam registration |
| Malicious issuer | Valid issuer JWT + on-chain issuer key | Mint fraudulent records, spam, extort patients |
| Compromised backend | Holds `ADMIN_SECRET_KEY`, `ISSUER_SECRET_KEY`, `JWT_SECRET` | Full system takeover |
| Rogue admin | Holds admin key | Add malicious issuers, upgrade contract to backdoor |
| Malicious verifier | Valid API key | Bulk harvest patient vaccination status |
| Supply-chain attacker | npm / pip / cargo dependency | Inject malicious code into build artifacts |
| Insider (healthcare provider) | Physical access to issuer credentials | Mint records for unvaccinated patients |

---

## 3. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│  UNTRUSTED (public internet)                                        │
│                                                                     │
│   Browser / Freighter wallet          Third-party verifiers         │
│         │                                      │                    │
└─────────┼──────────────────────────────────────┼────────────────────┘
          │ HTTPS                                 │ HTTPS + X-API-Key
┌─────────▼──────────────────────────────────────▼────────────────────┐
│  SEMI-TRUSTED (backend perimeter — Docker internal network)         │
│                                                                     │
│   Node.js Express API (port 4000)                                   │
│   Python FastAPI analytics (port 8001)  ──────► backend:4000        │
│                                                                     │
│   Both services hold secret keys and must be treated as high-value  │
│   targets. Compromise here = compromise of all off-chain controls.  │
└─────────────────────────────────────────────────────────────────────┘
          │ Soroban RPC / Horizon
┌─────────▼───────────────────────────────────────────────────────────┐
│  TRUSTED (Stellar network — on-chain enforcement)                   │
│                                                                     │
│   Soroban smart contract                                            │
│   • Issuer allowlist enforced at contract level                     │
│   • Patient allowlist enforced at contract level                    │
│   • Soulbound: transfer() always reverts                            │
│   • Admin two-step transfer with 24-hour expiry                     │
│                                                                     │
│   No backend path can override contract-level rules.                │
└─────────────────────────────────────────────────────────────────────┘
```

Key boundary: **on-chain vs. off-chain**. The contract is the source of truth. The backend is a convenience layer — it can be compromised without forging on-chain records, but it can mint fraudulent records if `ISSUER_SECRET_KEY` is leaked.

---

## 4. STRIDE Analysis

### 4.1 Soroban Smart Contract

| ID | STRIDE | Threat | Mitigation | Residual Risk |
|---|---|---|---|---|
| C-S1 | Spoofing | Attacker impersonates an authorized issuer to call `mint_vaccination` | `issuer.require_auth()` in `mint.rs`; issuer must sign the invocation with their private key | Low — requires key compromise |
| C-S2 | Spoofing | Attacker impersonates admin to call `add_issuer` or `upgrade` | `admin.require_auth()` on every admin function | Low — requires admin key compromise |
| C-T1 | Tampering | Attacker modifies a vaccination record after minting | Records stored in persistent contract storage; no update path exists — only `revoke_vaccination` (marks revoked, never deletes) | None |
| C-T2 | Tampering | Malicious contract upgrade replaces all logic | `upgrade()` requires admin auth + emits `upgraded` event; two-step admin transfer limits key handoff risk | Medium — admin key compromise enables this |
| C-R1 | Repudiation | Issuer denies minting a record | All mint/revoke/issuer-add/admin actions emit on-chain events (`VaccinationMinted`, `VaccinationRevoked`, `IssuerAdded`, etc.) | Low |
| C-I1 | Information Disclosure | Patient vaccination history exposed to anyone | `verify_vaccination` is intentionally public (by design — verifiers need it); wallet addresses are pseudonymous | Medium — acceptable by design; patients should be aware |
| C-D1 | Denial of Service | Spam `register_patient` or `batch_verify` to exhaust contract storage / compute | `batch_verify` capped at 100 wallets; per-patient record limit (50) enforced in `mint.rs` | Low |
| C-D2 | Denial of Service | Attacker fills issuer list to degrade `get_all_issuers` pagination | Only admin can add issuers | Low |
| C-E1 | Elevation of Privilege | Non-admin calls `add_issuer` or `upgrade` | `admin.require_auth()` enforced; Soroban auth model rejects mismatched signers | None |
| C-E2 | Elevation of Privilege | Soulbound bypass — transfer NFT to another wallet | `transfer()` always returns `SoulboundToken` (error 15); no alternative transfer path | None |
| C-E3 | Elevation of Privilege | Double-initialization to replace admin | `AlreadyInitialized` check on `initialize()` | None |

### 4.2 Backend API (Node.js / Express)

| ID | STRIDE | Threat | Mitigation | Residual Risk |
|---|---|---|---|---|
| B-S1 | Spoofing | Attacker replays a captured SEP-10 signed transaction to obtain a JWT | Nonces are single-use (`nonceStore.consume`); challenges expire after 5 minutes (tx `setTimeout(300)`) | Low |
| B-S2 | Spoofing | Attacker forges a JWT to claim `issuer` role | JWTs signed with `JWT_SECRET` (HS256); `authMiddleware` validates `sub`, `role`, `wallet`, `exp` claims | Low — depends on `JWT_SECRET` secrecy |
| B-S3 | Spoofing | Attacker submits a crafted SEP-10 transaction with a fake server signature | `verifyChallenge` checks server signature against `SEP10_SERVER_KEY` before accepting | Low |
| B-T1 | Tampering | Attacker injects malicious wallet address into `/vaccination/issue` body | `wallet.js` middleware validates Stellar public key format (starts with `G`, 56 chars); Soroban contract re-validates | Low |
| B-T2 | Tampering | Attacker tampers with audit log to hide actions | Audit log is append-only NDJSON; no delete endpoint exists | Medium — filesystem access enables tampering; use write-once storage in production |
| B-R1 | Repudiation | Issuer denies calling `/vaccination/issue` | `auditLog.js` middleware records every mutating request with wallet, role, endpoint, timestamp, and response status | Low |
| B-I1 | Information Disclosure | Secret keys leaked via error responses or logs | `config.js` validates env vars at startup; logger uses structured JSON (no raw error stack to client) | Medium — review all error handlers before mainnet |
| B-I2 | Information Disclosure | CORS misconfiguration exposes API to arbitrary origins | CORS configured in `app.js`; verify allowed origins are restricted in production | Medium — confirm production CORS allowlist |
| B-D1 | Denial of Service | Flood `/auth/sep10` to exhaust Horizon account sequence numbers | `sep10Limiter`: 10 req/IP/min; `verifyLimiter`: 60 req/IP/min | Low |
| B-D2 | Denial of Service | Oversized request body crashes the parser | `body-limit` middleware enforced (tested in `body-limit.test.js`) | Low |
| B-D3 | Denial of Service | Soroban RPC unavailability blocks all minting | `withRetry` in `soroban.js` retries with exponential backoff up to `SOROBAN_RPC_MAX_RETRIES` | Medium — no circuit breaker; prolonged RPC outage blocks all writes |
| B-E1 | Elevation of Privilege | Patient JWT used to call issuer-only `/vaccination/issue` | `issuerMiddleware` checks `req.user.role === 'issuer'` after `authMiddleware` | Low |
| B-E2 | Elevation of Privilege | Verifier API key used to call authenticated patient/issuer routes | Verifier routes use `verifierApiKey` middleware, not JWT; separate middleware chains | Low |
| B-E3 | Elevation of Privilege | `ADMIN_SECRET_KEY` used for `register_patient` on behalf of patient | `register_patient` calls `patient.require_auth()` on-chain — backend cannot satisfy this with admin key alone. **Frontend must build an unsigned tx and have the patient sign via Freighter before mainnet.** | **High — must fix before mainnet** |

### 4.3 Frontend (React / Freighter)

| ID | STRIDE | Threat | Mitigation | Residual Risk |
|---|---|---|---|---|
| F-S1 | Spoofing | Phishing site mimics VacciChain to steal wallet signatures | Freighter shows the domain before signing; users must verify the URL | Medium — user education required |
| F-S2 | Spoofing | XSS injects script to exfiltrate JWT from localStorage | JWTs should be stored in `httpOnly` cookies, not localStorage; review current storage mechanism | **High — verify JWT storage before mainnet** |
| F-T1 | Tampering | Attacker intercepts API responses to display false vaccination status | HTTPS in transit; on-chain verification is the authoritative source — `VerifyPage` calls `/verify/:wallet` which reads from contract | Low |
| F-I1 | Information Disclosure | Patient's wallet address exposed in browser history via URL params | Verify page uses wallet address in URL — acceptable for public verification; no private data in URL | Low |
| F-D1 | Denial of Service | Freighter extension unavailable blocks all wallet operations | `FreighterBanner` component warns users when extension is not detected | Low |
| F-E1 | Elevation of Privilege | Frontend bypasses issuer check to call mint endpoint | Backend `issuerMiddleware` enforces role server-side; frontend check is UI-only | None |

### 4.4 Python Analytics Service

| ID | STRIDE | Threat | Mitigation | Residual Risk |
|---|---|---|---|---|
| A-S1 | Spoofing | Unauthenticated caller accesses analytics endpoints | `/analytics/*` endpoints currently have no auth; `_bearer` variable is defined but not applied as a dependency in routes | **High — add auth before production** |
| A-T1 | Tampering | Attacker sends crafted event data to skew analytics | Analytics reads from backend `/events` endpoint (read-only); no write path into analytics | Low |
| A-I1 | Information Disclosure | Bulk harvest of issuer activity and anomaly data | No rate limiting on analytics endpoints; no auth (see A-S1) | High — blocked by fixing A-S1 |
| A-D1 | Denial of Service | Flood `/batch/verify` with 100-wallet requests to amplify load on backend | Batch capped at 100 wallets per request; no rate limit on the analytics service itself | Medium — add rate limiting |
| A-E1 | Elevation of Privilege | Analytics service calls backend with elevated privileges | Analytics only calls public `/verify/:wallet` and `/events`; no JWT or admin key used | Low |

---

## 5. Open Risks (Prioritized)

| ID | Risk | Severity | Owner | Action Required Before Mainnet |
|---|---|---|---|---|
| OR-1 | `register_patient` uses `ADMIN_SECRET_KEY` as placeholder — patient auth not satisfied on-chain | **Critical** | Backend + Frontend | Build unsigned tx in backend, return to frontend for Freighter signing |
| OR-2 | Analytics endpoints have no authentication (`_bearer` defined but not wired) | **High** | Python service | Apply `HTTPBearer` dependency to all analytics routes |
| OR-3 | JWT storage in frontend — if stored in localStorage, vulnerable to XSS | **High** | Frontend | Move to `httpOnly` cookie or confirm current storage is safe |
| OR-4 | Admin key is a single point of failure; compromise enables malicious issuer addition and contract upgrade | **High** | DevOps | Store in hardware wallet or cloud HSM; monitor `iss_add` and `upgraded` events |
| OR-5 | Audit log on local filesystem — writable by process; no integrity protection | **Medium** | Backend / Infra | Use append-only log sink (e.g., Loki, CloudWatch Logs) in production |
| OR-6 | No rate limiting on Python analytics service | **Medium** | Python service | Add `slowapi` or nginx rate limiting in front of the service |
| OR-7 | CORS allowlist not verified for production — may be open | **Medium** | Backend | Restrict `Access-Control-Allow-Origin` to known frontend domain |
| OR-8 | Soroban RPC outage has no circuit breaker — prolonged outage blocks all writes with no user feedback | **Low** | Backend | Add circuit breaker or health-check endpoint |
| OR-9 | `nonceStore` is in-memory — restarting the backend invalidates all in-flight SEP-10 challenges | **Low** | Backend | Acceptable for single-instance; use Redis-backed store for multi-instance deployments |

---

## 6. Mainnet Launch Checklist

- [ ] OR-1: `register_patient` flow uses patient-signed transaction (not admin key)
- [ ] OR-2: Analytics routes protected with JWT or API key auth
- [ ] OR-3: JWT stored in `httpOnly` cookie, not localStorage
- [ ] OR-4: Admin key in HSM or hardware wallet; event monitoring configured
- [ ] OR-5: Audit log shipped to tamper-evident sink
- [ ] OR-6: Rate limiting on analytics service
- [ ] OR-7: CORS restricted to production frontend domain
- [ ] All secret keys rotated from testnet values
- [ ] `STELLAR_NETWORK` set to `mainnet` with correct `STELLAR_NETWORK_PASSPHRASE`
- [ ] Threat model reviewed and signed off by security reviewer

---

## 7. Review History

| Date | Version | Author | Notes |
|---|---|---|---|
| 2026-04-28 | 1.0 | — | Initial full threat model (issue #112) |
