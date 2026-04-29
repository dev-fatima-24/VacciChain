# JWT Signing Key Rotation

## Overview

VacciChain uses HMAC-SHA256 JWTs. The signing key is managed by `backend/src/jwtKeys.js`, which supports:

- A **current key** used to sign all new tokens
- Up to **5 previous keys** retained for verification during a transition window
- **Runtime rotation** without a service restart
- **kid (key ID)** embedded in the JWT header so verification is O(1) — no brute-force key search

## Configuration

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Current signing secret (min 32 chars) | required |
| `JWT_KEY_ID` | Key identifier for the current secret | `"1"` |
| `JWT_PREVIOUS_KEYS` | Comma-separated previous secrets (max 5) | empty |

## Rotation Procedure

### Option A — Runtime rotation via API (no restart)

1. **Generate a new secret** (min 32 chars):
   ```bash
   openssl rand -hex 32
   # e.g. a3f8c2d1e4b5...
   ```

2. **Call the rotation endpoint** (requires admin JWT):
   ```bash
   curl -X POST https://api.example.com/v1/admin/jwt/rotate \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{ "new_secret": "a3f8c2d1e4b5...", "new_kid": "2" }'
   ```

3. **Verify** the rotation succeeded:
   ```json
   { "rotated": true, "method": "inline", "kid": "2" }
   ```

4. **Update environment variables** so the new secret persists across restarts:
   ```bash
   # In .env or your secrets manager:
   JWT_SECRET=a3f8c2d1e4b5...
   JWT_KEY_ID=2
   JWT_PREVIOUS_KEYS=<old-secret>
   ```

5. **Transition window**: tokens signed with the old key remain valid until they expire (1 hour). After that, remove the old secret from `JWT_PREVIOUS_KEYS`.

### Option B — Environment reload (after secrets manager refresh)

If you update `JWT_SECRET` in AWS Secrets Manager or another external store and want the running process to pick it up:

1. Update the secret in your secrets manager.
2. Call the reload endpoint:
   ```bash
   curl -X POST https://api.example.com/v1/admin/jwt/rotate \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{ "reload_from_env": true }'
   ```

### Option C — Service restart

The simplest approach for scheduled rotations:

1. Update `JWT_SECRET`, `JWT_KEY_ID`, and `JWT_PREVIOUS_KEYS` in your environment.
2. Restart the backend: `docker compose restart backend`
3. Tokens signed with the old key remain valid during the transition window (controlled by `JWT_PREVIOUS_KEYS`).

## Transition Window

After rotation, tokens signed with the old key are still accepted as long as:
- The old secret is listed in `JWT_PREVIOUS_KEYS`, **and**
- The token has not expired (tokens expire after 1 hour)

Once all old tokens have expired, remove the old secret from `JWT_PREVIOUS_KEYS` and restart/reload.

## Security Considerations

- **Never commit secrets** to version control. Use `.env` (gitignored) or a secrets manager.
- **Minimum secret length**: 32 characters (256 bits of entropy).
- **Rotation frequency**: Rotate at least every 90 days, or immediately if a secret is suspected compromised.
- **Emergency rotation**: If a secret is compromised, rotate immediately. All tokens signed with the compromised key will be invalidated as soon as it is removed from `JWT_PREVIOUS_KEYS`.
- **Key IDs**: Increment `JWT_KEY_ID` on each rotation to make audit logs easier to trace.

## Key Holders

Document key holders in your access-controlled secrets management system (e.g. AWS Secrets Manager, HashiCorp Vault). At minimum, record:

- Who has access to `JWT_SECRET`
- When the last rotation occurred
- Who performed the rotation
