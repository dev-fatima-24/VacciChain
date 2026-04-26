#!/bin/bash
REPO="dev-fatima-24/VacciChain"
c() { gh issue create --repo "$REPO" --title "$1" --body "$2" --label "$3" && sleep 1; }

c "BE-016 · Implement SEP-10 nonce storage and single-use enforcement" "## Description
SEP-10 challenges must be single-use. Without nonce tracking, a captured challenge transaction can be replayed.

## Acceptance Criteria
- Generated nonces stored with 5-minute TTL
- Nonce marked as used on successful \`/auth/verify\`
- Reuse of a consumed nonce returns \`401\`
- Storage backend: Redis or in-memory with TTL cleanup

**Priority:** Critical | **Effort:** Medium" "backend,security"

c "BE-017 · Add audit log for all state-changing operations" "## Description
No audit trail exists for vaccination issuances, issuer additions/revocations, or admin actions. Required for healthcare compliance.

## Acceptance Criteria
- All state-changing API calls logged with: timestamp, actor wallet, action, target, result
- Audit logs append-only (no delete/update)
- Logs queryable by actor and date range via \`GET /admin/audit\`
- Stored separately from application logs

**Priority:** High | **Effort:** Medium" "backend,security,compliance"

c "BE-018 · Implement contract event indexing" "## Description
On-chain events from the Soroban contract are not indexed by the backend. The analytics service has no reliable event source.

## Acceptance Criteria
- Background job polls Soroban RPC for contract events on a configurable interval
- Events stored in a local database with deduplication
- \`VaccinationMinted\`, \`IssuerAdded\`, \`IssuerRevoked\` events indexed
- Analytics service reads from indexed events, not live RPC

**Priority:** High | **Effort:** Large" "backend,enhancement"

c "BE-019 · Add environment variable validation on startup" "## Description
The server starts with missing or invalid environment variables and fails at runtime with cryptic errors.

## Acceptance Criteria
- All required env vars validated on startup before server binds
- Missing required vars cause immediate exit with a clear error listing which vars are missing
- Optional vars have documented defaults
- Validation uses a schema (e.g., \`envalid\` or \`zod\`)

**Priority:** High | **Effort:** Small" "backend,reliability"

c "BE-020 · Implement /vaccination/issue response with transaction details" "## Description
The issue endpoint returns minimal data after a successful mint. Clients need the transaction hash and token ID for confirmation and linking.

## Acceptance Criteria
- Successful mint response includes: \`{ tokenId, transactionHash, ledger, timestamp }\`
- Transaction hash links to Stellar Explorer
- Frontend displays confirmation with explorer link after successful issuance

**Priority:** Medium | **Effort:** Small" "backend,enhancement"

c "SC-001 · Enforce duplicate vaccination record detection in mint.rs" "## Description
The README mentions duplicate detection but it must be explicitly enforced in \`mint.rs\` by hashing \`(patient, vaccine_name, date)\` and checking storage before minting.

## Acceptance Criteria
- Mint fails with \`DuplicateRecord\` error if identical \`(patient, vaccine_name, date)\` already exists
- Unit test covers duplicate mint attempt
- Error code surfaced to backend and frontend with descriptive message

**Priority:** Critical | **Effort:** Small" "smart-contract,security,bug"

c "SC-002 · Emit structured events for all state-changing operations" "## Description
\`events.rs\` must emit events for \`mint\`, \`add_issuer\`, and \`revoke_issuer\`. Missing events break the analytics service and audit trail.

## Acceptance Criteria
- \`VaccinationMinted { patient, token_id, vaccine_name, issuer, timestamp }\` emitted on mint
- \`IssuerAdded { address, admin, timestamp }\` emitted on issuer addition
- \`IssuerRevoked { address, admin, timestamp }\` emitted on issuer revocation
- Events verified in contract unit tests

**Priority:** High | **Effort:** Small" "smart-contract,enhancement"

c "SC-003 · Write comprehensive contract unit tests" "## Description
\`cargo test\` target exists but test coverage is unknown. All contract functions need unit tests including all failure paths.

## Acceptance Criteria
- Tests for: successful mint, unauthorized mint, duplicate mint, transfer blocked, verify empty wallet, verify populated wallet, add issuer, revoke issuer, admin-only enforcement
- All tests pass with \`make test\`
- Coverage report generated via \`cargo tarpaulin\` or equivalent

**Priority:** High | **Effort:** Medium" "smart-contract,testing"

c "SC-004 · Add admin key rotation mechanism" "## Description
There is no way to transfer admin authority if the admin key is compromised. A single point of failure for the entire contract.

## Acceptance Criteria
- \`propose_admin(new_admin)\` callable only by current admin
- \`accept_admin()\` callable only by proposed new admin (two-step to prevent lockout)
- \`AdminTransferProposed\` and \`AdminTransferAccepted\` events emitted
- Proposal expires after 24 hours if not accepted

**Priority:** High | **Effort:** Medium" "smart-contract,security"

c "SC-005 · Define and implement deterministic token_id generation" "## Description
\`token_id\` generation is not specified. Collisions or predictable IDs are a security risk.

## Acceptance Criteria
- \`token_id\` generated as hash of \`(patient, vaccine_name, date, issuer, ledger_sequence)\`
- Scheme documented in \`contracts/README.md\`
- Collision resistance verified in tests with known inputs
- \`token_id\` is a fixed-length hex string

**Priority:** High | **Effort:** Small" "smart-contract,security"

c "SC-006 · Add vaccination record revocation function" "## Description
No mechanism exists to revoke an erroneously issued record. Required for real-world healthcare compliance and data correction.

## Acceptance Criteria
- \`revoke_vaccination(token_id)\` callable by the original issuer or admin
- Revoked records marked with \`revoked: true\` in storage, not deleted (audit trail preserved)
- \`verify_vaccination\` excludes revoked records from active status
- \`VaccinationRevoked { token_id, revoker, timestamp }\` event emitted

**Priority:** High | **Effort:** Medium" "smart-contract,enhancement"

c "SC-007 · Add schema version field to VaccinationRecord" "## Description
The \`VaccinationRecord\` struct has no version field. Future schema changes will silently break reads of existing on-chain records.

## Acceptance Criteria
- \`VaccinationRecord\` includes \`schema_version: u32\` field (current value: 1)
- \`verify_vaccination\` handles records of different schema versions gracefully
- Migration path documented for future schema changes

**Priority:** High | **Effort:** Small" "smart-contract,reliability"

c "SC-008 · Implement transfer function with explicit revert and error" "## Description
The \`transfer(...)\` function must exist and always revert with a clear \`SoulboundToken\` error, not just be absent.

## Acceptance Criteria
- \`transfer(...)\` function defined and always returns \`Err(ContractError::SoulboundToken)\`
- Error code documented
- Unit test verifies transfer always fails regardless of caller

**Priority:** High | **Effort:** Small" "smart-contract,security"

c "SC-009 · Add input length validation for all string fields" "## Description
\`vaccine_name\` and other string inputs have no length limits. Excessively long strings can bloat storage and increase ledger fees.

## Acceptance Criteria
- \`vaccine_name\` max length: 100 characters
- All string inputs validated at contract boundary before storage
- \`InvalidInput\` error returned with field name on violation
- Limits documented in contract README

**Priority:** Medium | **Effort:** Small" "smart-contract,security"

c "SC-010 · Implement batch verification function" "## Description
The analytics service's \`/batch/verify\` endpoint calls \`verify_vaccination\` once per wallet. A batch function reduces RPC round-trips significantly.

## Acceptance Criteria
- \`batch_verify(wallets: Vec<Address>)\` returns \`Vec<(Address, VerificationResult)>\`
- Max batch size enforced (e.g., 100 wallets)
- Existing single-wallet \`verify_vaccination\` unchanged
- Batch function tested with empty, partial, and full batches

**Priority:** Medium | **Effort:** Small" "smart-contract,performance"
