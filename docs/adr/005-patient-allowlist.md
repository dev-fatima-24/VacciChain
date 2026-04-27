# ADR-005: Patient Pre-Registration Allowlist

## Status
Accepted

## Context
Any Stellar wallet could receive a vaccination record without consent. An issuer could mint
to an arbitrary or attacker-controlled address, polluting on-chain state and potentially
enabling phishing (e.g. "you have a vaccination record — click here to view it").

Two options were evaluated:

| Option | Description |
|---|---|
| **Open minting** | Issuer can mint to any address; risk accepted and documented |
| **Patient pre-registration** | Patient must authenticate via SEP-10 and self-register before receiving a record |

## Decision
**Patient pre-registration** was chosen.

A patient must call `POST /patient/register` (requires a valid SEP-10 JWT) before any issuer
can mint to their wallet. The backend invokes `register_patient(patient)` on the Soroban
contract, which stores `PatientAllowlist(patient) → true` in persistent storage and emits a
`pat_reg` event. `mint_vaccination` rejects with `PatientNotRegistered` (error 16) if the
patient address is not in the allowlist.

## Consequences

### Positive
- Patients explicitly consent to receiving records before any record is issued.
- Eliminates unsolicited minting to arbitrary or attacker-controlled addresses.
- Enforcement is at the contract level — no backend bypass is possible.
- Audit trail: `pat_reg` events are on-chain and indexable.

### Negative
- Adds one extra step to the patient onboarding flow (authenticate → register → receive record).
- Issuers must coordinate with patients to ensure registration before scheduling a mint.

## Alternatives Considered

### Open Minting
- **Pros**: Simpler flow, no patient action required before receiving a record.
- **Cons**: Issuers can mint to any address without consent; enables spam/phishing vectors.
- **Rejected**: Risk is not acceptable for a healthcare credential system.

## Implementation Notes
- `contracts/src/storage.rs`: `DataKey::PatientAllowlist(Address)` added.
- `contracts/src/lib.rs`: `register_patient`, `is_patient_registered` functions; `PatientNotRegistered = 16` error.
- `contracts/src/mint.rs`: allowlist check added before minting.
- `contracts/src/events.rs`: `emit_patient_registered` added.
- `backend/src/routes/patient.js`: `POST /patient/register` (SEP-10 JWT required).
- `backend/src/app.js`: `/patient` route mounted.

## References
- Issue #111: Implement wallet address allowlist for patient registration
- ADR-003: SEP-10 Authentication
- ADR-002: Soulbound Token Design
