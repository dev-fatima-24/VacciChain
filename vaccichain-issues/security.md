# Security Issues (SEC-001 to SEC-015)

---

### SEC-001 · Conduct SEP-10 implementation security review

**Description:** SEP-10 is the authentication backbone of VacciChain. The challenge generation and signature verification in `sep10.js` must be reviewed against the full SEP-10 spec for nonce handling, expiry, and replay protection.

**Acceptance Criteria:**
- Challenges expire after exactly 5 minutes (verified in tests)
- Nonces are single-use and stored with TTL (see BE-016)
- `network_passphrase` validated in challenge verification
- Home domain validated against server config
- `manage_data` operation key/value format matches SEP-10 spec exactly
- Review findings documented in `docs/security/sep10-review.md`

**Priority:** Critical | **Effort:** Medium
**Dependencies:** BE-016
**Labels:** `security`, `backend`

---

### SEC-002 · Add secrets scanning to CI pipeline

**Description:** No protection exists against accidentally committing Stellar secret keys, JWT secrets, or other credentials to the repository.

**Acceptance Criteria:**
- `gitleaks` runs on every PR and push to `main`
- Pre-commit hook configured to block secret commits locally (documented in `CONTRIBUTING.md`)
- Scan covers: Stellar secret keys (`S...`), JWT secrets, private keys, API tokens
- Historical commit scan run once on existing repo

**Priority:** High | **Effort:** Small
**Dependencies:** DO-001
**Labels:** `security`, `devops`

---

### SEC-003 · Implement Content Security Policy and security headers

**Description:** The frontend has no CSP or security headers. XSS attacks could inject scripts that intercept Freighter wallet signing prompts, stealing user authorization.

