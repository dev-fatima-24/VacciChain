# Contract Upgrade Procedure

VacciChain uses Soroban's native WASM upgrade mechanism. The contract's storage and address remain unchanged — only the executable code is replaced.

## How it works

The `upgrade(new_wasm_hash)` function:
1. Requires auth from the stored admin address.
2. Calls `env.deployer().update_current_contract_wasm(new_wasm_hash)`.
3. Emits a `ContractUpgraded { new_wasm_hash, admin, timestamp }` event.

All existing storage (patient records, issuers, admin) is preserved across upgrades.

---

## Step-by-step

### 1. Build the new WASM

```bash
cd contracts
make build
# outputs: target/wasm32-unknown-unknown/release/vacci_chain.wasm
```

### 2. Upload the WASM to the network (testnet first)

```bash
soroban contract upload \
  --wasm target/wasm32-unknown-unknown/release/vacci_chain.wasm \
  --source <ADMIN_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
# Outputs: <NEW_WASM_HASH>
```

### 3. Invoke the upgrade function

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <ADMIN_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- upgrade \
  --new_wasm_hash <NEW_WASM_HASH>
```

### 4. Verify the upgrade

Confirm the `upgraded` event was emitted:

```bash
soroban events \
  --id <CONTRACT_ID> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

Check that the event contains the expected `new_wasm_hash`, `admin`, and `timestamp`.

### 5. Smoke-test on testnet

Run a `verify_vaccination` call and a test mint against the upgraded contract before proceeding to mainnet.

### 6. Repeat on mainnet

Replace the RPC URL and network passphrase:

```bash
--rpc-url https://soroban-mainnet.stellar.org
--network-passphrase "Public Global Stellar Network ; September 2015"
```

---

## Security checklist

- [ ] New WASM built from a tagged, reviewed commit
- [ ] Upgrade tested end-to-end on testnet
- [ ] Admin key used from a hardware wallet or secure key management system
- [ ] `upgraded` event confirmed on-chain after execution
- [ ] Existing records spot-checked via `verify_vaccination` post-upgrade
