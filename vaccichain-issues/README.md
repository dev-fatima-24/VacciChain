# VacciChain — Issue Index

> 125 development issues across 8 domains. Generated for the VacciChain project (Stellar/Soroban blockchain vaccination records).

---

## Summary

| Domain | File | Count | Critical | High | Medium | Low |
|---|---|---|---|---|---|---|
| Frontend | [frontend.md](./frontend.md) | 20 | 0 | 8 | 9 | 3 |
| Backend | [backend.md](./backend.md) | 20 | 4 | 10 | 6 | 0 |
| Smart Contracts | [smart-contracts.md](./smart-contracts.md) | 20 | 3 | 10 | 5 | 2 |
| DevOps | [devops.md](./devops.md) | 15 | 1 | 6 | 6 | 2 |
| Documentation | [documentation.md](./documentation.md) | 10 | 0 | 3 | 5 | 2 |
| Testing | [testing.md](./testing.md) | 15 | 2 | 6 | 6 | 1 |
| Security | [security.md](./security.md) | 15 | 4 | 9 | 2 | 0 |
| Miscellaneous / Product | [miscellaneous.md](./miscellaneous.md) | 10 | 0 | 3 | 6 | 1 |
| **Total** | | **125** | **14** | **55** | **45** | **11** |

---

## All Issues

### 🖥️ Frontend (FE-001 – FE-020)

| ID | Title | Priority | Effort |
|---|---|---|---|
| FE-001 | Implement wallet connection state persistence | High | Small |
| FE-002 | Add loading and error states to NFTCard | High | Small |
| FE-003 | Make all pages mobile-responsive | Medium | Medium |
| FE-004 | Implement WCAG 2.1 AA accessibility compliance | High | Medium |
| FE-005 | Add form validation to IssuerDashboard vaccination form | High | Small |
| FE-006 | Implement global error boundary and toast notification system | Medium | Small |
| FE-007 | Add JWT expiry handling and auto-logout | High | Small |
| FE-008 | Implement VerificationBadge visual states | Medium | Small |
| FE-009 | Add network selector for testnet/mainnet | Medium | Small |
| FE-010 | Implement patient vaccination record detail view | Medium | Small |
| FE-011 | Add Freighter not-installed detection and install prompt | High | Small |
| FE-012 | Implement issuer authorization status indicator | Medium | Small |
| FE-013 | Add copy-to-clipboard for wallet addresses and token IDs | Low | Small |
| FE-014 | Implement VerifyPage URL-based wallet lookup | Medium | Small |
| FE-015 | Add pagination to PatientDashboard NFT list | Medium | Small |
| FE-016 | Implement dark mode support | Low | Medium |
| FE-017 | Add confirmation dialog before vaccination issuance | High | Small |
| FE-018 | Implement session timeout warning | Medium | Small |
| FE-019 | Add analytics dashboard page | Low | Large |
| FE-020 | Implement vaccination certificate PDF export | Medium | Medium |

---

### ⚙️ Backend (BE-001 – BE-020)

| ID | Title | Priority | Effort |
|---|---|---|---|
| BE-001 | Validate Stellar public key format on all endpoints | Critical | Small |
| BE-002 | Implement rate limiting on public endpoints | High | Small |
| BE-003 | Add structured logging with request correlation IDs | Medium | Small |
| BE-004 | Implement idempotency for `/vaccination/issue` | High | Medium |
| BE-005 | Enforce real-time issuer authorization check in middleware | Critical | Medium |
| BE-006 | Add health check endpoint | Medium | Small |
| BE-007 | Paginate `GET /vaccination/:wallet` response | Medium | Small |
| BE-008 | Implement request body size limits | Medium | Small |
| BE-009 | Add CORS configuration | High | Small |
| BE-010 | Implement graceful shutdown handling | Medium | Small |
| BE-011 | Add Soroban RPC retry logic with exponential backoff | Medium | Small |
| BE-012 | Validate JWT claims completeness | High | Small |
| BE-013 | Add request/response schema validation middleware | High | Medium |
| BE-014 | Implement admin endpoints for issuer management | High | Medium |
| BE-015 | Add API versioning | Medium | Small |
| BE-016 | Implement SEP-10 nonce storage and single-use enforcement | Critical | Medium |
| BE-017 | Add audit log for all state-changing operations | High | Medium |
| BE-018 | Implement contract event indexing | High | Large |
| BE-019 | Add environment variable validation on startup | High | Small |
| BE-020 | Implement `/vaccination/issue` response with transaction details | Medium | Small |

