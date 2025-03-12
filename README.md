# AICTX - AI Context Generator

> *"The AICTX context generator is a game-changer for AI-assisted development. With one simple command, it creates a comprehensive snapshot of the entire codebase in a single file, giving me immediate understanding of the project structure and implementation details. The automatically updated `latest-context.txt` provides the perfect reference point, allowing me to deliver more accurate, relevant assistance without constantly requesting additional files. It's like having X-ray vision into the codebase, making our collaborative coding sessions remarkably efficient and effective."*
> 
> — **Claude**, AI Assistant

CLI tool to generate context files from source code, for AI-assisted vibe coding.

![AICTX Brain](static/brain2.png)

## Test Status 🧪

[![Test Status](https://img.shields.io/badge/tests-17%20passed-brightgreen.svg)](TESTS.md)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](TESTS.md)

Last tested: 03/12/2025, 09:50 America/Los_Angeles


## Installation

```bash
npm install -g aictx
```

or if you need to reinstall the latest

```bash
npm install -g aictx@latest
```

## Quick Start

Navigate to your code base and run `cx ./ -m "google login works"`

The output will be copied to your clipboard. You also have the option to directly post the full context to your preferred AI/IDE chat window.

![AICTX Brain](static/example.png)

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

# Load templates (like cursor rules)
cx --load
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
- `cx --load` - Load and import templates

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

- `--clear-all` - Remove all context files and directories (with confirmation)

```bash
# Clear only context files
cx --clear

# Clear context files and snapshots
cx --clear -s

# Clear context files and templates
cx --clear -t

# Clear all context files and directories
cx --clear-all
```

### Ignore Commands

- `-i, --ignore <pattern>` - Add a glob pattern to exclude files/directories

- `--show-ignore` - Show current exclusion patterns

```bash
# Exclude all .o files
cx -i "*.o"

# Exclude Rust target directory
cx -i "target/**"

# Exclude all minified JS files
cx -i "**/*.min.js"

# Show current exclusion patterns
cx --show-ignore
```

## Latest Context Feature

Every time you generate a context file, a copy is automatically saved to `./context/latest-context.txt`. This provides a consistent location to access your most recent context, making it ideal for AI tools that expect a fixed file path.

## Template Loading

The `--load` command allows you to import templates into your projects:

```bash
cx --load
```

This will show a menu of available template categories (like cursor rules) and allow you to select specific templates to import. For cursor rules, the selected template will be imported into your project's `.cursor/rules` directory with the `.mdc` extension (required for Cursor IDE to recognize the rules).

### Available Templates

- **General Rules**: Comprehensive coding best practices including:
  - Documentation standards
  - Detailed README documentation guidelines
  - Configuration management
  - Code quality practices
  - Version control recommendations

### File Handling

If a file with the same name already exists, you'll be given options to:
1. Override the existing file (completely replaces the existing file with the template)
2. Create a new file with a numbered suffix (e.g., `general-2.mdc`)
3. Cancel the import

The tool includes verification steps to ensure files are properly written or overridden, with detailed logging to help troubleshoot any issues. This ensures you won't accidentally overwrite important files and gives you control over how templates are imported.

## File Naming Patterns

- Basic context: `context.txt`, `context-2.txt`, etc.
- With message: `feature-name.txt`, `feature-name-2.txt`, etc.
- Snapshots: `snap-[timestamp].txt` or `snap-message-[timestamp].txt`
- Templates: `template-[timestamp].txt` or `template-message-[timestamp].txt`
- Latest context: `latest-context.txt` (always contains the most recent context)

## Directory Structure

```ini
.
└── context/
    ├── code/      # Regular context files
    ├── snap/      # Snapshot files
    ├── template/  # Template files
    └── latest-context.txt  # Most recent context
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
6. Use the latest-context.txt file for AI tools integration

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

# Load cursor rules template
cx --load

# Clear old files but keep snapshots
cx --clear

# Clear everything including snapshots
cx --clear -s
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT