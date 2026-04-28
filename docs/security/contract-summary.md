# VacciChain Contract — Audit-Ready Summary

**Version:** 0.1.0  
**Date:** 2026-04-28  
**Language:** Rust (Soroban SDK 22.0.0)  
**Network:** Stellar (Soroban smart contracts)  
**Lines of code:** ~500 (excluding tests and comments)

> Prepared for external auditors. See `docs/security/pre-audit-notes.md` for known
> issues that must be resolved before the audit engagement begins.

---

## 1. Purpose

VacciChain issues vaccination records as soulbound (non-transferable) NFTs on the Stellar
network. Healthcare providers mint records to patient wallets. Patients, employers, schools,
and border agencies can verify vaccination status on-chain without a central database.

---

## 2. Source Files

| File | Purpose | LoC |
|---|---|---|
| `src/lib.rs` | Contract entry point, all public functions, tests | ~400 |
| `src/mint.rs` | Minting logic, duplicate detection, record limit | ~120 |
| `src/verify.rs` | Single-wallet and batch verification | ~40 |
| `src/storage.rs` | Data types, `DataKey` enum, `hash_address`, `compute_token_id` | ~110 |
| `src/events.rs` | On-chain event emission helpers | ~60 |

---

## 3. Architecture

```
                    ┌─────────────────────────────────────┐
                    │         VacciChainContract           │
                    │                                      │
  Admin ───────────►│ initialize / add_issuer / revoke_issuer
                    │ propose_admin / accept_admin / upgrade
                    │                                      │
  Issuer ──────────►│ mint_vaccination / revoke_vaccination │
                    │                                      │
  Patient ─────────►│ register_patient                     │
                    │                                      │
  Anyone ──────────►│ verify_vaccination / batch_verify    │
                    │ is_issuer / get_all_issuers           │
                    │ is_patient_registered / get_issuer   │
                    └─────────────────────────────────────┘
                                    │
                          Soroban Persistent Storage
```

---

## 4. Public Interface

### Admin functions (require admin `require_auth()`)

| Function | Description |
|---|---|
| `initialize(admin)` | One-time setup. Sets admin address. Guarded by `AlreadyInitialized`. |
| `add_issuer(issuer, name, license, country)` | Authorizes a healthcare provider. Stores `IssuerRecord`. Emits `iss_add`. |
| `revoke_issuer(issuer)` | Sets `IssuerRecord.authorized = false`. Record preserved for audit. |
| `propose_admin(new_admin)` | Two-step admin transfer. Sets pending admin with 24-hour expiry. |
| `upgrade(new_wasm_hash)` | Replaces contract WASM. Emits `upgraded`. |

### Issuer functions (require issuer `require_auth()` + issuer allowlist check)

| Function | Description |
|---|---|
| `mint_vaccination(patient, vaccine_name, date_administered, issuer)` | Mints soulbound NFT. Checks patient allowlist, issuer authorization, duplicate detection, per-patient record limit (50). Returns `token_id`. |
| `revoke_vaccination(token_id, revoker)` | Marks record revoked. Original issuer or admin only. Record never deleted. |

### Patient functions (require patient `require_auth()`)

| Function | Description |
|---|---|
| `register_patient(patient)` | Self-registers wallet into allowlist. Required before minting. |

### Public read functions (no auth required)

| Function | Description |
|---|---|
| `verify_vaccination(wallet)` | Returns `(bool, Vec<VaccinationRecord>)` — active (non-revoked) records only. |
| `batch_verify(wallets)` | Batch version, max 100 wallets. |
| `is_issuer(address)` | Returns `true` if address is an authorized issuer. |
| `get_all_issuers(start, limit)` | Paginated list of authorized issuers. |
| `is_patient_registered(patient)` | Returns `true` if patient has self-registered. |
| `get_issuer(address)` | Returns `IssuerRecord` metadata. |
| `transfer(from, to, token_id)` | Always returns `SoulboundToken` error. |

---

## 5. Data Model

### `VaccinationRecord`
```rust
pub struct VaccinationRecord {
    pub token_id: u64,
    pub patient: Address,
    pub vaccine_name: String,       // max 100 chars
    pub date_administered: String,  // max 100 chars, format not validated on-chain
    pub issuer: Address,
    pub timestamp: u64,             // ledger timestamp at mint
    pub schema_version: u32,        // currently always 1
    pub revoked: bool,
}
```

### `IssuerRecord`
```rust
pub struct IssuerRecord {
    pub name: String,       // max 100 chars
    pub license: String,    // max 100 chars
    pub country: String,    // max 100 chars
    pub authorized: bool,
}
```

### Storage Keys (`DataKey` enum)
```
Admin                        → Address (current admin)
Initialized                  → bool
PendingAdmin                 → Address
AdminTransferExpiry          → u64 (ledger timestamp)
Issuer(Address)              → IssuerRecord
PatientTokens(Address)       → Vec<u64> (token IDs owned by patient)
Token(u64)                   → VaccinationRecord
Revoked(u64)                 → bool (redundant with record.revoked)
PatientAllowlist(Address)    → bool
```

