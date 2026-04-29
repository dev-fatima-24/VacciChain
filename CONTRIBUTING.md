# Contributing to VacciChain

## Overview

Thank you for your interest in contributing to VacciChain! This document provides guidelines and instructions for contributing to our project.

## Table of Contents

- [Local Setup](#local-setup)
- [Branching Strategy](#branching-strategy)
- [Pull Request Process](#pull-request-process)
- [Commit Conventions](#commit-conventions)
- [Code of Conduct](#code-of-conduct)
- [Docker Base Image Pinning](#docker-base-image-pinning)

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Rust + `wasm32-unknown-unknown` target
- Soroban CLI
- Docker + Docker Compose
- Freighter Wallet (for testing)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/dev-fatima-24/VacciChain.git
   cd VacciChain
   ```

2. **Copy environment configuration**
   ```bash
   cp .env.example .env
   # Fill in your Stellar keys and contract IDs
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Install Python service dependencies**
   ```bash
   cd python-service
   pip install -r requirements.txt
   cd ..
   ```

6. **Deploy smart contract (if needed)**
   ```bash
   cd contracts
   make build
   make deploy
   cd ..
   ```

7. **Run locally**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev

   # Terminal 3: Python service
   cd python-service && uvicorn main:app --port 8001
   ```

   Or use Docker Compose:
   ```bash
   docker compose up --build
   ```

## Branching Strategy

We follow a **feature branch** workflow:

- **main**: Production-ready code. Protected branch, requires PR review.
- **Feature branches**: `feature/<description>` or `issues/<issue-numbers>`
  - Example: `feature/openapi-spec` or `issues/77-79-82-84`
  - Branch from `main`
  - Prefix with issue numbers if addressing GitHub issues

### Creating a Branch

```bash
git checkout main
git pull origin main
git checkout -b issues/77-79-82-84
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   # Backend
   cd backend && npm test

   # Contracts
   cd contracts && cargo test

   # Python service
   cd python-service && pytest
   ```

2. **Run linters** (if configured)
   ```bash
   cd backend && npm run lint  # if available
   ```

3. **Update documentation** if your changes affect user-facing features

4. **Commit your changes** using [Conventional Commits](#commit-conventions)

### Submitting a PR

1. **Push your branch**
   ```bash
   git push -u origin issues/77-79-82-84
   ```

2. **Create a pull request** on GitHub
   - Use the PR template (auto-populated from `.github/pull_request_template.md`)
   - Link related issues: `Closes #77, #79, #82, #84`
   - Provide a clear description of changes
   - Include testing notes

3. **Address review feedback**
   - Make requested changes
   - Push updates to the same branch
   - Respond to comments

4. **Merge** once approved
   - Use "Squash and merge" for single-commit PRs
   - Use "Create a merge commit" for multi-commit PRs with logical separation

## Commit Conventions

We follow **Conventional Commits** for clear, semantic commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, dependency, or tooling changes

### Scope

Optional. Indicates the area affected:
- `backend`, `frontend`, `contracts`, `python-service`
- `auth`, `vaccination`, `verify`, `analytics`
- `#77`, `#79` (issue numbers)

### Examples

```bash
git commit -m "feat(backend): add OpenAPI spec generation"
git commit -m "fix(#77): resolve swagger endpoint routing"
git commit -m "docs(#79): add contributor onboarding guide"
git commit -m "test(contracts): add mint_vaccination tests"
git commit -m "chore: update dependencies"
```

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to:

- Be respectful and inclusive
- Welcome diverse perspectives and experiences
- Focus on constructive feedback
- Respect confidentiality and privacy

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing opinions and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or intimidation
- Offensive comments related to personal characteristics
- Deliberate intimidation or threats
- Unwelcome sexual attention or advances
- Trolling, insulting, or derogatory comments

### Reporting Issues

If you witness or experience unacceptable behavior, please report it to the maintainers at [contact email]. All reports will be reviewed and investigated.

## Docker Base Image Pinning

### Why We Pin Docker Images

All Docker base images in this project use **pinned SHA256 digests** to ensure reproducible builds. This means:

- **Reproducibility**: Every build with the same Dockerfile will produce identical results
- **Security**: We avoid accidentally pulling updated images with potential vulnerabilities  
- **Stability**: Breaking changes in base images won't silently break our builds
- **Auditability**: We can track exactly which base image version was used in each build

### How Image Pinning Works

Each `FROM` statement includes both a tag and a SHA256 digest:

```dockerfile
FROM node:18.18.2-alpine@sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7
```

This format ensures the exact image is pulled, not just any image with the `18.18.2-alpine` tag.

### Pinned Images in This Project

#### Backend (Node.js)
- **Image**: `node:18.18.2-alpine`
- **Digest**: `sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7`
- **Location**: [backend/Dockerfile](backend/Dockerfile)

#### Frontend (Node.js + nginx)
- **Node Builder**: `node:18.18.2-alpine@sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7`
- **nginx Runtime**: `nginx:1.25.3-alpine@sha256:41edf44158e0046487e614e118e9d1f0e0614a95a0c8f8e1ad826e8a9fb02a80`
- **Location**: [frontend/Dockerfile](frontend/Dockerfile)

#### Python Service
- **Image**: `python:3.11.7-slim`
- **Digest**: `sha256:bae67dbbd3c2c9d94a3cf02c8a1cfc3c6f3c5d5e3d9b7195f8c0a06d09d4f5f2`
- **Location**: [python-service/Dockerfile](python-service/Dockerfile)

### Updating Base Image Versions

#### Automatic Updates via Renovate

We use [Renovate](https://www.whitesourcesoftware.com/free-developer-tools/renovate/) to automatically create pull requests for digest updates. Renovate will:

1. **Check daily** for new image digest versions
2. **Auto-merge** digest-only updates (backward compatible)
3. **Create PRs** for minor and major version updates (require manual review)
4. **Run on Monday mornings** (before 3am UTC) to avoid disrupting development

#### Manual Update Process

If you need to manually update a base image version:

1. **Identify the new image tag** you want to use (e.g., `node:20-alpine`)
2. **Find the digest** by running:
   ```bash
   docker pull node:20-alpine
   docker inspect node:20-alpine | grep Digest
   ```
   
   Or check [Docker Hub](https://hub.docker.com) for the specific image.

3. **Update the Dockerfile**:
   ```dockerfile
   FROM node:20-alpine@sha256:<paste-the-digest-here>
   ```

4. **Create a pull request** with changes to the affected Dockerfile(s)
5. **Include reasoning** in the PR description (e.g., security patches, feature requirements)

### Configuration Files

- **Renovate Config**: [renovate.json](renovate.json)
  - Configures which images Renovate monitors
  - Sets auto-merge policies
  - Defines update schedules

### Best Practices

1. **Never use untagged images** (`FROM python` is not allowed)
2. **Always include a digest** (`FROM python:3.11-slim@sha256:...`)
3. **Use specific version tags** (e.g., `node:18.18.2-alpine` rather than `node:18-alpine`)
4. **Document significant image updates** in commit messages and PRs
5. **Keep images updated** but review major changes carefully

### Troubleshooting Image Pinning

**Problem**: Build fails with "image not found" after pinning
- **Solution**: Verify the digest is correct by pulling the image manually

**Problem**: Different digest values on different machines
- **Solution**: This is expected - use the digest from your pinned FROM statement, not local system

**Problem**: Renovate is not creating PRs
- **Solution**: Check `renovate.json` configuration and ensure Renovate app is installed on the repository

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.
