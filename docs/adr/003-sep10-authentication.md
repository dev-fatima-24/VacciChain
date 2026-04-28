# ADR-003: SEP-10 Authentication Over Alternative Methods

## Status
Accepted

## Context
VacciChain requires secure authentication for both patients and healthcare providers to:
- Verify wallet ownership without private key exposure
- Prevent replay attacks
- Support role-based access control (patient vs issuer)
- Integrate seamlessly with Stellar wallet ecosystem
- Provide a familiar user experience for Stellar users

The system needed to choose between various authentication methods including traditional OAuth, JWT-only, custom schemes, and Stellar's native SEP-10 Web Authentication.

## Decision
We chose SEP-10 (Stellar Web Authentication) as the primary authentication mechanism, combined with short-lived JWT tokens for session management. SEP-10 provides cryptographically secure wallet ownership verification using challenge-response transactions signed by the user's wallet.

## Consequences

### Positive
- **No private key exposure**: Users sign transactions without revealing private keys
- **Replay protection**: Challenge transactions include unique nonces and time bounds
- **Wallet integration**: Works seamlessly with Freighter and other Stellar wallets
- **Role-based access**: JWT tokens issued with appropriate scopes (patient/issuer)
- **Stellar native**: Leverages existing Stellar ecosystem standards
- **Security**: Cryptographically proven wallet ownership verification
- **User experience**: Familiar flow for Stellar users

### Negative
- **Stellar dependency**: Authentication tied to Stellar wallet ecosystem
- **Complexity**: More complex than simple username/password
- **Learning curve**: Users unfamiliar with crypto wallets need education
- **Network dependency**: Requires connection to Stellar network for challenges

## Alternatives Considered

### Traditional OAuth 2.0
- **Pros**: Widely adopted, familiar to developers, many libraries
- **Cons**: Requires centralized identity provider, password management, not blockchain-native
- **Rejected**: Doesn't leverage blockchain identity, creates centralization

### JWT with API Keys
- **Pros**: Simple implementation, stateless, widely supported
- **Cons**: Key management complexity, no wallet ownership proof, weaker security
- **Rejected**: Lacks cryptographic proof of wallet ownership

### Custom Challenge-Response
- **Pros**: Tailored to specific needs, full control
- **Cons**: Security risks, reinventing wheel, no standardization
- **Rejected**: Higher security risk than proven SEP-10 standard

### Magic Link Authentication
- **Pros**: Good UX, email-based familiar flow
- **Cons**: Email dependency, not wallet-based, centralization
- **Rejected**: Doesn't provide blockchain identity verification

### Web3.eth (Ethereum) Style
- **Pros**: Similar concept, proven in Web3
- **Cons**: Ethereum-specific, not Stellar native, different signature scheme
- **Rejected**: Not compatible with Stellar ecosystem

## Implementation Notes
- Challenge transactions expire after 5 minutes
- Nonces are single-use and tracked in memory store
- JWT tokens issued after successful SEP-10 verification
- JWT tokens expire after 1 hour for security
- Role-based scoping: `patient` vs `issuer` permissions
- Rate limiting applied to challenge endpoint

```javascript
// SEP-10 Challenge Flow
1. Client requests challenge with public key
2. Server builds challenge transaction with nonce
3. Server signs transaction and returns XDR
4. Client signs transaction with wallet
5. Server verifies signatures and nonce
6. Server issues JWT with appropriate role
```

## References
- [SEP-10 Stellar Web Authentication](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
- [Freighter Wallet Documentation](https://www.freighter.app/docs)
- [JWT Best Practices](https://auth0.com/blog/json-web-token-best-practices/)
