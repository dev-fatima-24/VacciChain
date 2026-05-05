# Admin Multi-Signature Procedure

## Overview

Critical admin operations in VacciChain require M-of-N approvals before execution:

| Operation | Route | Multi-sig required |
|---|---|---|
| Approve issuer onboarding | `POST /v1/onboarding/applications/:id/review` | Yes |
| Add issuer (direct) | `POST /v1/onboarding/applications/:id/review` | Yes |
| Revoke issuer | `POST /v1/onboarding/applications/:id/review` | Yes |

Multi-sig is enforced at the backend layer via `backend/src/middleware/multiSig.js`. The Soroban contract additionally enforces `require_auth()` on the admin address, providing defence in depth.

## Configuration

| Variable | Description | Default |
|---|---|---|
| `MULTISIG_THRESHOLD` | Number of approvals required (M) | `2` |
| `MULTISIG_KEY_HOLDERS` | Comma-separated wallet addresses allowed to approve | any admin JWT |
| `MULTISIG_PROPOSAL_TTL_MS` | Proposal expiry in milliseconds | `3600000` (1 hour) |

Set `MULTISIG_THRESHOLD=1` to disable multi-sig (single admin sufficient — not recommended for production).

## Key Holders

Key holders must be documented in your access-controlled secrets management system. At minimum record:

- Wallet address
- Name / role of holder
- Date added / removed
- Contact for emergency rotation

Restrict `MULTISIG_KEY_HOLDERS` to the minimum set of trusted addresses. Rotate the list immediately if a key holder leaves or a wallet is suspected compromised.

## Multi-Sig Ceremony Procedure

### Step 1 — Initiator submits the operation

The initiator (any admin-role JWT holder) submits the request **without** a `proposal_id`. The backend creates a pending proposal and returns a `202`:

```bash
curl -X POST https://api.example.com/v1/onboarding/applications/<id>/review \
  -H "Authorization: Bearer <initiator-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{ "decision": "approved" }'
```

Response:
```json
{
  "message": "Multi-sig required. 1 more approval(s) needed.",
  "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
  "approvals": 1,
  "threshold": 2,
  "expires_at": "2026-04-29T15:00:00.000Z"
}
```

### Step 2 — Co-signer approves

Each additional key holder calls the approval endpoint with the `proposal_id`:

```bash
curl -X POST https://api.example.com/v1/admin/multisig/approve \
  -H "Authorization: Bearer <cosigner-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{ "proposal_id": "550e8400-e29b-41d4-a716-446655440000" }'
```

Response when threshold is reached:
```json
{
  "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "onboarding_review",
  "approvals": 2,
  "status": "approved",
  "expires_at": "2026-04-29T15:00:00.000Z"
}
```

### Step 3 — Initiator executes

Once approved, the initiator re-submits the original request **with** the `proposal_id`:

```bash
curl -X POST https://api.example.com/v1/onboarding/applications/<id>/review \
  -H "Authorization: Bearer <initiator-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{ "decision": "approved", "proposal_id": "550e8400-e29b-41d4-a716-446655440000" }'
```

The proposal is consumed (single-use) and the operation executes.

### Checking proposal status

```bash
curl https://api.example.com/v1/admin/multisig/proposals/<proposal_id> \
  -H "Authorization: Bearer <admin-token>"
```

## Security Considerations

- **Proposals are single-use**: once consumed by execution they are deleted.
- **Proposals expire**: default 1 hour. Expired proposals must be re-initiated.
- **Audit trail**: every proposal creation, approval, and execution is written to the audit log.
- **In-process storage**: proposals are stored in memory. For multi-instance deployments, replace the `Map` in `multiSig.js` with a shared Redis store.
- **Threshold of 1**: disables multi-sig. Only use in development/testing.

## Emergency Procedure

If a key holder is unavailable and an urgent operation is needed:

1. Confirm the emergency with at least one other key holder out-of-band (phone/Signal).
2. Temporarily lower `MULTISIG_THRESHOLD` to `1` and restart the backend.
3. Execute the operation.
4. Restore `MULTISIG_THRESHOLD` to the original value and restart.
5. Document the emergency in the audit log and incident tracker.
