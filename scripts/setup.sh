#!/bin/bash
# Tenx MCP Assessment Setup Script
echo "Setting up Tenx MCP Assessment..."

# 1. Create project structure
mkdir -p .github docs scripts config examples

# 2. Create initial files
echo "# AI Assistant Rules" > .github/copilot-instructions.md
echo "# Project Report" > docs/REPORT.md

# 3. Initialize git (if not already)
if [ ! -d ".git" ]; then
    git init
    echo "# Tenx MCP Assessment" > README.md
fi

echo "Setup complete!"