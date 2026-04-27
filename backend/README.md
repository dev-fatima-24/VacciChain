# VacciChain Backend

Node.js / Express API that bridges the frontend and the Soroban smart contract.

## Environment Variables

Copy `../.env.example` to `.env` and fill in the required values. The backend validates all variables at startup via Zod and exits with a clear error if anything is missing.

See the root [docs/configuration.md](../docs/configuration.md) for the full reference. The variables specific to this service are summarised below.

### Transaction Fees

All Soroban contract invocations use the fee settings from these two variables:

| Variable | Default | Description |
|---|---|---|
| `SOROBAN_FEE` | `100` | Base fee per operation in **stroops** (1 XLM = 10 000 000 stroops). The Stellar network minimum is 100. |
| `SOROBAN_TIP` | `0` | Inclusion tip in stroops added on top of the base fee. Increase during high-congestion periods to prioritise your transactions. |

**When to raise the fee**

During network congestion, transactions with the minimum fee (100 stroops) may be rejected with `txINSUFFICIENT_FEE`. The backend surfaces this as a clear error:

```
Transaction rejected: fee too low (current: 100 stroops).
Increase SOROBAN_FEE in your environment.
```

A value of `500`–`10000` stroops is sufficient for most congestion events. Monitor the [Stellar network fee stats](https://horizon-testnet.stellar.org/fee_stats) to pick an appropriate value.

## Running

```bash
npm install
npm run dev      # development (nodemon)
npm start        # production
npm test         # Jest test suite
```
