#!/bin/bash
REPO="dev-fatima-24/VacciChain"
c() { gh issue create --repo "$REPO" --title "$1" --body "$2" --label "$3" && sleep 1; }

c "DO-006 · Set up centralized log aggregation" "## Description
Logs are scattered across three services with no aggregation. Debugging cross-service issues requires SSHing into individual containers.

## Acceptance Criteria
- Structured logs from all services shipped to a single sink (Loki, CloudWatch, or Datadog)
- Log retention policy defined (minimum 30 days)
- Basic alerting on error rate spikes (>10 errors/min)
- Log aggregation stack included in \`docker-compose.yml\` for local development

**Priority:** Medium | **Effort:** Medium" "devops,observability"

c "DO-007 · Add Docker multi-stage builds to reduce image sizes" "## Description
Current Dockerfiles likely use single-stage builds, resulting in large images with build tools included in production.

## Acceptance Criteria
- Backend Dockerfile uses multi-stage: build stage → production stage (runtime only)
- Frontend Dockerfile: build stage (Node + build tools) → serve stage (nginx)
- Python Dockerfile: build stage → slim runtime stage
- Final image sizes documented and compared to baseline

**Priority:** Medium | **Effort:** Small" "devops,performance"

c "DO-008 · Configure resource limits in docker-compose.yml" "## Description
No CPU or memory limits are set on containers. A runaway service can starve other services on the same host.

## Acceptance Criteria
- CPU and memory limits defined for each service in \`docker-compose.yml\`
- Limits based on profiled usage (not arbitrary)
- OOM kill events logged and alerted
- Limits documented with rationale

**Priority:** Medium | **Effort:** Small" "devops,reliability"

c "DO-009 · Set up infrastructure-as-code for cloud deployment" "## Description
No IaC exists for deploying VacciChain to a cloud provider. Manual cloud setup is not reproducible or auditable.

## Acceptance Criteria
- Terraform or CDK modules for: VPC, container service (ECS/Cloud Run), secrets management
- Separate configurations for staging and production environments
- IaC stored in \`infra/\` directory
- README includes deployment instructions

**Priority:** High | **Effort:** Large" "devops,infrastructure"

c "DO-010 · Add uptime monitoring and alerting" "## Description
No uptime monitoring exists. Service outages are discovered by users, not operators.

## Acceptance Criteria
- Uptime checks configured for all three service health endpoints
- Alert sent (email/Slack/PagerDuty) within 2 minutes of a service going down
- Status page or dashboard showing current service health
- Monitoring config stored in repo

**Priority:** Medium | **Effort:** Small" "devops,observability"

c "DO-011 · Implement automated backup for analytics service data" "## Description
The Python analytics service maintains local state or a database. No backup strategy exists.

## Acceptance Criteria
- Automated daily backup of analytics data
- Backups stored in a separate location (S3 or equivalent)
- Backup retention: 30 days
- Restore procedure documented and tested

**Priority:** Medium | **Effort:** Medium" "devops,reliability"

c "DO-012 · Add container vulnerability scanning to CI" "## Description
Docker images are built and deployed without scanning for known CVEs in base images or installed packages.

## Acceptance Criteria
- \`trivy\` or \`grype\` scans all built images in CI
- High/critical CVEs fail the pipeline
- Scan results uploaded as CI artifacts
- Weekly scheduled scan on production images

**Priority:** High | **Effort:** Small" "devops,security"

c "DO-013 · Configure secrets management for production" "## Description
Secrets (Stellar keys, JWT secret) are managed via \`.env\` files. In production, secrets must be managed by a secrets manager, not flat files.

## Acceptance Criteria
- Production secrets stored in AWS Secrets Manager, HashiCorp Vault, or equivalent
- Containers retrieve secrets at runtime, not baked into images
- No secrets in environment variables visible in \`docker inspect\`
- Secret rotation procedure documented

**Priority:** Critical | **Effort:** Medium" "devops,security"

c "DO-014 · Add performance benchmarking to CI" "## Description
No performance benchmarks exist. Regressions in API response time or contract gas usage go undetected.

## Acceptance Criteria
- Backend API benchmarks run in CI (e.g., \`autocannon\` or \`k6\`)
- Contract gas usage benchmarked per function
- Benchmark results stored as CI artifacts
- Alert if response time increases >20% vs baseline

**Priority:** Low | **Effort:** Medium" "devops,performance"

c "DO-015 · Create staging environment matching production" "## Description
No staging environment exists. Changes go directly from local development to production, increasing deployment risk.

## Acceptance Criteria
- Staging environment deployed to cloud with production-equivalent configuration
- Staging uses Stellar testnet; production uses mainnet
- Deployments to staging are automatic on merge to \`main\`
- Staging environment URL documented in README

**Priority:** High | **Effort:** Large" "devops,infrastructure"

c "DOC-001 · Write Soroban contract developer documentation" "## Description
No documentation exists for the smart contract internals. New contributors cannot understand storage schemas, error codes, or function signatures without reading all source files.

## Acceptance Criteria
- \`contracts/README.md\` documents all public functions with params, return types, and errors
- Storage schema documented with key formats and data types
- All \`ContractError\` variants documented with codes and trigger conditions
- Build, test, and deploy instructions included

**Priority:** High | **Effort:** Medium" "documentation,smart-contract"

c "DOC-002 · Generate OpenAPI spec for the backend API" "## Description
The API is documented only in the README prose. No machine-readable spec exists for client generation, testing tools, or third-party integrations.

## Acceptance Criteria
- OpenAPI 3.0 spec generated via \`swagger-jsdoc\` or equivalent
- Spec served at \`GET /docs\` in development (Swagger UI)
- All request/response schemas documented including error responses
- Spec committed to repo and kept in sync via CI lint check

**Priority:** Medium | **Effort:** Medium" "documentation,backend"

c "DOC-003 · Write analytics service API documentation" "## Description
The Python FastAPI service has no documented request/response schemas. Consumers of the analytics API have no contract to code against.

## Acceptance Criteria
- FastAPI auto-generated docs available at \`/docs\` (Swagger UI) and \`/redoc\`
- All endpoints have Pydantic response models with field descriptions
- Batch verify endpoint documents input format, size limits, and error responses
- Authentication requirements documented per endpoint

**Priority:** Medium | **Effort:** Small" "documentation,python-service"

c "DOC-004 · Create contributor onboarding guide" "## Description
No \`CONTRIBUTING.md\` exists. Contributors don't know the branching strategy, PR process, commit conventions, or local setup steps.

## Acceptance Criteria
- \`CONTRIBUTING.md\` covers: local setup, branching strategy, PR process, commit conventions (Conventional Commits)
- PR template created at \`.github/pull_request_template.md\`
- Issue templates created for bug reports and feature requests
- Code of conduct added

**Priority:** Medium | **Effort:** Small" "documentation"

c "DOC-005 · Document SEP-10 authentication flow for integrators" "## Description
Third-party systems (schools, employers, border agencies) need to understand how to authenticate and call the verification API.

## Acceptance Criteria
- \`docs/integration-guide.md\` documents the full SEP-10 flow for external integrators
- Step-by-step guide with example requests and responses
- Common error scenarios and how to handle them
- Code examples in JavaScript and Python

**Priority:** Medium | **Effort:** Medium" "documentation"
