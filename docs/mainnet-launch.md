# Mainnet Launch Checklist

This document provides a comprehensive checklist for graduating VacciChain from Stellar Testnet to Mainnet. A missed step could result in lost records or funds.

**Last Updated**: April 28, 2026  
**Status**: Ready for Review

---

## Pre-Launch Phase (2-4 weeks before)

### 1. Security Audit

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Contract code review by external auditor | Security Lead | ⬜ | Engage third-party auditor; allow 2-3 weeks |
| Audit report remediation | Dev Lead | ⬜ | Address all critical and high findings |
| Audit sign-off | Security Lead | ⬜ | Obtain written approval from auditor |
| Internal security review | Tech Lead | ⬜ | Review auth, key management, rate limiting |
| Dependency vulnerability scan | DevOps | ⬜ | Run `npm audit`, `cargo audit`, `pip audit` |
| Penetration testing (optional) | Security Lead | ⬜ | Consider for high-value deployments |

**Go/No-Go Criteria**: All critical findings resolved; audit report approved.

---

### 2. Admin Key Ceremony

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Generate mainnet admin keypair | Security Lead | ⬜ | Use hardware wallet or secure key generation |
| Backup admin secret key (encrypted) | Security Lead | ⬜ | Store in secure vault (e.g., HashiCorp Vault) |
| Backup admin public key | Security Lead | ⬜ | Store in version control (non-sensitive) |
| Generate issuer keypair | Security Lead | ⬜ | Separate from admin key |
| Backup issuer secret key (encrypted) | Security Lead | ⬜ | Store in secure vault |
| Generate SEP-10 server keypair | Security Lead | ⬜ | For challenge signing |
| Backup SEP-10 secret key (encrypted) | Security Lead | ⬜ | Store in secure vault |
| Document key rotation schedule | Security Lead | ⬜ | Plan for quarterly rotation |
| Distribute keys to authorized personnel | Security Lead | ⬜ | Use secure channels (e.g., encrypted email, in-person) |

**Go/No-Go Criteria**: All keys generated, backed up, and securely distributed. No keys stored in plaintext.

---

### 3. Environment Configuration

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Create mainnet `.env` file | DevOps | ⬜ | Use mainnet Horizon and Soroban RPC URLs |
| Set `STELLAR_NETWORK=mainnet` | DevOps | ⬜ | Verify network passphrase matches Stellar mainnet |
| Set `HORIZON_URL` to mainnet endpoint | DevOps | ⬜ | Use official Stellar Horizon: https://horizon.stellar.org |
| Set `SOROBAN_RPC_URL` to mainnet endpoint | DevOps | ⬜ | Use official Soroban RPC endpoint |
| Set `STELLAR_NETWORK_PASSPHRASE` | DevOps | ⬜ | Must be: `Public Global Stellar Network ; September 2015` |
| Set admin and issuer keys in `.env` | DevOps | ⬜ | Use keys from key ceremony |
| Set JWT_SECRET to strong random value | DevOps | ⬜ | Min 32 characters; rotate before launch |
| Configure rate limits for production | DevOps | ⬜ | Adjust based on expected traffic |
| Set up audit logging | DevOps | ⬜ | Configure `AUDIT_LOG_PATH` to persistent storage |
| Verify all required env vars are set | DevOps | ⬜ | Run backend startup check |

**Go/No-Go Criteria**: All environment variables configured; backend starts without errors.

---

## Deployment Phase (1 week before)

### 4. Smart Contract Deployment

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Deploy contract to mainnet | Dev Lead | ⬜ | Use `make deploy` with mainnet config |
| Record contract ID | Dev Lead | ⬜ | Store in version control and `.env` |
| Verify contract on Stellar Expert | Dev Lead | ⬜ | Check https://stellar.expert/explorer/public |
| Test contract functions on mainnet | QA Lead | ⬜ | Call mint, verify, revoke with test data |
| Verify issuer allowlist is empty | Dev Lead | ⬜ | No issuers should be pre-authorized |
| Add initial issuer (if applicable) | Dev Lead | ⬜ | Call `add_issuer` with authorized healthcare provider |
| Document contract address | Dev Lead | ⬜ | Share with all teams |

**Go/No-Go Criteria**: Contract deployed; all functions callable; issuer allowlist configured.

---

### 5. Backend Deployment

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Build backend Docker image | DevOps | ⬜ | Tag with version (e.g., `v1.0.0-mainnet`) |
| Push image to container registry | DevOps | ⬜ | Use private registry or Docker Hub |
| Deploy to production infrastructure | DevOps | ⬜ | Use Kubernetes, ECS, or similar |
| Verify backend health endpoint | DevOps | ⬜ | `GET /health` should return `{"status":"ok"}` |
| Verify Swagger UI is accessible | QA Lead | ⬜ | `GET /docs` should load OpenAPI spec |
| Test SEP-10 auth flow | QA Lead | ⬜ | Generate challenge, sign, verify JWT |
| Test vaccination issue endpoint | QA Lead | ⬜ | Issue test vaccination record |
| Test verification endpoint | QA Lead | ⬜ | Verify test wallet status |
| Monitor backend logs for errors | DevOps | ⬜ | Check for startup errors, connection issues |

**Go/No-Go Criteria**: Backend running; all endpoints responding; no error logs.

---

### 6. Frontend Deployment

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Build frontend with mainnet config | DevOps | ⬜ | Set backend URL to mainnet endpoint |
| Deploy frontend to CDN or web server | DevOps | ⬜ | Use HTTPS only |
| Verify frontend loads | QA Lead | ⬜ | Check landing page, no console errors |
| Test Freighter wallet connection | QA Lead | ⬜ | Connect with mainnet wallet |
| Test patient dashboard | QA Lead | ⬜ | View vaccination records |
| Test issuer dashboard | QA Lead | ⬜ | Issue test vaccination record |
| Test verification page | QA Lead | ⬜ | Verify test wallet |
| Verify SSL certificate is valid | DevOps | ⬜ | Check certificate expiration |