**Acceptance Criteria:**
- CSP header restricts script sources to self and known CDNs only
- `X-Frame-Options: DENY` prevents clickjacking
- `X-Content-Type-Options: nosniff` prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` set
- `Permissions-Policy` restricts unnecessary browser APIs
- Headers verified with [securityheaders.com](https://securityheaders.com) (minimum grade A)

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `security`, `frontend`, `backend`

---

### SEC-004 · Perform dependency vulnerability audit across all services

**Description:** No automated dependency scanning exists across Node.js, Python, or Rust dependencies. Known CVEs in dependencies go undetected.

**Acceptance Criteria:**
- `npm audit --audit-level=high`, `pip-audit`, and `cargo audit` run in CI
- High/critical vulnerabilities block PR merge
- Audit results uploaded as CI artifacts
- Dependabot enabled for all three ecosystems with auto-merge for patch updates

**Priority:** High | **Effort:** Small
**Dependencies:** DO-001
**Labels:** `security`, `devops`

---

### SEC-005 · Enforce HTTPS and secure transport in production

**Description:** No TLS termination or secure transport configuration is defined for production. Data in transit (including JWTs and wallet addresses) is unencrypted.

**Acceptance Criteria:**
- TLS termination configured at reverse proxy (nginx or Caddy)
- HTTP requests redirect to HTTPS (301)
- HSTS header enabled with `max-age=31536000; includeSubDomains`
- TLS certificate auto-renewed (Let's Encrypt or equivalent)
- Minimum TLS version: 1.2

**Priority:** Critical | **Effort:** Medium
**Dependencies:** DO-009
**Labels:** `security`, `devops`

---

### SEC-006 · Conduct smart contract security audit

**Description:** The Soroban contract controls all vaccination records and issuer authorization. An unaudited contract should not be deployed to mainnet.

**Acceptance Criteria:**
- External security audit completed by a firm with Soroban/Rust experience
- All critical and high findings remediated before mainnet launch
- Audit report published in `docs/security/contract-audit.md`
- Re-audit performed after any significant contract change

**Priority:** Critical | **Effort:** Large
**Dependencies:** SC-003, SC-013, SC-015
**Labels:** `security`, `smart-contract`

---

### SEC-007 · Implement JWT signing key rotation

**Description:** The JWT secret is a static environment variable. If compromised, all issued tokens are permanently valid until the secret is manually rotated and all users re-authenticate.

**Acceptance Criteria:**
- JWT signing supports key rotation without invalidating all active sessions
- New key used for signing; old key accepted for verification during a transition window
- Key rotation procedure documented
- Rotation can be triggered without service restart

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `security`, `backend`

---

### SEC-008 · Add input sanitization to prevent injection attacks

**Description:** User-supplied strings (vaccine names, wallet addresses) are passed to contract calls and stored. No sanitization layer exists.

**Acceptance Criteria:**
- All string inputs sanitized before use in contract calls or storage
- HTML/script tags stripped from any string that may be rendered in the UI
- Null bytes and control characters rejected
- Sanitization applied at the API boundary, not just the frontend

**Priority:** High | **Effort:** Small
**Dependencies:** BE-013
**Labels:** `security`, `backend`

---

### SEC-009 · Implement admin action multi-signature requirement

**Description:** Admin operations (add/revoke issuer, contract upgrade, pause) require only a single admin key. A compromised admin key gives full control over the system.

**Acceptance Criteria:**
- Critical admin operations require M-of-N signatures (e.g., 2-of-3)
- Multi-sig enforced at the contract level, not just the backend
- Key holders documented in a secure, access-controlled location
- Multi-sig ceremony procedure documented

**Priority:** High | **Effort:** Large
**Dependencies:** SC-004
**Labels:** `security`, `smart-contract`

---

### SEC-010 · Add brute-force protection on auth endpoints

**Description:** `/auth/sep10` and `/auth/verify` have no protection against brute-force attacks beyond basic rate limiting. Repeated failed attempts are not tracked.

**Acceptance Criteria:**
- Failed `/auth/verify` attempts tracked per IP and per wallet
- After 5 failed attempts within 10 minutes, wallet/IP temporarily blocked (15 minutes)
- Block events logged and alerted
- Legitimate users can contact support to unblock

**Priority:** High | **Effort:** Medium
**Dependencies:** BE-002
**Labels:** `security`, `backend`

---

### SEC-011 · Implement wallet address allowlist for patient registration

**Description:** Any Stellar wallet can receive a vaccination record. There is no mechanism to prevent issuers from minting to arbitrary or attacker-controlled addresses.

**Acceptance Criteria:**
- Design decision documented: open minting vs. patient pre-registration
- If pre-registration chosen: patient must authenticate via SEP-10 before receiving a record
- If open minting chosen: risk documented and accepted in `docs/security/threat-model.md`
- Decision reviewed by project stakeholders

**Priority:** Medium | **Effort:** Medium
**Dependencies:** None
**Labels:** `security`, `product`

---

### SEC-012 · Create threat model document

**Description:** No threat model exists for VacciChain. Security decisions are made ad-hoc without a systematic view of attack surfaces and mitigations.

**Acceptance Criteria:**
- `docs/security/threat-model.md` covers: assets, threat actors, attack vectors, mitigations
- STRIDE analysis applied to: contract, backend API, frontend, analytics service
- Trust boundaries clearly defined (on-chain vs. off-chain)
- Threat model reviewed and updated before mainnet launch

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `security`, `documentation`

---

### SEC-013 · Enforce principle of least privilege in Docker containers

**Description:** Containers likely run as root. A container escape or RCE vulnerability would have full host access.

**Acceptance Criteria:**
- All containers run as non-root users
- Read-only root filesystems where possible
- `no-new-privileges` security option set
- Capabilities dropped to minimum required
- Verified with `docker inspect` and `trivy` config scan

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `security`, `devops`

---

### SEC-014 · Implement analytics service authentication

**Description:** The Python analytics service endpoints are completely unauthenticated. Vaccination rate data and anomaly flags are publicly accessible.

**Acceptance Criteria:**
- Analytics endpoints require a valid API key or admin JWT
- API key stored in secrets manager, not hardcoded
- Unauthenticated requests return `401`
- Public batch verify endpoint (`/batch/verify`) may remain open but rate-limited

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `security`, `python-service`

---

### SEC-015 · Add anomaly detection alerting for unusual minting patterns

**Description:** The analytics service detects anomalies but only exposes them via a GET endpoint. Unusual minting patterns (bulk minting, new issuer spike) need real-time alerts.

**Acceptance Criteria:**
- Anomaly detection runs on a configurable schedule (default: every 15 minutes)
- Alerts sent via webhook (Slack, PagerDuty, or email) when anomalies are detected
- Alert includes: issuer address, anomaly type, record count, timestamp
- Alert thresholds configurable via environment variables
- False positive rate documented and tunable

**Priority:** Medium | **Effort:** Medium
**Dependencies:** BE-018
**Labels:** `security`, `python-service`, `observability`
