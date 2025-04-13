# AIContext - AI Context Generator

## Project Overview

AIContext is a CLI tool designed to generate context files from source code for AI-assisted development. It scans directories and files, collecting relevant code and creating comprehensive context files that can be used with AI tools.

## Core Functionality

- **Context Generation**: Creates context files from source code with intelligent file filtering
- **Snapshots**: Creates point-in-time snapshots of your codebase
- **Directory Tree**: Visualizes your project structure with customizable exclusions
- **Ignore Patterns**: Manages custom file/directory exclusions
- **Configuration**: Provides customizable settings for output and behavior
- **Screen Output**: Supports direct output to screen or pipes
- **Version Control**: Seamless integration with Git through .gitignore management

## Directory Structure

```
.
├── bin/
│   └── cx.js                 # Main CLI executable
├── lib/                      # Core functionality modules
│   ├── argumentParser.js     # Command-line argument parsing
│   ├── cleanupUtils.js      # Context file cleanup utilities
│   ├── configHandler.js     # Configuration management
│   ├── constants.js         # System constants and defaults
│   ├── contextGenerator.js  # Context generation engine
│   ├── directoryTree.js     # Tree visualization
│   ├── fileUtils.js         # File operations
│   ├── gitignoreHandler.js  # Git integration
│   ├── helpHandler.js       # Help system
│   ├── ignoreCommands.js    # Ignore pattern management
│   └── templateHandler.js   # Template processing
├── .aicontext/              # Project context directory (git-ignored)
│   ├── code/               # Generated context files
│   └── snapshot/          # Snapshot files
├── static/                  # Static assets
├── templates/               # System templates
└── tests/                   # Test suite
```

## Core Components

### CLI Interface (bin/cx.js)
- Main entry point for all commands
- Processes command-line arguments
- Routes to appropriate handlers
- Manages command execution flow

### Core Libraries

#### Context Generation
- `contextGenerator.js`: Main context generation engine
- `directoryTree.js`: Directory structure visualization
- `fileUtils.js`: File processing and filtering
- `templateHandler.js`: Template management

#### Configuration & Settings
- `configHandler.js`: Configuration management
- `constants.js`: System constants and defaults
- `argumentParser.js`: Command-line parsing
- `helpHandler.js`: Help documentation

#### Version Control Integration
- `gitignoreHandler.js`: Manages .gitignore integration
  - Automatically adds `.aicontext/` to .gitignore
  - Preserves existing patterns
  - Creates .gitignore if needed

#### Pattern Management
- `ignoreCommands.js`: Handles ignore pattern commands
- `cleanupUtils.js`: Context file cleanup
- `pathUtils.js`: Path manipulation utilities

## Command Structure

```bash
cx [path] [options]           # Generate context from path
cx ignore <command>           # Manage ignore patterns
cx -t                        # Show directory tree
cx -o                       # Output to screen
cx -h                      # Show help
```

## Version Control Integration

### .gitignore Management
The tool automatically manages Git integration:

```bash
# AI context files
.aicontext/
```

All context files are stored in `.aicontext/` and automatically ignored by Git.

## Configuration

Project configuration is stored in `config.json` with these defaults:
```json
{
  "maxFiles": 1000,
  "maxLines": 50000,
  "maxDepth": 10,
  "timeout": 30000,
  "maxFileSize": 1
}
```

## Development Guidelines

1. Follow the established module structure in `lib/`
2. Add tests for new functionality in `tests/`
3. Update documentation when adding features
4. Maintain backward compatibility
5. Use the ignore system for excluding files
6. Test with various project sizes and structures

## Key Components

### Main Executable
- `bin/cx.js`: Entry point for the CLI tool, handles command-line arguments and orchestrates the context generation process

### Core Libraries
- `lib/contextGenerator.js`: Main logic for generating context files
- `lib/configHandler.js`: Manages user configuration
- `lib/constants.js`: Defines constants like ignored directories and included file extensions
- `lib/fileUtils.js`: Utilities for file operations
- `lib/pathUtils.js`: Path manipulation utilities
- `lib/compressionHandler.js`: Handles file compression for minimized output
- `lib/gitignoreHandler.js`: Manages .gitignore patterns for context files
  - Creates .gitignore if it doesn't exist
  - Adds/updates patterns while preserving existing content
  - Selectively ignores only context-related directories
  - Ensures config and ignore files are version controlled
- `lib/cleanupUtils.js`: Utilities for cleaning up context files
- `lib/templateHandler.js`: Manages template creation and usage
- `lib/templateLoader.js`: Handles loading and importing templates into user projects
- `lib/menuHandler.js`: Interactive menu system
- `lib/helpHandler.js`: Help documentation system

### Configuration
- Global configuration stored in `~/.aictx/config.json`
- Default settings:
  - `autoClipboard`: Whether to automatically copy context to clipboard (default: false)
  - `minimize`: Whether to minimize output by default (default: true)
  - `createLatestFile`: Whether to create the latest context file (default: true)

## Command Line Interface

The tool is invoked using the `cx` command with various options:
- Basic usage: `cx ./`
- With message: `cx ./ -m "message"`
- Create snapshot: `cx ./ -s`
- Create template: `cx ./ -t "template-name"`
- Configure settings: `cx --configure`
- Show help: `cx -h` or `cx --help`
- Load templates: `cx --load`
- Screen output: `cx ./ -o` (outputs directly to screen instead of file)

## Latest Context Feature

Every time a new context file is generated (except for templates), the tool automatically:
1. Creates a copy of the context file at `./context/latest-context.txt`
2. This provides a consistent location to access the most recent context
3. Useful for integrations with AI tools that expect a fixed file path

