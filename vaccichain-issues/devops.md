# DevOps Issues (DO-001 to DO-015)

---

### DO-001 · Set up CI pipeline with GitHub Actions

**Description:** No CI pipeline exists. PRs can merge broken contracts, failing backend tests, or invalid Docker builds without any automated checks.

**Acceptance Criteria:**
- CI runs on every PR and push to `main`: `cargo test`, `npm test`, `pytest`
- Contract WASM build verified (`make build`)
- Docker images built (not pushed) to validate Dockerfiles
- Pipeline fails PR merge on any test or build failure
- CI badge added to README

**Priority:** Critical | **Effort:** Medium
**Dependencies:** None
**Labels:** `devops`, `ci-cd`

---

### DO-002 · Add `.env.example` with all required variables documented

**Description:** `.env.example` is referenced in the README but its contents are not defined. New developers cannot onboard without it.

**Acceptance Criteria:**
- `.env.example` contains all variables from the Environment Variables section
- Each variable has an inline comment explaining its purpose and expected format
- README quick-start references `.env.example` explicitly
- `.env` is confirmed in `.gitignore`

**Priority:** High | **Effort:** Small
**Dependencies:** None
**Labels:** `devops`, `documentation`

---

### DO-003 · Add `healthcheck` directives to `docker-compose.yml`

**Description:** Services start without readiness checks. The frontend can attempt API calls before the backend is ready, causing startup race conditions.

**Acceptance Criteria:**
- Backend, frontend, and python-service have `healthcheck` in `docker-compose.yml`
- Services use `depends_on: condition: service_healthy`
- Startup order enforced: backend → frontend, backend → python-service
- Unhealthy containers restart automatically

**Priority:** Medium | **Effort:** Small
**Dependencies:** BE-006
**Labels:** `devops`

---

### DO-004 · Pin all Docker base image versions

**Description:** Dockerfiles using `node:18`, `python:3.11` without digest pins will silently pull updated images, breaking reproducibility and introducing unreviewed changes.

**Acceptance Criteria:**
- All `FROM` statements use pinned digest (e.g., `node:18-alpine@sha256:...`)
- Renovate or Dependabot configured to auto-PR image digest updates
- Pinning approach documented in `CONTRIBUTING.md`

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `devops`, `security`

---

### DO-005 · Add production deployment pipeline

**Description:** No deployment pipeline exists for testnet or mainnet. Contract deployment is manual via `make deploy`, which is error-prone and unaudited.

**Acceptance Criteria:**
- GitHub Actions workflow deploys to testnet on merge to `main`
- Mainnet deploy requires manual approval gate in GitHub Environments
- Contract ID written back to environment config after successful deploy
- Deployment history and approvals logged in GitHub Actions

**Priority:** High | **Effort:** Large
**Dependencies:** DO-001
**Labels:** `devops`, `ci-cd`

---

### DO-006 · Set up centralized log aggregation

**Description:** Logs are scattered across three services with no aggregation. Debugging cross-service issues requires SSHing into individual containers.

**Acceptance Criteria:**
- Structured logs from all services shipped to a single sink (Loki, CloudWatch, or Datadog)
- Log retention policy defined (minimum 30 days)
- Basic alerting on error rate spikes (>10 errors/min)
- Log aggregation stack included in `docker-compose.yml` for local development

**Priority:** Medium | **Effort:** Medium
**Dependencies:** BE-003
**Labels:** `devops`, `observability`

---

### DO-007 · Add Docker multi-stage builds to reduce image sizes

**Description:** Current Dockerfiles likely use single-stage builds, resulting in large images with build tools included in production.

**Acceptance Criteria:**
- Backend Dockerfile uses multi-stage: build stage (with dev deps) → production stage (runtime only)
- Frontend Dockerfile: build stage (Node + build tools) → serve stage (nginx or static server)
- Python Dockerfile: build stage → slim runtime stage
- Final image sizes documented and compared to baseline

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `devops`, `performance`

---

### DO-008 · Configure resource limits in docker-compose.yml