> **Note:** `IssuerMeta`, `IssuerList`, `NextTokenId`, and `PatientRecordLimit` are used
> in the source but missing from the `DataKey` enum — compile errors. See pre-audit notes.

---

## 6. Access Control Model

```
Role        │ How established                    │ What it controls
────────────┼────────────────────────────────────┼──────────────────────────────────
Admin       │ Set at initialize(); transferred    │ add/revoke issuers, upgrade WASM,
            │ via propose_admin/accept_admin      │ propose admin transfer
────────────┼────────────────────────────────────┼──────────────────────────────────
Issuer      │ Added by admin via add_issuer()     │ mint_vaccination,
            │ Revoked by admin via revoke_issuer()│ revoke_vaccination (own records)
────────────┼────────────────────────────────────┼──────────────────────────────────
Patient     │ Self-registers via register_patient │ Must register before receiving
            │ Requires patient's own signature    │ a vaccination record
────────────┼────────────────────────────────────┼──────────────────────────────────
Anyone      │ No auth required                   │ verify_vaccination, batch_verify,
            │                                    │ is_issuer, get_all_issuers
```

All privileged operations use Soroban's `require_auth()` — the host enforces that the
named address has signed the invocation. There is no off-chain bypass.

---

## 7. Trust Assumptions

1. **Admin key security.** The admin key controls issuer authorization and contract upgrades.
   A compromised admin key can add malicious issuers or replace the contract WASM entirely.
   The two-step admin transfer (propose + accept, 24-hour expiry) mitigates accidental
   transfers but does not protect against a stolen key.

2. **Issuer key security.** A compromised issuer key can mint fraudulent vaccination records
   to any registered patient wallet. Records are permanent (revocation marks them but does
   not delete them).

3. **Patient self-registration.** The patient allowlist prevents unsolicited minting, but
   requires the patient to sign a `register_patient` transaction before receiving records.
   The backend currently signs this with `ADMIN_SECRET_KEY` as a placeholder — this must
   be fixed before mainnet (see threat model).

4. **On-chain data is public.** All vaccination records, issuer lists, and patient wallet
   addresses are readable by anyone. There is no privacy layer.

5. **Date format not validated.** `date_administered` is a free-form string (max 100 chars).
   The contract does not validate ISO 8601 format or reject future dates.

6. **No reentrancy risk.** Soroban's single-entry invocation model prevents reentrancy.
   Cross-contract calls are not used.

---

## 8. Known Limitations (Pre-Audit)

These are documented issues that must be resolved before the audit. See
`docs/security/pre-audit-notes.md` for full details.

| Issue | Impact |
|---|---|
| Contract does not compile (15 errors) | No deployable artifact from current source |
| `is_issuer` always returns false (key mismatch) | Minting is permanently broken |
| `batch_verify` panics on oversized input | Opaque error, no structured response |
| Record limit exceeded panics | Opaque error, no structured response |
| Persistent storage TTL never extended | Records may be evicted from ledger |

---

## 9. Events

| Event topic | Payload | Emitted by |
|---|---|---|
| `(minted, token_id)` | `(patient, vaccine_name, issuer, timestamp)` | `mint_vaccination` |
| `(revoked, token_id)` | `(revoker, timestamp)` | `revoke_vaccination` |
| `(iss_add,)` | `(issuer, admin, timestamp)` | `add_issuer` |
| `(iss_rev,)` | `(issuer, admin, timestamp)` | `emit_issuer_revoked` (not called) |
| `(adm_prop,)` | `(current_admin, new_admin, expires_at)` | `propose_admin` |
| `(adm_acc,)` | `(new_admin, timestamp)` | `accept_admin` |
| `(upgraded,)` | `(new_wasm_hash, admin, timestamp)` | `upgrade` |
| `(pat_reg,)` | `(patient, timestamp)` | `register_patient` |

> **Note:** `emit_issuer_revoked` is defined in `events.rs` but never called by
> `revoke_issuer`. Revocation events are not emitted.

---

## 10. Audit Scope

The following are **in scope** for the external audit:

- All logic in `src/lib.rs`, `src/mint.rs`, `src/verify.rs`, `src/storage.rs`, `src/events.rs`
- Access control correctness for all privileged functions
- Storage key consistency and data integrity
- Duplicate detection and record limit enforcement
- Soulbound enforcement (`transfer` always reverts)
- Admin transfer two-step flow and expiry
- Contract upgrade authorization
- Input validation completeness
- Event emission correctness and completeness
- Soroban-specific concerns: storage TTL, auth model, host function usage

The following are **out of scope** for the contract audit (covered separately):

- Backend API (`backend/`)
- Frontend (`frontend/`)
- Python analytics service (`python-service/`)
- SEP-10 authentication flow
- Infrastructure and deployment
