# AICTX - AI Context Generator

CLI tool to generate context files from source code, for AI-assisted vibe coding.

![AICTX Brain](static/brain2.png)

## Test Status 🧪

[![Test Status](https://img.shields.io/badge/tests-11%20passed-brightgreen.svg)](TESTS.md)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](TESTS.md)

Last tested: 03/05/2025, 17:52 America/Los_Angeles


## Installation

```bash
npm install -g aictx
```
or if you need to reinstall the latest
```bash
npm install -g aictx@latest
```
## Quick Start

Navigate to your code base and run `cx ./ -m "my first context file"`

```bash
# Basic usage - generate context from current directory
cx ./

# Generate context with a message
cx ./ -m "Add authentication feature"

# Create a snapshot
cx ./ -s

# Create a snapshot with message
cx ./ -sm "Before refactoring"
# or
cx ./ -s -m "Before refactoring"

# Create a template
cx ./ -t "auth-feature"
# or with message
cx ./ -tm "Authentication feature template"
```

## Command Reference

### Basic Commands
- `cx ./` - Generate context from current directory
- `cx <path>` - Generate context from specified path
- `cx -h` - Show help
- `cx -h <category>` - Show help for specific category
- `cx --more` - Interactive help menu
- `cx --configure` - Configure settings
- `cx --show` - Show current configuration

### Output Options
- `--no-minimize` - Generate uncompressed output
- `--min` - Force generate minimized version (in addition to current output)

### Messages
- `-m "message"` - Add a message to the context file
  ```bash
  cx ./ -m "Adding new feature"
  ```

### Snapshots
- `-s, --snap` - Create a snapshot
- `-sm "message"` - Create a snapshot with message (combined flag)
- `-s -m "message"` - Create a snapshot with message (separate flags)
  ```bash
  cx ./ -sm "Before major update"
  # or
  cx ./ -s -m "Before major update"
  ```

### Templates
- `-t, --template` - Create a template
- `-tm "message"` - Create a template with message (combined flag)
- `-t -m "message"` - Create a template with message (separate flags)
  ```bash
  cx ./ -tm "Auth feature template"
  # or
  cx ./ -t -m "Auth feature template"
  ```

### Clear Commands
- `--clear` - Remove context files only
- `--clear -s` - Remove context files and snapshots
- `--clear -t` - Remove context files and templates
  ```bash
  # Clear only context files
  cx --clear

  # Clear context files and snapshots
  cx --clear -s

  # Clear context files and templates
  cx --clear -t
  ```

## File Naming Patterns

- Basic context: `context.txt`, `context-2.txt`, etc.
- With message: `feature-name.txt`, `feature-name-2.txt`, etc.
- Snapshots: `snap-[timestamp].txt` or `snap-message-[timestamp].txt`
- Templates: `template-[timestamp].txt` or `template-message-[timestamp].txt`

## Directory Structure

```
.
└── context/
    ├── code/      # Regular context files
    ├── snap/      # Snapshot files
    └── template/  # Template files
```

## Configuration

Use `cx --configure` to set up:
- Default minimization
- Auto-clipboard copy
- Default template directory
- Other preferences

View current configuration with `cx --show`.

## Help System

- `cx -h` - Basic help
- `cx -h <category>` - Category-specific help (e.g., `cx -h snapshots`)
- `cx --more` - Interactive help menu with detailed information

## Best Practices

1. Add the 'context' folder to your .gitignore file
2. Use meaningful messages for better organization
3. Create snapshots before major changes
4. Use templates for recurring patterns
5. Clear old context files regularly

## Examples

```bash
# Basic context generation
cx ./

# With message
cx ./ -m "Adding authentication"

# Create snapshot before refactoring
cx ./ -sm "Before refactoring auth"

# Create template for common setup
cx ./ -tm "Basic Express setup"

# Clear old files but keep snapshots
cx --clear

# Clear everything including snapshots
cx --clear -s
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT


---
*Last updated: 03/05/2025, 17:52 America/Los_Angeles*
