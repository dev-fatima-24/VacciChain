# Smart Contract Issues (SC-001 to SC-020)

---

### SC-001 · Enforce duplicate vaccination record detection in mint.rs

**Description:** The README mentions duplicate detection but it must be explicitly enforced in `mint.rs` by hashing `(patient, vaccine_name, date)` and checking storage before minting.

**Acceptance Criteria:**
- Mint fails with `DuplicateRecord` error if identical `(patient, vaccine_name, date)` already exists
- Unit test covers duplicate mint attempt
- Error code surfaced to backend and frontend with descriptive message

**Priority:** Critical | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `security`, `bug`

---

### SC-002 · Emit structured events for all state-changing operations

**Description:** `events.rs` must emit events for `mint`, `add_issuer`, and `revoke_issuer`. Missing events break the analytics service and audit trail.

**Acceptance Criteria:**
- `VaccinationMinted { patient, token_id, vaccine_name, issuer, timestamp }` emitted on mint
- `IssuerAdded { address, admin, timestamp }` emitted on issuer addition
- `IssuerRevoked { address, admin, timestamp }` emitted on issuer revocation
- Events verified in contract unit tests

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `enhancement`

---

### SC-003 · Write comprehensive contract unit tests

**Description:** `cargo test` target exists but test coverage is unknown. All contract functions need unit tests including all failure paths.

**Acceptance Criteria:**
- Tests for: successful mint, unauthorized mint, duplicate mint, transfer blocked, verify empty wallet, verify populated wallet, add issuer, revoke issuer, admin-only enforcement
- All tests pass with `make test`
- Coverage report generated via `cargo tarpaulin` or equivalent

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `smart-contract`, `testing`

---

### SC-004 · Add admin key rotation mechanism

**Description:** There is no way to transfer admin authority if the admin key is compromised. A single point of failure for the entire contract.

**Acceptance Criteria:**
- `propose_admin(new_admin)` callable only by current admin
- `accept_admin()` callable only by proposed new admin (two-step to prevent lockout)
- `AdminTransferProposed` and `AdminTransferAccepted` events emitted
- Proposal expires after 24 hours if not accepted

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `smart-contract`, `security`

---

### SC-005 · Define and implement deterministic token_id generation

**Description:** `token_id` generation is not specified. Collisions or predictable IDs are a security risk.

**Acceptance Criteria:**
- `token_id` generated as hash of `(patient, vaccine_name, date, issuer, ledger_sequence)`
- Scheme documented in `contracts/README.md`
- Collision resistance verified in tests with known inputs
- `token_id` is a fixed-length hex string

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `security`

---

### SC-006 · Add vaccination record revocation function

**Description:** No mechanism exists to revoke an erroneously issued record. Required for real-world healthcare compliance and data correction.

**Acceptance Criteria:**
- `revoke_vaccination(token_id)` callable by the original issuer or admin
- Revoked records marked with `revoked: true` in storage, not deleted (audit trail preserved)
- `verify_vaccination` excludes revoked records from active status
- `VaccinationRevoked { token_id, revoker, timestamp }` event emitted

**Priority:** High | **Effort:** Medium
**Dependencies:** SC-002
**Labels:** `smart-contract`, `enhancement`

---

### SC-007 · Add schema version field to VaccinationRecord

**Description:** The `VaccinationRecord` struct has no version field. Future schema changes will silently break reads of existing on-chain records.

**Acceptance Criteria:**
- `VaccinationRecord` includes `schema_version: u32` field (current value: 1)
- `verify_vaccination` handles records of different schema versions gracefully
- Migration path documented for future schema changes
- Version checked and logged during reads

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `reliability`

---

### SC-008 · Implement transfer function with explicit revert and error

**Description:** The `transfer(...)` function must exist and always revert with a clear `SoulboundToken` error, not just be absent. Absence may cause unexpected behavior with some Stellar tooling.

**Acceptance Criteria:**
- `transfer(...)` function defined and always returns `Err(ContractError::SoulboundToken)`
- Error code documented
- Unit test verifies transfer always fails regardless of caller

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `security`

---

### SC-009 · Add input length validation for all string fields

**Description:** `vaccine_name` and other string inputs have no length limits. Excessively long strings can bloat storage and increase ledger fees.

**Acceptance Criteria:**
- `vaccine_name` max length: 100 characters
- All string inputs validated at contract boundary before storage
- `InvalidInput` error returned with field name on violation
- Limits documented in contract README

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `security`

---

### SC-010 · Implement batch verification function

**Description:** The analytics service's `/batch/verify` endpoint calls `verify_vaccination` once per wallet. A batch function reduces RPC round-trips significantly.

**Acceptance Criteria:**
- `batch_verify(wallets: Vec<Address>)` returns `Vec<(Address, VerificationResult)>`
- Max batch size enforced (e.g., 100 wallets)
- Existing single-wallet `verify_vaccination` unchanged
- Batch function tested with empty, partial, and full batches

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `performance`

