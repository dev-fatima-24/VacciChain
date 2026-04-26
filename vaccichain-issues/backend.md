# Backend Issues (BE-001 to BE-020)

---

### BE-001 · Validate Stellar public key format on all endpoints

**Description:** `/vaccination/issue` and `/verify/:wallet` accept arbitrary strings as wallet addresses. Malformed addresses cause unhandled errors deep in the Soroban SDK.

**Acceptance Criteria:**
- Middleware validates `G...` format (56-char base32) on all wallet params
- Returns `400` with descriptive message on invalid input
- Unit tests cover valid, invalid, and edge-case addresses

**Priority:** Critical | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `bug`, `security`

---

### BE-002 · Implement rate limiting on public endpoints

**Description:** `/verify/:wallet` and `/auth/sep10` are unauthenticated and have no rate limiting, making them vulnerable to abuse and DoS.

**Acceptance Criteria:**
- Rate limit of 60 req/min per IP on `/verify/:wallet`
- Rate limit of 10 req/min per IP on `/auth/sep10`
- `429` response with `Retry-After` header on breach
- Limits configurable via environment variables

**Priority:** High | **Effort:** Small
**Dependencies:** BE-001
**Labels:** `backend`, `security`, `performance`

---

### BE-003 · Add structured logging with request correlation IDs

**Description:** Current logging is unstructured `console.log`. Debugging production issues across services is impossible without correlation IDs.

**Acceptance Criteria:**
- All requests assigned a `X-Request-ID` (generated if not provided by client)
- Logs are JSON-structured with `level`, `timestamp`, `requestId`, `route`, `statusCode`, `durationMs`
- Errors include stack traces in development, omit them in production

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `observability`

---

### BE-004 · Implement idempotency for `/vaccination/issue`

**Description:** Duplicate POST requests (network retry, double-click) can trigger multiple contract mint calls for the same record, causing duplicate detection errors or wasted ledger fees.

**Acceptance Criteria:**
- Endpoint accepts optional `Idempotency-Key` header
- Duplicate requests within 24h return the original response without re-minting
- Idempotency keys stored with TTL (Redis or in-memory with expiry)
- Missing key is allowed but not idempotent (backward compatible)

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `backend`, `bug`, `reliability`

---

### BE-005 · Enforce real-time issuer authorization check in middleware

**Description:** The `issuer.js` middleware checks the JWT role but does not verify the wallet address against the on-chain issuer allowlist at request time. A revoked issuer with a valid JWT can still mint.

**Acceptance Criteria:**
- On each issuer-gated request, wallet from JWT verified against contract's issuer allowlist
- Revoked issuers receive `403` even with a valid JWT
- Allowlist lookups cached with a 30s TTL to avoid per-request RPC calls
- Cache invalidated on issuer revocation events

**Priority:** Critical | **Effort:** Medium
**Dependencies:** None
**Labels:** `backend`, `security`

---

### BE-006 · Add health check endpoint

**Description:** No `/health` endpoint exists. Docker, load balancers, and uptime monitors cannot determine service readiness.

**Acceptance Criteria:**
- `GET /health` returns `200` with `{ status: "ok", soroban: bool, timestamp }`
- Checks Soroban RPC connectivity with a lightweight call
- Returns `503` if Soroban RPC is unreachable
- Used in `docker-compose.yml` `healthcheck` directive

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `devops`

---

### BE-007 · Paginate `GET /vaccination/:wallet` response

**Description:** A wallet with many vaccination records returns an unbounded array, causing large payloads and slow responses.

**Acceptance Criteria:**
- Endpoint accepts `?page` and `?limit` query params (default limit: 20, max: 100)
- Response shape: `{ data: [], total: number, page: number, limit: number }`
- Invalid pagination params return `400`
- Frontend updated to handle paginated response

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `performance`

---

### BE-008 · Implement request body size limits

**Description:** No request body size limit is configured on the Express app. Large payloads can exhaust memory.

**Acceptance Criteria:**
- JSON body parser limited to 10kb
- Requests exceeding limit return `413 Payload Too Large`
- Limit configurable via environment variable

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `security`, `performance`

---

### BE-009 · Add CORS configuration

**Description:** CORS is not explicitly configured. In production, any origin can call the API, or the frontend origin may be blocked depending on defaults.

**Acceptance Criteria:**
- CORS configured with explicit allowed origins from environment variable
- Credentials allowed only for trusted origins
- Preflight requests handled correctly
- Wildcard `*` origin blocked in production

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `security`

---

### BE-010 · Implement graceful shutdown handling

**Description:** The Express server has no graceful shutdown logic. In-flight requests are dropped when the container stops, causing client errors during deployments.

**Acceptance Criteria:**
- `SIGTERM` and `SIGINT` handlers drain in-flight requests before exiting
- Shutdown timeout of 10s after which process force-exits
- Logged when shutdown begins and completes

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `reliability`

---

