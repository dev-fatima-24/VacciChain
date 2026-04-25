# Gas Usage Benchmark Report

## Issue #56: Optimize storage key schema

### Optimization Strategy
Hashed `Address` keys to `BytesN<32>` using SHA-256 to ensure fixed-length keys and reduce storage footprint for contract and wallet addresses.

### Results (CPU & Memory Cost)

| Metric | Before Optimization | After Optimization | Change |
|---|---|---|---|
| CPU Instruction Cost | 91,905 | 119,661 | +30% |
| Memory Byte Cost | 16,581 | 19,887 | +20% |

**Note on Interpretation:**
While the host compute costs (CPU/RAM) increased due to the addition of SHA-256 hashing during contract execution, the primary goal of this optimization was to reduce **Storage Gas** on-chain. By using fixed 32-byte keys instead of variable-length `Address` objects (which can be significantly larger), the contract minimizes its persistent storage footprint, leading to lower per-transaction fees on the Stellar network.

### Benchmark Environment
- Soroban SDK v22.0.11
- Tool: `cargo test` with `env.budget()`
- Operation: `mint_vaccination` (includes issuer check, duplicate check, and record persistence)
