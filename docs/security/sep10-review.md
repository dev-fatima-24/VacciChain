# SEP-10 Implementation Security Review

**Spec version reviewed:** SEP-10 v3.4.1  
**Files reviewed:** `backend/src/stellar/sep10.js`, `backend/src/stellar/nonceStore.js`, `backend/src/routes/auth.js`  
**Review date:** 2026-04-28  
**Status:** All critical findings fixed. Tests passing.

---

## Summary

The original `sep10.js` had five spec deviations that would have caused interoperability failures with compliant SEP-10 clients (e.g. Freighter) and weakened replay protection. All five were fixed. One additional issue was found in `auth.js` (JWT claims mismatch). All fixes are covered by 15 new tests.

---

## Findings

### F-01 — manage_data key used hardcoded string instead of home domain ✅ Fixed

**Severity:** High  
**Spec requirement (§ Challenge Response):**
> The value of key is the Home Domain, followed by `auth`. It can be at most 64 characters.

**Original code:**
```js
StellarSdk.Operation.manageData({
  name: 'vaccichain auth',   // ← hardcoded, not configurable
  ...
})
```

**Problem:** Any compliant SEP-10 client verifies that the first `manage_data` key equals `<home_domain> auth` where `home_domain` is the domain from `stellar.toml`. A hardcoded string breaks this check for any deployment where the home domain differs from `vaccichain`, and makes the server non-interoperable with standard wallets.

**Fix:** Added `HOME_DOMAIN` env var (validated in `config.js`). Key is now `${config.HOME_DOMAIN} auth`. `verifyChallenge` also validates the key matches.

---

### F-02 — Nonce was a Stellar public key, not a 64-byte base64 random value ✅ Fixed

**Severity:** High  
**Spec requirement (§ Challenge Response):**
> The value must be 64 bytes long. It contains a 48 byte cryptographic-quality random string encoded using base64 (for a total of 64 bytes after encoding).

**Original code:**
```js
const nonce = StellarSdk.Keypair.random().publicKey(); // 56-char G... address
```

**Problem:** A Stellar public key is 56 characters, not 64 bytes. It is also not a cryptographic-quality random value in the required format — it is a base32-encoded Ed25519 public key. This fails the spec's explicit byte-length requirement and would be rejected by strict SEP-10 validators.

**Fix:**
```js
const nonce = crypto.randomBytes(48).toString('base64'); // exactly 64 bytes
```

---

### F-03 — Sequence number used server account's real sequence instead of 0 ✅ Fixed

**Severity:** Critical  
**Spec requirement (§ Challenge):**
> invalid sequence number (set to 0) so the transaction cannot be run on the Stellar network

**Original code:**
```js
const serverAccount = await server.loadAccount(serverKeypair.publicKey());
// TransactionBuilder uses serverAccount.sequence + 1 → non-zero
```

**Problem:** The spec requires sequence 0 precisely so the challenge transaction is invalid and cannot be submitted to the network. Using the real account sequence produces a valid, submittable transaction — a security risk if a client were tricked into signing it. Compliant clients also verify `sequenceNumber === 0` and would reject the challenge.

**Fix:** Use a synthetic `Account` with sequence `-1` so the builder produces sequence `0`:
```js
const serverAccount = new StellarSdk.Account(serverKeypair.publicKey(), '-1');
```
`verifyChallenge` now explicitly checks `tx.sequence !== '0'` and throws.

---

### F-04 — Missing `web_auth_domain` manage_data operation ✅ Fixed

**Severity:** Medium  
**Spec requirement (§ Challenge Response):**
> `manage_data(source: server account, key: 'web_auth_domain', value: web_auth_domain)`

**Original code:** Only one `manage_data` operation was added (the client auth op). The `web_auth_domain` op was absent.

**Problem:** Compliant clients verify the `web_auth_domain` operation to confirm they are talking to the expected server. Its absence means clients cannot detect a server misconfiguration or MITM that redirects auth to a different domain.

**Fix:** Added `WEB_AUTH_DOMAIN` env var and a second `manage_data` operation:
```js
StellarSdk.Operation.manageData({
  name: 'web_auth_domain',
  value: config.WEB_AUTH_DOMAIN,
  source: serverKeypair.publicKey(),
})
```

---

### F-05 — `network_passphrase` not returned in challenge response ✅ Fixed