## Template Loading Feature

The `--load` command allows users to import templates into their projects:
1. Shows a menu of available template categories (e.g., cursor rules)
2. Allows selection of specific templates within the category
3. Imports the selected template into the appropriate location (e.g., `.cursor/rules` directory)
4. For Cursor rules, files are imported with the `.mdc` extension (required for Cursor IDE)
5. Currently supports cursor rules templates for AI-assisted development

### Available Templates
- **General Rules**: Comprehensive coding best practices including:
  - Documentation standards
  - Detailed README documentation guidelines
  - Configuration management
  - Code quality practices
  - Version control recommendations

### File Existence Handling
When importing templates, the system checks if a file with the same name already exists:
1. If a file exists, the user is presented with options:
   - Override the existing file
   - Create a new file with a numbered suffix
   - Cancel the import operation
2. This prevents accidental overwrites and gives users control over their template imports
3. The numbered suffix approach (e.g., `general-2.mdc`) allows multiple versions of the same template

## Binary File Handling and Exclusion

AICTX automatically excludes binary files and build artifacts from context generation to ensure clean, relevant context files:

### Automatic Exclusions

- **Binary File Extensions**: Files with extensions like `.o`, `.obj`, `.exe`, `.dll`, `.so`, `.dylib`, `.class`, `.jar`, etc. are automatically excluded
- **Build Directories**: Common build directories like `target/`, `bin/`, `obj/`, `dist/`, `build/` are excluded
- **Rust-specific Artifacts**: Special handling for Rust build artifacts with patterns like `.rcgu.o` and `.d` files
- **Directory Structure Filtering**: The directory tree output is post-processed to remove any remaining references to binary files or build directories
- **.gitignore Support**: Automatically respects and follows patterns defined in your project's .gitignore file

### Custom Exclusion Patterns

Users can add custom exclusion patterns using the new subcommand structure:

```bash
# Add exclusion patterns
cx --ignore add "*.o"         # Exclude all .o files
cx --ignore add "target/**"   # Exclude Rust target directory
cx --ignore add "**/*.min.js" # Exclude minified JavaScript files

# View current exclusions
cx --ignore show

# Test current exclusions
cx --ignore test

# Clear all exclusions
cx --ignore clear
```

Exclusion patterns are stored in `.aicontext/ignore.json` in the current directory, allowing for project-specific exclusions.

### File Exclusion Priority

Files are excluded in the following order:
1. Binary file extensions
2. Build directories and critical paths (node_modules, etc.)
3. .gitignore patterns
4. User-defined patterns
5. Default ignored files and directories

This ensures that:
- Binary files are always excluded first for safety
- .gitignore patterns are respected
- User-defined patterns can override defaults when needed

### Viewing Current Exclusions

To view the current exclusion patterns:

```bash
cx --ignore show
```

### Implementation Details

The exclusion logic is implemented in multiple layers to ensure comprehensive filtering:

1. **Directory Traversal**: The `findFiles` function in `lib/fileUtils.js` skips ignored directories entirely
2. **File Filtering**: The `shouldProcessFile` function checks each file against multiple exclusion criteria
3. **Tree Command Filtering**: The directory structure output is filtered using both command-line arguments and post-processing
4. **Custom Pattern Matching**: User-defined patterns are applied using the `minimatch` library for glob pattern matching
5. **Local Exclusions**: Project-specific exclusions are stored in `.aicontext/ignore.json` in the project directory
6. **Always Excluded Directories**: Critical directories like `node_modules`, `dist`, and `.git` are always excluded regardless of custom settings

### Testing Binary Exclusions

The test suite includes specific tests to verify that binary files and build directories are properly excluded:

- Creates mock binary files and build directories
- Verifies that they are excluded from the generated context
- Ensures that legitimate source files are still included

## Development Status

The project is functional and includes comprehensive test coverage. Future enhancements may include:
- Additional output formats
- Integration with more AI tools
- Enhanced template management
- Performance optimizations for large codebases

## Dependencies

- Node.js (>=14.0.0)
- clipboardy: For clipboard operations

## Maintenance Notes

When making changes to the codebase:
1. Ensure all new configuration options are added to the config.json structure
2. Update help documentation when adding new features
3. Maintain backward compatibility with existing context files
4. Add appropriate tests for new functionality
5. When modifying exclusion logic, ensure both the file filtering and directory structure output are updated
6. Test with projects containing binary files (especially Rust projects with target/ directories)

## Version Control Integration

The tool is designed to work seamlessly with version control systems:

### Gitignore Management
- Automatically manages .gitignore patterns for context files
- Ignores the entire `.aicontext/` directory:
  ```bash
  # AI context files
  .aicontext/
  ```
- Preserves existing .gitignore content when adding patterns
- Creates new .gitignore file if none exists

### Directory Structure
- `.aicontext/`: Contains all AI context related files and is ignored by git
  - `code/`: Generated context files
  - `snapshot/`: Point-in-time snapshots
  - `config.json`: Project-specific settings
  - `ignore.json`: Custom ignore patterns

Note: Since the entire `.aicontext/` directory is ignored by git, you'll need to manually share any configuration or ignore patterns with your team if needed.

### Version Controlled Files
- `.aicontext/config.json`: Project-specific settings
- `.aicontext/ignore.json`: Custom ignore patterns
- These files can be shared across the team via version control

### Ignored Files
- `.aicontext/code/`: Generated context files
- `.aicontext/snapshot/`: Point-in-time snapshots
- These directories contain generated content that should not be committed 