**Go/No-Go Criteria**: Frontend loads; all pages functional; no security warnings.

---

### 7. Analytics Service Deployment

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Deploy Python analytics service | DevOps | ⬜ | Use mainnet backend URL |
| Verify analytics endpoints respond | QA Lead | ⬜ | Test `/analytics/rates`, `/analytics/issuers` |
| Test batch verification endpoint | QA Lead | ⬜ | Verify multiple wallets |
| Monitor analytics logs | DevOps | ⬜ | Check for connection errors |

**Go/No-Go Criteria**: Analytics service running; endpoints responding.

---

## Testing Phase (3-5 days before)

### 8. Smoke Tests

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| End-to-end patient flow | QA Lead | ⬜ | Connect wallet → view records → export |
| End-to-end issuer flow | QA Lead | ⬜ | Issue vaccination → verify on-chain |
| End-to-end verifier flow | QA Lead | ⬜ | Verify wallet status via public endpoint |
| Test with real mainnet wallet | QA Lead | ⬜ | Use funded testnet wallet (if available) |
| Verify audit logs are being written | QA Lead | ⬜ | Check audit log file for entries |
| Test rate limiting | QA Lead | ⬜ | Verify rate limits are enforced |
| Test error handling | QA Lead | ⬜ | Trigger errors; verify graceful responses |
| Load test (optional) | QA Lead | ⬜ | Simulate expected traffic volume |

**Go/No-Go Criteria**: All smoke tests pass; no critical errors; performance acceptable.

---

### 9. Security Verification

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Verify HTTPS is enforced | Security Lead | ⬜ | All endpoints should redirect HTTP to HTTPS |
| Verify JWT tokens are short-lived | Security Lead | ⬜ | Tokens should expire in 1 hour |
| Verify API keys are not logged | Security Lead | ⬜ | Check logs for sensitive data |
| Verify CORS is properly configured | Security Lead | ⬜ | Only allow trusted origins |
| Verify rate limits are active | Security Lead | ⬜ | Test with excessive requests |
| Verify contract is immutable | Security Lead | ⬜ | Confirm no upgrade path exists |
| Verify soulbound enforcement | Security Lead | ⬜ | Attempt transfer; should fail |

**Go/No-Go Criteria**: All security checks pass; no vulnerabilities found.

---

## Launch Day

### 10. Final Checks (2 hours before launch)

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Verify all systems are running | DevOps | ⬜ | Backend, frontend, analytics, contract |
| Check monitoring and alerting | DevOps | ⬜ | Ensure alerts are configured |
| Verify backup systems are in place | DevOps | ⬜ | Database backups, key backups |
| Notify stakeholders | Product Lead | ⬜ | Send launch notification to team |
| Prepare rollback plan | DevOps | ⬜ | Document rollback steps |
| Have incident response team on standby | DevOps | ⬜ | Team available for 24 hours post-launch |

**Go/No-Go Criteria**: All systems operational; team ready; rollback plan documented.

---

### 11. Launch Execution

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Announce mainnet launch | Product Lead | ⬜ | Update website, social media, docs |
| Monitor system health for 1 hour | DevOps | ⬜ | Watch logs, metrics, error rates |
| Monitor system health for 24 hours | DevOps | ⬜ | Continue monitoring; be ready to rollback |
| Collect user feedback | Product Lead | ⬜ | Monitor support channels |
| Document any issues | DevOps | ⬜ | Create issues for post-launch improvements |

**Go/No-Go Criteria**: No critical errors; system stable; users able to transact.

---

## Post-Launch (1-2 weeks after)

### 12. Stabilization

| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Monitor system performance | DevOps | ⬜ | Track latency, error rates, throughput |
| Review audit logs for anomalies | Security Lead | ⬜ | Look for suspicious activity |
| Collect metrics on vaccination issuance | Analytics Lead | ⬜ | Track adoption, usage patterns |
| Address any reported bugs | Dev Lead | ⬜ | Prioritize critical issues |
| Publish post-launch report | Product Lead | ⬜ | Document launch results, lessons learned |

**Go/No-Go Criteria**: System stable; no critical issues; metrics healthy.

---

## Rollback Plan

If critical issues are discovered, follow this rollback procedure:

### Immediate Actions (within 15 minutes)

1. **Notify all stakeholders** — Send alert to team, leadership, users
2. **Stop accepting new transactions** — Disable issue/revoke endpoints
3. **Assess severity** — Determine if rollback is necessary
4. **Prepare rollback** — Have DevOps team ready to execute

### Rollback Execution (if needed)

1. **Revert frontend** — Deploy previous stable version
2. **Revert backend** — Deploy previous stable version
3. **Verify contract state** — Ensure no corrupted data
4. **Communicate status** — Update users on rollback progress
5. **Post-mortem** — Document root cause and prevention measures

### Rollback Criteria

- Data corruption detected
- Security vulnerability exploited
- System unavailable for >30 minutes
- Loss of funds or records

---

## Sign-Off

This checklist must be reviewed and approved by at least two contributors before mainnet launch.

### Reviewer 1

- **Name**: ___________________
- **Role**: ___________________
- **Date**: ___________________
- **Signature**: ___________________

### Reviewer 2

- **Name**: ___________________
- **Role**: ___________________
- **Date**: ___________________
- **Signature**: ___________________

---

## References

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [VacciChain Architecture](../README.md)
- [Security Threat Model](./security/threat-model.md)
- [Configuration Guide](./configuration.md)