**Severity:** Medium  
**Spec requirement (§ Challenge Response):**
> `network_passphrase`: (optional but recommended) Stellar network passphrase used by the Server. This allows a Client to verify that it's using the correct passphrase when signing.

**Original code:** `buildChallenge` returned `{ transaction, nonce }` only.

**Problem:** Without `network_passphrase` in the response, clients cannot detect a testnet/mainnet misconfiguration. A client configured for mainnet connecting to a testnet server would silently sign with the wrong passphrase.

**Fix:** `buildChallenge` now returns `{ transaction, nonce, network_passphrase }`. `verifyChallenge` passes `NETWORK_PASSPHRASE` to the `Transaction` constructor, which rejects transactions built with a different passphrase.

---

### F-06 — JWT claims did not match `authMiddleware` requirements ✅ Fixed

**Severity:** High  
**Location:** `backend/src/routes/auth.js`

**Original code:**
```js
jwt.sign({ publicKey, role }, process.env.JWT_SECRET, { expiresIn: '1h' })
res.json({ token, publicKey, role })
```

**Problem:** `authMiddleware` validates `sub`, `role`, `wallet`, and `exp` claims. The original JWT had `publicKey` instead of `sub` and `wallet`, so every authenticated request after login would fail with `Missing or empty claim: sub`. The response also used `publicKey` instead of `wallet`, inconsistent with the rest of the API.

**Fix:**
```js
jwt.sign(
  { sub: publicKey, iss: config.HOME_DOMAIN, iat: now, wallet: publicKey, role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
)
res.json({ token, wallet: publicKey, role })
```

---

## Verified Compliant Items

| Check | Status |
|---|---|
| Challenge signed by server keypair | ✅ Was correct |
| Server signature verified in `verifyChallenge` | ✅ Was correct |
| Client signature verified in `verifyChallenge` | ✅ Was correct |
| Nonces are single-use (`nonceStore.consume` deletes on first use) | ✅ Was correct |
| Nonce TTL is 5 minutes (matches challenge `setTimeout(300)`) | ✅ Was correct |
| Time bounds validated in `verifyChallenge` | ✅ Was correct |
| Rate limiting on `/auth/sep10` (10 req/IP/min) | ✅ Was correct |
| Input validation on `public_key` (valid Stellar key) | ✅ Was correct |

---

## Test Coverage

All fixes are covered by `backend/tests/sep10.test.js` (15 tests, all passing):

| Test | Covers |
|---|---|
| sequence number is 0 | F-03 |
| first op key is `<home_domain> auth` | F-01 |
| nonce is 64-byte base64 of 48 random bytes | F-02 |
| second op is `web_auth_domain` | F-04 |
| response includes `network_passphrase` | F-05 |
| challenge expires after exactly 5 minutes | Spec §timeBounds |
| nonce single-use (replay throws) | Spec §nonce |
| nonce unknown throws | Spec §nonce |
| nonce TTL expiry throws | Spec §nonce |
| valid signed challenge returns client public key | Happy path |
| replayed nonce rejected | Spec §nonce |
| wrong `network_passphrase` rejected | F-05 |
| wrong `home_domain` key rejected | F-01 |
| sequence ≠ 0 rejected | F-03 |
| missing client signature rejected | Spec §verification |

---

## Remaining Notes

1. **`nonceStore` is in-memory.** A process restart invalidates all in-flight challenges. Acceptable for single-instance deployments; use a Redis-backed store for multi-instance or zero-downtime deployments.

2. **`HOME_DOMAIN` and `WEB_AUTH_DOMAIN` must be set correctly before mainnet.** Both default to `localhost` for local development. Production values must match the domain in `stellar.toml`.

3. **`stellar.toml` not yet published.** SEP-10 discovery requires a `stellar.toml` at `https://<HOME_DOMAIN>/.well-known/stellar.toml` containing `WEB_AUTH_ENDPOINT` and `SIGNING_KEY`. This must be in place before any compliant wallet can discover and use the auth endpoint.

4. **`GET /auth/sep10` not implemented.** The spec defines `GET <WEB_AUTH_ENDPOINT>` as the challenge endpoint. VacciChain uses `POST /auth/sep10`. This is a non-standard deviation — document it or add a `GET` alias before mainnet.
