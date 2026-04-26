#!/bin/bash
REPO="dev-fatima-24/VacciChain"
c() { gh issue create --repo "$REPO" --title "$1" --body "$2" --label "$3" && sleep 1; }

c "DOC-006 · Write architecture decision records (ADRs)" "## Description
Key architectural decisions (Stellar/Soroban choice, soulbound enforcement, SEP-10 auth) are not documented. Future contributors cannot understand why decisions were made.

## Acceptance Criteria
- ADR template created at \`docs/adr/template.md\`
- ADRs written for: choice of Stellar/Soroban, soulbound token design, SEP-10 over other auth methods, Python analytics service separation
- Each ADR includes: context, decision, consequences, alternatives considered

**Priority:** Low | **Effort:** Medium" "documentation"

c "DOC-007 · Create mainnet launch checklist" "## Description
No checklist exists for graduating from testnet to mainnet. A missed step could result in lost records or funds.

## Acceptance Criteria
- \`docs/mainnet-launch.md\` covers: contract security audit, admin key ceremony, environment variable swap, smoke tests, rollback plan
- Checklist reviewed and signed off by at least two contributors
- Each checklist item has a responsible owner field
- Go/no-go criteria defined

**Priority:** High | **Effort:** Small" "documentation,product"

c "DOC-008 · Document environment variables with validation rules" "## Description
Environment variables are listed in the README but without validation rules, defaults, or examples. Misconfigured deployments fail with cryptic errors.

## Acceptance Criteria
- Each env var documented with: description, required/optional, format, example value, default (if optional)
- Validation rules documented (e.g., \`STELLAR_NETWORK\` must be \`testnet\` or \`mainnet\`)
- Available in both README and a dedicated \`docs/configuration.md\`

**Priority:** Medium | **Effort:** Small" "documentation,devops"

c "DOC-009 · Write patient and issuer user guides" "## Description
Non-technical users (patients, healthcare workers) have no documentation on how to use the application. The README is developer-focused.

## Acceptance Criteria
- \`docs/user-guide-patient.md\`: how to connect Freighter, view vaccination records, export certificate
- \`docs/user-guide-issuer.md\`: how to issue a vaccination record, understand authorization status
- Guides include screenshots
- Guides linked from the Landing page

**Priority:** Low | **Effort:** Medium" "documentation,product"

c "DOC-010 · Add inline code documentation (JSDoc / rustdoc)" "## Description
Backend and contract source files have minimal inline documentation. New contributors must read implementation details to understand function behavior.

## Acceptance Criteria
- All public Rust contract functions have \`rustdoc\` comments with \`# Arguments\`, \`# Returns\`, \`# Errors\`
- All Express route handlers have JSDoc comments with \`@param\`, \`@returns\`, \`@throws\`
- All middleware functions documented with purpose and side effects
- \`cargo doc\` generates valid HTML documentation without warnings

**Priority:** Low | **Effort:** Medium" "documentation,smart-contract,backend"

c "TEST-001 · Set up backend integration test suite" "## Description
No integration tests exist for the Express API. Unit tests alone cannot catch Soroban SDK integration failures, auth middleware bugs, or route-level validation issues.

## Acceptance Criteria
- Integration tests using \`supertest\` cover all routes
- Tests mock Soroban RPC calls (no live network dependency)
- Auth flow tested end-to-end: SEP-10 challenge → sign → JWT → protected route
- Tests run in CI on every PR

**Priority:** High | **Effort:** Medium" "testing,backend"

c "TEST-002 · Set up frontend component tests" "## Description
No frontend tests exist. Critical components (\`NFTCard\`, \`VerificationBadge\`, forms) are untested and can regress silently.

## Acceptance Criteria
- React Testing Library set up with Jest
- Component tests for: \`NFTCard\` (loading, error, data states), \`VerificationBadge\` (all four states), IssuerDashboard form (validation, submit)
- Tests run in CI
- Coverage threshold: 70% for components

**Priority:** High | **Effort:** Medium" "testing,frontend"

c "TEST-003 · Set up frontend E2E tests with Playwright" "## Description
Critical user flows (wallet connect, issue vaccination, verify wallet) are untested end-to-end. Regressions in these flows are high-impact.

## Acceptance Criteria
- Playwright configured with a local Docker stack as the test target
- E2E tests cover: connect wallet → view records, issue vaccination (mocked Freighter), verify wallet by address
- Tests run in CI against the full Docker stack
- Screenshots captured on failure

**Priority:** High | **Effort:** Large" "testing,frontend"

c "TEST-004 · Add Python analytics service tests" "## Description
\`pytest\` target exists but no tests are written. Analytics calculations and batch verification are untested.

## Acceptance Criteria
- Unit tests for all analytics calculation logic in \`analytics.py\`
- API endpoint tests using FastAPI \`TestClient\` for all four endpoints
- Batch verify tested with valid, invalid, and mixed wallet lists
- Coverage ≥ 80%

**Priority:** Medium | **Effort:** Medium" "testing,python-service"

c "TEST-005 · Add contract fuzz testing" "## Description
Soroban contracts handling healthcare data need fuzz testing to catch unexpected input handling beyond normal unit test cases.

## Acceptance Criteria
- Fuzz targets for \`mint_vaccination\` inputs (malformed addresses, empty strings, max-length strings, special characters)
- Fuzz targets for \`verify_vaccination\` with non-existent and malformed wallets
- Integrated into CI with a time-bounded run (60 seconds)
- Any panic or unexpected error fails the CI run

**Priority:** Medium | **Effort:** Medium" "testing,smart-contract,security"

c "TEST-006 · Implement SEP-10 authentication flow tests" "## Description
The SEP-10 challenge/verify flow is security-critical and has no dedicated tests. Edge cases (expired challenge, replayed nonce, wrong network passphrase) are untested.

## Acceptance Criteria
- Tests for: valid flow, expired challenge (>5 min), replayed nonce, wrong network passphrase, invalid signature, missing fields
- Tests use real Stellar SDK keypairs (not mocks) for signature generation
- All tests pass in CI without live network access

**Priority:** Critical | **Effort:** Medium" "testing,backend,security"

c "TEST-007 · Add contract upgrade and migration tests" "## Description
Once the contract upgrade mechanism is implemented, the upgrade path must be tested to ensure existing data is readable after an upgrade.

## Acceptance Criteria
- Test deploys v1 contract, mints records, upgrades to v2, verifies records still readable
- Schema version field correctly read across versions
- Upgrade with incompatible schema fails gracefully
- Tests run on testnet in CI

**Priority:** Medium | **Effort:** Medium" "testing,smart-contract"

c "TEST-008 · Add load tests for public verification endpoint" "## Description
\`/verify/:wallet\` is a public endpoint expected to handle high traffic (schools, employers, border agencies). No load testing exists.

## Acceptance Criteria
- \`k6\` or \`autocannon\` load test script for \`GET /verify/:wallet\`
- Baseline: 100 concurrent users, 60 seconds
- Acceptance: p95 response time < 500ms, 0% error rate
- Load test results stored as CI artifacts on scheduled runs

**Priority:** Medium | **Effort:** Medium" "testing,backend,performance"

c "TEST-009 · Add contract property-based tests" "## Description
Unit tests cover known cases. Property-based tests can discover edge cases in contract logic that unit tests miss.

## Acceptance Criteria
- Property-based tests using \`proptest\` for \`mint_vaccination\` and \`verify_vaccination\`
- Properties tested: mint then verify always returns the minted record, transfer always fails, duplicate mint always fails
- Tests integrated into \`cargo test\`

**Priority:** Low | **Effort:** Medium" "testing,smart-contract"

c "TEST-010 · Set up test data factories and fixtures" "## Description
Tests across backend and frontend duplicate test data setup. No shared factories or fixtures exist, making tests brittle and hard to maintain.

## Acceptance Criteria
- Backend: test factories for \`VaccinationRecord\`, \`JWT\`, \`SEP-10 challenge\` using \`faker\` or equivalent
- Frontend: MSW (Mock Service Worker) handlers for all API endpoints
- Factories documented in \`tests/README.md\`
- All existing tests migrated to use factories

**Priority:** Medium | **Effort:** Medium" "testing,backend,frontend"
