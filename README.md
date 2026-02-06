<div align="center">
  <img src="static/cx-logo.png" alt="AIContext Logo" width="600" height="auto">
  <h3>Context Management for AI-Assisted Development</h3>
</div>

[![Tests](https://img.shields.io/badge/tests-44%20passed-brightgreen.svg)](TESTS.md)
[![npm](https://img.shields.io/badge/npm-v1.6.1-blue)](https://www.npmjs.com/package/ai-context)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Test Status 🧪

[![Test Status](https://img.shields.io/badge/tests-44%20passed-brightgreen.svg)](TESTS.md)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](TESTS.md)
[![npm](https://img.shields.io/badge/npm-v1.6.1-blue)](https://www.npmjs.com/package/aictx)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)

Last tested: 02/05/2026, 23:18 America/Los_Angeles

## What is AIContext?

A CLI tool that generates structured context from your codebase for AI tools. Scans your project, filters out noise, and creates formatted output ready for Claude, ChatGPT, or any AI assistant.

<div align="center">
  <img src="static/cx-example.gif" alt="AI Context Example" width="600" height="auto">
</div>

## Quick Start

```bash
npm install -g ai-context
cx
```

## Core Commands

```bash
cx                      # Generate from current directory
cx ./src                # Generate from path
cx -m "feature"         # Add filename message
cx -o                   # Output to screen
cx -t                   # Tree only
cx -s                   # Create snapshot
```

## Output Formats

```bash
cx -f text              # Plain text (default)
cx -f md                # Markdown
cx -f json              # JSON
cx -f xml               # XML
```

## Incremental Mode

Only include changed files:

```bash
cx --since 2h           # Last 2 hours
cx --since 1d           # Last day
cx --git-diff main      # vs main branch
cx --changed            # Since last run
```

## File Filtering

```bash
# Exclude patterns
cx ignore "*.log"
cx ignore show

# Include patterns (whitelist)
cx include "src/**/*.ts"
cx include show
```

## Configuration

```bash
cx configure            # Setup
cx show                 # View settings
```

## Full Documentation

**[COMMANDS.md](COMMANDS.md)** - Complete CLI reference with all options, examples, and patterns.

## Help

```bash
cx -h                   # Basic help
cx -h --more            # Detailed help
```

- [Updates](UPDATES.md) - Version history
- [Issues](https://github.com/csanz/aicontext/issues) - Report bugs
- [Discussions](https://github.com/csanz/aicontext/discussions) - Questions

## License

MIT
