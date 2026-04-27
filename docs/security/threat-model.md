# VacciChain Threat Model

## Scope
This document covers the threat model for the VacciChain vaccination record system,
focusing on the patient registration allowlist introduced in issue #111.

---

## Assets

| Asset | Description |
|---|---|
| Vaccination records | On-chain soulbound NFTs representing vaccination history |
| Patient wallet addresses | Stellar public keys that hold records |
| Issuer credentials | Authorized healthcare provider keys |
| Admin key | Controls issuer authorization and contract upgrades |
| JWT tokens | Short-lived session tokens (1 hour) |
| SEP-10 nonces | Single-use challenge nonces |

---

## Threat Actors

| Actor | Capability |
|---|---|
| External attacker | No keys; can call public endpoints and read on-chain state |
| Malicious issuer | Holds a valid issuer key; can call mint endpoints |
| Compromised backend | Can call contract with ADMIN_SECRET_KEY or ISSUER_SECRET_KEY |
| Rogue patient | Holds a valid patient JWT; can call patient endpoints |

---

## Threats and Mitigations

### T1 — Unsolicited minting to arbitrary addresses
**Threat:** An issuer mints a vaccination record to a wallet the patient does not control,
or to an attacker-controlled address used for phishing.

**Mitigation (implemented — issue #111):** `mint_vaccination` checks
`PatientAllowlist(patient)` before minting. A patient must authenticate via SEP-10 and call
`register_patient` first. The check is enforced at the contract level; no backend path can
bypass it.

**Residual risk:** None for unsolicited minting. A patient who registers and then loses
wallet access cannot unregister (acceptable — records are soulbound anyway).

---

### T2 — Replay attack on SEP-10 challenge
**Threat:** Attacker captures a signed SEP-10 challenge and replays it to obtain a JWT.

**Mitigation:** Nonces are single-use and tracked in `nonceStore.js`. Challenges expire
after 5 minutes. Replayed nonces are rejected.

---

### T3 — JWT forgery or theft
**Threat:** Attacker forges or steals a JWT to impersonate a patient or issuer.

**Mitigation:** JWTs are signed with `JWT_SECRET` (HS256), expire after 1 hour, and carry
a `role` claim. The `authMiddleware` validates all required claims. Rotate `JWT_SECRET` to
invalidate all sessions.

---

### T4 — Unauthorized issuer minting
**Threat:** A non-issuer calls `mint_vaccination` directly on the contract.

**Mitigation:** `mint.rs` calls `issuer.require_auth()` and checks
`DataKey::Issuer(issuer).authorized`. Unauthorized callers receive error 3 (`Unauthorized`).

---

### T5 — Admin key compromise
**Threat:** `ADMIN_SECRET_KEY` is leaked; attacker adds malicious issuers or upgrades the
contract.

**Mitigation:** Admin key should be stored in a hardware wallet or secrets manager. All
admin actions emit on-chain events (`iss_add`, `upgraded`) that are indexable. Admin
transfer requires a two-step proposal + acceptance flow with a 24-hour expiry.

**Residual risk:** If the admin key is compromised before detection, malicious issuers can
be added. Monitor `iss_add` events.

---

### T6 — Duplicate record spam
**Threat:** An issuer mints the same record multiple times to inflate a patient's record
count.

**Mitigation:** `mint.rs` checks for duplicate `(vaccine_name, date_administered)` pairs
per patient and rejects with `DuplicateRecord` (error 6). Per-patient record limit (default
50) is also enforced.

---

### T7 — Soulbound bypass (transfer attempt)
**Threat:** A patient or attacker attempts to transfer a vaccination NFT to another wallet.

**Mitigation:** `transfer()` always returns `SoulboundToken` (error 15). No transfer path
exists at the contract level.

---

## Open Risks

| Risk | Severity | Notes |
|---|---|---|
| Admin key single point of failure | High | Mitigate with hardware wallet + key rotation plan |
| Backend ADMIN_SECRET_KEY used for register_patient | Medium | Backend signs on behalf of patient; patient's on-chain auth is `require_auth()` on the patient address — this requires the backend to hold a key that can authorize the patient address, which is not possible without the patient's key. See implementation note below. |

### Implementation Note — register_patient authorization
`register_patient` calls `patient.require_auth()` on-chain. The backend cannot satisfy this
with `ADMIN_SECRET_KEY` alone. In production, the patient must sign the `register_patient`
invocation with their own wallet (e.g. via Freighter). The backend route
`POST /patient/register` should build an unsigned transaction and return it to the frontend
for wallet signing, following the same pattern as the SEP-10 challenge flow. The current
implementation uses `ADMIN_SECRET_KEY` as a placeholder; this must be updated before
mainnet deployment.
