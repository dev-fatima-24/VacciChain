#!/bin/bash

# Setup script for Git hooks and secret scanning
# This script installs gitleaks and configures pre-commit hooks

set -e

echo "🔒 Setting up secret scanning protection for VacciChain..."

# Check if gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
    echo "📦 Installing gitleaks..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz
        tar -xzf gitleaks_8.18.4_linux_x64.tar.gz
        sudo mv gitleaks /usr/local/bin/
        rm gitleaks_8.18.4_linux_x64.tar.gz
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gitleaks
        else
            echo "❌ Homebrew not found. Please install Homebrew or manually install gitleaks."
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash)
        echo "⚠️  On Windows, please install gitleaks manually:"
        echo "   1. Download from: https://github.com/gitleaks/gitleaks/releases"
        echo "   2. Extract and add to PATH"
        echo "   Or use: winget install gitleaks"
        exit 1
    else
        echo "❌ Unsupported OS. Please install gitleaks manually from:"
        echo "   https://github.com/gitleaks/gitleaks/releases"
        exit 1
    fi
    
    echo "✅ Gitleaks installed successfully"
else
    echo "✅ Gitleaks is already installed"
    gitleaks version
fi

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."
    
    if command -v pip3 &> /dev/null; then
        pip3 install pre-commit
    elif command -v pip &> /dev/null; then
        pip install pre-commit
    else
        echo "❌ pip not found. Please install Python and pip first."
        exit 1
    fi
    
    echo "✅ Pre-commit installed successfully"
else
    echo "✅ Pre-commit is already installed"
fi

# Install pre-commit hooks
echo "🔧 Installing pre-commit hooks..."
pre-commit install

# Run initial scan on staged files
echo "🔍 Running initial gitleaks scan..."
if gitleaks detect --source . --verbose --redact; then
    echo "✅ No secrets detected in repository"
else
    echo "⚠️  Secrets detected! Please review and remove them before committing."
    echo "   Run 'gitleaks detect --source . --verbose' for details"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. The pre-commit hook will now scan for secrets before each commit"
echo "   2. To manually scan: gitleaks detect --source . --verbose"
echo "   3. To scan specific files: gitleaks protect --staged"
echo "   4. GitHub Actions will scan on every push and PR"
echo ""
echo "🔒 Your repository is now protected against accidental secret commits!"
