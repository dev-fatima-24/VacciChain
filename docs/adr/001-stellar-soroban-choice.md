# ADR-001: Choice of Stellar Network and Soroban Smart Contracts

## Status
Accepted

## Context
VacciChain requires a blockchain platform that can support vaccination record management with the following requirements:
- Immutable, tamper-proof vaccination records
- Soulbound (non-transferable) NFTs
- Public verification capability
- Low transaction costs for healthcare providers
- Strong security and decentralization
- Developer-friendly tooling for smart contracts

The project needed to choose between several blockchain platforms including Ethereum, Polygon, Solana, and Stellar.

## Decision
We chose the Stellar network with Soroban smart contracts as the foundation for VacciChain. Stellar provides the optimal balance of low transaction costs, fast settlement times, and built-in asset management capabilities, while Soroban offers Rust-based smart contracts with strong security guarantees.

## Consequences

### Positive
- **Low transaction costs**: Stellar transactions cost fractions of a cent, making vaccination record issuance affordable for healthcare providers globally
- **Fast settlement**: 3-5 second confirmation times enable real-time vaccination verification
- **Built-in asset support**: Stellar's native asset capabilities align perfectly with vaccination NFTs
- **Strong security**: Soroban contracts compile to WASM with memory safety guarantees
- **Developer experience**: Rust provides memory safety and excellent tooling
- **Decentralization**: Stellar has a robust, decentralized validator network
- **Regulatory compliance**: Stellar's compliance features support healthcare data requirements

### Negative
- **Smaller ecosystem**: Compared to Ethereum, Stellar has fewer developers and tools
- **Learning curve**: Team needs to learn Stellar-specific concepts and Soroban SDK
- **Limited DeFi ecosystem**: Fewer integrations compared to Ethereum-based platforms

## Alternatives Considered

### Ethereum with Solidity
- **Pros**: Largest ecosystem, extensive tooling, widely adopted
- **Cons**: High gas fees, slower confirmations, more complex smart contract security
- **Rejected**: Transaction costs would make vaccination issuance prohibitively expensive

### Polygon
- **Pros**: Lower fees than Ethereum, EVM compatible
- **Cons**: Still higher costs than Stellar, less mature than mainnet solutions
- **Rejected**: Cost savings insufficient for high-volume vaccination use case

### Solana
- **Pros**: High throughput, low costs, fast confirmations
- **Cons**: Network stability concerns, less mature smart contract language
- **Rejected**: Recent network outages raised concerns for critical healthcare infrastructure

### Hyperledger Fabric
- **Pros**: Permissioned blockchain, enterprise features
- **Cons**: Centralized, requires complex consortium setup
- **Rejected**: VacciChain needs public verification capabilities that permissioned chains don't provide

## Implementation Notes
- Smart contracts written in Rust using Soroban SDK
- Contracts deployed on Stellar testnet initially, with mainnet migration path
- Integration with Stellar Horizon API for transaction submission
- SEP-10 authentication for wallet-based identity verification

## References
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [SEP-10 Authentication Specification](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
