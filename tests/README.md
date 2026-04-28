# Testing in VacciChain

This document describes the shared factories and mocks used for testing in VacciChain.

## Backend Factories

Located in `backend/tests/factories/`.

### Vaccination Record Factory
Generates mock vaccination records with realistic data.
```javascript
const { vaccinationRecordFactory } = require('./factories');
const record = vaccinationRecordFactory({ vaccine_name: 'COVID-19' });
```

### JWT Factory
Generates signed JWTs for different roles (`patient`, `issuer`).
```javascript
const { jwtFactory } = require('./factories');
const token = jwtFactory({ role: 'issuer' });
```

### SEP-10 Challenge Factory
Generates mock SEP-10 challenge transactions.
```javascript
const { sep10ChallengeFactory } = require('./factories');
const challenge = sep10ChallengeFactory('GB...');
```

## Frontend MSW Handlers

Located in `frontend/src/mocks/handlers.js`.
These handlers mock all API endpoints used by the frontend.

### Supported Endpoints
- `POST /auth/sep10`
- `POST /auth/verify`
- `GET /vaccination/:wallet`
- `POST /vaccination/issue`
- `GET /verify/:wallet`
- `POST /patient/register`
- `GET /admin/api-keys`
- `POST /admin/api-keys`
- `DELETE /admin/api-keys/:id`

## Migrating Existing Tests
All backend tests have been migrated to use these factories. When adding new tests, please utilize the factories instead of manual data setup to ensure tests remain maintainable and less brittle.
