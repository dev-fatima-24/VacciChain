# ADR-002: Soulbound Token Design for Vaccination Records

## Status
Accepted

## Context
VacciChain needs to issue vaccination records that are:
- Non-transferable to prevent fraud and black markets
- Permanently tied to the patient's identity
- Verifiable by third parties (schools, employers, border agencies)
- Revocable in case of errors or updates
- Compliant with healthcare data regulations

Traditional NFTs are transferable by design, which creates risks for vaccination records including unauthorized transfers, identity fraud, and creation of vaccination black markets.

## Decision
We implemented soulbound vaccination NFTs using contract-level transfer restrictions. The smart contract includes a `transfer()` function that always panics with a "soulbound: transfers are disabled" error, making transfer attempts impossible at the protocol level.

## Consequences

### Positive
- **Fraud prevention**: No possibility of unauthorized transfer or sale of vaccination records
- **Identity binding**: Records remain permanently associated with the patient's wallet
- **Regulatory compliance**: Meets healthcare data portability requirements without transferability
- **Simple enforcement**: Single point of control in the smart contract
- **Gas efficiency**: No complex transfer logic to execute
- **Audit trail**: All vaccination events remain traceable to original recipient

### Negative
- **Wallet loss risk**: If a patient loses their wallet, vaccination records are inaccessible
- **No recovery mechanism**: Cannot transfer records to a new wallet address
- **Inflexibility**: Cannot accommodate legitimate transfer scenarios (e.g., legal guardianship changes)
- **User experience**: Users must understand they cannot transfer records like regular NFTs

## Alternatives Considered

### Transferable NFTs with Transfer Restrictions
- **Pros**: Flexible, allows legitimate transfers, familiar UX
- **Cons**: Complex logic, potential for exploits, regulatory concerns
- **Rejected**: Transfer complexity creates security risks for healthcare data

### Off-chain Binding with On-chain References
- **Pros**: Can implement recovery mechanisms, flexible identity management
- **Cons**: Centralized trust, additional infrastructure, privacy concerns
- **Rejected**: Defeats purpose of on-chain verification and decentralization

### Multi-signature Controlled Transfers
- **Pros**: Allows controlled transfers with multiple approvals
- **Cons**: Complex implementation, gas costs, coordination overhead
- **Rejected**: Too complex for simple vaccination record use case

### Time-locked Transfers
- **Pros**: Allows transfers after cooling-off period
- **Cons**: Still enables transfer markets, timing attacks possible
- **Rejected**: Any transferability creates fraud potential

## Implementation Notes
- Transfer function panics immediately with descriptive error message
- Soulbound enforcement is at contract level, not UI level
- Records can be revoked but not transferred
- Verification functions work directly on patient wallet address
- Batch verification supported for efficiency

```rust
// Transfer is permanently blocked — soulbound enforcement
pub fn transfer(_env: Env, _from: Address, _to: Address, _token_id: u64) {
    panic!("soulbound: transfers are disabled");
}
```

## References
- [Soulbound Tokens Concept - Vitalik Buterin](https://vitalik.ca/general/2022/01/26/soulbound.html)
- [ERC-721 Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Soroban Contract Documentation](https://soroban.stellar.org/docs/smart-contracts/overview)
