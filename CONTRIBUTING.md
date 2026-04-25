# Contributing to VacciChain

## Overview

Thank you for your interest in contributing to VacciChain! This document provides guidelines and instructions for contributing to our project.

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

## General Contributing Guidelines

- Follow the existing code style and conventions
- Write clear commit messages
- Test your changes before submitting a PR
- Update tests and documentation as needed
- Be respectful and inclusive in all interactions

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.
