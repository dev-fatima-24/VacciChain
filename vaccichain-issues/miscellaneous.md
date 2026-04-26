# Miscellaneous / Product Issues (MISC-001 to MISC-010)

---

### MISC-001 · Define product roadmap and milestone structure

**Description:** No public roadmap or milestone structure exists. Contributors and stakeholders cannot see what is planned, in progress, or blocked.

**Acceptance Criteria:**
- GitHub Milestones created for: v0.1 (testnet MVP), v0.2 (security hardening), v1.0 (mainnet launch)
- Each milestone has a target date and success criteria
- All existing issues triaged and assigned to a milestone
- Roadmap summary added to README

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `product`, `planning`

---

### MISC-002 · Add multi-language (i18n) support to frontend

**Description:** Healthcare applications serve diverse populations. English-only UI is a barrier for patients and issuers in non-English-speaking regions.

**Acceptance Criteria:**
- `react-i18next` integrated
- English and at least one additional language (e.g., French or Spanish) supported
- All user-facing strings externalized to translation files
- Language selector in the UI header
- Selected language persisted in localStorage

**Priority:** Low | **Effort:** Medium
**Dependencies:** None
**Labels:** `frontend`, `product`, `enhancement`

---

### MISC-003 · Implement patient consent and data acknowledgment flow

**Description:** Patients have no explicit consent step before their wallet address is associated with vaccination records on a public blockchain. This is a legal and ethical requirement in many jurisdictions.

**Acceptance Criteria:**
- First-time patients shown a consent screen explaining what data is stored on-chain and who can see it
- Consent recorded off-chain with timestamp and wallet address
- Issuers cannot mint to a wallet that has not consented (or consent is waived by jurisdiction config)
- Consent flow documented in the patient user guide

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `product`, `compliance`, `frontend`

---

### MISC-004 · Add support for multiple vaccine doses per vaccine type

**Description:** Many vaccines require multiple doses (e.g., COVID-19 primary series + booster). The current data model treats each record independently with no dose sequencing.

**Acceptance Criteria:**
- `VaccinationRecord` includes optional `dose_number: u32` and `dose_series: u32` fields (e.g., dose 2 of 3)
- `verify_vaccination` response indicates completion status per vaccine type
- Frontend displays dose progress (e.g., "2/3 doses received")
- Backward compatible with existing single-dose records

**Priority:** Medium | **Effort:** Medium
**Dependencies:** SC-007, MISC-001
**Labels:** `product`, `smart-contract`, `enhancement`

---

### MISC-005 · Implement issuer onboarding workflow

**Description:** Adding an issuer currently requires a direct admin contract call. There is no self-service or approval workflow for healthcare providers to apply for issuer status.

**Acceptance Criteria:**
- Healthcare providers can submit an onboarding request via the UI (name, license number, country, wallet address)
- Admin receives notification of pending requests
- Admin approves/rejects via the admin dashboard
- Approved issuers are added to the contract allowlist automatically
- Applicant notified of approval/rejection

**Priority:** Medium | **Effort:** Large
**Dependencies:** BE-014, SC-011
**Labels:** `product`, `enhancement`, `backend`, `frontend`

---

### MISC-006 · Add QR code generation for vaccination verification

**Description:** Physical verification scenarios (border control, event entry) require a scannable QR code that links to the on-chain verification result.

**Acceptance Criteria:**
- Each vaccination record in PatientDashboard has a "Show QR" button
- QR code encodes a URL to `VerifyPage?wallet=G...&token=<token_id>`
- QR code downloadable as PNG
- QR code scannable with standard mobile camera apps

**Priority:** Medium | **Effort:** Small
**Dependencies:** FE-014
**Labels:** `product`, `frontend`, `enhancement`

---

### MISC-007 · Define and implement data retention and right-to-erasure policy

**Description:** On-chain data is permanent by design (soulbound). However, off-chain data (audit logs, analytics, consent records) must comply with data retention regulations (GDPR, HIPAA).

**Acceptance Criteria:**
- Data retention policy documented for each data store (on-chain, audit logs, analytics, consent)
- Off-chain data purge mechanism implemented for data subject requests
- Policy reviewed by a legal/compliance advisor before mainnet
- Policy published in `docs/privacy-policy.md`

**Priority:** High | **Effort:** Medium
**Dependencies:** BE-017
**Labels:** `product`, `compliance`, `documentation`

---

### MISC-008 · Add support for verifier role (third-party verification without wallet)

**Description:** Schools, employers, and border agencies need to verify vaccination status without connecting a Stellar wallet. The current VerifyPage supports this but has no dedicated role or access controls.

**Acceptance Criteria:**
- Verifier API key issued to third parties (no wallet required)
- `GET /verify/:wallet` accepts verifier API key in addition to JWT
- Verifier access logged for audit purposes
- API key management UI for admins
- Rate limits applied per verifier API key

**Priority:** Medium | **Effort:** Medium
**Dependencies:** BE-014
**Labels:** `product`, `backend`, `enhancement`

---

### MISC-009 · Create demo/sandbox environment with pre-seeded data

**Description:** New contributors and evaluators have no way to explore the application without setting up a full local environment and deploying a contract.

**Acceptance Criteria:**
- Public demo environment deployed to testnet with pre-seeded vaccination records
- Demo issuer wallet available for testing (credentials in README)
- Demo environment resets weekly via automated script
- Demo environment clearly labeled as non-production

**Priority:** Low | **Effort:** Medium
**Dependencies:** DO-015
**Labels:** `product`, `devops`, `documentation`

---

### MISC-010 · Conduct usability testing with target users

**Description:** The application has been designed without input from actual patients or healthcare workers. Usability issues will only be discovered after launch.

**Acceptance Criteria:**
- Usability testing sessions conducted with at least 5 participants (mix of patients and healthcare workers)
- Test scenarios cover: connecting wallet, viewing records, issuing a record, verifying a wallet
- Findings documented in `docs/usability-findings.md`
- High-severity usability issues converted to actionable GitHub issues
- Testing completed before v1.0 mainnet launch

**Priority:** Medium | **Effort:** Medium
**Dependencies:** FE-003, FE-004, FE-009
**Labels:** `product`, `ux`
