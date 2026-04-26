#!/bin/bash
REPO="dev-fatima-24/VacciChain"
c() { gh issue create --repo "$REPO" --title "$1" --body "$2" --label "$3" && sleep 1; }

c "SEC-011 · Implement wallet address allowlist for patient registration" "## Description
Any Stellar wallet can receive a vaccination record. There is no mechanism to prevent issuers from minting to arbitrary or attacker-controlled addresses.

## Acceptance Criteria
- Design decision documented: open minting vs. patient pre-registration
- If pre-registration chosen: patient must authenticate via SEP-10 before receiving a record
- If open minting chosen: risk documented and accepted in \`docs/security/threat-model.md\`
- Decision reviewed by project stakeholders

**Priority:** Medium | **Effort:** Medium" "security,product"

c "SEC-012 · Create threat model document" "## Description
No threat model exists for VacciChain. Security decisions are made ad-hoc without a systematic view of attack surfaces and mitigations.

## Acceptance Criteria
- \`docs/security/threat-model.md\` covers: assets, threat actors, attack vectors, mitigations
- STRIDE analysis applied to: contract, backend API, frontend, analytics service
- Trust boundaries clearly defined (on-chain vs. off-chain)
- Threat model reviewed and updated before mainnet launch

**Priority:** High | **Effort:** Medium" "security,documentation"

c "SEC-013 · Enforce principle of least privilege in Docker containers" "## Description
Containers likely run as root. A container escape or RCE vulnerability would have full host access.

## Acceptance Criteria
- All containers run as non-root users
- Read-only root filesystems where possible
- \`no-new-privileges\` security option set
- Capabilities dropped to minimum required
- Verified with \`docker inspect\` and \`trivy\` config scan

**Priority:** High | **Effort:** Small" "security,devops"

c "SEC-014 · Implement analytics service authentication" "## Description
The Python analytics service endpoints are completely unauthenticated. Vaccination rate data and anomaly flags are publicly accessible.

## Acceptance Criteria
- Analytics endpoints require a valid API key or admin JWT
- API key stored in secrets manager, not hardcoded
- Unauthenticated requests return \`401\`
- Public batch verify endpoint (\`/batch/verify\`) may remain open but rate-limited

**Priority:** High | **Effort:** Small" "security,python-service"

c "SEC-015 · Add anomaly detection alerting for unusual minting patterns" "## Description
The analytics service detects anomalies but only exposes them via a GET endpoint. Unusual minting patterns need real-time alerts.

## Acceptance Criteria
- Anomaly detection runs on a configurable schedule (default: every 15 minutes)
- Alerts sent via webhook (Slack, PagerDuty, or email) when anomalies are detected
- Alert includes: issuer address, anomaly type, record count, timestamp
- Alert thresholds configurable via environment variables

**Priority:** Medium | **Effort:** Medium" "security,python-service,observability"

c "MISC-001 · Define product roadmap and milestone structure" "## Description
No public roadmap or milestone structure exists. Contributors and stakeholders cannot see what is planned, in progress, or blocked.

## Acceptance Criteria
- GitHub Milestones created for: v0.1 (testnet MVP), v0.2 (security hardening), v1.0 (mainnet launch)
- Each milestone has a target date and success criteria
- All existing issues triaged and assigned to a milestone
- Roadmap summary added to README

**Priority:** High | **Effort:** Small" "product,planning"

c "MISC-002 · Add multi-language (i18n) support to frontend" "## Description
Healthcare applications serve diverse populations. English-only UI is a barrier for patients and issuers in non-English-speaking regions.

## Acceptance Criteria
- \`react-i18next\` integrated
- English and at least one additional language (e.g., French or Spanish) supported
- All user-facing strings externalized to translation files
- Language selector in the UI header
- Selected language persisted in localStorage

**Priority:** Low | **Effort:** Medium" "frontend,product,enhancement"

c "MISC-003 · Implement patient consent and data acknowledgment flow" "## Description
Patients have no explicit consent step before their wallet address is associated with vaccination records on a public blockchain. This is a legal and ethical requirement in many jurisdictions.

## Acceptance Criteria
- First-time patients shown a consent screen explaining what data is stored on-chain and who can see it
- Consent recorded off-chain with timestamp and wallet address
- Issuers cannot mint to a wallet that has not consented (or consent is waived by jurisdiction config)
- Consent flow documented in the patient user guide

**Priority:** High | **Effort:** Medium" "product,compliance,frontend"

c "MISC-004 · Add support for multiple vaccine doses per vaccine type" "## Description
Many vaccines require multiple doses (e.g., COVID-19 primary series + booster). The current data model treats each record independently with no dose sequencing.

## Acceptance Criteria
- \`VaccinationRecord\` includes optional \`dose_number: u32\` and \`dose_series: u32\` fields (e.g., dose 2 of 3)
- \`verify_vaccination\` response indicates completion status per vaccine type
- Frontend displays dose progress (e.g., '2/3 doses received')
- Backward compatible with existing single-dose records

**Priority:** Medium | **Effort:** Medium" "product,smart-contract,enhancement"

c "MISC-005 · Implement issuer onboarding workflow" "## Description
Adding an issuer currently requires a direct admin contract call. There is no self-service or approval workflow for healthcare providers to apply for issuer status.

## Acceptance Criteria
- Healthcare providers can submit an onboarding request via the UI (name, license number, country, wallet address)
- Admin receives notification of pending requests
- Admin approves/rejects via the admin dashboard
- Approved issuers are added to the contract allowlist automatically
- Applicant notified of approval/rejection

**Priority:** Medium | **Effort:** Large" "product,enhancement,backend,frontend"

c "MISC-006 · Add QR code generation for vaccination verification" "## Description
Physical verification scenarios (border control, event entry) require a scannable QR code that links to the on-chain verification result.

## Acceptance Criteria
- Each vaccination record in PatientDashboard has a 'Show QR' button
- QR code encodes a URL to \`VerifyPage?wallet=G...&token=<token_id>\`
- QR code downloadable as PNG
- QR code scannable with standard mobile camera apps

**Priority:** Medium | **Effort:** Small" "product,frontend,enhancement"

c "MISC-007 · Define and implement data retention and right-to-erasure policy" "## Description
On-chain data is permanent by design (soulbound). However, off-chain data (audit logs, analytics, consent records) must comply with data retention regulations (GDPR, HIPAA).

## Acceptance Criteria
- Data retention policy documented for each data store (on-chain, audit logs, analytics, consent)
- Off-chain data purge mechanism implemented for data subject requests
- Policy reviewed by a legal/compliance advisor before mainnet
- Policy published in \`docs/privacy-policy.md\`

**Priority:** High | **Effort:** Medium" "product,compliance,documentation"

c "MISC-008 · Add support for verifier role (third-party verification without wallet)" "## Description
Schools, employers, and border agencies need to verify vaccination status without connecting a Stellar wallet.

## Acceptance Criteria
- Verifier API key issued to third parties (no wallet required)
- \`GET /verify/:wallet\` accepts verifier API key in addition to JWT
- Verifier access logged for audit purposes
- API key management UI for admins
- Rate limits applied per verifier API key

**Priority:** Medium | **Effort:** Medium" "product,backend,enhancement"

c "MISC-009 · Create demo/sandbox environment with pre-seeded data" "## Description
New contributors and evaluators have no way to explore the application without setting up a full local environment and deploying a contract.

## Acceptance Criteria
- Public demo environment deployed to testnet with pre-seeded vaccination records
- Demo issuer wallet available for testing (credentials in README)
- Demo environment resets weekly via automated script
- Demo environment clearly labeled as non-production

**Priority:** Low | **Effort:** Medium" "product,devops,documentation"

c "MISC-010 · Conduct usability testing with target users" "## Description
The application has been designed without input from actual patients or healthcare workers. Usability issues will only be discovered after launch.

## Acceptance Criteria
- Usability testing sessions conducted with at least 5 participants (mix of patients and healthcare workers)
- Test scenarios cover: connecting wallet, viewing records, issuing a record, verifying a wallet
- Findings documented in \`docs/usability-findings.md\`
- High-severity usability issues converted to actionable GitHub issues
- Testing completed before v1.0 mainnet launch

**Priority:** Medium | **Effort:** Medium" "product,ux"