### BE-011 · Add Soroban RPC retry logic with exponential backoff

**Description:** Soroban RPC calls fail immediately on transient network errors. No retry logic exists, causing unnecessary 500 errors.

**Acceptance Criteria:**
- Failed RPC calls retried up to 3 times with exponential backoff (100ms, 200ms, 400ms)
- Non-retryable errors (4xx from contract) not retried
- Retry attempts logged with attempt number
- Configurable max retries via environment variable

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `reliability`

---

### BE-012 · Validate JWT claims completeness

**Description:** JWT middleware only checks token validity, not that required claims (`sub`, `role`, `wallet`) are present and non-empty.

**Acceptance Criteria:**
- Middleware validates presence of `sub`, `role`, `wallet`, `exp` claims
- Missing or empty claims return `401` with descriptive error
- `role` must be one of `patient` or `issuer`
- Unit tests cover all missing-claim combinations

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `security`, `bug`

---

### BE-013 · Add request/response schema validation middleware

**Description:** No schema validation exists for request bodies. Unexpected fields or wrong types reach business logic and contract calls.

**Acceptance Criteria:**
- `zod` or `joi` schemas defined for all POST request bodies
- Validation middleware returns `400` with field-level error details on schema mismatch
- Schemas co-located with route definitions
- Unknown fields stripped (not passed through)

**Priority:** High | **Effort:** Medium
**Dependencies:** None
**Labels:** `backend`, `security`, `reliability`

---

### BE-014 · Implement admin endpoints for issuer management

**Description:** `add_issuer` and `revoke_issuer` contract functions exist but there are no backend API endpoints to invoke them. Admin operations require direct CLI access.

**Acceptance Criteria:**
- `POST /admin/issuers` — add an issuer (admin JWT required)
- `DELETE /admin/issuers/:address` — revoke an issuer (admin JWT required)
- `GET /admin/issuers` — list all authorized issuers
- Admin JWT role separate from issuer JWT role

**Priority:** High | **Effort:** Medium
**Dependencies:** BE-005
**Labels:** `backend`, `enhancement`

---

### BE-015 · Add API versioning

**Description:** The API has no versioning. Breaking changes to endpoints will break existing clients with no migration path.

**Acceptance Criteria:**
- All routes prefixed with `/v1/`
- Version included in response headers (`API-Version: 1`)
- Deprecation header added when a version is sunset
- README updated with versioned base URL

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `enhancement`

---

### BE-016 · Implement SEP-10 nonce storage and single-use enforcement

**Description:** SEP-10 challenges must be single-use. Without nonce tracking, a captured challenge transaction can be replayed.

**Acceptance Criteria:**
- Generated nonces stored with 5-minute TTL
- Nonce marked as used on successful `/auth/verify`
- Reuse of a consumed nonce returns `401`
- Storage backend: Redis or in-memory with TTL cleanup

**Priority:** Critical | **Effort:** Medium
**Dependencies:** None
**Labels:** `backend`, `security`

---

### BE-017 · Add audit log for all state-changing operations

**Description:** No audit trail exists for vaccination issuances, issuer additions/revocations, or admin actions. Required for healthcare compliance.

**Acceptance Criteria:**
- All state-changing API calls logged with: timestamp, actor wallet, action, target, result
- Audit logs append-only (no delete/update)
- Logs queryable by actor and date range via `GET /admin/audit`
- Stored separately from application logs

**Priority:** High | **Effort:** Medium
**Dependencies:** BE-003, BE-014
**Labels:** `backend`, `security`, `compliance`

---

### BE-018 · Implement contract event indexing

**Description:** On-chain events from the Soroban contract are not indexed by the backend. The analytics service has no reliable event source.

**Acceptance Criteria:**
- Background job polls Soroban RPC for contract events on a configurable interval
- Events stored in a local database with deduplication
- `VaccinationMinted`, `IssuerAdded`, `IssuerRevoked` events indexed
- Analytics service reads from indexed events, not live RPC

**Priority:** High | **Effort:** Large
**Dependencies:** SC-002
**Labels:** `backend`, `enhancement`

---

### BE-019 · Add environment variable validation on startup

**Description:** The server starts with missing or invalid environment variables and fails at runtime with cryptic errors.

**Acceptance Criteria:**
- All required env vars validated on startup before server binds
- Missing required vars cause immediate exit with a clear error listing which vars are missing
- Optional vars have documented defaults
- Validation uses a schema (e.g., `envalid` or `zod`)

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `reliability`

---

### BE-020 · Implement `/vaccination/issue` response with transaction details

**Description:** The issue endpoint returns minimal data after a successful mint. Clients need the transaction hash and token ID for confirmation and linking.

**Acceptance Criteria:**
- Successful mint response includes: `{ tokenId, transactionHash, ledger, timestamp }`
- Transaction hash links to Stellar Explorer
- Frontend displays confirmation with explorer link after successful issuance

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `backend`, `enhancement`
