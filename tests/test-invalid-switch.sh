#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project root directory (parent of tests)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Testing all valid command combinations..."
echo "----------------------------------------"

# Function to run command and check result
test_command() {
    echo -n "Testing: $1 ... "
    if [[ "$1" == *"--invalid-switch"* ]] || [[ "$1" == *"-x"* ]] || [[ "$1" == *"--not-a-command"* ]]; then
        # For invalid switches, we expect the command to fail
        if ! eval "$1" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
            echo "Command should have failed: $1"
        fi
    else
        # For valid commands, we expect them to succeed
        if eval "$1" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
            echo "Command failed: $1"
        fi
    fi
}

# Basic commands
test_command "node ./bin/cx.js -h --dry-run"
test_command "node ./bin/cx.js --help --dry-run"
test_command "node ./bin/cx.js -h --more --dry-run"
test_command "node ./bin/cx.js -v --dry-run"
test_command "node ./bin/cx.js --version --dry-run"

# Context generation with options
test_command "node ./bin/cx.js . --dry-run"
test_command "node ./bin/cx.js ./lib --dry-run"
test_command "node ./bin/cx.js ./lib ./bin --dry-run"
test_command "node ./bin/cx.js -s --dry-run"
test_command "node ./bin/cx.js --snap --dry-run"
test_command "node ./bin/cx.js -m 'test message' --dry-run"
test_command "node ./bin/cx.js --message 'test message' --dry-run"
test_command "node ./bin/cx.js -v --dry-run"
test_command "node ./bin/cx.js --verbose --dry-run"
test_command "node ./bin/cx.js --timeout 60 --dry-run"
test_command "node ./bin/cx.js --max-size 2 --dry-run"
test_command "node ./bin/cx.js --no-clipboard --dry-run"
test_command "node ./bin/cx.js -o --dry-run"
test_command "node ./bin/cx.js -t --dry-run"
test_command "node ./bin/cx.js --tree --dry-run"

# Combined options
test_command "node ./bin/cx.js -s -m 'test snapshot' --dry-run"
test_command "node ./bin/cx.js ./lib -t --dry-run"
test_command "node ./bin/cx.js ./lib ./bin -t --dry-run"
test_command "node ./bin/cx.js -s -v -m 'verbose snapshot' --dry-run"
test_command "node ./bin/cx.js -o --no-clipboard --dry-run"

# Commands
# test_command "node ./bin/cx.js configure"  # Skipping configure as it requires user input
test_command "node ./bin/cx.js show --dry-run"
test_command "node ./bin/cx.js clear --dry-run"
# test_command "node ./bin/cx.js clear-all"  # Skipping clear-all as it requires user confirmation

# Ignore commands
test_command "node ./bin/cx.js ignore show --dry-run"
test_command "node ./bin/cx.js ignore clear --dry-run"
test_command "node ./bin/cx.js ignore test --dry-run"
test_command "node ./bin/cx.js ignore add '*.log' --dry-run"

# Load cursor rules
# test_command "node ./bin/cx.js load-cursor-rules"  # Skipping as it requires user interaction

# Invalid combinations (these SHOULD fail and test should pass when they do)
echo -e "\nTesting invalid combinations..."
echo "----------------------------------------"
test_command "node ./bin/cx.js --invalid-switch --dry-run"
test_command "node ./bin/cx.js -x --dry-run"
test_command "node ./bin/cx.js --not-a-command --dry-run"

# Missing required values (these SHOULD fail)
echo -e "\nTesting missing required values..."
echo "----------------------------------------"
test_command "node ./bin/cx.js -s -m --dry-run" # Missing message value
test_command "node ./bin/cx.js --timeout --dry-run" # Missing timeout value

echo -e "\nTest complete!" 