---

### SC-011 · Add issuer metadata storage

**Description:** Issuers are stored as `address → bool`. No metadata (name, license number, country) is stored, making issuer identity unverifiable on-chain.

**Acceptance Criteria:**
- `IssuerRecord { name: String, license: String, country: String, authorized: bool }` stored per issuer
- `add_issuer` updated to accept metadata
- `get_issuer(address)` public function returns issuer metadata
- Existing authorization check logic unchanged

**Priority:** Medium | **Effort:** Medium
**Dependencies:** None
**Labels:** `smart-contract`, `enhancement`

---

### SC-012 · Implement contract upgrade mechanism

**Description:** Soroban contracts support WASM upgrades. Without an upgrade mechanism, bug fixes require deploying a new contract and migrating all data.

**Acceptance Criteria:**
- `upgrade(new_wasm_hash)` function callable by admin only
- `ContractUpgraded { new_wasm_hash, admin, timestamp }` event emitted
- Upgrade tested on testnet before mainnet
- Upgrade procedure documented in `docs/contract-upgrade.md`

**Priority:** High | **Effort:** Medium
**Dependencies:** SC-004
**Labels:** `smart-contract`, `enhancement`

---

### SC-013 · Add contract initialization guard

**Description:** The contract's `init` function (or equivalent admin setup) can potentially be called multiple times, allowing an attacker to overwrite the admin address.

**Acceptance Criteria:**
- Contract tracks initialization state in storage
- Second call to `init` returns `AlreadyInitialized` error
- Unit test verifies double-init is rejected
- Initialization state checked before any admin operation

**Priority:** Critical | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `security`

---

### SC-014 · Implement vaccination record count limit per patient

**Description:** No limit exists on how many vaccination records a single patient wallet can hold. A malicious issuer could spam records to bloat storage.

**Acceptance Criteria:**
- Max records per patient configurable by admin (default: 50)
- Mint fails with `RecordLimitExceeded` if patient is at limit
- Admin can adjust limit via `set_patient_record_limit(limit: u32)`
- Limit documented and tested

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `security`

---

### SC-015 · Add contract pause mechanism for emergency stops

**Description:** No emergency stop exists. If a critical bug is discovered, there is no way to halt minting while a fix is prepared.

**Acceptance Criteria:**
- `pause()` and `unpause()` callable by admin only
- All state-changing functions check paused state and return `ContractPaused` error
- Read-only functions (`verify_vaccination`) remain available when paused
- `ContractPaused` and `ContractUnpaused` events emitted

**Priority:** High | **Effort:** Small
**Dependencies:** SC-004
**Labels:** `smart-contract`, `security`

---

### SC-016 · Optimize storage key schema for gas efficiency

**Description:** Current storage schema uses full address strings as keys. Hashed or shortened keys reduce storage costs on every read/write.

**Acceptance Criteria:**
- Storage keys reviewed and optimized (e.g., hash addresses to fixed-length keys)
- Gas benchmarks before and after documented
- No change to public function signatures
- All existing tests pass after optimization

**Priority:** Low | **Effort:** Medium
**Dependencies:** SC-003
**Labels:** `smart-contract`, `performance`

---

### SC-017 · Add `get_all_issuers` admin function

**Description:** No function exists to enumerate all authorized issuers. Admin cannot audit the issuer list without off-chain indexing.

**Acceptance Criteria:**
- `get_all_issuers()` returns `Vec<Address>` of all currently authorized issuers
- Callable by anyone (public read)
- Paginated if issuer count can be large
- Tested with empty, single, and multiple issuers

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `enhancement`

---

### SC-018 · Document all contract error codes

**Description:** Error codes are not documented. Backend and frontend cannot provide meaningful error messages to users.

**Acceptance Criteria:**
- All `ContractError` variants documented with: code, name, description, when triggered
- Documentation in `contracts/README.md`
- Error codes are stable integers (not reordered between versions)
- Backend maps error codes to user-facing messages

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `documentation`

---

### SC-019 · Add testnet deployment script with verification

**Description:** `make deploy` deploys the contract but does not verify the deployment by calling a read function post-deploy.

**Acceptance Criteria:**
- `make deploy` outputs the contract ID
- Post-deploy smoke test calls `verify_vaccination` with a known address
- Contract ID written to `.env` automatically after successful deploy
- Deploy fails loudly if smoke test fails

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `devops`

---

### SC-020 · Implement fee/tip configuration for contract calls

**Description:** Contract invocations use default fee settings. High network congestion can cause transactions to fail or be delayed.

**Acceptance Criteria:**
- Fee and tip parameters configurable via environment variables in the backend
- Backend uses `soroban.js` helper to set fees on all contract invocations
- Fee too low results in a clear error, not a silent hang
- Documented in backend README

**Priority:** Low | **Effort:** Small
**Dependencies:** None
**Labels:** `smart-contract`, `reliability`
