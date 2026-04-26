# Testing Issues (TEST-001 to TEST-015)

---

### TEST-001 · Set up backend integration test suite

**Description:** No integration tests exist for the Express API. Unit tests alone cannot catch Soroban SDK integration failures, auth middleware bugs, or route-level validation issues.

**Acceptance Criteria:**
- Integration tests using `supertest` cover all routes
- Tests mock Soroban RPC calls (no live network dependency)
- Auth flow tested end-to-end: SEP-10 challenge → sign → JWT → protected route
- Tests run in CI on every PR

**Priority:** High | **Effort:** Medium
**Dependencies:** DO-001
**Labels:** `testing`, `backend`

---

### TEST-002 · Set up frontend component tests

**Description:** No frontend tests exist. Critical components (`NFTCard`, `VerificationBadge`, forms) are untested and can regress silently.

**Acceptance Criteria:**
- React Testing Library set up with Jest
- Component tests for: `NFTCard` (loading, error, data states), `VerificationBadge` (all four states), IssuerDashboard form (validation, submit)
- Tests run in CI
- Coverage threshold: 70% for components

**Priority:** High | **Effort:** Medium
**Dependencies:** DO-001
**Labels:** `testing`, `frontend`

---

### TEST-003 · Set up frontend E2E tests with Playwright

**Description:** Critical user flows (wallet connect, issue vaccination, verify wallet) are untested end-to-end. Regressions in these flows are high-impact.

**Acceptance Criteria:**
- Playwright configured with a local Docker stack as the test target
- E2E tests cover: connect wallet → view records, issue vaccination (mocked Freighter), verify wallet by address
- Tests run in CI against the full Docker stack
- Screenshots captured on failure

**Priority:** High | **Effort:** Large
**Dependencies:** DO-001, TEST-002
**Labels:** `testing`, `frontend`

---

### TEST-004 · Add Python analytics service tests

**Description:** `pytest` target exists but no tests are written. Analytics calculations and batch verification are untested.

**Acceptance Criteria:**
- Unit tests for all analytics calculation logic in `analytics.py`
- API endpoint tests using FastAPI `TestClient` for all four endpoints
- Batch verify tested with valid, invalid, and mixed wallet lists
- Coverage ≥ 80%

**Priority:** Medium | **Effort:** Medium
**Dependencies:** None
**Labels:** `testing`, `python-service`

---

### TEST-005 · Add contract fuzz testing

**Description:** Soroban contracts handling healthcare data need fuzz testing to catch unexpected input handling beyond normal unit test cases.

**Acceptance Criteria:**
- Fuzz targets for `mint_vaccination` inputs (malformed addresses, empty strings, max-length strings, special characters)
- Fuzz targets for `verify_vaccination` with non-existent and malformed wallets
- Integrated into CI with a time-bounded run (60 seconds)
- Any panic or unexpected error fails the CI run

**Priority:** Medium | **Effort:** Medium
**Dependencies:** SC-003
**Labels:** `testing`, `smart-contract`, `security`

---

### TEST-006 · Implement SEP-10 authentication flow tests

**Description:** The SEP-10 challenge/verify flow is security-critical and has no dedicated tests. Edge cases (expired challenge, replayed nonce, wrong network passphrase) are untested.

**Acceptance Criteria:**
- Tests for: valid flow, expired challenge (>5 min), replayed nonce, wrong network passphrase, invalid signature, missing fields
- Tests use real Stellar SDK keypairs (not mocks) for signature generation
- All tests pass in CI without live network access

**Priority:** Critical | **Effort:** Medium
**Dependencies:** BE-016
**Labels:** `testing`, `backend`, `security`

---

### TEST-007 · Add contract upgrade and migration tests

**Description:** Once the contract upgrade mechanism is implemented, the upgrade path must be tested to ensure existing data is readable after an upgrade.

**Acceptance Criteria:**
- Test deploys v1 contract, mints records, upgrades to v2, verifies records still readable
- Schema version field correctly read across versions
- Upgrade with incompatible schema fails gracefully
- Tests run on testnet in CI

**Priority:** Medium | **Effort:** Medium
**Dependencies:** SC-012, SC-007
**Labels:** `testing`, `smart-contract`

---

### TEST-008 · Add load tests for public verification endpoint

**Description:** `/verify/:wallet` is a public endpoint expected to handle high traffic (schools, employers, border agencies). No load testing exists.

