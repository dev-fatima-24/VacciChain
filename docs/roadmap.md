# VacciChain Product Roadmap

This document describes the planned milestones, their success criteria, and target dates.
All existing issues are triaged and assigned to a milestone in the GitHub Milestones UI.

---

## Milestones

### v0.1 — Testnet MVP
**Target date:** 2026-06-30

The first public release. Core functionality is working end-to-end on Stellar Testnet.

**Success criteria:**
- Soroban contract deployed to testnet with mint, verify, revoke, and issuer management
- Backend REST API fully operational (auth, vaccination, verify, admin)
- Frontend: patient dashboard, issuer dashboard, verify page, admin API key management
- SEP-10 authentication working with Freighter wallet
- Docker Compose stack runs with a single command
- CI pipeline passing (lint, unit tests, contract tests)
- Public demo environment live and reset weekly

**Issues in scope:** #1–#50 (core contract, backend, frontend, CI)

---

### v0.2 — Security Hardening
**Target date:** 2026-09-30

Addresses security findings from internal review and prepares for external audit.

**Success criteria:**
- Analytics service authentication implemented (#114)
- Brute-force protection on auth endpoints (#110)
- Issuer onboarding workflow with admin approval (#120)
- Rate limiting reviewed and tightened across all endpoints
- Secrets management via AWS Secrets Manager in production
- Contract audit completed; all critical/high findings resolved
- Threat model reviewed and updated
- Penetration test report reviewed

**Issues in scope:** #51–#130 (security, auth hardening, onboarding)

---

### v1.0 — Mainnet Launch
**Target date:** 2026-12-31

Production-ready release on Stellar Mainnet.

**Success criteria:**
- All v0.2 security criteria met
- Contract deployed to Stellar Mainnet
- Staging environment validated against mainnet configuration
- Backup and restore procedures tested
- SLA and monitoring dashboards in place (Prometheus + Grafana)
- Privacy policy and user guides published
- Load testing completed (≥500 concurrent users)
- Mainnet launch checklist signed off (see docs/mainnet-launch.md)

**Issues in scope:** #131+ (mainnet, performance, compliance, documentation)

---

## Issue Triage

| Issue | Title | Milestone |
|-------|-------|-----------|
| #110 | Brute-force protection on auth endpoints | v0.2 |
| #114 | Analytics service authentication | v0.2 |
| #116 | Product roadmap and milestone structure | v0.2 |
| #120 | Issuer onboarding workflow | v0.2 |

> All other open issues are triaged in GitHub Milestones. See the
> [Milestones page](https://github.com/bigvictoh/VacciChain/milestones) for the full list.

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to pick up issues and submit PRs.
Each issue should reference its milestone in the PR description.