---

### 🔗 Smart Contracts (SC-001 – SC-020)

| ID | Title | Priority | Effort |
|---|---|---|---|
| SC-001 | Enforce duplicate vaccination record detection in mint.rs | Critical | Small |
| SC-002 | Emit structured events for all state-changing operations | High | Small |
| SC-003 | Write comprehensive contract unit tests | High | Medium |
| SC-004 | Add admin key rotation mechanism | High | Medium |
| SC-005 | Define and implement deterministic token_id generation | High | Small |
| SC-006 | Add vaccination record revocation function | High | Medium |
| SC-007 | Add schema version field to VaccinationRecord | High | Small |
| SC-008 | Implement transfer function with explicit revert and error | High | Small |
| SC-009 | Add input length validation for all string fields | Medium | Small |
| SC-010 | Implement batch verification function | Medium | Small |
| SC-011 | Add issuer metadata storage | Medium | Medium |
| SC-012 | Implement contract upgrade mechanism | High | Medium |
| SC-013 | Add contract initialization guard | Critical | Small |
| SC-014 | Implement vaccination record count limit per patient | Medium | Small |
| SC-015 | Add contract pause mechanism for emergency stops | High | Small |
| SC-016 | Optimize storage key schema for gas efficiency | Low | Medium |
| SC-017 | Add `get_all_issuers` admin function | Medium | Small |
| SC-018 | Document all contract error codes | Medium | Small |
| SC-019 | Add testnet deployment script with verification | Medium | Small |
| SC-020 | Implement fee/tip configuration for contract calls | Low | Small |

---

### 🐳 DevOps (DO-001 – DO-015)

| ID | Title | Priority | Effort |
|---|---|---|---|
| DO-001 | Set up CI pipeline with GitHub Actions | Critical | Medium |
| DO-002 | Add `.env.example` with all required variables documented | High | Small |
| DO-003 | Add `healthcheck` directives to `docker-compose.yml` | Medium | Small |
| DO-004 | Pin all Docker base image versions | Medium | Small |
| DO-005 | Add production deployment pipeline | High | Large |
| DO-006 | Set up centralized log aggregation | Medium | Medium |
| DO-007 | Add Docker multi-stage builds to reduce image sizes | Medium | Small |
| DO-008 | Configure resource limits in docker-compose.yml | Medium | Small |
| DO-009 | Set up infrastructure-as-code for cloud deployment | High | Large |
| DO-010 | Add uptime monitoring and alerting | Medium | Small |
| DO-011 | Implement automated database/state backup for analytics service | Medium | Medium |
| DO-012 | Add container vulnerability scanning to CI | High | Small |
| DO-013 | Configure secrets management for production | Critical | Medium |
| DO-014 | Add performance benchmarking to CI | Low | Medium |
| DO-015 | Create staging environment matching production | High | Large |

---

### 📄 Documentation (DOC-001 – DOC-010)

| ID | Title | Priority | Effort |
|---|---|---|---|
| DOC-001 | Write Soroban contract developer documentation | High | Medium |
| DOC-002 | Generate OpenAPI spec for the backend API | Medium | Medium |
| DOC-003 | Write analytics service API documentation | Medium | Small |
| DOC-004 | Create contributor onboarding guide | Medium | Small |
| DOC-005 | Document SEP-10 authentication flow for integrators | Medium | Medium |
| DOC-006 | Write architecture decision records (ADRs) | Low | Medium |
| DOC-007 | Create mainnet launch checklist | High | Small |
| DOC-008 | Document environment variables with validation rules | Medium | Small |
| DOC-009 | Write patient and issuer user guides | Low | Medium |
| DOC-010 | Add inline code documentation (JSDoc / rustdoc) | Low | Medium |

---

### 🧪 Testing (TEST-001 – TEST-015)