**Acceptance Criteria:**
- `k6` or `autocannon` load test script for `GET /verify/:wallet`
- Baseline: 100 concurrent users, 60 seconds
- Acceptance: p95 response time < 500ms, 0% error rate
- Load test results stored as CI artifacts on scheduled runs

**Priority:** Medium | **Effort:** Medium
**Dependencies:** DO-001
**Labels:** `testing`, `backend`, `performance`

---

### TEST-009 · Add contract property-based tests

**Description:** Unit tests cover known cases. Property-based tests can discover edge cases in contract logic that unit tests miss.

**Acceptance Criteria:**
- Property-based tests using `proptest` for `mint_vaccination` and `verify_vaccination`
- Properties tested: mint then verify always returns the minted record, transfer always fails, duplicate mint always fails
- Tests integrated into `cargo test`

**Priority:** Low | **Effort:** Medium
**Dependencies:** SC-003
**Labels:** `testing`, `smart-contract`

---

### TEST-010 · Set up test data factories and fixtures

**Description:** Tests across backend and frontend duplicate test data setup. No shared factories or fixtures exist, making tests brittle and hard to maintain.

**Acceptance Criteria:**
- Backend: test factories for `VaccinationRecord`, `JWT`, `SEP-10 challenge` using `faker` or equivalent
- Frontend: MSW (Mock Service Worker) handlers for all API endpoints
- Factories documented in `tests/README.md`
- All existing tests migrated to use factories

**Priority:** Medium | **Effort:** Medium
**Dependencies:** TEST-001, TEST-002
**Labels:** `testing`, `backend`, `frontend`

---

### TEST-011 · Add contract security invariant tests

**Description:** Critical security invariants (soulbound enforcement, issuer-only minting, admin-only issuer management) need dedicated tests that run on every change.

**Acceptance Criteria:**
- Test: non-issuer cannot mint (any address not in allowlist)
- Test: transfer always fails regardless of caller and recipient
- Test: non-admin cannot add or revoke issuers
- Test: paused contract rejects all state-changing calls
- Tests labeled `#[test] // security-invariant` for easy identification

**Priority:** Critical | **Effort:** Small
**Dependencies:** SC-003, SC-015
**Labels:** `testing`, `smart-contract`, `security`

---

### TEST-012 · Implement backend middleware unit tests

**Description:** `auth.js` and `issuer.js` middleware are untested. Bugs in these files bypass all security controls.

**Acceptance Criteria:**
- Unit tests for `auth.js`: valid JWT, expired JWT, missing JWT, wrong role
- Unit tests for `issuer.js`: authorized issuer, revoked issuer, non-issuer wallet
- Tests mock the contract allowlist check
- 100% branch coverage for both middleware files

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `testing`, `backend`, `security`

---

### TEST-013 · Add visual regression tests for frontend

**Description:** UI changes can break the visual appearance of components without failing functional tests. No visual regression testing exists.

**Acceptance Criteria:**
- Playwright or Storybook visual regression tests for: `NFTCard`, `VerificationBadge`, Landing page
- Baseline screenshots committed to repo
- Visual diff failures block PR merge
- Diff images uploaded as CI artifacts

**Priority:** Low | **Effort:** Medium
**Dependencies:** TEST-003
**Labels:** `testing`, `frontend`

---

### TEST-014 · Add contract testnet smoke tests post-deploy

**Description:** After deploying to testnet, no automated smoke tests verify the deployed contract behaves correctly.

**Acceptance Criteria:**
- Smoke test script runs after `make deploy`: init contract, add test issuer, mint test record, verify record, revoke record
- Script exits non-zero on any failure
- Integrated into the deployment pipeline
- Test issuer and records cleaned up after smoke test

**Priority:** High | **Effort:** Small
**Dependencies:** SC-019, DO-005
**Labels:** `testing`, `smart-contract`, `devops`

---

### TEST-015 · Set up test coverage reporting and enforcement

**Description:** No coverage reporting exists across any service. Coverage thresholds are not enforced, allowing coverage to silently degrade.

**Acceptance Criteria:**
- Coverage reports generated for: backend (Istanbul/c8), frontend (Jest), Python service (pytest-cov), contracts (cargo-tarpaulin)
- Coverage reports uploaded to Codecov or equivalent in CI
- Minimum thresholds enforced: backend 70%, frontend 70%, Python 80%, contracts 85%
- Coverage badge added to README

**Priority:** Medium | **Effort:** Small
**Dependencies:** DO-001, TEST-001, TEST-002, TEST-004
**Labels:** `testing`, `ci-cd`
