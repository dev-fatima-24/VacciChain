# Documentation Issues (DOC-001 to DOC-010)

---

### DOC-001 · Write Soroban contract developer documentation

**Description:** No documentation exists for the smart contract internals. New contributors cannot understand storage schemas, error codes, or function signatures without reading all source files.

**Acceptance Criteria:**
- `contracts/README.md` documents all public functions with params, return types, and errors
- Storage schema documented with key formats and data types
- All `ContractError` variants documented with codes and trigger conditions
- Build, test, and deploy instructions included

**Priority:** High | **Effort:** Medium
**Dependencies:** SC-018
**Labels:** `documentation`, `smart-contract`

---

### DOC-002 · Generate OpenAPI spec for the backend API

**Description:** The API is documented only in the README prose. No machine-readable spec exists for client generation, testing tools, or third-party integrations.

**Acceptance Criteria:**
- OpenAPI 3.0 spec generated via `swagger-jsdoc` or equivalent
- Spec served at `GET /docs` in development (Swagger UI)
- All request/response schemas documented including error responses
- Spec committed to repo and kept in sync via CI lint check

**Priority:** Medium | **Effort:** Medium
**Dependencies:** BE-015
**Labels:** `documentation`, `backend`

---

### DOC-003 · Write analytics service API documentation

**Description:** The Python FastAPI service has no documented request/response schemas. Consumers of the analytics API have no contract to code against.

**Acceptance Criteria:**
- FastAPI auto-generated docs available at `/docs` (Swagger UI) and `/redoc`
- All endpoints have Pydantic response models with field descriptions
- Batch verify endpoint documents input format, size limits, and error responses
- Authentication requirements documented per endpoint

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `documentation`, `python-service`

---

### DOC-004 · Create contributor onboarding guide

**Description:** No `CONTRIBUTING.md` exists. Contributors don't know the branching strategy, PR process, commit conventions, or local setup steps.

**Acceptance Criteria:**
- `CONTRIBUTING.md` covers: local setup, branching strategy (`feature/`, `fix/`, `chore/`), PR process, commit conventions (Conventional Commits)
- PR template created at `.github/pull_request_template.md`
- Issue templates created for bug reports and feature requests at `.github/ISSUE_TEMPLATE/`
- Code of conduct added

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `documentation`

---

### DOC-005 · Document SEP-10 authentication flow for integrators

**Description:** Third-party systems (schools, employers, border agencies) need to understand how to authenticate and call the verification API. The current README only shows the internal flow diagram.

**Acceptance Criteria:**
- `docs/integration-guide.md` documents the full SEP-10 flow for external integrators
- Step-by-step guide with example requests and responses
- Common error scenarios and how to handle them
- Code examples in JavaScript and Python

**Priority:** Medium | **Effort:** Medium
**Dependencies:** DOC-002
**Labels:** `documentation`

---

### DOC-006 · Write architecture decision records (ADRs)

**Description:** Key architectural decisions (Stellar/Soroban choice, soulbound enforcement at contract level, SEP-10 auth) are not documented. Future contributors cannot understand why decisions were made.

**Acceptance Criteria:**
- ADR template created at `docs/adr/template.md`
- ADRs written for: choice of Stellar/Soroban, soulbound token design, SEP-10 over other auth methods, Python analytics service separation
- Each ADR includes: context, decision, consequences, alternatives considered

**Priority:** Low | **Effort:** Medium
**Dependencies:** None
**Labels:** `documentation`

---

### DOC-007 · Create mainnet launch checklist

**Description:** No checklist exists for graduating from testnet to mainnet. A missed step (wrong network passphrase, unaudited contract) could result in lost records or funds.

**Acceptance Criteria:**
- `docs/mainnet-launch.md` covers: contract security audit, admin key ceremony, environment variable swap, smoke tests, rollback plan
- Checklist reviewed and signed off by at least two contributors
- Each checklist item has a responsible owner field
- Go/no-go criteria defined

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `documentation`, `product`

---

### DOC-008 · Document environment variables with validation rules

**Description:** Environment variables are listed in the README but without validation rules, defaults, or examples. Misconfigured deployments fail with cryptic errors.

**Acceptance Criteria:**
- Each env var documented with: description, required/optional, format, example value, default (if optional)
- Validation rules documented (e.g., `STELLAR_NETWORK` must be `testnet` or `mainnet`)
- Documentation kept in sync with `BE-019` startup validation schema
- Available in both README and a dedicated `docs/configuration.md`

**Priority:** Medium | **Effort:** Small
**Dependencies:** BE-019
**Labels:** `documentation`, `devops`

---

### DOC-009 · Write patient and issuer user guides

**Description:** Non-technical users (patients, healthcare workers) have no documentation on how to use the application. The README is developer-focused.

**Acceptance Criteria:**
- `docs/user-guide-patient.md`: how to connect Freighter, view vaccination records, export certificate
- `docs/user-guide-issuer.md`: how to issue a vaccination record, understand authorization status
- Guides include screenshots
- Guides linked from the Landing page

**Priority:** Low | **Effort:** Medium
**Dependencies:** FE-020
**Labels:** `documentation`, `product`

---

### DOC-010 · Add inline code documentation (JSDoc / rustdoc)

**Description:** Backend and contract source files have minimal inline documentation. New contributors must read implementation details to understand function behavior.

**Acceptance Criteria:**
- All public Rust contract functions have `rustdoc` comments with `# Arguments`, `# Returns`, `# Errors`
- All Express route handlers have JSDoc comments with `@param`, `@returns`, `@throws`
- All middleware functions documented with purpose and side effects
- `cargo doc` generates valid HTML documentation without warnings

**Priority:** Low | **Effort:** Medium
**Dependencies:** None
**Labels:** `documentation`, `smart-contract`, `backend`
