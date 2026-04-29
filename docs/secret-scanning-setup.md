# Secret Scanning Setup Guide

## Overview

VacciChain uses [Gitleaks](https://github.com/gitleaks/gitleaks) to prevent accidental commits of sensitive credentials including:
- Stellar secret keys (S...)
- JWT secrets
- Private keys
- API tokens
- Soroban secrets

## Protection Layers

### 1. Pre-commit Hook (Local)
Blocks commits containing secrets before they reach the repository.

### 2. GitHub Actions (CI/CD)
Scans every push and pull request to main/develop branches.

## Setup Instructions

### For Linux/macOS Users

```bash
# Run the setup script
chmod +x scripts/setup-git-hooks.sh
./scripts/setup-git-hooks.sh
```

### For Windows Users

```powershell
# Run the PowerShell script
.\scripts\setup-git-hooks.ps1
```

### Manual Setup

If the automated scripts don't work:

1. **Install Gitleaks**
   - **macOS**: `brew install gitleaks`
   - **Linux**: Download from [releases](https://github.com/gitleaks/gitleaks/releases)
   - **Windows**: `winget install gitleaks` or download from releases

2. **Install pre-commit**
   ```bash
   pip install pre-commit
   ```

3. **Install hooks**
   ```bash
   pre-commit install
   ```

## Usage

### Manual Scanning

Scan entire repository:
```bash
gitleaks detect --source . --verbose
```

Scan staged files only:
```bash
gitleaks protect --staged
```

Scan with redacted output:
```bash
gitleaks detect --source . --verbose --redact
```

### Historical Scan

To scan all historical commits:
```bash
gitleaks detect --source . --log-opts="--all" --verbose
```

## Configuration

The `.gitleaks.toml` file contains:
- Custom rules for VacciChain-specific secrets
- Allowlist for false positives (example files, tests)
- Patterns for Stellar keys, JWT secrets, API keys

## Handling False Positives

If gitleaks flags a false positive:

1. **Verify it's not a real secret**
2. **Add to allowlist** in `.gitleaks.toml`:
   ```toml
   [allowlist]
   paths = [
     '''path/to/file\.ext$'''
   ]
   ```

## Bypassing (Emergency Only)

⚠️ **Not recommended** - Only use in emergencies:

```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "message"
```

## CI/CD Integration

GitHub Actions workflow (`.github/workflows/gitleaks.yml`) runs on:
- Every push to main/develop
- Every pull request to main/develop

Failed scans will:
- Block the PR from merging
- Upload a detailed report as an artifact

## Troubleshooting

### Pre-commit hook not running
```bash
pre-commit install
```

### Gitleaks not found
Ensure gitleaks is in your PATH:
```bash
which gitleaks  # Linux/macOS
where gitleaks  # Windows
```

### False positive in CI
Update `.gitleaks.toml` and push the changes.

## Best Practices

1. **Never commit real secrets** - Use environment variables
2. **Use `.env.example`** for template files
3. **Rotate secrets** if accidentally committed
4. **Run manual scans** periodically
5. **Keep gitleaks updated** for latest detection rules

## Support

For issues or questions:
- Check [Gitleaks documentation](https://github.com/gitleaks/gitleaks)
- Review `.gitleaks.toml` configuration
- Contact the security team
