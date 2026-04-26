#!/bin/bash
REPO="dev-fatima-24/VacciChain"
c() { gh issue create --repo "$REPO" --title "$1" --body "$2" --label "$3" && sleep 1; }

c "SC-011 · Add issuer metadata storage" "## Description
Issuers are stored as \`address → bool\`. No metadata (name, license number, country) is stored, making issuer identity unverifiable on-chain.

## Acceptance Criteria
- \`IssuerRecord { name: String, license: String, country: String, authorized: bool }\` stored per issuer
- \`add_issuer\` updated to accept metadata
- \`get_issuer(address)\` public function returns issuer metadata
- Existing authorization check logic unchanged

**Priority:** Medium | **Effort:** Medium" "smart-contract,enhancement"

c "SC-012 · Implement contract upgrade mechanism" "## Description
Soroban contracts support WASM upgrades. Without an upgrade mechanism, bug fixes require deploying a new contract and migrating all data.

## Acceptance Criteria
- \`upgrade(new_wasm_hash)\` function callable by admin only
- \`ContractUpgraded { new_wasm_hash, admin, timestamp }\` event emitted
- Upgrade tested on testnet before mainnet
- Upgrade procedure documented in \`docs/contract-upgrade.md\`

**Priority:** High | **Effort:** Medium" "smart-contract,enhancement"

c "SC-013 · Add contract initialization guard" "## Description
The contract's \`init\` function can potentially be called multiple times, allowing an attacker to overwrite the admin address.

## Acceptance Criteria
- Contract tracks initialization state in storage
- Second call to \`init\` returns \`AlreadyInitialized\` error
- Unit test verifies double-init is rejected
- Initialization state checked before any admin operation

**Priority:** Critical | **Effort:** Small" "smart-contract,security"

c "SC-014 · Implement vaccination record count limit per patient" "## Description
No limit exists on how many vaccination records a single patient wallet can hold. A malicious issuer could spam records to bloat storage.

## Acceptance Criteria
- Max records per patient configurable by admin (default: 50)
- Mint fails with \`RecordLimitExceeded\` if patient is at limit
- Admin can adjust limit via \`set_patient_record_limit(limit: u32)\`
- Limit documented and tested

**Priority:** Medium | **Effort:** Small" "smart-contract,security"

c "SC-015 · Add contract pause mechanism for emergency stops" "## Description
No emergency stop exists. If a critical bug is discovered, there is no way to halt minting while a fix is prepared.

## Acceptance Criteria
- \`pause()\` and \`unpause()\` callable by admin only
- All state-changing functions check paused state and return \`ContractPaused\` error
- Read-only functions (\`verify_vaccination\`) remain available when paused
- \`ContractPaused\` and \`ContractUnpaused\` events emitted

**Priority:** High | **Effort:** Small" "smart-contract,security"

c "SC-016 · Optimize storage key schema for gas efficiency" "## Description
Current storage schema uses full address strings as keys. Hashed or shortened keys reduce storage costs on every read/write.

## Acceptance Criteria
- Storage keys reviewed and optimized (e.g., hash addresses to fixed-length keys)
- Gas benchmarks before and after documented
- No change to public function signatures
- All existing tests pass after optimization

**Priority:** Low | **Effort:** Medium" "smart-contract,performance"

c "SC-017 · Add get_all_issuers admin function" "## Description
No function exists to enumerate all authorized issuers. Admin cannot audit the issuer list without off-chain indexing.

## Acceptance Criteria
- \`get_all_issuers()\` returns \`Vec<Address>\` of all currently authorized issuers
- Callable by anyone (public read)
- Paginated if issuer count can be large
- Tested with empty, single, and multiple issuers

**Priority:** Medium | **Effort:** Small" "smart-contract,enhancement"

c "SC-018 · Document all contract error codes" "## Description
Error codes are not documented. Backend and frontend cannot provide meaningful error messages to users.

## Acceptance Criteria
- All \`ContractError\` variants documented with: code, name, description, when triggered
- Documentation in \`contracts/README.md\`
- Error codes are stable integers (not reordered between versions)
- Backend maps error codes to user-facing messages

**Priority:** Medium | **Effort:** Small" "smart-contract,documentation"

c "SC-019 · Add testnet deployment script with post-deploy verification" "## Description
\`make deploy\` deploys the contract but does not verify the deployment by calling a read function post-deploy.

## Acceptance Criteria
- \`make deploy\` outputs the contract ID
- Post-deploy smoke test calls \`verify_vaccination\` with a known address
- Contract ID written to \`.env\` automatically after successful deploy
- Deploy fails loudly if smoke test fails

**Priority:** Medium | **Effort:** Small" "smart-contract,devops"

c "SC-020 · Implement fee/tip configuration for contract calls" "## Description
Contract invocations use default fee settings. High network congestion can cause transactions to fail or be delayed.

## Acceptance Criteria
- Fee and tip parameters configurable via environment variables in the backend
- Backend uses \`soroban.js\` helper to set fees on all contract invocations
- Fee too low results in a clear error, not a silent hang
- Documented in backend README

**Priority:** Low | **Effort:** Small" "smart-contract,reliability"

c "DO-001 · Set up CI pipeline with GitHub Actions" "## Description
No CI pipeline exists. PRs can merge broken contracts, failing backend tests, or invalid Docker builds without any automated checks.

## Acceptance Criteria
- CI runs on every PR and push to \`main\`: \`cargo test\`, \`npm test\`, \`pytest\`
- Contract WASM build verified (\`make build\`)
- Docker images built (not pushed) to validate Dockerfiles
- Pipeline fails PR merge on any test or build failure
- CI badge added to README

**Priority:** Critical | **Effort:** Medium" "devops,ci-cd"

c "DO-002 · Add .env.example with all required variables documented" "## Description
\`.env.example\` is referenced in the README but its contents are not defined. New developers cannot onboard without it.

## Acceptance Criteria
- \`.env.example\` contains all variables from the Environment Variables section
- Each variable has an inline comment explaining its purpose and expected format
- README quick-start references \`.env.example\` explicitly
- \`.env\` is confirmed in \`.gitignore\`

**Priority:** High | **Effort:** Small" "devops,documentation"

c "DO-003 · Add healthcheck directives to docker-compose.yml" "## Description
Services start without readiness checks. The frontend can attempt API calls before the backend is ready, causing startup race conditions.

## Acceptance Criteria
- Backend, frontend, and python-service have \`healthcheck\` in \`docker-compose.yml\`
- Services use \`depends_on: condition: service_healthy\`
- Startup order enforced: backend → frontend, backend → python-service
- Unhealthy containers restart automatically

**Priority:** Medium | **Effort:** Small" "devops"

c "DO-004 · Pin all Docker base image versions" "## Description
Dockerfiles using \`node:18\`, \`python:3.11\` without digest pins will silently pull updated images, breaking reproducibility.

## Acceptance Criteria
- All \`FROM\` statements use pinned digest (e.g., \`node:18-alpine@sha256:...\`)
- Renovate or Dependabot configured to auto-PR image digest updates
- Pinning approach documented in \`CONTRIBUTING.md\`

**Priority:** Medium | **Effort:** Small" "devops,security"

c "DO-005 · Add production deployment pipeline" "## Description
No deployment pipeline exists for testnet or mainnet. Contract deployment is manual via \`make deploy\`, which is error-prone and unaudited.

## Acceptance Criteria
- GitHub Actions workflow deploys to testnet on merge to \`main\`
- Mainnet deploy requires manual approval gate in GitHub Environments
- Contract ID written back to environment config after successful deploy
- Deployment history and approvals logged in GitHub Actions

**Priority:** High | **Effort:** Large" "devops,ci-cd"