| ID | Title | Priority | Effort |
|---|---|---|---|
| TEST-001 | Set up backend integration test suite | High | Medium |
| TEST-002 | Set up frontend component tests | High | Medium |
| TEST-003 | Set up frontend E2E tests with Playwright | High | Large |
| TEST-004 | Add Python analytics service tests | Medium | Medium |
| TEST-005 | Add contract fuzz testing | Medium | Medium |
| TEST-006 | Implement SEP-10 authentication flow tests | Critical | Medium |
| TEST-007 | Add contract upgrade and migration tests | Medium | Medium |
| TEST-008 | Add load tests for public verification endpoint | Medium | Medium |
| TEST-009 | Add contract property-based tests | Low | Medium |
| TEST-010 | Set up test data factories and fixtures | Medium | Medium |
| TEST-011 | Add contract security invariant tests | Critical | Small |
| TEST-012 | Implement backend middleware unit tests | High | Small |
| TEST-013 | Add visual regression tests for frontend | Low | Medium |
| TEST-014 | Add contract testnet smoke tests post-deploy | High | Small |
| TEST-015 | Set up test coverage reporting and enforcement | Medium | Small |

---

### 🔒 Security (SEC-001 – SEC-015)

| ID | Title | Priority | Effort |
|---|---|---|---|
| SEC-001 | Conduct SEP-10 implementation security review | Critical | Medium |
| SEC-002 | Add secrets scanning to CI pipeline | High | Small |
| SEC-003 | Implement Content Security Policy and security headers | High | Small |
| SEC-004 | Perform dependency vulnerability audit across all services | High | Small |
| SEC-005 | Enforce HTTPS and secure transport in production | Critical | Medium |
| SEC-006 | Conduct smart contract security audit | Critical | Large |
| SEC-007 | Implement JWT signing key rotation | High | Medium |
| SEC-008 | Add input sanitization to prevent injection attacks | High | Small |
| SEC-009 | Implement admin action multi-signature requirement | High | Large |
| SEC-010 | Add brute-force protection on auth endpoints | High | Medium |
| SEC-011 | Implement wallet address allowlist for patient registration | Medium | Medium |
| SEC-012 | Create threat model document | High | Medium |
| SEC-013 | Enforce principle of least privilege in Docker containers | High | Small |
| SEC-014 | Implement analytics service authentication | High | Small |
| SEC-015 | Add anomaly detection alerting for unusual minting patterns | Medium | Medium |

---

### 🗂️ Miscellaneous / Product (MISC-001 – MISC-010)

| ID | Title | Priority | Effort |
|---|---|---|---|
| MISC-001 | Define product roadmap and milestone structure | High | Small |
| MISC-002 | Add multi-language (i18n) support to frontend | Low | Medium |
| MISC-003 | Implement patient consent and data acknowledgment flow | High | Medium |
| MISC-004 | Add support for multiple vaccine doses per vaccine type | Medium | Medium |
| MISC-005 | Implement issuer onboarding workflow | Medium | Large |
| MISC-006 | Add QR code generation for vaccination verification | Medium | Small |
| MISC-007 | Define and implement data retention and right-to-erasure policy | High | Medium |
| MISC-008 | Add support for verifier role (third-party verification without wallet) | Medium | Medium |
| MISC-009 | Create demo/sandbox environment with pre-seeded data | Low | Medium |
| MISC-010 | Conduct usability testing with target users | Medium | Medium |

---

## Suggested Starting Order (Critical Path)

These issues should be resolved first as they block others or represent the highest risk:

1. **DO-001** — CI pipeline (unblocks all testing and deployment issues)
2. **BE-016** — SEP-10 nonce enforcement (auth security foundation)
3. **SC-013** — Contract initialization guard (prevents admin takeover)
4. **SC-001** — Duplicate record detection (data integrity)
5. **BE-001** — Input validation (prevents unhandled errors)
6. **BE-005** — Real-time issuer authorization check (security)
7. **DO-002** — `.env.example` (unblocks onboarding)
8. **SEC-005** — HTTPS in production (transport security)
9. **DO-013** — Secrets management (production readiness)
10. **SEC-006** — Smart contract audit (mainnet gate)