**Description:** No CPU or memory limits are set on containers. A runaway service can starve other services on the same host.

**Acceptance Criteria:**
- CPU and memory limits defined for each service in `docker-compose.yml`
- Limits based on profiled usage (not arbitrary)
- OOM kill events logged and alerted
- Limits documented with rationale

**Priority:** Medium | **Effort:** Small
**Dependencies:** None
**Labels:** `devops`, `reliability`

---

### DO-009 · Set up infrastructure-as-code for cloud deployment

**Description:** No IaC exists for deploying VacciChain to a cloud provider. Manual cloud setup is not reproducible or auditable.

**Acceptance Criteria:**
- Terraform or CDK modules for: VPC, container service (ECS/Cloud Run), secrets management
- Separate configurations for staging and production environments
- IaC stored in `infra/` directory
- README includes deployment instructions

**Priority:** High | **Effort:** Large
**Dependencies:** DO-005
**Labels:** `devops`, `infrastructure`

---

### DO-010 · Add uptime monitoring and alerting

**Description:** No uptime monitoring exists. Service outages are discovered by users, not operators.

**Acceptance Criteria:**
- Uptime checks configured for all three service health endpoints
- Alert sent (email/Slack/PagerDuty) within 2 minutes of a service going down
- Status page or dashboard showing current service health
- Monitoring config stored in repo

**Priority:** Medium | **Effort:** Small
**Dependencies:** BE-006
**Labels:** `devops`, `observability`

---

### DO-011 · Implement automated database/state backup for analytics service

**Description:** The Python analytics service likely maintains local state or a database. No backup strategy exists.

**Acceptance Criteria:**
- Automated daily backup of analytics data
- Backups stored in a separate location (S3 or equivalent)
- Backup retention: 30 days
- Restore procedure documented and tested

**Priority:** Medium | **Effort:** Medium
**Dependencies:** None
**Labels:** `devops`, `reliability`

---

### DO-012 · Add container vulnerability scanning to CI

**Description:** Docker images are built and deployed without scanning for known CVEs in base images or installed packages.

**Acceptance Criteria:**
- `trivy` or `grype` scans all built images in CI
- High/critical CVEs fail the pipeline
- Scan results uploaded as CI artifacts
- Weekly scheduled scan on production images

**Priority:** High | **Effort:** Small
**Dependencies:** DO-001
**Labels:** `devops`, `security`

---

### DO-013 · Configure secrets management for production

**Description:** Secrets (Stellar keys, JWT secret) are managed via `.env` files. In production, secrets must be managed by a secrets manager, not flat files.

**Acceptance Criteria:**
- Production secrets stored in AWS Secrets Manager, HashiCorp Vault, or equivalent
- Containers retrieve secrets at runtime, not baked into images
- No secrets in environment variables visible in `docker inspect`
- Secret rotation procedure documented

**Priority:** Critical | **Effort:** Medium
**Dependencies:** DO-009
**Labels:** `devops`, `security`

---

### DO-014 · Add performance benchmarking to CI

**Description:** No performance benchmarks exist. Regressions in API response time or contract gas usage go undetected.

**Acceptance Criteria:**
- Backend API benchmarks run in CI (e.g., `autocannon` or `k6`)
- Contract gas usage benchmarked per function
- Benchmark results stored as CI artifacts
- Alert if response time increases >20% vs baseline

**Priority:** Low | **Effort:** Medium
**Dependencies:** DO-001
**Labels:** `devops`, `performance`

---

### DO-015 · Create staging environment matching production

**Description:** No staging environment exists. Changes go directly from local development to production, increasing deployment risk.

**Acceptance Criteria:**
- Staging environment deployed to cloud with production-equivalent configuration
- Staging uses Stellar testnet; production uses mainnet
- Deployments to staging are automatic on merge to `main`
- Staging environment URL documented in README

**Priority:** High | **Effort:** Large
**Dependencies:** DO-005, DO-009
**Labels:** `devops`, `infrastructure`
