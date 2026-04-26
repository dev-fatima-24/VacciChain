#!/bin/bash
REPO="dev-fatima-24/VacciChain"
c() { gh issue create --repo "$REPO" --title "$1" --body "$2" --label "$3" && sleep 1; }

c "TEST-011 · Add contract security invariant tests" "## Description
Critical security invariants (soulbound enforcement, issuer-only minting, admin-only issuer management) need dedicated tests that run on every change.

## Acceptance Criteria
- Test: non-issuer cannot mint (any address not in allowlist)
- Test: transfer always fails regardless of caller and recipient
- Test: non-admin cannot add or revoke issuers
- Test: paused contract rejects all state-changing calls

**Priority:** Critical | **Effort:** Small" "testing,smart-contract,security"

c "TEST-012 · Implement backend middleware unit tests" "## Description
\`auth.js\` and \`issuer.js\` middleware are untested. Bugs in these files bypass all security controls.

## Acceptance Criteria
- Unit tests for \`auth.js\`: valid JWT, expired JWT, missing JWT, wrong role
- Unit tests for \`issuer.js\`: authorized issuer, revoked issuer, non-issuer wallet
- Tests mock the contract allowlist check
- 100% branch coverage for both middleware files

**Priority:** High | **Effort:** Small" "testing,backend,security"

c "TEST-013 · Add visual regression tests for frontend" "## Description
UI changes can break the visual appearance of components without failing functional tests. No visual regression testing exists.

## Acceptance Criteria
- Playwright or Storybook visual regression tests for: \`NFTCard\`, \`VerificationBadge\`, Landing page
- Baseline screenshots committed to repo
- Visual diff failures block PR merge
- Diff images uploaded as CI artifacts

**Priority:** Low | **Effort:** Medium" "testing,frontend"

c "TEST-014 · Add contract testnet smoke tests post-deploy" "## Description
After deploying to testnet, no automated smoke tests verify the deployed contract behaves correctly.

## Acceptance Criteria
- Smoke test script runs after \`make deploy\`: init contract, add test issuer, mint test record, verify record, revoke record
- Script exits non-zero on any failure
- Integrated into the deployment pipeline
- Test issuer and records cleaned up after smoke test

**Priority:** High | **Effort:** Small" "testing,smart-contract,devops"

c "TEST-015 · Set up test coverage reporting and enforcement" "## Description
No coverage reporting exists across any service. Coverage thresholds are not enforced, allowing coverage to silently degrade.

## Acceptance Criteria
- Coverage reports generated for: backend (Istanbul/c8), frontend (Jest), Python service (pytest-cov), contracts (cargo-tarpaulin)
- Coverage reports uploaded to Codecov or equivalent in CI
- Minimum thresholds enforced: backend 70%, frontend 70%, Python 80%, contracts 85%
- Coverage badge added to README

**Priority:** Medium | **Effort:** Small" "testing,ci-cd"

c "SEC-001 · Conduct SEP-10 implementation security review" "## Description
SEP-10 is the authentication backbone of VacciChain. The challenge generation and signature verification in \`sep10.js\` must be reviewed against the full SEP-10 spec.

## Acceptance Criteria
- Challenges expire after exactly 5 minutes (verified in tests)
- Nonces are single-use and stored with TTL
- \`network_passphrase\` validated in challenge verification
- Home domain validated against server config
- \`manage_data\` operation key/value format matches SEP-10 spec exactly
- Review findings documented in \`docs/security/sep10-review.md\`

**Priority:** Critical | **Effort:** Medium" "security,backend"

c "SEC-002 · Add secrets scanning to CI pipeline" "## Description
No protection exists against accidentally committing Stellar secret keys, JWT secrets, or other credentials to the repository.

## Acceptance Criteria
- \`gitleaks\` runs on every PR and push to \`main\`
- Pre-commit hook configured to block secret commits locally
- Scan covers: Stellar secret keys (\`S...\`), JWT secrets, private keys, API tokens
- Historical commit scan run once on existing repo

**Priority:** High | **Effort:** Small" "security,devops"

c "SEC-003 · Implement Content Security Policy and security headers" "## Description
The frontend has no CSP or security headers. XSS attacks could inject scripts that intercept Freighter wallet signing prompts.

## Acceptance Criteria
- CSP header restricts script sources to self and known CDNs only
- \`X-Frame-Options: DENY\` prevents clickjacking
- \`X-Content-Type-Options: nosniff\` prevents MIME sniffing
- \`Referrer-Policy: strict-origin-when-cross-origin\` set
- Headers verified with securityheaders.com (minimum grade A)

**Priority:** High | **Effort:** Small" "security,frontend,backend"

c "SEC-004 · Perform dependency vulnerability audit across all services" "## Description
No automated dependency scanning exists across Node.js, Python, or Rust dependencies. Known CVEs in dependencies go undetected.

## Acceptance Criteria
- \`npm audit --audit-level=high\`, \`pip-audit\`, and \`cargo audit\` run in CI
- High/critical vulnerabilities block PR merge
- Audit results uploaded as CI artifacts
- Dependabot enabled for all three ecosystems

**Priority:** High | **Effort:** Small" "security,devops"

c "SEC-005 · Enforce HTTPS and secure transport in production" "## Description
No TLS termination or secure transport configuration is defined for production. Data in transit (including JWTs and wallet addresses) is unencrypted.

## Acceptance Criteria
- TLS termination configured at reverse proxy (nginx or Caddy)
- HTTP requests redirect to HTTPS (301)
- HSTS header enabled with \`max-age=31536000; includeSubDomains\`
- TLS certificate auto-renewed (Let's Encrypt or equivalent)
- Minimum TLS version: 1.2

**Priority:** Critical | **Effort:** Medium" "security,devops"

c "SEC-006 · Conduct smart contract security audit" "## Description
The Soroban contract controls all vaccination records and issuer authorization. An unaudited contract should not be deployed to mainnet.

## Acceptance Criteria
- External security audit completed by a firm with Soroban/Rust experience
- All critical and high findings remediated before mainnet launch
- Audit report published in \`docs/security/contract-audit.md\`
- Re-audit performed after any significant contract change

**Priority:** Critical | **Effort:** Large" "security,smart-contract"

c "SEC-007 · Implement JWT signing key rotation" "## Description
The JWT secret is a static environment variable. If compromised, all issued tokens are permanently valid until the secret is manually rotated.

## Acceptance Criteria
- JWT signing supports key rotation without invalidating all active sessions
- New key used for signing; old key accepted for verification during a transition window
- Key rotation procedure documented
- Rotation can be triggered without service restart

**Priority:** High | **Effort:** Medium" "security,backend"

c "SEC-008 · Add input sanitization to prevent injection attacks" "## Description
User-supplied strings (vaccine names, wallet addresses) are passed to contract calls and stored. No sanitization layer exists.

## Acceptance Criteria
- All string inputs sanitized before use in contract calls or storage
- HTML/script tags stripped from any string that may be rendered in the UI
- Null bytes and control characters rejected
- Sanitization applied at the API boundary, not just the frontend

**Priority:** High | **Effort:** Small" "security,backend"

c "SEC-009 · Implement admin action multi-signature requirement" "## Description
Admin operations (add/revoke issuer, contract upgrade, pause) require only a single admin key. A compromised admin key gives full control over the system.

## Acceptance Criteria
- Critical admin operations require M-of-N signatures (e.g., 2-of-3)
- Multi-sig enforced at the contract level, not just the backend
- Key holders documented in a secure, access-controlled location
- Multi-sig ceremony procedure documented

**Priority:** High | **Effort:** Large" "security,smart-contract"

c "SEC-010 · Add brute-force protection on auth endpoints" "## Description
\`/auth/sep10\` and \`/auth/verify\` have no protection against brute-force attacks beyond basic rate limiting. Repeated failed attempts are not tracked.

## Acceptance Criteria
- Failed \`/auth/verify\` attempts tracked per IP and per wallet
- After 5 failed attempts within 10 minutes, wallet/IP temporarily blocked (15 minutes)
- Block events logged and alerted
- Legitimate users can contact support to unblock

**Priority:** High | **Effort:** Medium" "security,backend"
