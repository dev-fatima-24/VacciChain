# VacciChain Contract

## String input validation

The contract validates string inputs at the contract boundary before any storage operations.

### Limits

- `vaccine_name`: maximum 100 characters
- `date_administered`: maximum 100 characters
- `name` (issuer metadata): maximum 100 characters
- `license` (issuer metadata): maximum 100 characters
- `country` (issuer metadata): maximum 100 characters

### Errors

When a string input exceeds the configured limit, the contract returns an invalid input error variant:

- `InvalidInputVaccineName`
- `InvalidInputDateAdministered`
- `InvalidInputIssuerName`
- `InvalidInputLicense`
- `InvalidInputCountry`

This prevents excessively long strings from being stored on ledger state and keeps ledger fees bounded.
