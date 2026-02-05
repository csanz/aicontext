# AIContext CLI Reference

Complete command reference for the `cx` CLI tool.

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Commands](#basic-commands)
- [Output Options](#output-options)
- [Output Formats](#output-formats)
- [Incremental Mode](#incremental-mode)
- [File Filtering](#file-filtering)
  - [Ignore Patterns](#ignore-patterns)
  - [Include Patterns](#include-patterns)
- [Snapshots](#snapshots)
- [Configuration](#configuration)
- [Advanced Options](#advanced-options)

---

## Quick Start

```bash
# Install globally
npm install -g ai-context

# Generate context from current directory
cx

# Generate from specific directory
cx ./src

# Generate with a message
cx -m "feature update"
```

---

## Basic Commands

| Command | Description |
|---------|-------------|
| `cx` | Generate context from current directory |
| `cx <path>` | Generate context from specific path |
| `cx <path1> <path2>` | Generate context from multiple paths |
| `cx -h` | Show basic help |
| `cx -h --more` | Show detailed help |
| `cx -v` | Show version |

### Examples

```bash
cx                              # Current directory
cx ./src                        # Specific directory
cx ./lib ./src/main.js          # Multiple paths
cx ./src -m "auth api"          # With descriptive message
```

---

## Output Options

| Option | Description |
|--------|-------------|
| `-o` | Output to screen (stdout) instead of file |
| `-t, --tree` | Display directory tree only |
| `--no-clipboard` | Skip copying to clipboard |
| `--verbose` | Show detailed progress |

### Examples

```bash
cx -o                           # Print to screen
cx -o | head -100               # Pipe to other commands
cx -t                           # Show tree only
cx -t ./src ./lib               # Show trees for multiple paths
cx --verbose                    # See detailed progress
```

---

## Output Formats

Generate context in different formats using `-f` or `--format`.

| Format | Extension | Description |
|--------|-----------|-------------|
| `text` | `.txt` | Plain text (default) |
| `md` | `.md` | Markdown with tables and code blocks |
| `json` | `.json` | Structured JSON for programmatic use |
| `xml` | `.xml` | XML format with CDATA sections |

### Examples

```bash
cx -f text                      # Plain text (default)
cx -f md                        # Markdown format
cx -f json                      # JSON format
cx -f xml                       # XML format
cx ./src -f md -m "docs"        # Markdown with message
```

### Format Details

**Markdown (`-f md`)**
- Tables for metadata and file info
- Fenced code blocks with syntax highlighting
- Clean, readable structure

**JSON (`-f json`)**
- Structured data with metadata
- File array with content and stats
- Ideal for programmatic processing

**XML (`-f xml`)**
- Valid XML with proper encoding
- CDATA sections for code content
- Supports XML-based toolchains

---

## Incremental Mode

Only include files that changed since a specific time or git reference.

| Option | Description |
|--------|-------------|
| `--since <time>` | Files changed since time expression |
| `--git-diff <ref>` | Files changed vs git reference |
| `--changed` | Files changed since last `cx` run |

### Time Expressions

| Expression | Meaning |
|------------|---------|
| `30m` | 30 minutes ago |
| `2h` | 2 hours ago |
| `1d` | 1 day ago |
| `1w` | 1 week ago |
| `2024-01-15` | Since specific date |

### Examples

```bash
cx --since 2h                   # Changed in last 2 hours
cx --since 1d                   # Changed in last day
cx --since 2024-01-15           # Changed since date
cx --git-diff main              # Changed vs main branch
cx --git-diff HEAD~5            # Changed in last 5 commits
cx --changed                    # Changed since last cx run
```

### Use Cases

- **Daily standups**: `cx --since 1d` - What changed today
- **PR reviews**: `cx --git-diff main` - Changes in feature branch
- **Quick updates**: `cx --changed` - Only new changes

---

## File Filtering

### Ignore Patterns

Exclude files matching glob patterns.

| Command | Description |
|---------|-------------|
| `cx ignore <pattern>` | Add ignore pattern |
| `cx ignore rm <pattern>` | Remove pattern |
| `cx ignore show` | List all patterns |
| `cx ignore clear` | Remove all patterns |
| `cx ignore test` | Preview excluded files |

### Examples

```bash
cx ignore "*.log"               # Exclude log files
cx ignore "dist/**"             # Exclude dist directory
cx ignore "**/*.test.js"        # Exclude test files
cx ignore rm "*.log"            # Remove pattern
cx ignore show                  # List patterns
cx ignore test                  # Preview exclusions
```

### Include Patterns

Whitelist files - only matching files are processed.

| Command | Description |
|---------|-------------|
| `cx include <pattern>` | Add include pattern |
| `cx include rm <pattern>` | Remove pattern |
| `cx include show` | List all patterns |
| `cx include clear` | Remove all patterns |

### Examples

```bash
cx include "src/**/*.ts"        # Only TypeScript in src/
cx include "*.js"               # Only JavaScript files
cx include "lib/**"             # Only files in lib/
cx include rm "*.js"            # Remove pattern
cx include show                 # List patterns
cx include clear                # Reset to include all
```

### Pattern Syntax

| Pattern | Matches |
|---------|---------|
| `*.js` | All .js files |
| `**/*.ts` | All .ts files (recursive) |
| `src/**` | Everything in src/ |
| `*.{js,ts}` | .js and .ts files |
| `!*.test.js` | Negation (exclude) |

### How Filtering Works

1. **Include patterns** act as a whitelist
2. **Ignore patterns** exclude from the whitelist
3. Files must match include AND not match ignore
4. Empty include list = include all files

---

## Snapshots

Create point-in-time captures of your codebase.

| Option | Description |
|--------|-------------|
| `-s, --snap` | Create a snapshot |

### Examples

```bash
cx -s                           # Create snapshot
cx -s -m "before refactor"      # Snapshot with message
cx -s -f json                   # Snapshot in JSON format
```

### Storage

- Regular context: `.aicontext/code/`
- Snapshots: `.aicontext/snapshots/`
- Latest file: `.aicontext/latest-context.txt`

---

## Configuration

### Commands

| Command | Description |
|---------|-------------|
| `cx configure` | Interactive configuration |
| `cx show` | Show current settings |

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Auto-clipboard | Copy to clipboard automatically | Off |
| Timeout | File search timeout | 30s |
| Max file size | Maximum file size to include | 1MB |

### Examples

```bash
cx configure                    # Interactive setup
cx show                         # View current config
```

### Configuration Files

| File | Purpose |
|------|---------|
| `~/.aicontext/config.json` | Global settings |
| `.aicontext/ignore.json` | Project patterns |

---

## Advanced Options

| Option | Description | Default |
|--------|-------------|---------|
| `--timeout <sec>` | File search timeout | 30 |
| `--max-size <MB>` | Max file size | 1 |
| `--clear` | Remove generated context files | - |
| `--clear-all` | Remove ALL context files (with confirmation) | - |

### Examples

```bash
cx --timeout 60                 # Longer timeout for large projects
cx --max-size 5                 # Include larger files
cx --clear                      # Clean up code/ directory
cx --clear-all                  # Clean up everything
```

---

## Default Exclusions

These are automatically excluded:

- **Directories**: `node_modules`, `.git`, `dist`, `build`, `coverage`, etc.
- **Files**: Lock files, OS files (`.DS_Store`), IDE configs
- **Binary files**: Images, executables, archives, media files
- **Large files**: Files exceeding max-size limit

---

## Tips

1. **Add `.aicontext` to `.gitignore`** to keep generated files local
2. **Use snapshots** before major refactors
3. **Combine filters**: `cx --since 1d -f md` for daily markdown reports
4. **Use include patterns** for focused context on specific file types
5. **Use `cx -o | head`** to preview output before generating

---

## Quick Reference Card

```bash
# Core
cx                      # Generate from current dir
cx ./src                # Generate from path
cx -m "message"         # Add filename message

# Output
cx -o                   # To screen
cx -t                   # Tree only
cx -f md                # Markdown format
cx -f json              # JSON format

# Incremental
cx --since 2h           # Last 2 hours
cx --git-diff main      # Vs main branch
cx --changed            # Since last run

# Filtering
cx ignore "*.log"       # Exclude pattern
cx include "*.ts"       # Include only pattern
cx ignore show          # List ignore patterns
cx include show         # List include patterns

# Snapshots
cx -s                   # Create snapshot
cx -s -m "backup"       # With message

# Config
cx configure            # Setup
cx show                 # View settings
```
